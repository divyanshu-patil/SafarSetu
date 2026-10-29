# SafarSetu

Time-synchronised trip planner for a new city. Enter where you start, which places you want and when you are free; SafarSetu plans every bus, metro and local train with exact times — **when to leave, what to board, how long to stay** — and re-plans with calm, personalised alerts when a train is late or cancelled ("No need to rush — your train is 30 min late. Leave at 10:40.").

Demo cities: **Mumbai** and **Pune** (synthetic data modelled on the real networks, clearly labelled). Built for the Seva First Innovation Challenge 2026 (theme *Surakshit Bharat* — mobility & infrastructure).

→ **Start with [`docs/`](docs/README.md)** · progress: [`progress.md`](progress.md) · what we need from you: [`NEEDED_FROM_YOU.md`](NEEDED_FROM_YOU.md)

## Monorepo

| Path | What |
|---|---|
| `packages/core` | `@repo/core` — pure TS planning engine, live assessment, alert copy, synthetic data, typed API client. Shared by API, web and mobile |
| `apps/api` | Express 5 + zod + Supabase (memory store fallback), SSE, scheduler, disruption simulator |
| `apps/web` | Next.js 16 dashboard (planner, live trip, insights) — [design system](docs/DESIGN.md) |
| `apps/app` | Expo app; home screen already runs `@repo/core` on-device |

## Run it

```sh
pnpm install
pnpm --filter api dev      # http://localhost:4000  (no keys needed; memory store)
pnpm --filter web dev      # http://localhost:3000
pnpm test                  # core + API tests
```

Demo flow: pick a preset → **Plan my day** → **Start live trip** → *Start demo day* (60× clock) → use the **Disruption simulator**.

Local Supabase (optional): see [docs/07-database.md](docs/07-database.md).
