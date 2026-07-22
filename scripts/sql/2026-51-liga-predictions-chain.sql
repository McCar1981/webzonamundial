-- 2026-51-liga-predictions-chain.sql
--
-- Mercado COMBINADA de Zona de Ligas: `chain` (predicción encadenada).
-- El pick guarda en `data` sus 2-3 patas + el premio congelado:
--   { "legs": [ { "market": "ou_goals", "data": {...} }, ... ], "reward": 54 }
-- Se resuelve del mismo FixtureDetail (todas las patas deben acertar); el premio
-- es dinámico (lo lee el cron de data.reward), por eso NO va en MARKET_REWARD.
--
-- ADITIVO: solo amplía el CHECK de `market`. La columna `data jsonb` ya existe
-- desde 2026-47. Idempotente. Sin la migración: saveTypedPick degrada 23514 como
-- "no disponible" (la UI de Combinada dice "mercado no disponible", nunca 500).

do $$ begin
  alter table public.liga_predictions drop constraint if exists liga_predictions_market_chk;
  alter table public.liga_predictions
    add constraint liga_predictions_market_chk
    check (market in ('1x2', 'exact', 'ou_goals', 'first_goal', 'btts', 'ou_corners', 'ou_cards', 'first_goal_half', 'first_scorer', 'duel', 'chain'));
exception when duplicate_object then null; end $$;
