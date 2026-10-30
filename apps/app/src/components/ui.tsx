import { Ionicons } from '@expo/vector-icons';
import { Button as NativeButton, BottomSheet, Host, Switch as NativeSwitch } from '@expo/ui';
import { Stack } from 'expo-router';
import { type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export const Icon = ({ name, size = 18, color }: { name: IconName; size?: number; color?: string }) => {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.text} />;
};

type Variant = 'h1' | 'h2' | 'body' | 'sub' | 'label' | 'num';
const V: Record<Variant, TextStyle> = {
  h1: { fontFamily: Font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  h2: { fontFamily: Font.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 21 },
  sub: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Font.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  num: { fontFamily: Font.black, fontSize: 24, lineHeight: 28, letterSpacing: -0.8 },
};
/** Colour hierarchy: strong → body → muted. One text component keeps size/colour consistent. */
export function Txt({ v = 'body', tone, style, ...p }: { v?: Variant; tone?: 'strong' | 'muted' | 'brand' | 'danger' | 'info' | 'accent' } & React.ComponentProps<typeof Text>) {
  const t = useTheme();
  const color = tone === 'muted' ? t.textSecondary : tone === 'brand' ? t.brand : tone === 'danger' ? t.danger : tone === 'info' ? t.info : tone === 'accent' ? t.accent : v === 'sub' || v === 'label' ? t.textSecondary : t.textStrong;
  return <Text {...p} style={[{ color }, V[v], style]} />;
}

/** Native header (large title, back button, toolbar actions). Place once per screen. */
export interface HeaderAction { sf: string; icon: IconName; label: string; onPress: () => void }
export function Header({ title, large = true, actions = [] }: { title: string; large?: boolean; actions?: HeaderAction[] }) {
  const ios = Platform.OS === 'ios';
  return (
    <>
      <Stack.Screen options={{
        title,
        headerLargeTitleEnabled: ios && large,
        headerRight: !ios && actions.length ? () => <View style={{ flexDirection: 'row', gap: Spacing.two }}>{actions.map((a) => <IconBtn key={a.label} icon={a.icon} label={a.label} onPress={a.onPress} />)}</View> : undefined,
      }} />
      {ios && actions.length > 0 && (
        <Stack.Toolbar placement="right">
          {actions.map((a) => <Stack.Toolbar.Button key={a.label} icon={a.sf as never} accessibilityLabel={a.label} onPress={a.onPress} />)}
        </Stack.Toolbar>
      )}
    </>
  );
}

/** Scroll screen. The ScrollView is the screen's first child so the native header and tab bar can inset it and blur behind it. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.five + (ios ? 0 : insets.bottom), alignItems: 'center' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three }}>{children}</View>
      </ScrollView>
      {footer && <View style={[styles.footer, { backgroundColor: t.background, borderColor: t.border, paddingBottom: Spacing.two + insets.bottom }]}>{footer}</View>}
    </>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: 'select' }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: tint ? t.backgroundSelected : t.backgroundElement }, style]}>{children}</View>;
}

/** Native button (SwiftUI / Material). Icons are dropped: the platform button is label-only. */
export function Btn({ label = '', onPress, kind = 'primary', busy, disabled, full = true }: { label?: string; icon?: IconName; onPress?: () => void; kind?: 'primary' | 'soft' | 'ghost'; busy?: boolean; disabled?: boolean; full?: boolean }) {
  const t = useTheme();
  return (
    <Host matchContents={{ vertical: true, horizontal: !full }} seedColor={t.brandSolid} style={full ? { width: '100%' } : undefined}>
      <NativeButton label={busy ? '…' : label} variant={kind === 'primary' ? 'filled' : kind === 'soft' ? 'outlined' : 'text'} disabled={disabled || busy} onPress={onPress} style={full ? { width: '100%' } : undefined} />
    </Host>
  );
}

/** Native toggle. */
export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) {
  const t = useTheme();
  return (
    <Host matchContents seedColor={t.brandSolid}>
      <NativeSwitch value={value} onValueChange={onValueChange} label={label} />
    </Host>
  );
}

export function IconBtn({ icon, label, onPress, active, disabled, size = 36 }: { icon: IconName; label: string; onPress?: () => void; active?: boolean; disabled?: boolean; size?: number }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.accent : t.backgroundElement, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={size * 0.5} color={active ? t.onAccent : t.textStrong} />
    </Pressable>
  );
}

export function Chip({ label, icon, selected, onPress }: { label: string; icon?: IconName; selected?: boolean; onPress?: () => void }) {
  const t = useTheme();
  const fg = selected ? '#ffffff' : t.textStrong;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: selected ? t.brandSolid : t.backgroundElement, opacity: pressed ? 0.75 : 1 }]}>
      {icon && <Ionicons name={icon} size={14} color={fg} />}
      <Text style={{ fontFamily: Font.medium, fontSize: 13, color: fg }}>{label}</Text>
    </Pressable>
  );
}

export { Seg } from './seg';

export function Field({ icon, style, ...p }: TextInputProps & { icon?: IconName }) {
  const t = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: t.backgroundElement }]}>
      {icon && <Ionicons name={icon} size={18} color={t.textSecondary} />}
      <TextInput placeholderTextColor={t.textSecondary} {...p} style={[{ flex: 1, fontFamily: Font.regular, fontSize: 16, color: t.textStrong, paddingVertical: 12 }, style]} />
    </View>
  );
}

/** Native bottom sheet (SwiftUI sheet / Material bottom sheet). */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Host style={{ position: 'absolute' }}>
      <BottomSheet isPresented={visible} onDismiss={onClose} snapPoints={['full']}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four }} keyboardShouldPersistTaps="handled">
          <Txt v="h2">{title}</Txt>
          {children}
        </ScrollView>
      </BottomSheet>
    </Host>
  );
}

export const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <View style={{ gap: Spacing.two }}>
    <Txt v="label">{label}</Txt>
    {children}
  </View>
);
export const Wrap = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>{children}</View>;

/** Settings-style row: icon · title (+hint) · trailing control. */
export function Row({ icon, title, hint, right, onPress }: { icon: IconName; title: string; hint?: string; right?: ReactNode; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.srow, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.sicon, { backgroundColor: t.backgroundSelected }]}><Ionicons name={icon} size={17} color={t.brand} /></View>
      <View style={{ flex: 1 }}>
        <Txt v="body" style={{ fontFamily: Font.medium }}>{title}</Txt>
        {hint ? <Txt v="sub">{hint}</Txt> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={t.textSecondary} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: Radius.card + 6, padding: Spacing.three, gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  field: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: Radius.card + 4, paddingHorizontal: 14 },
  srow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10 },
  sicon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
