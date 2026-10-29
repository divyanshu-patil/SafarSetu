import { fmtTime } from "./time";
import type { Entry, LatLon, Leg, Plan, Pt } from "./types";

export interface MapLine {
  coords: [number, number][]; // [lat, lon]
  color: string;
  dashed: boolean;
  label: string;
}
export interface MapMarker {
  lat: number;
  lon: number;
  label: string;
  kind: "origin" | "visit" | "board";
  n?: number;
}

const walkColor = "#64748b";

export function planToMapLayers(plan: Plan): { lines: MapLine[]; markers: MapMarker[] } {
  const lines: MapLine[] = [];
  const markers: MapMarker[] = [{ lat: plan.request.origin.lat, lon: plan.request.origin.lon, label: plan.request.origin.name, kind: "origin" }];
  let n = 0;
  for (const e of plan.timeline) {
    if (e.kind === "visit") markers.push({ lat: e.place.lat, lon: e.place.lon, label: e.place.name, kind: "visit", n: ++n });
    else
      for (const l of e.itinerary.legs) {
        if (l.kind === "transit") lines.push({ coords: l.stops.map((s) => [s.lat, s.lon]), color: l.color, dashed: false, label: `${l.routeName} ${fmtTime(l.departMin)}→${fmtTime(l.arriveMin)}` });
        else lines.push({ coords: [[l.from.lat, l.from.lon], [l.to.lat, l.to.lon]], color: l.kind === "cab" ? "#f59e0b" : walkColor, dashed: l.kind === "walk", label: l.kind === "walk" ? `Walk ${Math.round(l.arriveMin - l.departMin)} min` : "Cab" });
      }
  }
  return { lines, markers };
}

/** Where is the rider at `now` if they follow the plan? Used for the live marker. */
export function positionAt(plan: Plan, now: number): (LatLon & { label: string }) | null {
  for (const e of plan.timeline) {
    if (e.kind === "visit") {
      if (now >= e.arriveMin && now < e.leaveMin) return { lat: e.place.lat, lon: e.place.lon, label: `At ${e.place.name}` };
    } else {
      for (const l of e.itinerary.legs) {
        if (now >= l.departMin && now < l.arriveMin) return interpolate(l, now);
      }
    }
  }
  const first = plan.timeline[0];
  if (first && now < legStart(first)) return { ...plan.request.origin, label: `Start: ${plan.request.origin.name}` };
  const last = plan.timeline[plan.timeline.length - 1];
  return last ? { lat: (last as { to?: Pt }).to?.lat ?? plan.request.origin.lat, lon: (last as { to?: Pt }).to?.lon ?? plan.request.origin.lon, label: "Day complete" } : null;
}

const legStart = (e: Entry) => (e.kind === "move" ? e.departMin : e.arriveMin);

function interpolate(l: Leg, now: number): LatLon & { label: string } {
  const f = (now - l.departMin) / Math.max(1, l.arriveMin - l.departMin);
  if (l.kind === "transit") {
    for (let i = 0; i < l.stops.length - 1; i++) {
      const a = l.stops[i]!,
        b = l.stops[i + 1]!;
      if (now >= a.min && now <= b.min) {
        const g = (now - a.min) / Math.max(1, b.min - a.min);
        return { lat: a.lat + (b.lat - a.lat) * g, lon: a.lon + (b.lon - a.lon) * g, label: `On ${l.routeName}` };
      }
    }
    return { lat: l.stops[0]!.lat, lon: l.stops[0]!.lon, label: `Waiting for ${l.routeName}` };
  }
  return { lat: l.from.lat + (l.to.lat - l.from.lat) * f, lon: l.from.lon + (l.to.lon - l.from.lon) * f, label: l.kind === "walk" ? "Walking" : "In cab" };
}

export interface NextAction {
  title: string;
  detail: string;
  atMin: number;
}

/** The single most important thing the rider should do next. */
export function nextAction(plan: Plan, now: number): NextAction | null {
  for (const e of plan.timeline) {
    if (e.kind === "move" && e.departMin + 1 > now - 1 && e.arriveMin > now) {
      const t = e.itinerary.legs.find((l) => l.kind === "transit" && l.arriveMin > now);
      const dest = (e.to as Pt).name ?? "next stop";
      if (now < e.departMin) return { atMin: e.departMin, title: `Leave at ${fmtTime(e.departMin)} for ${dest}`, detail: t && t.kind === "transit" ? `${t.routeName} toward ${t.headsign} from ${t.from.name} at ${fmtTime(t.departMin)}` : "Head out on foot" };
      return { atMin: e.arriveMin, title: `Arrive at ${dest} ${fmtTime(e.arriveMin)}`, detail: t && t.kind === "transit" ? `On ${t.routeName}, get off at ${t.to.name} (${fmtTime(t.arriveMin)})` : "Keep going" };
    }
    if (e.kind === "visit" && now < e.leaveMin && now >= e.arriveMin) return { atMin: e.leaveMin, title: `Enjoy ${e.place.name} until ${fmtTime(e.leaveMin)}`, detail: `${Math.round(e.leaveMin - now)} min left here` };
  }
  return null;
}
