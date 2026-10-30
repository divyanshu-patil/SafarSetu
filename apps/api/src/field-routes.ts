import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { HttpError } from "./engine";
import type { Feedback, Interview, Store } from "./store";

const body = z.object({
  code: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().min(1).max(40),
  role: z.string().min(1).max(60),
  route: z.string().min(1).max(160),
  modes: z.array(z.string().max(20)).max(6).default([]),
  problem: z.string().min(5).max(500),
  perWeek: z.number().min(0).max(100),
  minutesLostPerWeek: z.number().min(0).max(5000),
  rupeesLostPerWeek: z.number().min(0).max(100000),
  workaround: z.string().max(300).default(""),
  triedAndFailed: z.string().max(300).default(""),
  consent: z.literal(true, { error: "Consent is required" }),
});

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

/** Field evidence kit. Writing needs the team key (FIELD_KEY); in non-production with no key set it is open so the demo works. */
export function mountField(app: Express, store: Store) {
  const key = process.env.FIELD_KEY;
  const guard = (h?: string) => {
    if (key ? h !== key : process.env.NODE_ENV === "production") throw new HttpError(401, "unauthorized", "Team key required to log interviews");
  };

  app.post("/v1/field/interviews", async (req, res) => {
    guard(req.header("x-field-key"));
    const r = body.safeParse(req.body);
    if (!r.success) throw new HttpError(400, "invalid_body", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    const i: Interview = { id: randomUUID(), ...r.data, createdAt: new Date().toISOString() };
    await store.addInterview(i);
    res.status(201).json({ id: i.id });
  });

  /** aggregates + consented, anonymous quotes. This is what goes on the problem slide — n and dates included. */
  app.get("/v1/field/summary", async (req, res) => {
    const team = key ? req.header("x-field-key") === key : process.env.NODE_ENV !== "production";
    const all = await store.listInterviews();
    const dates = all.map((i) => i.date).sort();
    const byRole: Record<string, number> = {};
    const modes: Record<string, number> = {};
    for (const i of all) {
      byRole[i.role] = (byRole[i.role] ?? 0) + 1;
      for (const m of i.modes) modes[m] = (modes[m] ?? 0) + 1;
    }
    res.json({
      n: all.length,
      from: dates[0] ?? null,
      to: dates.at(-1) ?? null,
      avgPerWeek: avg(all.map((i) => i.perWeek)),
      avgMinutesLostPerWeek: avg(all.map((i) => i.minutesLostPerWeek)),
      avgRupeesLostPerWeek: avg(all.map((i) => i.rupeesLostPerWeek)),
      byRole,
      modes,
      // free-text quotes are shown only to the team (they could contain personal details by accident)
      quotes: !team ? [] : all.slice(0, 8).map((i) => ({ code: i.code, role: i.role, route: i.route, problem: i.problem, workaround: i.workaround })),
      note: all.length ? "Primary evidence from consented, anonymous interviews." : "No interviews logged yet — nothing here is a result.",
    });
  });

  // ---- pilot feedback (anonymous, aggregated) ----------------------------------
  const fb = z.object({
    kind: z.enum(["alert", "trip"]),
    planId: z.string().uuid().optional(),
    alertKind: z.string().max(20).optional(),
    useful: z.boolean().optional(),
    onTime: z.boolean().optional(),
    minutesLate: z.number().int().min(0).max(600).optional(),
  });
  const seen = new Map<string, number>();
  app.post("/v1/feedback", async (req, res) => {
    const b = fb.safeParse(req.body);
    if (!b.success) throw new HttpError(400, "invalid_body", b.error.issues.map((i) => i.message).join("; "));
    const k = `${req.ip}`;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    if (n > 200) throw new HttpError(429, "rate_limited", "Too much feedback from this device");
    const f: Feedback = { id: randomUUID(), ...b.data, createdAt: new Date().toISOString() };
    await store.addFeedback(f);
    res.status(201).json({ ok: true });
  });
  app.get("/v1/feedback/summary", async (_req, res) => {
    const all = await store.listFeedback();
    const alerts = all.filter((f) => f.kind === "alert" && f.useful !== undefined);
    const trips = all.filter((f) => f.kind === "trip" && f.onTime !== undefined);
    const late = trips.filter((f) => f.onTime === false);
    const byKind: Record<string, { n: number; useful: number }> = {};
    for (const a of alerts) {
      const e = (byKind[a.alertKind ?? "other"] ??= { n: 0, useful: 0 });
      e.n++;
      if (a.useful) e.useful++;
    }
    res.json({
      alerts: { n: alerts.length, usefulPct: alerts.length ? Math.round((100 * alerts.filter((a) => a.useful).length) / alerts.length) : null, byKind },
      trips: { n: trips.length, onTimePct: trips.length ? Math.round((100 * trips.filter((t) => t.onTime).length) / trips.length) : null, avgMinutesLate: late.length ? Math.round(late.reduce((s, t) => s + (t.minutesLate ?? 0), 0) / late.length) : null },
      note: alerts.length + trips.length ? "Anonymous, self-reported feedback from people who chose to answer — not a controlled measurement." : "No feedback yet — nothing here is a result.",
    });
  });
}
