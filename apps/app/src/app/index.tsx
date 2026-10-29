import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fmtDuration, fmtTime, nextAction, networks, planDay, type Plan } from '@repo/core';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Proof that the planning engine is shared: this screen runs @repo/core on-device (no API needed),
// exactly the code the Express API and the web dashboard run.
export default function PlanScreen() {
  const [city, setCity] = useState<'pune' | 'mumbai'>('mumbai');
  const net = networks[city]!;
  const plan: Plan = useMemo(() => {
    const p = net.presets[0]!;
    return planDay(net, {
      city,
      date: new Date().toISOString().slice(0, 10),
      origin: p.origin,
      startMin: p.startMin,
      endMin: p.endMin,
      places: p.placeIds.map((placeId) => ({ placeId })),
      prefs: { pace: p.pace },
    });
  }, [net, city]);
  const next = nextAction(plan, plan.request.startMin - 20);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="title">SafarSetu</ThemedText>
          <View style={styles.row}>
            {(['mumbai', 'pune'] as const).map((c) => (
              <Pressable key={c} onPress={() => setCity(c)} style={[styles.pill, city === c && styles.pillOn]}>
                <ThemedText type="small" style={city === c ? styles.pillTextOn : undefined}>
                  {networks[c]!.city}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {next && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small">Next</ThemedText>
              <ThemedText type="subtitle">{next.title}</ThemedText>
              <ThemedText type="small">{next.detail}</ThemedText>
            </ThemedView>
          )}
          {plan.timeline.map((e, i) =>
            e.kind === 'visit' ? (
              <ThemedView key={i} type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">{e.place.name}</ThemedText>
                <ThemedText type="small">
                  {fmtTime(e.startMin)}–{fmtTime(e.leaveMin)} · stay {fmtDuration(e.dwellMin)}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedText key={i} type="small" style={styles.move}>
                Leave {fmtTime(e.departMin)} → arrive {fmtTime(e.arriveMin)}
                {e.confidence ? ` · ${Math.round(e.confidence.pOnTime * 100)}% on time` : ''}
              </ThemedText>
            ),
          )}
          <ThemedText type="small">{plan.meta.note}</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: '#86868b' },
  pillOn: { backgroundColor: '#1d1d1f', borderColor: '#1d1d1f' },
  pillTextOn: { color: '#ffffff' },
  card: { padding: Spacing.three, borderRadius: 28, gap: Spacing.one },
  move: { paddingLeft: Spacing.three },
});
