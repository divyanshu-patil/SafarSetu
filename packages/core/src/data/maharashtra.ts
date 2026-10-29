import type { Network, Place, Preset, RouteDef, Stop } from "../types";
import { mergeNetworks } from "../network";
import { mumbaiNetwork } from "./mumbai";
import { puneNetwork } from "./pune";
import gen from "./maharashtra.generated.json";

const g = gen as { stops: Stop[]; routes: RouteDef[]; places: Place[] };
const tag = (n: Network, area: string): Place[] => n.places.map((p) => ({ ...p, area }));

const st = (code: string) => {
  const s = g.stops.find((x) => x.id === "mh_s_" + code);
  if (!s) throw new Error("missing station " + code);
  return { name: s.name, lat: s.lat, lon: s.lon };
};
const origin = (code: string, name: string) => ({ ...st(code), name });
const byName = (area: string, ...names: string[]) =>
  names.map((n) => g.places.find((p) => p.area === area && p.name === n)?.id).filter((x): x is string => !!x);

const presets: Preset[] = [
  { name: "Mumbai to Pune day by train", origin: origin("CSTM", "CSMT, Mumbai"), startMin: 7 * 60, endMin: 23 * 60 + 30, placeIds: ["shaniwar_wada", "dagdusheth"], pace: "relaxed" },
  { name: "Nashik temples & caves", origin: origin("NK", "Nashik Road station"), startMin: 8 * 60, endMin: 18 * 60, placeIds: byName("Nashik", "Panchavati", "Kalaram Mandir", "Ramkund"), pace: "normal" },
  { name: "Nagpur city day", origin: origin("NGP", "Nagpur Junction"), startMin: 9 * 60, endMin: 18 * 60, placeIds: byName("Nagpur", "Deekshabhoomi", "Zero Mile Stone", "Nagpur Central Museum"), pace: "normal" },
  { name: "Chhatrapati Sambhajinagar heritage day", origin: origin("AWB", "Aurangabad station"), startMin: 9 * 60, endMin: 18 * 60, placeIds: byName("Chhatrapati Sambhajinagar", "Bibi Ka Maqbara", "Panchakki"), pace: "normal" },
];

export const maharashtraNetwork: Network = mergeNetworks(
  "maharashtra",
  "Maharashtra",
  [72.6, 15.6, 80.9, 22.1],
  [mumbaiNetwork, puneNetwork],
  {
    stops: g.stops,
    routes: g.routes,
    places: [...tag(mumbaiNetwork, "Mumbai"), ...tag(puneNetwork, "Pune"), ...g.places],
    presets,
    note:
      "MIXED. Real: intercity/suburban rail halts and scheduled times from the datameet/railways Indian Railways timetable (assumed daily; no run-days) and notable-place POIs from OpenStreetMap (ODbL; dwell times and most opening hours assumed). Synthetic: Mumbai and Pune urban detail (metro, local rail, buses, their places) is demo data, not for real travel decisions. No Maharashtra metro lines were imported from OSM.",
  },
);
