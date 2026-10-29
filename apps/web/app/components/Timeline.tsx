"use client";
import { Chip, Icon, MODE_COLOR, MODE_ICON } from "../lib/icons";
import { fmtDuration, fmtTime, isTrivialMove, type Entry, type Leg, type Move, type Plan, type Visit } from "@repo/core";

const modeLabel = { metro: "Metro", train: "Train", bus: "Bus" } as const;

function LegRow({ l }: { l: Leg }) {
  if (l.kind === "walk") {
    const mins = Math.round(l.arriveMin - l.departMin);
    return (
      <div className="legline"><Chip name="Footprints" color={MODE_COLOR.walk} size={15} box={28} />
        <span className="leg">Walk {mins} min · {Math.round(l.distM)} m&nbsp;<small>to {l.to.name ?? "next stop"} · {fmtTime(l.departMin)}</small></span>
      </div>
    );
  }
  if (l.kind === "cab") return <div className="legline"><Chip name="CarTaxiFront" color={MODE_COLOR.cab} size={15} box={28} /><span className="leg">Cab · ₹{l.fare}&nbsp;<small>{fmtTime(l.departMin)} → {fmtTime(l.arriveMin)}</small></span></div>;
  return (
    <div className="legline"><Chip name={MODE_ICON[l.mode]} color={l.color} size={15} box={28} />
      <span className="leg" style={{ display: "block" }}>
        <b style={{ color: l.color }}>{l.routeName}</b> <small>{modeLabel[l.mode]} toward {l.headsign}</small><br />
        {fmtTime(l.departMin)} {l.from.name} → {fmtTime(l.arriveMin)} {l.to.name}
        <small> · {l.stops.length - 1} stops · ₹{l.fare}</small>
        {l.delayMin > 0 && <span className="late"> · running {Math.round(l.delayMin)} min late</span>}
      </span>
    </div>
  );
}

function MoveRow({ m, now }: { m: Move; now?: number }) {
  const active = now !== undefined && now >= m.departMin && now < m.arriveMin;
  const c = m.confidence;
  return (
    <div className={`move ${active ? "now" : ""}`}>
      <div className="head">
        <span>Leave {fmtTime(m.departMin)} · arrive {fmtTime(m.arriveMin)}</span>
        <span className="sub">{fmtDuration(m.arriveMin - m.departMin)}{m.itinerary.fare ? ` · ₹${m.itinerary.fare}` : ""}</span>
        {c && <span className="status" style={{ color: c.pOnTime >= 0.9 ? "#15803d" : c.pOnTime >= 0.8 ? "#a16207" : "#cb272f" }}><Icon name={c.pOnTime >= 0.8 ? "ShieldCheck" : "AlertTriangle"} size={14} />{Math.round(c.pOnTime * 100)}% likely on time{c.riskiest && c.pOnTime < 0.9 ? ` · tightest: ${c.riskiest.label}` : ""}</span>}
      </div>
      <div className="legs">{m.itinerary.legs.map((l, i) => <LegRow key={i} l={l} />)}</div>
    </div>
  );
}

function VisitRow({ v, now }: { v: Visit; now?: number }) {
  const active = now !== undefined && now >= v.arriveMin && now < v.leaveMin;
  const spare = v.maxDwell === v.minDwell ? Math.round(v.dwellMin - v.minDwell) : 0;
  const late = v.arriveBy !== undefined && v.arriveMin > v.arriveBy + 0.5;
  return (
    <div className={`visit ${active ? "now" : ""}`}>
      <div className="t">{fmtTime(v.startMin)}<small>until {fmtTime(v.leaveMin)}</small></div>
      <div>
        <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}><Chip name="MapPin" color="#163300" size={16} box={30} />{v.place.name}</h3>
        {v.place.task && <p style={{ marginTop: 6, fontWeight: 600, color: "var(--color-forest-ink)" }}><Icon name="Briefcase" size={14} /> {v.place.task}</p>}
        <p className="sub" style={{ marginTop: 6 }}>
          {v.maxDwell === v.minDwell ? `${fmtDuration(v.minDwell)} planned${spare >= 10 ? ` · ${fmtDuration(spare)} spare before you leave` : ""}` : `Stay ${fmtDuration(v.dwellMin)}`}
          {v.closes < 1440 && v.opens > 0 ? ` · open ${fmtTime(v.opens)}–${fmtTime(v.closes)}` : ""}
          {v.waitMin >= 5 && ` · opens after you arrive — ${Math.round(v.waitMin)} min wait`}
        </p>
        {v.arriveBy !== undefined && (
          <p className="status" style={{ marginTop: 6, color: late ? "#cb272f" : "#15803d" }}><Icon name={late ? "AlertTriangle" : "ShieldCheck"} size={14} />{late ? `Late for ${fmtTime(v.arriveBy)} — arrive ${fmtTime(v.arriveMin)}` : `Be there by ${fmtTime(v.arriveBy)} · arrive ${fmtTime(v.arriveMin)}`}</p>
        )}
      </div>
    </div>
  );
}

export function Timeline({ plan, now }: { plan: Plan; now?: number }) {
  return (
    <div className="tl">
      {plan.timeline.map((e: Entry, i) => (isTrivialMove(e) ? null : e.kind === "visit" ? <VisitRow key={i} v={e} now={now} /> : <MoveRow key={i} m={e} now={now} />))}
    </div>
  );
}
