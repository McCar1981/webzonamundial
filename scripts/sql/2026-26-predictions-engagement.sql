-- 2026-26 · Paquete "engagement" de Predicciones (Asegurar ahora + Reta al Oráculo + Piques 1v1)
-- Ejecutar en Supabase SQL Editor ANTES o JUNTO con el deploy del código que lo usa.
-- Idempotente: se puede re-ejecutar sin daño.

-- ─── 1) "Asegurar ahora" (cash-out en vivo a puntos fijos) ────────────────────
alter table predictions add column if not exists secured_at timestamptz;
alter table predictions add column if not exists secured_points integer;

-- ─── 2) "Reta al Oráculo" (humanos vs la IA de la casa) ───────────────────────
create table if not exists prediction_oracle_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  user_pick jsonb not null,          -- pick de ganador del usuario al sellar el reto
  oracle_pick jsonb not null,        -- pick del Oráculo sellado en ese momento
  outcome text check (outcome in ('user','oracle','tie')),
  reward_coins integer,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (user_id, match_id)
);
alter table prediction_oracle_challenges enable row level security;
drop policy if exists "oracle: lectura propia" on prediction_oracle_challenges;
create policy "oracle: lectura propia" on prediction_oracle_challenges
  for select using (auth.uid() = user_id);
-- Escrituras: SOLO service-role (sin policies de insert/update/delete).

-- Índice para liquidar por partido en el cron.
create index if not exists idx_oracle_challenges_match
  on prediction_oracle_challenges (match_id) where resolved_at is null;

-- ─── 3) Piques 1v1 (reto entre amigos con Fútcoins en juego) ──────────────────
create table if not exists prediction_challenges (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid references auth.users(id) on delete set null,
  stake integer not null check (stake in (25, 50, 100)),
  code text not null unique,
  status text not null default 'open' check (status in ('open','accepted','settled','refunded')),
  winner_id uuid,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  settled_at timestamptz
);
alter table prediction_challenges enable row level security;
drop policy if exists "piques: ver los mios" on prediction_challenges;
create policy "piques: ver los mios" on prediction_challenges
  for select using (auth.uid() = creator_id or auth.uid() = opponent_id);
-- Escrituras: SOLO service-role (crear/aceptar/liquidar pasan por la API).

create index if not exists idx_pred_challenges_match
  on prediction_challenges (match_id) where status in ('open','accepted');
