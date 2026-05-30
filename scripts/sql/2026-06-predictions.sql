-- ============================================================================
-- Predicciones (8 tipos) — esquema base
-- Aplicar en el SQL editor de Supabase. Idempotente (IF NOT EXISTS).
--
-- Tablas:
--   predictions             una fila por (usuario, partido, tipo)
--   prediction_chains       eslabones de las predicciones de tipo "chain"
--   prediction_social_stats agregado de votos por opción (tipo "social" / Manada)
--
-- Premium: se añade profiles.is_premium para el gating (cadenas largas, cambio
-- diario, predicción tardía).
-- ============================================================================

-- --- Premium flag en profiles -------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- --- Enum de tipos de predicción ---------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_type') THEN
    CREATE TYPE prediction_type AS ENUM (
      'exact_score', 'winner', 'first_scorer', 'chain',
      'duel', 'over_under', 'minute_drama', 'social'
    );
  END IF;
END$$;

-- --- Tabla principal ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.predictions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id                 VARCHAR(50) NOT NULL,
  prediction_type          prediction_type NOT NULL,
  prediction_data          JSONB NOT NULL,
  confidence_multiplier    INTEGER NOT NULL DEFAULT 1,   -- 1|2|3 (solo "winner")
  is_contrarian            BOOLEAN NOT NULL DEFAULT FALSE, -- tipo "social"
  -- Modo Underdog / Diamante
  match_multiplier         DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  points_before_multiplier INTEGER,                       -- null hasta resolución
  points_earned            INTEGER,                       -- null hasta resolución
  is_correct               BOOLEAN,                       -- null hasta resolución
  resolution_breakdown     TEXT,
  -- ciclo de vida
  changed_at               TIMESTAMPTZ,                   -- último cambio (premium)
  locked_at                TIMESTAMPTZ,
  resolved_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Una predicción por usuario/partido/tipo.
CREATE UNIQUE INDEX IF NOT EXISTS predictions_unique_type
  ON public.predictions (user_id, match_id, prediction_type);
CREATE INDEX IF NOT EXISTS predictions_match_idx
  ON public.predictions (match_id);
CREATE INDEX IF NOT EXISTS predictions_user_idx
  ON public.predictions (user_id);

-- --- Eslabones de cadena (tipo 4) --------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chain_event_type') THEN
    CREATE TYPE chain_event_type AS ENUM ('goal', 'card', 'halftime_score', 'winner');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.prediction_chains (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id     UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  step_number       INTEGER NOT NULL,            -- 1..7
  event_description VARCHAR(200) NOT NULL DEFAULT '',
  event_type        chain_event_type NOT NULL,
  event_data        JSONB NOT NULL,
  is_correct        BOOLEAN
);
CREATE INDEX IF NOT EXISTS prediction_chains_pred_idx
  ON public.prediction_chains (prediction_id);

-- --- Estadísticas sociales (tipo 8) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_social_stats (
  match_id         VARCHAR(50) NOT NULL,
  prediction_type  VARCHAR(50) NOT NULL,        -- "winner", "exact_score", ...
  option_key       VARCHAR(100) NOT NULL,       -- "home", "2-1", "<player_id>" ...
  vote_count       INTEGER NOT NULL DEFAULT 0,
  vote_percentage  DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, prediction_type, option_key)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.predictions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_chains      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_social_stats ENABLE ROW LEVEL SECURITY;

-- predictions: cada quien gestiona las suyas.
DROP POLICY IF EXISTS "predictions read own"   ON public.predictions;
DROP POLICY IF EXISTS "predictions insert own" ON public.predictions;
DROP POLICY IF EXISTS "predictions update own" ON public.predictions;
CREATE POLICY "predictions read own"   ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "predictions insert own" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions update own" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);

-- chains: legibles/escribibles si la predicción es del usuario.
DROP POLICY IF EXISTS "chains read own"   ON public.prediction_chains;
DROP POLICY IF EXISTS "chains insert own" ON public.prediction_chains;
CREATE POLICY "chains read own" ON public.prediction_chains FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.predictions p WHERE p.id = prediction_id AND p.user_id = auth.uid()));
CREATE POLICY "chains insert own" ON public.prediction_chains FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.predictions p WHERE p.id = prediction_id AND p.user_id = auth.uid()));

-- social_stats: lectura pública (no requiere auth).
DROP POLICY IF EXISTS "social stats public read" ON public.prediction_social_stats;
CREATE POLICY "social stats public read" ON public.prediction_social_stats FOR SELECT USING (TRUE);

-- NOTA: la resolución de partidos y la escritura de social_stats las hace el
-- backend con la SERVICE ROLE KEY (bypassa RLS), por eso no hay políticas de
-- escritura para anon/auth en social_stats ni de UPDATE de puntos por el usuario.
