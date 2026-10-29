import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const dir = path.dirname(fileURLToPath(import.meta.url));
export const cache = path.join(dir, ".cache");
fs.mkdirSync(cache, { recursive: true });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const UA = "SafarSetu-research/0.1";
export const MH = { w: 72.6, s: 15.6, e: 80.9, n: 22.1 };
export const inMH = (lon, lat) => lon >= MH.w && lon <= MH.e && lat >= MH.s && lat <= MH.n;
export const sourcesFile = path.join(dir, "SOURCES.json");
/** record/overwrite a source entry by name */
export function logSource(entry) {
  let a = [];
  try { a = JSON.parse(fs.readFileSync(sourcesFile, "utf8")); } catch {}
  a = a.filter((x) => x.name !== entry.name);
  a.push({ ...entry, retrievedAt: new Date().toISOString() });
  fs.writeFileSync(sourcesFile, JSON.stringify(a, null, 2));
}
export async function cachedGet(name, url) {
  const f = path.join(cache, name);
  if (fs.existsSync(f) && fs.statSync(f).size > 0) return f;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return f;
}
