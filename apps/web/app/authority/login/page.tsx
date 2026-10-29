"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalBar } from "../../components/LocalBar";
import { api } from "../../lib/api";
import { Chip, Icon } from "../../lib/icons";
import { setAuth } from "../../lib/auth";

interface Demo { email: string; password: string; name: string; role: string; org: string }

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState<Demo[]>([]);
  useEffect(() => { fetch(`${api.baseUrl}/v1/auth/demo`).then((r) => r.json()).then((j) => setDemo(j.accounts ?? [])).catch(() => {}); }, []);

  const go = async (e: string, p: string) => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${api.baseUrl}/v1/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: e, password: p }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message ?? "Sign-in failed");
      setAuth(j);
      router.push("/authority");
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <main>
      <LocalBar title="Authority portal" crumb="Sign in" />
      <section className="band section" style={{ minHeight: "80vh" }}>
        <div className="wrap login stack">
          <div style={{ textAlign: "center" }}>
            <Chip name="ShieldCheck" color="#0e7490" size={26} box={56} />
            <h1 className="h2" style={{ marginTop: 16 }}>Sign in to review citizen reports</h1>
            <p className="sub" style={{ marginTop: 8 }}>For authorised transport, planning and municipal staff.</p>
          </div>
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); go(email, password); }}>
            <label className="field"><span>Work email</span><input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="field"><span>Password</span><input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="pill-primary" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          {demo.length > 0 && (
            <div className="card stack">
              <div className="row"><Icon name="Sparkles" size={16} /><b style={{ fontSize: 14 }}>Demo accounts</b></div>
              <p className="sub">Prototype only — production uses the agency’s own sign-in with role and jurisdiction claims.</p>
              {demo.map((d) => (
                <button key={d.email} className="rcard" style={{ background: "var(--color-studio-mist)" }} onClick={() => go(d.email, d.password)} disabled={busy}>
                  <Chip name={d.role === "analyst" ? "Search" : "ShieldCheck"} color={d.role === "supervisor" ? "#7c3aed" : d.role === "officer" ? "#0f766e" : "#0369a1"} />
                  <span><b>{d.name}</b><p>{d.org} · {d.role}</p></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
