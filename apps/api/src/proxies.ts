import { haversine } from "@repo/core";

const UA = `SafarSetu/0.1 (${process.env.GEO_CONTACT ?? "demo"})`;
const cache = new Map<string, { exp: number; v: unknown }>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.v as T;
  const v = await fn();
  cache.set(key, { exp: Date.now() + ttlMs, v });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!); // ponytail: FIFO eviction, Redis when multi-instance
  return v;
}

const getJson = async (url: string, ms = 4000) => {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`);
  return r.json();
};

// Nominatim policy: max 1 request/second. Serialize through a gate.
let gate = Promise.resolve();
const nominatimSlot = () => {
  const p = gate.then(() => new Promise<void>((r) => setTimeout(r, 1100)));
  gate = p;
  return p;
};

export interface GeoHit {
  name: string;
  lat: number;
  lon: number;
  source: "local" | "photon" | "nominatim";
}

export async function geocode(q: string, bbox: [number, number, number, number], local: GeoHit[]): Promise<GeoHit[]> {
  const needle = q.toLowerCase();
  const own = local.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 5);
  if (q.length < 3) return own;
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&bbox=${bbox.join(",")}`;
    const j = (await cached(`geo:${needle}:${bbox}`, 3600_000, () => getJson(url))) as { features: { geometry: { coordinates: [number, number] }; properties: { name?: string; street?: string; city?: string; district?: string } }[] };
    const remote: GeoHit[] = j.features
      .filter((f) => f.properties.name)
      .map((f) => ({ name: [f.properties.name, f.properties.district ?? f.properties.street ?? f.properties.city].filter(Boolean).join(", "), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], source: "photon" as const }));
    return [...own, ...remote].slice(0, 8);
  } catch {
    return own; // offline / rate-limited: local gazetteer only
  }
}

export async function reverse(lat: number, lon: number): Promise<{ name: string }> {
  const key = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
  try {
    return await cached(key, 24 * 3600_000, async () => {
      await nominatimSlot();
      const j = (await getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=17`)) as { display_name?: string; name?: string };
      return { name: j.name || j.display_name?.split(",").slice(0, 2).join(",") || `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
    });
  } catch {
    return { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
  }
}

export async function walkRoute(a: [number, number], b: [number, number]) {
  const key = `walk:${a.map((x) => x.toFixed(5))}:${b.map((x) => x.toFixed(5))}`;
  const straight = () => ({ coords: [a, b] as [number, number][], distM: Math.round(haversine({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] }) * 1.25), source: "straight-line" });
  try {
    return await cached(key, 24 * 3600_000, async () => {
      const j = (await getJson(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`)) as { routes?: { distance: number; geometry: { coordinates: [number, number][] } }[] };
      const r = j.routes?.[0];
      if (!r) throw new Error("no route");
      return { coords: r.geometry.coordinates.map(([lo, la]) => [la, lo] as [number, number]), distM: Math.round(r.distance), source: "osrm-foot" };
    });
  } catch {
    return straight();
  }
}

export async function weather(lat: number, lon: number) {
  const key = `wx:${lat.toFixed(2)},${lon.toFixed(2)}`;
  try {
    return await cached(key, 15 * 60_000, async () => {
      const j = (await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,temperature_2m&forecast_days=1&timezone=Asia%2FKolkata`)) as { hourly: { precipitation_probability: number[]; temperature_2m: number[]; time: string[] } };
      return { hours: j.hourly.time.map((t) => Number(t.slice(11, 13))), rainProb: j.hourly.precipitation_probability, tempC: j.hourly.temperature_2m, source: "open-meteo" };
    });
  } catch {
    return { hours: [], rainProb: [], tempC: [], source: "unavailable" };
  }
}
