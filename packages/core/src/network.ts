import type { Mode, Network, RouteDef, Stop } from "./types";
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

// ---- Indexed network used by the router -----------------------------------

export interface Footpath {
  to: number;
  min: number;
  m: number;
}
export interface Indexed {
  net: Network;
  stops: Stop[];
  stopIdx: Map<string, number>;
  routes: RouteDef[];
  /** routes serving each stop: [routeIndex, position] */
  serving: [number, number][][];
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
  for (let i = 0; i < net.stops.length; i++)
    for (let j = i + 1; j < net.stops.length; j++) {
      const m = haversine(net.stops[i]!, net.stops[j]!);
      if (m <= TRANSFER_WALK_M) {
        const min = (m * WALK_DETOUR) / 80;
        foot[i]!.push({ to: j, min, m });
        foot[j]!.push({ to: i, min, m });
      }
    }
  return { net, stops: net.stops, stopIdx, routes: net.routes, serving, foot };
}

/** fare in INR for riding `hops` stops (synthetic slabs modelled on public fare tables) */
export function fare(mode: Mode, hops: number): number {
  if (mode === "metro") return Math.min(10 + 3 * hops, 35);
  if (mode === "bus") return Math.min(5 + 2 * hops, 25);
  return Math.min(10 + 2 * hops, 35);
}
