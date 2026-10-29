// All times are minutes since midnight (service day) unless named otherwise.

export type Mode = "metro" | "train" | "bus";
/** things a rider can switch off: a mode, a kind of train, or the cab fallback */
export type Avoid = Mode | "local" | "express" | "cab";
export type Pace = "gentle" | "relaxed" | "normal" | "fast";
export type Lang = "en" | "hi" | "mr";

export interface LatLon {
  lat: number;
  lon: number;
}
export interface Pt extends LatLon {
  name?: string;
}

export interface Stop extends LatLon {
  id: string;
  name: string;
  mode: Mode;
}

export interface RouteDef {
  id: string;
  mode: Mode;
  name: string;
  color: string;
  stopIds: string[];
  /** minutes from trip start at each stop (same length as stopIds) */
  offsets: number[];
  /** trip start times at first stop, sorted */
  departures: number[];
}

export interface Place extends LatLon {
  id: string;
  name: string;
  opens: number;
  closes: number;
  minDwell: number;
  maxDwell: number;
  category: string;
  blurb?: string;
  /** city/town the place belongs to, used to group places in the UI */
  area?: string;
}

export interface Preset {
  name: string;
  origin: Pt & { name: string };
  startMin: number;
  endMin: number;
  placeIds: string[];
  pace: Pace;
}

export interface Network {
  /** slug: "pune" | "mumbai" */
  id: string;
  city: string;
  /** one-click demo days and typical arrival points */
  presets: Preset[];
  timezone: string;
  bbox: [number, number, number, number]; // west, south, east, north
  stops: Stop[];
  routes: RouteDef[];
  places: Place[];
  meta: { dataQuality: "synthetic" | "scheduled" | "live"; note: string };
}

// ---- Itineraries ----------------------------------------------------------

export interface WalkLeg {
  kind: "walk";
  from: Pt;
  to: Pt;
  departMin: number;
  arriveMin: number;
  distM: number;
}
export interface StopTime {
  stopId: string;
  name: string;
  lat: number;
  lon: number;
  min: number;
}
export interface TransitLeg {
  kind: "transit";
  mode: Mode;
  routeId: string;
  routeName: string;
  color: string;
  headsign: string;
  /** trip id = route + first-stop departure */
  tripDeparture: number;
  from: StopTime;
  to: StopTime;
  departMin: number;
  arriveMin: number;
  scheduledDepartMin: number;
  delayMin: number;
  stops: StopTime[];
  fare: number;
}
export interface CabLeg {
  kind: "cab";
  from: Pt;
  to: Pt;
  departMin: number;
  arriveMin: number;
  distM: number;
  fare: number;
}
export type Leg = WalkLeg | TransitLeg | CabLeg;

export interface Itinerary {
  legs: Leg[];
  departMin: number;
  arriveMin: number;
  walkM: number;
  transfers: number;
  fare: number;
}

export interface Confidence {
  pOnTime: number; // 0..1, whole itinerary reaches destination within tolerance
  p90ArriveMin: number;
  riskiest?: { legIndex: number; p: number; label: string };
}

// ---- Plan -----------------------------------------------------------------

export interface PlaceInput {
  placeId?: string;
  name?: string;
  lat?: number;
  lon?: number;
  priority?: 1 | 2 | 3;
  minDwell?: number;
  maxDwell?: number;
  opens?: number;
  closes?: number;
  /** appointment: be there no later than this (minutes since midnight). We leave later, not earlier, when possible. */
  arriveBy?: number;
  /** what you are doing there ("Client meeting", "Bank") */
  task?: string;
  /** never dropped; if it cannot be met the plan reports a conflict instead */
  required?: boolean;
}

export interface Prefs {
  pace?: Pace;
  maxWalkM?: number;
  avoid?: Avoid[];
  style?: "calm" | "brief";
  /** language of reminders and alerts */
  lang?: Lang;
}

export interface PlanRequest {
  city?: string;
  date: string; // YYYY-MM-DD
  origin: Pt & { name: string };
  startMin: number;
  endMin: number;
  returnToOrigin?: boolean;
  /** visit stops in the given order (Google-Maps style). Default false = best order. */
  keepOrder?: boolean;
  places: PlaceInput[];
  prefs?: Prefs;
  traveller?: { name?: string };
}

export interface PlaceRef {
  key: string;
  name: string;
  lat: number;
  lon: number;
  task?: string;
}
export interface Move {
  kind: "move";
  from: Pt;
  to: Pt;
  itinerary: Itinerary;
  departMin: number;
  arriveMin: number;
  confidence?: Confidence;
}
export interface Visit {
  kind: "visit";
  place: PlaceRef;
  arriveMin: number;
  startMin: number;
  leaveMin: number;
  dwellMin: number;
  waitMin: number;
  priority: 1 | 2 | 3;
  minDwell: number;
  maxDwell: number;
  opens: number;
  closes: number;
  arriveBy?: number;
  required?: boolean;
}
export type Entry = Move | Visit;

export interface Reminder {
  atMin: number;
  kind: "prepare" | "leave" | "board" | "wrapup";
  title: string;
  body: string;
  entryIndex: number;
}

export interface Plan {
  revision: number;
  request: PlanRequest;
  timeline: Entry[];
  dropped: { name: string; reason: string }[];
  /** stops that cannot be done as asked (deadline missed, closed) — shown, never hidden */
  conflicts?: { name: string; reason: string }[];
  /** things worth knowing but not blocking (e.g. a long walk after dark) */
  warnings?: { kind: "dark_walk"; text: string }[];
  totals: { walkM: number; fare: number; transfers: number; confidencePct: number; riskiest?: string };
  reminders: Reminder[];
  changes: string[];
  generatedAtMin: number;
  meta: { dataQuality: Network["meta"]["dataQuality"]; note: string };
}

// ---- Live -----------------------------------------------------------------

export interface Disruption {
  id: string;
  type: "delay" | "cancellation" | "stop_closed" | "weather";
  routeId?: string;
  /** specific trip (first-stop departure). Omitted = every trip departing in [fromMin, untilMin]. */
  tripDeparture?: number;
  stopId?: string;
  delayMin?: number;
  fromMin: number;
  untilMin: number;
  source: "operator" | "gtfs-rt" | "crowd" | "simulator";
  verified?: boolean;
  note?: string;
}

export interface LiveState {
  delay(routeId: string, tripDeparture: number): number;
  cancelled(routeId: string, tripDeparture: number): boolean;
  closed(stopId: string, atMin: number): boolean;
  rain: boolean;
  maxDelay: number;
  disruptions: Disruption[];
}

// ---- Alerts ---------------------------------------------------------------

export type AlertKind = "relax" | "adjust" | "replan" | "urgent" | "heads_up";

export interface ChangeSummary {
  reason: "delay" | "cancellation" | "closure" | "weather" | "mixed";
  routeName?: string;
  stopName?: string;
  delayMin?: number;
  oldBoardMin?: number;
  beforeLeave: boolean;
  nowMin: number;
  oldLeaveMin?: number;
  newLeaveMin?: number;
  nextBoard?: { routeName: string; stopName: string; departMin: number };
  /** replacement when no vehicle is available, e.g. "Take a cab (about ₹120, 18 min)" */
  altText?: string;
  alt?: { kind: "cab" | "walk"; mins: number; fare?: number; to?: string };
  nextPlace?: string;
  newArriveMin?: number;
  slackMin: number;
  dwellLost: { name: string; mins: number }[];
  dropped: string[];
}

export interface Alert {
  kind: AlertKind;
  title: string;
  body: string;
}
