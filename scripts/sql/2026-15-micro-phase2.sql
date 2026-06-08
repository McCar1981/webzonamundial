-- ============================================================================
-- Micro-predicciones — Fase 2 (Duelo en Vivo)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- Categoría C (IA) y Modo Fantasma NO necesitan tablas nuevas:
--   · IA      → reusa micro_predictions (category='ai', kind='ai_*'); las columnas
--               son VARCHAR sin enum, así que aceptan los nuevos valores tal cual.
--   · Fantasma→ reusa micro_responses (columna `ghost` ya existe en 2026-14).
--
-- Solo el Duelo en Vivo necesita tabla propia: reto 1v1 a nivel de PARTIDO donde
-- gana quien sume más puntos de micro-predicciones. Mismo patrón que
-- prediction_duels. La resolución (puntos, ganador, pago) la hace el backend con
-- service role al finalizar el partido.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.micro_duels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id          VARCHAR(50) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | active | resolved | declined
  challenger_points INTEGER,
  opponent_points   INTEGER,
  winner_id         UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

-- Duelos de un jugador (retados y recibidos).
CREATE INDEX IF NOT EXISTS micro_duels_players_idx
  ON public.micro_duels (challenger_id, opponent_id);

-- El cron de resolución busca los activos por partido.
CREATE INDEX IF NOT EXISTS micro_duels_match_active_idx
  ON public.micro_duels (match_id) WHERE status = 'active';

-- Un único duelo VIVO (pendiente o activo) por par y partido.
CREATE UNIQUE INDEX IF NOT EXISTS micro_duels_live_uniq
  ON public.micro_duels (challenger_id, opponent_id, match_id)
  WHERE status IN ('pending', 'active');

-- ============================================================================
-- Row Level Security: cada usuario LEE los duelos en los que participa. La
-- creación/respuesta/resolución pasan por el backend con service role (bypassa
-- RLS), igual que prediction_duels.
-- ============================================================================
ALTER TABLE public.micro_duels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "micro duels read own" ON public.micro_duels;
CREATE POLICY "micro duels read own"
  ON public.micro_duels FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
