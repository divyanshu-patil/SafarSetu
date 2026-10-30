import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { Icon, fx, useScrollLock } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

// invisible padding around every row (offset by negative margins) so a lifted row reads as a card, not a clipped strip
const PAD_X = 12, PAD_Y = 8;

interface Drag { id: string; from: number; over: number; h: number }

/**
 * Drag-to-reorder list. Each row gets a grip handle; rows between the dragged row and its target slide aside
 * while dragging, and the order is committed on release. Rows may have different heights (e.g. an expanded stop).
 */
export function ReorderList<T extends { id: string }>({ items, onReorder, renderRow }: { items: T[]; onReorder: (from: number, to: number) => void; renderRow: (item: T, index: number, handle: ReactNode, dragging: boolean) => ReactNode }) {
  const [active, setActive] = useState<Drag | null>(null);
  const [committing, setCommitting] = useState(false);
  const layouts = useRef<Record<string, { y: number; h: number }>>({});
  const drag = useRef({ y: 0, h: 0, from: 0, over: 0, live: false });
  const ty = useSharedValue(0);
  const lockScroll = useScrollLock();

  const begin = (id: string) => {
    const from = items.findIndex((i) => i.id === id);
    const l = layouts.current[id];
    if (from < 0 || !l) return;
    drag.current = { y: l.y, h: l.h, from, over: from, live: true };
    ty.value = 0;
    lockScroll(true); // the page must not scroll under the finger while a row is being moved
    setActive({ id, from, over: from, h: l.h });
  };
  const move = (dy: number) => {
    if (!drag.current.live) return;
    // keep the row inside the list: it can't be dragged over the fields above or below it
    const all = Object.values(layouts.current);
    const top = Math.min(...all.map((l) => l.y)), bottom = Math.max(...all.map((l) => l.y + l.h));
    dy = Math.max(top - drag.current.y, Math.min(bottom - drag.current.y - drag.current.h, dy));
    ty.value = dy;
    const centre = drag.current.y + drag.current.h / 2 + dy;
    let over = items.findIndex((i) => { const l = layouts.current[i.id]; return !!l && centre < l.y + l.h; });
    if (over < 0) over = items.length - 1;
    if (over !== drag.current.over) { drag.current.over = over; setActive((a) => (a ? { ...a, over } : a)); }
  };
  const commit = (from: number, over: number) => {
    setCommitting(true); // rows jump to their new slots with no layout animation: they are already drawn there
    if (from !== over) onReorder(from, over);
    setActive(null);
    lockScroll(false);
    ty.value = 0;
    setTimeout(() => setCommitting(false), 80);
  };
  const end = () => {
    if (!drag.current.live) return; // release and terminate can both fire: settle once
    drag.current.live = false;
    const { from, over } = drag.current;
    const a = layouts.current[items[from]?.id ?? ''], b = layouts.current[items[over]?.id ?? ''];
    if (!a || !b) return commit(from, from);
    const offset = over > from ? b.y + b.h - (a.y + a.h) : b.y - a.y; // slide into the slot, then commit
    ty.value = withTiming(offset, { duration: 140 });
    setTimeout(() => commit(from, over), 160);
  };

  return (
    <View>
      {items.map((item, index) => (
        <Row key={item.id} id={item.id} index={index} active={active} committing={committing} ty={ty}
          onLayout={(y, h) => { layouts.current[item.id] = { y: y + PAD_Y, h: h - PAD_Y }; }} onBegin={begin} onMove={move} onEnd={end}>
          {(handle, dragging) => renderRow(item, index, handle, dragging)}
        </Row>
      ))}
    </View>
  );
}

function Row({ id, index, active, committing, ty, onLayout, onBegin, onMove, onEnd, children }: {
  id: string; index: number; active: Drag | null; committing: boolean; ty: SharedValue<number>;
  onLayout: (y: number, h: number) => void; onBegin: (id: string) => void; onMove: (dy: number) => void; onEnd: () => void;
  children: (handle: ReactNode, dragging: boolean) => ReactNode;
}) {
  const t = useTheme();
  const dragging = active?.id === id;
  // rows between the dragged row and its target make room for it
  const shift = !active || dragging ? 0 : index > active.from && index <= active.over ? -active.h : index < active.from && index >= active.over ? active.h : 0;
  const sh = useSharedValue(0);
  // sliding aside animates; once the drop is committed the row's real position has already moved, so the offset must vanish instantly
  useEffect(() => { sh.value = active ? withTiming(shift, { duration: 160 }) : 0; }, [shift, active, sh]);

  const latest = useRef({ onBegin, onMove, onEnd });
  latest.current = { onBegin, onMove, onEnd };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false, // keep the gesture: the ScrollView must not steal it mid-drag
    onPanResponderGrant: () => latest.current.onBegin(id),
    onPanResponderMove: (_, g) => latest.current.onMove(g.dy),
    onPanResponderRelease: () => latest.current.onEnd(),
    onPanResponderTerminate: () => latest.current.onEnd(),
  })).current;

  const style = useAnimatedStyle(() => (dragging
    ? { transform: [{ translateY: ty.value }], zIndex: 10, shadowColor: '#0e0f0c', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }
    : { transform: [{ translateY: sh.value }], zIndex: 0, shadowOpacity: 0, shadowRadius: 0, elevation: 0 })); // reset the shadow explicitly: Reanimated doesn't clear props that drop out of the style

  const handle = (
    <View {...pan.panHandlers} accessibilityLabel="Drag to reorder" accessibilityRole="adjustable" hitSlop={8} style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="reorder-two" size={22} color={dragging ? t.brand : t.textSecondary} />
    </View>
  );

  return (
    <Animated.View onLayout={(e) => onLayout(e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
      entering={fx.in()} exiting={fx.out} layout={committing || active ? undefined : fx.layout}
      style={[{ flexDirection: 'row', gap: 16, paddingHorizontal: PAD_X, marginHorizontal: -PAD_X, paddingTop: PAD_Y, marginTop: -PAD_Y, borderRadius: 18, backgroundColor: dragging ? t.background : undefined }, style]}>
      {children(handle, dragging)}
    </Animated.View>
  );
}
