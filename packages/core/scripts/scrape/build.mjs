// Combines .cache/rail.json + .cache/osm.json -> src/data/maharashtra.generated.json
import fs from "node:fs";
import path from "node:path";
import { cache, dir, logSource } from "./lib.mjs";

const rail = JSON.parse(fs.readFileSync(path.join(cache, "rail.json"), "utf8"));
const osm = JSON.parse(fs.readFileSync(path.join(cache, "osm.json"), "utf8"));
const CAP = 12;
const slug = (s) => s.toLowerCase().replace(/\W+/g, "_");

const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };
// opening_hours: only trivially parseable "HH:MM-HH:MM" (optionally prefixed Mo-Su / daily)
function hours(oh) {
  const m = /^(?:Mo-Su\s+|24\/7\s*)?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec((oh ?? "").trim());
  return m && hm(m[2]) > hm(m[1]) ? [hm(m[1]), hm(m[2])] : null;
}
function classify(t) {
  if (t.amenity === "place_of_worship" || t.historic === "temple") return ["temple", 360, 1260, 20, 60];
  if (t.tourism === "museum") return ["museum", 540, 1080, 45, 120];
  if (t.historic === "fort" || t.historic === "castle") return ["fort", 540, 1080, 45, 120];
  if (t.tourism === "viewpoint") return ["viewpoint", 360, 1140, 20, 60];
  if (t.historic === "archaeological_site") return ["heritage", 540, 1080, 45, 120];
  if (t.historic === "monument") return ["monument", 540, 1080, 20, 60];
  return ["attraction", 540, 1080, 30, 90];
}
const score = (t) => (t.wikidata ? 4 : 0) + (t.wikipedia ? 3 : 0) + (t.heritage ? 2 : 0) + (t.website ? 1 : 0) + (t["name:en"] ? 1 : 0) + (t.tourism === "attraction" ? 1 : 0) + (t.historic ? 1 : 0);

const places = [];
const perCity = {};
for (const [city, els] of Object.entries(osm.places)) {
  const seen = new Set();
  const cand = els
    .map((e) => ({ e, t: e.tags ?? {}, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon }))
    .filter((x) => x.lat && x.lon && (x.t["name:en"] || /^[\x00-\x7F]+$/.test(x.t.name)) && score(x.t) >= 1)
    .sort((a, b) => score(b.t) - score(a.t));
  let n = 0;
  for (const { e, t, lat, lon } of cand) {
    const name = t["name:en"] ?? t.name;
    if (/sub station|chowk|circle|statue|putala|vyayam|monument monument|^book|^tomb$|nagar$|dining hall/i.test(name) || seen.has(name.toLowerCase()) || n >= CAP) continue;
    seen.add(name.toLowerCase());
    const [category, o, c, mn, mx] = classify(t);
    const h = hours(t.opening_hours);
    places.push({ id: `mh_p_${e.id}`, name, lat: +lat.toFixed(5), lon: +lon.toFixed(5), opens: h?.[0] ?? o, closes: h?.[1] ?? c, minDwell: mn, maxDwell: mx, category, area: city });
    n++;
  }
  perCity[city] = n;
}

// metro: derive from relation stop order, ~3 min per stop, 06:00-22:00 every 10 min
const dep = []; for (let t = 360; t < 1320; t += 10) dep.push(t);
const stops = [...rail.stops], routes = [...rail.routes];
const have = new Set(stops.map((s) => s.id));
const metro = [];
for (const r of osm.metro ?? []) {
  const byId = new Map(r.nodes.map((n) => [n.id, n]));
  const ids = r.members.filter((m) => m.type === "node" && /^stop/.test(m.role)).map((m) => m.ref).filter((id) => byId.has(id));
  const uniq = ids.filter((id, i) => ids.indexOf(id) === i);
  if (uniq.length < 2) continue;
  const ln = r.tags?.name ?? r.tags?.ref ?? String(r.id);
  const ids2 = uniq.map((id) => {
    const n = byId.get(id), sid = `mh_m_${id}`;
    if (!have.has(sid)) { have.add(sid); stops.push({ id: sid, name: n.tags?.name ?? "Metro stop", lat: +n.lat.toFixed(5), lon: +n.lon.toFixed(5), mode: "metro" }); }
    return sid;
  });
  const off = ids2.map((_, i) => i * 3);
  routes.push({ id: `mh_m_${r.id}`, mode: "metro", name: ln, color: r.tags?.colour ?? "#0e7490", stopIds: ids2, offsets: off, departures: dep });
  routes.push({ id: `mh_m_${r.id}_r`, mode: "metro", name: ln, color: r.tags?.colour ?? "#0e7490", stopIds: [...ids2].reverse(), offsets: off, departures: dep });
  metro.push({ name: ln, stops: ids2.length });
}
const out = { stops, routes, places };
const file = path.join(dir, "../../src/data/maharashtra.generated.json");
fs.writeFileSync(file, JSON.stringify(out));
console.log({ size: fs.statSync(file).size, stops: stops.length, routes: routes.length, places: places.length, perCity, metro, status: osm.status });
logSource({
  name: "OpenStreetMap via Overpass API (POIs + metro/light_rail relations)",
  url: "https://overpass-api.de/api/interpreter (mirrors tried: kumi.systems, maps.mail.ru)",
  license: "ODbL-1.0 (c) OpenStreetMap contributors",
  recordsUsed: { placesPerCity: perCity, metroLines: metro, queryStatus: osm.status },
  notes: "Places: named tourism/historic/worship objects ranked by tag richness (wikidata/wikipedia/heritage/website), capped at 12 per city; opening hours only when trivially parseable, otherwise category defaults; dwell times assumed. Metro: stop order from OSM relations; 3 min/stop and 06:00-22:00 every 10 min are ASSUMED (derived from OSM geometry; timings assumed). Cities with 0 places returned nothing/failed (see queryStatus).",
});
