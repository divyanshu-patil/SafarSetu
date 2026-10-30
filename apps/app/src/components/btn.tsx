import { Button as NativeButton, Host } from '@expo/ui';

import type { IconName } from './ui';
import { useTheme } from '@/hooks/use-theme';

export interface BtnProps { label?: string; icon?: IconName; onPress?: () => void; kind?: 'primary' | 'soft' | 'ghost'; busy?: boolean; disabled?: boolean; full?: boolean }

/** Web fallback; iOS and Android use btn.ios.tsx / btn.android.tsx. */
export function Btn({ label = '', onPress, kind = 'primary', busy, disabled, full = true }: BtnProps) {
  const t = useTheme();
  return (
    <Host matchContents={{ vertical: true, horizontal: !full }} seedColor={t.brandSolid} style={full ? { width: '100%' } : undefined}>
      <NativeButton label={busy ? '…' : label} variant={kind === 'primary' ? 'filled' : kind === 'soft' ? 'outlined' : 'text'} disabled={disabled || busy} onPress={onPress} />
    </Host>
  );
}
