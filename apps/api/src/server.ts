import { createApp } from "./app";
import { availableParallelism } from "node:os";
import { PoolCompute } from "./compute";
import { Engine } from "./engine";
import { startGtfsRtPoller } from "./gtfs-rt";
import { seedReports } from "./seed-reports";
import { createStore } from "./store";

// planning is CPU-bound: run it on a worker pool (WORKERS=0 → same thread). Default: up to 4 workers, leaving a core for the event loop.
const workers = Number(process.env.WORKERS ?? Math.min(4, Math.max(0, availableParallelism() - 1)));
const engine = new Engine(createStore(), undefined, workers > 0 ? new PoolCompute(workers) : undefined);
if (process.env.SEED_DEMO !== "false") await seedReports(engine.store);
// Optional live feed: set GTFS_RT_URL (+ GTFS_RT_PREFIX=pmpml|best, GTFS_RT_CITY=pune|mumbai). No public feed exists today — see docs/16.
if (process.env.GTFS_RT_URL) {
  const net = engine.network(process.env.GTFS_RT_CITY ?? "pune");
  startGtfsRtPoller({ url: process.env.GTFS_RT_URL, prefix: process.env.GTFS_RT_PREFIX ?? "pmpml", net, apply: (d) => engine.replaceSource("gtfs-rt", d) });
}
const port = Number(process.env.PORT ?? 4000);
createApp(engine).listen(port, () => console.log(`SafarSetu API on :${port} (store: ${engine.store.kind})`));
// retention (privacy notice: reports kept 12 months): purge at boot and daily
const RETENTION_DAYS = Number(process.env.REPORT_RETENTION_DAYS ?? 365);
const purge = () => engine.store.purgeReportsBefore(new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString()).then((n) => n && console.log(`retention: purged ${n} reports older than ${RETENTION_DAYS} days`)).catch((e) => console.error("purge", e));
purge();
setInterval(purge, 24 * 3600_000);
setInterval(() => engine.tick().catch((e) => console.error("tick", e)), 1000);
