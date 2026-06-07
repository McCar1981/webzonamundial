-- scripts/sql/2026-16-economy-claims.sql
--
-- Economía UNIFICADA (Fútcoins): marcas de "ya cobrado" para que cada módulo
-- abone Fútcoins a profiles.coins UNA sola vez por evento. Hasta ahora solo
-- Predicciones, Micro y la Trivia (esta última con guarda en KV) abonaban a la
-- billetera; esta migración añade los anclajes de idempotencia para enganchar
-- Fantasy y Modo Carrera a la MISMA billetera (profiles.coins / profiles.xp).
--
-- Patrón idéntico al resto: el usuario LEE lo suyo con RLS; el backend ESCRIBE
-- con el cliente admin (SERVICE ROLE KEY) que bypassa RLS, tras validar la sesión.
--
-- Idempotente: se puede reaplicar sin romper nada (IF NOT EXISTS / DROP POLICY).

-- ============================================================================
-- 1) Fantasy — Fútcoins cobradas por jornada (una por usuario y jornada)
-- ============================================================================
-- La existencia de la fila (PK user_id,gameweek) es la garantía de pago único:
-- el backend hace INSERT ... ON CONFLICT DO NOTHING y solo abona si insertó.
CREATE TABLE IF NOT EXISTS public.fantasy_coin_claims (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gameweek     INTEGER NOT NULL,
  coins        INTEGER NOT NULL DEFAULT 0,
  xp           INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, gameweek)
);

-- ============================================================================
-- 2) Modo Carrera — Fútcoins cobradas por misión reclamada (una por misión)
-- ============================================================================
-- mission_id es estable por ciclo (`key#cycle`, p.ej. victoria_semanal#2026-W23),
-- así que (user_id, mission_id) identifica una recompensa irrepetible.
CREATE TABLE IF NOT EXISTS public.modo_carrera_mission_claims (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id   TEXT NOT NULL,
  mission_key  TEXT NOT NULL,
  coins        INTEGER NOT NULL DEFAULT 0,
  xp           INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, mission_id)
);
CREATE INDEX IF NOT EXISTS modo_carrera_mission_claims_user_idx
  ON public.modo_carrera_mission_claims (user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.fantasy_coin_claims          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modo_carrera_mission_claims  ENABLE ROW LEVEL SECURITY;

-- Lectura propia (para mostrar el historial de cobros si hiciera falta). La
-- escritura la hace SIEMPRE el backend con service role, que bypassa RLS.
DROP POLICY IF EXISTS "fantasy coin claims read own" ON public.fantasy_coin_claims;
CREATE POLICY "fantasy coin claims read own"
  ON public.fantasy_coin_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "career mission claims read own" ON public.modo_carrera_mission_claims;
CREATE POLICY "career mission claims read own"
  ON public.modo_carrera_mission_claims FOR SELECT USING (auth.uid() = user_id);
