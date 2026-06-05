-- scripts/sql/2026-10-modo-carrera.sql
--
-- Backend del MODO CARRERA (estilo FIFA Career Mode). El usuario crea un DT
-- (director técnico), adopta una de las 48 selecciones del Mundial 2026 y vive
-- una carrera con progresión, misiones, reputación, narrativa viva y legado.
--
-- Esta migración monta el esqueleto persistente:
--   1) modo_carrera_saves     → la partida (CareerState completo) de cada usuario.
--   2) modo_carrera_ranking   → snapshot de reputación/overall para el ranking DT.
--
-- Patrón idéntico a Fantasy/Predicciones: el usuario lee/escribe lo suyo con RLS;
-- el ranking DT cruza usuarios y se calcula con el cliente admin (SERVICE ROLE
-- KEY) que bypassa RLS.
--
-- Idempotente: se puede reaplicar sin romper nada (IF NOT EXISTS / DROP POLICY).

-- ============================================================================
-- 1) Partida del usuario (una por usuario)
-- ============================================================================
-- `state` guarda el CareerState completo (identidad DT, progresión, árbol de
-- habilidades, misiones, reputación, narrativa, legado). Las columnas
-- dt_name / nation_slug / overall / reputation / season se duplican para poder
-- ordenar el ranking y filtrar sin parsear el JSONB.
CREATE TABLE IF NOT EXISTS public.modo_carrera_saves (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dt_name      VARCHAR(40) NOT NULL DEFAULT 'Nuevo DT',
  nation_slug  VARCHAR(60),
  philosophy   VARCHAR(40),
  overall      INTEGER NOT NULL DEFAULT 50,
  reputation   INTEGER NOT NULL DEFAULT 0,
  season       INTEGER NOT NULL DEFAULT 1,
  state        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS modo_carrera_saves_overall_idx
  ON public.modo_carrera_saves (overall DESC);
CREATE INDEX IF NOT EXISTS modo_carrera_saves_reputation_idx
  ON public.modo_carrera_saves (reputation DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.modo_carrera_saves ENABLE ROW LEVEL SECURITY;

-- Partida: el usuario lee y gestiona la suya. (El ranking lo lee el service role.)
DROP POLICY IF EXISTS "carrera save read own"   ON public.modo_carrera_saves;
DROP POLICY IF EXISTS "carrera save insert own" ON public.modo_carrera_saves;
DROP POLICY IF EXISTS "carrera save update own" ON public.modo_carrera_saves;
DROP POLICY IF EXISTS "carrera save delete own" ON public.modo_carrera_saves;
CREATE POLICY "carrera save read own"   ON public.modo_carrera_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "carrera save insert own" ON public.modo_carrera_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carrera save update own" ON public.modo_carrera_saves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "carrera save delete own" ON public.modo_carrera_saves FOR DELETE USING (auth.uid() = user_id);
