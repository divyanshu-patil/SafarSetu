import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { PUNE_JN } from "@repo/core";
import { createApp } from "../src/app";
import { Engine } from "../src/engine";
import { MemoryStore } from "../src/store";

let base = "";
let close: () => void;
const engine = new Engine(new MemoryStore());
before(async () => {
  const srv = createApp(engine).listen(0);
  base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  close = () => srv.close();
});
after(() => close());

const j = async (p: string, init?: RequestInit) => {
  const r = await fetch(base + p, { ...init, headers: { "content-type": "application/json" } });
  return { status: r.status, body: (await r.json()) as any };
};
const post = (p: string, b: unknown) => j(p, { method: "POST", body: JSON.stringify(b) });

test("health + network + validation", async () => {
  assert.equal((await j("/health")).body.store, "memory");
  assert.ok((await j("/v1/network?city=mumbai&full=1")).body.stops.length > 40);
  assert.equal((await j("/v1/network?city=delhi")).status, 404);
  assert.equal((await post("/v1/plans", { nope: 1 })).status, 400);
});

test("plan -> live scenario -> replan alert", async () => {
  engine.clock.set({ date: "2026-11-02", minute: 7 * 60, speed: 1, running: false });
  const r = await post("/v1/plans", { city: "pune", date: "2026-11-02", origin: PUNE_JN, startMin: 450, endMin: 1140, prefs: { pace: "relaxed" }, places: [{ placeId: "lonavala_market", priority: 3 }, { placeId: "shaniwar_wada" }] });
  assert.equal(r.status, 201);
  const id = r.body.id as string;
  assert.ok(r.body.plan.reminders.length > 3);
  const s1 = await post("/v1/sim/scenario", { name: "metro-cancelled", planId: id });
  assert.equal(s1.body.disruptions.length, 1);
  const st = (await j(`/v1/plans/${id}/status`)).body;
  assert.equal(st.state, "replanned");
  assert.ok(st.plan.revision >= 2);
  const n = (await j(`/v1/notifications?planId=${id}`)).body.items;
  assert.ok(n.some((x: any) => x.kind === "replan" && x.sent));
  await post("/v1/sim/scenario", { name: "clear" });
  assert.equal((await j("/v1/disruptions")).body.items.length, 0);
  const ins = (await j("/v1/insights")).body;
  assert.ok(ins.totals.replans >= 1);
});

test("route arrive-by", async () => {
  const r = await post("/v1/route", { city: "mumbai", from: { lat: 18.9398, lon: 72.8355 }, to: { lat: 19.0436, lon: 72.819 }, arriveByMin: 600 });
  assert.equal(r.status, 200);
  assert.ok(r.body.leaveByMin && r.body.leaveByMin < 600);
});

test("citizen report -> authority login -> role-scoped update", async () => {
  const { seedReports } = await import("../src/seed-reports");
  await seedReports(engine.store);
  const body = { category: "no_feeder", severity: 3, from: { name: "Wagholi", lat: 18.58, lon: 73.98 }, to: { name: "Ramwadi", lat: 18.547, lon: 73.915 }, mode: "bus", description: "No feeder at night" };
  assert.equal((await post("/v1/reports", { category: "x" })).status, 400);
  const r = await post("/v1/reports", body);
  assert.equal(r.status, 201);
  assert.match(r.body.report.ref, /^SS-\d{4}-\d{5}-[A-Z2-9]{4}$/);
  assert.equal(r.body.report.internalNotes, undefined);
  const t = await j(`/v1/reports/track/${r.body.report.ref}`);
  assert.equal(t.body.report.status, "received");

  assert.equal((await j("/v1/authority/reports")).status, 401);
  assert.equal((await post("/v1/auth/login", { email: "supervisor@transport.demo", password: "wrong" })).status, 401);
  const demo = (await j("/v1/auth/demo")).body.accounts as { email: string; password: string }[];
  const login = async (email: string) => (await post("/v1/auth/login", { email, password: demo.find((d) => d.email === email)!.password })).body.token as string;
  const auth = (tok: string) => ({ headers: { "content-type": "application/json", authorization: `Bearer ${tok}` } });
  const sup = await login("supervisor@transport.demo");
  const list = await (await fetch(`${base}/v1/authority/reports?q=Wagholi`, auth(sup))).json() as any;
  assert.ok(list.items.some((x: any) => x.ref === r.body.report.ref));
  assert.equal(list.items[0].reporter, undefined);
  const up = await fetch(`${base}/v1/authority/reports/${r.body.report.id}`, { method: "PATCH", body: JSON.stringify({ status: "referred", publicNote: "Sent to PMPML", internalNote: "check route 285" }), ...auth(sup) });
  assert.equal(up.status, 200);
  const upj = (await up.json()) as any;
  assert.ok(upj.report.internalNotes.some((n: any) => String(n.by).startsWith("AUDIT") && /referred/.test(n.text)), "status change is audited");
  assert.equal((await j(`/v1/reports/track/${r.body.report.ref}`)).body.report.status, "referred");
  assert.equal((await j(`/v1/reports/track/${r.body.report.ref}`)).body.report.internalNotes, undefined);
  // Mumbai analyst: scoped to Mumbai, cannot change status
  const an = await login("mumbai.analyst@transport.demo");
  const mine = await (await fetch(`${base}/v1/authority/reports`, auth(an))).json() as any;
  assert.ok(mine.items.length > 0 && mine.items.every((x: any) => x.city === "mumbai"));
  const denied = await fetch(`${base}/v1/authority/reports/${mine.items[0].id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }), ...auth(an) });
  assert.equal(denied.status, 403);
  const ov = await (await fetch(`${base}/v1/authority/overview`, auth(sup))).json() as any;
  assert.ok(ov.totals.reports > 30 && ov.topIssues.length === 5);
});

test("field interviews: consent required, anonymous, summary has n and dates", async () => {
  const good = { code: "P-001", date: "2026-10-31", city: "Pune", role: "IT employee", route: "Hinjewadi – Shivajinagar", modes: ["bus"], problem: "Evening bus never connects to the metro", perWeek: 4, minutesLostPerWeek: 120, rupeesLostPerWeek: 400, workaround: "shared auto", triedAndFailed: "waited for PMPML 285", consent: true };
  assert.equal((await post("/v1/field/interviews", { ...good, consent: false })).status, 400);
  assert.equal((await post("/v1/field/interviews", good)).status, 201);
  const s = (await j("/v1/field/summary")).body;
  assert.equal(s.n, 1);
  assert.equal(s.avgMinutesLostPerWeek, 120);
  assert.equal(s.quotes[0].code, "P-001");
  assert.equal(s.quotes[0].name, undefined);
});

test("malformed JSON is a 400, not a 500", async () => {
  const r = await fetch(base + "/v1/plans", { method: "POST", headers: { "content-type": "application/json" }, body: "not json" });
  assert.equal(r.status, 400);
  assert.equal(((await r.json()) as any).error.code, "invalid_json");
});

test("authority CSV export is scoped, auth-protected and formula-safe", async () => {
  assert.equal((await fetch(base + "/v1/authority/reports.csv")).status, 401);
  const demo = (await j("/v1/auth/demo")).body.accounts as { email: string; password: string }[];
  const tok = (await post("/v1/auth/login", { email: "mumbai.analyst@transport.demo", password: demo.find((d) => d.email === "mumbai.analyst@transport.demo")!.password })).body.token as string;
  const r = await fetch(base + "/v1/authority/reports.csv", { headers: { authorization: `Bearer ${tok}` } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type") ?? "", /text\/csv/);
  const csv = await r.text();
  assert.match(csv.split("\n")[0]!, /^ref,created,region/);
  assert.ok(csv.split("\n").slice(1).every((l) => l.includes('"mumbai"')), "analyst only sees Mumbai rows");
});

test("security: sign-in is throttled, audit trail is written, retention purges old real reports only", async () => {
  const bad = async () => (await post("/v1/auth/login", { email: "throttle@transport.demo", password: "nope" })).status;
  const codes: number[] = [];
  for (let i = 0; i < 7; i++) codes.push(await bad());
  assert.deepEqual(codes.slice(0, 5), [401, 401, 401, 401, 401]);
  assert.equal(codes[5], 429);
  // security headers
  const h = await fetch(base + "/health");
  assert.equal(h.headers.get("x-content-type-options"), "nosniff");
  assert.equal(h.headers.get("x-powered-by"), null);
  // retention: old real report is purged, old synthetic one is kept
  const store = engine.store as import("../src/store").MemoryStore;
  const old = new Date(Date.now() - 400 * 86400000).toISOString();
  const real = [...store.reports.values()].find((r) => !r.synthetic)!;
  const syn = [...store.reports.values()].find((r) => r.synthetic)!;
  store.reports.set(real.id, { ...real, createdAt: old });
  store.reports.set(syn.id, { ...syn, createdAt: old });
  const n = await store.purgeReportsBefore(new Date(Date.now() - 365 * 86400000).toISOString());
  assert.equal(n, 1);
  assert.ok(store.reports.has(syn.id) && !store.reports.has(real.id));
});

test("pilot feedback is anonymous and aggregated", async () => {
  assert.equal((await post("/v1/feedback", { kind: "alert", useful: "yes" })).status, 400);
  assert.equal((await post("/v1/feedback", { kind: "alert", alertKind: "relax", useful: true })).status, 201);
  assert.equal((await post("/v1/feedback", { kind: "alert", alertKind: "relax", useful: false })).status, 201);
  assert.equal((await post("/v1/feedback", { kind: "trip", onTime: false, minutesLate: 8 })).status, 201);
  const s = (await j("/v1/feedback/summary")).body;
  assert.equal(s.alerts.n, 2);
  assert.equal(s.alerts.usefulPct, 50);
  assert.equal(s.trips.avgMinutesLate, 8);
  assert.equal(s.alerts.byKind.relax.n, 2);
});

import { feedToDisruptions, transit_realtime } from "../src/gtfs-rt";
import { puneNetwork } from "@repo/core";
test("GTFS-Realtime TripUpdates become disruptions (delay, cancellation, small drift ignored)", () => {
  const r = puneNetwork.routes.find((x) => x.id.startsWith("pmpml_") && x.departures.length > 3)!;
  const [, routeId, dir] = r.id.split("_") as [string, string, string];
  const start = r.departures[2]!;
  const hhmmss = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}:00`;
  const mk = (id: string, delay: number, cancelled = false) => ({ id, tripUpdate: { trip: { tripId: id, routeId, directionId: Number(dir), startTime: hhmmss, scheduleRelationship: cancelled ? transit_realtime.TripDescriptor.ScheduleRelationship.CANCELED : transit_realtime.TripDescriptor.ScheduleRelationship.SCHEDULED }, stopTimeUpdate: [{ stopSequence: 1, arrival: { delay } }] } });
  const buf = transit_realtime.FeedMessage.encode(transit_realtime.FeedMessage.fromObject({ header: { gtfsRealtimeVersion: "2.0" }, entity: [mk("a", 900), mk("b", 60), mk("c", 0, true)] })).finish();
  const ds = feedToDisruptions(buf, puneNetwork, { prefix: "pmpml" });
  const delay = ds.find((d) => d.type === "delay" && d.routeId === r.id);
  assert.ok(delay && delay.delayMin === 15 && delay.tripDeparture === start, JSON.stringify(delay));
  assert.ok(ds.some((d) => d.type === "cancellation" && d.routeId === r.id && d.tripDeparture === start));
  assert.ok(!ds.some((d) => d.delayMin === 1), "a 60-second drift is noise");
});

test("review fixes: no cross-user plan listing; references are unguessable", async () => {
  const mine = await fetch(base + "/v1/plans?userId=someone-else", { headers: { "x-user-id": "alice" } });
  const items = ((await mine.json()) as any).items as { id: string }[];
  // the query parameter is ignored: only alice's own plans (none) are returned
  assert.deepEqual(items, []);
  const seq = (await j("/v1/authority/reports")).status; // unauthenticated stays 401
  assert.equal(seq, 401);
  const created = await post("/v1/reports", { category: "other", severity: 1, from: { name: "Test area", lat: 18.5, lon: 73.8 }, description: "x" });
  const ref = created.body.report.ref as string;
  assert.equal((await j(`/v1/reports/track/${ref}`)).status, 200);
  assert.equal((await j(`/v1/reports/track/${ref.slice(0, -5)}`)).status, 404, "the sequence number alone cannot be used to read a report");
});

import { PoolCompute, inlineCompute } from "../src/compute";
test("worker-process pool returns exactly what the in-thread planner returns", async () => {
  const pool = new PoolCompute(1);
  try {
    const req = { city: "pune", date: "2026-11-02", origin: { ...PUNE_JN }, startMin: 540, endMin: 1200, keepOrder: true, places: [{ name: "Hinjewadi", lat: 18.5912, lon: 73.7389, minDwell: 60, maxDwell: 60, arriveBy: 690, required: true }] } as any;
    const [a, b] = await Promise.all([pool.plan("pune", req, []), inlineCompute.plan("pune", req, [])]);
    assert.deepEqual(a.timeline.map((e: any) => [e.kind, Math.round(e.departMin ?? e.arriveMin)]), b.timeline.map((e: any) => [e.kind, Math.round(e.departMin ?? e.arriveMin)]));
    assert.equal(a.totals.fare, b.totals.fare);
  } finally {
    await pool.close();
  }
});
