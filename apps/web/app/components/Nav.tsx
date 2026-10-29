"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api, LAST_PLAN_KEY } from "../lib/api";

export function Nav() {
  const path = usePathname();
  const [last, setLast] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try { setLast(localStorage.getItem(LAST_PLAN_KEY)); } catch { /* private mode */ }
    fetch(`${api.baseUrl}/health`).then((r) => setOk(r.ok)).catch(() => setOk(false));
  }, [path]);
  const cur = (p: string) => (path === p || (p !== "/" && path.startsWith(p)) ? "page" : undefined);
  return (
    <header className="nav">
      <nav className="nav-in" aria-label="Primary">
        <Link href="/" className="brand">SafarSetu</Link>
        <Link href="/" className="item" aria-current={cur("/") === "page" && path === "/" ? "page" : undefined}>Plan</Link>
        <Link href={last ? `/trip/${last}` : "/"} className="item" aria-current={path.startsWith("/trip") ? "page" : undefined}>My trip</Link>
        <Link href="/insights" className="item" aria-current={path.startsWith("/insights") ? "page" : undefined}>Insights</Link>
        <span className="spacer" />
        <span className="sub" title={ok ? "API connected" : "API offline — start apps/api"}><i className={`dot ${ok ? "ok" : ""}`} />{ok ? "Live" : "API offline"}</span>
      </nav>
    </header>
  );
}
