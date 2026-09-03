-- =============================================================================
-- Harry Potter Explorer: Supabase schema
--
-- Paste this into the Supabase SQL editor and run it. The script is idempotent:
-- running it again on an existing project is safe.
--
-- Tables
--   characters       mirror of hp-api characters (filled by POST /api/sync)
--   spells           mirror of hp-api spells     (filled by POST /api/sync)
--   favorite_events  one row per heart tap from any visitor (POST /api/favorites)
-- View
--   favorite_leaderboard  score = adds - removes, per character
-- =============================================================================

-- ---------- Catalogue mirrors ------------------------------------------------

create table if not exists public.characters (
  id               text primary key,
  name             text not null,
  house            text not null default '',
  species          text not null default '',
  patronus         text not null default '',
  image            text not null default '',
  alive            boolean not null default true,
  hogwarts_student boolean not null default false,
  hogwarts_staff   boolean not null default false,
  -- the complete normalised character record, as served by /api/characters
  data             jsonb not null,
  synced_at        timestamptz not null default now()
);

create index if not exists characters_house_idx on public.characters (house);

create table if not exists public.spells (
  id          text primary key,
  name        text not null,
  description text not null default '',
  synced_at   timestamptz not null default now()
);

-- ---------- Favourite activity ----------------------------------------------

create table if not exists public.favorite_events (
  id             bigint generated always as identity primary key,
  character_id   text not null,
  character_name text not null,
  house          text not null default '',
  action         text not null check (action in ('add', 'remove')),
  created_at     timestamptz not null default now()
);

create index if not exists favorite_events_created_at_idx
  on public.favorite_events (created_at desc);

create index if not exists favorite_events_character_id_idx
  on public.favorite_events (character_id);

-- ---------- Leaderboard view ------------------------------------------------
-- Recreated on every run so column changes never fail with "cannot change view".

drop view if exists public.favorite_leaderboard;

create view public.favorite_leaderboard
  with (security_invoker = true)
as
select
  character_id,
  (array_agg(character_name order by created_at desc))[1] as character_name,
  (array_agg(house          order by created_at desc))[1] as house,
  (
    count(*) filter (where action = 'add')
    - count(*) filter (where action = 'remove')
  )::int                                                   as score,
  max(created_at)                                          as last_event_at
from public.favorite_events
group by character_id
order by score desc, last_event_at desc;

-- ---------- Row Level Security ----------------------------------------------
-- The app talks to Supabase with the service_role key (which bypasses RLS), so
-- these policies only matter for the dashboard, the anon-key fallback and any
-- future client-side readers. Nothing is writable except favourite events.

alter table public.characters      enable row level security;
alter table public.spells          enable row level security;
alter table public.favorite_events enable row level security;

drop policy if exists "characters are readable by everyone" on public.characters;
create policy "characters are readable by everyone"
  on public.characters for select
  to anon, authenticated
  using (true);

drop policy if exists "spells are readable by everyone" on public.spells;
create policy "spells are readable by everyone"
  on public.spells for select
  to anon, authenticated
  using (true);

drop policy if exists "favorite events are readable by everyone" on public.favorite_events;
create policy "favorite events are readable by everyone"
  on public.favorite_events for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone may record a favorite event" on public.favorite_events;
create policy "anyone may record a favorite event"
  on public.favorite_events for insert
  to anon
  with check (action in ('add', 'remove'));

-- ---------- Grants ----------------------------------------------------------

grant select on public.characters, public.spells, public.favorite_events
  to anon, authenticated, service_role;
grant insert on public.favorite_events to anon, authenticated, service_role;
grant usage on sequence public.favorite_events_id_seq to anon, authenticated, service_role;
grant select on public.favorite_leaderboard to anon, authenticated, service_role;

-- ---------- Realtime (optional) --------------------------------------------
-- Lets the Supabase dashboard / any Realtime subscriber watch favorite_events.
-- The web app itself streams through /api/live/stream (server-side polling),
-- so this is a convenience, not a requirement.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'favorite_events'
  ) then
    alter publication supabase_realtime add table public.favorite_events;
  end if;
exception
  when undefined_object then
    -- The project has no supabase_realtime publication; nothing to do.
    null;
end
$$;
