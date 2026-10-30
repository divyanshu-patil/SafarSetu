"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, PROMISE, STATUSES, type PublicReport } from "@repo/core";
import { LocalBar, OutlinePill } from "../../components/LocalBar";
import { api } from "../../lib/api";
import { Chip, Icon } from "../../lib/icons";
import { Stepper } from "../Stepper";

export default function Track() {
  const { ref } = useParams<{ ref: string }>();
  const [r, setR] = useState<PublicReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetch(`${api.baseUrl}/v1/reports/track/${ref}`).then(async (x) => { const j = await x.json(); if (!x.ok) throw new Error(j?.error?.message); setR(j.report); }).catch((e) => setErr(e.message)); }, [ref]);
  return (
    <main>
      <LocalBar heading title="Report status" crumb={ref}><OutlinePill href="/report">New report</OutlinePill></LocalBar>
      <section className="band section" style={{ minHeight: "70vh" }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          {err && <p className="err">{err}</p>}
          {r && (
            <div className="stack">
              <div className="card">
                <div className="row" style={{ gap: 16 }}>
                  <Chip name={CATEGORIES[r.category].icon} color={CATEGORIES[r.category].color} box={48} size={22} />
                  <div><h2 className="h3">{CATEGORIES[r.category].label}</h2><p className="sub">{r.from?.name}{r.to ? ` → ${r.to.name}` : ""} · {new Date(r.createdAt).toLocaleDateString()}</p></div>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span className="status" style={{ color: STATUSES[r.status].color }}><Icon name={STATUSES[r.status].icon} size={15} />{STATUSES[r.status].label}</span>
                </div>
                <Stepper status={r.status} />
                <p className="sub" style={{ textAlign: "center" }}>{STATUSES[r.status].hint}</p>
              </div>
              {r.publicNote && <div className="card"><div className="label">Note from the reviewing team</div><p style={{ marginTop: 8 }}>{r.publicNote}</p></div>}
              {r.description && <div className="card"><div className="label">Your description</div><p style={{ marginTop: 8 }}>{r.description}</p></div>}
              <p className="sub">{PROMISE}</p>
              <Link href="/">Back to the planner ›</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
