import DateTimePicker from '@expo/ui/community/datetime-picker';
import { View } from 'react-native';

import { Chip, IconBtn } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { fromHHMM, toHHMM } from '@/lib/plan';

const toDate = (s: string) => { const d = new Date(); const m = fromHHMM(s) ?? 540; d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; };

/** Native time picker (no free typing, no keyboard). With `optional`, an empty value shows an "add" chip instead. */
export function TimePick({ value, onChange, optional, label, fallback = '09:00' }: { value: string; onChange: (v: string) => void; optional?: boolean; label: string; fallback?: string }) {
  if (!value) return <Chip label={label} icon="add" onPress={() => onChange(fallback)} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <DateTimePicker value={toDate(value)} mode="time" display="compact" is24Hour locale="en-GB" onChange={(_, d) => d && onChange(toHHMM(d.getHours() * 60 + d.getMinutes()))} />
      {optional && <IconBtn icon="close" label="Clear" size={28} onPress={() => onChange('')} />}
    </View>
  );
}
