import { haversine } from "./time";

export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** radius in km within which a point belongs to this region */
  km: number;
}

/** Major Maharashtra urban regions, used to route reports to the right authority jurisdiction. */
export const REGIONS: Region[] = [
  { id: "mumbai", name: "Mumbai Metropolitan Region", lat: 19.076, lon: 72.8777, km: 45 },
  { id: "pune", name: "Pune", lat: 18.5204, lon: 73.8567, km: 40 },
  { id: "nashik", name: "Nashik", lat: 19.9975, lon: 73.7898, km: 35 },
  { id: "nagpur", name: "Nagpur", lat: 21.1458, lon: 79.0882, km: 40 },
  { id: "aurangabad", name: "Chhatrapati Sambhajinagar", lat: 19.8762, lon: 75.3433, km: 35 },
  { id: "kolhapur", name: "Kolhapur", lat: 16.705, lon: 74.2433, km: 30 },
  { id: "solapur", name: "Solapur", lat: 17.6599, lon: 75.9064, km: 30 },
  { id: "amravati", name: "Amravati", lat: 20.9374, lon: 77.7796, km: 30 },
];

export const OTHER_REGION = "maharashtra-other";

export function regionOf(p: { lat: number; lon: number }): string {
  let best: { id: string; d: number } | undefined;
  for (const r of REGIONS) {
    const d = haversine(p, r) / 1000;
    if (d <= r.km && (!best || d < best.d)) best = { id: r.id, d };
  }
  return best?.id ?? OTHER_REGION;
}
