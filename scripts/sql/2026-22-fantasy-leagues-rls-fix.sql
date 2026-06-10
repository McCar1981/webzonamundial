-- scripts/sql/2026-22-fantasy-leagues-rls-fix.sql
--
-- Arregla una BOMBA LATENTE en las policies de las ligas privadas del Fantasy.
--
-- La policy de lectura de fantasy_league_members (2026-09-fantasy.sql) hacía un
-- `SELECT ... FROM fantasy_league_members m2` DENTRO de su propia cláusula
-- USING. Postgres evalúa esa subconsulta sujeta a la MISMA policy → recursión:
--   ERROR: infinite recursion detected in policy for relation
--          "fantasy_league_members"
-- La policy "read member" de fantasy_leagues arrastraba el problema porque
-- referenciaba esa tabla.
--
-- Hoy está DORMIDO: todo el módulo lee con el service role (adminClient), que
-- bypassa RLS. Pero cualquier lectura futura con el cliente autenticado (anon)
-- reventaría con 500. Lo cerramos ya.
--
-- Fix: una función SECURITY DEFINER comprueba la membresía SIN disparar RLS (se
-- ejecuta como su dueño, que no está sujeto a las policies), de modo que la
-- policy ya no se auto-referencia. Idempotente (CREATE OR REPLACE / DROP POLICY).

-- ============================================================================
-- Helper: ¿es miembro de la liga? — SECURITY DEFINER (no dispara RLS).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_fantasy_league_member(p_league_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fantasy_league_members m
    WHERE m.league_id = p_league_id AND m.user_id = p_user
  );
$$;

-- Solo usuarios autenticados pueden invocarla (se usa dentro de las policies).
REVOKE ALL ON FUNCTION public.is_fantasy_league_member(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_fantasy_league_member(uuid, uuid) TO authenticated;

-- ============================================================================
-- Reemplaza las policies recursivas por la versión basada en la función.
-- ============================================================================
DROP POLICY IF EXISTS "fantasy members read" ON public.fantasy_league_members;
CREATE POLICY "fantasy members read" ON public.fantasy_league_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_fantasy_league_member(league_id, auth.uid())
  );

DROP POLICY IF EXISTS "fantasy leagues read member" ON public.fantasy_leagues;
CREATE POLICY "fantasy leagues read member" ON public.fantasy_leagues FOR SELECT
  USING (
    auth.uid() = owner_id
    OR public.is_fantasy_league_member(id, auth.uid())
  );
