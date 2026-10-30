import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { fmtTime, nextAction, planToMapLayers, positionAt, type ClockState, type Disruption, type NotificationItem, type Plan } from '@repo/core';
import { useFocusEffect } from 'expo-router';

import RouteMap from '@/components/route-map';
import { Timeline } from '@/components/timeline';
import { Btn, Card, Chip, Group, Header, Icon, IconBtn, Screen, Seg, Txt, Wrap, type IconName } from '@/components/ui';
import { Font, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notifyNow } from '@/lib/notify';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';

const SCENARIOS: { name: string; label: string; icon: IconName; color: string }[] = [
  { name: 'train-late-30', label: 'Train +30', icon: 'train', color: '#be123c' },
  { name: 'metro-late-5', label: 'Metro +5', icon: 'subway', color: '#0e7490' },
  { name: 'metro-cancelled', label: 'Metro off', icon: 'warning', color: '#cb272f' },
  { name: 'stop-closed', label: 'Stop closed', icon: 'construct', color: '#c2410c' },
  { name: 'heavy-rain', label: 'Heavy rain', icon: 'rainy', color: '#0369a1' },
  { name: 'clear', label: 'Clear', icon: 'checkmark-circle', color: '#15803d' },
];
const KIND: Record<string, [IconName, string]> = { relax: ['shield-checkmark', '#15803d'], adjust: ['shuffle', '#7c3aed'], replan: ['git-branch', '#cb272f'], urgent: ['alert-circle', '#b91c1c'], heads_up: ['rainy', '#0369a1'] };

/** Live trip. The phone polls the server (no SSE on React Native); alerts that arrive are also raised as local notifications. */
export default function Trip() {
  const th = useTheme();
  const { t, client, lastPlan, notify } = useSettings();
  const { current, setCurrent } = useSession();
  const id = current?.id ?? lastPlan;
  const [plan, setPlan] = useState<Plan | null>(current?.plan ?? null);
  const [clock, setClock] = useState<{ c: ClockState; at: number } | null>(null);
  const [feed, setFeed] = useState<NotificationItem[]>([]);
  const [dis, setDis] = useState<Disruption[]>([]);
  const [, force] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rated, setRated] = useState<Set<string>>(new Set());
  const [outcome, setOutcome] = useState<string | null>(null);
  const [allAlerts, setAllAlerts] = useState(false);
  const seen = useRef<Set<string> | null>(null);

  const pull = useCallback(async () => {
    if (!id) return;
    try {
      const [p, c, n, d] = await Promise.all([client.getPlan(id), client.clock(), client.notifications(id), client.disruptions()]);
      setPlan(p.plan); setClock({ c, at: Date.now() }); setDis(d.items); setErr(null);
      const sent = n.items.filter((x) => x.sent);
      if (seen.current === null) seen.current = new Set(sent.map((x) => x.id)); // alerts from before this screen opened are history, not news
      else sent.filter((x) => !seen.current!.has(x.id)).forEach((x) => { seen.current!.add(x.id); if (notify) notifyNow(x.title, x.body); });
      setFeed(sent);
    } catch (e) { setErr((e as Error).message); }
  }, [id, client, notify]);

  useFocusEffect(useCallback(() => {
    seen.current = null;
    pull();
    const poll = setInterval(pull, 3000);
    const tick = setInterval(() => force((x) => x + 1), 500);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [pull]));
  useEffect(() => { if (current?.plan) setPlan(current.plan); }, [current]);

  const now = clock ? (clock.c.running ? clock.c.minute + ((Date.now() - clock.at) / 60000) * clock.c.speed : clock.c.minute) : 0;
  const layers = useMemo(() => (plan ? planToMapLayers(plan) : null), [plan]);
  const me = plan && clock ? positionAt(plan, now) : null;
  const next = plan && clock ? nextAction(plan, now) : null;
  // the demo clock is global, so it is often nowhere near this trip: say so instead of claiming "All done"
  const inWindow = !!plan && now >= plan.request.startMin - 60 && now <= plan.request.endMin + 30;

  const setC = (p: Partial<ClockState>) => client.setClock(p).then((c) => setClock({ c, at: Date.now() })).catch((e) => setErr(e.message));
  const run = async (name: string) => { if (!id || !plan) return; setBusy(name); try { await client.scenario(name, id, plan.request.city); await pull(); } catch (e) { setErr((e as Error).message); } finally { setBusy(null); } };
  const fb = (body: object) => fetch(`${client.baseUrl}/v1/feedback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});

  if (!id || !plan) {
    return (
      <><Header title={t('trip')} /><Screen>
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.two }}>
          <Icon name="navigate-circle-outline" size={44} color={th.textSecondary} />
          <Txt v="h2">{t('noTrip')}</Txt>
          <Txt v="sub" style={{ textAlign: 'center' }}>{err ?? t('noTripHint')}</Txt>
        </Card>
      </Screen></>
    );
  }

  const sorted = [...feed].sort((a, b) => b.fireMin - a.fireMin);
  return (
    <>
    <Header title={t('trip')} actions={[{ sf: 'xmark', icon: 'close', label: t('clear'), onPress: () => { setCurrent(null); setPlan(null); } }]} />
    <Screen>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Txt style={{ fontFamily: Font.black, fontSize: 56, lineHeight: 60, letterSpacing: -2 }}>{fmtTime(now)}</Txt>
        <Txt v="sub">{clock ? `${clock.c.running ? `${clock.c.speed}×` : '⏸'} · ${clock.c.date}` : ' '}</Txt>
      </View>

      <Card tint="select">
        <Txt v="label">{t('nextUp')}</Txt>
        <Txt v="h2">{!inWindow ? t('clockOff') : next?.title ?? t('dayDone')}</Txt>
        {inWindow && next?.detail ? <Txt v="sub" style={{ color: th.text }}>{next.detail}</Txt> : null}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Btn full={false} label={t('start_demo')} onPress={() => setC({ date: plan.request.date, minute: Math.max(0, plan.request.startMin - 35), speed: 60, running: true })} />
        <IconBtn icon={clock?.c.running ? 'pause' : 'play'} label={clock?.c.running ? t('pause') : t('play')} onPress={() => clock && setC({ running: !clock.c.running })} size={44} />
        <View style={{ flex: 1 }}><Seg options={[1, 30, 60, 120].map((s) => ({ id: String(s), label: `${s}×` }))} value={String(clock?.c.speed ?? 60)} onChange={(s) => setC({ speed: Number(s) })} /></View>
      </View>
      {err && <Txt v="sub" tone="danger">{err}</Txt>}

      <RouteMap lines={layers?.lines} markers={layers?.markers} me={me} height={220} />

      {inWindow && !next && !outcome && (
        <Group label={t('howDay')}>
          <Wrap>
            <Chip icon="happy-outline" label={t('madeIt')} onPress={() => { setOutcome('on time'); fb({ kind: 'trip', planId: id, onTime: true }); }} />
            {[5, 10, 20].map((m) => <Chip key={m} label={`${t('lateBy')} ~${m}`} onPress={() => { setOutcome(`${m}`); fb({ kind: 'trip', planId: id, onTime: false, minutesLate: m }); }} />)}
          </Wrap>
        </Group>
      )}
      {outcome && <Txt v="sub">{t('thanks')}</Txt>}

      <Group label={t('alertsTitle')}>
        {sorted.length === 0 && <Txt v="sub">{t('noAlerts')}</Txt>}
        {(allAlerts ? sorted : sorted.slice(0, 3)).map((n) => {
          const [icon, color] = KIND[n.kind] ?? (['notifications', th.brand] as [IconName, string]);
          return (
            <Card key={n.id} style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Icon name={icon} size={18} color={color} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt style={{ fontFamily: Font.semibold }}>{n.title}</Txt>
                <Txt v="sub" style={{ color: th.text }}>{n.body}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: 2 }}>
                  <Txt v="sub" style={{ flex: 1 }}>{fmtTime(n.fireMin)}</Txt>
                  {rated.has(n.id) ? <Txt v="sub">{t('thanks')}</Txt> : (
                    <>
                      <Txt v="sub">{t('useful')}</Txt>
                      <IconBtn icon="thumbs-up-outline" label="Yes" size={28} onPress={() => { setRated((r) => new Set(r).add(n.id)); fb({ kind: 'alert', planId: id, alertKind: n.kind, useful: true }); }} />
                      <IconBtn icon="thumbs-down-outline" label="No" size={28} onPress={() => { setRated((r) => new Set(r).add(n.id)); fb({ kind: 'alert', planId: id, alertKind: n.kind, useful: false }); }} />
                    </>
                  )}
                </View>
              </View>
            </Card>
          );
        })}
        {sorted.length > 3 && <Btn kind="ghost" label={allAlerts ? t('showLess') : `${t('showAll')} (${sorted.length})`} onPress={() => setAllAlerts((v) => !v)} />}
      </Group>

      <Group label={t('simulate')}>
        <Wrap>{SCENARIOS.map((s) => <Chip key={s.name} icon={s.icon} label={s.label} onPress={() => busy === null && run(s.name)} />)}</Wrap>
        {dis.map((d) => <Txt key={d.id} v="sub">{d.type.replace('_', ' ')}{d.delayMin ? ` · ${d.delayMin} ${t('min')}` : ''}{d.note ? ` — ${d.note}` : ''}</Txt>)}
        {plan.changes.map((c, i) => <Txt key={i} v="sub">· {c}</Txt>)}
      </Group>

      <Timeline plan={plan} now={now} />
    </Screen>
    </>
  );
}
