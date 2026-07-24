-- 2026-54-fantasy-leagues-liga.sql
--
-- Ligas privadas POR COMPETICIÓN (pivote Zona de Ligas, tarea #34).
--
-- Añade una etiqueta opcional de competición a las ligas privadas de Fantasy.
--   - liga = NULL  → liga privada "clásica": clasifica por puntos TOTALES de
--     Fantasy (comportamiento actual, sin cambios).
--   - liga = <slug de competición> (p.ej. "laliga", "liga-mx", "ligapro-ecuador")
--     → clasifica por ACIERTOS de predicciones de ESA competición
--     (liga_predictions.status = 'won' filtrado por competition_slug).
--
-- Idempotente y no destructivo (IF NOT EXISTS). El código lee/escribe la columna
-- de forma fail-soft: funciona igual si esta migración aún no se ha aplicado
-- (las ligas se comportan como "clásicas" hasta entonces).

alter table public.fantasy_leagues
  add column if not exists liga text;

-- Índice para el conteo de aciertos por competición filtrado a los miembros de
-- una liga privada (WHERE competition_slug = ? AND status = 'won' AND user_id IN (...)).
create index if not exists idx_liga_predictions_slug_status_user
  on public.liga_predictions (competition_slug, status, user_id);
