"use client";
import { fmtDuration, fmtTime, type Entry, type Leg, type Move, type Plan, type Visit } from "@repo/core";

const modeLabel = { metro: "Metro", train: "Train", bus: "Bus" } as const;

function LegRow({ l }: { l: Leg }) {
  if (l.kind === "walk") {
    const mins = Math.round(l.arriveMin - l.departMin);
    return (
      <div className="leg"><i className="sw" />
        <span>Walk {mins} min · {Math.round(l.distM)} m <small>to {l.to.name ?? "next stop"} · {fmtTime(l.departMin)}</small></span>
      </div>
    );
  }
  if (l.kind === "cab") return <div className="leg"><i className="sw" style={{ background: "#b64400" }} /><span>Cab · ₹{l.fare} <small>{fmtTime(l.departMin)} → {fmtTime(l.arriveMin)}</small></span></div>;
  return (
    <div className="leg"><i className="sw" style={{ background: l.color }} />
      <span>
        <b>{l.routeName}</b> <small>{modeLabel[l.mode]} toward {l.headsign}</small><br />
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
        {c && <span className={`label ${c.pOnTime < 0.8 ? "hot" : ""}`}>{Math.round(c.pOnTime * 100)}% likely on time{c.riskiest && c.pOnTime < 0.9 ? ` · tightest: ${c.riskiest.label}` : ""}</span>}
      </div>
      <div className="legs">{m.itinerary.legs.map((l, i) => <LegRow key={i} l={l} />)}</div>
    </div>
  );
}

function VisitRow({ v, now }: { v: Visit; now?: number }) {
  const active = now !== undefined && now >= v.arriveMin && now < v.leaveMin;
  return (
    <div className={`visit ${active ? "now" : ""}`}>
      <div className="t">{fmtTime(v.startMin)}<small>until {fmtTime(v.leaveMin)}</small></div>
      <div>
        <h3>{v.place.name}</h3>
        <p className="sub mt" style={{ marginTop: 6 }}>
          Stay {fmtDuration(v.dwellMin)} · open {fmtTime(v.opens)}–{fmtTime(v.closes)}
          {v.waitMin >= 5 && ` · opens after you arrive — ${Math.round(v.waitMin)} min wait`}
        </p>
      </div>
    </div>
  );
}

export function Timeline({ plan, now }: { plan: Plan; now?: number }) {
  return (
    <div className="tl">
      {plan.timeline.map((e: Entry, i) => (e.kind === "visit" ? <VisitRow key={i} v={e} now={now} /> : <MoveRow key={i} m={e} now={now} />))}
    </div>
  );
}
