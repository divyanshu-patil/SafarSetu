import { haversine } from "./time";

// Citizen connectivity-gap reports: shared by API, web and mobile. See safarsetu_product_workflow_spec.md §7, §13.

export type ReportCategory = "no_feeder" | "infrequent" | "poor_transfer" | "long_wait" | "hard_to_reach" | "obstructed" | "accessibility" | "wrong_info" | "missing_info" | "other";
export type ReportStatus = "received" | "under_review" | "more_info" | "referred" | "action_planned" | "resolved" | "closed";
export type ReportMode = "metro" | "train" | "bus" | "walk" | "any";

export interface AreaRef {
  name: string;
  lat: number;
  lon: number;
}

export interface Report {
  id: string;
  /** human reference shown to the citizen, e.g. SS-2026-00042 */
  ref: string;
  city: string;
  category: ReportCategory;
  severity: 1 | 2 | 3;
  /** the gap: riders cannot get conveniently from `from` to `to` */
  from?: AreaRef;
  to?: AreaRef;
  /** where the problem physically is (stop, crossing…); defaults to `from` */
  location: AreaRef;
  mode: ReportMode;
  timeOfDay?: string; // HH:MM or "morning" etc.
  description: string;
  status: ReportStatus;
  /** public-facing note the citizen may see */
  publicNote?: string;
  /** staff-only, never returned by public endpoints */
  internalNotes: { at: string; by: string; text: string }[];
  assignee?: string;
  /** opaque id of the reporter (hash of the anonymous user id) for unique-reporter counts */
  reporter: string;
  createdAt: string;
  updatedAt: string;
  /** true for demo-seeded rows */
  synthetic?: boolean;
}

export type PublicReport = Omit<Report, "internalNotes" | "reporter" | "assignee">;

interface Meta {
  label: string;
  hint: string;
  /** lucide icon name (web) — mobile maps the same names */
  icon: string;
  color: string;
}

export const CATEGORIES: Record<ReportCategory, Meta> = {
  no_feeder: { label: "No feeder service", hint: "No useful bus or shuttle links this area to the station", icon: "BusFront", color: "#d9480f" },
  infrequent: { label: "Too infrequent", hint: "Service exists but runs too rarely", icon: "Hourglass", color: "#b45309" },
  poor_transfer: { label: "Poorly timed transfer", hint: "Connections miss each other", icon: "Shuffle", color: "#7c3aed" },
  long_wait: { label: "Long waiting time", hint: "Excessive waiting at a stop or platform", icon: "Clock", color: "#0369a1" },
  hard_to_reach: { label: "Hard to reach on foot", hint: "Stop or station is difficult to walk to", icon: "Footprints", color: "#0f766e" },
  obstructed: { label: "Footpath or crossing blocked", hint: "Obstructed or unsafe access route", icon: "Construction", color: "#c2410c" },
  accessibility: { label: "Accessibility difficulty", hint: "Lift, ramp or step-free access missing", icon: "Accessibility", color: "#1d4ed8" },
  wrong_info: { label: "Incorrect information", hint: "Timetable or route information looks wrong", icon: "FileWarning", color: "#a16207" },
  missing_info: { label: "Missing information", hint: "Stop, entrance or route is not listed", icon: "MapPinOff", color: "#6d28d9" },
  other: { label: "Other connectivity issue", hint: "Anything else about getting around", icon: "CircleHelp", color: "#475569" },
};

export const STATUSES: Record<ReportStatus, Meta & { step: number }> = {
  received: { label: "Received", hint: "Recorded for connectivity analysis", icon: "Inbox", color: "#475569", step: 0 },
  under_review: { label: "Under review", hint: "A reviewer is looking at it", icon: "Search", color: "#0369a1", step: 1 },
  more_info: { label: "More information needed", hint: "The reviewer needs more details", icon: "MessageCircleQuestion", color: "#b45309", step: 1 },
  referred: { label: "Referred to agency", hint: "Passed to the responsible transport agency", icon: "Send", color: "#7c3aed", step: 2 },
  action_planned: { label: "Action planned", hint: "An improvement has been agreed", icon: "CalendarCheck", color: "#0f766e", step: 3 },
  resolved: { label: "Resolved", hint: "Change delivered or issue fixed", icon: "CircleCheck", color: "#15803d", step: 4 },
  closed: { label: "Closed", hint: "Closed after review", icon: "Archive", color: "#64748b", step: 4 },
};

export const PROMISE =
  "Your report is recorded and will contribute to the connectivity analysis for this area. If an authorised transport agency is connected to this reporting workflow, the status will show whether it has been referred. Submission does not guarantee a service change.";

export const toPublic = (r: Report): PublicReport => {
  const { internalNotes: _n, reporter: _r, assignee: _a, ...rest } = r;
  void _n; void _r; void _a;
  return rest;
};

// ---- issue groups (suggested clusters, always for human review) ------------------------------

export interface Weights {
  volume: number;
  unique: number;
  severity: number;
  recency: number;
}
export const DEFAULT_WEIGHTS: Weights = { volume: 0.35, unique: 0.2, severity: 0.25, recency: 0.2 };

export interface IssueGroup {
  id: string;
  category: ReportCategory;
  city: string;
  from?: AreaRef;
  to?: AreaRef;
  center: { lat: number; lon: number };
  reportIds: string[];
  count: number;
  uniqueReporters: number;
  avgSeverity: number;
  recentCount: number;
  lastAt: string;
  statusMix: Partial<Record<ReportStatus, number>>;
  /** every factor shown to the reviewer: value in 0..1 and weight */
  components: { key: keyof Weights; label: string; value: number; weight: number; raw: string }[];
  score: number;
}

const CELL = 0.02; // ≈ 2 km
const cell = (a?: { lat: number; lon: number }) => (a ? `${Math.round(a.lat / CELL)}:${Math.round(a.lon / CELL)}` : "-");

export function clusterReports(reports: Report[], weights: Weights = DEFAULT_WEIGHTS, now = Date.now()): IssueGroup[] {
  const groups = new Map<string, Report[]>();
  for (const r of reports) {
    const key = r.from && r.to ? `${r.city}|${r.category}|${cell(r.from)}>${cell(r.to)}` : `${r.city}|${r.category}|@${cell(r.location)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  const wsum = weights.volume + weights.unique + weights.severity + weights.recency || 1;
  const out: IssueGroup[] = [];
  for (const [id, rs] of groups) {
    const first = rs[0]!;
    const uniq = new Set(rs.map((r) => r.reporter)).size;
    const sev = rs.reduce((s, r) => s + r.severity, 0) / rs.length;
    const recent = rs.filter((r) => now - Date.parse(r.createdAt) < 14 * 86400000).length;
    const statusMix: IssueGroup["statusMix"] = {};
    for (const r of rs) statusMix[r.status] = (statusMix[r.status] ?? 0) + 1;
    const vals = { volume: Math.min(rs.length / 10, 1), unique: Math.min(uniq / 6, 1), severity: sev / 3, recency: recent / rs.length };
    const comps: IssueGroup["components"] = [
      { key: "volume", label: "Number of reports", value: vals.volume, weight: weights.volume / wsum, raw: `${rs.length} report${rs.length > 1 ? "s" : ""}` },
      { key: "unique", label: "Independent reporters", value: vals.unique, weight: weights.unique / wsum, raw: `${uniq} people` },
      { key: "severity", label: "Average severity", value: vals.severity, weight: weights.severity / wsum, raw: `${sev.toFixed(1)} of 3` },
      { key: "recency", label: "Reported in last 14 days", value: vals.recency, weight: weights.recency / wsum, raw: `${recent} of ${rs.length}` },
    ];
    const lat = rs.reduce((s, r) => s + r.location.lat, 0) / rs.length;
    const lon = rs.reduce((s, r) => s + r.location.lon, 0) / rs.length;
    out.push({
      id, category: first.category, city: first.city, from: first.from, to: first.to, center: { lat, lon },
      reportIds: rs.map((r) => r.id), count: rs.length, uniqueReporters: uniq, avgSeverity: sev, recentCount: recent,
      lastAt: rs.map((r) => r.createdAt).sort().at(-1)!, statusMix, components: comps,
      score: comps.reduce((s, c) => s + c.value * c.weight, 0),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** straight-line gap between the two areas, km (for display; not a walking route) */
export const gapKm = (r: Pick<Report, "from" | "to">) => (r.from && r.to ? haversine(r.from, r.to) / 1000 : 0);
