import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, type Lang, type Pace } from '@repo/core';

import { API as DEFAULT_API } from '@/lib/api';
import { DICT, type K } from '@/lib/i18n';

export interface Pt { name: string; lat: number; lon: number }
/** two points are the same place if they round to the same ~10 m cell */
export const sameSpot = (a: Pt, b: Pt) => a.lat.toFixed(4) === b.lat.toFixed(4) && a.lon.toFixed(4) === b.lon.toFixed(4);

export interface Settings {
  lang: Lang;
  pace: Pace;
  style: 'calm' | 'brief';
  avoid: string[]; // modes the rider does not want: local | express | metro | bus | cab
  name: string;
  notify: boolean;
  server: string;
  lastPlan: string | null;
  saved: Pt[]; // places the rider pinned (home, office, the usual stop)
  recents: Pt[]; // most recently used first
}
const DEFAULTS: Settings = { lang: 'en', pace: 'normal', style: 'calm', avoid: [], name: '', notify: true, server: DEFAULT_API, lastPlan: null, saved: [], recents: [] };
const KEY = 'safarsetu:settings';

interface Ctx extends Settings {
  set: (p: Partial<Settings>) => void;
  addRecent: (p: Pt) => void;
  toggleSaved: (p: Pt) => void;
  isSaved: (p: Pt) => boolean;
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
  const value = useMemo<Ctx>(() => {
    const update = (f: (x: Settings) => Settings) => setS((x) => { const n = f(x); AsyncStorage.setItem(KEY, JSON.stringify(n)).catch(() => {}); return n; });
    return {
    ...s,
    set: (p) => update((x) => ({ ...x, ...p })),
    addRecent: (p) => update((x) => ({ ...x, recents: [p, ...x.recents.filter((r) => !sameSpot(r, p))].slice(0, 8) })),
    toggleSaved: (p) => update((x) => ({ ...x, saved: x.saved.some((r) => sameSpot(r, p)) ? x.saved.filter((r) => !sameSpot(r, p)) : [...x.saved, p] })),
    isSaved: (p) => s.saved.some((r) => sameSpot(r, p)),
    t: (k) => DICT[s.lang][k] ?? DICT.en[k],
    client: createClient(s.server || DEFAULT_API),
    };
  }, [s]);
  if (!ready) return null;
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useSettings = () => {
  const v = useContext(C);
  if (!v) throw new Error('SettingsProvider missing');
  return v;
};
