import { Host } from '@expo/ui';
import { Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import type { SegProps } from './seg';

/** UISegmentedControl via SwiftUI. */
export function Seg<T extends string>({ options, value, onChange }: SegProps<T>) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Picker selection={value} onSelectionChange={(v: T) => onChange(v)} modifiers={[pickerStyle('segmented')]}>
        {options.map((o) => <Text key={o.id} modifiers={[tag(o.id)]}>{o.label}</Text>)}
      </Picker>
    </Host>
  );
}
