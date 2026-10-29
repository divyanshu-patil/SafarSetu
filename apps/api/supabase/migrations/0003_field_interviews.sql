-- Primary evidence from commuter interviews (guide Step 1). Anonymous: participant code only, consent required.
create table if not exists field_interviews (
  id uuid primary key, code text not null, date date not null, city text not null,
  role text not null, route text not null, modes text[] not null default '{}',
  problem text not null, per_week numeric not null, minutes_lost_per_week numeric not null, rupees_lost_per_week numeric not null,
  workaround text not null default '', tried_and_failed text not null default '',
  consent boolean not null check (consent), created_at timestamptz not null default now()
);
alter table field_interviews enable row level security;  -- API (service role) only
