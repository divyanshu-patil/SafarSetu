import { createHash, randomUUID } from "node:crypto";
import { mulberry32, regionOf, type AreaRef, type Report, type ReportCategory, type ReportStatus } from "@repo/core";
import type { Store } from "./store";

// Demo seed: plausible connectivity gaps across Maharashtra. SYNTHETIC — rows carry synthetic=true and the UI labels them.
const A = (name: string, lat: number, lon: number): AreaRef => ({ name, lat, lon });
const GAPS: { from: AreaRef; to: AreaRef; cat: ReportCategory; n: number; text: string }[] = [
  { from: A("Hinjewadi Phase 1", 18.5912, 73.7389), to: A("Shivajinagar", 18.5308, 73.8475), cat: "no_feeder", n: 7, text: "No direct bus in the evening; IT staff depend on shared autos." },
  { from: A("Kharadi", 18.5515, 73.942), to: A("Yerawada", 18.55, 73.887), cat: "infrequent", n: 4, text: "Feeder bus runs once an hour and misses the metro." },
  { from: A("Katraj", 18.4575, 73.8677), to: A("Swargate", 18.5016, 73.858), cat: "poor_transfer", n: 3, text: "Bus arrives just after the metro leaves." },
  { from: A("Baner", 18.559, 73.7868), to: A("Vanaz", 18.5075, 73.805), cat: "hard_to_reach", n: 3, text: "No footpath on the last 600 m to the station." },
  { from: A("Hadapsar", 18.5089, 73.926), to: A("Pune Junction", 18.5285, 73.8742), cat: "long_wait", n: 3, text: "30+ minute waits at the Hadapsar stop after 8 pm." },
  { from: A("Powai", 19.1176, 72.906), to: A("Andheri", 19.1197, 72.8464), cat: "no_feeder", n: 6, text: "Last-mile shuttle to Metro 1 is missing at peak hours." },
  { from: A("Mira Road", 19.2813, 72.8561), to: A("Borivali", 19.2307, 72.8567), cat: "infrequent", n: 4, text: "Bus every 40 min; locals are overcrowded." },
  { from: A("Govandi", 19.0553, 72.915), to: A("Kurla", 19.0654, 72.8793), cat: "hard_to_reach", n: 3, text: "Crossing near the station is unsafe for seniors." },
  { from: A("Vikhroli", 19.11, 72.927), to: A("Ghatkopar", 19.086, 72.9081), cat: "poor_transfer", n: 3, text: "Transfer to Metro 1 needs a long walk through traffic." },
  { from: A("Mankhurd", 19.0467, 72.9333), to: A("BKC", 19.066, 72.8688), cat: "long_wait", n: 2, text: "Bus waits over 25 minutes in the morning." },
  { from: A("Nashik Road Station", 19.947, 73.837), to: A("Panchavati", 20.0059, 73.7897), cat: "infrequent", n: 4, text: "City bus to the temples is infrequent for visiting pilgrims." },
  { from: A("Trimbakeshwar", 19.932, 73.53), to: A("Nashik Road Station", 19.947, 73.837), cat: "long_wait", n: 2, text: "Long wait for return buses after darshan." },
  { from: A("Hingna", 21.089, 79.021), to: A("Sitabuldi", 21.1458, 79.0882), cat: "no_feeder", n: 4, text: "No feeder to Nagpur Metro from the industrial area." },
  { from: A("Nagpur Airport", 21.0922, 79.0472), to: A("Nagpur Station", 21.1527, 79.0888), cat: "accessibility", n: 2, text: "No step-free path to the metro platform." },
  { from: A("Waluj MIDC", 19.84, 75.23), to: A("CIDCO Bus Stand", 19.8855, 75.3547), cat: "no_feeder", n: 3, text: "Workers rely on private vans; no scheduled link." },
  { from: A("Rankala Lake", 16.6934, 74.2127), to: A("Kolhapur Station", 16.7013, 74.2284), cat: "poor_transfer", n: 2, text: "Bus and train timings do not connect." },
];

const STATUS_POOL: ReportStatus[] = ["received", "received", "under_review", "under_review", "more_info", "referred", "action_planned", "resolved"];

export async function seedReports(store: Store) {
  if ((await store.listReports()).length) return;
  const rnd = mulberry32(42);
  let seq = 0;
  for (const g of GAPS) {
    for (let i = 0; i < g.n; i++) {
      const created = new Date(Date.now() - Math.floor(rnd() * 28 * 86400000));
      const status = STATUS_POOL[Math.floor(rnd() * STATUS_POOL.length)]!;
      const reporter = createHash("sha256").update(`seed-${g.from.name}-${Math.floor(rnd() * Math.max(2, g.n - 1))}`).digest("hex").slice(0, 12);
      const r: Report = {
        id: randomUUID(), ref: `SS-${created.getFullYear()}-${String(++seq).padStart(5, "0")}`,
        city: regionOf(g.from), category: g.cat, severity: (1 + Math.floor(rnd() * 3)) as 1 | 2 | 3,
        from: g.from, to: g.to, location: g.from, mode: "bus", description: g.text, status,
        publicNote: status === "referred" ? "Shared with the responsible transport agency for review." : undefined,
        internalNotes: [], reporter, createdAt: created.toISOString(), updatedAt: created.toISOString(), synthetic: true,
      };
      await store.addReport(r);
    }
  }
}
