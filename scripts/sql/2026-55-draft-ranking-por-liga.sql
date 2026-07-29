-- 2026-55 · Draft de Ligas — ranking POR LIGA
-- ============================================================================
-- Hoy el ranking del Draft es MAX(puntaje) global: un hincha del Caracas
-- (mejor once ~80) compite en la misma tabla contra el Real Madrid del 60
-- (~97). Con la liga como unidad, cada afición tiene su propia tabla ganable
-- — clave pan-LATAM (Ecuador ~50% de la audiencia).
--
-- Idempotente y NO destructiva: la columna es NULLABLE (partidas viejas y
-- las que no traen liga quedan en NULL y siguen contando en el ranking global,
-- que no cambia). Se AÑADEN overloads de 3 args a las RPCs; las de 2 args
-- (global) se conservan intactas, así el código que aún no manda liga sigue
-- funcionando igual.
-- ============================================================================

-- 1) Columna liga en los resultados (slug de la competición: 'laliga', 'liga-futve'…)
ALTER TABLE public.draft_results
  ADD COLUMN IF NOT EXISTS liga TEXT;

-- Índice para el ranking filtrado por liga (mejores puntajes de cada liga)
CREATE INDEX IF NOT EXISTS draft_results_liga_score_idx
  ON public.draft_results (liga, puntaje DESC, created_at DESC);

-- 2) Ranking filtrable por liga. Overload de 3 args: si p_liga es NULL, se
--    comporta EXACTAMENTE como el global; si trae un slug, filtra por esa liga.
CREATE OR REPLACE FUNCTION public.draft_ranking(
  p_limit  INTEGER DEFAULT 50,
  p_period TEXT DEFAULT 'all',   -- 'week' | 'month' | 'all'
  p_liga   TEXT DEFAULT NULL     -- NULL = todas las ligas (global)
)
RETURNS TABLE (
  user_id UUID,
  best_score INTEGER,
  best_calificacion TEXT,
  games_played BIGINT,
  username TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best_per_user AS (
    SELECT
      dr.user_id,
      MAX(dr.puntaje) AS best_score,
      COUNT(*) AS games_played
    FROM public.draft_results dr
    WHERE (p_liga IS NULL OR dr.liga = p_liga)
      AND CASE p_period
        WHEN 'week'  THEN dr.created_at > NOW() - INTERVAL '7 days'
        WHEN 'month' THEN dr.created_at > NOW() - INTERVAL '30 days'
        ELSE TRUE
      END
    GROUP BY dr.user_id
  )
  SELECT
    bpu.user_id,
    bpu.best_score::INTEGER,
    (
      SELECT calificacion FROM public.draft_results
      WHERE user_id = bpu.user_id AND puntaje = bpu.best_score
        AND (p_liga IS NULL OR liga = p_liga)
      ORDER BY created_at DESC LIMIT 1
    ) AS best_calificacion,
    bpu.games_played,
    p.username,
    p.avatar_url
  FROM best_per_user bpu
  LEFT JOIN public.profiles p ON p.id = bpu.user_id
  ORDER BY bpu.best_score DESC, bpu.games_played DESC
  LIMIT GREATEST(1, LEAST(200, p_limit));
$$;

REVOKE ALL ON FUNCTION public.draft_ranking(INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draft_ranking(INTEGER, TEXT, TEXT) TO service_role;

-- 3) Posición del usuario, también filtrable por liga (overload de 3 args).
CREATE OR REPLACE FUNCTION public.draft_user_rank(
  p_uid    UUID,
  p_period TEXT DEFAULT 'all',
  p_liga   TEXT DEFAULT NULL
)
RETURNS TABLE (rank INTEGER, best_score INTEGER, games_played BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      user_id,
      MAX(puntaje) AS best_score,
      COUNT(*) AS games_played,
      ROW_NUMBER() OVER (ORDER BY MAX(puntaje) DESC, COUNT(*) DESC) AS rnk
    FROM public.draft_results
    WHERE (p_liga IS NULL OR liga = p_liga)
      AND CASE p_period
        WHEN 'week'  THEN created_at > NOW() - INTERVAL '7 days'
        WHEN 'month' THEN created_at > NOW() - INTERVAL '30 days'
        ELSE TRUE
      END
    GROUP BY user_id
  )
  SELECT rnk::INTEGER, best_score::INTEGER, games_played
  FROM ranked WHERE user_id = p_uid;
$$;

REVOKE ALL ON FUNCTION public.draft_user_rank(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draft_user_rank(UUID, TEXT, TEXT) TO service_role;

-- FIN 2026-55
