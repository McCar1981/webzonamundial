-- 2026-50-liga-predictions-a2b.sql
--
-- Mercados de predicción A2b de Zona de Ligas (datos de jugador):
--   · first_scorer → primer goleador del partido (o "sin goleador")
--   · duel         → duelo de jugadores: ¿quién rinde más? (goles·4 + asist·2)
--
-- ADITIVO: solo amplía el CHECK de `market`. La columna `data jsonb` y el CHECK
-- de coherencia (data not null para mercados tipados) ya existen desde 2026-47.
-- Idempotente y seguro para las filas vivas.

do $$ begin
  alter table public.liga_predictions drop constraint if exists liga_predictions_market_chk;
  alter table public.liga_predictions
    add constraint liga_predictions_market_chk
    check (market in ('1x2', 'exact', 'ou_goals', 'first_goal', 'btts', 'ou_corners', 'ou_cards', 'first_goal_half', 'first_scorer', 'duel'));
exception when duplicate_object then null; end $$;
