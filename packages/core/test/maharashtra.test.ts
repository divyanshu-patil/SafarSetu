import assert from "node:assert/strict";
import { test } from "node:test";
import { maharashtraNetwork as net, networks, planDay, planRoute } from "../src/index";

const loc = (id: string) => { const s = net.stops.find((x) => x.id === id)!; return { name: s.name, lat: s.lat, lon: s.lon }; };

test("network sanity", () => {
  assert.equal(networks.maharashtra, net);
  assert.ok(net.stops.length > 500 && net.routes.length > 900 && net.places.length > 80);
  const sid = new Set(net.stops.map((s) => s.id));
  assert.equal(sid.size, net.stops.length);
  assert.equal(new Set(net.routes.map((r) => r.id)).size, net.routes.length);
  assert.equal(new Set(net.places.map((p) => p.id)).size, net.places.length);
  for (const r of net.routes) {
    assert.ok(r.stopIds.every((x) => sid.has(x)), r.id);
    assert.equal(r.offsets.length, r.stopIds.length);
    for (let i = 1; i < r.offsets.length; i++) assert.ok(r.offsets[i]! >= r.offsets[i - 1]!, r.id);
  }
  assert.ok(net.places.every((p) => p.area));
  assert.equal(net.meta.dataQuality, "synthetic");
});

const rail = (r: ReturnType<typeof planRoute>) =>
  r.itineraries.find((it) => it.legs.some((l) => l.kind === "transit" && l.routeId.startsWith("mh_t_")));

test("CSMT -> Pune Jn by a real train", () => {
  const it = rail(planRoute(net, loc("mh_s_CSTM"), loc("mh_s_PUNE"), { departMin: 16 * 60 + 30 }));
  assert.ok(it, "no rail itinerary");
  assert.ok(it.arriveMin - it.departMin < 300);
  assert.ok(it.legs.some((l) => l.kind === "transit" && /Deccan|Pragati|Express|Exp/i.test(l.routeName)));
});

test("Mumbai -> Nashik -> back", () => {
  assert.ok(rail(planRoute(net, loc("mh_s_CSTM"), loc("mh_s_NK"), { departMin: 6 * 60 })));
  assert.ok(rail(planRoute(net, loc("mh_s_NK"), loc("mh_s_CSTM"), { departMin: 15 * 60 })));
});

test("all presets feasible + perf", () => {
  for (const p of net.presets) {
    const t0 = performance.now();
    const plan = planDay(net, { date: "2026-11-02", origin: p.origin, startMin: p.startMin, endMin: p.endMin, places: p.placeIds.map((id) => ({ placeId: id, priority: 2 as const })), prefs: { pace: p.pace } });
    const ms = performance.now() - t0;
    assert.ok(p.placeIds.length >= 2, p.name);
    assert.ok(plan.timeline.some((e) => e.kind === "visit"), p.name);
    assert.ok(plan.dropped.length < p.placeIds.length, `${p.name} dropped ${JSON.stringify(plan.dropped)}`);
    assert.ok(ms < 8000, `${p.name} ${ms}ms`);
    console.log(p.name, Math.round(ms), "ms, visits", plan.timeline.filter((e) => e.kind === "visit").length, "dropped", plan.dropped.length);
  }
  const t0 = performance.now();
  planRoute(net, loc("mh_s_NGP"), loc("mh_s_AWB"), { departMin: 8 * 60 });
  assert.ok(performance.now() - t0 < 2000);
});
