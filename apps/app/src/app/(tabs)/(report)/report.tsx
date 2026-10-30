import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CATEGORIES, networks, PROMISE, STATUSES, type PublicReport, type ReportCategory } from '@repo/core';

import { PlaceInput, type Pt } from '@/components/place-input';
import { Btn, Card, Chip, Field, Group, Header, Icon, IconBtn, Screen, Sheet, Txt, Wrap, type IconName } from '@/components/ui';
import { Font, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

const CAT_ICON: Record<ReportCategory, IconName> = { no_feeder: 'bus', infrequent: 'hourglass', poor_transfer: 'shuffle', long_wait: 'time', hard_to_reach: 'walk', obstructed: 'construct', accessibility: 'accessibility', wrong_info: 'document-text', missing_info: 'location', other: 'help-circle' };
const STATUS_ICON: Record<string, IconName> = { received: 'mail', under_review: 'search', more_info: 'chatbubble-ellipses', referred: 'paper-plane', action_planned: 'calendar', resolved: 'checkmark-circle', closed: 'archive' };

export default function ReportScreen() {
  const th = useTheme();
  const { t, client } = useSettings();
  const [cat, setCat] = useState<ReportCategory | null>(null);
  const [from, setFrom] = useState<Pt | null>(null);
  const [to, setTo] = useState<Pt | null>(null);
  const [sev, setSev] = useState<1 | 2 | 3>(2);
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<PublicReport | null>(null);
  const [track, setTrack] = useState<string | null>(null);

  // suggestions come from every region's places, de-duplicated by name
  const places = useMemo(() => [...new Map(Object.values(networks).flatMap((n) => n.places).map((p) => [p.name, p])).values()], []);

  const submit = async () => {
    if (!cat) return setErr(t('problem'));
    if (!from) return setErr(t('from'));
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`${client.baseUrl}/v1/reports`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-user-id': 'mobile-demo' }, body: JSON.stringify({ category: cat, severity: sev, from, to: to ?? undefined, mode: 'any', description: desc }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message ?? t('error'));
      setDone(j.report);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const reset = () => { setDone(null); setCat(null); setFrom(null); setTo(null); setDesc(''); setErr(null); };

  return (
    <>
    <Header title={t('reportTitle')} actions={[{ sf: 'magnifyingglass', icon: 'search', label: t('track'), onPress: () => setTrack('') }]} />
    <Screen footer={!done ? <><Btn label={busy ? t('sending') : t('send')} busy={busy} onPress={submit} />{err && <Txt v="sub" tone="danger" style={{ textAlign: 'center', paddingTop: 6 }}>{err}</Txt>}</> : undefined}>
      {done ? (
        <Card tint="select" style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.two }}>
          <Icon name="checkmark-circle" size={44} color={th.brand} />
          <Txt v="label">{t('refNo')}</Txt>
          <Txt v="num" selectable style={{ fontSize: 32, lineHeight: 36 }}>{done.ref}</Txt>
          <Txt v="sub" style={{ textAlign: 'center', color: th.text }}>{PROMISE}</Txt>
          <View style={{ height: Spacing.two }} />
          <Btn kind="soft" label={t('track')} onPress={() => setTrack(done.ref)} />
          <Btn kind="ghost" label={t('another')} onPress={reset} />
        </Card>
      ) : (
        <>
          <Txt v="sub">{t('reportHint')}</Txt>
          <Group label={t('problem')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
              {(Object.keys(CATEGORIES) as ReportCategory[]).map((k) => {
                const on = cat === k;
                return (
                  <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setCat(k)}
                    style={{ width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 12, borderRadius: Radius.card + 4, backgroundColor: on ? th.backgroundSelected : th.backgroundElement, borderWidth: 2, borderColor: on ? th.brand : 'transparent' }}>
                    <Icon name={CAT_ICON[k]} size={18} color={CATEGORIES[k].color} />
                    <Txt v="sub" style={{ flex: 1, color: th.textStrong, fontFamily: Font.medium }} numberOfLines={2}>{CATEGORIES[k].label}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </Group>
          <Group label={t('from')}><Area value={from} onChange={setFrom} places={places} placeholder={t('search')} /></Group>
          <Group label={t('to')}><Area value={to} onChange={setTo} places={places} placeholder={t('search')} /></Group>
          <Group label={t('how')}><Wrap>{([[1, 'minor'], [2, 'real'], [3, 'serious']] as const).map(([v, l]) => <Chip key={v} label={t(l)} selected={sev === v} onPress={() => setSev(v)} />)}</Wrap></Group>
          <Field icon="create-outline" value={desc} onChangeText={setDesc} placeholder={t('describe')} multiline maxLength={600} style={{ minHeight: 70, textAlignVertical: 'top' }} accessibilityLabel={t('describe')} />
          <Txt v="sub" style={{ textAlign: 'center' }}>{t('noPersonal')}</Txt>
        </>
      )}
      <Tracker ref0={track} onClose={() => setTrack(null)} />
    </Screen>
    </>
  );
}

function Area({ value, onChange, places, placeholder }: { value: Pt | null; onChange: (p: Pt | null) => void; places: ReturnType<typeof Object.values<typeof networks[string]>>[number]['places']; placeholder: string }) {
  const th = useTheme();
  if (!value) return <PlaceInput places={places} placeholder={placeholder} onPick={onChange} />;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Icon name="location" size={18} color={th.brand} />
      <Txt style={{ flex: 1 }} numberOfLines={1}>{value.name}</Txt>
      <IconBtn icon="close" label="Clear" size={28} onPress={() => onChange(null)} />
    </Card>
  );
}

function Tracker({ ref0, onClose }: { ref0: string | null; onClose: () => void }) {
  const th = useTheme();
  const { t, client } = useSettings();
  const [q, setQ] = useState('');
  const [r, setR] = useState<PublicReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const look = async (ref: string) => {
    setErr(null); setR(null);
    try {
      const x = await fetch(`${client.baseUrl}/v1/reports/track/${encodeURIComponent(ref.trim())}`);
      const j = await x.json();
      if (!x.ok) throw new Error(j?.error?.message ?? t('error'));
      setR(j.report);
    } catch (e) { setErr((e as Error).message); }
  };
  if (ref0 && ref0 !== last) { setLast(ref0); setQ(ref0); look(ref0); } // opened with a reference: fetch it once
  const st = r ? STATUSES[r.status] : null;
  return (
    <Sheet half visible={ref0 !== null} title={t('track')} onClose={() => { setLast(null); setR(null); setQ(''); onClose(); }}>
      <Field icon="search" value={q} onChangeText={setQ} placeholder={t('trackHint')} autoCapitalize="characters" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => look(q)} accessibilityLabel={t('track')} />
      <Btn kind="soft" label={t('check')} onPress={() => look(q)} disabled={!q.trim()} />
      {err && <Txt v="sub" tone="danger">{err}</Txt>}
      {r && st && (
        <Card style={{ gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Icon name={CAT_ICON[r.category]} size={20} color={CATEGORIES[r.category].color} />
            <View style={{ flex: 1 }}>
              <Txt v="h2">{CATEGORIES[r.category].label}</Txt>
              <Txt v="sub" numberOfLines={1}>{r.from?.name}{r.to ? ` → ${r.to.name}` : ''}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>{[0, 1, 2, 3, 4].map((i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= st.step ? st.color : th.border }} />)}</View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Icon name={STATUS_ICON[r.status] ?? 'ellipse'} size={16} color={st.color} />
            <Txt style={{ color: st.color, fontFamily: Font.semibold }}>{st.label}</Txt>
          </View>
          <Txt v="sub">{st.hint}</Txt>
          {r.publicNote ? <><Txt v="label">{t('note')}</Txt><Txt>{r.publicNote}</Txt></> : null}
        </Card>
      )}
    </Sheet>
  );
}
