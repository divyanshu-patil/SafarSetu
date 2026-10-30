import { Host } from '@expo/ui';
import { Button, OutlinedButton, Text, TextButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import type { BtnProps } from './btn';
import { useTheme } from '@/hooks/use-theme';

/** Material 3 button; full-width ones stretch to the container. */
export function Btn({ label = '', onPress, kind = 'primary', busy, disabled, full = true }: BtnProps) {
  const t = useTheme();
  const Comp = kind === 'primary' ? Button : kind === 'soft' ? OutlinedButton : TextButton;
  return (
    <Host matchContents={{ vertical: true, horizontal: !full }} style={full ? { width: '100%' } : undefined}>
      <Comp onClick={onPress} enabled={!(disabled || busy)} modifiers={full ? [fillMaxWidth()] : []}
        colors={kind === 'primary' ? { containerColor: t.brandSolid, contentColor: '#ffffff' } : { contentColor: t.brand }}>
        <Text>{busy ? '…' : label}</Text>
      </Comp>
    </Host>
  );
}
