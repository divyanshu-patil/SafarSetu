# 08 — Web dashboard & mobile reuse

## Web dashboard (`apps/web`, Next.js 16)

Design system: [DESIGN.md](DESIGN.md) — currently the **Wise-style** spec: Forest Ink `#163300` text/dark sections, Lime Voltage `#9fe870` only for the primary action and active states, Fog/Linen surfaces, Inter with Black 900 uppercase display headlines (-0.04em), pill buttons/tags/nav segments, 10px cards, 28px large cards, flat hairline borders (no gradients). Section rhythm white → linen band → Forest Ink dark section. Tokens live in `apps/web/app/globals.css` (Inter loaded from Google Fonts in `layout.tsx`; Black 900 stands in for Wise Sans). Accessible (labels, focus rings, `aria-live` for alerts, keyboard-operable timeline).

| Route | Screen | Contents |
|---|---|---|
| `/` | **Planner** | Left: origin (search/click map), date, window, places (curated chips + search), pace, style. Right: map. After *Plan my day*: timeline + map layers, totals (walk, fare, confidence), leave-by chips, dropped-places notice |
| `/trip/[id]` | **Live trip** | Sim clock controls, "now" marker moving along the plan, *Next up* card (what to board, when to leave), alert feed (SSE + browser Notification), **Disruption simulator** panel, revision diff ("what changed and why") |
| `/report`, `/report/[ref]` | **Report a gap / track** | Category cards, from/to areas on map, receipt + status stepper |
| `/authority/login`, `/authority`, `/authority/reports` | **Authority portal** | See [12](12-reports-and-authority.md) |
| `/insights` | **Aggregate insights** | Delay by route, re-plans, notifications sent, risky connections; all labelled *simulated* in demo |

### Colour and icons
Neutral Apple surfaces stay; **semantic colour carries meaning only through icons and text**: tinted icon chips (accent at 12 % alpha) for modes (metro cyan, train crimson, bus orange, walk slate, cab amber), report categories and case statuses (`CATEGORIES`/`STATUSES` in `@repo/core`, icons from lucide). Status is shown as icon + coloured bare text (no coloured pills). Confidence uses ShieldCheck (green ≥ 90 %), amber, and AlertTriangle (orange) below 80 %.

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

Built so far (same Wise-style tokens as web — `apps/app/src/constants/theme.ts`, Inter via `@expo-google-fonts/inter`): **Plan** (city + preset, Next-up dark card, stats, timeline with mode icons, planning runs on-device) and **Report a gap** (category cards, from/to areas geocoded through the API, receipt with reference). Set `EXPO_PUBLIC_API_URL` (Android emulator: `http://10.0.2.2:4000`). Still to build: Live trip with alert feed and push registration.

Planned screens mirror web: Plan → Timeline → Live trip (with the same alert feed). View-models (`planToMapLayers`, `nextAction`, `timelineRows`) are in core so both UIs render identically.

Metro bundler resolves workspace packages automatically in Expo 58 monorepos; `@repo/core` ships TS source, no build.
