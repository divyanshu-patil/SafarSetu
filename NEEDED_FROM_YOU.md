# Needed from you

**The demo needs no API keys.** Everything below is either a decision, an account, or an optional upgrade. Items are ordered by urgency.

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
