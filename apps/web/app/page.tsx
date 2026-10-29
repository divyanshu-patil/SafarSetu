"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtTime, planToMapLayers, type MapMarker, type Network, type Pace, type Plan, type PlanRequest, type Preset } from "@repo/core";
import { LocalBar, OutlinePill } from "./components/LocalBar";
import { PlaceSearch } from "./components/PlaceSearch";
import { Timeline } from "./components/Timeline";
import { Chip, Icon } from "./lib/icons";
import { api, fromHHMM, LAST_PLAN_KEY, toHHMM, todayISO } from "./lib/api";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

type Prio = 1 | 2 | 3;
interface CityInfo { id: string; city: string; presets: Preset[] }
interface Custom { name: string; lat: number; lon: number; priority: Prio }
const PRIO_LABEL: Record<Prio, string> = { 1: "Nice to have", 2: "Want", 3: "Must see" };

export default function Planner() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [cityId, setCityId] = useState("pune");
  const [net, setNet] = useState<Network | null>(null);
  const [origin, setOrigin] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [selected, setSelected] = useState<Record<string, Prio>>({});
  const [custom, setCustom] = useState<Custom[]>([]);
  const [pace, setPace] = useState<Pace>("normal");
  const [style, setStyle] = useState<"calm" | "brief">("calm");
  const [name, setName] = useState("");
  const [area, setArea] = useState<string>("");
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; plan: Plan } | null>(null);
  const [geoms, setGeoms] = useState<Record<string, [number, number][]>>({});
  const [rain, setRain] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => { api.cities().then((r) => setCities(r.items)).catch(() => setErr("Cannot reach the API. Start it with: pnpm --filter api dev")); }, []);

  const applyPreset = (p: Preset, n: Network) => {
    setOrigin(p.origin);
    setStart(toHHMM(p.startMin));
    setEnd(toHHMM(p.endMin));
    setPace(p.pace);
    setSelected(Object.fromEntries(p.placeIds.map((id, i) => [id, (i % 3 === 0 ? 3 : 2) as Prio])));
    setCustom([]);
    setResult(null);
    void n;
  };

  useEffect(() => {
    setArea("");
    api.network(cityId).then((n) => { setNet(n); if (n.presets[0]) applyPreset(n.presets[0], n); }).catch(() => {});
  }, [cityId]);

  const request = (): PlanRequest | null => {
    if (!origin) return null;
    return {
      city: cityId, date, origin, startMin: fromHHMM(start), endMin: fromHHMM(end), returnToOrigin: true, prefs: { pace, style },
      traveller: name ? { name } : undefined,
      places: [...Object.entries(selected).map(([placeId, priority]) => ({ placeId, priority })), ...custom.map((c) => ({ name: c.name, lat: c.lat, lon: c.lon, priority: c.priority, minDwell: 45, maxDwell: 90 }))],
    };
  };

  const submit = async () => {
    const req = request();
    if (!req) return setErr("Pick a starting point first.");
    if (!req.places.length) return setErr("Choose at least one place.");
    setBusy(true); setErr(null);
    try {
      const r = await api.createPlan(req);
      setResult(r);
      try { localStorage.setItem(LAST_PLAN_KEY, r.id); } catch { /* ignore */ }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const layers = useMemo(() => (result ? planToMapLayers(result.plan) : null), [result]);

  // Real footpaths only for the plan on screen, once each (server caches 24 h).
  useEffect(() => {
    setGeoms({});
    if (!layers) return;
    const todo = layers.lines.filter((l) => l.walk && l.walk.distM > 150);
    let live = true;
    Promise.all(todo.map(async (l) => {
      const w = l.walk!;
      const k = `${w.from}>${w.to}`;
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

  const preview: MapMarker[] = useMemo(() => {
    if (!net || !origin) return [];
    const ms: MapMarker[] = [{ lat: origin.lat, lon: origin.lon, label: origin.name, kind: "origin" }];
    let n = 0;
    for (const id of Object.keys(selected)) { const p = net.places.find((x) => x.id === id); if (p) ms.push({ lat: p.lat, lon: p.lon, label: p.name, kind: "visit", n: ++n }); }
    for (const c of custom) ms.push({ lat: c.lat, lon: c.lon, label: c.name, kind: "visit", n: ++n });
    return ms;
  }, [net, origin, selected, custom]);

  const areas = useMemo(() => [...new Set((net?.places ?? []).map((p) => p.area).filter(Boolean) as string[])], [net]);
  const shown = useMemo(() => (net?.places ?? []).filter((p) => !area || p.area === area || selected[p.id]), [net, area, selected]);
  const cyc = (id: string) => setSelected((s) => { const c = s[id]; const next = { ...s }; if (!c) next[id] = 2; else if (c === 2) next[id] = 3; else if (c === 3) next[id] = 1; else delete next[id]; return next; });
  const pickOnMap = async (lat: number, lon: number) => {
    setPicking(false);
    setOrigin({ name: "Dropped pin", lat, lon });
    api.reverse(lat, lon).then((r) => setOrigin({ name: r.name, lat, lon })).catch(() => {});
  };

  const t = result?.plan.totals;
  return (
    <main>
      <LocalBar title="Plan your day" crumb="Mumbai · Pune · all of Maharashtra">
        <OutlinePill href="/report">Report a gap</OutlinePill>
        <a href="#plan" className="pill-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: 12 }}>Plan my day</a>
      </LocalBar>
      <section className="hero wrap" style={{ paddingBottom: 24 }}>
        <div className="kicker">SafarSetu</div>
        <h1 style={{ maxWidth: "15ch" }}>A whole day, anywhere in Maharashtra.</h1>
        <p>Buses, metro and trains, timed to the minute. We tell you when to leave and how long to stay — and stay calm when things change.</p>
        <nav className="anchors" aria-label="On this page">
          <a href="#plan">Plan</a><a href="#how">How it works</a><a href="#report">Report a gap</a><a href="#authorities">For authorities</a>
        </nav>
      </section>

      <section className="band section tight" id="plan">
        <div className="wrap stage">
          <div className="card stack" aria-label="Plan your day">
            <div className="row between">
              <h2 className="h3">Plan your day</h2>
              <div className="seg" role="group" aria-label="City">
                {(cities.length ? [...cities].sort((a, b) => (a.id === "maharashtra" ? -1 : b.id === "maharashtra" ? 1 : 0)) : [{ id: "pune", city: "Pune", presets: [] }, { id: "mumbai", city: "Mumbai", presets: [] }]).map((c) => <button key={c.id} aria-pressed={cityId === c.id} onClick={() => setCityId(c.id)}>{c.city}</button>)}
              </div>
            </div>

            {(cities.find((c) => c.id === cityId)?.presets.length ?? 0) > 0 && (
              <div className="field"><span>Quick start</span>
                <div className="chips">{cities.find((c) => c.id === cityId)!.presets.map((p) => <button key={p.name} className="chip" onClick={() => net && applyPreset(p, net)}>{p.name}</button>)}</div>
              </div>
            )}

            <div className="field">
              <span>Starting point</span>
              <div className="row" style={{ gap: 8 }}>
                <div className="chip" style={{ flex: 1, borderRadius: 980, padding: "12px 20px", minHeight: 44, display: "flex", alignItems: "center" }}>{origin?.name ?? "Not set"}</div>
                <button className="pill-outline" aria-pressed={picking} onClick={() => setPicking((p) => !p)}>{picking ? "Click the map…" : "Pick on map"}</button>
              </div>
            </div>
            <PlaceSearch city={cityId} label="Search a different start" placeholder="Station, hotel, landmark…" onPick={(h) => setOrigin(h)} />

            <div className="grid2">
              <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="field"><span>Your name (optional)</span><input className="input" value={name} maxLength={40} placeholder="For friendlier alerts" onChange={(e) => setName(e.target.value)} /></label>
              <label className="field"><span>Start</span><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label className="field"><span>Be back by</span><input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            </div>

            <div className="field">
              <span>Places — tap to add, tap again to change importance</span>
              {areas.length > 1 && <div className="seg" style={{ flexWrap: "wrap", borderRadius: 20 }} role="group" aria-label="Area">{["", ...areas].map((a) => <button key={a} aria-pressed={area === a} onClick={() => setArea(a)}>{a || "All"}</button>)}</div>}
              <div className="chips">
                {shown.map((p) => <button key={p.id} className="chip" aria-pressed={!!selected[p.id]} onClick={() => cyc(p.id)} title={p.blurb}>{p.name}{selected[p.id] ? ` · ${selected[p.id] === 3 ? "★★★" : selected[p.id] === 2 ? "★★" : "★"}` : ""}</button>)}
              </div>
            </div>
            <PlaceSearch city={cityId} label="Add any other place" placeholder="Search the city…" onPick={(h) => setCustom((c) => [...c, { ...h, priority: 2 }])} />

            {(Object.keys(selected).length > 0 || custom.length > 0) && (
              <div>
                {Object.entries(selected).map(([id, pr]) => <div className="sel-item" key={id}><b>{net?.places.find((p) => p.id === id)?.name}</b><div className="seg">{([1, 2, 3] as Prio[]).map((v) => <button key={v} aria-pressed={pr === v} onClick={() => setSelected((s) => ({ ...s, [id]: v }))}>{PRIO_LABEL[v]}</button>)}</div></div>)}
                {custom.map((c, i) => <div className="sel-item" key={i}><b>{c.name}</b><button className="pill-outline" onClick={() => setCustom((x) => x.filter((_, j) => j !== i))}>Remove</button></div>)}
              </div>
            )}

            <div className="row between">
              <div className="field"><span>Pace</span><div className="seg" role="group" aria-label="Pace">{(["relaxed", "normal", "fast"] as Pace[]).map((p) => <button key={p} aria-pressed={pace === p} onClick={() => setPace(p)}>{p[0]!.toUpperCase() + p.slice(1)}</button>)}</div></div>
              <div className="field"><span>Alerts</span><div className="seg" role="group" aria-label="Alert style">{(["calm", "brief"] as const).map((s) => <button key={s} aria-pressed={style === s} onClick={() => setStyle(s)}>{s === "calm" ? "Calm" : "Brief"}</button>)}</div></div>
            </div>

            {err && <p className="err" role="alert">{err}</p>}
            <div><button className="pill-primary" onClick={submit} disabled={busy}>{busy ? "Planning…" : "Plan my day"}</button></div>
          </div>

          <div className="frame map">
            <MapView bbox={net?.bbox ?? [72.7, 18.4, 74, 19.3]} lines={lines ?? []} markers={layers?.markers ?? preview} picking={picking} onPick={pickOnMap} />
            {result && t && (
              <div className="capsule">
                <Icon name="ShieldCheck" size={18} /><div><b>{result.plan.timeline.filter((e) => e.kind === "visit").length} places · {t.confidencePct}% on time</b><span className="s">₹{t.fare} fares · {(t.walkM / 1000).toFixed(1)} km walking</span></div>
                <Link href={`/trip/${result.id}`} className="pill-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: 12 }}>Start live trip</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {result && t && (
        <section className="section" ref={resultRef}>
          <div className="wrap">
            <div className="row between">
              <div><div className="label">Your plan · revision {result.plan.revision}</div><h2 className="h2" style={{ marginTop: 8 }}>{fmtTime(result.plan.request.startMin)} to {fmtTime(result.plan.timeline.at(-1) ? ("arriveMin" in result.plan.timeline.at(-1)! ? (result.plan.timeline.at(-1) as { arriveMin: number }).arriveMin : result.plan.request.endMin) : result.plan.request.endMin)}</h2></div>
              <Link href={`/trip/${result.id}`}><span className="pill-primary" >Start live trip</span></Link>
            </div>

            <div className="stats mt2">
              <div className="stat"><b>{result.plan.timeline.filter((e) => e.kind === "visit").length}</b><span>places</span></div>
              <div className="stat"><b>{(t.walkM / 1000).toFixed(1)} km</b><span>walking</span></div>
              <div className="stat"><b>₹{t.fare}</b><span>fares</span></div>
              <div className="stat"><b>{t.confidencePct}%</b><span>on-time confidence{t.riskiest ? ` · tightest: ${t.riskiest}` : ""}</span></div>
            </div>

            {result.plan.dropped.length > 0 && <p className="mt2 label hot">Didn’t fit: {result.plan.dropped.map((d) => `${d.name} (${d.reason})`).join(" · ")}</p>}
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
              ["Clock", "#0e7490", "Every timetable, in sync", "Bus, metro and train times are chained so each leg is boarded on time — with the wait where it is pleasant."],
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
