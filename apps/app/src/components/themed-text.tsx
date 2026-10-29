import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Font, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'kicker' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

const STRONG = new Set(['title', 'subtitle']);

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (STRONG.has(type) ? 'textStrong' : type === 'kicker' || type === 'link' ? 'brand' : 'text')];
  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: { fontFamily: Font.medium, fontSize: 14, lineHeight: 21, letterSpacing: -0.07 },
  smallBold: { fontFamily: Font.bold, fontSize: 14, lineHeight: 21, letterSpacing: -0.07 },
  default: { fontFamily: Font.regular, fontSize: 16, lineHeight: 24, letterSpacing: -0.1 },
  // display: Inter Black 900, uppercase, tight (Wise Sans stand-in)
  title: { fontFamily: Font.black, fontSize: 44, lineHeight: 40, letterSpacing: -1.8, textTransform: 'uppercase' },
  subtitle: { fontFamily: Font.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  kicker: { fontFamily: Font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase' },
  link: { fontFamily: Font.medium, fontSize: 15, lineHeight: 24, textDecorationLine: 'underline' },
  linkPrimary: { fontFamily: Font.medium, fontSize: 15, lineHeight: 24, textDecorationLine: 'underline', color: '#163300' },
  code: { fontFamily: Fonts.mono, fontWeight: Platform.select({ android: 700 }) ?? 500, fontSize: 12 },
});
