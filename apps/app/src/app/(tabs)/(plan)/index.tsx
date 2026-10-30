import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { fmtTime, networks, type PlanRequest } from '@repo/core';

import { PlaceInput, locate, type Pt } from '@/components/place-input';
import { ReorderList } from '@/components/reorder-list';
import { TimePick } from '@/components/time-pick';
import { Btn, Card, Chip, Field, Group, Header, Icon, IconBtn, Seg, Sheet, Toggle, Txt, Screen, Wrap, fx } from '@/components/ui';
import { Font, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { askNotifications } from '@/lib/notify';
import { EXAMPLES, fromHHMM, letter, nextQuarter, planLocally, todayISO, type Example } from '@/lib/plan';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';

const ORDER = ['maharashtra', 'mumbai', 'pune'];
const CITIES = Object.values(networks).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)).map((n) => ({ id: n.id, label: n.city }));
const DWELLS = [15, 30, 45, 60, 90, 120];
const MODES = [['local', 'local', 'train'], ['express', 'express', 'train'], ['metro', 'metro', 'subway'], ['bus', 'bus', 'bus'], ['cab', 'cab', 'car']] as const;

interface Stop extends Pt { id: string; task: string; dwell: number; by: string; required: boolean }
let uid = 0;
const stopOf = (p: Pt, o: Partial<Stop> = {}): Stop => ({ ...p, id: `s${++uid}`, task: '', dwell: 30, by: '', required: true, ...o });

export default function PlanScreen() {
  const th = useTheme();
  const s = useSettings();
  const { t, client } = s;
  const { setCurrent } = useSession();
  const [city, setCity] = useState('pune');
  const net = networks[city]!;
  const [origin, setOrigin] = useState<Pt | null>(null);
  const [editStart, setEditStart] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [leave, setLeave] = useState(nextQuarter);
  const [finish, setFinish] = useState('');
  const [day, setDay] = useState<0 | 1>(0);
  const [returnHome, setReturnHome] = useState(false);
  const [keepOrder, setKeepOrder] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setStart = (p: Pt) => { setOrigin(p); setEditStart(false); s.addRecent({ name: p.name, lat: p.lat, lon: p.lon }); };
  const addStop = (p: Pt) => { const n = stopOf(p); setStops((y) => [...y, n]); setOpen(n.id); s.addRecent({ name: p.name, lat: p.lat, lon: p.lon }); };
  // a chip tap fills the start first, then adds stops
  const usePt = (p: Pt) => (!origin || editStart ? setStart(p) : addStop(p));
  const patch = (id: string, p: Partial<Stop>) => setStops((x) => x.map((y) => (y.id === id ? { ...y, ...p } : y)));
  const reorder = (from: number, to: number) => setStops((x) => { const n = [...x]; const [m] = n.splice(from, 1); n.splice(to, 0, m!); return n; });
  const clear = () => { setOrigin(null); setStops([]); setOpen(null); setErr(null); setEditStart(false); setFinish(''); setReturnHome(false); };
  const example = (e: Example) => {
    setCity(e.city); setOrigin(e.origin); setLeave(e.leave); setReturnHome(e.returnHome); setKeepOrder(true); setErr(null); setEditStart(false);
    setStops(e.stops.map((x) => stopOf(x, { task: x.task, dwell: x.dwell, by: x.by ?? '', required: x.required })));
  };
  const useHere = async () => {
    try {
      const r = await locate(client);
      if (r === 'denied') return Alert.alert(t('location'), t('notifDenied'));
      setOrigin(r); setEditStart(false);
    } catch { setErr(t('error')); }
  };

  const run = async () => {
    setErr(null);
    if (!origin) return setErr(t('startHint'));
    if (!stops.length) return setErr(t('addStop'));
    const startMin = fromHHMM(leave);
    if (startMin === undefined) return setErr(`${t('leaveAt')} HH:MM`);
    const endMin = finish ? fromHHMM(finish) : Math.min(1439, startMin + 14 * 60);
    if (endMin === undefined) return setErr(`${t('finishBy')} HH:MM`);
    const date = new Date(Date.parse(todayISO()) + day * 864e5).toISOString().slice(0, 10);
    const req: PlanRequest = {
      city, date, origin, startMin, endMin, returnToOrigin: returnHome, keepOrder,
      prefs: { pace: s.pace, style: s.style, lang: s.lang, avoid: s.avoid as never[] },
      traveller: s.name ? { name: s.name } : undefined,
      places: stops.map((x) => ({ name: x.name, lat: x.lat, lon: x.lon, task: x.task || undefined, minDwell: x.dwell, maxDwell: x.dwell, arriveBy: fromHHMM(x.by), required: x.required, priority: x.required ? 3 : 2 })),
    };
    setBusy(true);
    try {
      // the server keeps the plan so it can be tracked live; fall back to planning on the phone when it's unreachable
      const r = await client.createPlan(req).then((x) => ({ id: x.id as string | null, plan: x.plan })).catch(() => ({ id: null, plan: planLocally(req) }));
      setCurrent(r);
      if (r.id) s.set({ lastPlan: r.id });
      if (s.notify) askNotifications();
      router.push('/result');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  // live arrival times: the same engine plans on the phone whenever the route changes, so a reorder re-times every stop
  const etas = useMemo(() => {
    const m = new Map<string, { arrive: number; fits: boolean }>();
    const startMin = fromHHMM(leave);
    if (!origin || !stops.length || startMin === undefined) return m;
    try {
      const plan = planLocally({
        city, date: todayISO(), origin, startMin, endMin: Math.min(1439, startMin + 14 * 60), returnToOrigin: false, keepOrder,
        prefs: { pace: s.pace, style: s.style, lang: s.lang, avoid: s.avoid as never[] },
        places: stops.map((x) => ({ name: x.name, lat: x.lat, lon: x.lon, minDwell: x.dwell, maxDwell: x.dwell, arriveBy: fromHHMM(x.by), required: x.required, priority: x.required ? 3 : 2 })),
      });
      for (const e of plan.timeline) if (e.kind === 'visit') m.set(e.place.name, { arrive: e.arriveMin, fits: true });
      for (const d of [...plan.dropped, ...(plan.conflicts ?? [])]) if (!m.has(d.name)) m.set(d.name, { arrive: 0, fits: false });
    } catch { /* an unroutable combination: just show no times */ }
    return m;
  }, [origin, stops, leave, city, keepOrder, s.pace, s.style, s.lang, s.avoid]);

  const empty = !origin && !stops.length;

  return (
    <>
      <Header title={t('whereTo')} actions={[...(!empty ? [{ sf: 'trash', icon: 'trash-outline' as const, label: t('clear'), onPress: () => Alert.alert(t('clear'), undefined, [{ text: t('done'), style: 'cancel' }, { text: t('clear'), style: 'destructive', onPress: clear }]) }] : []), { sf: 'slider.horizontal.3', icon: 'options' as const, label: t('options'), onPress: () => setSheet(true) }]} />
      <Screen footer={<><Btn label={t('planBtn')} onPress={run} busy={busy} />{err && <Txt v="sub" tone="danger" style={{ textAlign: 'center', paddingTop: 6 }}>{err}</Txt>}</>}>

      <Seg options={CITIES} value={city} onChange={(c) => { setCity(c); clear(); }} />

      <Card style={{ gap: 0 }}>
        {/* A — start */}
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <Rail badge="A" accent line={!!origin} top={origin && !editStart ? 0 : 11} />
          <View style={{ flex: 1, paddingBottom: Spacing.three, gap: Spacing.two }}>
            {origin && !editStart ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <Pressable accessibilityRole="button" style={{ flex: 1 }} onPress={() => setEditStart(true)}>
                  <Txt v="h2" numberOfLines={1}>{origin.name}</Txt>
                </Pressable>
                <IconBtn testID="save-start" icon={s.isSaved(origin) ? 'bookmark' : 'bookmark-outline'} label={t('save')} size={30} active={s.isSaved(origin)} onPress={() => s.toggleSaved(origin)} />
              </View>
            ) : (
              <PlaceInput onCard places={net.places} placeholder={t('startHint')} onPick={setStart} withLocate />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Icon name="time-outline" size={15} color={th.textSecondary} />
              <Txt v="sub">{t('leaveAt')}</Txt>
              <TimePick value={leave} onChange={setLeave} label={t('leaveAt')} />
              {!origin && <Chip label={t('myLocation')} icon="locate" onPress={useHere} />}
            </View>
          </View>
        </View>

        <ReorderList items={stops} onReorder={reorder} renderRow={(x, i, handle) => {
          const eta = etas.get(x.name);
          const late = !!eta && !!fromHHMM(x.by) && eta.arrive > fromHHMM(x.by)! + 0.5;
          return (
            <>
              <Rail badge={letter(i)} line />
              <View style={{ flex: 1, paddingBottom: Spacing.three, gap: Spacing.two }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Pressable accessibilityRole="button" style={{ flex: 1 }} onPress={() => setOpen(open === x.id ? null : x.id)}>
                    <Txt v="h2" numberOfLines={1}>{x.name}</Txt>
                    <Txt v="sub" numberOfLines={2}>
                      {eta ? <Txt v="sub" style={{ fontFamily: Font.semibold, color: eta.fits ? (late ? th.danger : th.brand) : th.danger }}>{eta.fits ? fmtTime(eta.arrive) : t('cantFit')}{'  '}</Txt> : null}
                      {[x.task, `${x.dwell} ${t('min')}`, x.by && `${t('by')} ${x.by}`, !x.required && t('optional')].filter(Boolean).join(' · ')}
                    </Txt>
                  </Pressable>
                  {handle}
                </View>
                {open === x.id && (
                  <Animated.View entering={fx.fade} exiting={fx.out} style={{ gap: Spacing.two }}>
                    <Field bg={th.background} returnKeyType="done" icon="briefcase-outline" value={x.task} onChangeText={(v) => patch(x.id, { task: v })} placeholder={t('taskHint')} accessibilityLabel={t('task')} />
                    <Wrap>{DWELLS.map((d) => <Chip key={d} label={`${d} ${t('min')}`} selected={x.dwell === d} onPress={() => patch(x.id, { dwell: d })} />)}</Wrap>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' }}>
                      <Icon name="alarm-outline" size={15} color={th.textSecondary} />
                      <Txt v="sub">{t('beThereBy')}</Txt>
                      <TimePick optional value={x.by} onChange={(v) => patch(x.id, { by: v })} label={t('beThereBy')} fallback="12:00" />
                      <Chip label={x.required ? t('must') : t('optional')} icon={x.required ? 'lock-closed' : 'lock-open-outline'} selected={x.required} onPress={() => patch(x.id, { required: !x.required })} />
                      <Chip label={s.isSaved(x) ? t('saved') : t('save')} icon={s.isSaved(x) ? 'bookmark' : 'bookmark-outline'} selected={s.isSaved(x)} onPress={() => s.toggleSaved({ name: x.name, lat: x.lat, lon: x.lon })} />
                      <Chip label={t('remove')} icon="close" onPress={() => { setStops((y) => y.filter((z) => z.id !== x.id)); setOpen(null); }} />
                    </View>
                  </Animated.View>
                )}
              </View>
            </>
          );
        }} />

        {origin && !editStart && (
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <Rail badge="+" last top={11} />
            <View style={{ flex: 1 }}>
              <PlaceInput onCard places={net.places} placeholder={t('addStop')} icon="add" onPick={addStop} />
            </View>
          </View>
        )}
      </Card>

      {empty && (
        <Group label={t('examples')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
            {EXAMPLES.map((e) => <Chip key={e.id} icon="flash-outline" label={e.label} onPress={() => example(e)} />)}
          </ScrollView>
        </Group>
      )}

      {stops.length === 0 && (
        <>
          {s.saved.length > 0 && <Group label={t('savedPlaces')}><Wrap>{s.saved.map((p) => <Chip key={p.name + p.lat} icon="bookmark" label={p.name} onPress={() => usePt(p)} />)}</Wrap></Group>}
          {s.recents.filter((r) => !s.isSaved(r)).length > 0 && <Group label={t('recent')}><Wrap>{s.recents.filter((r) => !s.isSaved(r)).slice(0, 4).map((p) => <Chip key={p.name + p.lat} icon="time-outline" label={p.name} onPress={() => usePt(p)} />)}</Wrap></Group>}
          <Group label={t('popular')}>
            <Wrap>{net.places.slice(0, 6).map((p) => <Chip key={p.id} icon="location-outline" label={p.name} onPress={() => usePt({ name: p.name, lat: p.lat, lon: p.lon })} />)}</Wrap>
          </Group>
        </>
      )}

      <Sheet visible={sheet} title={t('options')} onClose={() => setSheet(false)}>
        <Group label={t('date')}><Seg options={[{ id: '0', label: 'Today' }, { id: '1', label: 'Tomorrow' }]} value={String(day) as '0' | '1'} onChange={(v) => setDay(Number(v) as 0 | 1)} /></Group>
        <Group label={t('finishBy')}><View style={{ flexDirection: 'row' }}><TimePick optional value={finish} onChange={setFinish} label={t('finishBy')} fallback="20:00" /></View></Group>
        <Group label={t('order')}><Seg options={[{ id: 'mine', label: t('myOrder') }, { id: 'best', label: t('bestOrder') }]} value={keepOrder ? 'mine' : 'best'} onChange={(v) => setKeepOrder(v === 'mine')} /></Group>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt style={{ flex: 1, fontFamily: Font.medium }}>{t('returnStart')}</Txt>
          <Toggle value={returnHome} onValueChange={setReturnHome} />
        </View>
        <Group label={t('pace')}><Seg options={(['gentle', 'relaxed', 'normal', 'fast'] as const).map((p) => ({ id: p, label: t(p) }))} value={s.pace} onChange={(pace) => s.set({ pace })} /></Group>
        <Group label={t('alerts')}><Seg options={(['calm', 'brief'] as const).map((p) => ({ id: p, label: t(p) }))} value={s.style} onChange={(style) => s.set({ style })} /></Group>
        <Group label={t('transport')}>
          <Wrap>{MODES.map(([k, label, icon]) => <Chip key={k} icon={icon} label={t(label)} selected={!s.avoid.includes(k)} onPress={() => s.set({ avoid: s.avoid.includes(k) ? s.avoid.filter((a) => a !== k) : [...s.avoid, k] })} />)}</Wrap>
        </Group>
        <Btn label={t('done')} onPress={() => setSheet(false)} />
      </Sheet>
      </Screen>
    </>
  );
}

/** Left rail of the A→B→C list: lettered badge and a dotted connector to the next row. */
function Rail({ badge, accent, line, last, top = 0 }: { badge: string; accent?: boolean; line?: boolean; last?: boolean; top?: number }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', width: 28, paddingTop: top }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: accent ? t.accent : last ? t.backgroundSelected : t.brandSolid }}>
        <Txt v="sub" style={{ fontFamily: Font.bold, color: accent ? t.onAccent : last ? t.brand : '#fff' }}>{badge}</Txt>
      </View>
      {/* one unbroken connector to the next badge */}
      {line && !last && <View style={{ flex: 1, width: 2, borderRadius: 1, backgroundColor: t.borderStrong, opacity: 0.55 }} />}
    </View>
  );
}
