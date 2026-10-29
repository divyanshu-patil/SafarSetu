import type { Mode, Network, RouteDef, Stop, Place, Preset } from "./types";
import { haversine } from "./time";

export interface RouteSpec {
  id: string;
  mode: Mode;
  name: string;
  color: string;
  stops: string[];
  /** minutes between consecutive stops: one number or one per hop */
  gap: number | number[];
  /** headway bands [fromMin, toMin, headwayMin] (service span = outer bounds) or explicit departures */
  headways?: [number, number, number][];
  times?: number[];
  /** also generate the opposite direction (id + "_r") */
  both?: boolean;
  /** explicit departures for the reverse direction (otherwise same as forward) */
  timesReverse?: number[];
}

function expand(headways: [number, number, number][]): number[] {
  const out: number[] = [];
  for (const [from, to, hw] of headways) for (let t = from; t < to; t += hw) out.push(t);
  return [...new Set(out)].sort((a, b) => a - b);
}

export function buildRoutes(specs: RouteSpec[]): RouteDef[] {
  const out: RouteDef[] = [];
  for (const s of specs) {
    const gaps = Array.isArray(s.gap) ? s.gap : s.stops.slice(1).map(() => s.gap as number);
    const fwd = [0];
    for (const g of gaps) fwd.push(fwd[fwd.length - 1]! + g);
    const deps = s.times ?? expand(s.headways ?? []);
    out.push({ id: s.id, mode: s.mode, name: s.name, color: s.color, stopIds: s.stops, offsets: fwd, departures: deps });
    if (s.both) {
      const total = fwd[fwd.length - 1]!;
      out.push({
        id: s.id + "_r",
        mode: s.mode,
        name: s.name,
        color: s.color,
        stopIds: [...s.stops].reverse(),
        offsets: fwd.map((o) => total - o).reverse(),
        departures: s.timesReverse ?? deps,
      });
    }
  }
  return out;
}

/** Union of networks: first occurrence of an id wins (extra.places take precedence over part places); stops within 400 m auto-link at index time. */
export function mergeNetworks(
  id: string,
  city: string,
  bbox: Network["bbox"],
  parts: Network[],
  extra: { stops?: Stop[]; routes?: RouteDef[]; places?: Place[]; presets?: Preset[]; note: string; timezone?: string },
): Network {
  const dedupe = <T extends { id: string }>(xs: T[]) => {
    const seen = new Set<string>();
    return xs.filter((x) => !seen.has(x.id) && !!seen.add(x.id));
  };
  const stops = dedupe([...parts.flatMap((p) => p.stops), ...(extra.stops ?? [])]);
  const ids = new Set(stops.map((s) => s.id));
  const routes = dedupe([...parts.flatMap((p) => p.routes), ...(extra.routes ?? [])]).filter((r) => r.stopIds.every((x) => ids.has(x)));
  const synthetic = parts.some((p) => p.meta.dataQuality === "synthetic");
  return {
    id,
    city,
    presets: extra.presets ?? [],
    timezone: extra.timezone ?? parts[0]?.timezone ?? "Asia/Kolkata",
    bbox,
    stops,
    routes,
    places: dedupe([...(extra.places ?? []), ...parts.flatMap((p) => p.places)]),
    meta: { dataQuality: synthetic ? "synthetic" : "scheduled", note: extra.note },
  };
}

// ---- Indexed network used by the router -----------------------------------

export interface Footpath {
  to: number;
  min: number;
  m: number;
}
export interface Indexed {
  net: Network;
  /** local (suburban/passenger/MEMU) vs express for trains; undefined for other modes */
  service: ("local" | "express" | undefined)[];
  stops: Stop[];
  stopIdx: Map<string, number>;
  routes: RouteDef[];
  /** routes serving each stop: [routeIndex, position] */
  serving: [number, number][][];
  /** stop index of every position of every route (avoids string lookups in the router hot loop) */
  routeStops: Int32Array[];
  foot: Footpath[][];
}

export const WALK_DETOUR = 1.25;
export const TRANSFER_WALK_M = 400;

export function indexNetwork(net: Network): Indexed {
  const stopIdx = new Map(net.stops.map((s, i) => [s.id, i]));
  const serving: [number, number][][] = net.stops.map(() => []);
  net.routes.forEach((r, ri) =>
    r.stopIds.forEach((sid, pos) => {
      const i = stopIdx.get(sid);
      if (i === undefined) throw new Error(`route ${r.id}: unknown stop ${sid}`);
      serving[i]!.push([ri, pos]);
    }),
  );
  const foot: Footpath[][] = net.stops.map(() => []);
  // grid buckets (~0.005 deg ~ 550 m) so footpath build is ~O(n)
  const G = 0.005;
  const cell = (v: number) => Math.floor(v / G);
  const grid = new Map<string, number[]>();
  net.stops.forEach((s, i) => {
    const k = cell(s.lat) + "," + cell(s.lon);
    (grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
  });
  net.stops.forEach((a, i) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const j of grid.get(cell(a.lat) + dy + "," + (cell(a.lon) + dx)) ?? []) {
          if (j <= i) continue;
          const m = haversine(a, net.stops[j]!);
          if (m <= TRANSFER_WALK_M) {
            const min = (m * WALK_DETOUR) / 80;
            foot[i]!.push({ to: j, min, m });
            foot[j]!.push({ to: i, min, m });
          }
        }
  });
  const routeStops = net.routes.map((r) => Int32Array.from(r.stopIds, (id) => stopIdx.get(id)!));
  return { net, service: net.routes.map(routeService), stops: net.stops, stopIdx, routes: net.routes, serving, routeStops, foot };
}

/** fare in INR for riding `hops` stops (synthetic slabs modelled on public fare tables) */
export function fare(mode: Mode, hops: number): number {
  if (mode === "metro") return Math.min(10 + 3 * hops, 35);
  if (mode === "bus") return Math.min(5 + 2 * hops, 25);
  return Math.min(10 + 2 * hops, 35);
}

const LOCAL_NAME = /local|passenger|memu|emu|dmu|suburban|shuttle/i;
const LOCAL_IDS = /^(western|central|local|harbour)(_r)?$/;

/** Trains split into slow stopping services ("local") and the rest ("express"). */
export function routeService(r: { id: string; mode: string; name: string }): "local" | "express" | undefined {
  if (r.mode !== "train") return undefined;
  return LOCAL_IDS.test(r.id) || LOCAL_NAME.test(r.name) ? "local" : "express";
}
