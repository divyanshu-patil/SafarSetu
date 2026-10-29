"use client";
import { useEffect, useState } from "react";
import { LocalBar } from "../components/LocalBar";
import { api } from "../lib/api";
import { Chip, Icon } from "../lib/icons";
import { todayISO } from "../lib/api";

interface Summary { n: number; from: string | null; to: string | null; avgPerWeek: number; avgMinutesLostPerWeek: number; avgRupeesLostPerWeek: number; byRole: Record<string, number>; modes: Record<string, number>; quotes: { code: string; role: string; route: string; problem: string; workaround: string }[]; note: string }
const MODES = ["bus", "metro", "local train", "express train", "auto/cab", "walk"];
const empty = { code: "", date: todayISO(), city: "Pune", role: "", route: "", modes: [] as string[], problem: "", perWeek: "", minutes: "", rupees: "", workaround: "", failed: "", consent: false };

/** Field evidence kit: log anonymous, consented commuter interviews (guide Step 1). Aggregates feed the problem slide — only real data. */
export default function Field() {
  const [f, setF] = useState(empty);
  const [key, setKey] = useState("");
  const [sum, setSum] = useState<Summary | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () => fetch(`${api.baseUrl}/v1/field/summary`).then((r) => r.json()).then(setSum).catch(() => {});
  useEffect(() => { load(); }, []);
  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    setErr(null); setMsg(null);
    try {
      const r = await fetch(`${api.baseUrl}/v1/field/interviews`, { method: "POST", headers: { "content-type": "application/json", "x-field-key": key }, body: JSON.stringify({ code: f.code, date: f.date, city: f.city, role: f.role, route: f.route, modes: f.modes, problem: f.problem, perWeek: Number(f.perWeek), minutesLostPerWeek: Number(f.minutes), rupeesLostPerWeek: Number(f.rupees), workaround: f.workaround, triedAndFailed: f.failed, consent: f.consent }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message ?? "Could not save");
      setMsg("Saved. Thank you."); setF({ ...empty, date: f.date, city: f.city }); load();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <main>
      <LocalBar title="Field research kit" crumb="Anonymous, consented commuter interviews — the evidence behind the problem slide" />
      <section className="band section tight">
        <div className="wrap stage" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="card stack">
            <h2 className="h3">Log an interview</h2>
            <p className="sub">Ask: What exactly goes wrong? How often? What do you do today? What does it cost you? What did you try that didn’t work? Never record names or phone numbers.</p>
            <div className="grid2">
              <label className="field"><span>Participant code</span><input className="input" value={f.code} placeholder="P-001" onChange={(e) => set("code", e.target.value)} /></label>
              <label className="field"><span>Date</span><input className="input" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
              <label className="field"><span>City</span><input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} /></label>
              <label className="field"><span>Who are they?</span><input className="input" value={f.role} placeholder="student, IT employee, vendor…" onChange={(e) => set("role", e.target.value)} /></label>
            </div>
            <label className="field"><span>Route / area they travel</span><input className="input" value={f.route} onChange={(e) => set("route", e.target.value)} /></label>
            <div className="field"><span>Transport used</span><div className="chips">{MODES.map((m) => <button key={m} className="chip" aria-pressed={f.modes.includes(m)} onClick={() => set("modes", f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m])}>{m}</button>)}</div></div>
            <label className="field"><span>The problem, in their words</span><textarea className="textarea" value={f.problem} onChange={(e) => set("problem", e.target.value)} /></label>
            <div className="grid2">
              <label className="field"><span>Times per week</span><input className="input" inputMode="numeric" value={f.perWeek} onChange={(e) => set("perWeek", e.target.value)} /></label>
              <label className="field"><span>Minutes lost per week</span><input className="input" inputMode="numeric" value={f.minutes} onChange={(e) => set("minutes", e.target.value)} /></label>
              <label className="field"><span>₹ lost per week</span><input className="input" inputMode="numeric" value={f.rupees} onChange={(e) => set("rupees", e.target.value)} /></label>
              <label className="field"><span>What they do today</span><input className="input" value={f.workaround} onChange={(e) => set("workaround", e.target.value)} /></label>
            </div>
            <label className="field"><span>What they tried that didn’t work</span><input className="input" value={f.failed} onChange={(e) => set("failed", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /> They agreed to share this anonymously.</label>
            <label className="field"><span>Team key (needed in production)</span><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} /></label>
            {err && <p className="err" role="alert">{err}</p>}
            {msg && <p className="status" style={{ color: "#15803d" }}><Icon name="CircleCheck" size={14} />{msg}</p>}
            <div><button className="pill-primary" onClick={submit}>Save interview</button></div>
          </div>

          <div className="stack">
            <div className="card">
              <div className="row" style={{ gap: 14 }}><Chip name="Users" color="#0369a1" box={44} size={20} /><h2 className="h3">What we have so far</h2></div>
              {sum && sum.n === 0 && <p className="mt">No interviews yet — <b>nothing here is a result</b>. The deck says “planned” until this count is real.</p>}
              {sum && sum.n > 0 && (
                <>
                  <div className="stats mt"><div className="stat"><b>{sum.n}</b><span>interviews{sum.from ? ` · ${sum.from}${sum.to !== sum.from ? ` → ${sum.to}` : ""}` : ""}</span></div><div className="stat"><b>{sum.avgMinutesLostPerWeek}</b><span>min lost / week (avg)</span></div><div className="stat"><b>₹{sum.avgRupeesLostPerWeek}</b><span>lost / week (avg)</span></div></div>
                  <div className="divider" />
                  {sum.quotes.map((q) => <p key={q.code} className="sub mt" style={{ color: "var(--color-ink)" }}>“{q.problem}” <span className="label">— {q.role}, {q.route}</span></p>)}
                </>
              )}
            </div>
            <div className="note">Method (guide §1, §4): interview ≥ 10 people who face the problem; record frequency, time and ₹ lost, what they do today and what failed. Report n and dates with every number. Baseline now → pilot → same questions after.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
