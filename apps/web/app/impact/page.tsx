"use client";
import { useEffect, useState } from "react";
import { IMPACT_FACTORS } from "@repo/core";
import { api } from "../lib/api";
import { LocalBar, OutlinePill } from "../components/LocalBar";
import { Chip } from "../lib/icons";

const F = IMPACT_FACTORS;
const SCALE = [
  ["Mumbai suburban rail", "≈ 68 lakh passengers / day (average)", "Mumbai rail operators, reported 2026 (MED)"],
  ["MSRTC", "≈ 50–55 lakh passengers / day", "MSRTC, reported (MED)"],
  ["PMPML (Pune)", "≈ 10 lakh passengers / day · ≈ 60 breakdowns / day", "PMPML, reported (MED)"],
  ["Time in traffic (cars)", "Pune ≈ 152 h/yr · Mumbai ≈ 126 h/yr (33 min 20 s and 28 min 51 s per 10 km)", "TomTom Traffic Index 2025 (HIGH/MED)"],
  ["Last mile", "Walking + shared modes > 75 % of last-mile trips; riders accept ≈ 20 min to reach a station", "WRI India (HIGH)"],
];

interface Fb { alerts: { n: number; usefulPct: number | null }; trips: { n: number; onTimePct: number | null; avgMinutesLate: number | null }; note: string }

export default function ImpactPage() {
  const [fb, setFb] = useState<Fb | null>(null);
  useEffect(() => { fetch(`${api.baseUrl}/v1/feedback/summary`).then((r) => r.json()).then(setFb).catch(() => {}); }, []);
  return (
    <main>
      <LocalBar title="How we estimate impact" crumb="Transparent, conservative, and labelled as estimates"><OutlinePill href="/">Back to the planner</OutlinePill></LocalBar>
      <section className="hero wrap" style={{ paddingBottom: 24 }}>
        <div className="kicker">Impact model</div>
        <h1 style={{ maxWidth: "13ch" }}>Estimates you can check.</h1>
        <p>Every plan shows what it would cost and emit if you took a cab for every hop. No pilot results exist yet — nothing here is a measured outcome.</p>
      </section>

      <section className="band section tight">
        <div className="wrap stack">
          <div className="card">
            <div className="row" style={{ gap: 14 }}><Chip name="TrendingUp" color="#15803d" box={44} size={20} /><h2 className="h3">The model</h2></div>
            <ol className="stack mt" style={{ paddingLeft: 20, fontSize: 16 }}>
              <li><b>Baseline:</b> a cab for every hop between your stops: road distance = straight line × {F.roadFactor}; fare = ₹{F.cab.base} for the first {F.cab.freeKm} km, then ₹{F.cab.perKm}/km.</li>
              <li><b>Your plan:</b> the real fares of the buses, metro and trains in the plan (modelled slabs — see DATA_SOURCES.md).</li>
              <li><b>Saving:</b> baseline − plan, shown only when positive.</li>
              <li><b>CO₂:</b> distance × g per passenger-km for each mode, versus the cab baseline.</li>
            </ol>
          </div>

          <div className="card">
            <h2 className="h3">Factors and where they come from</h2>
            <table className="t mt"><thead><tr><th>Factor</th><th>Value used</th><th>Basis</th></tr></thead><tbody>
              <tr><th scope="row">Cab fare</th><td>₹{F.cab.base} + ₹{F.cab.perKm}/km after {F.cab.freeKm} km</td><td>Pune app-cab ₹37 + ₹25/km (RTA, 2025); Mumbai taxi ₹21.90/km (2026) — we use the lower rate (HIGH/MED)</td></tr>
              <tr><th scope="row">Cab CO₂</th><td>{F.co2.cab} g / passenger-km</td><td>Tailpipe 148–192 g per vehicle-km (India Environment Portal); assumes one passenger</td></tr>
              <tr><th scope="row">Bus CO₂</th><td>{F.co2.bus} g / passenger-km</td><td>Two sources disagree (15 g GHG Platform vs 53 g Down To Earth); <b>we use the higher</b> so savings aren’t overstated</td></tr>
              <tr><th scope="row">Rail CO₂</th><td>{F.co2.train} g / passenger-km</td><td>GHG Platform India, suburban ≈ 7.95 g</td></tr>
              <tr><th scope="row">Metro CO₂</th><td>{F.co2.metro} g / passenger-km</td><td><b>Assumption</b> — no sourced Indian metro factor found</td></tr>
            </tbody></table>
            {F.provisional && <p className="label hot mt">Provisional: metro factor and cab occupancy are assumptions. Replace with sourced values before any public claim.</p>}
          </div>

          <div className="card">
            <h2 className="h3">Who this could reach (addressable, not achieved)</h2>
            <table className="t mt"><tbody>{SCALE.map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td className="sub">{c}</td></tr>)}</tbody></table>
          </div>

          <div className="card">
            <h2 className="h3">Pilot feedback so far</h2>
            {fb && fb.alerts.n + fb.trips.n === 0 && <p className="mt">None yet — <b>nothing here is a result</b>. During a pilot, riders can tap “useful?” on each alert and say how the day went; the answers appear here, anonymously.</p>}
            {fb && fb.alerts.n + fb.trips.n > 0 && (
              <div className="stats mt">
                <div className="stat"><b>{fb.alerts.usefulPct ?? "–"}%</b><span>of {fb.alerts.n} rated alerts were useful</span></div>
                <div className="stat"><b>{fb.trips.onTimePct ?? "–"}%</b><span>of {fb.trips.n} trips on time{fb.trips.avgMinutesLate ? ` (late ones ≈ ${fb.trips.avgMinutesLate} min)` : ""}</span></div>
              </div>
            )}
            {fb && <p className="label mt">{fb.note}</p>}
          </div>

          <div className="card">
            <h2 className="h3">What we have not measured</h2>
            <p className="mt">Time saved, cab trips avoided and satisfaction are <b>not measured</b>. The plan for measuring them (baseline interviews → 4-week pilot → before/after) is in the repository at <code>docs/14-pilot-plan.md</code>. The in-app counters on the Insights page use synthetic demo data and are labelled so.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
