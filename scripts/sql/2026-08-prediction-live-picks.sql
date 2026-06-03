-- ============================================================================
-- Predicciones — Micro-picks en vivo (durante el partido)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- Apuestas ligeras y de alta frecuencia que se crean y resuelven DURANTE el
-- partido (p.ej. "¿gol en los próximos 10 min?"). Viven en su propia tabla para
-- no contaminar la unicidad por tipo ni la lógica de partido perfecto de
-- `predictions`. La resolución la hace el backend (service role) con eventos
-- autoritativos del Match Center; el usuario solo lee y crea los suyos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prediction_live_picks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id       VARCHAR(50) NOT NULL,
  market         VARCHAR(40) NOT NULL,   -- next_goal | next_event | next_team
  choice         VARCHAR(40) NOT NULL,   -- yes/no | goal/card/corner/none | home/away/none
  open_minute    INTEGER NOT NULL,       -- minuto de juego en que se creó
  resolve_minute INTEGER NOT NULL,       -- minuto en que se resuelve
  status         VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | won | lost
  reward_coins   INTEGER NOT NULL DEFAULT 0,
  reward_xp      INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS prediction_live_picks_user_match_idx
  ON public.prediction_live_picks (user_id, match_id);

-- Un único pick PENDIENTE por (usuario, partido, mercado).
CREATE UNIQUE INDEX IF NOT EXISTS prediction_live_picks_pending_uniq
  ON public.prediction_live_picks (user_id, match_id, market)
  WHERE status = 'pending';

-- ============================================================================
-- Row Level Security: lectura/creación propia. La resolución (update de status
-- y pago de recompensa) la hace el backend con service role (bypassa RLS).
-- ============================================================================
ALTER TABLE public.prediction_live_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live picks read own"   ON public.prediction_live_picks;
DROP POLICY IF EXISTS "live picks insert own" ON public.prediction_live_picks;
CREATE POLICY "live picks read own"   ON public.prediction_live_picks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "live picks insert own" ON public.prediction_live_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
