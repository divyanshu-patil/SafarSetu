import type { Disruption, LiveState } from "./types";

/** Fold active disruptions into lookups the router/assessor read. Pure. */
export function buildLive(disruptions: Disruption[]): LiveState {
  const hits = (d: Disruption, routeId: string, dep: number) =>
    d.routeId === routeId &&
    (d.tripDeparture !== undefined ? d.tripDeparture === dep : dep >= d.fromMin && dep <= d.untilMin);
  const delays = disruptions.filter((d) => d.type === "delay");
  const cancels = disruptions.filter((d) => d.type === "cancellation");
  const closures = disruptions.filter((d) => d.type === "stop_closed");
  return {
    disruptions,
    rain: disruptions.some((d) => d.type === "weather"),
    maxDelay: Math.max(0, ...delays.map((d) => d.delayMin ?? 0)),
    delay: (routeId, dep) => delays.reduce((s, d) => (hits(d, routeId, dep) ? Math.max(s, d.delayMin ?? 0) : s), 0),
    cancelled: (routeId, dep) => cancels.some((d) => hits(d, routeId, dep)),
    closed: (stopId, at) => closures.some((d) => d.stopId === stopId && at >= d.fromMin && at <= d.untilMin),
  };
}

export const noLive: LiveState = buildLive([]);
