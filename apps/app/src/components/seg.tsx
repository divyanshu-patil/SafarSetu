import { Host, Picker } from '@expo/ui';

export interface SegProps<T extends string> { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }

/** Web fallback; iOS and Android use seg.ios.tsx / seg.android.tsx. */
export function Seg<T extends string>({ options, value, onChange }: SegProps<T>) {
  return (
    <Host matchContents>
      <Picker selectedValue={value} onValueChange={onChange}>
        {options.map((o) => <Picker.Item key={o.id} label={o.label} value={o.id} />)}
      </Picker>
    </Host>
  );
}
