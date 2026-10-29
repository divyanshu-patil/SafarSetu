import assert from "node:assert/strict";
import { test } from "node:test";
import { PUNE_JN, assessPlan, buildLive, composeAlert, fmtTime, indexNetwork, latestDeparture, defaultOpts, planDay, planRoute, puneNetwork, type Disruption, type PlanRequest } from "../src/index";

const origin = { ...PUNE_JN };
const req: PlanRequest = {
  date: "2026-11-02",
  origin,
  startMin: 9 * 60,
  endMin: 18 * 60,
  places: [
    { placeId: "shaniwar_wada", priority: 3 },
    { placeId: "dagdusheth", priority: 2 },
    { placeId: "kelkar", priority: 2 },
    { placeId: "aga_khan", priority: 3 },
    { placeId: "parvati", priority: 1 },
  ],
  traveller: { name: "Asha" },
};

test("route arrive-by returns latest feasible departure", () => {
  const ix = indexNetwork(puneNetwork);
  const to = puneNetwork.places.find((p) => p.id === "shaniwar_wada")!;
  const it = latestDeparture(ix, buildLive([]), origin, to, 10 * 60, defaultOpts())!;
  assert.ok(it.arriveMin <= 600 && it.arriveMin > 570, `arrive ${fmtTime(it.arriveMin)}`);
});

test("planDay: feasible, ordered, times monotone", () => {
  const p = planDay(puneNetwork, req);
  assert.ok(p.timeline.length >= 5);
  let t = 0;
  for (const e of p.timeline) {
    const s = e.kind === "move" ? e.departMin : e.arriveMin;
    assert.ok(s >= t - 1e-6, `${e.kind} starts ${s} < ${t}`);
    t = e.kind === "move" ? e.arriveMin : e.leaveMin;
  }
  assert.ok(t <= req.endMin);
  for (const e of p.timeline) if (e.kind === "visit") assert.ok(e.dwellMin >= e.minDwell - 1e-6 && e.startMin >= e.opens);
  assert.ok(p.reminders.length > 0);
});

test("planDay drops lowest priority when overbooked", () => {
  const p = planDay(puneNetwork, { ...req, endMin: 12 * 60 });
  assert.ok(p.dropped.length > 0);
});

test("route: cancellation forces another trip", () => {
  const a = { lat: 18.5075, lon: 73.805 };
  const b = { lat: 18.5166, lon: 73.8421 };
  const pick = (live = buildLive([])) => planRoute(puneNetwork, a, b, { departMin: 600 }, live).itineraries.find((i) => i.legs.some((l) => l.kind === "transit"))!;
  const base = pick();
  const tr = base.legs.find((l) => l.kind === "transit")!;
  assert.equal(tr.kind, "transit");
  if (tr.kind !== "transit") return;
  const d: Disruption = { id: "x", type: "cancellation", routeId: tr.routeId, tripDeparture: tr.tripDeparture, fromMin: 0, untilMin: 2000, source: "simulator" };
  const after = pick(buildLive([d]));
  const tr2 = after.legs.find((l) => l.kind === "transit")!;
  assert.ok(tr2.kind === "transit" && !(tr2.routeId === tr.routeId && tr2.tripDeparture === tr.tripDeparture));
  assert.ok(after.arriveMin >= base.arriveMin);
});

test("assess: delayed train before leaving -> calm alert; cancellation -> replan", () => {
  const p = planDay(puneNetwork, { ...req, places: [{ placeId: "lonavala_market", priority: 3 }, { placeId: "shaniwar_wada", priority: 2 }], startMin: 7 * 60 + 30, endMin: 19 * 60 });
  const trainMove = p.timeline.find((e) => e.kind === "move" && e.itinerary.legs.some((l) => l.kind === "transit" && l.mode === "train"));
  assert.ok(trainMove && trainMove.kind === "move", "plan should use local train");
  const leg = trainMove.itinerary.legs.find((l) => l.kind === "transit" && l.mode === "train")!;
  if (leg.kind !== "transit") return;
  const now = trainMove.departMin - 25;
  const late: Disruption = { id: "d", type: "delay", routeId: leg.routeId, tripDeparture: leg.tripDeparture, delayMin: 30, fromMin: 0, untilMin: 2000, source: "simulator" };
  const a = assessPlan(puneNetwork, p, buildLive([late]), now);
  assert.notEqual(a.state, "on_track");
  assert.ok(a.alert, "alert expected");
  console.log("DELAY ALERT:", a.state, a.alert!.kind, "|", a.alert!.body);
  const cancel: Disruption = { ...late, id: "c", type: "cancellation" };
  const c = assessPlan(puneNetwork, p, buildLive([cancel]), now);
  assert.equal(c.state, "replanned");
  console.log("CANCEL ALERT:", c.alert?.kind, "|", c.alert?.body);
  assert.equal(assessPlan(puneNetwork, p, buildLive([]), now).state, "on_track");
});

test("composeAlert tone follows slack", () => {
  const base = { reason: "delay" as const, routeName: "Local", delayMin: 30, beforeLeave: true, nowMin: 600, oldLeaveMin: 620, newLeaveMin: 650, slackMin: 40, dwellLost: [], dropped: [], nextPlace: "Shaniwar Wada", newArriveMin: 720 };
  assert.equal(composeAlert(base).kind, "relax");
  assert.match(composeAlert(base).body, /No need to rush/i);
  assert.equal(composeAlert({ ...base, newLeaveMin: 605 }).kind, "urgent");
});

import { mumbaiNetwork } from "../src/index";
test("mumbai presets plan feasibly", () => {
  for (const pr of mumbaiNetwork.presets) {
    const p = planDay(mumbaiNetwork, { date: "2026-11-02", origin: pr.origin, startMin: pr.startMin, endMin: pr.endMin, places: pr.placeIds.map((placeId) => ({ placeId })), prefs: { pace: pr.pace } });
    const visits = p.timeline.filter((e) => e.kind === "visit").length;
    console.log(pr.name, "visits", visits, "dropped", p.dropped.map((d) => d.name).join(",") || "-", "conf", p.totals.confidencePct);
    assert.ok(visits >= 3);
  }
});

test("work stops: keepOrder, arriveBy leaves later, required conflicts are reported not dropped", () => {
  const stop = (name: string, lat: number, lon: number, extra = {}) => ({ name, lat, lon, minDwell: 30, maxDwell: 30, ...extra });
  const base = { date: "2026-11-02", origin: { ...PUNE_JN }, startMin: 8 * 60, endMin: 20 * 60, returnToOrigin: false };
  const far = stop("Hinjewadi client", 18.5912, 73.7389);
  const near = stop("Shivajinagar bank", 18.5308, 73.8475);
  // user order is kept even though near-first would be shorter
  const kept = planDay(puneNetwork, { ...base, keepOrder: true, places: [far, near] });
  assert.deepEqual(kept.timeline.filter((e) => e.kind === "visit").map((e) => e.kind === "visit" && e.place.name), ["Hinjewadi client", "Shivajinagar bank"]);
  // appointment at 11:00: arrive by then, but leave later than the unconstrained 08:00 start
  const appt = planDay(puneNetwork, { ...base, keepOrder: true, places: [stop("Meeting", 18.5195, 73.8553, { arriveBy: 11 * 60, required: true })] });
  const v = appt.timeline.find((e) => e.kind === "visit")!;
  const m = appt.timeline[0]!;
  assert.ok(v.kind === "visit" && v.arriveMin <= 11 * 60 - 2 && v.arriveMin >= 10 * 60 + 40, `arrive ${fmtTime(v.kind === "visit" ? v.arriveMin : 0)}`);
  assert.ok(m.kind === "move" && m.departMin > 9 * 60, `leaves at ${fmtTime(m.kind === "move" ? m.departMin : 0)}`);
  assert.deepEqual(appt.conflicts, []);
  // impossible deadline for a required stop: kept, with a conflict
  const bad = planDay(puneNetwork, { ...base, keepOrder: true, places: [stop("Too far", 18.5912, 73.7389, { arriveBy: 8 * 60 + 5, required: true })] });
  assert.equal(bad.timeline.filter((e) => e.kind === "visit").length, 1);
  assert.equal(bad.dropped.length, 0);
  assert.match(bad.conflicts![0]!.reason, /can't arrive by 08:05/);
});
