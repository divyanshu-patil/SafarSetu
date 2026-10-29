# Needed from you

## 🔴 TODAY — Maharashtra Zone application closes 30 Oct 2026
The Maharashtra Zone portal is **<https://sevainnovationchallenge.in>** (not `sevafirst.mic.gov.in`, which is the South Zone). Last date to apply: **30 October 2026** (no time shown). You need: Aadhaar verification, an ID upload (PDF/JPG/PNG ≤ 5 MB), the 6-slide deck (`submission/SafarSetu-Seva-First-Pitch.pdf`), sector **Urban development**. Helpline +91 91377 78135 · support@sevainnovationchallenge.in. The registration page displayed a "Prototype mode" notice — ask them to confirm real submissions are accepted.

## Before you submit (deck is otherwise ready)
See `submission/TODO-before-submit.md`: team names/roles/qualifications (slide 6), mentor, contact line, and a real source or survey line on slide 2.

## To raise the score (biggest first)
| # | Item | Why |
|---|---|---|
| 1 | **10+ commuter interviews** with `/field` (script in docs/15), 3 field photos | The guide's #1 judging item is evidence from real people |
| 2 | Native Marathi + Hindi review | Strings were written for the prototype |
| 3 | Hosting accounts (Vercel + an API host) | A public demo link beats screenshots |
| 4 | 30-minute call/visit with PMPML or a ward office | Turns "to approach" into a pilot lead |
| 5 | Meta WhatsApp rate card, a Marathi translation quote | Firms up the cost table |
| 6 | Run `npx supabase start` (Docker) then `pnpm --filter api test:supabase` | The database adapter has never been run live |

## Blocking / time-critical

| # | Item | Why | Notes |
|---|---|---|---|
| 1 | **Seva First deadline + registration** | The official site says submissions close **6 Nov 2026**; the Ministry's X post/media say **24 Oct** (already passed). Registration is institution-led: a *college coordinator* must register and nominate us. | Check <https://sevafirst.mic.gov.in/> and ask your institute's coordinator today. Pick Level **Open**, Theme **Surakshit Bharat**, Track **A + B**. |
| 2 | Team names/roles, institute name | One-page template, pitch | |
| 3 | Field evidence (optional but scored on "impact") | 10–20 commuter interviews or timed trips in Pune | Research.md §14 has a plan |

## Optional keys / accounts (none required for demo)

| Item | When needed | Free? |
|---|---|---|
| Supabase CLI + Docker running (colima) | Local DB instead of memory store | free — `brew install supabase/tap/supabase` or `npx supabase` |
| Supabase cloud project (URL, anon key, service-role key) | Hosted deploy | free tier |
| TomTom Traffic API key | Live traffic for cab-fallback legs | free tier ≈ 2 500 req/day |
| OpenRouteService key | Higher walking-route limits | free tier |
| Vercel account / domain | Public web demo link | free tier |
| Expo/EAS account; Apple dev ($99/yr) / Google Play ($25) | Mobile distribution | partial |
| VAPID keys | Background web push | I can generate; you only store them |
| Anthropic API key | *Only if* we add natural-language trip input / alert rephrasing | paid |

## Data you can obtain (improves realism)

- Pune Metro official timetable/fare PDF (transcribe → replaces synthetic metro).
- PMPML GTFS (community: `croyla/pmpml-gtfs`) — I can import when network is allowed.
- Any operator contact (PMPML / Maha-Metro / Railways) for GTFS-RT or alert access.

## Authority portal / production auth

| Item | Why |
|---|---|
| `AUTH_SECRET` (long random string) | Signs authority tokens — required in production (`apps/api/.env`) |
| Real authority accounts or an SSO / Supabase Auth project | The prototype uses demo accounts in `apps/api/src/demo-users.ts` (not for production); set `AUTHORITY_USERS_JSON` or move to Supabase Auth |
| Which agency owns each region's reports (Mumbai MMRDA/BEST/MahaMetro, Pune PMPML/PMRDA, …) | To define real jurisdictions and the "referred to" list |
| Decision on photo attachments (Supabase Storage bucket) | Not built yet |
