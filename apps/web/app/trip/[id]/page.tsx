"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmtTime, nextAction, planToMapLayers, positionAt, type ClockState, type Disruption, type NotificationItem, type Plan } from "@repo/core";
import { Timeline } from "../../components/Timeline";
import { api } from "../../lib/api";
import { useLang } from "../../lib/i18n";
import { Chip, Icon } from "../../lib/icons";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

const SCENARIOS = [
  { name: "train-late-30", label: "Train 30 min late", hint: "Calm “no need to rush” alert", icon: "TrainFront", color: "#be123c" },
  { name: "metro-late-5", label: "Metro 5 min late", hint: "Too small — no alert", icon: "TramFront", color: "#0e7490" },
  { name: "metro-cancelled", label: "Metro cancelled", hint: "Action-first re-plan", icon: "AlertTriangle", color: "#cb272f" },
  { name: "stop-closed", label: "Station closed", hint: "Detour on foot", icon: "Construction", color: "#c2410c" },
  { name: "heavy-rain", label: "Heavy rain", hint: "Heads up", icon: "CloudRain", color: "#0369a1" },
  { name: "clear", label: "Clear all", hint: "Back to normal", icon: "CircleCheck", color: "#15803d" },
];
const KIND_ICON: Record<string, [string, string]> = { relax: ["ShieldCheck", "#15803d"], adjust: ["Shuffle", "#7c3aed"], replan: ["Route", "#cb272f"], urgent: ["AlertTriangle", "#b91c1c"], heads_up: ["CloudRain", "#0369a1"], prepare: ["Clock", "#475569"], leave: ["BellRing", "#0e7490"], board: ["TrainFront", "#0e7490"], wrapup: ["MapPin", "#475569"] };
const KIND: Record<string, string> = { relax: "No rush", adjust: "Plan adjusted", replan: "Re-planned", urgent: "Act now", heads_up: "Heads up", prepare: "Reminder", leave: "Reminder", board: "Reminder", wrapup: "Reminder" };

export default function Trip() {
  const { t } = useLang();
  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => { setReadOnly(new URLSearchParams(window.location.search).get("share") === "1"); }, []);
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [clock, setClock] = useState<{ c: ClockState; at: number } | null>(null);
  const [, force] = useState(0);
  const [feed, setFeed] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [dis, setDis] = useState<Disruption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [perm, setPerm] = useState<string>("default");
  const seen = useRef(new Set<string>());
  const [rated, setRated] = useState<Set<string>>(new Set());
  const [outcome, setOutcome] = useState<string | null>(null);
  const sendFb = (body: object) => fetch(`${api.baseUrl}/v1/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});

  const loadPlan = useCallback(() => api.getPlan(id).then((r) => setPlan(r.plan)).catch((e) => setErr(e.message)), [id]);
  const loadDis = useCallback(() => api.disruptions().then((r) => setDis(r.items)).catch(() => {}), []);

  useEffect(() => {
    loadPlan(); loadDis();
    api.clock().then((c) => setClock({ c, at: Date.now() })).catch(() => {});
    api.notifications(id).then((r) => { r.items.filter((n) => n.sent).forEach((n) => seen.current.add(n.id)); setFeed(r.items.filter((n) => n.sent)); }).catch(() => {});
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    const es = new EventSource(api.streamUrl(id));
    es.addEventListener("clock", (e) => setClock({ c: JSON.parse((e as MessageEvent).data), at: Date.now() }));
    es.addEventListener("plan", () => { loadPlan(); loadDis(); });
    es.addEventListener("notification", (e) => {
      const n = JSON.parse((e as MessageEvent).data) as NotificationItem;
      if (seen.current.has(n.id)) return;
      seen.current.add(n.id);
      setFeed((f) => [n, ...f]);
      setToast(n);
      setTimeout(() => setToast((t) => (t?.id === n.id ? null : t)), 9000);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(n.title, { body: n.body });
    });
    const t = setInterval(() => force((x) => x + 1), 250);
    return () => { es.close(); clearInterval(t); };
  }, [id, loadPlan, loadDis]);

  const now = clock ? (clock.c.running ? clock.c.minute + ((Date.now() - clock.at) / 60000) * clock.c.speed : clock.c.minute) : 0;
  const layers = useMemo(() => (plan ? planToMapLayers(plan) : null), [plan]);
  const me = plan && clock ? positionAt(plan, now) : null;
  const next = plan && clock ? nextAction(plan, now) : null;
  const sorted = [...feed].sort((a, b) => b.fireMin - a.fireMin);

  const setC = (p: Partial<ClockState>) => api.setClock(p).then((c) => setClock({ c, at: Date.now() })).catch((e) => setErr(e.message));
  const run = async (name: string) => { setBusy(name); setErr(null); try { await api.scenario(name, id, plan?.request.city); await loadPlan(); await loadDis(); } catch (e) { setErr((e as Error).message); } finally { setBusy(null); } };
  const startDemo = () => plan && setC({ date: plan.request.date, minute: Math.max(0, plan.request.startMin - 35), speed: 60, running: true });

  if (err && !plan) return <main className="section wrap"><p className="err">{err}</p></main>;
  if (!plan) return <main className="section wrap"><p className="sub">Loading trip…</p></main>;
  const city = plan.request.city ?? "pune";
  const bbox: [number, number, number, number] = city === "mumbai" ? [72.75, 18.88, 73.05, 19.3] : [73.3, 18.4, 74, 18.8];

  return (
    <main>
      <section className="hero wrap" style={{ paddingBottom: 40 }}>
        <div className="kicker">{readOnly ? "Shared live trip (view only)" : "Live trip"}{plan.request.traveller?.name ? ` · ${plan.request.traveller.name}` : ""}</div>
        <div className="clock" style={{ margin: "20px 0 12px" }} aria-live="off">{fmtTime(now)}</div>
        <p className="sub" style={{ margin: "0 auto" }}>{clock?.c.date} · simulated clock{clock?.c.running ? ` · ${clock.c.speed}×` : " · paused"} · revision {plan.revision}</p>
        {!readOnly && <div className="row mt" style={{ justifyContent: "center" }}>
          <button className="pill-primary" onClick={startDemo}>{t("startDemo")}</button>
          <button className="pill-outline" onClick={() => clock && setC({ running: !clock.c.running })}>{clock?.c.running ? "Pause" : "Play"}</button>
          <div className="seg" role="group" aria-label="Speed">{[1, 30, 60, 120].map((s) => <button key={s} aria-pressed={clock?.c.speed === s} onClick={() => setC({ speed: s })}>{s}×</button>)}</div>
        </div>}
        {!readOnly && <><label className="sr" htmlFor="scrub">Scrub time</label>
        <input id="scrub" className="range mt" style={{ maxWidth: 640 }} type="range" min={Math.max(0, plan.request.startMin - 60)} max={Math.min(1439, plan.request.endMin + 30)} value={Math.round(now)} onChange={(e) => setC({ minute: Number(e.target.value), date: plan.request.date })} /></>}
      </section>

      <section className="section tight" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="label">{t("nextUp")}</div>
          <div className="next" style={{ margin: "8px auto 8px", maxWidth: 900 }}>{next?.title ?? t("dayDone")}</div>
          <p className="sub">{next?.detail}</p>
          {!next && !readOnly && (
            <div className="card mt2" style={{ maxWidth: 560, margin: "32px auto 0", textAlign: "left", background: "var(--color-fog)" }}>
              <b>How did the day go?</b>
              {outcome ? <p className="sub mt">Thank you — recorded anonymously ({outcome}).</p> : (
                <div className="chips mt">
                  <button className="chip" onClick={() => { setOutcome("on time"); sendFb({ kind: "trip", planId: id, onTime: true }); }}>I made everything on time</button>
                  {[5, 10, 20].map((m) => <button key={m} className="chip" onClick={() => { setOutcome(`late by about ${m} min`); sendFb({ kind: "trip", planId: id, onTime: false, minutesLate: m }); }}>Late by ~{m} min</button>)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="band section tight">
        <div className="wrap live-grid">
          <div className="frame" style={{ height: 560 }}><MapView bbox={bbox} lines={layers?.lines} markers={layers?.markers} me={me} /></div>
          <div className="stack">
            <div className="card">
              <div className="row between"><h2 className="h3">{t("alertsTitle")}</h2>
                {perm === "default" && typeof Notification !== "undefined" && <button className="pill-outline" onClick={() => Notification.requestPermission().then(setPerm)}>Enable browser alerts</button>}
              </div>
              <div className="alerts mt">
                {sorted.length === 0 && <p className="sub">Nothing yet. Press “Start demo day” — reminders arrive as the clock moves.</p>}
                {sorted.map((n) => (
                  <div className="alert legline" key={n.id} style={{ background: "var(--color-studio-mist)" }}>
                    <Chip name={(KIND_ICON[n.kind] ?? KIND_ICON.prepare!)[0]} color={(KIND_ICON[n.kind] ?? KIND_ICON.prepare!)[1]} />
                    <div>
                      <span className="label" style={{ color: (KIND_ICON[n.kind] ?? KIND_ICON.prepare!)[1] }}>{KIND[n.kind] ?? n.kind}</span>
                      <h4>{n.title}</h4><p>{n.body}</p><time>{fmtTime(n.fireMin)}</time>
                      {!readOnly && !rated.has(n.id) && (
                        <div className="row" style={{ gap: 8, marginTop: 8 }} role="group" aria-label="Was this alert useful?">
                          <span className="label">Useful?</span>
                          <button className="icobtn" title="Yes, useful" aria-label="Yes, useful" onClick={() => { setRated((r) => new Set(r).add(n.id)); sendFb({ kind: "alert", planId: id, alertKind: n.kind, useful: true }); }}><Icon name="ThumbsUp" size={14} /></button>
                          <button className="icobtn" title="Not useful" aria-label="Not useful" onClick={() => { setRated((r) => new Set(r).add(n.id)); sendFb({ kind: "alert", planId: id, alertKind: n.kind, useful: false }); }}><Icon name="ThumbsDown" size={14} /></button>
                        </div>
                      )}
                      {rated.has(n.id) && <span className="label">Thanks — noted anonymously.</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!readOnly && <div className="card">
              <h2 className="h3">{t("simulator")}</h2>
              <p className="sub" style={{ marginTop: 6 }}>Same code path as real feeds: events in, calm plan out. Aimed at what this trip rides next.</p>
              <div className="chips mt">{SCENARIOS.map((s) => <button key={s.name} className="chip" disabled={busy !== null} onClick={() => run(s.name)} title={s.hint}><span style={{ color: s.color, display: "inline-flex", marginRight: 6, verticalAlign: "middle" }}><Icon name={s.icon} size={14} /></span>{busy === s.name ? "…" : s.label}</button>)}</div>
              {err && <p className="err mt" role="alert">{err}</p>}
              {dis.length > 0 && <><div className="divider" /><div className="label">Active events</div>{dis.map((d) => <p key={d.id} className="sub">{d.type.replace("_", " ")}{d.delayMin ? ` · ${d.delayMin} min` : ""} — {d.note ?? d.routeId}</p>)}</>}
              {plan.changes.length > 0 && <><div className="divider" /><div className="label">What changed (revision {plan.revision})</div>{plan.changes.map((c, i) => <p key={i} className="sub">· {c.replace(/Leave time moved (\d+) → (\d+) \(minutes of day\)/, (_, a, b) => `Leave time moved ${fmtTime(+a)} → ${fmtTime(+b)}`)}</p>)}</>}
            </div>}
          </div>
        </div>
      </section>

      <section className="section tight"><div className="wrap"><h2 className="h2" style={{ marginBottom: 28 }}>{t("todaysPlan")}</h2><Timeline plan={plan} now={now} /></div></section>

      {toast && <div className="toast" role="status"><span className={`label ${toast.kind === "replan" || toast.kind === "urgent" ? "hot" : ""}`}>{KIND[toast.kind] ?? toast.kind}</span><h4 style={{ font: "600 17px/1.24 var(--font-text)", margin: "4px 0" }}>{toast.title}</h4><p className="sub" style={{ color: "var(--color-ink)" }}>{toast.body}</p></div>}
    </main>
  );
}
