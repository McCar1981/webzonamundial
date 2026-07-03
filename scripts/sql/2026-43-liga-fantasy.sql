-- 2026-43-liga-fantasy.sql
--
-- Fantasy de Zona de Ligas (fútbol de clubes), formato "once de la jornada".
-- Tabla NUEVA y AISLADA (no toca el fantasy del Mundial). El usuario elige un
-- pequeño once para una JORNADA (round) de una competición; un cron lo puntúa con
-- las estadísticas reales de api-football al terminar la jornada y abona Fútcoins.
--
-- `players` guarda todo lo necesario para puntuar sin volver a pedir plantillas:
-- array JSON de { id, pos, teamId, name }. `captain_id` puntúa x2.

create table if not exists public.liga_fantasy_picks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  competition_slug text not null,
  round            text not null,               -- ronda de api-football ("Regular Season - 19")
  players          jsonb not null,              -- [{ id, pos, teamId, name }]
  captain_id       bigint,                      -- jugador con puntos x2
  status           text not null default 'pending' check (status in ('pending','scored','void')),
  points           int not null default 0,      -- puntos de la jornada (tras puntuar)
  rewarded         boolean not null default false,
  created_at       timestamptz not null default now(),
  scored_at        timestamptz,
  unique (user_id, competition_slug, round)     -- un once por jornada y usuario
);

create index if not exists liga_fantasy_pending_idx
  on public.liga_fantasy_picks (competition_slug, round) where status = 'pending';
create index if not exists liga_fantasy_reward_idx
  on public.liga_fantasy_picks (id) where status = 'scored' and rewarded = false;
create index if not exists liga_fantasy_user_idx
  on public.liga_fantasy_picks (user_id);

-- RLS: el usuario ve y crea SOLO su once. La puntuación/abono los hace el cron con
-- service role (bypassa RLS). Sin update/delete de usuario.
alter table public.liga_fantasy_picks enable row level security;

drop policy if exists "liga_fantasy_select_own" on public.liga_fantasy_picks;
create policy "liga_fantasy_select_own" on public.liga_fantasy_picks
  for select using (auth.uid() = user_id);

drop policy if exists "liga_fantasy_insert_own" on public.liga_fantasy_picks;
create policy "liga_fantasy_insert_own" on public.liga_fantasy_picks
  for insert with check (auth.uid() = user_id);
