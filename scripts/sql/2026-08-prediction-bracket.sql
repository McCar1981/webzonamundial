-- ============================================================================
-- Predicciones — Bracket conectado a la cuenta (mejora F)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- El Bracket Challenge (/bracket) es anónimo y vive en localStorage. Esta mejora
-- permite que un usuario AUTENTICADO guarde su bracket en su cuenta, que el
-- backend lo PUNTÚE contra los resultados reales del torneo (acierto de equipos
-- que alcanzan cada ronda + campeón), y que esos puntos cuenten en las ligas.
--
--   - prediction_bracket: el BORRADOR del usuario (picks + campeón). Lo escribe
--     el propio usuario (no otorga recompensas: solo guarda sus predicciones).
--   - prediction_bracket_score: la PUNTUACIÓN, escrita SOLO por el backend
--     (service role) al graduar el bracket contra la realidad. El usuario solo
--     la lee (no puede inflar sus puntos de liga).
-- ============================================================================

-- --- Borrador del bracket por usuario (un bracket por torneo) ----------------
CREATE TABLE IF NOT EXISTS public.prediction_bracket (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  picks       JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Record<matchId, Pick>
  champion    TEXT,                                  -- team id del campeón
  total_goals INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Puntuación del bracket (escrita por el backend) ------------------------
CREATE TABLE IF NOT EXISTS public.prediction_bracket_score (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL DEFAULT 0,
  reached_counts   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- aciertos por ronda
  champion_correct BOOLEAN NOT NULL DEFAULT FALSE,
  scored_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security
--   - prediction_bracket: el usuario gestiona su propio borrador (CRUD propio).
--   - prediction_bracket_score: lectura propia; la escritura la hace el backend
--     con service role (bypassa RLS).
-- ============================================================================
ALTER TABLE public.prediction_bracket       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_bracket_score ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bracket read own"   ON public.prediction_bracket;
DROP POLICY IF EXISTS "bracket insert own" ON public.prediction_bracket;
DROP POLICY IF EXISTS "bracket update own" ON public.prediction_bracket;
CREATE POLICY "bracket read own"   ON public.prediction_bracket FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bracket insert own" ON public.prediction_bracket FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bracket update own" ON public.prediction_bracket FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bracket score read own" ON public.prediction_bracket_score;
CREATE POLICY "bracket score read own" ON public.prediction_bracket_score FOR SELECT USING (auth.uid() = user_id);
