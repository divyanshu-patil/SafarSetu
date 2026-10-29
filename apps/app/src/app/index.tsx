import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDuration, fmtTime, networks, nextAction, planDay, type Entry, type Leg } from '@repo/core';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, PillButton, Segmented } from '@/components/ui/pill';
import { BottomTabInset, Font, MaxContentWidth, ModeColor, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The planning engine runs on-device: exactly the @repo/core code the API and web dashboard run.
const ORDER = ['maharashtra', 'mumbai', 'pune'];
const CITIES = Object.values(networks).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)).map((n) => ({ id: n.id, label: n.city }));

const ICON = {
  walk: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  metro: { ios: 'tram.fill', android: 'tram', web: 'tram' },
  train: { ios: 'train.side.front.car', android: 'train', web: 'train' },
  bus: { ios: 'bus.fill', android: 'directions_bus', web: 'directions_bus' },
  cab: { ios: 'car.fill', android: 'local_taxi', web: 'local_taxi' },
} as const;

function LegChip({ leg }: { leg: Leg }) {
  const t = useTheme();
  const kind = leg.kind === 'transit' ? leg.mode : leg.kind;
  const color = leg.kind === 'transit' ? leg.color : ModeColor[kind];
  const label = leg.kind === 'transit' ? `${leg.routeName} · ${fmtTime(leg.departMin)}` : leg.kind === 'walk' ? `${Math.round(leg.arriveMin - leg.departMin)} min walk` : `Cab ₹${leg.fare}`;
  return (
    <View style={styles.leg}>
      <View style={[styles.ichip, { backgroundColor: color + '1f' }]}>
        <SymbolView name={ICON[kind] as never} tintColor={color} size={14} />
      </View>
      <ThemedText type="small" style={{ color: t.text, flexShrink: 1 }}>{label}</ThemedText>
    </View>
  );
}

function Row({ e }: { e: Entry }) {
  const t = useTheme();
  if (e.kind === 'visit') {
    return (
      <ThemedView type="backgroundElement" style={styles.visit}>
        <ThemedText style={{ fontFamily: Font.black, fontSize: 22, letterSpacing: -0.7, color: t.textStrong }}>
          {fmtTime(e.startMin)}
          <ThemedText type="small" themeColor="textSecondary">{`  until ${fmtTime(e.leaveMin)}`}</ThemedText>
        </ThemedText>
        <ThemedText style={{ fontFamily: Font.bold, fontSize: 20, lineHeight: 26, color: t.textStrong }}>{e.place.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Stay {fmtDuration(e.dwellMin)}</ThemedText>
      </ThemedView>
    );
  }
  if (e.itinerary.legs.length === 1 && e.itinerary.legs[0]!.kind === 'walk' && e.itinerary.legs[0]!.distM < 60) return null;
  const p = e.confidence ? Math.round(e.confidence.pOnTime * 100) : null;
  return (
    <View style={styles.move}>
      <ThemedText type="smallBold" style={{ color: t.textStrong }}>
        Leave {fmtTime(e.departMin)} → arrive {fmtTime(e.arriveMin)}
        {p !== null && <ThemedText type="small" style={{ color: p >= 80 ? t.brand : t.danger }}>{`  ${p}% on time`}</ThemedText>}
      </ThemedText>
      {e.itinerary.legs.map((l, i) => <LegChip key={i} leg={l} />)}
    </View>
  );
}

export default function PlanScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState(CITIES.find((c) => c.id === 'mumbai')?.id ?? CITIES[0]!.id);
  const net = networks[city]!;
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = net.presets[presetIdx] ?? net.presets[0]!;

  const plan = useMemo(
    () => planDay(net, { city, date: new Date().toISOString().slice(0, 10), origin: preset.origin, startMin: preset.startMin, endMin: preset.endMin, places: preset.placeIds.map((placeId) => ({ placeId })), prefs: { pace: preset.pace } }),
    [net, city, preset],
  );
  const next = nextAction(plan, plan.request.startMin - 20);
  const visits = plan.timeline.filter((e) => e.kind === 'visit').length;

  const pad = Platform.select({ android: { paddingTop: insets.top + Spacing.three }, ios: { paddingTop: insets.top + Spacing.three }, default: { paddingTop: Spacing.six + Spacing.four } });

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={[styles.scroll, pad, { paddingBottom: BottomTabInset + Spacing.six }]}>
      <View style={styles.col}>
        <ThemedText type="kicker">SafarSetu</ThemedText>
        <ThemedText type="title">A whole day, anywhere in Maharashtra.</ThemedText>
        <ThemedText themeColor="textSecondary">Buses, metro and trains timed to the minute — with calm alerts when things change.</ThemedText>

        <Segmented options={CITIES} value={city} onChange={(c) => { setCity(c); setPresetIdx(0); }} />
        <View style={styles.chips}>
          {net.presets.map((p, i) => <Chip key={p.name} label={p.name} selected={i === presetIdx} onPress={() => setPresetIdx(i)} />)}
        </View>

        {next && (
          <ThemedView style={[styles.dark, { backgroundColor: '#163300' }]}>
            <ThemedText type="kicker" style={{ color: '#e2f6d5' }}>Next up</ThemedText>
            <ThemedText type="subtitle" style={{ color: '#9fe870' }}>{next.title}</ThemedText>
            <ThemedText style={{ color: '#ffffff' }}>{next.detail}</ThemedText>
          </ThemedView>
        )}

        <View style={styles.stats}>
          {[[String(visits), 'places'], [`${(plan.totals.walkM / 1000).toFixed(1)} km`, 'walking'], [`₹${plan.totals.fare}`, 'fares'], [`${plan.totals.confidencePct}%`, 'on time']].map(([v, l]) => (
            <View key={l}>
              <ThemedText style={{ fontFamily: Font.black, fontSize: 30, lineHeight: 32, letterSpacing: -1.2, color: t.textStrong }}>{v}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{l}</ThemedText>
            </View>
          ))}
        </View>

        <View style={{ gap: Spacing.two }}>{plan.timeline.map((e, i) => <Row key={i} e={e} />)}</View>

        <PillButton label="Report a connectivity gap" onPress={() => router.push('/report')} />
        <ThemedText type="small" themeColor="textSecondary">{plan.meta.note}</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  col: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  dark: { borderRadius: Radius.large, padding: Spacing.four, gap: Spacing.two },
  stats: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.three, paddingVertical: Spacing.two },
  visit: { borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.one },
  move: { paddingLeft: Spacing.three, gap: Spacing.two, paddingVertical: Spacing.one },
  leg: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ichip: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
