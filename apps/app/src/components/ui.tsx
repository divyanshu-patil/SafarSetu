import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Host, Switch as NativeSwitch } from '@expo/ui';
import { Stack } from 'expo-router';
import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shared motion: short, subtle; Reanimated drops these automatically when Reduce Motion is on. */
export const fx = {
  in: (i = 0) => FadeInDown.delay(Math.min(i, 8) * 40).duration(240),
  fade: FadeIn.duration(180),
  out: FadeOut.duration(140),
  layout: LinearTransition.duration(240),
};

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

/** Lets a field ask its screen to scroll it clear of the keyboard (and clear of its own suggestion list). */
const RevealCtx = createContext<(node: any) => void>(() => {});
export const useReveal = () => useContext(RevealCtx);
/** Lets a drag gesture freeze the surrounding scroll view while it runs. */
const ScrollLockCtx = createContext<(locked: boolean) => void>(() => {});
export const useScrollLock = () => useContext(ScrollLockCtx);

/** Scroll screen. The ScrollView is the screen's first child so the native header and tab bar can inset it and blur behind it. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  const sv = useRef<any>(null); // RN 0.88 types the instance oddly; only scrollTo is used
  const [locked, setLocked] = useState(false);
  const [extra, setExtra] = useState(0); // room below the content so a field near the bottom can still be scrolled up to the header
  useEffect(() => { const h = Keyboard.addListener('keyboardDidHide', () => setExtra(0)); return () => h.remove(); }, []);
  const scrollY = useRef(0); // includes the negative offset the native header inset adds at rest
  const reveal = (node: any) => {
    setExtra(500);
    // after the keyboard is up, park the field just under the header: suggestions below it get all the space the keyboard leaves
    setTimeout(() => {
      node?.measureInWindow?.((_x: number, y: number) => {
        const below = Platform.OS === 'ios' ? 150 : 120; // window y just under the native header (insets inside a native-header screen don't include it)
        sv.current?.scrollTo({ y: scrollY.current + (y - below), animated: true });
      });
    }, 300);
  };
  return (
    <RevealCtx.Provider value={reveal}>
      <ScrollLockCtx.Provider value={setLocked}>
      <ScrollView ref={sv} scrollEnabled={!locked} scrollEventThrottle={16} onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }} style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.five + (ios ? 0 : insets.bottom) + extra, alignItems: 'center' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three }}>{children}</View>
      </ScrollView>
      {footer && <View style={[styles.footer, { backgroundColor: t.background, borderColor: t.border, paddingBottom: Spacing.two + insets.bottom }]}>{footer}</View>}
      </ScrollLockCtx.Provider>
    </RevealCtx.Provider>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: 'select' }) {
  const t = useTheme();
  return <Animated.View layout={fx.layout} entering={fx.fade} style={[styles.card, { backgroundColor: tint ? t.backgroundSelected : t.backgroundElement }, style]}>{children}</Animated.View>;
}

export { Btn } from './btn';

/** Native toggle. */
export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) {
  const t = useTheme();
  return (
    <Host matchContents seedColor={t.brandSolid}>
      <NativeSwitch value={value} onValueChange={onValueChange} label={label} />
    </Host>
  );
}

export function IconBtn({ icon, label, onPress, active, disabled, size = 36, testID }: { icon: IconName; label: string; onPress?: () => void; active?: boolean; disabled?: boolean; size?: number; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.accent : t.backgroundElement, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={size * 0.5} color={active ? t.onAccent : t.textStrong} />
    </Pressable>
  );
}

export function Chip({ label, icon, selected, onPress }: { label: string; icon?: IconName; selected?: boolean; onPress?: () => void }) {
  const t = useTheme();
  const fg = selected ? '#ffffff' : t.textStrong;
  return (
    <Pressable testID={`chip-${label}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.chip, { maxWidth: '100%', borderWidth: 1, borderColor: selected ? t.brandSolid : t.borderStrong, backgroundColor: selected ? t.brandSolid : t.backgroundElement, opacity: pressed ? 0.75 : 1 }]}>
      {icon && <Ionicons name={icon} size={14} color={fg} />}
      <Text numberOfLines={1} style={{ fontFamily: Font.medium, fontSize: 13, color: fg, flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}

export { Seg } from './seg';

export function Field({ icon, style, bg, ...p }: TextInputProps & { icon?: IconName; bg?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.field, { borderColor: t.borderStrong, borderRadius: p.multiline ? Radius.card + 10 : Radius.pill, backgroundColor: bg ?? t.backgroundElement, alignItems: p.multiline ? 'flex-start' : 'center', paddingTop: p.multiline ? 12 : 0 }]}>
      {icon && <Ionicons name={icon} size={18} color={t.textSecondary} style={p.multiline ? { marginTop: 1 } : undefined} />}
      <TextInput placeholderTextColor={t.textSecondary} {...p} style={[{ flex: 1, fontFamily: Font.regular, fontSize: 16, color: t.textStrong, paddingTop: p.multiline ? 0 : 12, paddingBottom: p.multiline ? 12 : 12 }, style]} />
    </View>
  );
}

/** Native bottom sheet (SwiftUI sheet / Material bottom sheet). */
export function Sheet({ visible, title, onClose, children, half }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; half?: boolean }) {
  const { width } = useWindowDimensions(); // the native sheet sizes its content to fit, so give it the full width explicitly
  const t = useTheme();
  return (
    <Host style={{ position: 'absolute' }}>
      <BottomSheet isPresented={visible} onDismiss={onClose} snapPoints={half ? ['half', 'full'] : ['full']} contentPadding={0}>
        {/* pinned header: centred title, close at the trailing edge, hairline under it once content scrolls */}
        <ScrollView style={{ width }} stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: Spacing.five }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.three, backgroundColor: t.background, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
            <View style={{ width: 36 }} />
            <Txt v="h2" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>{title}</Txt>
            <IconBtn icon="close" label="Close" size={36} onPress={onClose} />
          </View>
          <View style={{ padding: Spacing.three, paddingTop: Spacing.four, gap: Spacing.four }}>{children}</View>
        </ScrollView>
      </BottomSheet>
    </Host>
  );
}

export const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <Animated.View entering={fx.in()} exiting={fx.out} layout={fx.layout} style={{ gap: Spacing.two }}>
    <Txt v="label">{label}</Txt>
    {children}
  </Animated.View>
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
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, paddingVertical: 9, paddingHorizontal: 15 },
  field: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1.5, paddingHorizontal: 18, minHeight: 50 },
  srow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10 },
  sicon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
