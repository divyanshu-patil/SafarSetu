import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { LatLon, MapLine, MapMarker } from '@repo/core';

import { Font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface RouteMapProps { lines?: MapLine[]; markers?: MapMarker[]; me?: (LatLon & { label: string }) | null; height?: number }

export default function RouteMap({ lines = [], markers = [], me, height = 260 }: RouteMapProps) {
  const t = useTheme();
  const ref = useRef<MapView>(null);
  const coords = [...markers.map((m) => ({ latitude: m.lat, longitude: m.lon })), ...lines.flatMap((l) => l.coords.map(([a, b]) => ({ latitude: a, longitude: b })))];
  const key = coords.length + ':' + (coords[0]?.latitude ?? 0) + (coords.at(-1)?.longitude ?? 0);
  useEffect(() => {
    if (coords.length) ref.current?.fitToCoordinates(coords, { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <MapView ref={ref} style={{ height, borderRadius: 20 }} initialRegion={{ latitude: 18.7, longitude: 73.4, latitudeDelta: 1.2, longitudeDelta: 1.2 }} showsUserLocation toolbarEnabled={false} onMapReady={() => coords.length && ref.current?.fitToCoordinates(coords, { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: false })}>
      {lines.map((l, i) => <Polyline key={i} coordinates={l.coords.map(([a, b]) => ({ latitude: a, longitude: b }))} strokeColor={l.color} strokeWidth={l.dashed ? 3 : 5} lineDashPattern={l.dashed ? [6, 6] : undefined} />)}
      {markers.map((m, i) => (
        <Marker key={i} coordinate={{ latitude: m.lat, longitude: m.lon }} title={m.label} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.pin, { backgroundColor: m.kind === 'origin' ? t.accent : t.brandSolid }]}><Text style={{ fontFamily: Font.bold, fontSize: 12, color: m.kind === 'origin' ? t.onAccent : '#fff' }}>{m.text}</Text></View>
        </Marker>
      ))}
      {me && <Marker coordinate={{ latitude: me.lat, longitude: me.lon }} title={me.label} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.me} /></Marker>}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  me: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#2563eb', borderWidth: 3, borderColor: '#fff' },
});
