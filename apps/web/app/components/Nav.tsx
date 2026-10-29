"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../lib/icons";
import { api, LAST_PLAN_KEY } from "../lib/api";
import { getAuth } from "../lib/auth";

/** Global store-style navigation: 44px, 12px links, hairline edge. */
export function Nav() {
  const path = usePathname();
  const [last, setLast] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [who, setWho] = useState<string | null>(null);
  useEffect(() => {
    try { setLast(localStorage.getItem(LAST_PLAN_KEY)); } catch { /* private mode */ }
    setWho(getAuth()?.user.name ?? null);
    fetch(`${api.baseUrl}/health`).then((r) => setOk(r.ok)).catch(() => setOk(false));
  }, [path]);
  const cur = (p: string, exact = false) => ((exact ? path === p : path.startsWith(p)) ? "page" : undefined);
  return (
    <header className="nav">
      <nav className="nav-in" aria-label="Primary">
        <Link href="/" className="brand"><Icon name="Route" size={16} />SafarSetu</Link>
        <Link href="/" className="item" aria-current={cur("/", true)}>Plan</Link>
        <Link href={last ? `/trip/${last}` : "/"} className="item" aria-current={cur("/trip")}>My trip</Link>
        <Link href="/report" className="item" aria-current={cur("/report")}>Report a gap</Link>
        <Link href="/insights" className="item" aria-current={cur("/insights")}>Insights</Link>
        <span className="spacer" />
        <Link href={who ? "/authority" : "/authority/login"} className="item" aria-current={cur("/authority")}>{who ? `Authority · ${who}` : "Authority sign in"}</Link>
        <span className="sub" title={ok ? "API connected" : "API offline — start apps/api"}><i className={`dot ${ok ? "ok" : ""}`} />{ok ? "Live" : "Offline"}</span>
      </nav>
    </header>
  );
}
