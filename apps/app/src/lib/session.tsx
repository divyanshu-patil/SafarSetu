import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Plan } from '@repo/core';

/** The plan the rider is looking at. `id` is set when it lives on the server (live tracking); null for an on-device plan. */
export interface Current { id: string | null; plan: Plan }
const C = createContext<{ current: Current | null; setCurrent: (c: Current | null) => void } | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current | null>(null);
  const v = useMemo(() => ({ current, setCurrent }), [current]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
export const useSession = () => {
  const v = useContext(C);
  if (!v) throw new Error('SessionProvider missing');
  return v;
};
