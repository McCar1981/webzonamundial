-- 2026-47-liga-predictions-typed.sql
--
-- Mercados TIPADOS adicionales para las predicciones de Zona de Ligas (Fase A1):
--   · ou_goals   → over/under de goles (línea 2.5)
--   · first_goal → primer equipo en marcar (local / visitante / ninguno)
--   · btts       → ambos marcan (sí / no)
--
-- ADITIVO sobre `liga_predictions` (no tabla nueva): mismo patrón que el mercado
-- "exact" (2026-44). Se añade una columna `data jsonb` con el payload del pick y
-- se amplía el CHECK de `market`. La unicidad (user_id, fixture_id, market) ya
-- existente permite UN pick por mercado y partido → varias oportunidades de ganar
-- en el mismo partido, con la misma billetera única de Fútcoins.
--
-- Idempotente y seguro para las filas vivas: las existentes son market IN
-- ('1x2','exact'), que siguen en la lista; `data` es NULL para ellas y el CHECK
-- de coherencia solo exige `data` a los mercados nuevos.

alter table public.liga_predictions
  add column if not exists data jsonb;

-- Ampliar el catálogo de mercados permitido (reemplaza el CHECK de 2026-44).
do $$ begin
  alter table public.liga_predictions drop constraint if exists liga_predictions_market_chk;
  alter table public.liga_predictions
    add constraint liga_predictions_market_chk
    check (market in ('1x2', 'exact', 'ou_goals', 'first_goal', 'btts'));
exception when duplicate_object then null; end $$;

-- Coherencia: los mercados tipados nuevos llevan su payload en `data`.
do $$ begin
  alter table public.liga_predictions
    add constraint liga_predictions_typed_data_chk
    check (market in ('1x2', 'exact') or data is not null);
exception when duplicate_object then null; end $$;
