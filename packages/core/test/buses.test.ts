import assert from "node:assert/strict";
import { test } from "node:test";
import { maharashtraNetwork as mh, mumbaiNetwork, planDay, planRoute, puneNetwork } from "../src/index";

const buses = (n: typeof mh, prefix: string) => n.routes.filter((r) => r.id.startsWith(prefix));

for (const [name, net, prefix, minRoutes, minStops] of [
  ["PMPML (Pune)", puneNetwork, "pmpml_", 400, 3000],
  ["BEST (Mumbai)", mumbaiNetwork, "best_", 600, 3000],
] as const) {
  test(`${name}: real GTFS bus network sanity`, () => {
    const rs = buses(net, prefix);
    assert.ok(rs.length >= minRoutes, `${rs.length} routes`);
    const sid = new Set(net.stops.map((s) => s.id));
    assert.equal(sid.size, net.stops.length, "duplicate stop ids");
    assert.equal(new Set(net.routes.map((r) => r.id)).size, net.routes.length, "duplicate route ids");
    assert.ok(net.stops.filter((s) => s.mode === "bus").length >= minStops);
    const [w, s, e, n] = net.bbox;
    for (const st of net.stops) assert.ok(st.lon >= w && st.lon <= e && st.lat >= s && st.lat <= n, st.id);
    for (const r of rs) {
      assert.equal(r.mode, "bus");
      assert.ok(r.stopIds.length >= 2 && r.stopIds.every((x) => sid.has(x)), r.id);
      assert.equal(r.offsets.length, r.stopIds.length);
      assert.equal(r.offsets[0], 0);
      for (let i = 1; i < r.offsets.length; i++) assert.ok(r.offsets[i]! >= r.offsets[i - 1]!, r.id);
      assert.ok(r.departures.length > 0 && r.departures.every((d, i) => i === 0 || d > r.departures[i - 1]!), `${r.id} departures sorted+unique`);
    }
    assert.ok(net.meta.note.length > 0);
  });
}

test("Maharashtra network merges buses without duplicate ids", () => {
  assert.equal(new Set(mh.routes.map((r) => r.id)).size, mh.routes.length);
  assert.equal(new Set(mh.stops.map((s) => s.id)).size, mh.stops.length);
  assert.ok(buses(mh, "pmpml_").length >= 400 && buses(mh, "best_").length >= 600);
});

test("Hinjewadi -> Shivajinagar arrive-by rides a real PMPML bus; first/last mile no longer a cab", () => {
  const a = { name: "Hinjewadi", lat: 18.5912, lon: 73.7389 };
  const b = { name: "Shivajinagar", lat: 18.5308, lon: 73.8475 };
  const t0 = performance.now();
  const r = planRoute(mh, a, b, { arriveByMin: 10 * 60 });
  const ms = performance.now() - t0;
  const it = r.itineraries.find((i) => i.legs.some((l) => l.kind === "transit" && l.routeId.startsWith("pmpml_")));
  assert.ok(it, "no PMPML itinerary");
  assert.ok(it.arriveMin <= 10 * 60);
  assert.ok(it.arriveMin - it.departMin < 120);
  assert.ok(!it.legs.some((l) => l.kind === "cab"));
  assert.ok(ms < 2000, `${ms} ms`);
});

test("Mumbai: a BEST bus is usable for the last mile (Mumbai Central -> Colaba)", () => {
  const it = planRoute(mh, { name: "Mumbai Central", lat: 18.9695, lon: 72.8195 }, { name: "Colaba", lat: 18.9215, lon: 72.8305 }, { departMin: 9 * 60 }).itineraries.find((i) =>
    i.legs.some((l) => l.kind === "transit" && l.routeId.startsWith("best_")),
  );
  assert.ok(it, "no BEST itinerary");
});

test("perf budget: planRoute and a 4-stop planDay stay interactive on the full network", () => {
  const t0 = performance.now();
  planRoute(mh, { lat: 18.5912, lon: 73.7389 }, { lat: 18.5308, lon: 73.8475 }, { departMin: 8 * 60 + 30 });
  const route = performance.now() - t0;
  const t1 = performance.now();
  const plan = planDay(mh, {
    date: "2026-11-02",
    origin: { name: "Pune Junction", lat: 18.5285, lon: 73.8742 },
    startMin: 9 * 60,
    endMin: 18 * 60,
    places: ["shaniwar_wada", "dagdusheth", "aga_khan", "parvati"].map((placeId) => ({ placeId, priority: 2 as const })),
  });
  const day = performance.now() - t1;
  assert.ok(plan.timeline.some((e) => e.kind === "visit"));
  assert.ok(route < 1500, `planRoute ${route} ms`); // measured ~25 ms; generous for slow CI
  assert.ok(day < 6000, `planDay ${day} ms`); // measured ~0.5 s
});
