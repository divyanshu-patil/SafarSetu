import { tpl } from "./i18n";
import { fmtTime } from "./time";
import { isTrivialMove } from "./viewmodel";
import type { Alert, AlertKind, ChangeSummary, Lang, Pace, Plan, Reminder, TransitLeg, Visit } from "./types";

const LEAD: Record<Pace, number> = { gentle: 40, relaxed: 30, normal: 20, fast: 10 };

/** Time-based reminders for a plan. Superseded wholesale when the plan is revised. */
export function buildReminders(plan: Plan, pace: Pace = "normal", lang: Lang = "en"): Reminder[] {
  const T = tpl(lang);
  const out: Reminder[] = [];
  plan.timeline.forEach((e, i) => {
    if (isTrivialMove(e)) return;
    if (e.kind === "visit") {
      if (e.dwellMin >= 25 && i < plan.timeline.length - 1) out.push({ atMin: e.leaveMin - 10, kind: "wrapup", entryIndex: i, ...T.wrapup(e.place.name, fmtTime(e.leaveMin)) });
      return;
    }
    const first = e.itinerary.legs.find((l): l is TransitLeg => l.kind === "transit");
    const dest = (e.to as { name?: string }).name ?? "—";
    const ride = first ? T.ride(first.routeName, first.headsign, first.from.name, fmtTime(first.departMin)) : "";
    const prevVisit = plan.timeline[i - 1] as Visit | undefined;
    const prepareAt = e.departMin - LEAD[pace];
    if (!prevVisit || prepareAt >= prevVisit.startMin + 5) out.push({ atMin: prepareAt, kind: "prepare", entryIndex: i, ...T.prepare(LEAD[pace], dest, fmtTime(e.departMin), ride) });
    const walk = e.itinerary.legs[0];
    const walkMin = walk && walk.kind === "walk" ? Math.round(walk.arriveMin - walk.departMin) : 0;
    out.push({ atMin: e.departMin, kind: "leave", entryIndex: i, ...T.leave(dest, walkMin, first?.from.name ?? "", first?.routeName ?? "", first?.headsign ?? "", first ? fmtTime(first.departMin) : "", !!first) });
    e.itinerary.legs.forEach((l, li) => {
      if (l.kind === "transit" && li > 0 && l !== first) out.push({ atMin: l.departMin - 2, kind: "board", entryIndex: i, ...T.board(l.routeName, l.headsign, l.from.name, fmtTime(l.departMin)) });
    });
  });
  return out.sort((a, b) => a.atMin - b.atMin);
}

export function pickKind(s: ChangeSummary): AlertKind {
  if (s.reason === "weather") return "heads_up";
  if (s.late?.length) return "late";
  if (s.switched && (s.delayMin ?? 0) >= 5) return "replan";
  if (s.reason === "cancellation" || s.reason === "closure" || s.dropped.length) return "replan";
  if (s.beforeLeave && s.newLeaveMin !== undefined && s.newLeaveMin - s.nowMin <= 10) return "urgent";
  const lost = s.dwellLost.reduce((a, d) => a + d.mins, 0);
  if (lost > 30 || (s.slackMin < 15 && lost > 0)) return "adjust";
  return s.beforeLeave && (s.delayMin ?? 0) >= 5 && s.slackMin >= 15 ? "relax" : "adjust";
}

/** Facts in, calm human sentence out (en / hi / mr). Deterministic: an LLM may rephrase later but never decides facts. */
export function composeAlert(s: ChangeSummary, traveller?: { name?: string }, style: "calm" | "brief" = "calm", lang: Lang = "en"): Alert {
  const T = tpl(lang);
  const kind = pickKind(s);
  const who = traveller?.name ? `${traveller.name}, ` : "";
  const route = s.routeName ?? (lang === "en" ? "Your ride" : "—");
  const old = s.oldBoardMin !== undefined ? ` ${fmtTime(s.oldBoardMin)}` : "";
  const leave = s.newLeaveMin !== undefined ? fmtTime(s.newLeaveMin) : undefined;
  const oldLeave = s.oldLeaveMin !== undefined ? fmtTime(s.oldLeaveMin) : undefined;
  const lostMin = s.dwellLost.reduce((a, d) => a + d.mins, 0);
  const reach = s.nextPlace && s.newArriveMin !== undefined ? T.reachTxt(s.nextPlace, fmtTime(s.newArriveMin), lostMin, s.slackMin) : "";
  const lost = s.dwellLost.map((d) => T.lostItem(d.name, d.mins)).join(", ");
  const alt = s.alt ?? (s.altText ? undefined : undefined);
  const next = s.nextBoard ? T.next(s.nextBoard.routeName, fmtTime(s.nextBoard.departMin), s.nextBoard.stopName, leave) : alt ? T.alt(alt, leave) : s.altText && lang === "en" ? `${s.altText}${leave ? ` — leave by ${leave}` : ""}.` : T.newRoute;
  const keep = s.dropped.length ? T.keepDrop(s.dropped.join(", ")) : T.keepOk;
  switch (kind) {
    case "relax":
      return style === "brief" ? { kind, ...T.relaxBrief(route, s.delayMin ?? 0, leave, oldLeave) } : { kind, title: T.relaxTitle, body: T.relax(who, old, route, s.delayMin ?? 0, leave, oldLeave, reach) };
    case "adjust":
      return { kind, ...T.adjust(route, s.delayMin, lost, leave) };
    case "urgent":
      return { kind, ...T.urgent(s.nextBoard?.routeName, s.nextBoard?.stopName, s.nextBoard ? fmtTime(s.nextBoard.departMin) : undefined) };
    case "replan":
      return s.reason === "closure" ? { kind, ...T.closure(s.stopName ?? "—", next, keep) } : s.reason === "cancellation" ? { kind, ...T.cancelled(route, old, next, keep) } : { kind, ...T.updated(route, s.delayMin, next, keep) };
    case "late": {
      const l = s.late![0]!;
      const hint = s.nextBoard || alt ? next : "";
      return { kind, ...T.late(l.name, fmtTime(l.byMin), fmtTime(l.arriveMin), Math.round(l.arriveMin - l.byMin), hint) };
    }
    case "heads_up":
      return { kind, ...T.rain };
  }
}
