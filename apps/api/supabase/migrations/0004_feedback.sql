-- Pilot instrumentation: anonymous one-tap feedback on alerts and trip outcomes (no user id stored).
create table if not exists feedback (
  id uuid primary key, kind text not null check (kind in ('alert','trip')),
  plan_id uuid, alert_kind text, useful boolean, on_time boolean, minutes_late int,
  created_at timestamptz not null default now()
);
create index if not exists feedback_kind_idx on feedback (kind, created_at desc);
alter table feedback enable row level security;  -- API (service role) only
