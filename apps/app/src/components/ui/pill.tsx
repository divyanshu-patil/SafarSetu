import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Primary = lime fill (one per screen section); outline = Forest Ink 1px. Always fully rounded. */
export function PillButton({ label, onPress, variant = 'primary', disabled }: { label: string; onPress?: () => void; variant?: 'primary' | 'outline'; disabled?: boolean }) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        primary ? { backgroundColor: disabled ? t.backgroundElement : t.accent } : { borderColor: t.brand, borderWidth: 1 },
        pressed && { opacity: 0.8 },
      ]}>
      <ThemedText style={{ fontFamily: Font.medium, color: primary ? t.onAccent : t.brand }}>{label}</ThemedText>
    </Pressable>
  );
}

/** Pill-shaped segmented control: active segment is lime. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.backgroundElement }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={[styles.segItem, on && { backgroundColor: t.accent }]}>
            <ThemedText type="small" style={{ fontFamily: on ? Font.semibold : Font.medium, color: on ? t.onAccent : t.text }}>{o.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Selectable chip: selected = Forest Ink fill. */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, { borderColor: selected ? t.brand : t.border, backgroundColor: selected ? '#163300' : t.background }]}>
      <ThemedText type="small" style={{ color: selected ? '#ffffff' : t.brand, fontFamily: Font.medium }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: Radius.pill, paddingVertical: 11, paddingHorizontal: 24, alignItems: 'center', alignSelf: 'flex-start' },
  seg: { flexDirection: 'row', borderRadius: Radius.pill, padding: 3, alignSelf: 'flex-start', gap: 2 },
  segItem: { borderRadius: Radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});
