# Progress

Legend: ✅ done · 🔄 in progress · ⬜ todo

## Phase 0 — Research & docs
- ✅ Read existing Research / Prototype / product spec
- ✅ Researched Seva First Innovation Challenge 2026 (criteria in docs/01)
- ✅ Docs 01–10, NEEDED_FROM_YOU.md

## Phase 1 — `@repo/core`
- ✅ types, time utils, synthetic Pune + Mumbai packs
- ✅ router (round-based), arrive-by
- ✅ confidence (Monte-Carlo)
- ✅ day planner (order, drop, dwell allocation, reminders)
- ✅ live state, assess/replan, notification composer
- ✅ unit tests (node:test)

## Phase 2 — `apps/api`
- ✅ Express skeleton, store (memory + Supabase adapter), migrations (SQL validated on Postgres; adapter not run against live PostgREST)
- ✅ plans/route/network endpoints, SSE, scheduler, sim clock/scenarios
- ✅ proxies (geocode, walk, weather; fall back offline), insights

## Phase 3 — `apps/web`
- ✅ Planner + map (Apple-style per docs/DESIGN.md)
- ✅ Live trip + simulator + alerts (SSE)
- ✅ Insights

## Phase 4 — Polish / verification
- ✅ End-to-end verified in Chrome: planner (Pune+Mumbai), live trip, SSE alerts, simulator, insights. Phone-width layout NOT verified (window resize had no effect)
- ✅ Mobile proof (apps/app home screen runs @repo/core)
- ✅ README, docs sync

## Log
- 2026-10-30 — docs written.
- 2026-10-30 — user scoped demo cities to **Mumbai + Pune**; core package done with both packs, tests green.
- 2026-10-30 — API, web, mobile proof built; fixed replan attribution + 'wait at previous place' behaviour found in e2e run.
- Next ideas: visual QA in browser, import real GTFS (PMPML/BEST), Web Push (VAPID), learned delay profiles, Marathi/Hindi alert copy, run SupabaseStore against local Supabase.
- 2026-10-30 — browser QA found+fixed: CARTO tiles need API key (→ OSM, greyscaled), marker class clash `.pin.visit`, zero-length first move, vague 'open the app' alert (now suggests cab/walk), walking thresholds by pace.
- 2026-10-30 — Citizen gap reports, authority portal (roles), Wise design on web + mobile, Google-Maps-style stop planner for work/errands (ordered stops, be-there-by, required, conflicts).
- 2026-10-30 — Maharashtra network added (real Datameet rail timetable: 549 stations/959 trains; 71 OSM places; no metro/buses yet). CSMT↔Pune Deccan Express plan verified end to end. DATA_SOURCES.md written.
- 2026-10-30 — Transport mode filter (local/express/metro/bus/cab), empty start + clear-all. Real buses imported: PMPML (Pune, 623 patterns/10k departures, feed 2026-10-07) and BEST (Mumbai, 884 patterns/88k departures, community feed 2026-08-19); both MIT-0, stop-to-stop ride times modelled by the feed generator.
