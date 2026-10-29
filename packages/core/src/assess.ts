import { composeAlert } from "./notify";
import { build, finalize, makeCtx, resolveItems, travel, type Ctx, type Item } from "./planner";
import type { Alert, ChangeSummary, Entry, Itinerary, LiveState, Move, Network, Plan, TransitLeg, Visit } from "./types";

export interface Assessment {
  state: "on_track" | "adjusted" | "replanned";
  plan: Plan;
  summary?: ChangeSummary;
  alert?: Alert;
}

/** Is every vehicle in the itinerary still running and catchable, given we are free to leave at/after `notBefore`? */
function stillValid(c: Ctx, it: Itinerary, notBefore: number, now: number): boolean {
  let t = Math.max(notBefore, it.departMin - 1e6);
  for (const l of it.legs) {
    if (l.kind === "transit") {
      if (l.arriveMin <= now) { t = l.arriveMin; continue; } // already completed
      if (c.live.cancelled(l.routeId, l.tripDeparture)) return false;
      if (l.stops.some((s) => c.live.closed(s.stopId, l.departMin))) return false;
      const dep = l.scheduledDepartMin + c.live.delay(l.routeId, l.tripDeparture);
      if (l.departMin > now && dep - c.o.boardBuffer < t) return false;
      t = dep + (l.arriveMin - l.departMin);
    } else t = t + (l.arriveMin - l.departMin);
  }
  return true;
}

/** Re-time an itinerary's vehicles against live state (same trips). Walks slide late before vehicles. */
function retimeLive(c: Ctx, it: Itinerary, notBefore: number): Itinerary {
  const legs = it.legs.map((l) => ({ ...l })) as Itinerary["legs"];
  for (const l of legs) {
    if (l.kind !== "transit") continue;
    const dl = c.live.delay(l.routeId, l.tripDeparture);
    const shift = l.scheduledDepartMin + dl - l.departMin;
    l.delayMin = dl;
    l.departMin += shift;
    l.arriveMin += shift;
    l.stops = l.stops.map((s) => ({ ...s, min: s.min + shift }));
    l.from = l.stops[0]!;
    l.to = l.stops[l.stops.length - 1]!;
  }
  // walks: before a vehicle -> as late as possible; after -> right after previous leg
  for (let i = legs.length - 1; i >= 0; i--) {
    const l = legs[i]!;
    const nx = legs[i + 1];
    if (l.kind === "walk" && nx?.kind === "transit") {
      const dur = l.arriveMin - l.departMin;
      l.arriveMin = nx.departMin - c.o.boardBuffer;
      l.departMin = l.arriveMin - dur;
    }
  }
  for (let i = 0; i < legs.length; i++) {
    const l = legs[i]!;
    const pv = legs[i - 1];
    if (l.kind === "walk" && legs[i + 1]?.kind !== "transit" && pv) {
      const dur = l.arriveMin - l.departMin;
      l.departMin = pv.arriveMin;
      l.arriveMin = l.departMin + dur;
    }
    if (l.kind === "walk" && i === 0) l.departMin = Math.max(l.departMin, notBefore);
  }
  const last = legs[legs.length - 1]!;
  return { ...it, legs, departMin: legs[0]!.departMin, arriveMin: last.arriveMin };
}

function activity(plan: Plan, now: number) {
  const idx = plan.timeline.findIndex((e) => (e.kind === "move" ? e.arriveMin : e.leaveMin) > now);
  return idx;
}

/**
 * Compare a plan with live conditions at `nowMin`. Pure: (plan, live, now) -> new plan + explanation.
 * 1) keep every move whose vehicles still run; shrink dwell to absorb lateness  -> "adjusted"
 * 2) otherwise re-plan the rest of the day from where the rider will be        -> "replanned"
 */
export function assessPlan(net: Network, plan: Plan, live: LiveState, nowMin: number): Assessment {
  const c = makeCtx(net, live, plan.request.prefs);
  const tl = plan.timeline;
  const idx = activity(plan, nowMin);
  if (idx < 0) return { state: "on_track", plan };
  const done = tl.slice(0, idx);
  const items = resolveItems(net, plan.request.places);
  const byKey = new Map(items.map((i) => [i.key, i]));
  const home = plan.request.returnToOrigin === false ? null : plan.request.origin;
  const endMin = plan.request.endMin;

  // --- try to keep the existing sequence --------------------------------
  const kept: Entry[] = [];
  let cur = tl[idx]!;
  let t = nowMin;
  let ok = true;
  let broke: { reason: ChangeSummary["reason"]; move?: Move } | undefined;
  let prevVisit: Visit | undefined = idx > 0 && tl[idx - 1]!.kind === "visit" ? (tl[idx - 1] as Visit) : undefined;
  for (let i = idx; i < tl.length && ok; i++) {
    cur = tl[i]!;
    if (cur.kind === "visit") {
      const v: Visit = { ...cur };
      if (i !== idx) v.arriveMin = t;
      const startV = Math.max(v.arriveMin, v.opens);
      v.startMin = i === idx ? Math.min(v.startMin, nowMin) : startV;
      v.waitMin = v.startMin - v.arriveMin;
      kept.push(v);
      prevVisit = v;
      t = v.leaveMin;
      if (v.startMin + v.minDwell > v.closes) ok = false;
      continue;
    }
    const m = cur;
    const notBefore = Math.max(nowMin, prevVisit ? prevVisit.startMin + prevVisit.minDwell : nowMin);
    const inProgress = m.departMin <= nowMin;
    if (!stillValid(c, m.itinerary, inProgress ? m.departMin : notBefore, nowMin)) {
      ok = false;
      const bad = m.itinerary.legs.find((l): l is TransitLeg => l.kind === "transit" && (live.cancelled(l.routeId, l.tripDeparture) || l.stops.some((s) => live.closed(s.stopId, l.departMin))));
      broke = { reason: bad && live.cancelled(bad.routeId, bad.tripDeparture) ? "cancellation" : bad ? "closure" : "delay", move: m };
      break;
    }
    const it = retimeLive(c, m.itinerary, inProgress ? m.departMin : notBefore);
    const nm: Move = { ...m, itinerary: it, departMin: it.departMin, arriveMin: it.arriveMin };
    if (prevVisit) {
      // lateness is absorbed by shrinking the previous visit, never by leaving after the vehicle
      prevVisit.leaveMin = Math.max(Math.min(prevVisit.leaveMin, it.departMin), prevVisit.startMin + prevVisit.minDwell);
      prevVisit.dwellMin = prevVisit.leaveMin - prevVisit.startMin;
      if (prevVisit.startMin + prevVisit.minDwell > it.departMin + 0.5) ok = false;
    }
    kept.push(nm);
    t = nm.arriveMin;
    const nextV = tl[i + 1];
    if (nextV?.kind === "visit") {
      const startV = Math.max(nm.arriveMin, nextV.opens);
      if (startV + nextV.minDwell > nextV.closes) ok = false;
    }
    if (i === tl.length - 1 && nm.arriveMin > endMin) ok = false;
    prevVisit = undefined;
  }
  void byKey;

  const nowEntry = tl[idx]!;
  const beforeLeave = nowEntry.kind === "move" ? nowEntry.departMin > nowMin : false;

  if (ok) {
    const changed = kept.some((e, i) => {
      const o = tl[idx + i]!;
      return e.kind === "move" ? Math.abs(e.departMin - (o as Move).departMin) > 0.5 || Math.abs(e.arriveMin - (o as Move).arriveMin) > 0.5 : Math.abs(e.leaveMin - (o as Visit).leaveMin) > 0.5 || Math.abs(e.startMin - (o as Visit).startMin) > 0.5;
    });
    if (!changed) return { state: "on_track", plan };
    const next = finalize(c, plan.request, { entries: [...done, ...kept], dropped: plan.dropped }, plan.revision + 1, nowMin, []);
    const summary = summarise(plan, next, idx, nowMin, beforeLeave, live, "delay");
    // sub-3-minute drifts are noise: keep the old plan, send nothing
    if (!summary || (summary.dwellLost.length === 0 && Math.abs((summary.newLeaveMin ?? 0) - (summary.oldLeaveMin ?? 0)) < 3 && Math.abs((summary.newArriveMin ?? 0) - (plan.timeline.find((e, i) => i >= idx && e.kind === "move")?.arriveMin ?? 0)) < 3)) return { state: "on_track", plan };
    next.changes = changeLines(summary);
    return { state: "adjusted", plan: next, summary, alert: composeAlert(summary, plan.request.traveller, plan.request.prefs?.style) };
  }

  // --- re-plan the remainder -------------------------------------------
  const visited = new Set(done.filter((e): e is Visit => e.kind === "visit").map((v) => v.place.key));
  const current = nowEntry.kind === "visit" ? nowEntry : undefined;
  if (current) visited.add(current.place.key);
  const remaining: Item[] = items.filter((i) => !visited.has(i.key));
  let anchor: { start: { lat: number; lon: number; name?: string }; startMin: number };
  let head: Entry[];
  if (current) {
    anchor = { start: { lat: current.place.lat, lon: current.place.lon, name: current.place.name }, startMin: Math.max(nowMin, current.startMin + current.minDwell) };
    head = [...done, { ...current, leaveMin: anchor.startMin, dwellMin: anchor.startMin - current.startMin }];
  } else {
    const m = nowEntry as Move;
    const aboard = m.itinerary.legs.some((l) => l.kind === "transit" && l.departMin <= nowMin && l.arriveMin > nowMin && !live.cancelled(l.routeId, l.tripDeparture));
    if (aboard) {
      const l = m.itinerary.legs.find((x): x is TransitLeg => x.kind === "transit" && x.departMin <= nowMin && x.arriveMin > nowMin)!;
      const arrive = l.scheduledDepartMin + live.delay(l.routeId, l.tripDeparture) + (l.arriveMin - l.departMin);
      anchor = { start: { lat: l.to.lat, lon: l.to.lon, name: l.to.name }, startMin: arrive };
    } else anchor = { start: { lat: m.from.lat, lon: m.from.lon, name: m.from.name }, startMin: nowMin };
    head = done;
  }
  const built = build(c, anchor, endMin, remaining, home);
  const next = finalize(c, plan.request, { entries: [...head, ...built.entries], dropped: [...plan.dropped, ...built.dropped] }, plan.revision + 1, nowMin, []);
  const reason = broke?.reason ?? "delay";
  const summary = summarise(plan, next, idx, nowMin, beforeLeave, live, reason, broke?.move, built.dropped.map((d) => d.name));
  if (summary) next.changes = changeLines(summary);
  return { state: "replanned", plan: next, summary, alert: summary ? composeAlert(summary, plan.request.traveller, plan.request.prefs?.style) : undefined };
}

function changeLines(s: ChangeSummary): string[] {
  const out: string[] = [];
  if (s.delayMin) out.push(`${s.routeName ?? "Ride"} running ${s.delayMin} min late`);
  if (s.reason === "cancellation") out.push(`${s.routeName ?? "Ride"} cancelled`);
  if (s.reason === "closure") out.push(`${s.stopName ?? "Stop"} closed`);
  for (const d of s.dwellLost) out.push(`${d.name} shortened by ${d.mins} min`);
  for (const d of s.dropped) out.push(`${d} dropped`);
  if (s.newLeaveMin !== undefined && s.oldLeaveMin !== undefined && Math.abs(s.newLeaveMin - s.oldLeaveMin) >= 1) out.push(`Leave time moved ${s.oldLeaveMin} → ${s.newLeaveMin} (minutes of day)`);
  return out;
}

/** Facts about what changed for the rider's *next* action, for the notification composer. */
function summarise(oldP: Plan, newP: Plan, idx: number, now: number, beforeLeave: boolean, live: LiveState, reason: ChangeSummary["reason"], brokenMove?: Move, dropped: string[] = []): ChangeSummary | undefined {
  const oldNext = oldP.timeline.slice(idx).find((e): e is Move => e.kind === "move");
  const newNext = newP.timeline.find((e, i): e is Move => e.kind === "move" && (e.arriveMin > now || e.departMin >= now) && i >= idx - 1 && e.departMin >= Math.min(now, e.departMin));
  const nm = newP.timeline.slice(idx).find((e): e is Move => e.kind === "move") ?? newNext;
  const om = brokenMove ?? oldNext;
  const upcoming = (m?: Move) => (m?.itinerary.legs ?? []).filter((l): l is TransitLeg => l.kind === "transit" && l.arriveMin > now);
  const hit = (l: TransitLeg) => live.cancelled(l.routeId, l.tripDeparture) || live.delay(l.routeId, l.tripDeparture) > 0 || l.stops.some((s) => live.closed(s.stopId, l.departMin));
  // the leg the news is about: first upcoming leg touched by a live event, else the first upcoming leg
  const oldTransit = upcoming(om).find(hit) ?? upcoming(om)[0];
  const oldIds = new Set(upcoming(om).map((l) => l.routeId + l.tripDeparture));
  const newLegs = upcoming(nm);
  const fresh = newLegs.filter((l) => !oldIds.has(l.routeId + l.tripDeparture));
  const newTransit = fresh.find((l) => l.mode === oldTransit?.mode) ?? fresh[0] ?? newLegs[0];
  const delayLeg = upcoming(nm).find((l) => l.delayMin > 0) ?? upcoming(om).find((l) => live.delay(l.routeId, l.tripDeparture) > 0);
  const dwellLost: ChangeSummary["dwellLost"] = [];
  const oldV = new Map(oldP.timeline.filter((e): e is Visit => e.kind === "visit").map((v) => [v.place.key, v]));
  for (const e of newP.timeline) if (e.kind === "visit") {
    const o = oldV.get(e.place.key);
    if (o && o.dwellMin - e.dwellMin >= 3) dwellLost.push({ name: e.place.name, mins: Math.round(o.dwellMin - e.dwellMin) });
  }
  const nextVisit = newP.timeline.slice(idx).find((e): e is Visit => e.kind === "visit");
  const slack = nextVisit ? Math.round(nextVisit.dwellMin - nextVisit.minDwell) : 0;
  const closedStop = live.disruptions.find((d) => d.type === "stop_closed");
  return {
    reason: reason === "delay" && !delayLeg && !dropped.length && !dwellLost.length ? "delay" : reason,
    routeName: (delayLeg ?? oldTransit)?.routeName,
    stopName: reason === "closure" ? (brokenMove?.itinerary.legs.flatMap((l) => (l.kind === "transit" ? l.stops : [])).find((s) => live.closed(s.stopId, now + 1))?.name ?? closedStop?.note) : undefined,
    delayMin: delayLeg ? live.delay(delayLeg.routeId, delayLeg.tripDeparture) : undefined,
    oldBoardMin: (delayLeg ?? oldTransit)?.scheduledDepartMin ?? oldTransit?.departMin,
    beforeLeave,
    nowMin: now,
    oldLeaveMin: om?.departMin,
    newLeaveMin: nm?.departMin,
    nextBoard: newTransit ? { routeName: newTransit.routeName, stopName: newTransit.from.name, departMin: newTransit.departMin } : undefined,
    nextPlace: nextVisit?.place.name,
    newArriveMin: nm?.arriveMin,
    slackMin: slack,
    dwellLost,
    dropped,
  };
}

export { travel };
