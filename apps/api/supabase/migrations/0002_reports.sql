-- Citizen connectivity-gap reports + authority workflow (see docs/12-reports-and-authority.md)
create table if not exists reports (
  id uuid primary key,
  ref text not null unique,
  city text not null,                       -- region id (mumbai, pune, nashik, nagpur, ...)
  category text not null,
  severity int not null check (severity between 1 and 3),
  from_area jsonb, to_area jsonb, location jsonb not null,
  mode text not null default 'any',
  time_of_day text,
  description text not null default '',
  status text not null default 'received',
  public_note text,                         -- visible to the reporter
  internal_notes jsonb not null default '[]'::jsonb,   -- staff only
  assignee text,
  reporter text not null,                   -- hash of the anonymous user id
  synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_city_status_idx on reports (city, status, created_at desc);
create index if not exists reports_category_idx on reports (category);

alter table reports enable row level security;
-- No direct client access: reads/writes go through the API (service role) which strips staff-only fields.
-- Production with Supabase Auth, e.g.:
-- create policy "authority reads own jurisdiction" on reports for select
--   using ((auth.jwt() -> 'app_metadata' -> 'cities') ? city or (auth.jwt() -> 'app_metadata' -> 'cities') ? '*');
