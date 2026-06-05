-- scripts/sql/2026-09-fantasy.sql
--
-- Backend REAL del Fantasy Mundial (Fase 1 + Fase 2). Hasta ahora el equipo del
-- usuario vivía solo en localStorage y las ligas/ranking eran simulados (bots).
-- Esta migración añade:
--   1) fantasy_teams            → el equipo de cada usuario (1 por usuario).
--   2) fantasy_gameweek_scores  → puntos por jornada (ranking semanal + auditoría).
--   3) fantasy_leagues / _members → ligas privadas con código (managers REALES).
--
-- Patrón idéntico a las Predicciones: el usuario lee/escribe lo suyo con RLS;
-- el ranking global, el semanal y la clasificación de liga cruzan usuarios y se
-- calculan con el cliente admin (SERVICE ROLE KEY) que bypassa RLS.
--
-- Idempotente: se puede reaplicar sin romper nada (IF NOT EXISTS / DROP POLICY).

-- ============================================================================
-- 1) Equipo del usuario (uno por usuario)
-- ============================================================================
-- `state` guarda el FantasyTeamState completo (slots, capitán, chips, banco…).
-- team_name / total_points / gameweek se duplican como columnas para poder
-- ordenar el ranking sin tener que parsear el JSONB.
CREATE TABLE IF NOT EXISTS public.fantasy_teams (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name    VARCHAR(40) NOT NULL DEFAULT 'Mi Selección',
  state        JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_points INTEGER NOT NULL DEFAULT 0,
  gameweek     INTEGER NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fantasy_teams_points_idx
  ON public.fantasy_teams (total_points DESC);

-- ============================================================================
-- 2) Puntos por jornada (ranking semanal + historial verificable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fantasy_gameweek_scores (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gameweek   INTEGER NOT NULL,
  points     INTEGER NOT NULL DEFAULT 0,
  power_up   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, gameweek)
);
CREATE INDEX IF NOT EXISTS fantasy_gw_scores_gw_idx
  ON public.fantasy_gameweek_scores (gameweek, points DESC);

-- ============================================================================
-- 3) Ligas privadas con código (managers reales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fantasy_leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60) NOT NULL,
  code        VARCHAR(10) NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fantasy_league_members (
  league_id  UUID NOT NULL REFERENCES public.fantasy_leagues(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX IF NOT EXISTS fantasy_league_members_user_idx
  ON public.fantasy_league_members (user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.fantasy_teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_gameweek_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_leagues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_league_members  ENABLE ROW LEVEL SECURITY;

-- Equipo: el usuario lee y gestiona el suyo. (El ranking lo lee el service role.)
DROP POLICY IF EXISTS "fantasy team read own"   ON public.fantasy_teams;
DROP POLICY IF EXISTS "fantasy team insert own" ON public.fantasy_teams;
DROP POLICY IF EXISTS "fantasy team update own" ON public.fantasy_teams;
CREATE POLICY "fantasy team read own"   ON public.fantasy_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fantasy team insert own" ON public.fantasy_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fantasy team update own" ON public.fantasy_teams FOR UPDATE USING (auth.uid() = user_id);

-- Puntos por jornada: lectura propia (la escritura la hace el backend service role).
DROP POLICY IF EXISTS "fantasy gw read own"   ON public.fantasy_gameweek_scores;
DROP POLICY IF EXISTS "fantasy gw insert own" ON public.fantasy_gameweek_scores;
DROP POLICY IF EXISTS "fantasy gw update own" ON public.fantasy_gameweek_scores;
CREATE POLICY "fantasy gw read own"   ON public.fantasy_gameweek_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fantasy gw insert own" ON public.fantasy_gameweek_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fantasy gw update own" ON public.fantasy_gameweek_scores FOR UPDATE USING (auth.uid() = user_id);

-- Ligas: lectura para miembros; creación por cualquiera autenticado (como dueño).
DROP POLICY IF EXISTS "fantasy leagues read member"  ON public.fantasy_leagues;
DROP POLICY IF EXISTS "fantasy leagues insert owner" ON public.fantasy_leagues;
CREATE POLICY "fantasy leagues read member" ON public.fantasy_leagues FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.fantasy_league_members m WHERE m.league_id = id AND m.user_id = auth.uid())
  );
CREATE POLICY "fantasy leagues insert owner" ON public.fantasy_leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Miembros de liga: el usuario gestiona su propia membresía.
DROP POLICY IF EXISTS "fantasy members read"  ON public.fantasy_league_members;
DROP POLICY IF EXISTS "fantasy members join"  ON public.fantasy_league_members;
DROP POLICY IF EXISTS "fantasy members leave" ON public.fantasy_league_members;
CREATE POLICY "fantasy members read"  ON public.fantasy_league_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.fantasy_league_members m2 WHERE m2.league_id = league_id AND m2.user_id = auth.uid())
);
CREATE POLICY "fantasy members join"  ON public.fantasy_league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fantasy members leave" ON public.fantasy_league_members FOR DELETE USING (auth.uid() = user_id);
