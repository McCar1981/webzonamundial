-- ============================================================================
-- Predicciones — Rankings agregados en SQL (torneo/semanal + podio de partido)
-- Aplicar en el SQL editor de Supabase. Idempotente (CREATE OR REPLACE).
--
-- Motivo (bug real, 12-jun día 2 del Mundial): el backend leía TODAS las filas
-- resueltas de `predictions` con un SELECT plano y PostgREST corta la
-- respuesta en ~1000 filas EN SILENCIO. Con >1000 predicciones resueltas el
-- ranking global agregaba solo una fracción de la tabla y usuarios con alta
-- puntuación no aparecían. La agregación pasa a Postgres (escala a millones
-- de filas e ignora el tope de PostgREST).
--
-- Solo las llama el backend con la service role; sin acceso anon/authenticated.
-- El filtro de staff (RANKING_EXCLUDED_IDS) se aplica en el backend.
-- ============================================================================

-- Ranking por puntos de predicciones resueltas. p_since NULL = torneo entero;
-- con fecha = ranking desde ese instante (semanal).
CREATE OR REPLACE FUNCTION public.prediction_leaderboard(
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id           UUID,
  total_points      BIGINT,
  predictions_count BIGINT,
  correct_count     BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id,
         COALESCE(SUM(p.points_earned), 0)::bigint,
         COUNT(*)::bigint,
         COUNT(*) FILTER (WHERE p.is_correct)::bigint
  FROM public.predictions p
  WHERE p.resolved_at IS NOT NULL
    AND (p_since IS NULL OR p.resolved_at >= p_since)
  GROUP BY p.user_id
  ORDER BY 2 DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 1);
$$;

REVOKE ALL ON FUNCTION public.prediction_leaderboard(TIMESTAMPTZ, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prediction_leaderboard(TIMESTAMPTZ, INTEGER) TO service_role;

-- Podio de UN partido: puntos desc, desempate por nº de aciertos y por quién
-- predijo ANTES (MIN(created_at)). Solo entran usuarios con algún acierto.
-- (Un partido popular también supera las 1000 filas: México ya tuvo 937.)
CREATE OR REPLACE FUNCTION public.prediction_match_podium(
  p_match_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_id       UUID,
  total_points  BIGINT,
  correct_count BIGINT,
  first_at      TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id,
         COALESCE(SUM(p.points_earned), 0)::bigint,
         COUNT(*) FILTER (WHERE p.is_correct)::bigint,
         MIN(p.created_at)
  FROM public.predictions p
  WHERE p.match_id = p_match_id
    AND p.resolved_at IS NOT NULL
  GROUP BY p.user_id
  HAVING COUNT(*) FILTER (WHERE p.is_correct) > 0
  ORDER BY 2 DESC, 3 DESC, 4 ASC
  LIMIT GREATEST(COALESCE(p_limit, 5), 1);
$$;

REVOKE ALL ON FUNCTION public.prediction_match_podium(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prediction_match_podium(TEXT, INTEGER) TO service_role;

-- Índice de apoyo: ambas funciones filtran por resolved_at IS NOT NULL y la
-- global puede acotar por fecha (semanal). Parcial para no indexar pendientes.
CREATE INDEX IF NOT EXISTS predictions_resolved_user_idx
  ON public.predictions (resolved_at, user_id)
  WHERE resolved_at IS NOT NULL;
