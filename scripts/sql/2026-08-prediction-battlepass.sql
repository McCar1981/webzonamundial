-- ============================================================================
-- Predicciones — Battle Pass de temporada (mejora E)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- Una "temporada" es una ventana rodante de 30 días. El usuario llena una pista
-- de recompensas con XP de TEMPORADA (separado del XP de por vida): cada nivel
-- desbloquea recompensas en un tramo gratis y otro premium (Founders). El bonus
-- de jornada premia predecir TODOS los partidos de un mismo día.
--
-- Las escrituras de XP de temporada y los pagos los hace el backend con la
-- SERVICE ROLE KEY (bypassa RLS) durante la resolución/creación; el usuario solo
-- lee lo suyo y reclama recompensas ya desbloqueadas (validado por el backend).
-- ============================================================================

-- --- XP de temporada por usuario --------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_season_xp (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_key  VARCHAR(20) NOT NULL,        -- "S{indice}" desde el ancla
  xp          INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, season_key)
);

-- --- Recompensas de pista reclamadas ----------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_battlepass_claims (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_key  VARCHAR(20) NOT NULL,
  tier        INTEGER NOT NULL,
  track       VARCHAR(10) NOT NULL,        -- free | premium
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, season_key, tier, track)
);

-- --- Bonus de jornada (un cobro por día completado) -------------------------
CREATE TABLE IF NOT EXISTS public.prediction_jornada_claims (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key      DATE NOT NULL,              -- fecha de la jornada (UTC)
  reward_xp    INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  claimed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_key)
);

-- ============================================================================
-- Row Level Security: lectura propia; las escrituras las hace el backend.
-- ============================================================================
ALTER TABLE public.prediction_season_xp           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_battlepass_claims    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_jornada_claims       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "season xp read own" ON public.prediction_season_xp;
CREATE POLICY "season xp read own" ON public.prediction_season_xp FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bp claims read own" ON public.prediction_battlepass_claims;
CREATE POLICY "bp claims read own" ON public.prediction_battlepass_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "jornada claims read own" ON public.prediction_jornada_claims;
CREATE POLICY "jornada claims read own" ON public.prediction_jornada_claims FOR SELECT USING (auth.uid() = user_id);
