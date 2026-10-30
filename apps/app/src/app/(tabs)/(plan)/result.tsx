import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { fmtTime, isTrivialMove, planImpact, planToMapLayers, type Move, type Visit } from '@repo/core';

import RouteMap from '@/components/route-map';
import { Timeline } from '@/components/timeline';
import { Btn, Card, Header, Icon, Screen, Txt, fx } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';

export default function Result() {
  const th = useTheme();
  const { t, client } = useSettings();
  const { current } = useSession();
  const plan = current?.plan;
  const layers = useMemo(() => (plan ? planToMapLayers(plan) : null), [plan]);
  const [geoms, setGeoms] = useState<Record<string, [number, number][]>>({});
  const [rain, setRain] = useState<number | null>(null);

  // real footpaths for longer walks (straight line stays if the server can't route them)
  useEffect(() => {
    setGeoms({});
    if (!layers) return;
    let live = true;
    Promise.all(layers.lines.filter((l) => l.walk && l.walk.distM > 150).map(async (l) => {
      const w = l.walk!;
      const r = await client.walk(w.from.join(','), w.to.join(',')).catch(() => null);
      return r && r.source !== 'straight-line' ? ([`${w.from}>${w.to}`, r.coords] as const) : null;
    })).then((rs) => live && setGeoms(Object.fromEntries(rs.filter(Boolean) as [string, [number, number][]][])));
    return () => { live = false; };
  }, [layers, client]);
  const lines = layers?.lines.map((l) => (l.walk && geoms[`${l.walk.from}>${l.walk.to}`] ? { ...l, coords: geoms[`${l.walk.from}>${l.walk.to}`]! } : l));

  useEffect(() => {
    setRain(null);
    if (!plan) return;
    const o = plan.request.origin;
    client.weather(o.lat, o.lon).then((w) => {
      const a = Math.floor(plan.request.startMin / 60), b = Math.ceil(plan.request.endMin / 60);
      const worst = Math.max(0, ...w.hours.map((h, i) => (h >= a && h <= b ? w.rainProb[i] ?? 0 : 0)));
      if (worst >= 40) setRain(worst);
    }).catch(() => {});
  }, [plan, client]);

  if (!plan) return <Redirect href="/" />; // e.g. after a reload cleared the session
  const impact = planImpact(plan);
  const visits = plan.timeline.filter((e) => e.kind === 'visit').length;
  const first = plan.timeline.find((e): e is Move => e.kind === 'move' && !isTrivialMove(e));
  const last = [...plan.timeline].reverse().find((e): e is Visit => e.kind === 'visit');
  const share = () => Share.share({ message: plan.timeline.flatMap((e) => (e.kind === 'visit' ? [`${fmtTime(e.startMin)} ${e.place.name}${e.place.task ? ` — ${e.place.task}` : ''}`] : [])).join('\n') });

  return (
    <>
      <Header title={t('plan')} large={false} actions={[{ sf: 'square.and.arrow.up', icon: 'share-outline', label: t('share'), onPress: share }]} />
      <Screen footer={current?.id ? <Btn label={t('startTrip')} onPress={() => { router.back(); router.navigate('/trip'); }} /> : <Btn kind="soft" label={t('offline')} disabled />}>
      <RouteMap lines={lines} markers={layers?.markers} />

      {first && (
        <Animated.View entering={fx.in(0)}>
          <Txt v="label">{t('leave')}</Txt>
          <Txt style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1.5, fontFamily: 'Inter_900Black' }}>{fmtTime(first.departMin)}<Txt v="sub">  → {fmtTime(last?.leaveMin ?? first.arriveMin)}</Txt></Txt>
        </Animated.View>
      )}
      <Animated.View entering={fx.in(1)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {([[String(visits), t('stops'), th.textStrong, 'flag'], [`${(plan.totals.walkM / 1000).toFixed(1)} km`, t('walking'), '#475569', 'walk'], [`₹${plan.totals.fare}`, t('fares'), '#15803d', 'cash-outline'], [`${plan.totals.confidencePct}%`, t('onTime'), plan.totals.confidencePct >= 80 ? '#15803d' : '#cb272f', 'shield-checkmark']] as const).map(([v, l, c, ic]) => (
          <View key={l} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name={ic} size={14} color={c} /><Txt v="sub">{l}</Txt></View>
            <Txt v="num" style={{ color: c }}>{v}</Txt>
          </View>
        ))}
      </Animated.View>

      {(impact.savedInr > 0 || impact.savedCo2Kg > 0) && (
        <Card tint="select" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="leaf" size={18} color={th.brand} />
          <Txt style={{ flex: 1 }}><Txt v="sub">{t('saves')} </Txt><Txt tone="brand" style={{ fontWeight: '700' }}>₹{impact.savedInr}</Txt> · {impact.savedCo2Kg} kg {t('co2')}</Txt>
        </Card>
      )}
      {rain !== null && <Chip2 icon="rainy" text={`${t('rain')} · ${rain}%`} color={th.info} />}
      {(plan.conflicts ?? []).map((c, i) => <Chip2 key={i} icon="alert-circle" color={th.danger} text={`${c.name}: ${c.reason}`} />)}
      {(plan.warnings ?? []).map((w, i) => <Chip2 key={i} icon="moon" color={th.info} text={w.text} />)}
      {plan.dropped.length > 0 && <Chip2 icon="remove-circle-outline" color={th.textSecondary} text={`${t('leftOut')}: ${plan.dropped.map((d) => d.name).join(', ')}`} />}

      <Timeline plan={plan} />
      <View style={{ height: Spacing.two }} />
      </Screen>
    </>
  );
}

function Chip2({ icon, text, color }: { icon: React.ComponentProps<typeof Icon>['name']; text: string; color: string }) {
  return (
    <Animated.View entering={fx.in(2)} style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' }}>
      <Icon name={icon} size={16} color={color} />
      <Txt v="sub" style={{ flex: 1, color }}>{text}</Txt>
    </Animated.View>
  );
}
