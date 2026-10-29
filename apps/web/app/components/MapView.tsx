"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { MapLine, MapMarker } from "@repo/core";

interface Props {
  bbox: [number, number, number, number];
  lines?: MapLine[];
  markers?: MapMarker[];
  me?: { lat: number; lon: number; label: string } | null;
  onPick?: (lat: number, lon: number) => void;
  picking?: boolean;
}

// One basemap, no per-second redraws: layers rebuild only when the plan changes; the live dot moves with setLatLng.
export default function MapView({ bbox, lines = [], markers = [], me, onPick, picking }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const group = useRef<L.LayerGroup | null>(null);
  const meMark = useRef<L.Marker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const picking_ = useRef(picking);
  picking_.current = picking;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", { maxZoom: 19, subdomains: "abcd", attribution: "© OpenStreetMap © CARTO" }).addTo(m);
    m.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
    m.on("click", (e) => picking_.current && pick.current?.(e.latlng.lat, e.latlng.lng));
    group.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current, g = group.current;
    if (!m || !g) return;
    g.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const l of lines) {
      L.polyline(l.coords, { color: l.color, weight: l.dashed ? 3 : 5, opacity: l.dashed ? 0.8 : 0.9, dashArray: l.dashed ? "2 7" : undefined, lineCap: "round" }).bindTooltip(l.label, { sticky: true }).addTo(g);
      pts.push(...l.coords);
    }
    for (const k of markers) {
      const icon = L.divIcon({ className: "", html: `<div class="pin ${k.kind}">${k.kind === "visit" ? k.n : ""}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      L.marker([k.lat, k.lon], { icon, title: k.label }).bindTooltip(k.label).addTo(g);
      pts.push([k.lat, k.lon]);
    }
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1) m.setView(pts[0]!, 14);
  }, [lines, markers]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!me) { meMark.current?.remove(); meMark.current = null; return; }
    if (!meMark.current) meMark.current = L.marker([me.lat, me.lon], { icon: L.divIcon({ className: "", html: '<div class="pin me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 1000 }).addTo(m);
    meMark.current.setLatLng([me.lat, me.lon]).bindTooltip(me.label);
  }, [me]);

  useEffect(() => { if (el.current) el.current.style.cursor = picking ? "crosshair" : ""; }, [picking]);

  return <div ref={el} style={{ position: "absolute", inset: 0 }} role="application" aria-label="Map" />;
}
