import { createRequire } from "node:module";
import type { Disruption, Network } from "@repo/core";

const require = createRequire(import.meta.url);
// gtfs-realtime-bindings ships CommonJS
const { transit_realtime } = require("gtfs-realtime-bindings") as typeof import("gtfs-realtime-bindings");

/**
 * GTFS-Realtime TripUpdates → SafarSetu disruptions.
 *
 * Our route ids are `<prefix>_<gtfs route_id>_<direction>_<pattern>` and a trip is identified by its first-stop
 * departure (minutes). A TripUpdate therefore maps by (route_id, direction_id) and trip.start_time — no trip_id needed.
 * Only delays ≥ 3 min and cancellations are emitted (smaller drifts are noise; see docs/04).
 */
export interface RtOptions {
  /** id prefix of the agency's routes in our network, e.g. "pmpml" or "best" */
  prefix: string;
  minDelaySec?: number;
}

const toMin = (hhmmss?: string | null) => {
  if (!hhmmss) return undefined;
  const [h, m, s] = hhmmss.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0) + Math.round((s ?? 0) / 60);
};

export function feedToDisruptions(buf: Uint8Array, net: Network, opt: RtOptions): Disruption[] {
  const feed = transit_realtime.FeedMessage.decode(buf);
  const out: Disruption[] = [];
  const minDelay = opt.minDelaySec ?? 180;
  const now = Math.floor(Date.now() / 60000);
  for (const e of feed.entity) {
    const tu = e.tripUpdate;
    if (!tu?.trip?.routeId) continue;
    const dir = tu.trip.directionId ?? undefined;
    const start = toMin(tu.trip.startTime);
    const cancelled = tu.trip.scheduleRelationship === transit_realtime.TripDescriptor.ScheduleRelationship.CANCELED;
    // first stop-time delay we can find (seconds); GTFS-RT delay propagates downstream until the next update
    const delaySec = tu.stopTimeUpdate?.map((u) => u.arrival?.delay ?? u.departure?.delay).find((d) => d != null) ?? tu.delay ?? 0;
    if (!cancelled && delaySec < minDelay) continue;
    const prefix = `${opt.prefix}_${tu.trip.routeId}_`;
    const routes = net.routes.filter((r) => r.id.startsWith(prefix) && (dir === undefined || r.id.includes(`_${dir}_`)));
    for (const r of routes) {
      // exact trip when start_time is known and matches a departure; otherwise the whole route for the next 2 hours
      const exact = start !== undefined && r.departures.includes(start);
      out.push({
        id: `rt-${r.id}-${exact ? start : "all"}-${cancelled ? "x" : "d"}`,
        type: cancelled ? "cancellation" : "delay",
        routeId: r.id,
        tripDeparture: exact ? start : undefined,
        delayMin: cancelled ? undefined : Math.round(delaySec / 60),
        fromMin: exact ? 0 : start ?? 0,
        untilMin: exact ? 1440 : (start ?? 0) + 120,
        source: "gtfs-rt",
        verified: true,
        note: `GTFS-RT ${cancelled ? "cancellation" : `delay ${Math.round(delaySec / 60)} min`}${exact ? "" : " (route-wide)"}`,
      });
    }
    void now;
  }
  return out;
}

/** Poll a feed and mirror it into the disruption store (replacing the previous gtfs-rt rows). Off unless GTFS_RT_URL is set. */
export function startGtfsRtPoller(opts: { url: string; prefix: string; net: Network; every?: number; apply: (d: Disruption[]) => Promise<void> }) {
  const tick = async () => {
    try {
      const r = await fetch(opts.url, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) throw new Error(`feed ${r.status}`);
      await opts.apply(feedToDisruptions(new Uint8Array(await r.arrayBuffer()), opts.net, { prefix: opts.prefix }));
    } catch (e) {
      console.error("gtfs-rt poll failed (plans keep using the last known state):", (e as Error).message);
    }
  };
  void tick();
  return setInterval(tick, opts.every ?? 30_000);
}

export { transit_realtime };
