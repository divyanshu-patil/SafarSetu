import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

const TABS = [
  { name: '(plan)', label: 'plan', sf: ['location', 'location.fill'], md: 'navigation' },
  { name: '(trip)', label: 'trip', sf: ['clock', 'clock.fill'], md: 'schedule' },
  { name: '(report)', label: 'report', sf: ['flag', 'flag.fill'], md: 'flag' },
  { name: '(settings)', label: 'settings', sf: ['gearshape', 'gearshape.fill'], md: 'settings' },
] as const;

export default function TabsLayout() {
  const th = useTheme();
  const { t } = useSettings();
  return (
    <NativeTabs backgroundColor={th.background} indicatorColor={th.accent} tintColor={th.brand}>
      {TABS.map((x) => (
        <NativeTabs.Trigger key={x.name} name={x.name}>
          <NativeTabs.Trigger.Label>{t(x.label)}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: x.sf[0], selected: x.sf[1] }} md={x.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
