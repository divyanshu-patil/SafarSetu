import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { buildLive, getNetwork, networks, planRoute, type PlanRequest } from "@repo/core";
import { Engine, HttpError, SCENARIOS, type Scenario } from "./engine";
import { mountReports } from "./reports-routes";
import { geocode, reverse, walkRoute, weather } from "./proxies";

const MAHARASHTRA_BBOX: [number, number, number, number] = [72.6, 15.6, 80.9, 22.1];
const lat = z.number().min(-90).max(90);
const lon = z.number().min(-180).max(180);
const pt = z.object({ name: z.string().min(1).max(120), lat, lon });
const placeInput = z.object({
  placeId: z.string().max(60).optional(),
  name: z.string().max(120).optional(),
  lat: lat.optional(),
  lon: lon.optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  minDwell: z.number().int().min(5).max(600).optional(),
  maxDwell: z.number().int().min(5).max(900).optional(),
  opens: z.number().min(0).max(1440).optional(),
  closes: z.number().min(0).max(1440).optional(),
  arriveBy: z.number().min(0).max(1440).optional(),
  task: z.string().max(120).optional(),
  required: z.boolean().optional(),
});
const prefs = z.object({ pace: z.enum(["relaxed", "normal", "fast"]).optional(), maxWalkM: z.number().min(200).max(3000).optional(), avoid: z.array(z.enum(["metro", "train", "bus", "local", "express", "cab"])).optional(), style: z.enum(["calm", "brief"]).optional() });
const planReq = z.object({
  city: z.string().max(20).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  origin: pt,
  startMin: z.number().min(0).max(1439),
  endMin: z.number().min(1).max(1440),
  returnToOrigin: z.boolean().optional(),
  keepOrder: z.boolean().optional(),
  places: z.array(placeInput).min(1).max(12),
  prefs: prefs.optional(),
  traveller: z.object({ name: z.string().max(60).optional() }).optional(),
});
const routeReq = z.object({ city: z.string().optional(), from: z.object({ lat, lon }), to: z.object({ lat, lon }), departMin: z.number().min(0).max(1439).optional(), arriveByMin: z.number().min(0).max(1440).optional(), prefs: prefs.optional() });
const disruption = z.object({
  id: z.string().optional(),
  type: z.enum(["delay", "cancellation", "stop_closed", "weather"]),
  routeId: z.string().optional(),
  tripDeparture: z.number().optional(),
  stopId: z.string().optional(),
  delayMin: z.number().min(0).max(600).optional(),
  fromMin: z.number().min(0).max(1440),
  untilMin: z.number().min(0).max(1440),
  source: z.enum(["operator", "gtfs-rt", "crowd", "simulator"]),
  verified: z.boolean().optional(),
  note: z.string().max(200).optional(),
});

const num = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new HttpError(400, "bad_request", "Invalid number in query");
  return n;
};
const pair = (v: unknown): [number, number] => {
  const [a, b] = String(v).split(",").map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new HttpError(400, "bad_request", "Expected lat,lon");
  return [a!, b!];
};
const parse = <T extends z.ZodType>(s: T, body: unknown): z.infer<T> => {
  const r = s.safeParse(body);
  if (!r.success) throw new HttpError(400, "invalid_body", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
};

export function createApp(engine: Engine): Express {
  const app = express();
  const simOn = process.env.SIM_ENABLED !== "false";
  app.use(cors({ methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
  app.use(express.json({ limit: "200kb" }));
  const user = (req: Request) => String(req.header("x-user-id") ?? "demo").slice(0, 64);
  const city = (req: Request) => String(req.query.city ?? "pune");

  app.get("/health", (_req, res) => res.json({ ok: true, store: engine.store.kind, sim: simOn, now: engine.clock.state() }));

  app.get("/v1/cities", (_req, res) => res.json({ items: Object.values(networks).map((n) => ({ id: n.id, city: n.city, bbox: n.bbox, presets: n.presets, meta: n.meta })) }));
  // light by default (places, presets, bbox, meta): the state network carries hundreds of timetabled routes. ?full=1 for stops + routes.
  app.get("/v1/network", (req, res) => {
    const n = engine.network(city(req));
    res.json(req.query.full ? n : { ...n, stops: [], routes: [], counts: { stops: n.stops.length, routes: n.routes.length } });
  });
  app.get("/v1/places", (req, res) => {
    const q = String(req.query.q ?? "").toLowerCase();
    res.json({ items: engine.network(city(req)).places.filter((p) => !q || p.name.toLowerCase().includes(q)) });
  });

  app.post("/v1/route", async (req, res) => {
    const b = parse(routeReq, req.body);
    const net = engine.network(b.city);
    const live = buildLive(await engine.store.listDisruptions());
    res.json({ ...planRoute(net, b.from, b.to, { departMin: b.departMin ?? engine.clock.now().minute, arriveByMin: b.arriveByMin, prefs: b.prefs }, live), meta: net.meta });
  });

  app.post("/v1/plans", async (req, res) => {
    const body = parse(planReq, req.body) as PlanRequest;
    if (body.endMin <= body.startMin) throw new HttpError(400, "invalid_body", "endMin must be after startMin");
    const rec = await engine.createPlan(user(req), body);
    res.status(201).json({ id: rec.id, plan: rec.plan });
  });
  app.get("/v1/plans", async (req, res) => res.json({ items: (await engine.store.listPlans(String(req.query.userId ?? user(req)))).map((p) => ({ id: p.id, city: p.city, date: p.date, state: p.state, revision: p.plan.revision, visits: p.plan.timeline.filter((e) => e.kind === "visit").length, updatedAt: p.updatedAt })) }));
  app.get("/v1/plans/:id", async (req, res) => {
    const rec = await engine.getPlan(String(req.params.id));
    res.json({ id: rec.id, plan: rec.plan });
  });
  app.get("/v1/plans/:id/status", async (req, res) => res.json(await engine.status(String(req.params.id))));
  app.post("/v1/plans/:id/replan", async (req, res) => {
    await engine.getPlan(String(req.params.id));
    await engine.applyDisruptions("manual replan");
    res.json(await engine.status(String(req.params.id)));
  });

  app.get("/v1/notifications", async (req, res) => {
    const items = await engine.store.listNotifications(String(req.query.planId ?? ""));
    res.json({ items: items.map((n) => ({ id: n.id, planId: n.planId, kind: n.kind, title: n.title, body: n.body, fireMin: n.fireMin, sent: n.sent })) });
  });
  app.post("/v1/devices", async (req, res) => {
    const b = parse(z.object({ platform: z.enum(["web", "expo"]), token: z.string().min(8).max(500) }), req.body);
    await engine.store.saveDevice(user(req), b.platform, b.token);
    res.status(201).json({ ok: true });
  });

  app.get("/v1/stream/:planId", async (req, res) => {
    await engine.getPlan(String(req.params.planId));
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    res.write(`event: clock\ndata: ${JSON.stringify(engine.clock.state())}\n\n`);
    engine.subscribe(String(req.params.planId), res);
  });

  app.get("/v1/disruptions", async (_req, res) => res.json({ items: await engine.store.listDisruptions() }));
  app.post("/v1/disruptions", async (req, res) => {
    const key = process.env.INGEST_KEY;
    if (key && req.header("x-ingest-key") !== key) throw new HttpError(401, "unauthorized", "Missing or bad x-ingest-key");
    res.status(201).json(await engine.addDisruption(parse(disruption, req.body)));
  });
  app.delete("/v1/disruptions/:id", async (req, res) => {
    await engine.clearDisruptions(String(req.params.id));
    res.json({ ok: true });
  });

  const needSim = (_req: Request, _res: Response, next: NextFunction) => (simOn ? next() : next(new HttpError(403, "sim_disabled", "Simulator is disabled")));
  app.get("/v1/sim/clock", (_req, res) => res.json(engine.clock.state()));
  app.post("/v1/sim/clock", needSim, async (req, res) => {
    const b = parse(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), minute: z.number().min(0).max(1439).optional(), speed: z.number().min(0).max(3600).optional(), running: z.boolean().optional() }), req.body);
    engine.clock.set(b);
    res.json(engine.clock.state());
  });
  app.post("/v1/sim/scenario", needSim, async (req, res) => {
    const b = parse(z.object({ name: z.enum(SCENARIOS), planId: z.string().optional(), city: z.string().optional() }), req.body);
    res.json({ disruptions: await engine.scenario(b.name as Scenario, b.planId, b.city) });
  });

  app.get("/v1/geocode", async (req, res) => {
    const net = getNetwork(city(req));
    const pool = net ? [net] : Object.values(networks);
    const local = pool.flatMap((n) => [...n.places, ...n.stops.filter((s) => s.mode !== "bus")]).map((p) => ({ name: p.name, lat: p.lat, lon: p.lon, source: "local" as const }));
    res.json({ items: await geocode(String(req.query.q ?? "").slice(0, 80), net?.bbox ?? MAHARASHTRA_BBOX, local) });
  });
  app.get("/v1/reverse", async (req, res) => res.json(await reverse(num(req.query.lat), num(req.query.lon))));
  app.get("/v1/walk", async (req, res) => res.json(await walkRoute(pair(req.query.from), pair(req.query.to))));
  app.get("/v1/weather", async (req, res) => res.json(await weather(num(req.query.lat), num(req.query.lon))));
  app.get("/v1/insights", async (_req, res) => res.json(await engine.insights()));

  mountReports(app, engine);

  app.use((_req, _res, next) => next(new HttpError(404, "not_found", "No such route")));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err instanceof HttpError ? err : new HttpError(500, "internal", "Something went wrong");
    if (e.status === 500) console.error(err);
    res.status(e.status).json({ error: { code: e.code, message: e.message } });
  });
  return app;
}
