"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../lib/icons";
import { api, LAST_PLAN_KEY } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { LANG_LABEL, type Lang } from "@repo/core";

/** Global store-style navigation: 44px, 12px links, hairline edge. */
export function Nav() {
  const path = usePathname();
  const { t, lang, setLang } = useLang();
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
        <Link href="/" className="item" aria-current={cur("/", true)}>{t("navPlan")}</Link>
        <Link href={last ? `/trip/${last}` : "/"} className="item" aria-current={cur("/trip")}>{t("navTrip")}</Link>
        <Link href="/report" className="item" aria-current={cur("/report")}>{t("navReport")}</Link>
        <Link href="/insights" className="item" aria-current={cur("/insights")}>{t("navInsights")}</Link>
        <span className="spacer" />
        <Link href={who ? "/authority" : "/authority/login"} className="item" aria-current={cur("/authority")}>{who ? `Authority · ${who}` : t("navAuthority")}</Link>
        <span className="sub" title={ok ? "API connected" : "API offline — start apps/api"}><i className={`dot ${ok ? "ok" : ""}`} />{ok ? t("live") : t("offline")}</span>
        <div className="seg" role="group" aria-label="Language" style={{ marginLeft: 8 }}>{(["en", "hi", "mr"] as Lang[]).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>{LANG_LABEL[l]}</button>)}</div>
      </nav>
    </header>
  );
}
