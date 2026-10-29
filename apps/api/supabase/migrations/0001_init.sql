-- SafarSetu core schema. Network tables are public-read; user data is RLS-protected.
create table if not exists stops (
  id text primary key, city text not null, name text not null, lat double precision not null, lon double precision not null, mode text not null
);
create table if not exists routes (
  id text primary key, city text not null, mode text not null, name text not null, color text not null,
  stop_ids text[] not null, offsets int[] not null, departures int[] not null
);
create table if not exists places (
  id text primary key, city text not null, name text not null, lat double precision not null, lon double precision not null,
  opens int not null, closes int not null, min_dwell int not null, max_dwell int not null, category text not null
);

create table if not exists plans (
  id uuid primary key, user_id text not null, city text not null, date date not null,
  revision int not null default 1, state text not null default 'on_track',
  plan jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists plans_user_idx on plans (user_id, updated_at desc);

create table if not exists plan_revisions (
  plan_id uuid not null references plans(id) on delete cascade, revision int not null, reason text,
  plan jsonb not null, created_at timestamptz not null default now(), primary key (plan_id, revision)
);

create table if not exists disruptions (
  id text primary key, type text not null, route_id text, trip_departure int, stop_id text, delay_min int,
  from_min int not null, until_min int not null, source text not null, verified boolean not null default false,
  note text, active boolean not null default true, created_at timestamptz not null default now()
);
create index if not exists disruptions_active_idx on disruptions (active, route_id);

create table if not exists notifications (
  id uuid primary key, plan_id uuid not null references plans(id) on delete cascade, user_id text not null,
  kind text not null, title text not null, body text not null, date date not null, fire_min int not null,
  revision int not null, sent boolean not null default false, sent_at timestamptz, read_at timestamptz, meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists notifications_due_idx on notifications (date, fire_min) where sent = false;

create table if not exists devices (
  user_id text not null, platform text not null, token text not null, created_at timestamptz not null default now(),
  primary key (user_id, token)
);

create table if not exists delay_observations (
  route_id text not null, trip_departure int not null, stop_id text not null,
  scheduled_min int not null, actual_min int not null, observed_at timestamptz not null default now()
);

-- RLS: the API uses the service role (bypasses RLS). Direct client access is read-only on the network.
alter table stops enable row level security;
alter table routes enable row level security;
alter table places enable row level security;
create policy "network public read" on stops for select using (true);
create policy "network public read" on routes for select using (true);
create policy "network public read" on places for select using (true);
alter table plans enable row level security;
alter table plan_revisions enable row level security;
alter table notifications enable row level security;
alter table devices enable row level security;
-- production (Supabase Auth): user_id = auth.uid()::text policies go here, e.g.
-- create policy "own plans" on plans for select using (user_id = auth.uid()::text);
