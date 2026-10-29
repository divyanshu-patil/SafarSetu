/**
 * Smoke test for the Supabase storage adapter. Run against a LOCAL Supabase (never production data):
 *   npx supabase start && npx supabase db reset            (from apps/api)
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<from `npx supabase status`> pnpm --filter api test:supabase
 * Exercises every Store method through the same Engine code the API uses, then cleans up what it created.
 */
import assert from "node:assert/strict";
import { PUNE_JN } from "@repo/core";
import { Engine } from "../src/engine";
import { seedReports } from "../src/seed-reports";
import { SupabaseStore } from "../src/store";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local Supabase only).");
if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("Refusing to run against a non-local Supabase URL.");

const store = new SupabaseStore(url, key);
const engine = new Engine(store);
engine.clock.set({ date: "2026-11-02", minute: 7 * 60, speed: 1, running: false });

const rec = await engine.createPlan("smoke-user", {
  city: "pune", date: "2026-11-02", origin: { ...PUNE_JN }, startMin: 540, endMin: 1200, keepOrder: true,
  places: [{ name: "Hinjewadi", lat: 18.5912, lon: 73.7389, task: "Client", minDwell: 60, maxDwell: 60, arriveBy: 690, required: true }],
});
assert.ok((await store.getPlan(rec.id))?.plan.timeline.length);
assert.ok((await store.listPlans("smoke-user")).some((p) => p.id === rec.id));
assert.ok((await store.listNotifications(rec.id)).length > 0, "reminders stored");

const ds = await engine.scenario("metro-late-5", rec.id, "pune");
assert.equal(ds.length, 1);
assert.ok((await store.listDisruptions()).length >= 1);
await engine.clearDisruptions();
assert.equal((await store.listDisruptions()).length, 0);

await seedReports(store);
const reports = await store.listReports();
assert.ok(reports.length > 20);
const r = reports[0]!;
await store.updateReport({ ...r, status: "under_review", internalNotes: [{ at: new Date().toISOString(), by: "smoke", text: "ok" }] });
assert.equal((await store.getReport(r.ref))?.status, "under_review");
assert.equal((await store.getReport(r.id))?.internalNotes.length, 1);

await store.addInterview({ id: crypto.randomUUID(), code: "SMOKE-1", date: "2026-11-02", city: "Pune", role: "test", route: "x", modes: ["bus"], problem: "smoke test row", perWeek: 1, minutesLostPerWeek: 1, rupeesLostPerWeek: 1, workaround: "", triedAndFailed: "", consent: true, createdAt: new Date().toISOString() });
assert.ok((await store.listInterviews()).some((i) => i.code === "SMOKE-1"));
console.log("Supabase adapter smoke test passed ✔ — delete the SMOKE-1 interview and smoke-user plan rows if you want a clean DB.");
