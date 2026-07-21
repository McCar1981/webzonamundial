-- 2026-49-liga-predictions-a2.sql
--
-- Mercados de predicción A2 de Zona de Ligas:
--   · ou_corners      → over/under de córners (línea 9.5)
--   · ou_cards        → over/under de tarjetas amarillas+rojas (línea 4.5)
--   · first_goal_half → ¿en qué mitad cae el primer gol? (1ª / 2ª / sin goles)
--
-- ADITIVO: solo amplía el CHECK de `market` de `liga_predictions`. La columna
-- `data jsonb` y el CHECK de coherencia (data not null para mercados tipados) ya
-- existen desde 2026-47, así que no hay que tocarlos. Idempotente y seguro para
-- las filas vivas (sus valores de `market` siguen en la lista).

do $$ begin
  alter table public.liga_predictions drop constraint if exists liga_predictions_market_chk;
  alter table public.liga_predictions
    add constraint liga_predictions_market_chk
    check (market in ('1x2', 'exact', 'ou_goals', 'first_goal', 'btts', 'ou_corners', 'ou_cards', 'first_goal_half'));
exception when duplicate_object then null; end $$;
