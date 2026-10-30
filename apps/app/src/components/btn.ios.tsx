import { Host } from '@expo/ui';
import { Button, Text } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, disabled as disabledMod, frame } from '@expo/ui/swift-ui/modifiers';

import type { BtnProps } from './btn';
import { useTheme } from '@/hooks/use-theme';

/** SwiftUI capsule button; full-width ones stretch to the container. */
export function Btn({ label = '', onPress, kind = 'primary', busy, disabled, full = true }: BtnProps) {
  const t = useTheme();
  return (
    <Host matchContents={{ vertical: true, horizontal: !full }} seedColor={t.brandSolid} style={full ? { width: '100%' } : undefined}>
      <Button onPress={onPress}
        modifiers={[
          buttonStyle(kind === 'primary' ? 'borderedProminent' : kind === 'soft' ? 'bordered' : 'borderless'),
          buttonBorderShape('capsule'),
          controlSize('large'),
          ...(disabled || busy ? [disabledMod(true)] : []),
        ]}>
        {/* the frame goes on the label: a frame on the button itself leaves the capsule hugging its text */}
        <Text modifiers={full ? [frame({ maxWidth: 10000 })] : []}>{busy ? '…' : label}</Text>
      </Button>
    </Host>
  );
}
