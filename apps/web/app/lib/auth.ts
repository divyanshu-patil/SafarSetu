"use client";
import { api } from "./api";

const KEY = "safarsetu:authority";
export interface Me { email: string; name: string; role: "supervisor" | "officer" | "analyst"; org: string; cities: string[] }

export const getAuth = (): { token: string; user: Me } | null => {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
export const setAuth = (a: { token: string; user: Me } | null) => {
  try { a ? localStorage.setItem(KEY, JSON.stringify(a)) : localStorage.removeItem(KEY); } catch { /* ignore */ }
};

/** fetch against the authority API; on 401 clears the session so pages can redirect */
export async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const a = getAuth();
  const res = await fetch(api.baseUrl + path, { ...init, headers: { "content-type": "application/json", ...(a ? { authorization: `Bearer ${a.token}` } : {}), ...init.headers } });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) { setAuth(null); throw Object.assign(new Error("Session expired — please sign in again."), { status: 401 }); }
  if (!res.ok) throw Object.assign(new Error(json?.error?.message ?? `HTTP ${res.status}`), { status: res.status });
  return json as T;
}
