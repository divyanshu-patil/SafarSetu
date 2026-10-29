import type { Disruption, LiveState } from "./types";

const group = (ds: Disruption[]) => {
  const m = new Map<string, Disruption[]>();
  for (const d of ds) if (d.routeId) (m.get(d.routeId) ?? m.set(d.routeId, []).get(d.routeId)!).push(d);
  return m;
};

/**
 * Fold active disruptions into lookups the router/assessor read. Pure.
 * Disruptions are indexed by route so lookups stay O(events on that route), not O(all events) — a real GTFS-RT feed carries thousands.
 */
export function buildLive(disruptions: Disruption[]): LiveState {
  const hits = (d: Disruption, dep: number) => (d.tripDeparture !== undefined ? d.tripDeparture === dep : dep >= d.fromMin && dep <= d.untilMin);
  const delays = disruptions.filter((d) => d.type === "delay");
  const cancels = disruptions.filter((d) => d.type === "cancellation");
  const closures = disruptions.filter((d) => d.type === "stop_closed");
  const delayBy = group(delays);
  const cancelBy = group(cancels);
  return {
    disruptions,
    rain: disruptions.some((d) => d.type === "weather"),
    maxDelay: Math.max(0, ...delays.map((d) => d.delayMin ?? 0)),
    delay: (routeId, dep) => {
      let best = 0;
      for (const d of delayBy.get(routeId) ?? []) if (hits(d, dep)) best = Math.max(best, d.delayMin ?? 0);
      return best;
    },
    cancelled: (routeId, dep) => (cancelBy.get(routeId) ?? []).some((d) => hits(d, dep)),
    closed: (stopId, at) => closures.some((d) => d.stopId === stopId && at >= d.fromMin && at <= d.untilMin),
  };
}

export const noLive: LiveState = buildLive([]);
