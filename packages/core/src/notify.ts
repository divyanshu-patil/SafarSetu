import { fmtTime } from "./time";
import { isTrivialMove } from "./viewmodel";
import type { Alert, AlertKind, ChangeSummary, Move, Pace, Plan, Reminder, TransitLeg, Visit } from "./types";

const LEAD: Record<Pace, number> = { relaxed: 30, normal: 20, fast: 10 };

const rideName = (l: TransitLeg) => `${l.routeName} toward ${l.headsign}`;

/** Time-based reminders for a plan. Superseded wholesale when the plan is revised. */
export function buildReminders(plan: Plan, pace: Pace = "normal"): Reminder[] {
  const out: Reminder[] = [];
  plan.timeline.forEach((e, i) => {
    if (isTrivialMove(e)) return;
    if (e.kind === "visit") {
      if (e.dwellMin >= 25 && i < plan.timeline.length - 1)
        out.push({ atMin: e.leaveMin - 10, kind: "wrapup", entryIndex: i, title: `Wrapping up at ${e.place.name}`, body: `Time to finish up — you leave in 10 minutes (${fmtTime(e.leaveMin)}).` });
      return;
    }
    const first = e.itinerary.legs.find((l): l is TransitLeg => l.kind === "transit");
    const dest = (e.to as { name?: string }).name ?? "your next stop";
    const ride = first ? `Take ${rideName(first)} from ${first.from.name} at ${fmtTime(first.departMin)}.` : "";
    const prevVisit = plan.timeline[i - 1] as Visit | undefined;
    const prepareAt = e.departMin - LEAD[pace];
    if (!prevVisit || prepareAt >= prevVisit.startMin + 5)
      out.push({ atMin: prepareAt, kind: "prepare", entryIndex: i, title: `Leave in ${LEAD[pace]} min for ${dest}`, body: `Leave at ${fmtTime(e.departMin)}. ${ride}`.trim() });
    const walk = e.itinerary.legs[0];
    const walkMin = walk && walk.kind === "walk" ? Math.round(walk.arriveMin - walk.departMin) : 0;
    out.push({ atMin: e.departMin, kind: "leave", entryIndex: i, title: `Time to leave for ${dest}`, body: first ? `${walkMin ? `${walkMin} min walk to ${first.from.name}. ` : ""}${rideName(first)} departs ${fmtTime(first.departMin)}.` : `Head to ${dest} now.` });
    e.itinerary.legs.forEach((l, li) => {
      if (l.kind === "transit" && li > 0 && l !== first) out.push({ atMin: l.departMin - 2, kind: "board", entryIndex: i, title: `Next: ${l.routeName}`, body: `Board ${rideName(l)} at ${l.from.name}, departs ${fmtTime(l.departMin)}.` });
    });
  });
  return out.sort((a, b) => a.atMin - b.atMin);
}

export function pickKind(s: ChangeSummary): AlertKind {
  if (s.reason === "weather") return "heads_up";
  if (s.reason === "cancellation" || s.reason === "closure" || s.dropped.length) return "replan";
  if (s.beforeLeave && s.newLeaveMin !== undefined && s.newLeaveMin - s.nowMin <= 10) return "urgent";
  const lost = s.dwellLost.reduce((a, d) => a + d.mins, 0);
  if (lost > 30 || s.slackMin < 15 && lost > 0) return "adjust";
  return s.beforeLeave && (s.delayMin ?? 0) >= 5 && s.slackMin >= 15 ? "relax" : "adjust";
}

/** Facts in, calm human sentence out. Deterministic: an LLM may rephrase later but never decides facts. */
export function composeAlert(s: ChangeSummary, traveller?: { name?: string }, style: "calm" | "brief" = "calm"): Alert {
  const kind = pickKind(s);
  const who = traveller?.name ? `${traveller.name}, ` : "";
  const route = s.routeName ?? "Your ride";
  const old = s.oldBoardMin !== undefined ? ` ${fmtTime(s.oldBoardMin)}` : "";
  const leave = s.newLeaveMin !== undefined ? fmtTime(s.newLeaveMin) : undefined;
  const reach = s.nextPlace && s.newArriveMin !== undefined ? ` You'll still reach ${s.nextPlace} at ${fmtTime(s.newArriveMin)}${s.dwellLost.length ? ` — just ${s.dwellLost.reduce((a, d) => a + d.mins, 0)} min less time there` : s.slackMin >= 15 ? ` with ${s.slackMin} min to spare` : ""}.` : "";
  const lost = s.dwellLost.map((d) => `${d.name} by ${d.mins} min`).join(", ");
  const next = s.nextBoard ? `Take ${s.nextBoard.routeName} at ${fmtTime(s.nextBoard.departMin)} from ${s.nextBoard.stopName}${leave ? ` — leave by ${leave}` : ""}.` : s.altText ? `${s.altText}${leave ? ` — leave by ${leave}` : ""}.` : "We found a new route — open the app for details.";
  const keep = s.dropped.length ? ` We had to drop ${s.dropped.join(", ")}.` : " Your day still works.";
  switch (kind) {
    case "relax":
      return style === "brief"
        ? { kind, title: "Running late — no rush", body: `${route} is ${s.delayMin} min late. Leave ${leave}, not ${fmtTime(s.oldLeaveMin ?? 0)}.` }
        : { kind, title: "No need to rush", body: `${who}no need to rush — your${old} ${route} is running ${s.delayMin} min late. ${s.oldLeaveMin !== undefined && s.newLeaveMin !== undefined && Math.round(s.oldLeaveMin) !== Math.round(s.newLeaveMin) ? `Leave at ${leave} instead of ${fmtTime(s.oldLeaveMin)}.` : "Your plan simply shifts later."}${reach}`.replace(/^./, (c) => c.toUpperCase()) };
    case "adjust":
      return { kind, title: "Plan adjusted", body: `${route} is ${s.delayMin ?? "running"} min late.${lost ? ` We shortened ${lost} so the rest of your day still works.` : ""}${leave ? ` Leave at ${leave}.` : ""}`.trim() };
    case "urgent":
      return { kind, title: "Leave now", body: `Leave now${s.nextBoard ? ` — ${s.nextBoard.routeName} departs ${fmtTime(s.nextBoard.departMin)} from ${s.nextBoard.stopName}` : ""}.` };
    case "replan":
      return s.reason === "closure"
        ? { kind, title: "Route changed", body: `${s.stopName ?? "A stop"} is closed. ${next}${keep}` }
        : { kind, title: s.reason === "cancellation" ? `${route} cancelled` : "Plan updated", body: `${s.reason === "cancellation" ? `${route}${old} is cancelled. ` : `${route} is ${s.delayMin ?? "running"} min late. `}${next}${keep}` };
    case "heads_up":
      return { kind, title: "Rain expected", body: `Rain is likely today — we kept indoor stops first where we could. Carry an umbrella.` };
  }
}
