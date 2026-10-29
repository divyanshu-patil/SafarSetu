# 01 — Product & Seva First alignment

## The problem

A visitor in an unfamiliar city juggles 3–5 apps (bus, metro, rail, maps, weather), guesses how long each place deserves, and has no idea a train is late until they are on the platform. Existing planners answer *"how do I get from A to B?"*. Nobody answers **"I have 9 hours and 5 places — what should I do, in what order, when do I leave, and what changes when something breaks?"**

Public transport in Indian cities also has a trust problem: schedules shift, trains run late, metro/bus services are curtailed. Users who cannot judge that risk fall back to cabs — costlier and more congesting.

## Users

| User | Need |
|------|------|
| Visitor / first-time commuter | A complete, timed day plan; no app juggling |
| Student / low-income commuter | Cheapest reliable option; calm guidance, not alarms |
| Senior / accessibility-sensitive | Less walking, fewer transfers, slack buffers |
| Transport authority (Track B) | Where do delays and missed connections hurt riders most? (insights view) |

## Core capabilities

1. **Day planner** — origin, window (start/end), places (priority, min/max dwell, opening hours) → ordered itinerary, exact leave/board/arrive times, *how long to spend* at each place.
2. **Timetable-synchronised routing** — bus, metro, local train and walking, with real transfer waits.
3. **On-time confidence** — Monte-Carlo over delay distributions incl. missed-connection fallbacks → "92 % you make the 10:12 train".
4. **Live re-planning** — delays/cancellations/closures/weather re-time or re-route the *rest of the day*, shrinking low-priority visits first.
5. **Personalised notifications** — tone and content depend on the slack the user actually has.
6. **Authority insights** — aggregated, anonymous reliability and re-plan data.

## Seva First Innovation Challenge 2026

Source: <https://sevafirst.mic.gov.in/> (Ministry of Education; AICTE, UGC; IISc nodal). Details last read 2026-10-30.

- **Theme:** *Surakshit Bharat* — manufacturing, **mobility and infrastructure**, safety, digital public infrastructure.
- **Tracks:** A (product/technology) and B (business model/governance) — entries may combine. We enter **A + B**: the planner (A) and the authority insights/delay-data governance model (B).
- **Level:** *Open* (undergraduate+): "a demonstrated prototype or pilot with a credible pathway to deployment" — so the working demo + production path matter more than slides.
- **Process:** zonal screening by NITs → mentoring/field validation → IISc final. Prizes ₹10 L / 5 L / 3 L per theme per category.
- **Deadline:** official site says **6 Nov 2026**; the Ministry's post says 24 Oct. **Confirm** (see `NEEDED_FROM_YOU.md`). Registration is **institution-led** — a college coordinator must nominate us.

### Judging-criteria map

| Criterion (from official timeline page) | What we show | Evidence artifact |
|---|---|---|
| **Relevance** | Safe, reliable public mobility for visitors/commuters; reduces cab dependence | Problem framing above; Research.md field evidence |
| **Originality** | Day-level *time budgeting* + calm, slack-aware alerts (not just routing) | Live demo of the same delay producing "no need to rush" vs "leave now" |
| **Feasibility** | Runs today on open data + free APIs; synthetic only where no feed exists | Working repo; [05](05-data-and-apis.md) |
| **Cost** | ₹0 to demo; production ≈ one small VM + managed Postgres | Cost sketch below |
| **Impact** | Minutes saved, cab trips avoided, missed connections prevented | Impact counters in dashboard (labelled *simulated*) |
| **Scalability** | City = data pack (GTFS + places); engine is city-agnostic | [09](09-production-readiness.md) rollout |
| **Quality of solution** | Typed monorepo, tests, shared core for web+mobile, graceful degradation | Repo, `progress.md` |

### Cost sketch (estimates — verify before quoting)

| Item | Demo | Pilot (1 city) |
|---|---|---|
| Maps/tiles/geocoding/weather | ₹0 (OSM, Photon/Nominatim, Open-Meteo) | ≈ ₹0–5k/mo (hosted tiles, self-hosted routing) |
| Backend + DB | ₹0 (local Supabase) | ≈ ₹3–8k/mo |
| Push | ₹0 (SSE/Web Push) | ₹0 (Expo/FCM) |
| Data ingestion upkeep | — | part-time data steward |

## Success metrics

Plan completion rate · median slack at each transfer · % disruptions notified ≥ 10 min before impact · notification dismiss-as-useless rate · cab trips avoided (survey) · for authorities: top-10 unreliable connections.
