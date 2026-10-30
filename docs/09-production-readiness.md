# 09 — Production readiness

## Handling timing changes, delays and cancellations

| Event | Detection | System behaviour | User sees |
|---|---|---|---|
| **Timetable change** (new schedule effective date) | New GTFS/timetable version imported with `valid_from` | Versioned network; plans store `network_version`; nightly job re-validates future plans, replans those whose trips changed | "Metro timings changed for Sunday — your plan was updated" |
| **Delay** | Operator/GTFS-RT/rail status | Overlay on trip; assess: absorbed → adjust → replan | Calm "no need to rush" when slack allows, otherwise action-first |
| **Cancellation** | Operator alert / GTFS-RT `CANCELED` | Trip removed from search; next trip or alternative mode chosen; cab fallback if none | "Take the 09:20 instead — leave in 4 min" |
| **Stop/line closure** | Alert | Stop excluded; footpath detour computed | "Walk 4 min to Garware College" |
| **Early running** | Live status | Treated as *non-negative* — never plan to board a train earlier than scheduled; warn "arrive 5 min early" | "Be at the platform by 10:05" |
| **Stale/contradictory data** | `observedAt` age > TTL; two sources disagree | Fall back to *scheduled*, lower confidence label; higher-trust source wins | "Live status unavailable — showing timetable" |
| **Feed outage** | Poll health check | Banner + degrade to schedule; alert ops | Label change only |

Design guarantees: assessment is pure and idempotent; notifications supersede rather than stack; every revision is stored (`plan_revisions`) so any alert is explainable.

## Reliability learning
Log realised vs scheduled per route/stop/hour → fit delay distributions → replace assumed Monte-Carlo profiles → confidence becomes empirical. Also feeds the authority insights.

## Scale & performance
- Engine is stateless; scale API horizontally. Network cached in memory per instance; invalidated by version.
- Notification scheduler: DB poll `fire_at` with `FOR UPDATE SKIP LOCKED` (safe for many instances) → pgmq/Redis queue when volume grows.
- Disruption fan-out: index plans by (date, route_ids[]) so an event touches only affected plans.
- Large networks: OpenTripPlanner / transfer patterns behind the same `Itinerary` type.

## Security & privacy (DPDP Act 2023 aligned)
- Guest-first; minimal PII (name optional). Location only while a trip is active, consented, deletable.
- RLS per user; service key server-side only; ingest endpoint keyed.
- Rate-limit proxies; respect upstream usage policies (Nominatim 1 rps, cache).
- Authority insights are aggregated, k-anonymised (≥ 20 trips per cell).
- Notifications never include precise live location.

## Observability
Structured logs (pino), request ids, metrics: plans/min, replans, alert latency (event → delivered), feed freshness, geocode cache hit-rate. SLO: **disruption → alert ≤ 30 s** for affected active plans.

## Testing
Unit (core: routing, planner, assess, composer) · API integration (supertest-style via `fetch`) · scenario replay (recorded disruption days) · accessibility lint on web.

## Rollout
1. **Pilot:** one city, one corridor (e.g. Aqua + feeder), 50 tourists/students, operator manual alerts.
2. **City:** full GTFS, GTFS-RT where available, WhatsApp/SMS fallback.
3. **Multi-city:** data-pack per city; state transport departments as Track-B partners; open data contribution back to operators.

## Risks
| Risk | Mitigation |
|---|---|
| No live feed for metro/rail | Scheduled mode + honest labels; operator console; crowd confirmations |
| Wrong data harms trust | Confidence labels, freshness stamps, "report issue" loop |
| Free-API fair-use limits | Proxy cache; self-host path documented |
| Notification fatigue | Slack-based tone, suppression rules, quiet hours |

## Live data reality check (round 2)
No public GTFS-Realtime feed or open live API exists for PMPML, BEST, Maha-Metro, MMRDA or Indian Railways (searched 2026-10-30). The timetables we use are static community GTFS. **Path:** a written data-sharing agreement with each agency ([16](16-agency-outreach.md)); until then delays are simulated and labelled. The ingestion endpoint (`POST /v1/disruptions`, keyed) is the integration seam.

## DPDP checklist status (prototype)
Minimal collection ✔ (areas, category, text; no device location) · notice before collection ✔ (`/privacy`, report form) · explicit unticked consent ✔ · anonymity (hashed id, no contact data) ✔ · under-18 note ✔ (guardian consent required in any pilot) · grievance contact ✘ placeholder · retention job ✘ (12 months planned) · audit log ✘ · breach runbook ✘ · processor terms ✘ · lawyer review ✘.
