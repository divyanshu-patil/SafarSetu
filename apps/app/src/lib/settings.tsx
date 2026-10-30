import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, type Lang, type Pace } from '@repo/core';

import { API as DEFAULT_API } from '@/lib/api';
import { DICT, type K } from '@/lib/i18n';

export interface Settings {
  lang: Lang;
  pace: Pace;
  style: 'calm' | 'brief';
  avoid: string[]; // modes the rider does not want: local | express | metro | bus | cab
  name: string;
  notify: boolean;
  server: string;
  lastPlan: string | null;
}
const DEFAULTS: Settings = { lang: 'en', pace: 'normal', style: 'calm', avoid: [], name: '', notify: true, server: DEFAULT_API, lastPlan: null };
const KEY = 'safarsetu:settings';

interface Ctx extends Settings {
  set: (p: Partial<Settings>) => void;
  t: (k: K) => string;
  client: ReturnType<typeof createClient>;
}
const C = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setS({ ...DEFAULTS, ...JSON.parse(v) })).catch(() => {}).finally(() => setReady(true));
  }, []);
  const value = useMemo<Ctx>(() => ({
    ...s,
    set: (p) => setS((x) => { const n = { ...x, ...p }; AsyncStorage.setItem(KEY, JSON.stringify(n)).catch(() => {}); return n; }),
    t: (k) => DICT[s.lang][k] ?? DICT.en[k],
    client: createClient(s.server || DEFAULT_API),
  }), [s]);
  if (!ready) return null;
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useSettings = () => {
  const v = useContext(C);
  if (!v) throw new Error('SettingsProvider missing');
  return v;
};
