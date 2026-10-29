/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Design tokens from docs/DESIGN.md (Wise-style): Forest Ink + Lime Voltage, Fog/Linen surfaces.
export const Colors = {
  light: {
    text: '#454745', // Charcoal
    textStrong: '#0e0f0c', // Obsidian
    background: '#ffffff', // Paper
    backgroundElement: '#e8ebe6', // Fog
    backgroundSelected: '#e2f6d5', // Linen Mist
    textSecondary: '#6a6c6a', // Slate
    brand: '#163300', // Forest Ink
    accent: '#9fe870', // Lime Voltage (primary action / active only)
    onAccent: '#163300',
    border: 'rgba(14,15,12,0.12)',
    danger: '#cb272f',
    info: '#0b4c72',
  },
  dark: {
    text: '#e8ebe6',
    textStrong: '#ffffff',
    background: '#0e0f0c',
    backgroundElement: '#163300',
    backgroundSelected: '#054d28',
    textSecondary: '#b6bcb3',
    brand: '#9fe870',
    accent: '#9fe870',
    onAccent: '#163300',
    border: 'rgba(255,255,255,0.14)',
    danger: '#ff7b80',
    info: '#7cc4ee',
  },
} as const;

/** Inter weights loaded in _layout (Black 900 stands in for Wise Sans display type) */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
} as const;

/** semantic accents for modes / categories (icon + text only, never fills of large areas) */
export const ModeColor = { metro: '#0e7490', train: '#be123c', bus: '#c2410c', walk: '#475569', cab: '#a16207' } as const;

export const Radius = { card: 10, large: 28, pill: 9999 } as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
