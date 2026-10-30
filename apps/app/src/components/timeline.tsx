import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { fmtDuration, fmtTime, isTrivialMove, type Entry, type Leg, type Move, type Plan, type Visit } from '@repo/core';

import { Icon, Txt, fx, type IconName } from '@/components/ui';
import { Font, ModeColor, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

const MODE_ICON: Record<string, IconName> = { walk: 'walk', metro: 'subway', train: 'train', bus: 'bus', cab: 'car' };

/** Small tinted pill: the unit of scannable detail (fare, walk, duration, delay). */
function Pill({ icon, text, color, strong }: { icon?: IconName; text: string; color: string; strong?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '1f' }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <Txt v="sub" style={{ color, fontFamily: strong ? Font.bold : Font.semibold, fontSize: 12, lineHeight: 16 }}>{text}</Txt>
    </View>
  );
}
const FARE = '#15803d'; // money is always this green
const WALK = '#475569'; // walking is always this slate

// "PMPML 324 Hinjawadi Maan Phase 3–Bhosari" → badge "324", rest "Hinjawadi Maan Phase 3–Bhosari"
function splitRoute(name: string, mode: string) {
  const m = mode === 'bus' && name.match(/^PMPML\s+(\S+)\s+(.*)$/);
  return m ? { badge: m[1]!, rest: m[2]! } : { badge: name.replace(/ Line$/, ''), rest: '' };
}

function LegRow({ l }: { l: Leg }) {
  const { t } = useSettings();
  if (l.kind === 'walk') {
    const mins = Math.max(1, Math.round(l.arriveMin - l.departMin));
    return (
      <View style={styles.leg}>
        <View style={[styles.ic, { backgroundColor: WALK + '1f' }]}><Icon name="walk" size={14} color={WALK} /></View>
        <Pill text={`${mins} ${t('min')}`} color={WALK} strong />
        <Txt v="sub" style={{ flexShrink: 1 }} numberOfLines={1}>{Math.round(l.distM)} m · {l.to.name ?? ''}</Txt>
      </View>
    );
  }
  if (l.kind === 'cab') {
    return (
      <View style={styles.leg}>
        <View style={[styles.ic, { backgroundColor: ModeColor.cab + '1f' }]}><Icon name="car" size={14} color={ModeColor.cab} /></View>
        <Txt style={{ fontFamily: Font.medium, flex: 1 }}>{t('cab')} · {fmtTime(l.departMin)} → {fmtTime(l.arriveMin)}</Txt>
        <Pill text={`₹${l.fare}`} color={FARE} strong />
      </View>
    );
  }
  const { badge, rest } = splitRoute(l.routeName, l.mode);
  return (
    <View style={[styles.leg, { alignItems: 'flex-start' }]}>
      <View style={[styles.ic, { backgroundColor: l.color + '1f' }]}><Icon name={MODE_ICON[l.mode] ?? 'ellipse'} size={14} color={l.color} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: l.color }]}><Txt v="sub" style={{ color: '#fff', fontFamily: Font.bold, lineHeight: 16 }}>{badge}</Txt></View>
          {rest ? <Txt v="sub" style={{ flexShrink: 1 }} numberOfLines={1}>{rest}</Txt> : null}
          <View style={{ flex: 1 }} />
          {l.fare ? <Pill text={`₹${l.fare}`} color={FARE} strong /> : null}
        </View>
        <Txt style={{ fontFamily: Font.semibold }} numberOfLines={2}>{fmtTime(l.departMin)} {l.from.name}<Txt v="sub">  →  </Txt>{fmtTime(l.arriveMin)} {l.to.name}</Txt>
        <View style={styles.row}>
          <Pill icon="time-outline" text={fmtDuration(l.arriveMin - l.departMin)} color="#64748b" />
          <Pill text={`${l.stops.length - 1} ${t('stops')}`} color="#64748b" />
          {l.delayMin > 0 && <Pill icon="alert-circle" text={`+${Math.round(l.delayMin)} ${t('min')}`} color="#cb272f" strong />}
        </View>
      </View>
    </View>
  );
}

function MoveRow({ m, now }: { m: Move; now?: number }) {
  const th = useTheme();
  const { t } = useSettings();
  const active = now !== undefined && now >= m.departMin && now < m.arriveMin;
  const p = m.confidence ? Math.round(m.confidence.pOnTime * 100) : null;
  const pc = p === null ? th.text : p >= 90 ? '#15803d' : p >= 80 ? '#a16207' : '#cb272f';
  const walkMin = Math.round(m.itinerary.legs.reduce((a, l) => a + (l.kind === 'walk' ? l.arriveMin - l.departMin : 0), 0));
  return (
    <View style={[styles.move, { borderLeftColor: active ? th.accent : th.border, borderLeftWidth: active ? 3 : 1 }]}>
      <Txt style={{ fontFamily: Font.bold, fontSize: 17 }}>{fmtTime(m.departMin)}<Txt v="sub">  →  </Txt>{fmtTime(m.arriveMin)}</Txt>
      <View style={styles.row}>
        <Pill icon="time-outline" text={fmtDuration(m.arriveMin - m.departMin)} color="#64748b" strong />
        {m.itinerary.fare ? <Pill icon="cash-outline" text={`₹${m.itinerary.fare}`} color={FARE} strong /> : null}
        {walkMin > 0 && <Pill icon="walk" text={`${walkMin} ${t('min')}`} color={WALK} strong />}
        {p !== null && <Pill icon={p >= 80 ? 'shield-checkmark' : 'alert-circle'} text={`${p}% ${t('onTime')}`} color={pc} strong />}
      </View>
      {m.itinerary.legs.map((l, i) => <LegRow key={i} l={l} />)}
    </View>
  );
}

function VisitCard({ v, now }: { v: Visit; now?: number }) {
  const th = useTheme();
  const { t } = useSettings();
  const active = now !== undefined && now >= v.arriveMin && now < v.leaveMin;
  const late = v.arriveBy !== undefined && v.arriveMin > v.arriveBy + 0.5;
  return (
    <View style={[styles.visit, { backgroundColor: active ? th.backgroundSelected : th.backgroundElement }]}>
      <Txt v="num" style={{ fontSize: 20 }}>{fmtTime(v.startMin)}<Txt v="sub">  {t('until')} {fmtTime(v.leaveMin)}</Txt></Txt>
      <Txt v="h2">{v.place.name}</Txt>
      {v.place.task ? <Txt tone="brand" style={{ fontFamily: Font.medium }}>{v.place.task}</Txt> : null}
      {v.arriveBy !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={late ? 'alert-circle' : 'checkmark-circle'} size={14} color={late ? th.danger : th.brand} />
          <Txt v="sub" style={{ color: late ? th.danger : th.brand }}>{late ? `${t('late')} · ` : ''}{t('beThereBy')} {fmtTime(v.arriveBy)} · {t('arrive')} {fmtTime(v.arriveMin)}</Txt>
        </View>
      )}
      {v.waitMin >= 5 && <Txt v="sub">{Math.round(v.waitMin)} {t('min')} wait</Txt>}
    </View>
  );
}

export function Timeline({ plan, now }: { plan: Plan; now?: number }) {
  return (
    <View style={{ gap: Spacing.two }}>
      {plan.timeline.map((e: Entry, i) => (isTrivialMove(e) ? null : (
        <Animated.View key={i} entering={fx.in(i)} layout={fx.layout}>
          {e.kind === 'visit' ? <VisitCard v={e} now={now} /> : <MoveRow m={e} now={now} />}
        </Animated.View>
      )))}
    </View>
  );
}

const styles = StyleSheet.create({
  visit: { borderRadius: Radius.card + 6, padding: Spacing.three, gap: 4 },
  move: { marginLeft: Spacing.three, paddingLeft: Spacing.three, gap: Spacing.two, paddingVertical: Spacing.one },
  leg: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1 },
  ic: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
