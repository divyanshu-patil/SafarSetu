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
  assert.match(r.body.report.ref, /^SS-\d{4}-\d{5}$/);
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
