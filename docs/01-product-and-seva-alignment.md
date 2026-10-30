# 01 — Product & Seva First alignment

## The problem

People with a day of work to do — meetings, site visits, bank and government offices, pick-ups, college and shift timings — juggle 3–5 apps (bus, metro, rail, maps), guess how long each trip really takes, and learn a train is late only on the platform. Existing planners answer *"how do I get from A to B?"*. Nobody answers **"I must be at the client at 11:30, the bank before it closes, and a parcel pick-up on the way — when do I leave, what do I board, and what changes when something breaks?"** SafarSetu is built for that: *organising work along the connecting transport, according to your time*; it is equally useful to visitors in a new city.

Public transport in Indian cities also has a trust problem: schedules shift, trains run late, metro/bus services are curtailed. Users who cannot judge that risk fall back to cabs — costlier and more congesting.

## Users

| User | Need |
|------|------|
| Visitor / first-time commuter | A complete, timed day plan; no app juggling |
| Student / low-income commuter | Cheapest reliable option; calm guidance, not alarms |
| Senior / accessibility-sensitive | Less walking, fewer transfers, slack buffers |
| Transport authority (Track B) | Where do delays and missed connections hurt riders most? (insights view) |

## Core capabilities

1. **Route planner with stops** (Google-Maps style) — start, then any number of stops added by search or map click, each with *task*, *time needed*, optional *be there by* and *must-happen* flag; keep your order or let us find the best one. Output: exact leave/board/arrive times, spare time at each stop, and an honest **conflict list** if something cannot work as asked.
2. **Timetable-synchronised routing** — bus, metro, local train and walking, with real transfer waits.
3. **On-time confidence** — Monte-Carlo over delay distributions incl. missed-connection fallbacks → "92 % you make the 10:12 train".
4. **Live re-planning** — delays/cancellations/closures/weather re-time or re-route the *rest of the day*, shrinking low-priority visits first.
5. **Personalised notifications** — tone and content depend on the slack the user actually has.
6. **Authority insights** — aggregated, anonymous reliability and re-plan data.

## Seva First Innovation Challenge 2026 — Maharashtra Zone

> **Correction (verified 2026-10-30):** an earlier version of this file cited the *South Zone* site (`sevafirst.mic.gov.in`, deadline 6 Nov, institution-led, *Surakshit Bharat* theme). **Maharashtra is not in that zone.** The Maharashtra Zone runs on **<https://sevainnovationchallenge.in>** (organised by the Skills, Employment, Entrepreneurship & Innovation Department, Government of Maharashtra, with MSInS).

- **Last date to apply: 30 October 2026** (banner "Application Dates Extended"; no time of day stated). Contact: support@sevainnovationchallenge.in · +91 91377 78135.
- **Who can apply:** individuals, students, teams, researchers, startups, MSMEs — not institution-only. Concept-stage ideas accepted; prototype link optional; no fee; up to 5 team members.
- **Sector:** we apply under **Urban development** (mobility is not a named sector).
- **Prize:** ₹5 crore across 10 sectors; 50 awardees; each eligible for **a work order of up to ₹10 lakh**, subject to evaluation and due diligence (not guaranteed).
- **Submission:** Aadhaar verification; ID upload (≤ 5 MB); **mandatory 6-slide pitch deck** (title & applicant snapshot · problem · solution & innovation · feasibility & implementation · impact & scalability · team & support) — ours is `submission/SafarSetu-Seva-First-Pitch.pdf`, built from the official template.
- **Evaluation:** scrutiny → two independent evaluations (technical, impact) → finalist validation → Grand Jury. The portal showed a "Prototype mode" notice — confirm real submissions are accepted.
- **The guide's judges' lens** ("The First-Time Problem Solver's Guide"): a real problem with evidence · a working demo · fits money the department already spends · a deliverable pilot plan. See [13](13-seva-scorecard.md) and [14](14-pilot-plan.md).

### Judging-criteria map

| Criterion (from official timeline page) | What we show | Evidence artifact |
|---|---|---|
| **Relevance** | Reliable, inclusive public mobility for working people; Urban-development sector; Marathi/Hindi | Sourced problem facts ([research](research/seva-research.md) §A); **primary interviews still to do** ([15](15-field-research-kit.md)) |
| **Originality** | Day-level *time budgeting* + calm, slack-aware alerts (not just routing) | Live demo of the same delay producing "no need to rush" vs "leave now" |
| **Feasibility** | Runs today on open data + free APIs; synthetic only where no feed exists | Working repo; [05](05-data-and-apis.md) |
| **Cost** | ₹0 to demo; production ≈ one small VM + managed Postgres | Cost sketch below |
| **Impact** | Minutes saved, cab trips avoided, missed connections prevented | Impact counters in dashboard (labelled *simulated*) |
| **Scalability** | City = data pack (GTFS + places); engine is city-agnostic | [09](09-production-readiness.md) rollout |
| **Quality of solution** | Typed monorepo, tests, shared core for web+mobile, graceful degradation | Repo |

### Cost sketch (estimates — verify before quoting)

| Item | Demo | Pilot (1 city) |
|---|---|---|
| Maps/tiles/geocoding/weather | ₹0 (OSM, Photon/Nominatim, Open-Meteo) | ≈ ₹0–5k/mo (hosted tiles, self-hosted routing) |
| Backend + DB | ₹0 (local Supabase) | ≈ ₹3–8k/mo |
| Push | ₹0 (SSE/Web Push) | ₹0 (Expo/FCM) |
| Data ingestion upkeep | — | part-time data steward |

## Success metrics

Plan completion rate · median slack at each transfer · % disruptions notified ≥ 10 min before impact · notification dismiss-as-useless rate · cab trips avoided (survey) · for authorities: top-10 unreliable connections.
