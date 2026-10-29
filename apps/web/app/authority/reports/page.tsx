"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, REGIONS, STATUSES, type Report, type ReportCategory, type ReportStatus } from "@repo/core";
import { authed } from "../../lib/auth";
import { Chip, Icon } from "../../lib/icons";
import { AuthorityShell, useMe } from "../useAuthority";

type Row = Omit<Report, "reporter">;
interface List { total: number; facets: { status: Record<string, number>; category: Record<string, number>; city: Record<string, number> }; items: Row[] }
const SEV = ["", "Minor", "Real problem", "Serious"];
const SEV_COLOR = ["", "#a16207", "#c2410c", "#b91c1c"];
const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? "Other Maharashtra";

export default function Inbox() {
  const me = useMe();
  const router = useRouter();
  const [f, setF] = useState({ status: "", category: "", city: "", q: "" });
  const [data, setData] = useState<List | null>(null);
  const [sel, setSel] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pub, setPub] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { const p = new URLSearchParams(window.location.search); setF((x) => ({ ...x, status: p.get("status") ?? "", q: p.get("q") ?? "" })); }, []);
  const fail = useCallback((e: Error & { status?: number }) => (e.status === 401 ? router.replace("/authority/login") : setErr(e.message)), [router]);
  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    return authed<List>(`/v1/authority/reports?${qs}`).then((d) => { setData(d); setSel((s) => d.items.find((i) => i.id === s?.id) ?? d.items[0] ?? null); }).catch(fail);
  }, [f, fail]);
  useEffect(() => { if (me) { const t = setTimeout(load, 200); return () => clearTimeout(t); } }, [me, load]);
  useEffect(() => { setPub(sel?.publicNote ?? ""); setNote(""); }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canDecide = me?.role !== "analyst";
  const patch = async (body: object) => {
    if (!sel) return;
    setSaving(true); setErr(null);
    try { const r = await authed<{ report: Row }>(`/v1/authority/reports/${sel.id}`, { method: "PATCH", body: JSON.stringify(body) }); setSel(r.report); await load(); setNote(""); }
    catch (e) { fail(e as Error); } finally { setSaving(false); }
  };

  if (!me) return null;
  return (
    <AuthorityShell me={me}>
      <section className="band section tight" style={{ minHeight: "80vh" }}>
        <div className="wrap stack">
          <div className="card">
            <div className="row" style={{ gap: 12 }}>
              <div style={{ position: "relative", flex: "1 1 240px" }}><input className="input" placeholder="Search area, reference, text…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
              <select className="input" style={{ width: 220 }} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label="Category">
                <option value="">All categories</option>{(Object.keys(CATEGORIES) as ReportCategory[]).map((k) => <option key={k} value={k}>{CATEGORIES[k].label} ({data?.facets.category[k] ?? 0})</option>)}
              </select>
              <select className="input" style={{ width: 220 }} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} aria-label="Region">
                <option value="">All regions</option>{Object.entries(data?.facets.city ?? {}).map(([id, n]) => <option key={id} value={id}>{regionName(id)} ({n})</option>)}
              </select>
            </div>
            <div className="chips mt">
              <button className="chip" aria-pressed={!f.status} onClick={() => setF({ ...f, status: "" })}>All</button>
              {(Object.keys(STATUSES) as ReportStatus[]).map((s) => <button key={s} className="chip" aria-pressed={f.status === s} style={{ display: "inline-flex", gap: 6, alignItems: "center" }} onClick={() => setF({ ...f, status: f.status === s ? "" : s })}><span style={{ color: f.status === s ? "#fff" : STATUSES[s].color, display: "inline-flex" }}><Icon name={STATUSES[s].icon} size={14} /></span>{STATUSES[s].label} · {data?.facets.status[s] ?? 0}</button>)}
            </div>
          </div>
          {err && <p className="err" role="alert">{err}</p>}

          <div className="inbox">
            <div className="stack" style={{ gap: 8 }}>
              <div className="row between"><p className="label">{data?.total ?? 0} report{data?.total === 1 ? "" : "s"}</p><button className="pill-outline" onClick={async () => { const a = (await import("../../lib/auth")).getAuth(); const r = await fetch(`${(await import("../../lib/api")).api.baseUrl}/v1/authority/reports.csv`, { headers: { authorization: `Bearer ${a?.token}` } }); const b = await r.blob(); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = "safarsetu-reports.csv"; l.click(); URL.revokeObjectURL(u); }}>Export CSV</button></div>
              {data?.items.slice(0, 60).map((r) => (
                <button key={r.id} className="rcard" aria-current={sel?.id === r.id} onClick={() => setSel(r)}>
                  <Chip name={CATEGORIES[r.category].icon} color={CATEGORIES[r.category].color} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{r.from?.name ?? r.location.name}{r.to ? ` → ${r.to.name}` : ""}</b>
                    <p>{CATEGORIES[r.category].label} · {regionName(r.city)} · {r.ref}</p>
                    <span className="status" style={{ color: STATUSES[r.status].color, marginTop: 6 }}><Icon name={STATUSES[r.status].icon} size={13} />{STATUSES[r.status].label}</span>
                  </span>
                  <span style={{ color: SEV_COLOR[r.severity], display: "inline-flex" }} title={SEV[r.severity]}>{Array.from({ length: r.severity }).map((_, i) => <Icon key={i} name="AlertTriangle" size={13} />)}</span>
                </button>
              ))}
              {data && data.items.length === 0 && <p className="sub">No reports match these filters.</p>}
            </div>

            {sel && (
              <div className="card stack" style={{ position: "sticky", top: 120 }}>
                <div className="row" style={{ gap: 14 }}>
                  <Chip name={CATEGORIES[sel.category].icon} color={CATEGORIES[sel.category].color} box={48} size={22} />
                  <div style={{ flex: 1 }}><h2 className="h3">{CATEGORIES[sel.category].label}</h2><p className="sub">{sel.ref} · {new Date(sel.createdAt).toLocaleString()} · {regionName(sel.city)}</p></div>
                  <span className="status" style={{ color: STATUSES[sel.status].color }}><Icon name={STATUSES[sel.status].icon} size={15} />{STATUSES[sel.status].label}</span>
                </div>
                <div className="grid2">
                  <div className="note"><div className="label">The gap</div><b>{sel.from?.name ?? sel.location.name}</b>{sel.to && <> <Icon name="ArrowRight" size={13} /> <b>{sel.to.name}</b></>}</div>
                  <div className="note"><div className="label">Mode · time · severity</div>{sel.mode}{sel.timeOfDay ? ` · ${sel.timeOfDay}` : ""} · <span style={{ color: SEV_COLOR[sel.severity], fontWeight: 600 }}>{SEV[sel.severity]}</span></div>
                </div>
                {sel.description && <div><div className="label">Reporter’s description</div><p style={{ marginTop: 6 }}>{sel.description}</p></div>}
                {sel.synthetic && <p className="label hot">Demo (synthetic) report</p>}
                <div className="divider" style={{ margin: 0 }} />

                <div><div className="label">Status {canDecide ? "" : "· your role cannot change status"}</div>
                  <div className="chips mt">{(Object.keys(STATUSES) as ReportStatus[]).map((s) => <button key={s} className="chip" disabled={!canDecide || saving} aria-pressed={sel.status === s} style={{ display: "inline-flex", gap: 6, alignItems: "center", opacity: canDecide ? 1 : 0.5 }} onClick={() => patch({ status: s })}><span style={{ color: sel.status === s ? "#fff" : STATUSES[s].color, display: "inline-flex" }}><Icon name={STATUSES[s].icon} size={14} /></span>{STATUSES[s].label}</button>)}</div>
                </div>

                <label className="field"><span>Public note (the citizen can see this)</span>
                  <textarea className="textarea" disabled={!canDecide} value={pub} onChange={(e) => setPub(e.target.value)} placeholder="e.g. Shared with the transport agency for review." />
                  {canDecide && <div><button className="pill-outline" disabled={saving} onClick={() => patch({ publicNote: pub })}>Save public note</button></div>}
                </label>

                <div><div className="label">Internal notes (staff only)</div>
                  {sel.internalNotes.map((n, i) => <p key={i} className="sub mt" style={{ color: "var(--color-ink)" }}><Icon name="MessageCircleQuestion" size={13} /> {n.text} <span style={{ color: "var(--color-steel)" }}>— {n.by}, {new Date(n.at).toLocaleDateString()}</span></p>)}
                  <div className="row mt" style={{ gap: 8 }}><input className="input" value={note} placeholder="Add a note for colleagues…" onChange={(e) => setNote(e.target.value)} /><button className="pill-primary" disabled={!note || saving} onClick={() => patch({ internalNote: note })}>Add</button></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </AuthorityShell>
  );
}
