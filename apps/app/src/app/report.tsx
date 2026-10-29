import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, PROMISE, createClient, type PublicReport, type ReportCategory } from '@repo/core';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, PillButton } from '@/components/ui/pill';
import { BottomTabInset, Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Android emulators reach the host machine at 10.0.2.2
const API = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');
const client = createClient(API);

const ICON: Record<ReportCategory, { ios: string; android: string; web: string }> = {
  no_feeder: { ios: 'bus.fill', android: 'directions_bus', web: 'directions_bus' },
  infrequent: { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' },
  poor_transfer: { ios: 'arrow.triangle.swap', android: 'swap_horiz', web: 'swap_horiz' },
  long_wait: { ios: 'clock', android: 'schedule', web: 'schedule' },
  hard_to_reach: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  obstructed: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  accessibility: { ios: 'figure.roll', android: 'accessible', web: 'accessible' },
  wrong_info: { ios: 'doc.badge.ellipsis', android: 'report', web: 'report' },
  missing_info: { ios: 'mappin.slash', android: 'wrong_location', web: 'wrong_location' },
  other: { ios: 'questionmark.circle', android: 'help', web: 'help' },
};

async function resolve(q: string) {
  const r = await client.geocode(q.trim());
  const h = r.items[0];
  if (!h) throw new Error(`Couldn’t find “${q}”. Try a landmark or station name.`);
  return { name: h.name, lat: h.lat, lon: h.lon };
}

export default function ReportScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<ReportCategory | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sev, setSev] = useState<1 | 2 | 3>(2);
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<PublicReport | null>(null);

  const submit = async () => {
    if (!cat) return setErr('Choose what kind of problem it is.');
    if (!from.trim()) return setErr('Tell us the area where it happens.');
    setBusy(true);
    setErr(null);
    try {
      const [f, d] = await Promise.all([resolve(from), to.trim() ? resolve(to) : Promise.resolve(undefined)]);
      const res = await fetch(`${API}/v1/reports`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-user-id': 'mobile-demo' }, body: JSON.stringify({ category: cat, severity: sev, from: f, to: d, mode: 'any', description: desc }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message ?? 'Could not send the report');
      setDone(j.report);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pad = Platform.select({ default: { paddingTop: insets.top + Spacing.three }, web: { paddingTop: Spacing.six + Spacing.four } });
  const input = [styles.input, { borderColor: t.textSecondary, color: t.textStrong, fontFamily: Font.regular }];

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={[styles.scroll, pad, { paddingBottom: BottomTabInset + Spacing.six }]} keyboardShouldPersistTaps="handled">
      <View style={styles.col}>
        <ThemedText type="kicker">Citizen reports</ThemedText>
        {done ? (
          <>
            <ThemedText type="title">Thank you — we have it.</ThemedText>
            <ThemedView type="backgroundSelected" style={styles.receipt}>
              <ThemedText type="small" themeColor="textSecondary">Your reference number</ThemedText>
              <ThemedText style={{ fontFamily: Font.black, fontSize: 32, letterSpacing: -1.2, color: t.textStrong }}>{done.ref}</ThemedText>
              <ThemedText type="small">{PROMISE}</ThemedText>
            </ThemedView>
            <PillButton variant="outline" label="Report another" onPress={() => { setDone(null); setCat(null); setFrom(''); setTo(''); setDesc(''); }} />
          </>
        ) : (
          <>
            <ThemedText type="title">Can’t get there? Tell us.</ThemedText>
            <ThemedText themeColor="textSecondary">Name two areas that should be connected and what goes wrong.</ThemedText>

            <ThemedText type="smallBold" themeColor="brand">1 · What is the problem?</ThemedText>
            <View style={styles.grid}>
              {(Object.keys(CATEGORIES) as ReportCategory[]).map((k) => {
                const on = cat === k;
                return (
                  <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setCat(k)} style={[styles.cat, { borderColor: on ? t.brand : t.border, backgroundColor: on ? t.backgroundSelected : t.background, borderWidth: on ? 2 : 1 }]}>
                    <View style={[styles.ichip, { backgroundColor: CATEGORIES[k].color + '1f' }]}>
                      <SymbolView name={ICON[k] as never} tintColor={CATEGORIES[k].color} size={18} />
                    </View>
                    <ThemedText type="smallBold" style={{ color: t.textStrong }}>{CATEGORIES[k].label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText type="smallBold" themeColor="brand">2 · Which areas are not connected?</ThemedText>
            <TextInput style={input} value={from} onChangeText={setFrom} placeholder="From area (e.g. Hinjewadi)" placeholderTextColor={t.textSecondary} />
            <TextInput style={input} value={to} onChangeText={setTo} placeholder="To area (optional, e.g. Shivajinagar)" placeholderTextColor={t.textSecondary} />

            <ThemedText type="smallBold" themeColor="brand">3 · How serious?</ThemedText>
            <View style={styles.chips}>
              {([[1, 'Minor'], [2, 'Real problem'], [3, 'Serious']] as const).map(([v, l]) => <Chip key={v} label={l} selected={sev === v} onPress={() => setSev(v)} />)}
            </View>

            <TextInput style={[...input, { minHeight: 96, textAlignVertical: 'top' }]} multiline maxLength={600} value={desc} onChangeText={setDesc} placeholder="What happens? (optional — no personal details)" placeholderTextColor={t.textSecondary} />
            {err && <ThemedText type="small" style={{ color: t.danger }}>{err}</ThemedText>}
            <PillButton label={busy ? 'Sending…' : 'Send report'} onPress={submit} disabled={busy} />
            <ThemedText type="small" themeColor="textSecondary">No name, phone or device location is collected.</ThemedText>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  col: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cat: { width: '48.5%', borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.two, minHeight: 92 },
  ichip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.card, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  receipt: { borderRadius: Radius.card, padding: Spacing.four, gap: Spacing.two },
});
