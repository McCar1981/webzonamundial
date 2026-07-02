-- 2026-42-liga-predictions.sql
--
-- Predicciones 1X2 de Zona de Ligas (fútbol de clubes).
--
-- DECISIÓN DE DISEÑO: tabla NUEVA y AISLADA, NO se reutiliza `predictions` (la del
-- Mundial). Motivo: el Mundial sigue vivo hasta el 19-jul y su resolución
-- (parseInt(match_id) + lookup en MATCHES) es delicada; mezclar clubes ahí
-- arriesga romper el producto que funciona en su semana final. Esta tabla se
-- keyea por `fixture_id` real de api-football y no toca nada del Mundial.
--
-- El usuario predice el resultado (local/empate/visitante) de un partido ANTES
-- del saque; un cron lo resuelve al terminar y abona Fútcoins si acierta.

create table if not exists public.liga_predictions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  fixture_id       bigint not null,               -- id de api-football
  competition_slug text not null,                 -- slug del catálogo (para agrupar/mostrar)
  pick             text not null check (pick in ('home','draw','away')),
  kickoff          timestamptz not null,          -- saque real (de api-football), fija la ventana
  status           text not null default 'pending' check (status in ('pending','won','lost','void')),
  rewarded         boolean not null default false, -- Fútcoins ya abonados (idempotencia)
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  unique (user_id, fixture_id)                     -- un pronóstico por partido y usuario
);

-- Índices para el cron (partidos pendientes ya jugados) y el reparto de premios.
create index if not exists liga_predictions_pending_idx
  on public.liga_predictions (kickoff) where status = 'pending';
create index if not exists liga_predictions_reward_idx
  on public.liga_predictions (id) where status = 'won' and rewarded = false;
create index if not exists liga_predictions_user_idx
  on public.liga_predictions (user_id);

-- RLS: el usuario ve y crea SOLO sus pronósticos. La resolución y el abono los
-- hace el cron con service role (bypassa RLS). No hay update/delete de usuario.
alter table public.liga_predictions enable row level security;

drop policy if exists "liga_pred_select_own" on public.liga_predictions;
create policy "liga_pred_select_own" on public.liga_predictions
  for select using (auth.uid() = user_id);

drop policy if exists "liga_pred_insert_own" on public.liga_predictions;
create policy "liga_pred_insert_own" on public.liga_predictions
  for insert with check (auth.uid() = user_id);
