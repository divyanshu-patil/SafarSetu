import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Network } from '@repo/core';

import { Field, Icon, IconBtn, Txt, fx, useReveal, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

export interface Pt { name: string; lat: number; lon: number }
interface Hit extends Pt { sub?: string; icon: IconName }

/** Current position as a named point (name from the server's reverse geocoder when reachable). */
export async function locate(client: ReturnType<typeof useSettings>['client']): Promise<Pt | 'denied'> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return 'denied';
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const pt = { name: 'My location', lat: p.coords.latitude, lon: p.coords.longitude };
  return client.reverse(pt.lat, pt.lon).then((r) => ({ ...pt, name: r.name })).catch(() => pt);
}

/** Search field with live suggestions: this region's known places instantly, then the server's geocoder. */
export function PlaceInput({ places, placeholder, onPick, withLocate, icon = 'search', onCard }: { places: Network['places']; placeholder: string; onPick: (p: Pt) => void; withLocate?: boolean; icon?: IconName; onCard?: boolean }) {
  const t = useTheme();
  const { client, t: tr } = useSettings();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [remote, setRemote] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(''); // the query the geocoder last answered
  const seq = useRef(0);
  const box = useRef<any>(null);
  const reveal = useReveal();

  const needle = q.trim().toLowerCase();
  const local: Hit[] = places
    .filter((p) => !needle || p.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(needle)) - Number(a.name.toLowerCase().startsWith(needle)))
    .slice(0, needle ? 5 : 6)
    .map((p) => ({ name: p.name, lat: p.lat, lon: p.lon, sub: p.area, icon: 'location-outline' }));
  // the geocoder repeats names ("Shivajinagar, Shivajinagar"): keep one hit per leading name
  const head = (n: string) => n.split(',')[0]!.trim().toLowerCase();
  const seen = new Set(local.map((h) => head(h.name)));
  const hits = [...local, ...remote.filter((h) => !seen.has(head(h.name)) && seen.add(head(h.name)))];
  const searching = needle.length >= 3 && done !== q.trim();

  useEffect(() => {
    if (needle.length < 3) { setRemote([]); return; }
    const id = ++seq.current;
    const timer = setTimeout(() => {
      const asked = q.trim();
      client.geocode(asked).then((r) => { if (id === seq.current) setRemote(r.items.slice(0, 5).map((h) => ({ ...h, sub: 'Address', icon: 'navigate-outline' as const }))); }).catch(() => {}).finally(() => { if (id === seq.current) setDone(asked); });
    }, 300);
    return () => clearTimeout(timer);
  }, [q, needle, client]);

  const pick = (p: Pt) => { setQ(''); setRemote([]); setFocus(false); onPick(p); };
  const here = async () => {
    setBusy(true);
    try { const r = await locate(client); if (r !== 'denied') pick(r); } catch { /* position unavailable */ } finally { setBusy(false); }
  };

  return (
    <View ref={box} style={{ gap: Spacing.one }}>
      <Field bg={onCard ? t.background : undefined} icon={icon} value={q} onChangeText={setQ} onFocus={() => { setFocus(true); reveal(box.current); }} placeholder={placeholder} accessibilityLabel={placeholder} returnKeyType="search" autoCorrect={false}
        onSubmitEditing={() => hits[0] && pick(hits[0])}
        // delay so a tap on a suggestion lands before the list unmounts
        onBlur={() => setTimeout(() => setFocus(false), 150)}
      />
      {focus && (
        <Animated.View entering={fx.fade} exiting={fx.out} style={{ borderRadius: Radius.card + 10, backgroundColor: t.background, borderWidth: 1, borderColor: t.borderStrong, overflow: 'hidden' }}>
          {withLocate && !needle && (
            <Pressable accessibilityRole="button" onPress={here} style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.6 : 1 }]}>
              <IconBtn icon={busy ? 'sync' : 'locate'} label={tr('myLocation')} size={32} active />
              <Txt style={{ flex: 1 }}>{tr('myLocation')}</Txt>
            </Pressable>
          )}
          {hits.map((h, i) => (
            <Pressable key={`${h.name}${i}`} testID={`hit-${i}`} accessibilityRole="button" onPress={() => pick(h)} style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.6 : 1 }]}>
              <View style={{ width: 32, alignItems: 'center' }}><Icon name={h.icon} color={t.textSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Txt numberOfLines={1}>{h.name}</Txt>
                {h.sub ? <Txt v="sub" numberOfLines={1}>{h.sub}</Txt> : null}
              </View>
            </Pressable>
          ))}
          {needle && hits.length === 0 && <Txt v="sub" style={{ padding: Spacing.three }}>{searching ? `${tr('search')}…` : tr('noResults')}</Txt>}
        </Animated.View>
      )}
    </View>
  );
}

const rowStyle = { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 10, paddingHorizontal: Spacing.three } as const;
