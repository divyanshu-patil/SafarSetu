"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LocalBar } from "../components/LocalBar";
import { Icon } from "../lib/icons";
import { getAuth, setAuth, type Me } from "../lib/auth";

export const ROLE_LABEL = { supervisor: "Supervisor · can decide", officer: "Officer · can decide", analyst: "Analyst · read & notes" } as const;

/** Guards authority pages; redirects to sign-in when there is no session. */
export function useMe(): Me | null {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { const a = getAuth(); if (!a) router.replace("/authority/login"); else setMe(a.user); }, [router]);
  return me;
}

export function AuthorityShell({ me, children }: { me: Me; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const tab = (href: string, label: string, icon: string) => (
    <Link href={href} className="pill-outline" aria-pressed={path === href} style={{ textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center", ...(path === href ? { background: "#163300", color: "#ffffff", borderColor: "#163300" } : {}) }}><Icon name={icon} size={13} />{label}</Link>
  );
  return (
    <main>
      <LocalBar title="Authority portal" crumb={`${me.org} · ${ROLE_LABEL[me.role]}`}>
        {tab("/authority", "Overview", "TrendingUp")}
        {tab("/authority/reports", "Citizen reports", "Inbox")}
        <button className="pill-outline" style={{ display: "inline-flex", gap: 6, alignItems: "center" }} onClick={() => { setAuth(null); router.push("/authority/login"); }}><Icon name="LogOut" size={13} />Sign out</button>
      </LocalBar>
      {children}
    </main>
  );
}
