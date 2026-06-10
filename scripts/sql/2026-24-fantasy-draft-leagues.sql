-- scripts/sql/2026-24-fantasy-draft-leagues.sql
--
-- LIGAS DRAFT (jugadores exclusivos) en las ligas privadas del Fantasy.
--
-- Regla de producto (Carlos, 2026-06-10): dentro de una liga Draft, si un
-- manager tiene a un jugador, NINGÚN otro miembro de esa liga puede tenerlo.
-- El primero que lo ficha (guarda su equipo con él) se lo queda; al venderlo,
-- salir de la liga o ser expulsado, el jugador queda libre.
--
-- Diseño: el equipo del usuario sigue siendo ÚNICO y global (fantasy_teams).
-- La exclusividad se materializa como CLAIMS por liga: una fila por
-- (liga, jugador) con su dueño. PK (league_id, player_id) = la exclusividad
-- la garantiza la base de datos, no el código. Para que las reglas de dos
-- ligas no entren en conflicto sobre un mismo equipo global, cada usuario
-- puede estar EN UNA SOLA liga Draft a la vez (tope en código).
--
-- Dependencias: 2026-09 (tablas base) y 2026-22 (función
-- is_fantasy_league_member). Idempotente: reaplicable sin romper nada.

-- ============================================================================
-- 1) Marca de liga Draft
-- ============================================================================
ALTER TABLE public.fantasy_leagues
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 2) Claims: qué jugador pertenece a qué manager DENTRO de cada liga
-- ============================================================================
-- player_id es el id del dataset estático de jugadores (src/lib/fantasy/players).
-- ON DELETE CASCADE: borrar la liga libera todos sus claims; borrar al usuario
-- (baja de cuenta) libera los suyos.
CREATE TABLE IF NOT EXISTS public.fantasy_league_player_claims (
  league_id  UUID NOT NULL REFERENCES public.fantasy_leagues(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, player_id)
);
CREATE INDEX IF NOT EXISTS fantasy_claims_league_user_idx
  ON public.fantasy_league_player_claims (league_id, user_id);
CREATE INDEX IF NOT EXISTS fantasy_claims_user_idx
  ON public.fantasy_league_player_claims (user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Lectura: los miembros de la liga ven sus claims (para pintar el mercado).
-- Escritura: SOLO el service role (las escrituras pasan por el backend, que
-- aplica primero-que-llega con INSERT ... ON CONFLICT DO NOTHING). Sin policies
-- de INSERT/UPDATE/DELETE, el cliente autenticado no puede falsear claims.
ALTER TABLE public.fantasy_league_player_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fantasy claims read member" ON public.fantasy_league_player_claims;
CREATE POLICY "fantasy claims read member" ON public.fantasy_league_player_claims FOR SELECT
  USING (public.is_fantasy_league_member(league_id, auth.uid()));
