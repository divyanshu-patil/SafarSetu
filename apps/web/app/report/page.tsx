"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, PROMISE, REGIONS, STATUSES, type MapLine, type PublicReport, type ReportCategory, type ReportMode } from "@repo/core";
import { LocalBar, OutlinePill } from "../components/LocalBar";
import { PlaceSearch } from "../components/PlaceSearch";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import { Chip, Icon, MODE_COLOR } from "../lib/icons";
import { Stepper } from "./Stepper";

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });
type Area = { name: string; lat: number; lon: number };
const STATE_BBOX: [number, number, number, number] = [72.6, 15.6, 80.9, 22.1];
const MODES: { id: ReportMode; label: string; icon: string }[] = [
  { id: "bus", label: "Bus", icon: "BusFront" }, { id: "metro", label: "Metro", icon: "TramFront" }, { id: "train", label: "Train", icon: "TrainFront" }, { id: "walk", label: "On foot", icon: "Footprints" }, { id: "any", label: "Not sure", icon: "CircleHelp" },
];
const SEV = [{ v: 1, label: "Minor", color: "#a16207" }, { v: 2, label: "Real problem", color: "#c2410c" }, { v: 3, label: "Serious", color: "#b91c1c" }] as const;

export default function ReportPage() {
  const { t } = useLang();
  const [cat, setCat] = useState<ReportCategory | null>(null);
  const [sev, setSev] = useState<1 | 2 | 3>(2);
  const [from, setFrom] = useState<Area | null>(null);
  const [to, setTo] = useState<Area | null>(null);
  const [mode, setMode] = useState<ReportMode>("bus");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [bbox, setBbox] = useState(STATE_BBOX);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<PublicReport | null>(null);

  const pick = async (lat: number, lon: number) => {
    const which = picking; setPicking(null);
    if (!which) return;
    const a = { name: "Dropped pin", lat, lon };
    which === "from" ? setFrom(a) : setTo(a);
    api.reverse(lat, lon).then((r) => (which === "from" ? setFrom({ ...a, name: r.name }) : setTo({ ...a, name: r.name }))).catch(() => {});
  };

  const pins = useMemo(() => [...(from ? [{ id: "f", lat: from.lat, lon: from.lon, label: `From: ${from.name}`, color: "#163300" }] : []), ...(to ? [{ id: "t", lat: to.lat, lon: to.lon, label: `To: ${to.name}`, color: "#0b4c72" }] : [])], [from, to]);
  const lines: MapLine[] = useMemo(() => (from && to ? [{ coords: [[from.lat, from.lon], [to.lat, to.lon]], color: cat ? CATEGORIES[cat].color : "#707070", dashed: true, label: "The gap" }] : []), [from, to, cat]);

  const submit = async () => {
    if (!cat) return setErr("Choose what kind of problem it is.");
    if (!from) return setErr("Tell us where the problem is (from area).");
    if (!agree) return setErr("Please tick the box to confirm you have read how your report is used.");
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${api.baseUrl}/v1/reports`, { method: "POST", headers: { "content-type": "application/json", "x-user-id": "demo" }, body: JSON.stringify({ category: cat, severity: sev, from, to: to ?? undefined, mode, timeOfDay: time || undefined, description: desc }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message ?? "Could not submit");
      setDone(j.report);
      try { const k = "safarsetu:reports"; const cur = JSON.parse(localStorage.getItem(k) ?? "[]"); localStorage.setItem(k, JSON.stringify([j.report.ref, ...cur].slice(0, 20))); } catch { /* ignore */ }
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (done) return (
    <main>
      <LocalBar title="Report a connectivity gap" crumb="Received" />
      <section className="band section" style={{ minHeight: "70vh" }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="card receipt">
            <Chip name="CircleCheck" color="#15803d" size={30} box={64} />
            <h2 className="h2" style={{ margin: "20px 0 8px" }}>Thank you — we have it.</h2>
            <p className="sub">Your reference number</p>
            <div className="ref" style={{ margin: "8px 0 20px" }}>{done.ref}</div>
            <p className="sub" style={{ maxWidth: 560, margin: "0 auto" }}>{PROMISE}</p>
            <Stepper status={done.status} />
            <div className="row mt2" style={{ justifyContent: "center" }}>
              <Link href={`/report/${done.ref}`} className="pill-primary" style={{ textDecoration: "none" }}>Track this report</Link>
              <button className="pill-outline" onClick={() => { setDone(null); setCat(null); setDesc(""); setFrom(null); setTo(null); }}>Report another</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );

  return (
    <main>
      <LocalBar title={t("reportTitle")} crumb={t("reportSub")}><OutlinePill href="/">Back to planner</OutlinePill></LocalBar>
      <section className="hero wrap" style={{ paddingBottom: 40 }}>
        <div className="kicker">Your journey, your evidence</div>
        <h1 style={{ maxWidth: "16ch" }}>Can’t get there? Tell us.</h1>
        <p>Name the two places that should be connected and what goes wrong. Reports are grouped by area so authorities can see recurring gaps.</p>
      </section>
      <section className="band section tight">
        <div className="wrap stage">
          <div className="card stack">
            <div className="field"><span>1 · What is the problem?</span>
              <div className="cat-grid">
                {(Object.keys(CATEGORIES) as ReportCategory[]).map((k) => (
                  <button key={k} className="cat" aria-pressed={cat === k} onClick={() => setCat(k)}>
                    <Chip name={CATEGORIES[k].icon} color={CATEGORIES[k].color} />
                    <b>{CATEGORIES[k].label}</b><small>{CATEGORIES[k].hint}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field"><span>2 · Which areas are not connected?</span>
              <div className="row" style={{ gap: 8 }}>
                <div className="chip" style={{ flex: 1, borderRadius: 980, minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}><Icon name="MapPin" size={16} />{from?.name ?? "From area — not set"}</div>
                <button className="pill-outline" aria-pressed={picking === "from"} onClick={() => setPicking(picking === "from" ? null : "from")}>{picking === "from" ? "Click map…" : "Pick on map"}</button>
              </div>
              <PlaceSearch city="maharashtra" label="" placeholder="Search the from area…" onPick={(h) => { setFrom(h); setBbox([h.lon - 0.12, h.lat - 0.09, h.lon + 0.12, h.lat + 0.09]); }} />
              <div className="row" style={{ gap: 8 }}>
                <div className="chip" style={{ flex: 1, borderRadius: 980, minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}><Icon name="Flag" size={16} />{to?.name ?? "To area — optional"}</div>
                <button className="pill-outline" aria-pressed={picking === "to"} onClick={() => setPicking(picking === "to" ? null : "to")}>{picking === "to" ? "Click map…" : "Pick on map"}</button>
              </div>
              <PlaceSearch city="maharashtra" label="" placeholder="Search the to area…" onPick={setTo} />
            </div>

            <div className="field"><span>3 · Which transport was involved?</span>
              <div className="chips">{MODES.map((m) => <button key={m.id} className="chip" aria-pressed={mode === m.id} style={{ display: "inline-flex", gap: 8, alignItems: "center" }} onClick={() => setMode(m.id)}><Icon name={m.icon} size={15} />{m.label}</button>)}</div>
            </div>

            <div className="grid2">
              <div className="field"><span>How serious?</span>
                <div className="seg" role="group" aria-label="Severity">{SEV.map((s) => <button key={s.v} aria-pressed={sev === s.v} onClick={() => setSev(s.v)}>{s.label}</button>)}</div>
              </div>
              <label className="field"><span>Usual time (optional)</span><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            </div>
            <label className="field"><span>What happens? (optional, no personal details please)</span>
              <textarea className="textarea" maxLength={600} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. The last bus to the station leaves at 8 pm, so people walk 3 km." />
            </label>

            <div className="note"><Icon name="ShieldCheck" size={14} /> We store the areas, category and your text — no name, phone number or device location. Reports are deleted after 12 months and shared with authorities for your region only. <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy notice</a>. {PROMISE.split(".")[2]?.trim()}.</div>
            <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read how this report is used. (If you are under 18, please ask a parent or guardian first.)</label>
            {err && <p className="err" role="alert">{err}</p>}
            <div><button className="pill-primary" onClick={submit} disabled={busy}>{busy ? t("sending") : t("sendReport")}</button></div>
          </div>
          <div className="frame map"><MapView bbox={bbox} pins={pins} lines={lines} picking={!!picking} onPick={pick} /></div>
        </div>
        <div className="wrap sub" style={{ paddingTop: 12 }}>Jump to: {REGIONS.slice(0, 6).map((r) => <button key={r.id} className="tlink" style={{ marginRight: 14, fontSize: 14 }} onClick={() => setBbox([r.lon - 0.3, r.lat - 0.22, r.lon + 0.3, r.lat + 0.22])}>{r.name.split(" ")[0]}</button>)}</div>
      </section>
      <div style={{ display: "none" }}>{STATUSES.received.label}{MODE_COLOR.bus}</div>
    </main>
  );
}
