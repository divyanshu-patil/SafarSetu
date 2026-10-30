import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Insights } from '@repo/core';

import { Card, Group, Header, Screen, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

export default function InsightsScreen() {
  const th = useTheme();
  const { t, client } = useSettings();
  const [d, setD] = useState<Insights | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { client.insights().then(setD).catch((e) => setErr(e.message)); }, [client]);
  const max = Math.max(1, ...(d?.routes.map((r) => r.disruptions) ?? [1]));
  return (
    <>
    <Header title={t('insights')} large={false} />
    <Screen>
      {err && <Txt v="sub" tone="danger">{t('unreachable')} · {err}</Txt>}
      {d && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three }}>
            {([[d.totals.plans, 'plans'], [d.totals.disruptions, 'disruptions'], [d.totals.replans, 're-plans'], [d.totals.notifications, 'alerts'], [d.totals.minutesSaved, 'min saved']] as const).map(([v, l]) => (
              <View key={l} style={{ minWidth: '28%' }}><Txt v="num">{v}</Txt><Txt v="sub">{l}</Txt></View>
            ))}
          </View>
          <Group label="Least reliable">
            {d.routes.map((r) => (
              <Card key={r.routeId} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row' }}><Txt style={{ flex: 1 }} numberOfLines={1}>{r.name}</Txt><Txt v="sub">{r.disruptions}× · {r.avgDelayMin ? `${r.avgDelayMin} ${t('min')}` : '—'}{r.cancelled ? ` · ${r.cancelled} ✕` : ''}</Txt></View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: th.border }}><View style={{ height: 5, borderRadius: 3, width: `${(r.disruptions / max) * 100}%`, backgroundColor: th.brand }} /></View>
              </Card>
            ))}
          </Group>
          {d.risky.length > 0 && <Group label="Riskiest connections">{d.risky.map((r) => <Txt key={r.label} v="sub" style={{ color: th.text }}>{r.label} · {r.count}</Txt>)}</Group>}
          <Txt v="sub">{d.note}</Txt>
        </>
      )}
    </Screen>
    </>
  );
}
