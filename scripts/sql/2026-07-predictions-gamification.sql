-- ============================================================================
-- Predicciones — Gamificación (6 mejoras)
-- Aplicar en el SQL editor de Supabase. Idempotente (IF NOT EXISTS / DROP+CREATE).
--
-- Cubre:
--   1) Rachas reales        → profiles.current_streak / best_streak
--   2) Bucle diario         → prediction_daily_claims, prediction_challenge_progress
--   3) Progresión           → profiles.xp/level + prediction_achievements
--   4) Competencia social   → prediction_leagues / _members, prediction_duels
--   5) Recompensa variable  → cofres se entregan vía coins/xp (sin tabla extra)
--   6) Economía             → profiles.coins + prediction_boosts (inventario)
--
-- Las escrituras de progresión las hace el backend con la SERVICE ROLE KEY
-- (bypassa RLS) durante la resolución; el usuario solo lee lo suyo.
-- ============================================================================

-- --- Columnas de gamificación en profiles ------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp                INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin      DATE,
  ADD COLUMN IF NOT EXISTS checkin_days      INTEGER NOT NULL DEFAULT 0,
  -- Caducidad de racha por inactividad (cuenta atrás "vuelve o pierdes tu racha").
  ADD COLUMN IF NOT EXISTS streak_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_anchor     TIMESTAMPTZ;

-- ============================================================================
-- 3) Logros desbloqueados
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prediction_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS prediction_achievements_user_idx
  ON public.prediction_achievements (user_id);

-- ============================================================================
-- 6) Inventario de boosts (consumibles comprados/ganados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prediction_boosts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boost_id    VARCHAR(50) NOT NULL,        -- double_next | shield | streak_freeze | ...
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,                 -- null = disponible
  applied_to  UUID REFERENCES public.predictions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS prediction_boosts_user_idx
  ON public.prediction_boosts (user_id) WHERE consumed_at IS NULL;

-- ============================================================================
-- 2) Bucle diario — check-in y progreso de reto
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prediction_daily_claims (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key     DATE NOT NULL,              -- YYYY-MM-DD (UTC)
  reward_coins INTEGER NOT NULL DEFAULT 0,
  reward_xp    INTEGER NOT NULL DEFAULT 0,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_key)
);

CREATE TABLE IF NOT EXISTS public.prediction_challenge_progress (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key      DATE NOT NULL,
  challenge_key VARCHAR(50) NOT NULL,
  progress     INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, day_key)
);

-- ============================================================================
-- 4) Competencia social — ligas privadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prediction_leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60) NOT NULL,
  code        VARCHAR(10) NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prediction_league_members (
  league_id  UUID NOT NULL REFERENCES public.prediction_leagues(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX IF NOT EXISTS prediction_league_members_user_idx
  ON public.prediction_league_members (user_id);

-- 4) Duelos 1v1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duel_status') THEN
    CREATE TYPE duel_status AS ENUM ('pending', 'active', 'resolved', 'declined');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.prediction_duels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id      VARCHAR(50) NOT NULL,
  status        duel_status NOT NULL DEFAULT 'pending',
  challenger_points INTEGER,
  opponent_points   INTEGER,
  winner_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS prediction_duels_players_idx
  ON public.prediction_duels (challenger_id, opponent_id);
CREATE INDEX IF NOT EXISTS prediction_duels_match_idx
  ON public.prediction_duels (match_id) WHERE status = 'active';

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.prediction_achievements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_boosts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_daily_claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_challenge_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_leagues             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_league_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_duels               ENABLE ROW LEVEL SECURITY;

-- Logros: lectura propia.
DROP POLICY IF EXISTS "achievements read own" ON public.prediction_achievements;
CREATE POLICY "achievements read own" ON public.prediction_achievements FOR SELECT USING (auth.uid() = user_id);

-- Boosts: el usuario lee y compra los suyos (el gasto de monedas lo valida el backend).
DROP POLICY IF EXISTS "boosts read own"   ON public.prediction_boosts;
DROP POLICY IF EXISTS "boosts insert own" ON public.prediction_boosts;
DROP POLICY IF EXISTS "boosts update own" ON public.prediction_boosts;
CREATE POLICY "boosts read own"   ON public.prediction_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "boosts insert own" ON public.prediction_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "boosts update own" ON public.prediction_boosts FOR UPDATE USING (auth.uid() = user_id);

-- Daily claims / retos: lectura propia (escritura por backend service role).
DROP POLICY IF EXISTS "daily read own" ON public.prediction_daily_claims;
CREATE POLICY "daily read own" ON public.prediction_daily_claims FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "challenge read own" ON public.prediction_challenge_progress;
CREATE POLICY "challenge read own" ON public.prediction_challenge_progress FOR SELECT USING (auth.uid() = user_id);

-- Ligas: lectura para miembros; creación por cualquiera autenticado.
DROP POLICY IF EXISTS "leagues read member"  ON public.prediction_leagues;
DROP POLICY IF EXISTS "leagues insert owner" ON public.prediction_leagues;
CREATE POLICY "leagues read member" ON public.prediction_leagues FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.prediction_league_members m WHERE m.league_id = id AND m.user_id = auth.uid())
  );
CREATE POLICY "leagues insert owner" ON public.prediction_leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Miembros de liga: el usuario gestiona su propia membresía.
DROP POLICY IF EXISTS "league members read"   ON public.prediction_league_members;
DROP POLICY IF EXISTS "league members join"   ON public.prediction_league_members;
DROP POLICY IF EXISTS "league members leave"  ON public.prediction_league_members;
CREATE POLICY "league members read"  ON public.prediction_league_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.prediction_league_members m2 WHERE m2.league_id = league_id AND m2.user_id = auth.uid())
);
CREATE POLICY "league members join"  ON public.prediction_league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "league members leave" ON public.prediction_league_members FOR DELETE USING (auth.uid() = user_id);

-- Duelos: visibles para sus dos participantes; el retador crea.
DROP POLICY IF EXISTS "duels read party"     ON public.prediction_duels;
DROP POLICY IF EXISTS "duels insert"         ON public.prediction_duels;
DROP POLICY IF EXISTS "duels update party"   ON public.prediction_duels;
CREATE POLICY "duels read party"   ON public.prediction_duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "duels insert"       ON public.prediction_duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "duels update party" ON public.prediction_duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
