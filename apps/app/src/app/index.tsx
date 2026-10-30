import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDuration, fmtTime, networks, planDay, type Entry, type Leg, type Plan, type PlaceInput } from '@repo/core';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, PillButton, Segmented } from '@/components/ui/pill';
import { BottomTabInset, Font, MaxContentWidth, ModeColor, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { client } from '@/lib/api';

// The planning engine runs on-device: exactly the @repo/core code the API and web dashboard run.
const ORDER = ['maharashtra', 'mumbai', 'pune'];
const CITIES = Object.values(networks).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)).map((n) => ({ id: n.id, label: n.city }));
const DWELLS = [15, 30, 45, 60, 90];
const letter = (i: number) => String.fromCharCode(66 + i);
const parseHHMM = (s: string) => (/^\d{1,2}:\d{2}$/.test(s.trim()) ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : undefined);

interface Pt { name: string; lat: number; lon: number }
interface Stop extends Pt { id: string; task: string; dwell: number; by: string; required: boolean }
let uid = 0;

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
      <View style={[styles.ichip, { backgroundColor: color + '1f' }]}><SymbolView name={ICON[kind] as never} tintColor={color} size={14} /></View>
      <ThemedText type="small" style={{ color: t.text, flexShrink: 1 }}>{label}</ThemedText>
    </View>
  );
}

function Row({ e }: { e: Entry }) {
  const t = useTheme();
  if (e.kind === 'visit') {
    const late = e.arriveBy !== undefined && e.arriveMin > e.arriveBy + 0.5;
    return (
      <ThemedView type="backgroundElement" style={styles.visit}>
        <ThemedText style={{ fontFamily: Font.black, fontSize: 22, letterSpacing: -0.7, color: t.textStrong }}>
          {fmtTime(e.startMin)}
          <ThemedText type="small" themeColor="textSecondary">{`  until ${fmtTime(e.leaveMin)}`}</ThemedText>
        </ThemedText>
        <ThemedText style={{ fontFamily: Font.bold, fontSize: 20, lineHeight: 26, color: t.textStrong }}>{e.place.name}</ThemedText>
        {e.place.task ? <ThemedText type="smallBold" themeColor="brand">{e.place.task}</ThemedText> : null}
        {e.arriveBy !== undefined && <ThemedText type="small" style={{ color: late ? t.danger : t.brand }}>{late ? `Late for ${fmtTime(e.arriveBy)} — arrive ${fmtTime(e.arriveMin)}` : `Be there by ${fmtTime(e.arriveBy)} · arrive ${fmtTime(e.arriveMin)}`}</ThemedText>}
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

function SmallBtn({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} disabled={disabled} onPress={onPress} style={[styles.sbtn, { borderColor: t.border, opacity: disabled ? 0.35 : 1 }]}>
      <ThemedText type="smallBold" style={{ color: t.brand }}>{label}</ThemedText>
    </Pressable>
  );
}

export default function PlanScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState(CITIES.find((c) => c.id === 'pune')?.id ?? CITIES[0]!.id);
  const net = networks[city]!;
  const [origin, setOrigin] = useState<Pt | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [leave, setLeave] = useState('09:00');
  const [keepOrder, setKeepOrder] = useState(true);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState<'start' | 'stop'>('start');
  const [hits, setHits] = useState<Pt[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // suggestions: the API's geocoder when reachable, else the city's own places (works offline)
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    let live = true;
    const local = net.places.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map((p) => ({ name: p.name, lat: p.lat, lon: p.lon }));
    setHits(local);
    const timer = setTimeout(() => { client.geocode(q).then((r) => live && setHits([...local, ...r.items.slice(0, 5)])).catch(() => {}); }, 350);
    return () => { live = false; clearTimeout(timer); };
  }, [q, net]);

  const pick = (h: Pt) => {
    if (adding === 'start') { setOrigin(h); setAdding('stop'); }
    else { const s: Stop = { ...h, id: `s${++uid}`, task: '', dwell: 30, by: '', required: true }; setStops((x) => [...x, s]); setOpen(s.id); }
    setQ(''); setHits([]); setPlan(null);
  };
  const patch = (id: string, p: Partial<Stop>) => { setStops((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x))); setPlan(null); };
  const move = (i: number, d: -1 | 1) => setStops((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });

  const run = () => {
    setErr(null);
    if (!origin) return setErr('Choose where you start first.');
    if (!stops.length) return setErr('Add at least one stop.');
    const startMin = parseHHMM(leave) ?? 540;
    try {
      const places: PlaceInput[] = stops.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon, task: s.task || undefined, minDwell: s.dwell, maxDwell: s.dwell, arriveBy: parseHHMM(s.by), required: s.required, priority: s.required ? 3 : 2 }));
      setPlan(planDay(net, { city, date: new Date().toISOString().slice(0, 10), origin, startMin, endMin: Math.min(1439, startMin + 14 * 60), keepOrder, returnToOrigin: false, places }));
    } catch (e) { setErr((e as Error).message); }
  };

  const pad = Platform.select({ android: { paddingTop: insets.top + Spacing.three }, ios: { paddingTop: insets.top + Spacing.three }, default: { paddingTop: Spacing.six + Spacing.four } });
  const input = [styles.input, { borderColor: t.textSecondary, color: t.textStrong, fontFamily: Font.regular }];

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={[styles.scroll, pad, { paddingBottom: BottomTabInset + Spacing.six }]} keyboardShouldPersistTaps="handled">
      <View style={styles.col}>
        <ThemedText type="kicker">SafarSetu</ThemedText>
        <ThemedText type="title">Get your work done on the move.</ThemedText>
        <Segmented options={CITIES} value={city} onChange={(c) => { setCity(c); setOrigin(null); setStops([]); setPlan(null); setAdding('start'); }} />

        <ThemedText type="smallBold" themeColor="brand">{adding === 'start' ? 'Where are you starting from?' : 'Add a stop'}</ThemedText>
        <TextInput style={input} value={q} onChangeText={setQ} placeholder={adding === 'start' ? 'Search a station or place' : 'Search a place or address'} placeholderTextColor={t.textSecondary} accessibilityLabel={adding === 'start' ? 'Starting point' : 'Add a stop'} />
        {hits.map((h, i) => (
          <Pressable key={i} accessibilityRole="button" onPress={() => pick(h)} style={[styles.hit, { borderColor: t.border }]}>
            <ThemedText type="small" style={{ color: t.textStrong }}>{h.name}</ThemedText>
          </Pressable>
        ))}

        <View style={{ gap: Spacing.two }}>
          <ThemedView type="backgroundElement" style={styles.stop}>
            <View style={[styles.badge, { backgroundColor: t.accent }]}><ThemedText style={{ fontFamily: Font.bold, color: t.onAccent }}>A</ThemedText></View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontFamily: Font.bold, color: t.textStrong }}>{origin?.name ?? 'Start not set'}</ThemedText>
              <View style={styles.inline}>
                <ThemedText type="small" themeColor="textSecondary">Leave at</ThemedText>
                <TextInput style={[styles.mini, { borderColor: t.textSecondary, color: t.textStrong }]} value={leave} onChangeText={setLeave} accessibilityLabel="Leave at, HH:MM" keyboardType="numbers-and-punctuation" />
                {origin && <SmallBtn label="change" a11y="Change starting point" onPress={() => setAdding('start')} />}
              </View>
            </View>
          </ThemedView>

          {stops.map((s, i) => (
            <ThemedView key={s.id} type="backgroundElement" style={[styles.stop, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <View style={[styles.badge, { backgroundColor: t.brand }]}><ThemedText style={{ fontFamily: Font.bold, color: '#ffffff' }}>{letter(i)}</ThemedText></View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontFamily: Font.bold, color: t.textStrong }}>{s.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{s.task || 'What are you doing here?'} · {s.dwell} min{s.by ? ` · by ${s.by}` : ''}{s.required ? '' : ' · optional'}</ThemedText>
                </View>
                <SmallBtn label="↑" a11y={`Move ${s.name} up`} disabled={i === 0} onPress={() => move(i, -1)} />
                <SmallBtn label="↓" a11y={`Move ${s.name} down`} disabled={i === stops.length - 1} onPress={() => move(i, 1)} />
                <SmallBtn label="⋯" a11y={`Details for ${s.name}`} onPress={() => setOpen(open === s.id ? null : s.id)} />
                <SmallBtn label="✕" a11y={`Remove ${s.name}`} onPress={() => { setStops((x) => x.filter((y) => y.id !== s.id)); setPlan(null); }} />
              </View>
              {open === s.id && (
                <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
                  <TextInput style={input} value={s.task} onChangeText={(v) => patch(s.id, { task: v })} placeholder="Client meeting, bank, pick-up…" placeholderTextColor={t.textSecondary} accessibilityLabel="What are you doing here?" />
                  <View style={styles.chips}>{DWELLS.map((d) => <Chip key={d} label={`${d} min`} selected={s.dwell === d} onPress={() => patch(s.id, { dwell: d })} />)}</View>
                  <View style={styles.inline}>
                    <ThemedText type="small" themeColor="textSecondary">Be there by</ThemedText>
                    <TextInput style={[styles.mini, { borderColor: t.textSecondary, color: t.textStrong }]} value={s.by} onChangeText={(v) => patch(s.id, { by: v })} placeholder="11:30" placeholderTextColor={t.textSecondary} accessibilityLabel="Be there by, HH:MM" keyboardType="numbers-and-punctuation" />
                  </View>
                  <Chip label={s.required ? 'Must happen — never skip' : 'Optional stop'} selected={s.required} onPress={() => patch(s.id, { required: !s.required })} />
                </View>
              )}
            </ThemedView>
          ))}
        </View>

        <View style={styles.chips}>
          <Chip label="My order" selected={keepOrder} onPress={() => { setKeepOrder(true); setPlan(null); }} />
          <Chip label="Best order" selected={!keepOrder} onPress={() => { setKeepOrder(false); setPlan(null); }} />
        </View>
        {err && <ThemedText type="small" style={{ color: t.danger }}>{err}</ThemedText>}
        <PillButton label="Plan my route" onPress={run} />

        {plan && (
          <View style={{ gap: Spacing.three }}>
            <View style={styles.stats}>
              {[[String(plan.timeline.filter((e) => e.kind === 'visit').length), 'stops'], [`${(plan.totals.walkM / 1000).toFixed(1)} km`, 'walking'], [`₹${plan.totals.fare}`, 'fares'], [`${plan.totals.confidencePct}%`, 'on time']].map(([v, l]) => (
                <View key={l}>
                  <ThemedText style={{ fontFamily: Font.black, fontSize: 30, lineHeight: 32, letterSpacing: -1.2, color: t.textStrong }}>{v}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{l}</ThemedText>
                </View>
              ))}
            </View>
            {(plan.conflicts?.length ?? 0) > 0 && (
              <ThemedView type="backgroundElement" style={[styles.visit, { borderLeftWidth: 4, borderLeftColor: t.danger }]}>
                <ThemedText type="smallBold" style={{ color: t.danger }}>This can’t work as asked</ThemedText>
                {plan.conflicts!.map((c, i) => <ThemedText key={i} type="small">{c.name}: {c.reason}</ThemedText>)}
              </ThemedView>
            )}
            {(plan.warnings ?? []).map((w, i) => <ThemedText key={i} type="small" style={{ color: t.info }}>{w.text}</ThemedText>)}
            <View style={{ gap: Spacing.two }}>{plan.timeline.map((e, i) => <Row key={i} e={e} />)}</View>
          </View>
        )}

        <PillButton variant="outline" label="Report a connectivity gap" onPress={() => router.push('/report')} />
        <ThemedText type="small" themeColor="textSecondary">{net.meta.note}</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  col: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  input: { borderWidth: 1, borderRadius: Radius.card, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  mini: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 64, minHeight: 32, fontSize: 14 },
  hit: { borderWidth: 1, borderRadius: Radius.card, paddingHorizontal: 16, paddingVertical: 12 },
  stop: { borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.two, flexDirection: 'row', alignItems: 'center' },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sbtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.three, paddingVertical: Spacing.two },
  visit: { borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.one },
  move: { paddingLeft: Spacing.three, gap: Spacing.two, paddingVertical: Spacing.one },
  leg: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ichip: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
