import type { Indexed } from "./network";
import { mulberry32 } from "./time";
import type { Confidence, Itinerary, Mode } from "./types";

/** Assumed delay profiles (minutes). Replace with learned per-route/hour distributions in production. */
const PROFILE: Record<Mode, { pDelay: number; mean: number }> = {
  metro: { pDelay: 0.1, mean: 3 },
  bus: { pDelay: 0.45, mean: 4 },
  train: { pDelay: 0.45, mean: 12 },
};

const exp = (rnd: () => number, mean: number) => -Math.log(1 - rnd()) * mean;

export interface ConfidenceOpts {
  samples?: number;
  /** minutes of lateness tolerated beyond the planned arrival */
  tolerance?: number;
  boardBuffer?: number; // accepted for API symmetry; planned buffer is already inside the itinerary
  seed?: number;
}

/**
 * Monte-Carlo on-time probability. A rider who reaches a stop after their (delayed) trip left
 * takes the next departure of that route - missed connections are modelled with real headways.
 */
export function confidence(ix: Indexed, it: Itinerary, o: ConfidenceOpts = {}): Confidence {
  const N = o.samples ?? 400;
  const tol = o.tolerance ?? 5;
  const buf = 0; // the planned board buffer IS the slack; only lateness beyond it is a miss
  const rnd = mulberry32(o.seed ?? 7);
  const deadline = it.arriveMin + tol;
  const arrivals: number[] = [];
  let ok = 0;
  const legMiss = it.legs.map(() => 0);
  for (let s = 0; s < N; s++) {
    let t = it.departMin;
    let late = false;
    for (let i = 0; i < it.legs.length; i++) {
      const l = it.legs[i]!;
      if (l.kind === "transit") {
        const r = ix.routes.find((x) => x.id === l.routeId)!;
        const pos = r.stopIds.indexOf(l.from.stopId);
        const alightPos = r.stopIds.indexOf(l.to.stopId);
        const ride = r.offsets[alightPos]! - r.offsets[pos]!;
        const prof = PROFILE[l.mode];
        const known = l.delayMin;
        const extra = (dep: number) => (rnd() < prof.pDelay * (known ? 0.5 : 1) ? exp(rnd, prof.mean * (known ? 0.4 : 1)) : 0) + (dep === l.tripDeparture ? known : 0);
        let d = r.departures.indexOf(l.tripDeparture);
        let dep = r.departures[d]! + r.offsets[pos]! + extra(r.departures[d]!);
        let guard = 0;
        while (t + buf > dep && d + 1 < r.departures.length && guard++ < 6) {
          d++;
          dep = r.departures[d]! + r.offsets[pos]! + extra(r.departures[d]!);
        }
        if (d !== r.departures.indexOf(l.tripDeparture)) legMiss[i]! += 1;
        t = dep + ride;
      } else {
        const dur = l.arriveMin - l.departMin;
        // walks sit on a schedule when followed by a vehicle: start no earlier than planned
        t = Math.max(t, l.departMin) + dur * (0.85 + rnd() * 0.3);
      }
      if (i === it.legs.length - 1) late = t > deadline;
    }
    if (!late) ok++;
    arrivals.push(t);
  }
  arrivals.sort((a, b) => a - b);
  let riskiest: Confidence["riskiest"];
  legMiss.forEach((m, i) => {
    const p = 1 - m / N;
    const l = it.legs[i]!;
    if (l.kind === "transit" && m > 0 && (!riskiest || p < riskiest.p)) riskiest = { legIndex: i, p, label: `${l.routeName} at ${l.from.name}` };
  });
  return { pOnTime: ok / N, p90ArriveMin: arrivals[Math.floor(N * 0.9)]!, riskiest };
}
