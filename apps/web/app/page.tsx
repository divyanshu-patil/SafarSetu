"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtTime, planToMapLayers, type MapLine, type MapMarker, type Network, type Pace, type Plan, type PlanRequest } from "@repo/core";
import { LocalBar, OutlinePill } from "./components/LocalBar";
import { PlaceSearch } from "./components/PlaceSearch";
import { Timeline } from "./components/Timeline";
import { EXAMPLES } from "./lib/examples";
import { Chip, Icon } from "./lib/icons";
import { api, fromHHMM, LAST_PLAN_KEY, toHHMM, todayISO } from "./lib/api";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

interface CityInfo { id: string; city: string }
interface Stop { id: string; name: string; lat: number; lon: number; task: string; dwell: number; arriveBy: string; required: boolean; opens?: number; closes?: number }
const DWELLS = [10, 15, 20, 30, 45, 60, 90, 120, 180];
const letter = (i: number) => String.fromCharCode(66 + i); // A is the start
let uid = 0;
const newStop = (p: Partial<Stop> & { name: string; lat: number; lon: number }): Stop => ({ id: `s${++uid}`, task: "", dwell: 30, arriveBy: "", required: true, ...p });

export default function Planner() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [cityId, setCityId] = useState("pune");
  const [net, setNet] = useState<Network | null>(null);
  const [origin, setOrigin] = useState<{ name: string; lat: number; lon: number } | null>({ name: "Pune Junction", lat: 18.5285, lon: 73.8742 });
  const [stops, setStops] = useState<Stop[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [leave, setLeave] = useState("09:00");
  const [finish, setFinish] = useState("");
  const [returnHome, setReturnHome] = useState(false);
  const [order, setOrder] = useState<"mine" | "best">("mine");
  const [pace, setPace] = useState<Pace>("normal");
  const [style, setStyle] = useState<"calm" | "brief">("calm");
  const [name, setName] = useState("");
  const [pick, setPick] = useState<"start" | "stop" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; plan: Plan } | null>(null);
  const [geoms, setGeoms] = useState<Record<string, [number, number][]>>({});
  const [rain, setRain] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [showPop, setShowPop] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => { api.cities().then((r) => setCities(r.items)).catch(() => setErr("Cannot reach the API. Start it with: pnpm --filter api dev")); }, []);
  useEffect(() => { setArea(""); api.network(cityId).then(setNet).catch(() => {}); }, [cityId]);

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    setCityId(ex.city);
    setOrigin(ex.origin);
    setLeave(ex.leave);
    setReturnHome(ex.returnHome);
    setOrder("mine");
    setStops(ex.stops.map((s) => newStop({ ...s })));
    setResult(null);
    setErr(null);
  };
  useEffect(() => { if (!stops.length) loadExample(EXAMPLES[0]!); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id: string, p: Partial<Stop>) => setStops((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => setStops((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });
  const addAt = async (lat: number, lon: number) => {
    const st = newStop({ name: "Dropped pin", lat, lon });
    setStops((s) => [...s, st]);
    setOpen(st.id);
    api.reverse(lat, lon).then((r) => patch(st.id, { name: r.name })).catch(() => {});
  };

  const request = (): PlanRequest | null => {
    if (!origin) return null;
    const startMin = fromHHMM(leave);
    return {
      city: cityId, date, origin, startMin, endMin: finish ? fromHHMM(finish) : Math.min(1439, startMin + 14 * 60),
      returnToOrigin: returnHome, keepOrder: order === "mine", prefs: { pace, style }, traveller: name ? { name } : undefined,
      places: stops.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon, task: s.task || undefined, minDwell: s.dwell, maxDwell: s.dwell, arriveBy: s.arriveBy ? fromHHMM(s.arriveBy) : undefined, required: s.required, priority: s.required ? 3 : 2, opens: s.opens, closes: s.closes })),
    };
  };

  const submit = async () => {
    const req = request();
    if (!req) return setErr("Set a starting point first.");
    if (!req.places.length) return setErr("Add at least one stop.");
    setBusy(true); setErr(null);
    try {
      const r = await api.createPlan(req);
      setResult(r);
      try { localStorage.setItem(LAST_PLAN_KEY, r.id); } catch { /* ignore */ }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const layers = useMemo(() => (result ? planToMapLayers(result.plan) : null), [result]);
  useEffect(() => {
    setGeoms({});
    if (!layers) return;
    const todo = layers.lines.filter((l) => l.walk && l.walk.distM > 150);
    let live = true;
    Promise.all(todo.map(async (l) => {
      const w = l.walk!; const k = `${w.from}>${w.to}`;
      const r = await api.walk(w.from.join(","), w.to.join(",")).catch(() => null);
      return r && r.source !== "straight-line" ? ([k, r.coords] as const) : null;
    })).then((rs) => { if (live) setGeoms(Object.fromEntries(rs.filter(Boolean) as [string, [number, number][]][])); });
    return () => { live = false; };
  }, [layers]);
  const lines = useMemo(() => layers?.lines.map((l) => (l.walk && geoms[`${l.walk.from}>${l.walk.to}`] ? { ...l, coords: geoms[`${l.walk.from}>${l.walk.to}`]! } : l)), [layers, geoms]);

  useEffect(() => {
    setRain(null);
    if (!result) return;
    const o = result.plan.request.origin;
    api.weather(o.lat, o.lon).then((w) => {
      const a = Math.floor(result.plan.request.startMin / 60), b = Math.ceil(result.plan.request.endMin / 60);
      let worst = 0, at = 0;
      w.hours.forEach((h, i) => { if (h >= a && h <= b && (w.rainProb[i] ?? 0) > worst) (worst = w.rainProb[i]!), (at = h); });
      if (worst >= 40) setRain(`Rain chance up to ${worst}% around ${String(at).padStart(2, "0")}:00 — we'll warn you if it matters.`);
    }).catch(() => {});
  }, [result]);

  // Google-Maps-style preview: A, B, C… joined in order until a real plan exists
  const preview: MapMarker[] = useMemo(() => {
    if (!origin) return [];
    return [{ lat: origin.lat, lon: origin.lon, label: origin.name, kind: "origin", text: "A" }, ...stops.map((s, i): MapMarker => ({ lat: s.lat, lon: s.lon, label: s.name, kind: "visit", text: letter(i) }))];
  }, [origin, stops]);
  const previewLine: MapLine[] = useMemo(() => (origin && stops.length ? [{ coords: [[origin.lat, origin.lon], ...stops.map((s) => [s.lat, s.lon] as [number, number]), ...(returnHome ? [[origin.lat, origin.lon] as [number, number]] : [])], color: "#163300", dashed: true, label: "Your route (straight line preview)" }] : []), [origin, stops, returnHome]);

  const onMapPick = (lat: number, lon: number) => {
    if (pick === "start") { setPick(null); setOrigin({ name: "Dropped pin", lat, lon }); api.reverse(lat, lon).then((r) => setOrigin({ name: r.name, lat, lon })).catch(() => {}); }
    else if (pick === "stop") addAt(lat, lon);
  };

  const areas = useMemo(() => [...new Set((net?.places ?? []).map((p) => p.area).filter(Boolean) as string[])], [net]);
  const popular = useMemo(() => (net?.places ?? []).filter((p) => !area || p.area === area).slice(0, 24), [net, area]);
  const t = result?.plan.totals;
  const cityList = (cities.length ? [...cities].sort((a, b) => (a.id === "maharashtra" ? -1 : b.id === "maharashtra" ? 1 : 0)) : [{ id: "pune", city: "Pune" }, { id: "mumbai", city: "Mumbai" }]);

  return (
    <main>
      <LocalBar title="Plan your route" crumb="Work, errands and appointments — across Maharashtra">
        <OutlinePill href="/report">Report a gap</OutlinePill>
        <a href="#plan" className="pill-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: 14 }}>Plan my route</a>
      </LocalBar>
      <section className="hero wrap" style={{ paddingBottom: 24 }}>
        <div className="kicker">SafarSetu</div>
        <h1 style={{ maxWidth: "14ch" }}>Get your work done on the move.</h1>
        <p>Add the places you need to be and when. We line up buses, metro and trains so you reach each one on time — and keep it right when things change.</p>
        <nav className="anchors" aria-label="On this page">
          <a href="#plan">Plan</a><a href="#how">How it works</a><a href="#report">Report a gap</a><a href="#authorities">For authorities</a>
        </nav>
      </section>

      <section className="band section tight" id="plan">
        <div className="wrap stage">
          <div className="card stack" aria-label="Your route">
            <div className="row between">
              <h2 className="h3">Your route</h2>
              <div className="seg" role="group" aria-label="Region">
                {cityList.map((c) => <button key={c.id} aria-pressed={cityId === c.id} onClick={() => setCityId(c.id)}>{c.city}</button>)}
              </div>
            </div>

            <div className="field"><span>Try an example</span>
              <div className="chips">{EXAMPLES.map((ex) => <button key={ex.name} className="chip" onClick={() => loadExample(ex)}>{ex.name}</button>)}</div>
            </div>

            {/* Google-Maps-style stop list: A start, then B, C, … in order */}
            <div className="route">
              <div className="stoprow">
                <span className="badge a">A</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stopname">{origin?.name ?? "Set a starting point"}</div>
                  <div className="sub">Start · leave at <input className="mini" type="time" value={leave} onChange={(e) => setLeave(e.target.value)} aria-label="Leave at" /></div>
                </div>
                <button className="icobtn" aria-pressed={pick === "start"} title="Pick start on map" onClick={() => setPick(pick === "start" ? null : "start")}><Icon name="MapPin" size={16} /></button>
              </div>
              {stops.map((s, i) => (
                <div key={s.id} className="stopblock">
                  <div className="stoprow">
                    <span className="badge">{letter(i)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="stopname">{s.name}</div>
                      <div className="sub">{s.task || "Add what you’re doing here"} · {s.dwell} min{s.arriveBy ? ` · be there by ${s.arriveBy}` : ""}{s.required ? "" : " · optional"}</div>
                    </div>
                    <button className="icobtn" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="ArrowUp" size={16} /></button>
                    <button className="icobtn" title="Move down" disabled={i === stops.length - 1} onClick={() => move(i, 1)}><Icon name="ArrowDown" size={16} /></button>
                    <button className="icobtn" aria-pressed={open === s.id} title="Details" onClick={() => setOpen(open === s.id ? null : s.id)}><Icon name="SlidersHorizontal" size={16} /></button>
                    <button className="icobtn" title="Remove stop" onClick={() => setStops((x) => x.filter((y) => y.id !== s.id))}><Icon name="X" size={16} /></button>
                  </div>
                  {open === s.id && (
                    <div className="stopdetails">
                      <label className="field"><span>What are you doing here?</span><input className="input" value={s.task} maxLength={100} placeholder="Client meeting, bank, pick-up…" onChange={(e) => patch(s.id, { task: e.target.value })} /></label>
                      <div className="grid2">
                        <label className="field"><span>Time needed</span><select className="input" value={s.dwell} onChange={(e) => patch(s.id, { dwell: Number(e.target.value) })}>{DWELLS.map((d) => <option key={d} value={d}>{d >= 60 ? `${d / 60} h` : `${d} min`}</option>)}</select></label>
                        <label className="field"><span>Be there by (optional)</span><input className="input" type="time" value={s.arriveBy} onChange={(e) => patch(s.id, { arriveBy: e.target.value })} /></label>
                      </div>
                      <label className="check"><input type="checkbox" checked={s.required} onChange={(e) => patch(s.id, { required: e.target.checked })} /> Must happen — never skip this stop</label>
                    </div>
                  )}
                </div>
              ))}
              <div className="stoprow add">
                <span className="badge ghost"><Icon name="Plus" size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PlaceSearch city={cityId} label="" placeholder="Add a stop — search a place or address" onPick={(h) => { const st = newStop({ ...h }); setStops((s) => [...s, st]); setOpen(st.id); }} />
                </div>
                <button className="icobtn" aria-pressed={pick === "stop"} title="Add stops by clicking the map" onClick={() => setPick(pick === "stop" ? null : "stop")}><Icon name="MapPin" size={16} /></button>
              </div>
              {pick && <p className="sub" role="status" style={{ marginLeft: 44 }}>{pick === "stop" ? "Click the map to add stops. Click the pin again to stop." : "Click the map to set your start."}</p>}
              {origin && <PlaceSearch city={cityId} label="" placeholder="Change starting point…" onPick={(h) => setOrigin(h)} />}
            </div>

            <div className="grid2">
              <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="field"><span>Finish by (optional)</span><input className="input" type="time" value={finish} onChange={(e) => setFinish(e.target.value)} /></label>
            </div>
            <div className="row between">
              <div className="field"><span>Order of stops</span><div className="seg" role="group" aria-label="Order"><button aria-pressed={order === "mine"} onClick={() => setOrder("mine")}>My order</button><button aria-pressed={order === "best"} onClick={() => setOrder("best")}>Best order</button></div></div>
              <label className="check"><input type="checkbox" checked={returnHome} onChange={(e) => setReturnHome(e.target.checked)} /> Return to start</label>
            </div>
            <div className="row between">
              <div className="field"><span>Pace</span><div className="seg" role="group" aria-label="Pace">{(["relaxed", "normal", "fast"] as Pace[]).map((p) => <button key={p} aria-pressed={pace === p} onClick={() => setPace(p)}>{p[0]!.toUpperCase() + p.slice(1)}</button>)}</div></div>
              <div className="field"><span>Alerts</span><div className="seg" role="group" aria-label="Alert style">{(["calm", "brief"] as const).map((s) => <button key={s} aria-pressed={style === s} onClick={() => setStyle(s)}>{s === "calm" ? "Calm" : "Brief"}</button>)}</div></div>
            </div>
            <label className="field"><span>Your name (optional, for friendlier alerts)</span><input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></label>

            <div>
              <button className="tlink" onClick={() => setShowPop((x) => !x)}>{showPop ? "Hide" : "Show"} popular places{areas.length ? "" : ""}</button>
              {showPop && (
                <div className="stack mt">
                  {areas.length > 1 && <div className="seg" style={{ flexWrap: "wrap", borderRadius: 20 }} role="group" aria-label="Area">{["", ...areas].map((a) => <button key={a} aria-pressed={area === a} onClick={() => setArea(a)}>{a || "All"}</button>)}</div>}
                  <div className="chips">{popular.map((p) => <button key={p.id} className="chip" title={p.blurb} onClick={() => setStops((s) => [...s, newStop({ name: p.name, lat: p.lat, lon: p.lon, dwell: p.minDwell, opens: p.opens, closes: p.closes, required: false })])}>+ {p.name}</button>)}</div>
                </div>
              )}
            </div>

            {err && <p className="err" role="alert">{err}</p>}
            <div><button className="pill-primary" onClick={submit} disabled={busy}>{busy ? "Planning…" : "Plan my route"}</button></div>
          </div>

          <div className="frame map">
            <MapView bbox={net?.bbox ?? [72.7, 18.4, 74, 19.3]} lines={lines ?? previewLine} markers={layers?.markers ?? preview} picking={!!pick} onPick={onMapPick} />
            {result && t && (
              <div className="capsule">
                <Icon name="ShieldCheck" size={18} /><div><b>{result.plan.timeline.filter((e) => e.kind === "visit").length} stops · {t.confidencePct}% on time</b><span className="s">₹{t.fare} fares · {(t.walkM / 1000).toFixed(1)} km walking</span></div>
                <Link href={`/trip/${result.id}`} className="pill-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: 14 }}>Start live trip</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {result && t && (
        <section className="section" ref={resultRef}>
          <div className="wrap">
            <div className="row between">
              <div><div className="label">Your plan · revision {result.plan.revision}</div><h2 className="h2" style={{ marginTop: 8 }}>{fmtTime(result.plan.timeline[0] && result.plan.timeline[0].kind === "move" ? result.plan.timeline[0].departMin : result.plan.request.startMin)} to {fmtTime((() => { const l = result.plan.timeline.at(-1); return l ? (l.kind === "move" ? l.arriveMin : l.leaveMin) : result.plan.request.endMin; })())}</h2></div>
              <Link href={`/trip/${result.id}`} className="pill-primary" style={{ textDecoration: "none" }}>Start live trip</Link>
            </div>
            <div className="stats mt2">
              <div className="stat"><b>{result.plan.timeline.filter((e) => e.kind === "visit").length}</b><span>stops</span></div>
              <div className="stat"><b>{(t.walkM / 1000).toFixed(1)} km</b><span>walking</span></div>
              <div className="stat"><b>₹{t.fare}</b><span>fares</span></div>
              <div className="stat"><b>{t.confidencePct}%</b><span>on-time confidence{t.riskiest ? ` · tightest: ${t.riskiest}` : ""}</span></div>
            </div>
            {(result.plan.conflicts?.length ?? 0) > 0 && (
              <div className="note mt2" role="alert" style={{ borderLeft: "4px solid var(--color-alarm-red)" }}>
                <b style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="AlertTriangle" size={16} />This can’t work as asked</b>
                {result.plan.conflicts!.map((c, i) => <p key={i}><b>{c.name}</b>: {c.reason}. Try starting earlier, moving the time, or making the stop optional.</p>)}
              </div>
            )}
            {result.plan.dropped.length > 0 && <p className="mt2 label hot">Left out (optional stops that didn’t fit): {result.plan.dropped.map((d) => `${d.name} (${d.reason})`).join(" · ")}</p>}
            {rain && <p className="mt label">{rain}</p>}
            {result.plan.reminders[0] && <p className="mt sub">First reminder: “{result.plan.reminders[0].title}” at {fmtTime(result.plan.reminders[0].atMin)}.</p>}
          </div>
          <div className="band section tight" style={{ marginTop: 40 }}>
            <div className="wrap"><Timeline plan={result.plan} /></div>
          </div>
        </section>
      )}

      <section className="section" id="how">
        <div className="wrap">
          <div className="hl-head"><h2 className="h2">Highlights</h2><Link href="/report" className="tlink">Help fix a gap ›</Link></div>
          <div className="slides">
            {[
              ["Clock", "#0e7490", "Your errands, in order", "Add the places you need to be. We chain bus, metro and train times so you reach each one when you need to."],
              ["BellRing", "#7c3aed", "Calm alerts, not alarms", "“No need to rush — your train is 30 minutes late. Leave at 10:40.” Tone follows the slack you really have."],
              ["Map", "#15803d", "All of Maharashtra", "Real railway timetables between cities, with Mumbai and Pune first- and last-mile detail."],
              ["Flag", "#cb272f", "Report a gap", "Name two areas that should be connected. Reports reach authorities as evidence, not noise."],
              ["ShieldCheck", "#0369a1", "Built for authorities", "Ranked gaps with transparent weights, case status, and a feedback loop back to citizens."],
            ].map(([icon, color, h, p]) => <article className="fcard" key={h}><Chip name={icon!} color={color!} box={48} size={22} /><div><h3>{h}</h3><p>{p}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="band section" id="report">
        <div className="wrap editorial">
          <div>
            <div className="kicker">Citizen reports</div>
            <h2 className="h2" style={{ fontSize: "clamp(32px,5vw,56px)", marginTop: 16 }}>If the bus doesn’t reach, say so.</h2>
            <p className="body">Pick the two areas that should be connected, choose what goes wrong, and send it. You get a reference number and can track the status.</p>
            <Link href="/report" className="tlink">Report a connectivity gap ›</Link>
          </div>
          <div className="card" style={{ background: "var(--color-studio-mist)" }}>
            {[["BusFront", "#d9480f", "Hinjewadi → Shivajinagar", "No feeder service"], ["Hourglass", "#b45309", "Mira Road → Borivali", "Too infrequent"], ["Accessibility", "#1d4ed8", "Nagpur Airport → Metro", "Accessibility difficulty"]].map(([i, c, a, b]) => (
              <div className="legline" key={a} style={{ padding: "12px 0" }}><Chip name={i!} color={c!} /><div><b style={{ fontSize: 17 }}>{a}</b><p className="sub">{b} · sample</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark section" id="authorities">
        <div className="wrap editorial">
          <div className="card" style={{ order: 0 }}>
            {[["#1", "Hinjewadi → Shivajinagar", 92], ["#2", "Powai → Andheri", 84], ["#3", "Kharadi → Yerawada", 61]].map(([n, a, v]) => (
              <div key={a as string} style={{ padding: "12px 0" }}><div className="row between"><b>{n} · {a}</b><span className="sub">{v}</span></div><div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${v}%` }} /></div></div>
            ))}
            <p className="label" style={{ marginTop: 8 }}>Illustrative ranking — real view is inside the portal</p>
          </div>
          <div>
            <div className="kicker">For authorities</div>
            <h2 className="h2" style={{ fontSize: "clamp(32px,5vw,56px)", marginTop: 16 }}>See where journeys break.</h2>
            <p className="body">Grouped reports, case status and data coverage in one place. Change the ranking weights and watch the order move — nothing is a black box.</p>
            <Link href="/authority/login" className="tlink">Open the authority portal ›</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
