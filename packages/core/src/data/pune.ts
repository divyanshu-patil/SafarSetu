import type { Mode, Network, Place, RouteDef, Stop } from "../types";
import { buildRoutes, type RouteSpec } from "../network";
import pmpml from "./pmpml.generated.json";

// MIXED pack. REAL: PMPML buses (community GTFS croyla/pmpml-gtfs, imported by scripts/gtfs; see DATA_SOURCES.md).
// SYNTHETIC: Purple/Aqua metro and the Pune-Lonavala local (shape follows the real lines; coordinates approximate, timings invented).

const S = (id: string, name: string, lat: number, lon: number, mode: Mode) => ({ id, name, lat, lon, mode });

const stops: Stop[] = [
  // Purple line (PCMC - Swargate)
  S("m_pcmc", "PCMC Bhavan", 18.6298, 73.7997, "metro"),
  S("m_sant", "Sant Tukaram Nagar", 18.6196, 73.8045, "metro"),
  S("m_bhosari", "Bhosari (Nashik Phata)", 18.6081, 73.8116, "metro"),
  S("m_kasar", "Kasarwadi", 18.5955, 73.8179, "metro"),
  S("m_phuge", "Phugewadi", 18.5844, 73.8244, "metro"),
  S("m_dapodi", "Dapodi", 18.5779, 73.8322, "metro"),
  S("m_bopodi", "Bopodi", 18.5686, 73.84, "metro"),
  S("m_khadki", "Khadki", 18.56, 73.8465, "metro"),
  S("m_range", "Range Hill", 18.5526, 73.8409, "metro"),
  S("m_shivaji", "Shivajinagar", 18.532, 73.8497, "metro"),
  S("m_civil", "Civil Court", 18.5285, 73.856, "metro"), // interchange
  S("m_budhwar", "Budhwar Peth", 18.518, 73.856, "metro"),
  S("m_mandai", "Mandai", 18.5118, 73.8566, "metro"),
  S("m_swargate", "Swargate", 18.5016, 73.858, "metro"),
  // Aqua line (Vanaz - Ramwadi)
  S("m_vanaz", "Vanaz", 18.5075, 73.805, "metro"),
  S("m_anand", "Anand Nagar", 18.509, 73.814, "metro"),
  S("m_ideal", "Ideal Colony", 18.5072, 73.8225, "metro"),
  S("m_nal", "Nal Stop", 18.5083, 73.8312, "metro"),
  S("m_garware", "Garware College", 18.511, 73.8395, "metro"),
  S("m_deccan", "Deccan Gymkhana", 18.516, 73.842, "metro"),
  S("m_sambhaji", "Chh. Sambhaji Udyan", 18.519, 73.845, "metro"),
  S("m_pmc", "PMC", 18.5228, 73.853, "metro"),
  S("m_mangalwar", "Mangalwar Peth", 18.53, 73.861, "metro"),
  S("m_railway", "Pune Railway Station (Metro)", 18.5292, 73.8738, "metro"),
  S("m_ruby", "Ruby Hall Clinic", 18.533, 73.879, "metro"),
  S("m_bund", "Bund Garden", 18.5385, 73.883, "metro"),
  S("m_yerawada", "Yerawada", 18.55, 73.887, "metro"),
  S("m_kalyani", "Kalyani Nagar", 18.5465, 73.9025, "metro"),
  S("m_ramwadi", "Ramwadi", 18.547, 73.915, "metro"),
  // Local train (Pune - Lonavala)
  S("t_pune", "Pune Junction", 18.5285, 73.8742, "train"),
  S("t_shivaji", "Shivajinagar Stn", 18.5308, 73.8475, "train"),
  S("t_khadki", "Khadki Stn", 18.5612, 73.8478, "train"),
  S("t_dapodi", "Dapodi Stn", 18.576, 73.834, "train"),
  S("t_pimpri", "Pimpri Stn", 18.62, 73.8, "train"),
  S("t_chinchwad", "Chinchwad Stn", 18.6431, 73.7894, "train"),
  S("t_akurdi", "Akurdi Stn", 18.6518, 73.7703, "train"),
  S("t_dehu", "Dehu Road", 18.6781, 73.7393, "train"),
  S("t_talegaon", "Talegaon", 18.7339, 73.6772, "train"),
  S("t_lonavala", "Lonavala", 18.7509, 73.4066, "train"),
];

const peak: [number, number, number][] = [
  [360, 480, 15],
  [480, 660, 10],
  [660, 1020, 15],
  [1020, 1200, 10],
  [1200, 1320, 15],
];
const specs: RouteSpec[] = [
  {
    id: "purple",
    mode: "metro",
    name: "Purple Line",
    color: "#7c3aed",
    stops: ["m_pcmc", "m_sant", "m_bhosari", "m_kasar", "m_phuge", "m_dapodi", "m_bopodi", "m_khadki", "m_range", "m_shivaji", "m_civil", "m_budhwar", "m_mandai", "m_swargate"],
    gap: 3,
    headways: peak,
    both: true,
  },
  {
    id: "aqua",
    mode: "metro",
    name: "Aqua Line",
    color: "#0891b2",
    stops: ["m_vanaz", "m_anand", "m_ideal", "m_nal", "m_garware", "m_deccan", "m_sambhaji", "m_pmc", "m_civil", "m_mangalwar", "m_railway", "m_ruby", "m_bund", "m_yerawada", "m_kalyani", "m_ramwadi"],
    gap: 3,
    headways: peak,
    both: true,
  },
  {
    id: "local",
    mode: "train",
    name: "Pune–Lonavala Local",
    color: "#dc2626",
    stops: ["t_pune", "t_shivaji", "t_khadki", "t_dapodi", "t_pimpri", "t_chinchwad", "t_akurdi", "t_dehu", "t_talegaon", "t_lonavala"],
    gap: [5, 6, 5, 8, 4, 3, 9, 10, 18],
    times: [365, 450, 530, 610, 690, 770, 855, 940, 1025, 1105, 1190, 1275],
    timesReverse: [330, 420, 500, 580, 660, 740, 825, 910, 995, 1075, 1160, 1245],
    both: true,
  },
];

const P = (
  id: string,
  name: string,
  lat: number,
  lon: number,
  opens: string,
  closes: string,
  minDwell: number,
  maxDwell: number,
  category: string,
  blurb: string,
): Place => {
  const t = (s: string) => Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]);
  return { id, name, lat, lon, opens: t(opens), closes: t(closes), minDwell, maxDwell, category, blurb };
};

const places: Place[] = [
  P("shaniwar_wada", "Shaniwar Wada", 18.5195, 73.8553, "08:00", "18:00", 45, 90, "heritage", "18th-century Peshwa fort palace."),
  P("dagdusheth", "Dagdusheth Halwai Ganpati", 18.5164, 73.8561, "06:00", "21:30", 20, 45, "temple", "Pune's most visited Ganesh temple."),
  P("kelkar", "Raja Dinkar Kelkar Museum", 18.5105, 73.8545, "09:30", "17:30", 45, 90, "museum", "Collections of Indian everyday and decorative arts."),
  P("tulshibaug", "Tulshibaug Market", 18.5115, 73.857, "09:00", "20:30", 25, 60, "market", "Bustling old-city shopping lane."),
  P("pataleshwar", "Pataleshwar Cave Temple", 18.529, 73.849, "08:00", "17:00", 20, 40, "heritage", "8th-century rock-cut shrine."),
  P("fc_road", "FC Road cafés", 18.524, 73.841, "10:00", "22:00", 45, 120, "food", "Student-district cafés and street food."),
  P("sp_univ", "Pune University main building", 18.553, 73.825, "09:00", "17:00", 30, 60, "heritage", "Colonial-era Gothic campus."),
  P("bund_garden", "Bund Garden", 18.536, 73.883, "06:00", "19:00", 30, 60, "park", "Riverside promenade."),
  P("osho", "Osho Teerth Park", 18.539, 73.893, "06:00", "18:00", 30, 60, "park", "Quiet Koregaon Park garden."),
  P("aga_khan", "Aga Khan Palace", 18.5524, 73.901, "09:00", "17:30", 45, 90, "heritage", "Gandhi memorial and museum."),
  P("parvati", "Parvati Hill Temple", 18.4966, 73.8423, "05:00", "20:00", 45, 90, "temple", "Hilltop temples with city views."),
  P("mandai", "Mahatma Phule Mandai", 18.5113, 73.8564, "07:00", "20:00", 30, 60, "market", "Century-old produce market."),
  P("lonavala_market", "Lonavala market & chikki", 18.75, 73.409, "09:00", "20:00", 45, 120, "food", "Day-trip by local train."),
];


export const PUNE_JN = { name: "Pune Junction", lat: 18.5285, lon: 73.8742 };

export const puneNetwork: Network = {
  id: "pune",
  city: "Pune",
  presets: [
    { name: "Heritage day from Pune Junction", origin: PUNE_JN, startMin: 540, endMin: 1080, placeIds: ["shaniwar_wada", "dagdusheth", "kelkar", "aga_khan", "parvati"], pace: "normal" },
    { name: "Lonavala day trip by local train", origin: PUNE_JN, startMin: 450, endMin: 1140, placeIds: ["lonavala_market", "shaniwar_wada"], pace: "relaxed" },
  ],
  timezone: "Asia/Kolkata",
  bbox: [73.3, 18.4, 74.0, 18.8],
  stops: [...stops, ...(pmpml.stops as Stop[])],
  routes: [...buildRoutes(specs), ...(pmpml.routes as RouteDef[])],
  places,
  meta: {
    dataQuality: "synthetic",
    note: "MIXED. Real: PMPML bus routes, stops and trip times from the community GTFS croyla/pmpml-gtfs (weekday service, ~10k trips; start times from the PMPML API, in-between stop times modelled by the feed author at ~20 km/h). Synthetic (invented timings): Purple/Aqua metro and the Pune-Lonavala local. Not for real travel decisions.",
  },
};

