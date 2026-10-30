# SafarSetu — Documentation

SafarSetu helps people **organise their work and errands around the connecting public transport available to them**. Like adding stops in a maps app, you enter *where you start*, then *the places you need to be* (a client meeting at 11:30, the bank, a pick-up), how long each takes and when you must be there. SafarSetu lines up the actual bus, metro and train timetables, tells you **when to leave, what to board and how long you have at each stop**, and keeps the plan alive: when a train is late or a metro is cancelled it re-plans and sends a *calm, personalised* alert ("No need to rush — your train is 30 min late, leave at 10:40") instead of a raw delay notice.

> Status: demo covers **Mumbai and Pune** (user-scoped), on **synthetic data** modelled on the real networks (clearly labelled). Visual language: [DESIGN.md](DESIGN.md). Production data and ingestion path are specified in [05](05-data-and-apis.md) and [09](09-production-readiness.md).

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
| 17 | [Security & privacy ops](17-security-privacy-ops.md) | Controls, breach runbook, GIGW/WCAG status |
| 16 | [Agency outreach kit](16-agency-outreach.md) | Data-request letter, MoU terms, who to approach |
| 11 | [Data sources](../DATA_SOURCES.md) | Every dataset/API used, licence, what is real vs synthetic |
| 12 | [Reports & authority portal](12-reports-and-authority.md) | Citizen gap reports, authority login, ranking, roles |
| 14 | [Pilot plan](14-pilot-plan.md) | 4 stages with numbers, owners, finance, measurement |
| 15 | [Field research kit](15-field-research-kit.md) | Interview script + logging for primary evidence |
| R | [Sourced research](research/seva-research.md) | Every fact for the pitch with source, date, confidence |

Also see root: [`progress.md`](../progress.md), [`NEEDED_FROM_YOU.md`](../NEEDED_FROM_YOU.md), earlier research in `Research.md`, `Prototype-Ideas.md`, `safarsetu_product_workflow_spec.md`.

## Glossary

- **Plan** — a full day: ordered visits + the transport legs between them, with exact times.
- **Leg** — one movement: walk, or ride a specific trip (route + departure) from stop A to stop B.
- **Trip** — one scheduled run of a route (e.g. Aqua line, 09:10 from Vanaz).
- **Slack** — spare minutes before something breaks (a missed connection, a closing time).
- **Disruption** — delay, cancellation, closed stop, weather. Stored as events; the engine never edits timetables.
- **Sim clock** — demo-only virtual time so judges can watch a day unfold in minutes.
