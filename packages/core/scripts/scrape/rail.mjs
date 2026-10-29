// Builds Maharashtra rail stops+routes from datameet/railways. Output: .cache/rail.json
import fs from "node:fs";
import path from "node:path";
import { cachedGet, cache, inMH, logSource } from "./lib.mjs";

// COARSE Maharashtra outline (lon,lat), hand-approximated: datameet leaves state=null for most stations, so bbox alone
// would pull in Gujarat/MP/Karnataka/Telangana/Chhattisgarh. Stations within ~20 km of the border may be misclassified.
const POLY = [[72.7,20.0],[73.2,20.4],[73.5,20.75],[73.85,21.1],[74.0,21.6],[74.8,21.5],[75.6,21.4],[76.2,21.45],[76.8,21.6],[77.9,21.7],[78.4,21.6],[79.0,21.55],[79.9,21.7],[80.5,21.6],[80.9,21.3],[80.9,20.4],[80.45,19.8],[80.2,19.3],[79.9,19.0],[79.5,19.3],[79.0,19.4],[78.4,19.6],[78.0,19.4],[77.7,19.1],[77.3,18.8],[77.3,18.4],[77.2,18.0],[76.5,17.9],[76.2,17.5],[75.7,17.15],[75.1,17.05],[74.9,16.7],[74.6,16.2],[74.2,15.9],[74.1,15.7],[73.7,15.6],[73.3,16.5],[72.8,18.5],[72.7,19.5]];
const inPoly = (x, y) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, yi] = POLY[i], [xj, yj] = POLY[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

const base = "https://raw.githubusercontent.com/datameet/railways/master/";
const rd = async (n) => JSON.parse(fs.readFileSync(await cachedGet(n, base + n), "utf8"));
const stations = (await rd("stations.json")).features;
const trains = (await rd("trains.json")).features;
const sched = await rd("schedules.json");

const title = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bJn\b/, "Jn");
const st = new Map(); // code -> {mh:boolean, ...}
for (const f of stations) {
  const p = f.properties;
  if (!f.geometry) { st.set(p.code, { unknown: true }); continue; }
  const [lon, lat] = f.geometry.coordinates;
  st.set(p.code, { name: title(p.name), lat: +lat.toFixed(5), lon: +lon.toFixed(5), mh: (p.state === "Maharashtra" || p.state === null) && inMH(lon, lat) && inPoly(lon, lat) });
}
const names = new Map(trains.map((f) => [f.properties.number, f.properties.name]));
const byTrain = new Map();
for (const r of sched) (byTrain.get(r.train_number) ?? byTrain.set(r.train_number, []).get(r.train_number)).push(r);

const tm = (s) => (s && s !== "None" ? +s.slice(0, 2) * 60 + +s.slice(3, 5) : null);
const usedStops = new Map();
const routes = [];
let multi = 0;
for (const [num, rows] of byTrain) {
  rows.sort((a, b) => a.id - b.id);
  // absolute times with day rollover (monotone)
  let prev = 0;
  const seq = rows.map((r) => {
    const a = tm(r.arrival), d = tm(r.departure);
    let day = ((r.day ?? 1) - 1) * 1440;
    let arr = a === null ? null : day + a, dep = d === null ? null : day + d;
    if (arr !== null) while (arr < prev) arr += 1440;
    if (arr !== null) prev = arr;
    if (dep !== null) { while (dep < prev) dep += 1440; prev = dep; }
    return { code: r.station_code, arr: arr ?? dep, dep: dep ?? arr };
  });
  // contiguous MH segments; stations without coordinates are skipped, known non-MH ones break the segment
  const segs = [];
  let cur = [];
  for (const s of seq) {
    const i = st.get(s.code);
    if (!i || i.unknown) continue;
    if (!i.mh) { if (cur.length) segs.push(cur); cur = []; continue; }
    cur.push(s);
  }
  if (cur.length) segs.push(cur);
  segs.forEach((seg, k) => {
    // keep halts only: dwell > 0, plus segment ends. (datameet lists pass times too; arr==dep = unknown -> treated as non-halt)
    const kept = seg.filter((s, i) => i === 0 || i === seg.length - 1 || s.dep > s.arr);
    if (kept.length < 2) return;
    const t0 = kept[0].dep;
    const offsets = kept.map((s) => s.arr - t0);
    offsets[0] = 0;
    // guard monotone
    for (let i = 1; i < offsets.length; i++) if (offsets[i] < offsets[i - 1]) offsets[i] = offsets[i - 1];
    if (offsets.at(-1) < 5) return;
    if (k) multi++;
    for (const s of kept) usedStops.set(s.code, st.get(s.code));
    routes.push({
      id: `mh_t_${num}${k ? "_" + k : ""}`,
      mode: "train",
      name: `${num} ${title(names.get(num) ?? "")}`.trim(),
      color: "#b45309",
      stopIds: kept.map((s) => "mh_s_" + s.code),
      offsets,
      departures: [((t0 % 1440) + 1440) % 1440],
    });
  });
}
const stops = [...usedStops].map(([c, i]) => ({ id: "mh_s_" + c, name: i.name, lat: i.lat, lon: i.lon, mode: "train" }));
fs.writeFileSync(path.join(cache, "rail.json"), JSON.stringify({ stops, routes }));
const mhSt = [...st.values()].filter((x) => x.mh).length;
console.log({ mhStationsWithCoords: mhSt, stops: stops.length, routes: routes.length, multiSeg: multi });
logSource({
  name: "datameet/railways (stations, trains, schedules)",
  url: base,
  license: "ODbL-1.0 / data from Indian Railways via Datameet (see repo)",
  recordsUsed: { stationsWithCoordsInMH: mhSt, stationsUsed: stops.length, trainRoutes: routes.length },
  notes: "Scheduled timetable snapshot (undated). No run-days: every train assumed daily. Only stations with coordinates kept that are state=Maharashtra or (state missing, ~half of stations, and inside a coarse hand-made Maharashtra outline polygon); stations lacking coordinates are skipped (their times are kept inside offsets). arrival==departure is treated as pass-through, so only stops with dwell>0 are halts (some real 1-min halts are lost). Foreign/other-state stations break segments; each contiguous MH segment is one route.",
});
