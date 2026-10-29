// Overpass: notable POIs per city + metro/light-rail. Output .cache/osm.json
import fs from "node:fs";
import path from "node:path";
import { cache, sleep, UA, logSource } from "./lib.mjs";

const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
// [area, south, west, north, east] boxes (approx city extents)
const CITIES = {
  Nagpur: [21.07, 79.0, 21.22, 79.18],
  Nashik: [19.9, 73.7, 20.1, 73.9],
  "Chhatrapati Sambhajinagar": [19.8, 75.25, 19.95, 75.4],
  Kolhapur: [16.65, 74.2, 16.78, 74.3],
  Solapur: [17.62, 75.85, 17.72, 75.97],
  Amravati: [20.9, 77.7, 21.0, 77.82],
  Lonavala: [18.7, 73.35, 18.78, 73.47],
  Mahabaleshwar: [17.9, 73.6, 18.0, 73.7],
  Shirdi: [19.73, 74.45, 19.8, 74.52],
  Thane: [19.15, 72.95, 19.28, 73.05],
  "Navi Mumbai": [18.95, 73.0, 19.15, 73.1],
  Alibag: [18.62, 72.84, 18.7, 72.92],
  "Ajanta & Ellora": [20.0, 75.15, 20.6, 76.0],
};
async function overpass(name, q) {
  const f = path.join(cache, `osm_${name.replace(/\W+/g, "_")}.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: "data=" + encodeURIComponent(q), signal: AbortSignal.timeout(90000) });
      if (r.ok) { const j = await r.json(); fs.writeFileSync(f, JSON.stringify(j)); await sleep(2500); return j; }
      console.log(name, url, r.status);
    } catch (e) { console.log(name, url, String(e)); }
    await sleep(2000);
  }
  return null;
}
const out = { places: {}, metro: [], status: {} };
for (const [city, [s, w, n, e]] of Object.entries(CITIES)) {
  const b = `${s},${w},${n},${e}`;
  const q = `[out:json][timeout:60];(nwr["tourism"~"^(attraction|museum|viewpoint)$"]["name"](${b});nwr["historic"~"^(fort|monument|temple|castle|archaeological_site)$"]["name"](${b});nwr["amenity"="place_of_worship"]["name"]["wikidata"](${b}););out center tags 300;`;
  const j = await overpass(city, q);
  out.status[city] = j ? j.elements.length : "FAILED";
  out.places[city] = j ? j.elements : [];
  console.log(city, out.status[city]);
}
// metro / light rail relations in Maharashtra
const mq = `[out:json][timeout:90];area["name"="Maharashtra"]["admin_level"="4"]->.a;(relation["route"~"^(subway|light_rail)$"](area.a););out geom tags 50;`;
const mj = await overpass("metro", `[out:json][timeout:90];area["name"="Maharashtra"]["admin_level"="4"]->.a;relation["route"~"^(subway|light_rail)$"](area.a);out tags;`);
out.status.metroRelations = mj ? mj.elements.length : "FAILED";
if (mj) {
  const ids = mj.elements.map((r) => r.id);
  console.log("metro relations", mj.elements.map((r) => r.tags?.name));
  for (const r of mj.elements) {
    const q2 = `[out:json][timeout:60];relation(${r.id});node(r:"stop");out tags center;`;
    const nodes = await overpass("metro_" + r.id, q2);
    // member order matters: fetch relation members too
    const rel = await overpass("metrorel_" + r.id, `[out:json][timeout:60];relation(${r.id});out;`);
    out.metro.push({ id: r.id, tags: r.tags, members: rel?.elements?.[0]?.members ?? [], nodes: nodes?.elements ?? [] });
  }
}
fs.writeFileSync(path.join(cache, "osm.json"), JSON.stringify(out));
console.log(out.status);
