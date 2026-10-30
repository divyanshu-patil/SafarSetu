import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Disruption, Plan, Report } from "@repo/core";

export interface PlanRec {
  id: string;
  userId: string;
  city: string;
  date: string;
  plan: Plan;
  state: "on_track" | "adjusted" | "replanned";
  createdAt: string;
  updatedAt: string;
}
export interface NotifRec {
  id: string;
  planId: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  date: string;
  fireMin: number;
  revision: number;
  sent: boolean;
  meta?: { delayMin?: number; beforeLeave?: boolean; routeName?: string };
}
/** Field interview (Step 1 of the problem-solver guide): anonymous, consented, no names. */
export interface Interview {
  id: string;
  code: string; // participant code, e.g. P-014 — never a name
  date: string;
  city: string;
  role: string; // student, office worker, vendor, senior…
  route: string; // area/route they travel
  modes: string[];
  problem: string;
  perWeek: number; // how often the problem happens per week
  minutesLostPerWeek: number;
  rupeesLostPerWeek: number;
  workaround: string;
  triedAndFailed: string;
  consent: boolean;
  createdAt: string;
}

/** anonymous pilot feedback: was an alert useful / did the trip work out (no user id, no free text) */
export interface Feedback {
  id: string;
  kind: "alert" | "trip";
  planId?: string;
  alertKind?: string;
  useful?: boolean;
  onTime?: boolean;
  minutesLate?: number;
  createdAt: string;
}

export interface DisruptionRec extends Disruption {
  active: boolean;
  createdAt: string;
}

export interface Store {
  kind: "memory" | "supabase";
  savePlan(r: PlanRec): Promise<void>;
  getPlan(id: string): Promise<PlanRec | undefined>;
  listPlans(userId?: string): Promise<PlanRec[]>;
  addPlanRevision(planId: string, revision: number, reason: string, plan: Plan): Promise<void>;
  addDisruption(d: Disruption): Promise<void>;
  listDisruptions(all?: boolean): Promise<DisruptionRec[]>;
  deactivateDisruptions(id?: string): Promise<void>;
  addNotifications(n: NotifRec[]): Promise<void>;
  listNotifications(planId: string): Promise<NotifRec[]>;
  allNotifications(): Promise<NotifRec[]>;
  dueNotifications(date: string, nowMin: number): Promise<NotifRec[]>;
  markSent(ids: string[]): Promise<void>;
  cancelPending(planId: string): Promise<void>;
  saveDevice(userId: string, platform: string, token: string): Promise<void>;
  addReport(r: Report): Promise<void>;
  getReport(idOrRef: string): Promise<Report | undefined>;
  listReports(): Promise<Report[]>;
  updateReport(r: Report): Promise<void>;
  addInterview(i: Interview): Promise<void>;
  listInterviews(): Promise<Interview[]>;
  /** retention: delete real (non-synthetic) reports created before `iso`; returns how many */
  purgeReportsBefore(iso: string): Promise<number>;
  addFeedback(f: Feedback): Promise<void>;
  listFeedback(): Promise<Feedback[]>;
}

export class MemoryStore implements Store {
  kind = "memory" as const;
  plans = new Map<string, PlanRec>();
  disruptions: DisruptionRec[] = [];
  notifs: NotifRec[] = [];
  devices: { userId: string; platform: string; token: string }[] = [];
  revisions: { planId: string; revision: number; reason: string }[] = [];
  async savePlan(r: PlanRec) { this.plans.set(r.id, structuredClone(r)); }
  async getPlan(id: string) { const p = this.plans.get(id); return p && structuredClone(p); }
  async listPlans(userId?: string) { return [...this.plans.values()].filter((p) => !userId || p.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((p) => structuredClone(p)); }
  async addPlanRevision(planId: string, revision: number, reason: string) { this.revisions.push({ planId, revision, reason }); }
  async addDisruption(d: Disruption) { this.disruptions.push({ ...d, active: true, createdAt: new Date().toISOString() }); }
  async listDisruptions(all = false) { return this.disruptions.filter((d) => all || d.active); }
  async deactivateDisruptions(id?: string) { for (const d of this.disruptions) if (!id || d.id === id) d.active = false; }
  async addNotifications(n: NotifRec[]) { this.notifs.push(...n); }
  async listNotifications(planId: string) { return this.notifs.filter((n) => n.planId === planId).sort((a, b) => a.fireMin - b.fireMin); }
  async allNotifications() { return this.notifs; }
  async dueNotifications(date: string, nowMin: number) { return this.notifs.filter((n) => !n.sent && n.date === date && n.fireMin <= nowMin); }
  async markSent(ids: string[]) { for (const n of this.notifs) if (ids.includes(n.id)) n.sent = true; }
  async cancelPending(planId: string) { this.notifs = this.notifs.filter((n) => n.planId !== planId || n.sent); }
  async saveDevice(userId: string, platform: string, token: string) { this.devices.push({ userId, platform, token }); }
  reports = new Map<string, Report>();
  async addReport(r: Report) { this.reports.set(r.id, structuredClone(r)); }
  async getReport(k: string) { const r = this.reports.get(k) ?? [...this.reports.values()].find((x) => x.ref === k); return r && structuredClone(r); }
  async listReports() { return [...this.reports.values()].map((r) => structuredClone(r)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async updateReport(r: Report) { this.reports.set(r.id, structuredClone(r)); }
  interviews: Interview[] = [];
  async addInterview(i: Interview) { this.interviews.push(i); }
  async listInterviews() { return [...this.interviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  feedback: Feedback[] = [];
  async addFeedback(f: Feedback) { this.feedback.push(f); }
  async listFeedback() { return [...this.feedback]; }
  async purgeReportsBefore(iso: string) { let n = 0; for (const [id, r] of this.reports) if (!r.synthetic && r.createdAt < iso) (this.reports.delete(id), n++); return n; }
}

/** Supabase (Postgres) store. Column names follow supabase/migrations/0001_init.sql. */
export class SupabaseStore implements Store {
  kind = "supabase" as const;
  private db;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }
  private ok<T>(r: { data: T; error: { message: string } | null }): T {
    if (r.error) throw new Error(`supabase: ${r.error.message}`);
    return r.data;
  }
  private toPlan = (r: any): PlanRec => ({ id: r.id, userId: r.user_id, city: r.city, date: r.date, plan: r.plan, state: r.state, createdAt: r.created_at, updatedAt: r.updated_at });
  private toNotif = (r: any): NotifRec => ({ id: r.id, planId: r.plan_id, userId: r.user_id, kind: r.kind, title: r.title, body: r.body, date: r.date, fireMin: r.fire_min, revision: r.revision, sent: r.sent, meta: r.meta ?? undefined });
  private toDis = (r: any): DisruptionRec => ({ id: r.id, type: r.type, routeId: r.route_id ?? undefined, tripDeparture: r.trip_departure ?? undefined, stopId: r.stop_id ?? undefined, delayMin: r.delay_min ?? undefined, fromMin: r.from_min, untilMin: r.until_min, source: r.source, verified: r.verified, note: r.note ?? undefined, active: r.active, createdAt: r.created_at });
  async savePlan(r: PlanRec) {
    this.ok(await this.db.from("plans").upsert({ id: r.id, user_id: r.userId, city: r.city, date: r.date, plan: r.plan, revision: r.plan.revision, state: r.state, created_at: r.createdAt, updated_at: r.updatedAt }));
  }
  async getPlan(id: string) { const d = this.ok(await this.db.from("plans").select("*").eq("id", id).maybeSingle()); return d ? this.toPlan(d) : undefined; }
  async listPlans(userId?: string) {
    let q = this.db.from("plans").select("*").order("updated_at", { ascending: false }).limit(200);
    if (userId) q = q.eq("user_id", userId);
    return (this.ok(await q) ?? []).map(this.toPlan);
  }
  async addPlanRevision(planId: string, revision: number, reason: string, plan: Plan) {
    this.ok(await this.db.from("plan_revisions").insert({ plan_id: planId, revision, reason, plan }));
  }
  async addDisruption(d: Disruption) {
    this.ok(await this.db.from("disruptions").insert({ id: d.id, type: d.type, route_id: d.routeId, trip_departure: d.tripDeparture, stop_id: d.stopId, delay_min: d.delayMin, from_min: d.fromMin, until_min: d.untilMin, source: d.source, verified: d.verified ?? false, note: d.note, active: true }));
  }
  async listDisruptions(all = false) {
    let q = this.db.from("disruptions").select("*").order("created_at");
    if (!all) q = q.eq("active", true);
    return (this.ok(await q) ?? []).map(this.toDis);
  }
  async deactivateDisruptions(id?: string) {
    let q = this.db.from("disruptions").update({ active: false });
    q = id ? q.eq("id", id) : q.eq("active", true);
    this.ok(await q);
  }
  async addNotifications(n: NotifRec[]) {
    if (!n.length) return;
    this.ok(await this.db.from("notifications").insert(n.map((x) => ({ id: x.id, plan_id: x.planId, user_id: x.userId, kind: x.kind, title: x.title, body: x.body, date: x.date, fire_min: x.fireMin, revision: x.revision, sent: x.sent, meta: x.meta }))));
  }
  async listNotifications(planId: string) { return (this.ok(await this.db.from("notifications").select("*").eq("plan_id", planId).order("fire_min")) ?? []).map(this.toNotif); }
  async allNotifications() { return (this.ok(await this.db.from("notifications").select("*").limit(5000)) ?? []).map(this.toNotif); }
  async dueNotifications(date: string, nowMin: number) { return (this.ok(await this.db.from("notifications").select("*").eq("sent", false).eq("date", date).lte("fire_min", nowMin)) ?? []).map(this.toNotif); }
  async markSent(ids: string[]) { if (ids.length) this.ok(await this.db.from("notifications").update({ sent: true, sent_at: new Date().toISOString() }).in("id", ids)); }
  async cancelPending(planId: string) { this.ok(await this.db.from("notifications").delete().eq("plan_id", planId).eq("sent", false)); }
  async saveDevice(userId: string, platform: string, token: string) { this.ok(await this.db.from("devices").upsert({ user_id: userId, platform, token }, { onConflict: "user_id,token" })); }
  private toRep = (r: any): Report => ({ id: r.id, ref: r.ref, city: r.city, category: r.category, severity: r.severity, from: r.from_area ?? undefined, to: r.to_area ?? undefined, location: r.location, mode: r.mode, timeOfDay: r.time_of_day ?? undefined, description: r.description, status: r.status, publicNote: r.public_note ?? undefined, internalNotes: r.internal_notes ?? [], assignee: r.assignee ?? undefined, reporter: r.reporter, createdAt: r.created_at, updatedAt: r.updated_at, synthetic: r.synthetic });
  private fromRep = (r: Report) => ({ id: r.id, ref: r.ref, city: r.city, category: r.category, severity: r.severity, from_area: r.from ?? null, to_area: r.to ?? null, location: r.location, mode: r.mode, time_of_day: r.timeOfDay ?? null, description: r.description, status: r.status, public_note: r.publicNote ?? null, internal_notes: r.internalNotes, assignee: r.assignee ?? null, reporter: r.reporter, synthetic: r.synthetic ?? false, created_at: r.createdAt, updated_at: r.updatedAt });
  async addReport(r: Report) { this.ok(await this.db.from("reports").insert(this.fromRep(r))); }
  async getReport(k: string) {
    const col = /^[0-9a-f-]{36}$/i.test(k) ? "id" : "ref";
    const d = this.ok(await this.db.from("reports").select("*").eq(col, k).maybeSingle());
    return d ? this.toRep(d) : undefined;
  }
  async listReports() { return (this.ok(await this.db.from("reports").select("*").order("created_at", { ascending: false }).limit(5000)) ?? []).map(this.toRep); }
  async updateReport(r: Report) { this.ok(await this.db.from("reports").update(this.fromRep(r)).eq("id", r.id)); }
  async addInterview(i: Interview) { this.ok(await this.db.from("field_interviews").insert({ id: i.id, code: i.code, date: i.date, city: i.city, role: i.role, route: i.route, modes: i.modes, problem: i.problem, per_week: i.perWeek, minutes_lost_per_week: i.minutesLostPerWeek, rupees_lost_per_week: i.rupeesLostPerWeek, workaround: i.workaround, tried_and_failed: i.triedAndFailed, consent: i.consent })); }
  async addFeedback(f: Feedback) { this.ok(await this.db.from("feedback").insert({ id: f.id, kind: f.kind, plan_id: f.planId ?? null, alert_kind: f.alertKind ?? null, useful: f.useful ?? null, on_time: f.onTime ?? null, minutes_late: f.minutesLate ?? null })); }
  async listFeedback() { return (this.ok(await this.db.from("feedback").select("*").limit(20000)) ?? []).map((r: any): Feedback => ({ id: r.id, kind: r.kind, planId: r.plan_id ?? undefined, alertKind: r.alert_kind ?? undefined, useful: r.useful ?? undefined, onTime: r.on_time ?? undefined, minutesLate: r.minutes_late ?? undefined, createdAt: r.created_at })); }
  async purgeReportsBefore(iso: string) { const d = this.ok(await this.db.from("reports").delete().eq("synthetic", false).lt("created_at", iso).select("id")); return (d ?? []).length; }
  async listInterviews() { return (this.ok(await this.db.from("field_interviews").select("*").order("created_at", { ascending: false })) ?? []).map((r: any): Interview => ({ id: r.id, code: r.code, date: r.date, city: r.city, role: r.role, route: r.route, modes: r.modes ?? [], problem: r.problem, perWeek: r.per_week, minutesLostPerWeek: r.minutes_lost_per_week, rupeesLostPerWeek: r.rupees_lost_per_week, workaround: r.workaround, triedAndFailed: r.tried_and_failed, consent: r.consent, createdAt: r.created_at })); }
}

export function createStore(): Store {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? new SupabaseStore(url, key) : new MemoryStore();
}
export const newId = () => randomUUID();
