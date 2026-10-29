import { WALK_DETOUR, fare, type Indexed } from "./network";
import { haversine } from "./time";
import type { Avoid, CabLeg, Itinerary, LatLon, Leg, LiveState, Pt, StopTime, TransitLeg, WalkLeg } from "./types";

export interface RouteOpts {
  walkSpeed: number; // m/min
  maxWalkM: number;
  boardBuffer: number; // min to be at the stop before departure
  maxRounds: number;
  avoid: Avoid[];
}
export const PACE_OPTS = {
  relaxed: { walkSpeed: 60, boardBuffer: 5 },
  normal: { walkSpeed: 80, boardBuffer: 3 },
  fast: { walkSpeed: 95, boardBuffer: 1 },
} as const;
export const defaultOpts = (): RouteOpts => ({ ...PACE_OPTS.normal, maxWalkM: 1200, maxRounds: 4, avoid: [] });

const INF = 1e9;
const walkMin = (m: number, o: RouteOpts) => Math.ceil((m * WALK_DETOUR) / o.walkSpeed);

interface Label {
  arr: number;
  stop: number;
  kind: "access" | "transit" | "foot";
  prev?: Label;
  route?: number;
  trip?: number;
  boardPos?: number;
  alightPos?: number;
  m?: number;
}

function firstTrip(deps: number[], t: number): number {
  let lo = 0,
    hi = deps.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (deps[mid]! < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Earliest-arrival, round-based search. Returns one itinerary per useful number of vehicles. */
export function search(ix: Indexed, live: LiveState, from: Pt, to: Pt, departMin: number, o: RouteOpts): Itinerary[] {
  const n = ix.stops.length;
  const best: (Label | undefined)[] = new Array(n);
  const bestArr = new Float64Array(n).fill(INF);
  const improved = new Set<number>();

  ix.stops.forEach((s, i) => {
    const m = haversine(from, s);
    if (m <= o.maxWalkM && !o.avoid.includes(s.mode) && !live.closed(s.id, departMin)) {
      const arr = departMin + walkMin(m, o);
      best[i] = { arr, stop: i, kind: "access", m };
      bestArr[i] = arr;
      improved.add(i);
    }
  });

  const results: { it: Label; total: number; egressM: number }[] = [];
  let bestTotal = INF;
  const egress = () => {
    let top: { it: Label; total: number; egressM: number } | undefined;
    for (let i = 0; i < n; i++) {
      const l = best[i];
      if (!l || l.kind === "access") continue;
      const m = haversine(ix.stops[i]!, to);
      if (m > o.maxWalkM) continue;
      const total = l.arr + walkMin(m, o);
      if (!top || total < top.total) top = { it: l, total, egressM: m };
    }
    if (top && top.total < bestTotal - 0.5) {
      bestTotal = top.total;
      results.push(top);
    }
  };

  for (let k = 1; k <= o.maxRounds && improved.size; k++) {
    const snap = best.slice();
    const marked = new Set<number>();
    const routeStart = new Map<number, number>();
    for (const s of improved)
      for (const [ri, pos] of ix.serving[s]!) {
        const cur = routeStart.get(ri);
        if (cur === undefined || pos < cur) routeStart.set(ri, pos);
      }
    for (const [ri, startPos] of routeStart) {
      const r = ix.routes[ri]!;
      if (o.avoid.includes(r.mode) || (ix.service[ri] !== undefined && o.avoid.includes(ix.service[ri]!))) continue;
      let trip = -1;
      let boardPos = -1;
      for (let pos = startPos; pos < r.stopIds.length; pos++) {
        const s = ix.stopIdx.get(r.stopIds[pos]!)!;
        const open = !live.closed(r.stopIds[pos]!, departMin);
        if (trip >= 0 && open) {
          const t = r.departures[trip]! + r.offsets[pos]! + live.delay(r.id, r.departures[trip]!);
          if (t < bestArr[s]! - 1e-9) {
            const lab: Label = { arr: t, stop: s, kind: "transit", prev: snap[ix.stopIdx.get(r.stopIds[boardPos]!)!], route: ri, trip, boardPos, alightPos: pos };
            best[s] = lab;
            bestArr[s] = t;
            marked.add(s);
          }
        }
        const sl = snap[s];
        if (sl && open) {
          const ready = sl.arr + o.boardBuffer;
          let d = firstTrip(r.departures, ready - r.offsets[pos]! - live.maxDelay);
          for (; d < r.departures.length; d++) {
            const dep = r.departures[d]!;
            if (live.cancelled(r.id, dep)) continue;
            if (dep + r.offsets[pos]! + live.delay(r.id, dep) >= ready) break;
          }
          if (d < r.departures.length && (trip < 0 || d < trip)) {
            trip = d;
            boardPos = pos;
          }
        }
      }
    }
    // footpath relaxation from stops reached by a vehicle this round
    for (const s of [...marked]) {
      const l = best[s]!;
      if (l.kind !== "transit") continue;
      for (const f of ix.foot[s]!) {
        if (o.avoid.includes(ix.stops[f.to]!.mode)) continue;
        const arr = l.arr + f.min;
        if (arr < bestArr[f.to]! - 1e-9) {
          best[f.to] = { arr, stop: f.to, kind: "foot", prev: l, m: f.m };
          bestArr[f.to] = arr;
          marked.add(f.to);
        }
      }
    }
    egress();
    improved.clear();
    for (const s of marked) improved.add(s);
  }
  return results.map((r) => toItinerary(ix, live, r.it, from, to, r.egressM, o));
}

const stopTime = (ix: Indexed, id: string, min: number): StopTime => {
  const s = ix.stops[ix.stopIdx.get(id)!]!;
  return { stopId: id, name: s.name, lat: s.lat, lon: s.lon, min };
};

function toItinerary(ix: Indexed, live: LiveState, last: Label, from: Pt, to: Pt, egressM: number, o: RouteOpts): Itinerary {
  const chain: Label[] = [];
  for (let l: Label | undefined = last; l; l = l.prev) chain.unshift(l);
  const legs: Leg[] = [];
  let cursor: Pt = from;
  const walk = (a: Pt, b: Pt, m: number, depart: number): WalkLeg => ({
    kind: "walk",
    from: a,
    to: b,
    distM: m,
    departMin: depart,
    arriveMin: depart + walkMin(m, o),
  });
  for (const l of chain) {
    if (l.kind === "access") {
      const s = ix.stops[l.stop]!;
      legs.push(walk(cursor, { name: s.name, lat: s.lat, lon: s.lon }, l.m!, 0));
      cursor = { name: s.name, lat: s.lat, lon: s.lon };
    } else if (l.kind === "foot") {
      const s = ix.stops[l.stop]!;
      legs.push(walk(cursor, { name: s.name, lat: s.lat, lon: s.lon }, l.m!, 0));
      cursor = { name: s.name, lat: s.lat, lon: s.lon };
    } else {
      const r = ix.routes[l.route!]!;
      const dep = r.departures[l.trip!]!;
      const dl = live.delay(r.id, dep);
      const stops = r.stopIds.slice(l.boardPos!, l.alightPos! + 1).map((id, i) => stopTime(ix, id, dep + r.offsets[l.boardPos! + i]! + dl));
      const a = stops[0]!;
      const b = stops[stops.length - 1]!;
      legs.push({
        kind: "transit",
        mode: r.mode,
        routeId: r.id,
        routeName: r.name,
        color: r.color,
        headsign: ix.stops[ix.stopIdx.get(r.stopIds[r.stopIds.length - 1]!)!]!.name,
        tripDeparture: dep,
        from: a,
        to: b,
        departMin: a.min,
        arriveMin: b.min,
        scheduledDepartMin: a.min - dl,
        delayMin: dl,
        stops,
        fare: fare(r.mode, stops.length - 1),
      } satisfies TransitLeg);
      cursor = { name: b.name, lat: b.lat, lon: b.lon };
    }
  }
  if (egressM > 1) legs.push(walk(cursor, to, egressM, 0));
  // forward time pass; walking before a vehicle slides as late as possible
  retime(legs, o);
  return summarize(legs);
}

/** Assign walk times: walks leave as late as possible before the next vehicle, otherwise right after the previous leg. */
export function retime(legs: Leg[], o: RouteOpts, notBefore = -INF): void {
  // backward: a walk followed by a transit leg ends boardBuffer before departure
  for (let i = legs.length - 1; i >= 0; i--) {
    const l = legs[i]!;
    if (l.kind !== "walk") continue;
    const next = legs[i + 1];
    const dur = walkMin(l.distM, o);
    if (next && next.kind === "transit") {
      l.arriveMin = next.departMin - o.boardBuffer;
      l.departMin = l.arriveMin - dur;
    }
  }
  // forward: other walks follow the previous leg
  for (let i = 0; i < legs.length; i++) {
    const l = legs[i]!;
    if (l.kind !== "walk") continue;
    const prev = legs[i - 1];
    const next = legs[i + 1];
    if (next && next.kind === "transit") {
      if (prev && prev.arriveMin > l.departMin) l.departMin = prev.arriveMin; // transfer walk: cannot start earlier
      l.arriveMin = l.departMin + walkMin(l.distM, o);
      continue;
    }
    const dur = walkMin(l.distM, o);
    l.departMin = prev ? prev.arriveMin : Math.max(notBefore, l.departMin);
    l.arriveMin = l.departMin + dur;
  }
}

export function summarize(legs: Leg[]): Itinerary {
  let walkM = 0,
    fareSum = 0,
    transit = 0;
  for (const l of legs) {
    if (l.kind === "walk") walkM += l.distM;
    else if (l.kind === "transit") {
      fareSum += l.fare;
      transit++;
    } else fareSum += l.fare;
  }
  return {
    legs,
    departMin: legs[0]!.departMin,
    arriveMin: legs[legs.length - 1]!.arriveMin,
    walkM: Math.round(walkM),
    transfers: Math.max(0, transit - 1),
    fare: fareSum,
  };
}

export function walkItinerary(from: Pt, to: Pt, departMin: number, o: RouteOpts): Itinerary {
  const m = haversine(from, to);
  const leg: WalkLeg = { kind: "walk", from, to, distM: m, departMin, arriveMin: departMin + walkMin(m, o) };
  return summarize([leg]);
}

export function cabItinerary(from: Pt, to: Pt, departMin: number): Itinerary {
  const m = haversine(from, to) * 1.35;
  const wait = 5;
  const leg: CabLeg = {
    kind: "cab",
    from,
    to,
    distM: m,
    departMin,
    arriveMin: departMin + wait + Math.ceil(m / 367), // ~22 km/h urban
    fare: Math.round(40 + 14 * (m / 1000)),
  };
  return summarize([leg]);
}

const score = (it: Itinerary) => it.arriveMin + it.transfers * 3 + it.walkM / 400;

/** Best door-to-door option leaving at/after `departMin`. Never returns nothing: cab is the fallback. */
export function bestItinerary(ix: Indexed, live: LiveState, from: LatLon & { name?: string }, to: LatLon & { name?: string }, departMin: number, o: RouteOpts): Itinerary {
  const cands = search(ix, live, from, to, departMin, o);
  const direct = haversine(from, to);
  if (direct <= o.maxWalkM * 0.9) cands.push(walkItinerary(from, to, departMin, o));
  cands.sort((a, b) => score(a) - score(b));
  const top = cands[0];
  if (o.avoid.includes("cab")) return top ?? walkItinerary(from, to, departMin, o); // cab switched off: transit, else a (long) walk
  const cab = cabItinerary(from, to, departMin);
  if (!top) return cab;
  // cab is a last resort: only when transit is far worse (e.g. after cancellations)
  return cab.arriveMin + 45 < top.arriveMin ? cab : top;
}

/** Latest departure that still arrives by `deadline` (the "leave by" time). */
export function latestDeparture(ix: Indexed, live: LiveState, from: Pt, to: Pt, deadline: number, o: RouteOpts): Itinerary | null {
  let found: Itinerary | null = null;
  for (let t = deadline - 5; t > deadline - 300; t -= 5) {
    const it = bestItinerary(ix, live, from, to, t, o);
    if (it.arriveMin <= deadline) {
      found = it;
      break;
    }
  }
  if (!found) return null;
  // push later while still feasible
  for (let t = found.departMin + 1; t < found.departMin + 15; t++) {
    const it = bestItinerary(ix, live, from, to, t, o);
    if (it.arriveMin <= deadline && it.departMin >= found.departMin) found = it;
    else if (it.arriveMin > deadline) break;
  }
  return found;
}
