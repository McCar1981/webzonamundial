-- ============================================================================
-- Predicciones — Pronóstico de "mejores terceros" conectado a la cuenta
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- El mini-juego de /grupos/mejores-terceros ("marca los 8 terceros que crees
-- que pasan a dieciseisavos") es anónimo y vive en localStorage
-- (zm:pronostico-terceros:v1 = array de letras de grupo). Esta mejora permite
-- que un usuario AUTENTICADO guarde ese pronóstico en su cuenta tras
-- registrarse, cerrando el bucle de conversión de la landing #1 de tráfico.
-- Mismo patrón que prediction_bracket (2026-08).
--
--   - prediction_terceros: el pronóstico del usuario (las letras de grupo cuyos
--     terceros cree que se clasifican). Lo escribe el propio usuario; no otorga
--     recompensas ni coins: solo guarda su predicción.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prediction_terceros (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  groups     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array de letras de grupo ["A","C","F",...] (1..8)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security: el usuario gestiona su propio pronóstico (CRUD propio).
-- ============================================================================
ALTER TABLE public.prediction_terceros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "terceros read own"   ON public.prediction_terceros;
DROP POLICY IF EXISTS "terceros insert own" ON public.prediction_terceros;
DROP POLICY IF EXISTS "terceros update own" ON public.prediction_terceros;
CREATE POLICY "terceros read own"   ON public.prediction_terceros FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "terceros insert own" ON public.prediction_terceros FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "terceros update own" ON public.prediction_terceros FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
