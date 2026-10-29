import type { Disruption, Plan, PlanRequest } from "./types";

type F = typeof fetch;

/** Tiny typed API client; works in browsers and React Native (fetch injected if needed). */
export function createClient(baseUrl: string, fetchImpl: F = (...a) => fetch(...a)) {
  const call = async <T>(path: string, init?: RequestInit & { userId?: string }): Promise<T> => {
    const res = await fetchImpl(baseUrl + path, { ...init, headers: { "content-type": "application/json", "x-user-id": init?.userId ?? "demo", ...init?.headers } });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    return json as T;
  };
  const post = <T>(p: string, body?: unknown) => call<T>(p, { method: "POST", body: JSON.stringify(body ?? {}) });
  return {
    baseUrl,
    network: (city = "pune") => call<import("./types").Network>(`/v1/network?city=${city}`),
    createPlan: (req: PlanRequest) => post<StoredPlan>("/v1/plans", req),
    getPlan: (id: string) => call<StoredPlan>(`/v1/plans/${id}`),
    planStatus: (id: string) => call<PlanStatus>(`/v1/plans/${id}/status`),
    notifications: (id: string) => call<{ items: NotificationItem[] }>(`/v1/notifications?planId=${id}`),
    cities: () => call<{ items: { id: string; city: string; bbox: [number, number, number, number]; presets: import("./types").Preset[]; meta: { dataQuality: string; note: string } }[] }>("/v1/cities"),
    clock: () => call<ClockState>("/v1/sim/clock"),
    setClock: (c: Partial<ClockState>) => post<ClockState>("/v1/sim/clock", c),
    scenario: (name: string, planId?: string, city?: string) => post<{ disruptions: Disruption[] }>("/v1/sim/scenario", { name, planId, city }),
    disruptions: () => call<{ items: Disruption[] }>("/v1/disruptions"),
    geocode: (q: string) => call<{ items: { name: string; lat: number; lon: number }[] }>(`/v1/geocode?q=${encodeURIComponent(q)}`),
    walk: (a: string, b: string) => call<{ coords: [number, number][]; distM: number; source: string }>(`/v1/walk?from=${a}&to=${b}`),
    weather: (lat: number, lon: number) => call<{ rainProb: number[]; hours: number[]; tempC: number[] }>(`/v1/weather?lat=${lat}&lon=${lon}`),
    insights: () => call<Insights>("/v1/insights"),
    streamUrl: (planId: string) => `${baseUrl}/v1/stream/${planId}`,
  };
}

export interface StoredPlan {
  id: string;
  plan: Plan;
}
export interface ClockState {
  date: string;
  minute: number;
  speed: number;
  running: boolean;
  serverNowMs?: number;
}
export interface NotificationItem {
  id: string;
  planId: string;
  kind: string;
  title: string;
  body: string;
  fireMin: number;
  sent: boolean;
}
export interface PlanStatus {
  state: "on_track" | "adjusted" | "replanned";
  nowMin: number;
  plan: Plan;
  next: import("./viewmodel").NextAction | null;
  position: { lat: number; lon: number; label: string } | null;
}
export interface Insights {
  routes: { routeId: string; name: string; disruptions: number; avgDelayMin: number; cancelled: number }[];
  risky: { label: string; count: number }[];
  totals: { plans: number; replans: number; notifications: number; minutesSaved: number; disruptions: number };
  note: string;
}
