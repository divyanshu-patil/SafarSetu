import { confidence } from "./confidence";
import { noLive } from "./live";
import { indexNetwork, type Indexed } from "./network";
import { buildReminders } from "./notify";
import { PACE_OPTS, bestItinerary, cabItinerary, defaultOpts, latestDeparture, search, walkItinerary, type RouteOpts } from "./router";
import { fmtTime, haversine } from "./time";
import type { Entry, Itinerary, LiveState, Move, Network, Pace, Plan, PlanRequest, PlaceInput, Prefs, Pt, Visit } from "./types";

export interface Ctx {
  ix: Indexed;
  live: LiveState;
  o: RouteOpts;
  prefs: Required<Prefs>;
  cache: Map<string, Itinerary>;
}

const END_BUFFER: Record<Pace, number> = { relaxed: 15, normal: 5, fast: 0 };
const indexCache = new WeakMap<Network, Indexed>();

export function makeCtx(net: Network, live: LiveState = noLive, prefs: Prefs = {}): Ctx {
  let ix = indexCache.get(net);
  if (!ix) indexCache.set(net, (ix = indexNetwork(net)));
  const p: Required<Prefs> = { pace: prefs.pace ?? "normal", maxWalkM: prefs.maxWalkM ?? 1200, avoid: prefs.avoid ?? [], style: prefs.style ?? "calm" };
  const o: RouteOpts = { ...defaultOpts(), ...PACE_OPTS[p.pace], maxWalkM: p.maxWalkM, avoid: p.avoid };
  return { ix, live, o, prefs: p, cache: new Map() };
}

const k5 = (p: Pt) => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
export function travel(c: Ctx, a: Pt, b: Pt, depart: number): Itinerary {
  const key = `${k5(a)}|${k5(b)}|${Math.round(depart)}`;
  let it = c.cache.get(key);
  if (!it) c.cache.set(key, (it = bestItinerary(c.ix, c.live, a, b, depart, c.o)));
  return it;
}

export interface Item {
  key: string;
  name: string;
  lat: number;
  lon: number;
  priority: 1 | 2 | 3;
  minDwell: number;
  maxDwell: number;
  opens: number;
  closes: number;
}

export function resolveItems(net: Network, inputs: PlaceInput[]): Item[] {
  return inputs.map((p, i) => {
    const base = p.placeId ? net.places.find((x) => x.id === p.placeId) : undefined;
    if (p.placeId && !base) throw new Error(`unknown place ${p.placeId}`);
    const lat = p.lat ?? base?.lat;
    const lon = p.lon ?? base?.lon;
    if (lat === undefined || lon === undefined) throw new Error(`place #${i} needs placeId or lat/lon`);
    const minDwell = p.minDwell ?? base?.minDwell ?? 30;
    return {
      key: p.placeId ?? `custom_${i}`,
      name: p.name ?? base?.name ?? `Stop ${i + 1}`,
      lat,
      lon,
      priority: p.priority ?? 2,
      minDwell,
      maxDwell: Math.max(minDwell, p.maxDwell ?? base?.maxDwell ?? minDwell * 2),
      opens: p.opens ?? base?.opens ?? 0,
      closes: p.closes ?? base?.closes ?? 1440,
    };
  });
}

// ---- simulation ------------------------------------------------------------

interface Sim {
  ok: boolean;
  entries: Entry[];
  finish: number;
  failItem?: Item;
  reason?: string;
}

function simulate(c: Ctx, start: Pt, startMin: number, items: Item[], dwell: Map<string, number>, home: Pt | null, endMin: number): Sim {
  const entries: Entry[] = [];
  let cur: Pt = start;
  let t = startMin;
  let prev: Visit | undefined;
  const addMove = (to: Pt, it: Itinerary) => {
    if (prev) prev.leaveMin = Math.max(prev.leaveMin, Math.min(it.departMin, prev.closes));
    if (prev) prev.dwellMin = prev.leaveMin - prev.startMin;
    entries.push({ kind: "move", from: cur, to, itinerary: it, departMin: it.departMin, arriveMin: it.arriveMin } satisfies Move);
  };
  for (const item of items) {
    const it = travel(c, cur, item, t);
    addMove(item, it);
    const startV = Math.max(it.arriveMin, item.opens);
    if (startV + item.minDwell > item.closes) return { ok: false, entries, finish: it.arriveMin, failItem: item, reason: it.arriveMin >= item.closes ? `closes at ${fmtTime(item.closes)}` : `would not fit before it closes at ${fmtTime(item.closes)}` };
    const leave = Math.min(startV + (dwell.get(item.key) ?? item.minDwell), item.closes);
    prev = { kind: "visit", place: { key: item.key, name: item.name, lat: item.lat, lon: item.lon }, arriveMin: it.arriveMin, startMin: startV, leaveMin: leave, dwellMin: leave - startV, waitMin: startV - it.arriveMin, priority: item.priority, minDwell: item.minDwell, maxDwell: item.maxDwell, opens: item.opens, closes: item.closes };
    entries.push(prev);
    cur = item;
    t = leave;
  }
  let finish = t;
  if (home && items.length) {
    const it = travel(c, cur, home, t);
    addMove(home, it);
    finish = it.arriveMin;
  }
  return { ok: finish <= endMin, entries, finish, failItem: undefined, reason: finish > endMin ? `day ends at ${fmtTime(endMin)}` : undefined };
}

// ---- ordering --------------------------------------------------------------

function candidateOrders(c: Ctx, start: Pt, items: Item[], home: Pt | null, t0: number): Item[][] {
  if (items.length <= 1) return [items];
  const pts: Pt[] = [start, ...items];
  const d = pts.map((a) => pts.map((b) => (a === b ? 0 : travel(c, a, b, t0).arriveMin - t0)));
  const cost = (seq: number[]) => {
    let s = 0,
      prev = 0;
    for (const i of seq) (s += d[prev]![i]!), (prev = i);
    return s + (home ? d[prev]![0]! : 0);
  };
  // nearest neighbour then 2-opt
  const left = new Set(items.map((_, i) => i + 1));
  let seq: number[] = [];
  let at = 0;
  while (left.size) {
    let bi = -1;
    for (const i of left) if (bi < 0 || d[at]![i]! < d[at]![bi]!) bi = i;
    seq.push(bi);
    left.delete(bi);
    at = bi;
  }
  for (let improved = true; improved; ) {
    improved = false;
    for (let i = 0; i < seq.length - 1; i++)
      for (let j = i + 1; j < seq.length; j++) {
        const cand = [...seq.slice(0, i), ...seq.slice(i, j + 1).reverse(), ...seq.slice(j + 1)];
        if (cost(cand) < cost(seq) - 0.01) (seq = cand), (improved = true);
      }
  }
  const byClose = [...items].sort((a, b) => a.closes - b.closes);
  const byPrio = [...items].sort((a, b) => b.priority - a.priority || a.closes - b.closes);
  const orders = [seq.map((i) => items[i - 1]!), byClose, byPrio];
  const seen = new Set<string>();
  return orders.filter((o) => !seen.has(o.map((i) => i.key).join()) && seen.add(o.map((i) => i.key).join()));
}

// ---- planning --------------------------------------------------------------

export interface Anchor {
  start: Pt;
  startMin: number;
}

export interface Built {
  entries: Entry[];
  dropped: { name: string; reason: string }[];
}

export function build(c: Ctx, anchor: Anchor, endMin: number, items: Item[], home: Pt | null): Built {
  const dropped: Built["dropped"] = [];
  let pool = [...items];
  const endBuf = END_BUFFER[c.prefs.pace];
  const mins = (xs: Item[]) => new Map(xs.map((i) => [i.key, i.minDwell]));
  for (;;) {
    if (!pool.length) return { entries: [], dropped };
    const sims = candidateOrders(c, anchor.start, pool, home, anchor.startMin + 90).map((order) => ({ order, r: simulate(c, anchor.start, anchor.startMin, order, mins(pool), home, endMin - endBuf) }));
    const ok = sims.filter((s) => s.r.ok).sort((a, b) => a.r.finish - b.r.finish)[0];
    if (!ok) {
      // drop the least important item (ties: the one that does not fit, else the longest)
      const failing = sims.map((s) => s.r.failItem).find(Boolean);
      const victim = [...pool].sort((a, b) => a.priority - b.priority || Number(b === failing) - Number(a === failing) || b.minDwell - a.minDwell)[0]!;
      const r = sims[0]!.r;
      dropped.push({ name: victim.name, reason: failing === victim && r.reason ? `${victim.name} ${r.reason}` : "not enough time in your day" });
      pool = pool.filter((i) => i !== victim);
      continue;
    }
    // hand out leftover time, weighted by priority, re-simulating so connections stay valid
    let best = ok.r;
    const frozen = new Set<string>();
    const dwell = mins(pool);
    for (let guard = 0; guard < 80; guard++) {
      const visits = best.entries.filter((e): e is Visit => e.kind === "visit");
      const cand = visits.filter((v) => !frozen.has(v.place.key) && v.dwellMin < v.maxDwell).sort((a, b) => b.priority / b.dwellMin - a.priority / a.dwellMin)[0];
      if (!cand) break;
      const trial = new Map(dwell);
      trial.set(cand.place.key, cand.dwellMin + Math.min(10, cand.maxDwell - cand.dwellMin));
      const r = simulate(c, anchor.start, anchor.startMin, ok.order, trial, home, endMin - endBuf);
      if (r.ok) (best = r), dwell.set(cand.place.key, trial.get(cand.place.key)!);
      else frozen.add(cand.place.key);
    }
    return { entries: best.entries, dropped };
  }
}

export function finalize(c: Ctx, req: PlanRequest, built: Built, revision: number, nowMin: number, changes: string[] = []): Plan {
  const entries = built.entries;
  let walkM = 0,
    fareSum = 0,
    transfers = 0,
    minP = 1;
  let riskiest: string | undefined;
  for (const e of entries) {
    if (e.kind !== "move") continue;
    e.confidence = confidence(c.ix, e.itinerary, { boardBuffer: c.o.boardBuffer });
    walkM += e.itinerary.walkM;
    fareSum += e.itinerary.fare;
    transfers += e.itinerary.transfers;
    if (e.confidence.pOnTime < minP) (minP = e.confidence.pOnTime), (riskiest = e.confidence.riskiest?.label);
  }
  const plan: Plan = {
    revision,
    request: req,
    timeline: entries,
    dropped: built.dropped,
    totals: { walkM, fare: fareSum, transfers, confidencePct: Math.round(minP * 100), riskiest },
    reminders: [],
    changes,
    generatedAtMin: nowMin,
    meta: { dataQuality: c.ix.net.meta.dataQuality, note: c.ix.net.meta.note },
  };
  plan.reminders = buildReminders(plan, c.prefs.pace);
  return plan;
}

export function planDay(net: Network, req: PlanRequest, live: LiveState = noLive): Plan {
  if (req.endMin <= req.startMin) throw new Error("endMin must be after startMin");
  const c = makeCtx(net, live, req.prefs);
  const items = resolveItems(net, req.places);
  const home = req.returnToOrigin === false ? null : req.origin;
  const built = build(c, { start: req.origin, startMin: req.startMin }, req.endMin, items, home);
  return finalize(c, req, built, 1, req.startMin);
}

// ---- single A->B -----------------------------------------------------------

export function planRoute(net: Network, a: Pt, b: Pt, opts: { departMin?: number; arriveByMin?: number; prefs?: Prefs }, live: LiveState = noLive) {
  const c = makeCtx(net, live, opts.prefs);
  let leaveByMin: number | undefined;
  let departMin = opts.departMin ?? 8 * 60;
  if (opts.arriveByMin !== undefined) {
    const best = latestDeparture(c.ix, c.live, a, b, opts.arriveByMin, c.o);
    if (best) (leaveByMin = best.departMin), (departMin = Math.max(0, best.departMin - 1));
  }
  const all = search(c.ix, c.live, a, b, departMin, c.o);
  if (haversine(a, b) <= 1500) all.push(walkItinerary(a, b, departMin, c.o));
  all.push(cabItinerary(a, b, departMin));
  const sorted = all.sort((x, y) => x.arriveMin - y.arriveMin);
  return { leaveByMin, itineraries: sorted.map((it) => ({ ...it, confidence: it.legs.some((l) => l.kind === "transit") ? confidence(c.ix, it, { boardBuffer: c.o.boardBuffer }) : undefined })) };
}
