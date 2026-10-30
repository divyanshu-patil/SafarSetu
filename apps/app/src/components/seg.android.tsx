import { Host } from '@expo/ui';
import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import type { SegProps } from './seg';

/** Material 3 single-choice segmented button row. */
export function Seg<T extends string>({ options, value, onChange }: SegProps<T>) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
        {options.map((o) => (
          <SegmentedButton key={o.id} selected={o.id === value} onClick={() => onChange(o.id)}>
            <SegmentedButton.Label><Text>{o.label}</Text></SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}
