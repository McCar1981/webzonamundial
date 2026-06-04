-- ============================================================================
-- Predicciones — Cosméticos / sumidero de monedas (mejora G)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- Los cosméticos (marcos de avatar, colores de nombre y títulos) se COMPRAN con
-- Fútcoins y se LUCEN en rankings y ligas. No dan ventaja competitiva: su único
-- fin es dar salida a las monedas acumuladas (coin sink) y crear prestigio.
--
--   - prediction_cosmetics_owned: qué cosméticos posee cada usuario. La compra
--     la valida y escribe el backend (service role) tras descontar las monedas;
--     el usuario solo LEE su inventario (no puede auto-otorgarse cosméticos).
--   - profiles.cosmetic_*: el cosmético EQUIPADO de cada tipo (lo que se muestra).
--     Lo gestiona el backend al equipar/desequipar.
-- ============================================================================

-- --- Inventario de cosméticos por usuario ------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_cosmetics_owned (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id  TEXT NOT NULL,
  acquired_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetics_owned_user ON public.prediction_cosmetics_owned (user_id);

-- --- Cosméticos equipados (lo que se muestra en rankings/ligas) ---------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cosmetic_frame      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cosmetic_name_color TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cosmetic_title      TEXT;

-- ============================================================================
-- Row Level Security
--   - prediction_cosmetics_owned: lectura propia; la escritura (compra) la hace
--     el backend con service role (bypassa RLS) tras descontar las monedas.
-- ============================================================================
ALTER TABLE public.prediction_cosmetics_owned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetics owned read own" ON public.prediction_cosmetics_owned;
CREATE POLICY "cosmetics owned read own" ON public.prediction_cosmetics_owned FOR SELECT USING (auth.uid() = user_id);
