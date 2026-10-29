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
  assert.ok((await j("/v1/network?city=mumbai")).body.stops.length > 40);
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
