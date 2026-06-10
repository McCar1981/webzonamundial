-- scripts/sql/2026-28-powerups.sql
--
-- Comodines de pago (microtransacciones Stripe, one-off):
--   · second_chance — cambiar una predicción ya cerrada (hasta el descanso)
--   · double_down   — duplicar los puntos de TODAS tus predicciones de un partido
--   · trivia_revive — revivir una partida de Muerte Súbita conservando la racha
--
-- La fila se crea 'pending' al abrir el Checkout; el webhook de Stripe la pasa a
-- 'applied' tras aplicar el efecto (o a 'failed' + refund automático si la
-- ventana de elegibilidad se cerró mientras el usuario pagaba). 'consumed' lo
-- marca la resolución del partido (double_down). 'refunded' lo marca el evento
-- charge.refunded / dispute.
--
-- Idempotente: se puede reaplicar sin romper.

CREATE TABLE IF NOT EXISTS public.powerup_purchases (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sku                      TEXT NOT NULL CHECK (sku IN ('second_chance', 'double_down', 'trivia_revive')),
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'applied', 'consumed', 'failed', 'refunded')),
  -- Contexto del efecto (según sku)
  match_id                 TEXT,
  prediction_id            UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  trivia_session_id        TEXT,
  -- second_chance: el nuevo pick (validado server-side al crear el checkout)
  payload                  JSONB,
  -- Pago
  amount                   INTEGER NOT NULL,
  currency                 TEXT NOT NULL,
  stripe_session_id        TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  error                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                  TIMESTAMPTZ,
  applied_at               TIMESTAMPTZ,
  consumed_at              TIMESTAMPTZ,
  refunded_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS powerup_purchases_user_idx
  ON public.powerup_purchases (user_id, created_at DESC);

-- La resolución del partido busca los double_down activos del match.
CREATE INDEX IF NOT EXISTS powerup_purchases_match_idx
  ON public.powerup_purchases (match_id, sku, status);

-- Un único "Partido x2" efectivo por usuario y partido.
CREATE UNIQUE INDEX IF NOT EXISTS powerup_double_down_unique
  ON public.powerup_purchases (user_id, match_id)
  WHERE sku = 'double_down' AND status IN ('applied', 'consumed');

-- Una única "Segunda Oportunidad" efectiva por predicción.
CREATE UNIQUE INDEX IF NOT EXISTS powerup_second_chance_unique
  ON public.powerup_purchases (user_id, prediction_id)
  WHERE sku = 'second_chance' AND status = 'applied';

-- RLS: el usuario LEE sus compras; escribe SOLO el service role (checkout,
-- webhook y resolución usan el cliente admin).
ALTER TABLE public.powerup_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS powerup_purchases_select_own ON public.powerup_purchases;
CREATE POLICY powerup_purchases_select_own
  ON public.powerup_purchases FOR SELECT
  USING (auth.uid() = user_id);
