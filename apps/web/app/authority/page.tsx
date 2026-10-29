"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, DEFAULT_WEIGHTS, STATUSES, type IssueGroup, type MapLine, type ReportCategory, type ReportStatus, type Weights } from "@repo/core";
import { authed } from "../lib/auth";
import { Chip, Icon } from "../lib/icons";
import { AuthorityShell, useMe } from "./useAuthority";

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });
interface Overview {
  totals: { reports: number; open: number; awaitingReview: number; stale: number; resolved: number };
  byStatus: Record<string, number>; byCategory: Record<string, number>;
  byRegion: { id: string; name: string; count: number }[];
  trend: { date: string; count: number }[];
  pins: { id: string; ref: string; category: ReportCategory; status: ReportStatus; severity: number; location: { name: string; lat: number; lon: number }; from?: { lat: number; lon: number }; to?: { lat: number; lon: number } }[];
  coverage: { id: string; city: string; stops: number; routes: number; places: number; dataQuality: string; note: string }[];
  synthetic: boolean;
}

function Spark({ data }: { data: { count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 300, h = 72, step = w / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => `${(i * step).toFixed(1)},${(h - 6 - (d.count / max) * (h - 14)).toFixed(1)}`).join(" ");
  return <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Reports per day, last 30 days"><polyline points={pts} fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>;
}

export default function AuthorityOverview() {
  const me = useMe();
  const router = useRouter();
  const [ov, setOv] = useState<Overview | null>(null);
  const [issues, setIssues] = useState<IssueGroup[]>([]);
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS);
  const [err, setErr] = useState<string | null>(null);
  const fail = (e: Error & { status?: number }) => (e.status === 401 ? router.replace("/authority/login") : setErr(e.message));

  useEffect(() => { if (me) authed<Overview>("/v1/authority/overview").then(setOv).catch(fail); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!me) return;
    const t = setTimeout(() => authed<{ items: IssueGroup[] }>(`/v1/authority/issues?wVolume=${w.volume}&wUnique=${w.unique}&wSeverity=${w.severity}&wRecency=${w.recency}`).then((r) => setIssues(r.items)).catch(fail), 250);
    return () => clearTimeout(t);
  }, [me, w]); // eslint-disable-line react-hooks/exhaustive-deps

  const pins = useMemo(() => (ov?.pins ?? []).map((p) => ({ id: p.id, lat: p.location.lat, lon: p.location.lon, label: `${p.ref} · ${CATEGORIES[p.category].label}`, color: CATEGORIES[p.category].color })), [ov]);
  const lines: MapLine[] = useMemo(() => (ov?.pins ?? []).filter((p) => p.from && p.to).map((p) => ({ coords: [[p.from!.lat, p.from!.lon], [p.to!.lat, p.to!.lon]], color: CATEGORIES[p.category].color, dashed: true, label: CATEGORIES[p.category].label })), [ov]);

  if (!me) return null;
  const maxCat = Math.max(1, ...Object.values(ov?.byCategory ?? { x: 1 }));
  const kpi = (icon: string, color: string, v: number | string, label: string) => <div className="kpi"><Chip name={icon} color={color} /><div><b>{v}</b><br /><span className="l">{label}</span></div></div>;

  return (
    <AuthorityShell me={me}>
      <section className="section tight">
        <div className="wrap">
          <div className="kicker">Overview</div>
          <h1 className="h2" style={{ margin: "12px 0 8px" }}>Where do journeys fail?</h1>
          <p className="sub" style={{ maxWidth: "62ch" }}>Citizen reports of unconnected areas, grouped for review. Groupings are suggestions for a human reviewer — never official findings.{ov?.synthetic ? " Demo data is synthetic." : ""}</p>
          {err && <p className="err mt">{err}</p>}
        </div>
      </section>

      <section className="band section tight">
        <div className="wrap stack">
          <div className="kpis">
            {kpi("Inbox", "#0369a1", ov?.totals.open ?? "–", "open reports")}
            {kpi("Hourglass", "#b45309", ov?.totals.awaitingReview ?? "–", "awaiting first review")}
            {kpi("AlertTriangle", "#cb272f", ov?.totals.stale ?? "–", "waiting over 7 days")}
            {kpi("CircleCheck", "#15803d", ov?.totals.resolved ?? "–", "resolved")}
            <div className="kpi"><Chip name="TrendingUp" color="#0e7490" /><div><span className="l">Reports per day · 30 days</span>{ov && <Spark data={ov.trend} />}</div></div>
          </div>

          <div className="stage" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="frame map" style={{ position: "relative", top: 0, minHeight: 480 }}>
              <MapView bbox={[72.6, 15.6, 80.9, 22.1]} pins={pins} lines={lines} onPin={() => router.push("/authority/reports")} />
              <div className="capsule"><Icon name="MapPin" size={16} /><div><b>{ov?.totals.reports ?? 0} reports on the map</b><span className="s">Dots = problem location · dashed line = the unconnected pair</span></div></div>
            </div>
            <div className="stack">
              <div className="card">
                <h2 className="h3">What people report</h2>
                <div className="mt">
                  {(Object.keys(CATEGORIES) as ReportCategory[]).filter((k) => ov?.byCategory[k]).sort((a, b) => (ov!.byCategory[b] ?? 0) - (ov!.byCategory[a] ?? 0)).map((k) => (
                    <div className="barrow" key={k}><Chip name={CATEGORIES[k].icon} color={CATEGORIES[k].color} box={28} size={14} />
                      <div><div className="name">{CATEGORIES[k].label}</div><div className="bar"><i className="c" style={{ width: `${(ov!.byCategory[k]! / maxCat) * 100}%`, ["--c" as string]: CATEGORIES[k].color }} /></div></div>
                      <b style={{ fontSize: 14 }}>{ov!.byCategory[k]}</b></div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="h3">Case status</h2>
                <div className="chips mt">{(Object.keys(STATUSES) as ReportStatus[]).map((s) => (
                  <Link key={s} href={`/authority/reports?status=${s}`} className="chip" style={{ display: "inline-flex", gap: 8, alignItems: "center", textDecoration: "none", color: "var(--color-ink)" }}><span style={{ color: STATUSES[s].color, display: "inline-flex" }}><Icon name={STATUSES[s].icon} size={15} /></span>{STATUSES[s].label} · <b>{ov?.byStatus[s] ?? 0}</b></Link>
                ))}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="hl-head"><h2 className="h2">Ranked connectivity gaps</h2><span className="sub">Change the weights — the order updates. Every factor is shown.</span></div>
          <div className="weights card" style={{ background: "var(--color-studio-mist)" }}>
            {([["volume", "Number of reports"], ["unique", "Independent reporters"], ["severity", "Severity"], ["recency", "Recent (14 days)"]] as const).map(([k, label]) => (
              <label className="field" key={k}><span>{label} · {Math.round(w[k] * 100)}%</span><input className="range" type="range" min={0} max={1} step={0.05} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} /></label>
            ))}
          </div>
          <div className="mt">
            {issues.slice(0, 8).map((g, i) => (
              <div className="rank" key={g.id}>
                <Chip name={CATEGORIES[g.category].icon} color={CATEGORIES[g.category].color} box={40} />
                <div>
                  <b style={{ fontSize: 17 }}>#{i + 1} · {g.from?.name ?? "Area"}{g.to ? ` → ${g.to.name}` : ""}</b>
                  <p className="sub">{CATEGORIES[g.category].label} · {g.count} report{g.count > 1 ? "s" : ""} from {g.uniqueReporters} people · last {new Date(g.lastAt).toLocaleDateString()}</p>
                  <div className="parts">{g.components.map((c) => <div key={c.key}><small>{c.label}: <b>{c.raw}</b></small><div className="bar"><i className="c" style={{ width: `${c.value * 100}%`, ["--c" as string]: CATEGORIES[g.category].color }} /></div></div>)}</div>
                </div>
                <div style={{ textAlign: "right" }}><b style={{ fontSize: 24 }}>{Math.round(g.score * 100)}</b><br /><Link href={`/authority/reports?q=${encodeURIComponent(g.from?.name ?? "")}`} style={{ fontSize: 14 }}>Review ›</Link></div>
              </div>
            ))}
            {issues.length === 0 && <p className="sub">No reports in your jurisdiction yet.</p>}
          </div>
        </div>
      </section>

      <section className="band section tight">
        <div className="wrap">
          <div className="hl-head"><h2 className="h2">Data & coverage</h2><span className="sub">Which datasets sit behind the findings (see DATA_SOURCES.md)</span></div>
          <div className="card"><table className="t"><thead><tr><th>Network</th><th>Stops</th><th>Routes</th><th>Places</th><th>Data quality</th></tr></thead><tbody>
            {ov?.coverage.map((c) => <tr key={c.id}><td><b>{c.city}</b><br /><span className="sub">{c.note}</span></td><td>{c.stops}</td><td>{c.routes}</td><td>{c.places}</td><td><span className="status" style={{ color: c.dataQuality === "synthetic" ? "#b45309" : "#15803d" }}><Icon name={c.dataQuality === "synthetic" ? "AlertTriangle" : "ShieldCheck"} size={14} />{c.dataQuality}</span></td></tr>)}
          </tbody></table></div>
        </div>
      </section>
    </AuthorityShell>
  );
}
