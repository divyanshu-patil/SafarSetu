# 02 — Architecture

## Monorepo (Turborepo + pnpm)

```
apps/
  api/      Express 5 + TypeScript + Supabase (local). Owns data, clock, scheduler, SSE.
  web/      Next.js 16 dashboard (Leaflet map, planner, live trip, insights).
  app/      Expo (React Native) mobile — consumes the same core + client.
packages/
  core/     @repo/core — PURE TypeScript: types, network model, router, day planner,
            confidence, disruption assessment, notification composer, synthetic Pune data,
            typed API client. No DOM, no Node APIs → runs in API, Next, and React Native.
  ui/, eslint-config/, typescript-config/   (existing)
docs/       this documentation
```

**Rule:** anything that decides *what the user should do* lives in `@repo/core`. Apps only fetch, store, render, deliver. This is how the mobile app reuses 100 % of planning logic and screens' view-models.

## Data flow

```mermaid
flowchart LR
  subgraph Clients
    W[Web dashboard] --- M[Expo app]
  end
  W & M -->|REST + SSE via @repo/core client| API
  subgraph API[apps/api]
    R[routes + zod validation] --> P[planner service]
    P --> C[(@repo/core)]
    D[disruption ingest / simulator] --> A[assess + replan]
    A --> C
    A --> N[notification scheduler]
    CLK[sim/real clock] --> N
  end
  API --> DB[(Supabase Postgres)]
  API -->|cached proxy| EXT[Photon, Nominatim, OSRM-foot, Open-Meteo]
  N -->|SSE / Web Push / Expo push| Clients
```

### Request lifecycles

- **Plan:** `POST /v1/plans` → load network (memory-cached) + live state → `planDay()` → persist plan + schedule reminder notifications → return plan.
- **Disruption:** `POST /v1/disruptions` (or simulator) → store → for each active plan touching the event, `assessPlan()` → if changed: new plan revision, cancel stale notifications, schedule new ones, push personalised alert.
- **Tick (1 s):** scheduler fires notifications whose `fire_at ≤ clock.now()`.

## Key decisions

| Decision | Why |
|---|---|
| Core is pure TS with `minutes-since-midnight` times | Deterministic, trivially testable, RN-safe, no timezone bugs inside the engine; IST conversion only at edges |
| Own small RAPTOR-style router instead of OpenTripPlanner | No JVM, runs on-device later (offline), enough for city scale; OTP is the documented upgrade path when networks outgrow it |
| Disruptions are *events overlaid on timetables* | Timetables stay immutable and auditable; any real feed (GTFS-RT, operator alerts, crowd) just inserts events |
| Store has memory fallback when Supabase is absent | `pnpm dev` works with zero setup; production path uses same interface |
| Web consumes core source via `transpilePackages`; API via `tsx` | No build step for the shared package |
| SSE for live updates | One-way push is all we need; works behind simple proxies; no extra service |
| Sim clock | Lets judges watch a day unfold in minutes; real clock = default in production |

## Mobile reuse checklist

- `@repo/core` has no `window`, `fetch` injection only through `createClient(baseUrl, fetchImpl?)`.
- Formatting helpers (`fmtTime`, `fmtDuration`) live in core.
- Notification copy is composed in core; mobile just shows `title/body`.
- Map: web uses Leaflet; mobile will use `react-native-maps` / MapLibre RN with the same `Plan → geometry` view-model (`planToMapLayers`).
