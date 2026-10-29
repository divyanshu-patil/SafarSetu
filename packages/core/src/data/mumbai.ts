import type { Mode, Network, Place, RouteDef, Stop } from "../types";
import { buildRoutes, type RouteSpec } from "../network";
import best from "./best.generated.json";

// SYNTHETIC demo pack: station order follows the real Mumbai Suburban, Metro 1/3 and BEST corridors;
// coordinates are approximate and timings invented. Replace with GTFS / operator data in production.

const S = (id: string, name: string, lat: number, lon: number, mode: Mode) => ({ id, name, lat, lon, mode });

const stops: Stop[] = [
  // Western line (fast, Churchgate - Borivali)
  S("w_churchgate", "Churchgate", 18.9322, 72.8264, "train"),
  S("w_marine", "Marine Lines", 18.9437, 72.8228, "train"),
  S("w_grant", "Grant Road", 18.9638, 72.8152, "train"),
  S("w_central", "Mumbai Central", 18.9695, 72.8195, "train"),
  S("w_dadar", "Dadar (W)", 19.0186, 72.8429, "train"),
  S("w_bandra", "Bandra", 19.0544, 72.8402, "train"),
  S("w_santacruz", "Santacruz", 19.0816, 72.8416, "train"),
  S("w_andheri", "Andheri", 19.1197, 72.8464, "train"),
  S("w_borivali", "Borivali", 19.2307, 72.8567, "train"),
  // Central line (CSMT - Thane)
  S("c_csmt", "CSMT", 18.9398, 72.8355, "train"),
  S("c_byculla", "Byculla", 18.9769, 72.8328, "train"),
  S("c_dadar", "Dadar (C)", 19.0195, 72.844, "train"),
  S("c_kurla", "Kurla", 19.0654, 72.8793, "train"),
  S("c_ghatkopar", "Ghatkopar", 19.086, 72.9081, "train"),
  S("c_thane", "Thane", 19.186, 72.9758, "train"),
  // Metro 1 (Versova - Ghatkopar)
  S("m1_versova", "Versova", 19.1311, 72.8138, "metro"),
  S("m1_dn", "D N Nagar", 19.1248, 72.8312, "metro"),
  S("m1_azad", "Azad Nagar", 19.1243, 72.8398, "metro"),
  S("m1_andheri", "Andheri (Metro)", 19.1196, 72.847, "metro"),
  S("m1_weh", "W. Express Highway", 19.117, 72.856, "metro"),
  S("m1_chakala", "Chakala", 19.113, 72.865, "metro"),
  S("m1_airport", "Airport Road", 19.11, 72.87, "metro"),
  S("m_marol", "Marol Naka", 19.1088, 72.879, "metro"), // interchange M1 / M3
  S("m1_saki", "Saki Naka", 19.101, 72.889, "metro"),
  S("m1_asalpha", "Asalpha", 19.096, 72.896, "metro"),
  S("m1_jagruti", "Jagruti Nagar", 19.091, 72.904, "metro"),
  S("m1_ghatkopar", "Ghatkopar (Metro)", 19.0872, 72.9085, "metro"),
  // Metro 3 Aqua (Cuffe Parade - Aarey)
  S("m3_cuffe", "Cuffe Parade", 18.9152, 72.8184, "metro"),
  S("m3_churchgate", "Churchgate (Metro)", 18.9335, 72.828, "metro"),
  S("m3_hutatma", "Hutatma Chowk", 18.9345, 72.8319, "metro"),
  S("m3_csmt", "CSMT (Metro)", 18.941, 72.8352, "metro"),
  S("m3_grant", "Grant Road (Metro)", 18.965, 72.816, "metro"),
  S("m3_central", "Mumbai Central (Metro)", 18.97, 72.819, "metro"),
  S("m3_mahalaxmi", "Mahalaxmi", 18.9825, 72.8205, "metro"),
  S("m3_worli", "Worli", 19.0105, 72.818, "metro"),
  S("m3_sidd", "Siddhivinayak", 19.016, 72.83, "metro"),
  S("m3_dadar", "Dadar (Metro)", 19.019, 72.842, "metro"),
  S("m3_dharavi", "Dharavi", 19.043, 72.856, "metro"),
  S("m3_bkc", "BKC", 19.066, 72.8688, "metro"),
  S("m3_t2", "Airport T2", 19.098, 72.87, "metro"),
  S("m3_seepz", "SEEPZ", 19.126, 72.874, "metro"),
  S("m3_aarey", "Aarey JVLR", 19.145, 72.87, "metro"),
];

const localHw: [number, number, number][] = [
  [330, 480, 6],
  [480, 660, 4],
  [660, 1020, 8],
  [1020, 1260, 4],
  [1260, 1410, 10],
];
const metroHw: [number, number, number][] = [
  [330, 480, 8],
  [480, 660, 5],
  [660, 1020, 8],
  [1020, 1260, 5],
  [1260, 1380, 10],
];
const specs: RouteSpec[] = [
  { id: "western", mode: "train", name: "Western Line (fast)", color: "#e11d48", stops: ["w_churchgate", "w_marine", "w_grant", "w_central", "w_dadar", "w_bandra", "w_santacruz", "w_andheri", "w_borivali"], gap: [3, 4, 3, 8, 8, 4, 5, 15], headways: localHw, both: true },
  { id: "central", mode: "train", name: "Central Line", color: "#d97706", stops: ["c_csmt", "c_byculla", "c_dadar", "c_kurla", "c_ghatkopar", "c_thane"], gap: [7, 8, 12, 5, 17], headways: localHw, both: true },
  { id: "metro1", mode: "metro", name: "Metro Line 1", color: "#2563eb", stops: ["m1_versova", "m1_dn", "m1_azad", "m1_andheri", "m1_weh", "m1_chakala", "m1_airport", "m_marol", "m1_saki", "m1_asalpha", "m1_jagruti", "m1_ghatkopar"], gap: 2, headways: metroHw, both: true },
  { id: "metro3", mode: "metro", name: "Metro Line 3 (Aqua)", color: "#0891b2", stops: ["m3_cuffe", "m3_churchgate", "m3_hutatma", "m3_csmt", "m3_grant", "m3_central", "m3_mahalaxmi", "m3_worli", "m3_sidd", "m3_dadar", "m3_dharavi", "m3_bkc", "m3_t2", "m_marol", "m3_seepz", "m3_aarey"], gap: [3, 2, 2, 4, 2, 3, 3, 3, 2, 3, 3, 4, 3, 3, 3], headways: metroHw, both: true },
];

const P = (id: string, name: string, lat: number, lon: number, opens: string, closes: string, minDwell: number, maxDwell: number, category: string, blurb: string): Place => {
  const t = (s: string) => Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]);
  return { id, name, lat, lon, opens: t(opens), closes: t(closes), minDwell, maxDwell, category, blurb };
};

const places: Place[] = [
  P("gateway", "Gateway of India", 18.922, 72.8347, "06:00", "22:00", 30, 60, "heritage", "Waterfront arch and ferry point."),
  P("csmt_bldg", "CSMT heritage building", 18.9398, 72.8355, "08:00", "20:00", 15, 30, "heritage", "UNESCO Victorian Gothic terminus."),
  P("marine_drive", "Marine Drive promenade", 18.944, 72.823, "06:00", "23:00", 30, 90, "park", "The Queen's Necklace sea-front."),
  P("csmvs", "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", 18.9269, 72.8326, "10:15", "18:00", 60, 120, "museum", "Mumbai's flagship museum."),
  P("colaba", "Colaba Causeway", 18.9215, 72.8305, "10:00", "22:00", 45, 90, "market", "Street shopping and cafés."),
  P("crawford", "Crawford Market", 18.9468, 72.8346, "10:00", "19:00", 30, 60, "market", "Heritage produce & spice market."),
  P("haji_ali", "Haji Ali Dargah", 18.9827, 72.8089, "05:30", "22:00", 30, 60, "temple", "Islet shrine on a causeway."),
  P("mani_bhavan", "Mani Bhavan", 18.9608, 72.8115, "10:00", "17:30", 30, 60, "museum", "Gandhi's Mumbai home."),
  P("dhobi_ghat", "Mahalaxmi Dhobi Ghat", 18.983, 72.825, "07:00", "16:00", 20, 30, "heritage", "Open-air laundry viewpoint."),
  P("siddhivinayak", "Siddhivinayak Temple", 19.017, 72.8302, "06:00", "21:30", 30, 60, "temple", "Famed Ganesh temple, Prabhadevi."),
  P("bandstand", "Bandra Bandstand", 19.0436, 72.819, "06:00", "23:00", 30, 60, "park", "Sea-facing promenade."),
  P("juhu", "Juhu Beach", 19.0988, 72.8265, "06:00", "22:00", 45, 90, "park", "Sunset beach and street food."),
  P("sgnp", "Sanjay Gandhi National Park", 19.229, 72.91, "07:30", "17:30", 90, 180, "park", "Forest park inside the city."),
];

const CSMT = { name: "CSMT Station", lat: 18.9398, lon: 72.8355 };
const MCENTRAL = { name: "Mumbai Central Station", lat: 18.9695, lon: 72.8195 };

export const mumbaiNetwork: Network = {
  id: "mumbai",
  city: "Mumbai",
  presets: [
    { name: "South Mumbai heritage day from CSMT", origin: CSMT, startMin: 540, endMin: 1080, placeIds: ["csmt_bldg", "csmvs", "gateway", "colaba", "marine_drive", "crawford"], pace: "normal" },
    { name: "Sea-front & shrines from Mumbai Central", origin: MCENTRAL, startMin: 600, endMin: 1140, placeIds: ["haji_ali", "siddhivinayak", "bandstand", "juhu"], pace: "relaxed" },
  ],
  timezone: "Asia/Kolkata",
  bbox: [72.75, 18.88, 73.05, 19.3],
  stops: [...stops, ...(best.stops as Stop[])],
  routes: [...buildRoutes(specs), ...(best.routes as RouteDef[])],
  places,
  meta: {
    dataQuality: "synthetic",
    note: "MIXED. Real: BEST bus routes, stops and trip times from the community GTFS croyla/mumbai-gtfs (Aug 2026 snapshot, not official BEST data; weekday service; stop times modelled by the feed author). Synthetic (invented timings): Western/Central locals and Metro Lines 1 and 3. Not for real travel decisions.",
  },
};
