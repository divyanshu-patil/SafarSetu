# 07 — Database (Supabase / Postgres)

Local first: `apps/api/supabase/` holds `config.toml`, `migrations/`, `seed.sql` (generated). Run with the Supabase CLI (needs Docker):

```sh
cd apps/api
npx supabase start          # local Postgres + Studio on :54323
npx supabase db reset       # apply migrations + seed
cp .env.example .env        # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from `supabase status`
pnpm --filter api dev
```

Without those env vars the API uses the **memory store** (same interface, seeded from the Pune pack) so the demo works offline.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `stops` | network stops | `id text pk, name, lat, lon, mode` |
| `routes` | routes with timetable | `id pk, mode, name, color, stop_ids text[], offsets int[], departures int[], fare jsonb` |
| `places` | points of interest | `id pk, name, lat, lon, opens, closes, min_dwell, max_dwell, category` |
| `plans` | a user's day plan (latest revision) | `id uuid pk, user_id, date, revision, request jsonb, plan jsonb, status, created_at, updated_at` |
| `plan_revisions` | audit trail of every re-plan | `plan_id fk, revision, reason, plan jsonb, created_at` |
| `disruptions` | event store | `id pk, type, route_id, trip_departure, stop_id, delay_min, from_min, until_min, source, verified, note, active` |
| `notifications` | scheduled + sent alerts | `id uuid pk, plan_id fk, user_id, kind, title, body, fire_at timestamptz, sent_at, read_at, revision` |
| `devices` | push targets | `user_id, platform, token, created_at` |
| `delay_observations` | realised vs scheduled (feeds learning + insights) | `route_id, trip_departure, stop_id, scheduled_min, actual_min, observed_at` |

## Security (production)

- **RLS on** `plans`, `notifications`, `devices`: `user_id = auth.uid()`. Network tables are public-read.
- API uses the **service role** only server-side; clients never see it. Anonymous guests get Supabase anonymous sign-in so plans can be saved without PII.
- `disruptions` writes only through API with ingest key / service role.
- Retention: notifications 30 days, plans 12 months, observations aggregated then pruned (DPDP — see [09](09-production-readiness.md)).

## Indexing

`notifications (fire_at) where sent_at is null` (scheduler hot path) · `plans (user_id, updated_at desc)` · `disruptions (active, route_id)`.
