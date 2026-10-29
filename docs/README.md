# SafarSetu — Documentation

SafarSetu is a **time-synchronised trip planner for a new city**. A visitor enters *where they start*, *which places they want to see* and *when they are free*. SafarSetu builds a day plan across buses, metro and local trains using the actual timetables, tells them **when to leave, how long to stay, what to board**, and keeps the plan alive: when a train is late or a metro is cancelled it re-plans and sends a *calm, personalised* alert ("No need to rush — your train is 30 min late, leave at 10:40") instead of a raw delay notice.

> Status: demo runs on **synthetic Pune data** (clearly labelled). Production data and ingestion path are specified in [05](05-data-and-apis.md) and [09](09-production-readiness.md).

## Read in this order

| # | Doc | Answers |
|---|-----|---------|
| 01 | [Product & SEVA alignment](01-product-and-seva-alignment.md) | Why this wins the Seva First challenge; judging-criteria map |
| 02 | [Architecture](02-architecture.md) | Monorepo layout, packages, data flow, what mobile reuses |
| 03 | [Planning engine](03-planning-engine.md) | Timetable routing, day planner, dwell time, on-time probability |
| 04 | [Real-time & notifications](04-realtime-and-notifications.md) | Delays, cancellations, re-plan, personalised alert policy |
| 05 | [Data & free APIs](05-data-and-apis.md) | What we use, why, usage limits, synthetic-data spec |
| 06 | [API reference](06-api-reference.md) | Express endpoints |
| 07 | [Database](07-database.md) | Supabase schema, local setup |
| 08 | [Web dashboard & mobile reuse](08-clients.md) | Screens, UX rules, how the Expo app plugs in |
| 09 | [Production readiness](09-production-readiness.md) | Timing changes, cancellations, scale, privacy, rollout |
| 10 | [Demo script & judge Q&A](10-demo-and-qa.md) | 5-minute demo, likely questions |

Also see root: [`progress.md`](../progress.md), [`NEEDED_FROM_YOU.md`](../NEEDED_FROM_YOU.md), earlier research in `Research.md`, `Prototype-Ideas.md`, `safarsetu_product_workflow_spec.md`.

## Glossary

- **Plan** — a full day: ordered visits + the transport legs between them, with exact times.
- **Leg** — one movement: walk, or ride a specific trip (route + departure) from stop A to stop B.
- **Trip** — one scheduled run of a route (e.g. Aqua line, 09:10 from Vanaz).
- **Slack** — spare minutes before something breaks (a missed connection, a closing time).
- **Disruption** — delay, cancellation, closed stop, weather. Stored as events; the engine never edits timetables.
- **Sim clock** — demo-only virtual time so judges can watch a day unfold in minutes.
