import { createHash, randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { CATEGORIES, DEFAULT_WEIGHTS, PROMISE, REGIONS, STATUSES, clusterReports, networks, regionOf, toPublic, type Report, type ReportStatus } from "@repo/core";
import { canDecide, canSee, demoHint, login, requireAuthority, type AuthUser } from "./auth";
import { Engine, HttpError } from "./engine";

const lat = z.number().min(-90).max(90);
const lon = z.number().min(-180).max(180);
const area = z.object({ name: z.string().min(1).max(120), lat, lon });
const cats = Object.keys(CATEGORIES) as [string, ...string[]];
const statuses = Object.keys(STATUSES) as [string, ...string[]];

const createBody = z.object({
  category: z.enum(cats),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  from: area.optional(),
  to: area.optional(),
  location: area.optional(),
  mode: z.enum(["metro", "train", "bus", "walk", "any"]).default("any"),
  timeOfDay: z.string().max(20).optional(),
  description: z.string().max(600).default(""),
}).refine((b) => b.from || b.location, { message: "Provide the area (from) or a location" });

const patchBody = z.object({
  status: z.enum(statuses).optional(),
  publicNote: z.string().max(400).optional(),
  internalNote: z.string().max(1000).optional(),
  assignee: z.string().max(80).optional(),
});

const parse = <T extends z.ZodType>(s: T, body: unknown): z.infer<T> => {
  const r = s.safeParse(body);
  if (!r.success) throw new HttpError(400, "invalid_body", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
};

const hashId = (id: string) => createHash("sha256").update(`ss:${id}`).digest("hex").slice(0, 12);
const staff = (r: Report) => ({ ...r, reporter: undefined });

export function mountReports(app: Express, engine: Engine) {
  const store = engine.store;
  const hits = new Map<string, number[]>();
  let seq = 0;
  const nextRef = async () => {
    if (!seq) seq = (await store.listReports()).length;
    return `SS-${new Date().getFullYear()}-${String(++seq).padStart(5, "0")}`;
  };

  // ---- citizen -----------------------------------------------------------
  app.post("/v1/reports", async (req, res) => {
    const user = String(req.header("x-user-id") ?? "demo").slice(0, 64);
    const recent = (hits.get(user) ?? []).filter((t) => Date.now() - t < 3600_000);
    if (recent.length >= 10) throw new HttpError(429, "rate_limited", "Too many reports in the last hour. Please try again later.");
    hits.set(user, [...recent, Date.now()]);
    const b = parse(createBody, req.body);
    const loc = b.location ?? b.from!;
    const now = new Date().toISOString();
    const r: Report = {
      id: randomUUID(), ref: await nextRef(), city: regionOf(b.from ?? loc), category: b.category as Report["category"], severity: b.severity,
      from: b.from, to: b.to, location: loc, mode: b.mode, timeOfDay: b.timeOfDay, description: b.description.trim(),
      status: "received", internalNotes: [], reporter: hashId(user), createdAt: now, updatedAt: now,
    };
    await store.addReport(r);
    res.status(201).json({ report: toPublic(r), promise: PROMISE });
  });
  app.get("/v1/reports/track/:ref", async (req, res) => {
    const r = await store.getReport(String(req.params.ref));
    if (!r) throw new HttpError(404, "not_found", "No report with that reference");
    res.json({ report: toPublic(r) });
  });
  app.get("/v1/reports/mine", async (req, res) => {
    const me = hashId(String(req.header("x-user-id") ?? "demo").slice(0, 64));
    res.json({ items: (await store.listReports()).filter((r) => r.reporter === me && !r.synthetic).map(toPublic) });
  });

  // ---- authority auth ------------------------------------------------------
  app.post("/v1/auth/login", (req, res) => {
    const b = parse(z.object({ email: z.string().max(120), password: z.string().max(200) }), req.body);
    const r = login(b.email, b.password);
    if (!r) throw new HttpError(401, "bad_credentials", "Email or password is incorrect");
    res.json(r);
  });
  app.get("/v1/auth/me", requireAuthority, (req, res) => res.json({ user: res.locals.authority }));
  app.get("/v1/auth/demo", (_req, res) => res.json({ accounts: demoHint() }));

  // ---- authority workspace -------------------------------------------------
  const visible = async (u: AuthUser) => (await store.listReports()).filter((r) => canSee(u, r.city));

  app.get("/v1/authority/reports", requireAuthority, async (req, res) => {
    const q = req.query;
    let items = await visible(res.locals.authority);
    const facets = { status: {} as Record<string, number>, category: {} as Record<string, number>, city: {} as Record<string, number> };
    for (const r of items) {
      facets.status[r.status] = (facets.status[r.status] ?? 0) + 1;
      facets.category[r.category] = (facets.category[r.category] ?? 0) + 1;
      facets.city[r.city] = (facets.city[r.city] ?? 0) + 1;
    }
    const f = (k: string) => (q[k] ? String(q[k]) : undefined);
    if (f("status")) items = items.filter((r) => r.status === f("status"));
    if (f("category")) items = items.filter((r) => r.category === f("category"));
    if (f("city")) items = items.filter((r) => r.city === f("city"));
    if (f("q")) { const n = f("q")!.toLowerCase(); items = items.filter((r) => [r.description, r.ref, r.from?.name, r.to?.name, r.location.name].join(" ").toLowerCase().includes(n)); }
    res.json({ total: items.length, facets, items: items.slice(0, 200).map(staff) });
  });
  app.get("/v1/authority/reports/:id", requireAuthority, async (req, res) => {
    const r = await store.getReport(String(req.params.id));
    if (!r || !canSee(res.locals.authority, r.city)) throw new HttpError(404, "not_found", "Report not found");
    res.json({ report: staff(r) });
  });
  app.patch("/v1/authority/reports/:id", requireAuthority, async (req, res) => {
    const u = res.locals.authority as AuthUser;
    const r = await store.getReport(String(req.params.id));
    if (!r || !canSee(u, r.city)) throw new HttpError(404, "not_found", "Report not found");
    const b = parse(patchBody, req.body);
    if ((b.status || b.publicNote !== undefined || b.assignee !== undefined) && !canDecide(u)) throw new HttpError(403, "forbidden", "Your role can add internal notes but cannot change status or public notes");
    if (b.status) r.status = b.status as ReportStatus;
    if (b.publicNote !== undefined) r.publicNote = b.publicNote || undefined;
    if (b.assignee !== undefined) r.assignee = b.assignee || undefined;
    if (b.internalNote) r.internalNotes.push({ at: new Date().toISOString(), by: u.name, text: b.internalNote });
    r.updatedAt = new Date().toISOString();
    await store.updateReport(r);
    res.json({ report: staff(r) });
  });

  app.get("/v1/authority/issues", requireAuthority, async (req, res) => {
    const n = (k: string, d: number) => (req.query[k] !== undefined && Number.isFinite(Number(req.query[k])) ? Math.max(0, Number(req.query[k])) : d);
    const w = { volume: n("wVolume", DEFAULT_WEIGHTS.volume), unique: n("wUnique", DEFAULT_WEIGHTS.unique), severity: n("wSeverity", DEFAULT_WEIGHTS.severity), recency: n("wRecency", DEFAULT_WEIGHTS.recency) };
    const items = clusterReports(await visible(res.locals.authority), w).slice(0, 30);
    res.json({ weights: w, note: "Suggested groupings for human review — not official findings.", items });
  });

  app.get("/v1/authority/overview", requireAuthority, async (req, res) => {
    const rs = await visible(res.locals.authority);
    const byStatus: Record<string, number> = {}, byCategory: Record<string, number> = {}, byRegion: Record<string, number> = {};
    const day = (t: string) => t.slice(0, 10);
    const trend = new Map<string, number>();
    for (let i = 29; i >= 0; i--) trend.set(day(new Date(Date.now() - i * 86400000).toISOString()), 0);
    for (const r of rs) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      byRegion[r.city] = (byRegion[r.city] ?? 0) + 1;
      const d = day(r.createdAt);
      if (trend.has(d)) trend.set(d, trend.get(d)! + 1);
    }
    const open = rs.filter((r) => !["resolved", "closed"].includes(r.status)).length;
    const stale = rs.filter((r) => r.status === "received" && Date.now() - Date.parse(r.createdAt) > 7 * 86400000).length;
    res.json({
      user: res.locals.authority,
      totals: { reports: rs.length, open, awaitingReview: rs.filter((r) => r.status === "received").length, stale, resolved: rs.filter((r) => r.status === "resolved").length },
      byStatus, byCategory,
      byRegion: Object.entries(byRegion).map(([id, count]) => ({ id, name: REGIONS.find((x) => x.id === id)?.name ?? "Other Maharashtra", count })).sort((a, b) => b.count - a.count),
      trend: [...trend].map(([date, count]) => ({ date, count })),
      topIssues: clusterReports(rs).slice(0, 5),
      pins: rs.map((r) => ({ id: r.id, ref: r.ref, category: r.category, status: r.status, severity: r.severity, location: r.location, from: r.from, to: r.to })),
      coverage: Object.values(networks).map((n) => ({ id: n.id, city: n.city, stops: n.stops.length, routes: n.routes.length, places: n.places.length, dataQuality: n.meta.dataQuality, note: n.meta.note })),
      synthetic: rs.some((r) => r.synthetic),
    });
  });
}
