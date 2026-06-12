-- scripts/sql/2026-33-draft-mundial.sql
--
-- Minijuego Draft Mundial: resultados + integración con economía unificada.
--
-- Tablas:
--   draft_results     → cada partida completada por un usuario
--   draft_claims      → marca de idempotencia (un solo claim por partida)
--
-- Integración:
--   · Agrega 'draft-mundial' al catálogo de módulos del coin_ledger
--   · Usa el mismo patrón de claims que fantasy y modo-carrera
--
-- Idempotente: CREATE TABLE IF NOT EXISTS; reaplicable sin romper.

-- ============================================================================
-- 1) Resultados de cada partida de Draft Mundial
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.draft_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formacion     TEXT NOT NULL,
  estilo        TEXT NOT NULL,
  modo          TEXT NOT NULL,
  puntaje       INTEGER NOT NULL,
  calificacion  TEXT NOT NULL,   -- Bronce | Plata | Oro | Platino | Leyenda
  fuerza        INTEGER NOT NULL DEFAULT 0,
  balance       INTEGER NOT NULL DEFAULT 0,
  coherencia    INTEGER NOT NULL DEFAULT 0,
  bonus_estilo  INTEGER NOT NULL DEFAULT 0,
  equipo        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de {posicion,nombre,seleccion,year,fuerza}
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ranking: mejores puntajes primero
CREATE INDEX IF NOT EXISTS draft_results_score_idx
  ON public.draft_results (puntaje DESC, created_at DESC);
-- Historial por usuario
CREATE INDEX IF NOT EXISTS draft_results_user_idx
  ON public.draft_results (user_id, created_at DESC);

-- ============================================================================
-- 2) Claims de idempotencia (un solo cobro por partida)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.draft_claims (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result_id    UUID NOT NULL REFERENCES public.draft_results(id) ON DELETE CASCADE,
  coins        INTEGER NOT NULL DEFAULT 0,
  xp           INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, result_id)
);

-- ============================================================================
-- 3) Extender catálogo de módulos del coin_ledger
-- ============================================================================
-- NOTA: PostgreSQL no permite ALTER TABLE ... ALTER COLUMN ... DROP CONSTRAINT
-- fácilmente sin saber el nombre del constraint. Usamos un workaround: recreamos
-- la restricción solo si 'draft-mundial' no está ya en el catálogo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coin_ledger' AND column_name = 'module'
  ) THEN
    -- Eliminar constraint CHECK existente (el nombre es generado, buscamos por patrón)
    EXECUTE (
      SELECT 'ALTER TABLE public.coin_ledger DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.coin_ledger'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%module%'
    );

    -- Re-crear con el catálogo extendido
    ALTER TABLE public.coin_ledger
      ADD CONSTRAINT coin_ledger_module_check
      CHECK (module IN (
        'predicciones', 'trivia', 'fantasy', 'modo-carrera',
        'micro', 'otros', 'draft-mundial'
      ));
  END IF;
END $$;

-- ============================================================================
-- 4) Row Level Security
-- ============================================================================
ALTER TABLE public.draft_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_claims    ENABLE ROW LEVEL SECURITY;

-- Usuario lee sus propios resultados
DROP POLICY IF EXISTS "draft results read own" ON public.draft_results;
CREATE POLICY "draft results read own"
  ON public.draft_results FOR SELECT USING (auth.uid() = user_id);

-- Usuario lee sus propios claims
DROP POLICY IF EXISTS "draft claims read own" ON public.draft_claims;
CREATE POLICY "draft claims read own"
  ON public.draft_claims FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 5) Función de ranking de Draft Mundial (por puntaje)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.draft_ranking(
  p_limit  INTEGER DEFAULT 50,
  p_period TEXT DEFAULT 'all'   -- 'week' | 'month' | 'all'
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
      MAX(dr.calificacion) AS best_calificacion,  -- simplificado: tomamos la del max puntaje
      COUNT(*) AS games_played
    FROM public.draft_results dr
    WHERE CASE p_period
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

REVOKE ALL ON FUNCTION public.draft_ranking(INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draft_ranking(INTEGER, TEXT) TO service_role;

-- Posición de un usuario en el ranking de draft
CREATE OR REPLACE FUNCTION public.draft_user_rank(
  p_uid    UUID,
  p_period TEXT DEFAULT 'all'
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
    WHERE CASE p_period
      WHEN 'week'  THEN created_at > NOW() - INTERVAL '7 days'
      WHEN 'month' THEN created_at > NOW() - INTERVAL '30 days'
      ELSE TRUE
    END
    GROUP BY user_id
  )
  SELECT rnk::INTEGER, best_score::INTEGER, games_played
  FROM ranked WHERE user_id = p_uid;
$$;

REVOKE ALL ON FUNCTION public.draft_user_rank(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draft_user_rank(UUID, TEXT) TO service_role;
