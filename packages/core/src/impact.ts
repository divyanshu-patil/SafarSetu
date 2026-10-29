import { haversine } from "./time";
import type { Plan, TransitLeg } from "./types";

/**
 * Impact estimate: what a plan costs and emits versus taking a cab for every hop.
 * Every constant carries its basis; values marked provisional must be replaced by the sourced figures in docs/research/seva-research.md.
 */
export const IMPACT_FACTORS = {
  roadFactor: 1.35, // road distance ≈ straight line × 1.35 (assumption)
  /** Cab fare: first 1.5 km ₹37 then ₹22/km — conservative blend of Pune app-cab (₹37 + ₹25/km) and Mumbai taxi (₹21.90/km) tariffs, docs/research E4 */
  cab: { base: 37, perKm: 22, freeKm: 1.5 },
  /**
   * grams CO2 per passenger-km. cab: tailpipe 148–192 g/vehicle-km (India Environment Portal), assumed 1 passenger → 150.
   * suburban/express rail ≈ 8 (GHG Platform India). bus: sources differ 15 vs 53 → we use the HIGHER (53, Down To Earth) so savings are not overstated.
   * metro: no sourced Indian factor found → assumed 30 (provisional).
   */
  co2: { cab: 150, bus: 53, metro: 30, train: 8 },
  provisional: true, // metro factor and cab occupancy are assumptions
  note: "Estimates, not measurements. Baseline = a cab for every hop; emissions per passenger-km. See docs/research/seva-research.md §E.",
} as const;

export interface Impact {
  fare: number;
  cabFare: number;
  savedInr: number;
  co2Kg: number;
  cabCo2Kg: number;
  savedCo2Kg: number;
  km: number;
}

const legKm = (l: TransitLeg) => {
  let m = 0;
  for (let i = 1; i < l.stops.length; i++) m += haversine(l.stops[i - 1]!, l.stops[i]!);
  return (m * 1.1) / 1000; // stops are straight segments; add a small allowance for the path
};

export function planImpact(plan: Plan): Impact {
  const F = IMPACT_FACTORS;
  let cabKm = 0,
    cabFare = 0,
    co2 = 0,
    km = 0;
  for (const e of plan.timeline) {
    if (e.kind !== "move") continue;
    const k = (haversine(e.from, e.to) * F.roadFactor) / 1000;
    cabKm += k;
    cabFare += F.cab.base + F.cab.perKm * Math.max(0, k - F.cab.freeKm);
    for (const l of e.itinerary.legs) {
      if (l.kind === "transit") {
        const d = legKm(l);
        km += d;
        co2 += (d * F.co2[l.mode]) / 1000;
      } else if (l.kind === "cab") {
        const d = (l.distM * F.roadFactor) / 1000 / F.roadFactor;
        km += d;
        co2 += (d * F.co2.cab) / 1000;
      }
    }
  }
  const cabCo2 = (cabKm * F.co2.cab) / 1000;
  const fare = plan.totals.fare;
  return {
    fare,
    cabFare: Math.round(cabFare),
    savedInr: Math.max(0, Math.round(cabFare - fare)),
    co2Kg: +co2.toFixed(2),
    cabCo2Kg: +cabCo2.toFixed(2),
    savedCo2Kg: Math.max(0, +(cabCo2 - co2).toFixed(2)),
    km: +km.toFixed(1),
  };
}
