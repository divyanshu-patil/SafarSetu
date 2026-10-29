"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export interface Hit { name: string; lat: number; lon: number }

/** Debounced, min-3-chars autocomplete via our cached geocode proxy. */
export function PlaceSearch({ city, placeholder, onPick, label }: { city: string; placeholder: string; onPick: (h: Hit) => void; label: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    if (q.trim().length < 3) { setHits([]); return; }
    const id = ++seq.current;
    const t = setTimeout(() => {
      fetch(`${api.baseUrl}/v1/geocode?city=${city}&q=${encodeURIComponent(q)}`).then((r) => r.json()).then((j) => { if (id === seq.current) { setHits(j.items ?? []); setOpen(true); } }).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [q, city]);
  return (
    <label className="field rel">
      <span>{label}</span>
      <input className="input" value={q} placeholder={placeholder} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} autoComplete="off" />
      {open && hits.length > 0 && (
        <div className="suggest" role="listbox">
          {hits.map((h, i) => <button key={i} type="button" role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); onPick(h); setQ(""); setOpen(false); }}>{h.name}</button>)}
        </div>
      )}
    </label>
  );
}
