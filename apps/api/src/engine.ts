import type { Response } from "express";
import { buildLive, composeAlert, getNetwork, networks, nextAction, positionAt, type Disruption, type PlanRequest, type TransitLeg } from "@repo/core";
import { inlineCompute, type Compute } from "./compute";
import { Clock } from "./clock";
import { newId, type NotifRec, type PlanRec, type Store } from "./store";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const SCENARIOS = ["train-late-30", "metro-late-5", "metro-cancelled", "stop-closed", "heavy-rain", "clear"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export class Engine {
  private hub = new Map<string, Set<Response>>();
  constructor(public store: Store, public clock = new Clock(), public compute: Compute = inlineCompute) {}

  network(city = "pune") {
    const n = getNetwork(city);
    if (!n) throw new HttpError(404, "unknown_city", `Unknown city "${city}". Try: ${Object.keys(networks).join(", ")}`);
    return n;
  }

  // ---- SSE ----------------------------------------------------------------
  subscribe(planId: string, res: Response) {
    let set = this.hub.get(planId);
    if (!set) this.hub.set(planId, (set = new Set()));
    set.add(res);
    res.on("close", () => set.delete(res));
  }
  emit(planId: string, event: string, data: unknown) {
    for (const r of this.hub.get(planId) ?? []) r.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // ---- plans --------------------------------------------------------------
  private async live() {
    return buildLive(await this.store.listDisruptions());
  }
  private async activeDisruptions() {
    return this.store.listDisruptions();
  }

  private reminderNotifs(rec: PlanRec, afterMin: number): NotifRec[] {
    return rec.plan.reminders
      .filter((r) => r.atMin >= afterMin)
      .map((r) => ({ id: newId(), planId: rec.id, userId: rec.userId, kind: r.kind, title: r.title, body: r.body, date: rec.date, fireMin: Math.floor(r.atMin), revision: rec.plan.revision, sent: false }));
  }

  async createPlan(userId: string, req: PlanRequest): Promise<PlanRec> {
    const city = req.city ?? "pune";
    const net = this.network(city);
    let plan;
    try {
      plan = await this.compute.plan(city, { ...req, city }, await this.activeDisruptions());
    } catch (e) {
      throw new HttpError(422, "cannot_plan", (e as Error).message);
    }
    const now = new Date().toISOString();
    const rec: PlanRec = { id: newId(), userId, city, date: req.date, plan, state: "on_track", createdAt: now, updatedAt: now };
    await this.store.savePlan(rec);
    await this.store.addPlanRevision(rec.id, 1, "created", plan);
    // everything from the start of the plan onward; the scheduler skips anything that is long overdue
    await this.store.addNotifications(this.reminderNotifs(rec, 0));
    return rec;
  }

  async getPlan(id: string) {
    const p = await this.store.getPlan(id);
    if (!p) throw new HttpError(404, "not_found", "Plan not found");
    return p;
  }

  async status(id: string) {
    const rec = await this.getPlan(id);
    const nowMin = this.clock.now().minute;
    return { state: rec.state, nowMin, plan: rec.plan, next: nextAction(rec.plan, nowMin), position: positionAt(rec.plan, nowMin) };
  }

  /** Re-assess every active plan against live disruptions; persist, reschedule, alert. */
  async applyDisruptions(reason = "disruption"): Promise<number> {
    const live = await this.live();
    const ds = await this.activeDisruptions();
    const now = this.clock.now();
    let changed = 0;
    const todays = (await this.store.listPlans()).filter((r) => r.date === now.date);
    // assess every active plan in parallel on the worker pool; persist sequentially
    const results = await Promise.all(todays.map((r) => this.compute.assess(r.city, r.plan, ds, now.minute)));
    for (const [i, rec] of todays.entries()) {
      const a = results[i]!;
      const notifs: NotifRec[] = [];
      if (a.state !== "on_track") {
        changed++;
        rec.plan = a.plan;
        rec.state = a.state;
        rec.updatedAt = new Date().toISOString();
        await this.store.savePlan(rec);
        await this.store.addPlanRevision(rec.id, rec.plan.revision, reason, rec.plan);
        await this.store.cancelPending(rec.id);
        await this.store.addNotifications(this.reminderNotifs(rec, now.minute + 0.01));
        if (a.alert) notifs.push({ id: newId(), planId: rec.id, userId: rec.userId, kind: a.alert.kind, title: a.alert.title, body: a.alert.body, date: rec.date, fireMin: Math.floor(now.minute), revision: rec.plan.revision, sent: false, meta: { delayMin: a.summary?.delayMin, beforeLeave: a.summary?.beforeLeave, routeName: a.summary?.routeName } });
        this.emit(rec.id, "plan", { id: rec.id, state: a.state, revision: rec.plan.revision, changes: rec.plan.changes });
      }
      if (live.rain && !(await this.store.listNotifications(rec.id)).some((n) => n.kind === "heads_up")) {
        const w = composeAlert({ reason: "weather", beforeLeave: false, nowMin: now.minute, slackMin: 0, dwellLost: [], dropped: [] }, undefined, "calm", rec.plan.request.prefs?.lang);
        notifs.push({ id: newId(), planId: rec.id, userId: rec.userId, kind: w.kind, title: w.title, body: w.body, date: rec.date, fireMin: Math.floor(now.minute), revision: rec.plan.revision, sent: false });
      }
      if (notifs.length) {
        await this.store.addNotifications(notifs);
        await this.fire(notifs);
      }
    }
    return changed;
  }

  private async fire(ns: NotifRec[]) {
    for (const n of ns) this.emit(n.planId, "notification", { id: n.id, kind: n.kind, title: n.title, body: n.body, fireMin: n.fireMin, revision: n.revision });
    await this.store.markSent(ns.map((n) => n.id));
  }

  /** Called every second: deliver reminders whose time has come (skips ones overdue by >20 min, e.g. after a clock jump). */
  async tick() {
    const now = this.clock.now();
    const due = await this.store.dueNotifications(now.date, now.minute);
    const fresh = due.filter((n) => now.minute - n.fireMin <= 20);
    await this.store.markSent(due.filter((n) => !fresh.includes(n)).map((n) => n.id));
    if (fresh.length) await this.fire(fresh);
    for (const set of this.hub.values()) for (const r of set) r.write(`event: clock\ndata: ${JSON.stringify(this.clock.state())}\n\n`);
  }

  // ---- disruptions --------------------------------------------------------
  async addDisruption(d: Omit<Disruption, "id"> & { id?: string }) {
    const full: Disruption = { ...d, id: d.id ?? newId() };
    await this.store.addDisruption(full);
    await this.applyDisruptions(`${full.type}${full.note ? `: ${full.note}` : ""}`);
    return full;
  }
  /** replace every active disruption from `source` with `next` (used by feed pollers), then re-assess plans */
  async replaceSource(source: Disruption["source"], next: Disruption[]) {
    for (const d of await this.store.listDisruptions()) if (d.source === source) await this.store.deactivateDisruptions(d.id);
    for (const d of next) await this.store.addDisruption(d);
    await this.applyDisruptions(`${source} feed`);
  }
  async clearDisruptions(id?: string) {
    await this.store.deactivateDisruptions(id);
    await this.applyDisruptions("cleared");
  }

  /** Canned demo events aimed at what the most recent active plan will actually ride next. */
  async scenario(name: Scenario, planId?: string, city = "pune"): Promise<Disruption[]> {
    if (name === "clear") {
      await this.clearDisruptions();
      return [];
    }
    const now = this.clock.now();
    const plans = (await this.store.listPlans()).filter((p) => p.date === now.date && (!planId || p.id === planId) && (planId || p.city === city));
    const rec = plans[0];
    const legs: TransitLeg[] = (rec?.plan.timeline ?? []).flatMap((e) => (e.kind === "move" ? e.itinerary.legs.filter((l): l is TransitLeg => l.kind === "transit" && l.departMin > now.minute - 1) : []));
    const net = this.network(rec?.city ?? city);
    const fallback = (mode: string): TransitLeg | undefined => {
      const r = net.routes.find((x) => x.mode === mode);
      if (!r) return undefined;
      const d = r.departures.find((t) => t >= now.minute) ?? r.departures[0]!;
      return { kind: "transit", mode: r.mode, routeId: r.id, routeName: r.name, color: r.color, headsign: "", tripDeparture: d, from: { stopId: r.stopIds[0]!, name: "", lat: 0, lon: 0, min: d }, to: { stopId: r.stopIds.at(-1)!, name: "", lat: 0, lon: 0, min: d }, departMin: d, arriveMin: d, scheduledDepartMin: d, delayMin: 0, stops: [], fare: 0 };
    };
    const pick = (mode: string) => legs.find((l) => l.mode === mode) ?? legs[0] ?? fallback(mode);
    const base = { fromMin: 0, untilMin: 1440, source: "simulator" as const, verified: true };
    let d: Omit<Disruption, "id">[] = [];
    if (name === "train-late-30") {
      const l = pick("train");
      if (l) d = [{ ...base, type: "delay", routeId: l.routeId, tripDeparture: l.tripDeparture, delayMin: 30, note: `${l.routeName} running 30 min late` }];
    } else if (name === "metro-late-5") {
      const l = pick("metro");
      if (l) d = [{ ...base, type: "delay", routeId: l.routeId, tripDeparture: l.tripDeparture, delayMin: 5, note: `${l.routeName} running 5 min late` }];
    } else if (name === "metro-cancelled") {
      const l = pick("metro");
      if (l) d = [{ ...base, type: "cancellation", routeId: l.routeId, tripDeparture: l.tripDeparture, note: `${l.routeName} ${l.tripDeparture} cancelled` }];
    } else if (name === "stop-closed") {
      const l = pick("metro");
      if (l) d = [{ ...base, type: "stop_closed", stopId: l.from.stopId, fromMin: Math.floor(now.minute), untilMin: Math.floor(now.minute) + 180, note: l.from.name }];
    } else if (name === "heavy-rain") d = [{ ...base, type: "weather", note: "Heavy rain" }];
    const out: Disruption[] = [];
    for (const x of d) out.push(await this.addDisruption(x));
    return out;
  }

  // ---- insights -----------------------------------------------------------
  async insights() {
    const [dis, plans, notifs] = await Promise.all([this.store.listDisruptions(true), this.store.listPlans(), this.store.allNotifications()]);
    const names = new Map(Object.values(networks).flatMap((n) => n.routes.map((r) => [r.id, r.name] as const)));
    const by = new Map<string, { n: number; delay: number; delays: number; cancelled: number }>();
    for (const d of dis) {
      if (!d.routeId) continue;
      const e = by.get(d.routeId) ?? { n: 0, delay: 0, delays: 0, cancelled: 0 };
      e.n++;
      if (d.type === "delay") (e.delay += d.delayMin ?? 0), e.delays++;
      if (d.type === "cancellation") e.cancelled++;
      by.set(d.routeId, e);
    }
    const risk = new Map<string, number>();
    for (const p of plans) if (p.plan.totals.riskiest) risk.set(p.plan.totals.riskiest, (risk.get(p.plan.totals.riskiest) ?? 0) + 1);
    const sent = notifs.filter((n) => n.sent);
    return {
      routes: [...by].map(([routeId, e]) => ({ routeId, name: names.get(routeId) ?? routeId, disruptions: e.n, avgDelayMin: e.delays ? Math.round(e.delay / e.delays) : 0, cancelled: e.cancelled })).sort((a, b) => b.disruptions - a.disruptions),
      risky: [...risk].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      totals: {
        plans: plans.length,
        replans: plans.reduce((s, p) => s + Math.max(0, p.plan.revision - 1), 0),
        notifications: sent.length,
        minutesSaved: sent.filter((n) => (n.kind === "relax" || n.kind === "adjust") && n.meta?.beforeLeave).reduce((s, n) => s + (n.meta?.delayMin ?? 0), 0),
        disruptions: dis.length,
      },
      note: "Demo data is synthetic; figures are illustrative.",
    };
  }
}
