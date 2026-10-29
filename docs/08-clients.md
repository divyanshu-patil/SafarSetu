# 08 — Web dashboard & mobile reuse

## Web dashboard (`apps/web`, Next.js 16)

Design system: [DESIGN.md](DESIGN.md) — Apple-style white gallery: #fff canvas, #f5f5f7 bands, 28px shadowless cards, pill controls, blue only for links and compact CTAs, no gradients, SF Pro (system fallback). Tokens live in `apps/web/app/globals.css`; the mobile app uses the same palette/radii. Accessible (labels, focus rings, `aria-live` for alerts, keyboard-operable timeline).

| Route | Screen | Contents |
|---|---|---|
| `/` | **Planner** | Left: origin (search/click map), date, window, places (curated chips + search), pace, style. Right: map. After *Plan my day*: timeline + map layers, totals (walk, fare, confidence), leave-by chips, dropped-places notice |
| `/trip/[id]` | **Live trip** | Sim clock controls, "now" marker moving along the plan, *Next up* card (what to board, when to leave), alert feed (SSE + browser Notification), **Disruption simulator** panel, revision diff ("what changed and why") |
| `/insights` | **Authority insights** | Delay by route, re-plans, notifications sent, risky connections; all labelled *simulated* in demo |

### UX rules
1. The first thing on a plan is **the next action and its time** ("Leave 09:04 → Aqua line 09:10").
2. Every time shown is exact (HH:MM, 24 h option). Durations as "1 h 05 min".
3. Show **confidence** as a plain sentence + bar, never a raw probability alone.
4. Disruption copy follows [04](04-realtime-and-notifications.md); changed items are highlighted for the session.
5. Map shows only what helps: legs colored by route, numbered visit markers, user marker; no layer clutter.
6. Data labels (*synthetic / scheduled / live*) always visible.
7. Empty/error states: offline → cached last plan; geocode fails → local gazetteer; no route → cab suggestion.

### State & data
- `lib/api.ts` = `createClient()` from `@repo/core`; pages are thin.
- Plan form state in React state + `localStorage` draft; plan id in URL.
- Basemap: OSM tiles, greyscaled via CSS. Leaflet created client-side only (`dynamic(..., {ssr:false})`).

## Mobile reuse (`apps/app`, Expo)

Shared today: `@repo/core` (types, planner, composer, formatters, API client, synthetic data for offline demo). Mobile adds: native map (`react-native-maps`/MapLibre), Expo push token registration → `POST /v1/devices`, background location (optional) for client-reported position, native sheet UI.

Planned mobile screens mirror web: Plan → Timeline → Live trip (with the same alert feed). View-models (`planToMapLayers`, `nextAction`, `timelineRows`) are in core so both UIs render identically.

Metro bundler resolves workspace packages automatically in Expo 58 monorepos; `@repo/core` ships TS source, no build.
