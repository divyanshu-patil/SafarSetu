// pnpm --filter @repo/core scrape:gtfs  -> src/data/{pmpml,best}.generated.json
// Downloads the community GTFS zips into scripts/gtfs/.cache (gitignored, fresh dirs), unzips with the system `unzip`,
// runs import-gtfs.mjs. Source/licence log: scripts/gtfs/SOURCES.json
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(here, ".cache");
const out = path.join(here, "..", "..", "src", "data");
const jobs = [
  {
    name: "pmpml",
    url: "https://raw.githubusercontent.com/croyla/pmpml-gtfs/main/pmpml_gtfs_compat.zip",
    license: "MIT-0 (c) 2026 Aayush Rai",
    args: ["--prefix", "pmpml", "--stop-prefix", "pm_", "--label", "PMPML", "--color", "#0e7490", "--bbox", "73.3,18.4,74.0,18.8", "--max-patterns", "3"],
  },
  {
    name: "best",
    url: "https://raw.githubusercontent.com/croyla/mumbai-gtfs/main/gtfs_compat.zip",
    license: "MIT-0 (c) 2026 Aayush Rai",
    args: ["--prefix", "best", "--stop-prefix", "be_", "--label", "BEST", "--color", "#b91c1c", "--bbox", "72.75,18.88,73.05,19.3", "--agency", "BEST", "--max-patterns", "3"],
  },
];
for (const j of jobs) {
  const zip = path.join(cache, `${j.name}.zip`);
  const dir = path.join(cache, j.name);
  fs.mkdirSync(cache, { recursive: true });
  if (!fs.existsSync(zip) || !fs.statSync(zip).size) {
    const r = await fetch(j.url, { headers: { "User-Agent": "SafarSetu-research/0.1" } });
    if (!r.ok) throw new Error(`${j.url} -> ${r.status}`);
    fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  }
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync("unzip", ["-q", "-o", zip, "-d", dir]);
  const file = path.join(out, `${j.name}.generated.json`);
  execFileSync("node", ["--max-old-space-size=4096", path.join(here, "import-gtfs.mjs"), dir, "--out", file, ...j.args], { stdio: "inherit" });
  const g = JSON.parse(fs.readFileSync(file, "utf8"));
  g.meta = { source: j.url, license: j.license, retrievedAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(g));
}
