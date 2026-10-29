#!/usr/bin/env node
// GTFS -> SafarSetu {stops, routes} JSON. Plain Node, no deps.
//   node import-gtfs.mjs <gtfsDir> --out file.json --prefix pmpml --stop-prefix pm_ --label PMPML \
//        --color "#0e7490" --bbox w,s,e,n [--max-patterns 3] [--window 300,1410] [--titlecase]
// Representative service day: the weekday (Mon-Fri) service_id set that is active on the most weekdays in the
// feed (calendar.txt + calendar_dates.txt); its earliest date is reported. Never run from inside the data dir.
import fs from "node:fs";

// ---- CSV ---------------------------------------------------------------
function parseLine(l) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) {
      if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out;
}
function readCsv(dir, name, optional = false, keepFirst = null) {
  const f = `${dir}/${name}.txt`;
  if (!fs.existsSync(f)) { if (optional) return []; throw new Error("missing " + f); }
  const lines = fs.readFileSync(f, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const head = parseLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    if (keepFirst && !keepFirst(lines[i].slice(0, lines[i].indexOf(",")))) continue;
    const v = parseLine(lines[i]);
    const o = {};
    for (let j = 0; j < head.length; j++) o[head[j]] = v[j] ?? "";
    rows.push(o);
  }
  return rows;
}

// ---- args ----------------------------------------------------------------
const argv = process.argv.slice(2);
const dir = argv[0];
const opt = (k, d) => { const i = argv.indexOf("--" + k); return i < 0 ? d : argv[i + 1]; };
if (!dir || dir.startsWith("--")) { console.error("usage: import-gtfs.mjs <gtfsDir> --out f.json --prefix p --stop-prefix s_ --label L --bbox w,s,e,n"); process.exit(1); }
const O = {
  out: opt("out"),
  prefix: opt("prefix", "gtfs"),
  stopPrefix: opt("stop-prefix", "g_"),
  label: opt("label", "Bus"),
  color: opt("color", "#ea580c"),
  bbox: opt("bbox", "-180,-90,180,90").split(",").map(Number),
  maxPatterns: Number(opt("max-patterns", 3)),
  window: opt("window", "300,1410").split(",").map(Number), // keep trips starting in [from,to] minutes
  titlecase: argv.includes("--titlecase"),
  mergeM: Number(opt("merge-m", 15)),
  minHeadway: Number(opt("min-headway", 0)), // 0 = never thin departures
  agency: opt("agency"), // only routes of this agency_id (multi-agency feeds)
  day: opt("day"), // force YYYYMMDD
};
if (!O.out) { console.error("--out required"); process.exit(1); }
const [W, S, E, N] = O.bbox;

// ---- helpers --------------------------------------------------------------
const hav = (a, b) => {
  const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(x));
};
const tmin = (s) => { // "HH:MM:SS" (may exceed 24h) -> minutes, or null
  if (!s) return null;
  const p = s.trim().split(":").map(Number);
  return p.length < 2 || p.some(Number.isNaN) ? null : p[0] * 60 + p[1] + (p[2] || 0) / 60;
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const title = (s) => (O.titlecase && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s.(/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s);
const ymd = (d) => d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
const dayCols = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// ---- representative service day ---------------------------------------------
const cal = readCsv(dir, "calendar", true);
const calDates = readCsv(dir, "calendar_dates", true);
const exc = new Map(); // date -> [{sid,type}]
for (const r of calDates) (exc.get(r.date) ?? exc.set(r.date, []).get(r.date)).push({ sid: r.service_id, type: r.exception_type });
const activeOn = (d) => { // d: Date (UTC) -> Set of service ids
  const key = String(ymd(d)), wd = dayCols[d.getUTCDay()];
  const s = new Set(cal.filter((c) => c[wd] === "1" && c.start_date <= key && key <= c.end_date).map((c) => c.service_id));
  for (const e of exc.get(key) ?? []) e.type === "1" ? s.add(e.sid) : s.delete(e.sid);
  return s;
};
let serviceDay, services;
if (O.day) {
  serviceDay = O.day;
  services = activeOn(new Date(Date.UTC(+O.day.slice(0, 4), +O.day.slice(4, 6) - 1, +O.day.slice(6, 8))));
} else {
  let lo = "99999999", hi = "0";
  for (const c of cal) { if (c.start_date < lo) lo = c.start_date; if (c.end_date > hi) hi = c.end_date; }
  for (const k of exc.keys()) { if (k < lo) lo = k; if (k > hi) hi = k; }
  const tally = new Map(); // set-key -> {n, first}
  const d0 = new Date(Date.UTC(+lo.slice(0, 4), +lo.slice(4, 6) - 1, +lo.slice(6, 8)));
  const d1 = new Date(Date.UTC(+hi.slice(0, 4), +hi.slice(4, 6) - 1, +hi.slice(6, 8)));
  for (let d = d0; d <= d1; d = new Date(d.getTime() + 864e5)) {
    if (d.getUTCDay() < 1 || d.getUTCDay() > 5) continue;
    const s = activeOn(d);
    if (!s.size) continue;
    const k = [...s].sort().join("|");
    const t = tally.get(k) ?? tally.set(k, { n: 0, first: ymd(d), s }).get(k);
    t.n++;
  }
  const top = [...tally.values()].sort((a, b) => b.n - a.n || a.first - b.first)[0];
  if (!top) throw new Error("no weekday service found");
  serviceDay = String(top.first);
  services = top.s;
  console.log(`weekday service set active on ${top.n} weekdays: ${[...services].join(", ")}; representative date ${serviceDay}`);
}

// ---- trips ---------------------------------------------------------------
const routesMeta = new Map(readCsv(dir, "routes").filter((r) => !O.agency || r.agency_id === O.agency).map((r) => [r.route_id, r]));
const trips = new Map();
let tripsOff = 0;
for (const t of readCsv(dir, "trips")) {
  if (!routesMeta.has(t.route_id)) continue;
  if (!services.has(t.service_id)) { tripsOff++; continue; }
  const dir_ = t.direction_id !== undefined && t.direction_id !== "" ? +t.direction_id : /up/i.test(t.trip_id) ? 0 : /down/i.test(t.trip_id) ? 1 : 0;
  trips.set(t.trip_id, { route: t.route_id, dir: dir_, st: [] });
}
for (const r of readCsv(dir, "stop_times", false, (id) => trips.has(id.replace(/^"|"$/g, "")))) {
  const t = trips.get(r.trip_id);
  if (!t) continue;
  t.st.push({ seq: +r.stop_sequence, stop: r.stop_id, t: tmin(r.departure_time) ?? tmin(r.arrival_time) });
}
const freqs = new Map();
for (const f of readCsv(dir, "frequencies", true)) (freqs.get(f.trip_id) ?? freqs.set(f.trip_id, []).get(f.trip_id)).push(f);

// ---- stops ---------------------------------------------------------------
const rawStops = new Map();
let badCoord = 0, outBbox = 0;
const usedRaw = new Set([...trips.values()].flatMap((t) => t.st.map((x) => x.stop)));
for (const r of readCsv(dir, "stops", false, (id) => usedRaw.has(id.replace(/^"|"$/g, "")))) {
  const lat = +r.stop_lat, lon = +r.stop_lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) { badCoord++; continue; }
  if (lon < W || lon > E || lat < S || lat > N) { outBbox++; continue; }
  rawStops.set(r.stop_id, { id: r.stop_id, name: title(r.stop_name.trim()), lat, lon });
}
// merge stops within mergeM metres (grid hash, first wins)
const canon = new Map(); // gtfs stop_id -> canonical stop
const G = 0.0005, cell = (v) => Math.floor(v / G);
const grid = new Map();
let merged = 0;
for (const s of rawStops.values()) {
  let hit = null;
  outer: for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
    for (const c of grid.get(cell(s.lat) + dy + "," + (cell(s.lon) + dx)) ?? []) if (hav(c, s) <= O.mergeM) { hit = c; break outer; }
  if (hit) { canon.set(s.id, hit); merged++; } else {
    canon.set(s.id, s);
    const k = cell(s.lat) + "," + cell(s.lon);
    (grid.get(k) ?? grid.set(k, []).get(k)).push(s);
  }
}


// ---- per-trip: filter stops, interpolate untimed, offsets from first stop -----------
const patterns = new Map(); // route|dir|key -> {route, dir, stops[], offs: number[][], starts: number[]}
let dropTrip = { noTimes: 0, short: 0, outsideWindow: 0, nonMonotone: 0 }, interp = 0, timedRows = 0, allRows = 0;
for (const [tid, t] of trips) {
  t.st.sort((a, b) => a.seq - b.seq);
  // keep stops that survive the bbox/coords filter; collapse consecutive merged duplicates
  const seq = [];
  for (const x of t.st) {
    const c = canon.get(x.stop);
    if (!c) continue;
    allRows++;
    if (x.t !== null) timedRows++;
    if (seq.length && seq[seq.length - 1].c === c) { if (seq[seq.length - 1].t === null) seq[seq.length - 1].t = x.t; continue; }
    seq.push({ c, t: x.t });
  }
  if (seq.length < 2) { dropTrip.short++; continue; }
  // untimed stops: linear in cumulative distance between the surrounding timed stops (GTFS interpolation rule)
  const timed = seq.map((x, i) => (x.t !== null ? i : -1)).filter((i) => i >= 0);
  if (timed.length < 2 || timed[0] !== 0 || timed[timed.length - 1] !== seq.length - 1) { dropTrip.noTimes++; continue; }
  const cum = [0];
  for (let i = 1; i < seq.length; i++) cum.push(cum[i - 1] + hav(seq[i - 1].c, seq[i].c));
  const tt = seq.map((x) => x.t);
  for (let k = 0; k < timed.length - 1; k++) {
    const a = timed[k], b = timed[k + 1];
    for (let i = a + 1; i < b; i++) { tt[i] = tt[a] + ((tt[b] - tt[a]) * (cum[i] - cum[a])) / Math.max(cum[b] - cum[a], 1); interp++; }
  }
  const offs = [];
  let mono = true;
  for (let i = 0; i < tt.length; i++) { const o = tt[i] - tt[0]; if (i && o < offs[i - 1] - 1e-6) mono = false; offs.push(o); }
  if (!mono) { dropTrip.nonMonotone++; continue; }
  // trip start times at first stop: frequencies.txt windows (headway-based) or the stop_times start
  const starts = [];
  const fr = freqs.get(tid);
  if (fr) for (const f of fr) {
    const a = tmin(f.start_time), b = tmin(f.end_time), h = +f.headway_secs / 60;
    if (a === null || b === null || !(h > 0)) continue;
    for (let x = a; x < b; x += h) starts.push(Math.round(x));
  } else starts.push(Math.round(tt[0]));
  const ws = starts.filter((s) => s >= O.window[0] && s <= O.window[1]);
  if (!ws.length) { dropTrip.outsideWindow++; continue; }
  const key = t.route + "|" + t.dir + "|" + seq.map((x) => x.c.id).join(",");
  let p = patterns.get(key);
  if (!p) patterns.set(key, (p = { route: t.route, dir: t.dir, stops: seq.map((x) => x.c), offs: [], starts: [], trips: 0 }));
  p.offs.push(offs);
  p.trips++;
  for (const s of ws) p.starts.push(s);
}

// ---- keep top patterns per route+direction; emit ----------------------------------
const byRD = new Map();
for (const p of patterns.values()) (byRD.get(p.route + "|" + p.dir) ?? byRD.set(p.route + "|" + p.dir, []).get(p.route + "|" + p.dir)).push(p);
const routes = [];
const usedStops = new Set();
let patternsSeen = patterns.size, tripsKept = 0, tripsTotal = 0, depTotal = 0, thinned = 0;
for (const [rd, ps] of byRD) {
  ps.sort((a, b) => b.trips - a.trips);
  tripsTotal += ps.reduce((n, p) => n + p.trips, 0);
  ps.slice(0, O.maxPatterns).forEach((p, k) => {
    tripsKept += p.trips;
    const meta = routesMeta.get(p.route);
    const short = (meta?.route_short_name || p.route).trim();
    const offsets = p.stops.map((_, i) => Math.round(median(p.offs.map((o) => o[i]))));
    for (let i = 1; i < offsets.length; i++) if (offsets[i] < offsets[i - 1]) offsets[i] = offsets[i - 1];
    let deps = [...new Set(p.starts)].sort((a, b) => a - b);
    if (O.minHeadway > 0) { // ponytail: greedy thinning, documented when used
      const kept = [];
      for (const d of deps) if (!kept.length || d - kept[kept.length - 1] >= O.minHeadway) kept.push(d); else thinned++;
      deps = kept;
    }
    if (!deps.length) return;
    p.stops.forEach((s) => usedStops.add(s.id));
    depTotal += deps.length;
    routes.push({
      id: `${O.prefix}_${p.route}_${p.dir}_${k}`,
      mode: "bus",
      name: `${O.label} ${short} ${p.stops[0].name}–${p.stops[p.stops.length - 1].name}`,
      color: O.color,
      stopIds: p.stops.map((s) => O.stopPrefix + s.id),
      offsets,
      departures: deps,
    });
  });
}
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const stops = [...usedStops].map((id) => rawStops.get(id)).map((s) => ({ id: O.stopPrefix + s.id, name: s.name, lat: r5(s.lat), lon: r5(s.lon), mode: "bus" }));
routes.sort((a, b) => (a.id < b.id ? -1 : 1));
const stats = {
  serviceDay, services: [...services], stops: stops.length, routes: routes.length, departures: depTotal,
  stopsInFeedUsable: rawStops.size, badCoord, outsideBbox: outBbox, mergedWithin: `${O.mergeM}m=${merged}`,
  tripsInService: trips.size, tripsOffService: tripsOff, tripsDropped: dropTrip, patternsSeen, patternsKept: routes.length,
  tripsCoveredByKeptPatterns: `${tripsKept}/${tripsTotal}`, stopTimeRows: allRows, rowsWithPublishedTime: timedRows, interpolatedRows: interp, thinnedDepartures: thinned,
};
fs.writeFileSync(O.out, JSON.stringify({ stops, routes, stats }));
console.log(JSON.stringify(stats, null, 1));
console.log(`wrote ${O.out} ${(fs.statSync(O.out).size / 1e6).toFixed(2)} MB`);
