# 12 — Citizen reports & the authority portal

Implements the flow in `safarsetu_product_workflow_spec.md` §7 (reporting) and §8–13 (authority portal), scoped to what a prototype can do honestly.

## Citizen: report a connectivity gap (`/report`)

1. **Category** — 10 plain-language categories (no feeder, too infrequent, poorly timed transfer, long wait, hard to reach on foot, blocked footpath, accessibility, incorrect info, missing info, other). Each has an icon + colour (`CATEGORIES` in `@repo/core`).
2. **The gap** — *from* area and optional *to* area (search or pick on the map). A report is about two places that should be connected.
3. **Details** — mode, severity (minor / real problem / serious), usual time, free text (≤ 600 chars, no personal details).
4. **Receipt** — reference `SS-YYYY-NNNNN`, the honest promise text (`PROMISE`), a status stepper. **Track** at `/report/{ref}`.

Privacy: no name, phone, or device location is stored; the reporter is an opaque hash of the anonymous user id (used only to count *independent* reporters). 10 reports/hour/user. Staff-only fields (`internalNotes`, `reporter`, `assignee`) are stripped by `toPublic()` and verified by tests.

Statuses: Received → Under review / More info needed → Referred → Action planned → Resolved / Closed. The UI never implies an officer is assigned unless a status says so.

## Authority portal (`/authority`)

| Screen | Purpose |
|---|---|
| Sign in (`/authority/login`) | Email + password → HMAC-signed 12 h token. Demo accounts (see below) |
| Overview | KPIs (open, awaiting review, stale > 7 d, resolved), 30-day trend, categories, case status, **map** of problem locations + dashed lines for each unconnected pair |
| Ranked connectivity gaps | Suggested issue groups. **Weights are adjustable** (volume, independent reporters, severity, recency) and each row shows every factor and raw value — no opaque score |
| Citizen reports | Inbox with search / status / category / region filters, detail panel, status change, public note, internal notes |
| Data & coverage | Networks behind the findings with data quality (`synthetic` / `scheduled` / `live`) — see `DATA_SOURCES.md` |

### Roles and jurisdiction

| Role | Can see | Can do |
|---|---|---|
| supervisor | all regions (`*`) | read, change status, public note, assign, internal notes |
| officer | own regions | same as supervisor within jurisdiction |
| analyst | own regions | read + internal notes only (403 on status / public note) |

Jurisdiction = **region ids** (`mumbai`, `pune`, `nashik`, `nagpur`, `aurangabad`, `kolhapur`, `solapur`, `amravati`, `maharashtra-other`), derived from the report's coordinates (`regionOf` in core). Every authority query is filtered by it.

### Grouping (`clusterReports`)

Reports with the same category and the same ~2 km cells for *from* and *to* form a suggested group (location-only reports group by location cell). Groups are **suggestions for a human**; individual reports always stay traceable. Score = Σ weight × factor, factors normalised 0–1:
`volume = min(n/10,1)`, `unique = min(reporters/6,1)`, `severity = avg/3`, `recency = share in last 14 days`.

### Auth in the prototype vs production

Prototype: accounts in `apps/api/src/demo-users.ts` (scrypt-hashed in memory; shown on the login page only while `AUTH_DEMO_HINT≠false` and not in production), tokens signed with `AUTH_SECRET`. **Production:** Supabase Auth or the agency's SSO; role + `cities` carried as JWT `app_metadata`; RLS on `reports` by jurisdiction (policy sketched in `0002_reports.sql`); audit log of status changes; MFA.

## API

Public: `POST /v1/reports`, `GET /v1/reports/track/:ref`, `GET /v1/reports/mine`.
Auth: `POST /v1/auth/login`, `GET /v1/auth/me`, `GET /v1/auth/demo` (demo only).
Authority (Bearer): `GET /v1/authority/overview`, `GET /v1/authority/issues?wVolume&wUnique&wSeverity&wRecency`, `GET /v1/authority/reports?status&category&city&q`, `GET|PATCH /v1/authority/reports/:id`.

## Not built yet (roadmap)

Photo attachments · report from a journey leg · duplicate merge UI with human-confirmed issue groups · scenario planner · action tracker with owners and due dates · report export (PDF/CSV) · email/SMS replies · SSO.
