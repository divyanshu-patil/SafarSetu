# 03 — Planning engine (`@repo/core`)

## Network model

```ts
Stop   { id, name, lat, lon, mode }                 // mode: metro | train | bus
Route  { id, mode, name, color, stopIds[], offsets[] /*min from trip start*/,
         departures[] /*min since midnight at first stop*/, fare }
Place  { id, name, lat, lon, opens, closes, minDwell, maxDwell, category }
```

A **trip** is `(routeId, departureIndex)`. Times at stop *i* = `departures[d] + offsets[i]`. Headway services are expanded into `departures[]` at load time (peak/off-peak headways); trains carry explicit timetables. Transfers between stops are *implicit footpaths*: any two stops within 400 m are walkable (80 m/min, configurable by pace), plus explicit interchanges (e.g. metro Civil Court is one stop shared by two lines).

## Routing — earliest arrival, round-based (RAPTOR-style)

Origin/destination are arbitrary coordinates.

1. **Access:** walk from origin to stops within `maxWalkM` (default 1200 m) → initial arrival times.
2. **Rounds k = 1..4** (k = number of vehicles): for every route, scan stops in order; at each stop find the *earliest non-cancelled trip* with `effectiveDeparture ≥ arrival + boardBuffer`; ride forward improving arrivals. Then relax footpaths.
3. **Egress:** walk to destination; keep the best arrival per round → a Pareto set (time vs transfers).
4. **Reconstruct** legs via parent pointers: `walk | transit` legs with exact times, boarding/alighting stop, intermediate stops, fare.
5. **Cab fallback** (`distance × rate`) always computed as an alternative and as the escape hatch when transit is impossible.

`effectiveDeparture = scheduled + liveDelay(trip)`; cancelled trips and closed stops are skipped. That single seam is how disruptions affect routing (see [04](04-realtime-and-notifications.md)).

**Depart-at** = one search. **Arrive-by** = scan candidate departures backward in 5-min then 1-min steps until the *latest* departure that still arrives ≤ deadline → this is the "leave by" time. Cost: tens of searches over ~100 stops — milliseconds.

## Day planner — `planDay(network, request, live)`

Input: origin, `date`, `startMin`, `endMin`, `returnToOrigin`, places `[ {placeId | custom coords, priority 1–3, minDwell, maxDwell, opens, closes} ]`, preferences (`pace`, `maxWalkM`, `avoid` modes, `budget`).

1. **Order** — greedy insertion on static travel estimates, then 2-opt improvement (≤ 8–10 places; exact search is unnecessary at this size).
2. **Simulate** the order with the *real time-dependent router*: leave → arrive → wait if before opening → stay `minDwell` → next. Reject if arrival > closing − minDwell or the day overruns `endMin`.
3. **Drop** — if infeasible, remove the lowest-priority place (ties: biggest detour) and retry; dropped places are returned with a reason.
4. **Allocate time** — leftover slack is handed out in 10-minute increments, weighted by priority, up to `maxDwell`, re-simulating each time (because adding dwell shifts every later connection onto different trips; the allocator only accepts a step that keeps the plan feasible *and* keeps a configurable buffer per transfer).
5. **Emit** a timeline: `[leg, visit, leg, visit … , leg home]`, plus **reminders** derived from it: `prepare` (T–30), `leave` (T–10), `board` (at stop), `visit_ending` (T–10).

Pace presets: relaxed (walk 60 m/min, +5 min buffer), normal (80, +3), fast (95, +1).

## On-time confidence — `confidence(itinerary, deadline)`

Monte-Carlo, N = 500, seeded (deterministic for tests/UI). Per sample:
- each transit trip gets a delay from its **mode profile** (metro: 90 % on time, else exp(μ=3 min); bus: skewed normal σ≈4 min; local train: 55 % on time, else exp(μ=12 min));
- walking speed jitter ±15 %;
- **if the sampled arrival at a boarding stop is later than that trip's (delayed) departure, the rider takes the *next* departure of the same route** (missed connection modelled with real headways), which is what makes tight transfers visibly risky.

Output: `{ pOnTime, p50Arrival, p90Arrival, riskiestTransfer }`. The planner uses it to (a) pick *which* itinerary to show as recommended, and (b) propose a **buffer**: "leave 8 min earlier → 95 %". Profiles are config, to be replaced by learned per-route/hour distributions from stored realised delays ([09](09-production-readiness.md)).

## Complexity & limits

~100 stops, ~12 routes, ~1 000 trips/day → one search < 5 ms. 10 places → ≤ ~600 searches (cached on 5-min buckets). Ceiling: city-scale GTFS (10⁴ stops) should move to precomputed transfer patterns / OpenTripPlanner; the `Network` and `Itinerary` types stay the same.

## Testing

`node:test` unit tests on a tiny fixture and on the Pune pack: arrive-by gives latest feasible departure; cancelled trip forces next trip; missed connection raises risk; planner drops low-priority place when overbooked; dwell allocation never breaks feasibility.
