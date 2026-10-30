import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** One native stack per tab: system large titles, blur and back button come for free (iOS); plain Material header on Android. */
export default function StackLayout() {
  const t = useTheme();
  const ios = Platform.OS === 'ios';
  return (
    <Stack screenOptions={{
      headerLargeTitleEnabled: ios,
      headerTransparent: ios,
      headerShadowVisible: false,
      headerLargeTitleShadowVisible: false,
      headerLargeStyle: { backgroundColor: 'transparent' },
      headerBackButtonDisplayMode: 'minimal',
      headerTintColor: t.brand,
      headerTitleStyle: { color: t.textStrong },
      contentStyle: { backgroundColor: t.background },
    }} />
  );
}
