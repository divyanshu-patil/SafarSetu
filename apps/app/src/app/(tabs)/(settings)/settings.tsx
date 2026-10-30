import { useFocusEffect, router } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import { LANG_LABEL, type Lang } from '@repo/core';

import { Btn, Card, Chip, Field, Group, Header, Icon, Row, Screen, Seg, Toggle, Txt, Wrap } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { askNotifications, notificationsAllowed } from '@/lib/notify';
import { DEFAULT_SERVER } from '@/lib/api';
import { useSettings } from '@/lib/settings';

const MODES = [['local', 'train'], ['express', 'train'], ['metro', 'subway'], ['bus', 'bus'], ['cab', 'car']] as const;

export default function SettingsScreen() {
  const th = useTheme();
  const s = useSettings();
  const { t, client } = s;
  const [osNotif, setOsNotif] = useState(true);
  const [osLoc, setOsLoc] = useState(true);
  const [online, setOnline] = useState<boolean | null>(null);
  const [server, setServer] = useState(s.server);

  // permissions can change in system settings while we're away, so re-read them on focus
  useFocusEffect(useCallback(() => {
    notificationsAllowed().then(setOsNotif);
    Location.getForegroundPermissionsAsync().then((p) => setOsLoc(p.granted)).catch(() => {});
    fetch(`${client.baseUrl}/health`).then((r) => setOnline(r.ok)).catch(() => setOnline(false));
  }, [client]));

  const toggleNotify = async (on: boolean) => {
    s.set({ notify: on });
    if (on) setOsNotif(await askNotifications());
  };
  const saveServer = () => { const v = server.trim().replace(/\/+$/, ''); s.set({ server: v || DEFAULT_SERVER }); };

  return (
    <>
    <Header title={t('settings')} />
    <Screen>
      <Group label={t('language')}>
        <Seg options={(Object.keys(LANG_LABEL) as Lang[]).map((l) => ({ id: l, label: LANG_LABEL[l] }))} value={s.lang} onChange={(lang) => s.set({ lang })} />
      </Group>

      <Card>
        <Row icon="notifications-outline" title={t('notifications')} hint={s.notify && !osNotif ? t('notifDenied') : t('notifOn')}
          right={<Toggle value={s.notify && osNotif} onValueChange={toggleNotify} />} />
        {s.notify && !osNotif && <Btn kind="soft" label={t('openSettings')} onPress={() => Linking.openSettings()} />}
        <Row icon="locate-outline" title={t('location')} hint={osLoc ? t('locOn') : t('notifDenied')}
          right={osLoc ? <Icon name="checkmark-circle" size={20} color={th.brand} /> : <Chip label={t('openSettings')} onPress={async () => { const p = await Location.requestForegroundPermissionsAsync(); setOsLoc(p.granted); if (!p.granted) Linking.openSettings(); }} />} />
      </Card>

      <Group label={t('appearance')}>
        <Field icon="person-outline" value={s.name} onChangeText={(name) => s.set({ name })} placeholder={t('optionalName')} accessibilityLabel={t('yourName')} />
        <Txt v="sub">{t('pace')}</Txt>
        <Seg options={(['gentle', 'relaxed', 'normal', 'fast'] as const).map((p) => ({ id: p, label: t(p) }))} value={s.pace} onChange={(pace) => s.set({ pace })} />
        <Txt v="sub">{t('alerts')}</Txt>
        <Seg options={(['calm', 'brief'] as const).map((p) => ({ id: p, label: t(p) }))} value={s.style} onChange={(style) => s.set({ style })} />
        <Txt v="sub">{t('transport')}</Txt>
        <Wrap>{MODES.map(([k, icon]) => <Chip key={k} icon={icon} label={t(k)} selected={!s.avoid.includes(k)} onPress={() => s.set({ avoid: s.avoid.includes(k) ? s.avoid.filter((a) => a !== k) : [...s.avoid, k] })} />)}</Wrap>
      </Group>

      <Group label={t('savedPlaces')}>
        {s.saved.length === 0 ? <Txt v="sub">{t('nothingSaved')}</Txt> : <Wrap>{s.saved.map((p) => <Chip key={p.name + p.lat} icon="close" label={p.name} onPress={() => s.toggleSaved(p)} />)}</Wrap>}
        {s.recents.length > 0 && <Btn kind="ghost" label={`${t('clearRecents')} (${s.recents.length})`} onPress={() => s.set({ recents: [] })} />}
      </Group>

      <Card>
        <Row icon="stats-chart-outline" title={t('insights')} onPress={() => router.push('/insights')} />
        <Row icon="server-outline" title={t('server')} hint={online === null ? ' ' : online ? t('online') : t('offline')}
          right={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: online ? th.brand : th.danger }} />} />
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <View style={{ flex: 1 }}><Field value={server} onChangeText={setServer} onEndEditing={saveServer} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder={t('serverHint')} accessibilityLabel={t('serverHint')} /></View>
          <Chip label={t('serverReset')} onPress={() => { setServer(DEFAULT_SERVER); s.set({ server: DEFAULT_SERVER }); }} />
        </View>
      </Card>

      <Txt v="sub" style={{ textAlign: 'center' }}>{t('aboutText')}</Txt>
    </Screen>
    </>
  );
}
