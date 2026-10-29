"use client";
import { useEffect, useState } from "react";
import type { Insights } from "@repo/core";
import { api } from "../lib/api";

export default function InsightsPage() {
  const [d, setD] = useState<Insights | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.insights().then(setD).catch((e) => setErr(e.message)); }, []);
  const max = Math.max(1, ...(d?.routes.map((r) => r.disruptions) ?? [1]));
  return (
    <main>
      <section className="hero wrap">
        <div className="kicker">For transport authorities</div>
        <h1>Where journeys break.</h1>
        <p>Anonymous, aggregated signals from live plans: which services slip, and which connections put riders at risk.</p>
      </section>
      {err && <p className="err wrap">{err}</p>}
      {d && (
        <>
          <section className="band section">
            <div className="wrap">
              <div className="stats">
                <div className="stat"><b>{d.totals.plans}</b><span>plans</span></div>
                <div className="stat"><b>{d.totals.disruptions}</b><span>disruptions seen</span></div>
                <div className="stat"><b>{d.totals.replans}</b><span>automatic re-plans</span></div>
                <div className="stat"><b>{d.totals.notifications}</b><span>alerts delivered</span></div>
                <div className="stat"><b>{d.totals.minutesSaved}</b><span>rider minutes saved from waiting</span></div>
              </div>
            </div>
          </section>
          <section className="section">
            <div className="wrap stack">
              <div className="card" style={{ background: "var(--color-studio-mist)" }}>
                <h2 className="h3">Least reliable services</h2>
                {d.routes.length === 0 ? <p className="sub mt">No disruptions yet — trigger some on the live trip page.</p> : (
                  <table className="t mt"><thead><tr><th>Service</th><th>Events</th><th>Avg delay</th><th>Cancelled</th><th style={{ width: "30%" }} /></tr></thead>
                    <tbody>{d.routes.map((r) => <tr key={r.routeId}><td>{r.name}</td><td>{r.disruptions}</td><td>{r.avgDelayMin ? `${r.avgDelayMin} min` : "—"}</td><td>{r.cancelled}</td><td><div className="bar"><i style={{ width: `${(r.disruptions / max) * 100}%` }} /></div></td></tr>)}</tbody></table>
                )}
              </div>
              <div className="card" style={{ background: "var(--color-studio-mist)" }}>
                <h2 className="h3">Riskiest connections in planned trips</h2>
                {d.risky.length === 0 ? <p className="sub mt">Create a plan to see its tightest connection.</p> : d.risky.map((r) => <p key={r.label} className="mt sub" style={{ color: "var(--color-ink)" }}>{r.label} <span className="label">· {r.count} plan{r.count > 1 ? "s" : ""}</span></p>)}
              </div>
              <p className="label">{d.note}</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
