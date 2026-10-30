# 17 — Security, privacy operations and standards status

Honest status for a government evaluator ("Security?" is one of the hard questions in [10](10-demo-and-qa.md)). **No external audit has been done.**

## What exists today
| Area | Control | Where |
|---|---|---|
| Authentication | Email + password (scrypt), HMAC-signed 12 h token; demo accounts only in non-production; production needs `AUTH_SECRET` and real identities/SSO | `apps/api/src/auth.ts` |
| Brute force | 5 failed sign-ins per (IP, email) per 15 min → 429 | `auth.ts`, tested |
| Authorisation | Roles (supervisor/officer/analyst) and region jurisdiction enforced on every authority query; analyst cannot change status (403) | `reports-routes.ts`, tested |
| Audit trail | Every status / public-note / assignee change is appended as an `AUDIT` entry (who, role, what, when) | `reports-routes.ts`, tested |
| Privacy by design | Reports carry no name/phone/device location; reporter = one-way hash; staff-only fields never returned publicly | `core/reports.ts`, tested |
| Retention | Real (non-synthetic) reports deleted after `REPORT_RETENTION_DAYS` (default 365), daily | `server.ts`, tested |
| Input validation | zod on every body; malformed JSON → 400; CSV export neutralises spreadsheet formulas | `app.ts`, tested |
| Headers | API: nosniff, no-referrer, DENY framing, no-store on authority routes, HSTS in production. Web: CSP (tight sources), nosniff, referrer and permissions policies | `app.ts`, `apps/web/next.config.js` |
| Rate limiting | Reports 10/hour/user, feedback 200/device, login throttle | routes |
| Secrets | `.env` git-ignored; service-role key server-side only | `.env.example` |

## Round-4 security review (found by reading our own routes)
| Finding | Fix |
|---|---|
| `GET /v1/plans?userId=` listed any user's plans | the query parameter is ignored; only the caller's own plans |
| Report references were sequential, so anyone could read others' public tracking data | references now carry 4 random characters; the sequence number alone returns 404 |
| `POST /v1/disruptions` open when `INGEST_KEY` unset; simulator on by default | in production ingestion returns 503 until `INGEST_KEY` is set; simulator off unless `SIM_ENABLED=true` |
| CORS allowed every origin | production uses the `WEB_ORIGIN` allow-list |
| Interview quotes (free text) public | shown only with the team key |
| Plans are readable by their UUID (capability URL) | accepted by design (needed for the share link); UUIDs are unguessable; documented |
| `x-user-id` is client-supplied | demo identity only; production uses Supabase Auth |

## Not done (be upfront)
External penetration test / VAPT · CSRF tokens (API is bearer-token, no cookies) · MFA · secret rotation · dependency audit in CI · formal DPIA · lawyer review · grievance officer named · processor agreements (hosting, SMS/WhatsApp) · STQC/CQW certification.

## Breach runbook (written, **not yet rehearsed**)
1. **Detect/triage (0–1 h):** whoever notices pages the incident lead [name]; preserve logs (keep 180 days, without personal data).
2. **Contain:** rotate `AUTH_SECRET` (invalidates all tokens), disable affected accounts, revoke the Supabase service key if exposed.
3. **CERT-In:** report qualifying cyber incidents **within 6 hours** (CERT-In Directions, 28 Apr 2022 — law-firm summaries, MED).
4. **DPDP:** if personal data is involved, notify affected people and the Data Protection Board (about **72 hours** for the detailed report — secondary summaries, verify the Rules).
5. **Fix and review:** root cause, patch, test, publish a short note to affected agencies.
Rehearse once before any pilot.

## Standards status (what a government site is held to)
- **GIGW 3.0** (Guidelines for Indian Government Websites and Apps) requires **WCAG 2.1 AA**, a security chapter aligned to CERT-In, and covers mobile apps; certification is by STQC (CQW). We are **not certified**. Source: guidelines.india.gov.in (search extract, MED).
- **Our WCAG self-check** (own script, no external code): labels, accessible names, landmarks, one `h1` per page, ≥ 24 px targets, text contrast ≥ 4.5:1 — fixed to pass on the pages audited (`/`, `/report`, `/authority`). Not yet checked: keyboard-only walkthrough, screen-reader pass, the Expo app, Hindi/Marathi layouts at 200 % zoom. A formal audit is part of the pilot budget.
- **Languages:** English/Hindi/Marathi; native review pending (Bhashini is a possible *reviewer aid*; its free-access terms for developers were **not verified**).

## Live data hardening
`apps/api/src/gtfs-rt.ts` converts GTFS-Realtime TripUpdates into disruptions (delay ≥ 3 min, cancellations); `GTFS_RT_URL` enables a 30-second poller that replaces the previous feed rows and re-assesses plans. **Never run against a real feed yet** — no agency feed exists; it is tested on a synthetic message. A feed outage logs and keeps the last known state; plans fall back to the schedule.
