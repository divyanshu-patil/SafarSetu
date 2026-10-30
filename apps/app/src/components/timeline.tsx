import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { fmtDuration, fmtTime, isTrivialMove, type Entry, type Leg, type Move, type Plan, type Visit } from '@repo/core';

import { Icon, Txt, fx, type IconName } from '@/components/ui';
import { Font, ModeColor, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

const MODE_ICON: Record<string, IconName> = { walk: 'walk', metro: 'subway', train: 'train', bus: 'bus', cab: 'car' };

function LegRow({ l }: { l: Leg }) {
  const { t } = useSettings();
  const kind = l.kind === 'transit' ? l.mode : l.kind;
  const color = l.kind === 'transit' ? l.color : ModeColor[kind as keyof typeof ModeColor];
  const title = l.kind === 'transit' ? l.routeName : l.kind === 'walk' ? `${t('walk')} ${Math.round(l.arriveMin - l.departMin)} ${t('min')}` : `${t('cab')} ₹${l.fare}`;
  const sub = l.kind === 'transit' ? `${fmtTime(l.departMin)} ${l.from.name} → ${fmtTime(l.arriveMin)} ${l.to.name}` : l.kind === 'walk' ? `${Math.round(l.distM)} m → ${l.to.name ?? ''}` : `${fmtTime(l.departMin)} → ${fmtTime(l.arriveMin)}`;
  if (l.kind === 'walk' && l.arriveMin - l.departMin < 3)
    return <Txt v="sub" style={{ paddingLeft: 36 }}>{t('walk')} {Math.round(l.arriveMin - l.departMin)} {t('min')} · {Math.round(l.distM)} m</Txt>;
  return (
    <View style={styles.leg}>
      <View style={[styles.ic, { backgroundColor: color + '1f' }]}><Icon name={MODE_ICON[kind] ?? 'ellipse'} size={14} color={color} /></View>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontFamily: Font.medium }} numberOfLines={2}>{title}</Txt>
        <Txt v="sub" numberOfLines={1}>{sub}{l.kind === 'transit' && l.delayMin > 0 ? ` · +${Math.round(l.delayMin)} ${t('min')}` : ''}</Txt>
      </View>
      {l.kind === 'transit' && l.fare ? <Txt v="sub">₹{l.fare}</Txt> : null}
    </View>
  );
}

function MoveRow({ m, now }: { m: Move; now?: number }) {
  const th = useTheme();
  const { t } = useSettings();
  const active = now !== undefined && now >= m.departMin && now < m.arriveMin;
  const p = m.confidence ? Math.round(m.confidence.pOnTime * 100) : null;
  return (
    <View style={[styles.move, { borderLeftColor: active ? th.accent : th.border, borderLeftWidth: active ? 3 : 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Txt v="sub" style={{ fontFamily: Font.semibold, color: th.text, flex: 1 }}>{fmtTime(m.departMin)} → {fmtTime(m.arriveMin)} · {fmtDuration(m.arriveMin - m.departMin)}</Txt>
        {p !== null && <Txt v="sub" style={{ fontFamily: Font.semibold, color: p >= 80 ? th.brand : th.danger }}>{p}% {t('onTime')}</Txt>}
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
  ic: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
