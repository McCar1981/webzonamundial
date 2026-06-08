-- ============================================================================
-- Micro-predicciones EN VIVO (durante el partido)
-- Aplicar en el SQL editor de Supabase. Idempotente.
--
-- Predicciones relámpago con ventana de 15-60s que el SISTEMA emite durante el
-- partido, sincronizadas con eventos reales (penal, roja, VAR…) o con el reloj
-- (min 15/30/45/60/75/85). El usuario solo responde dentro de la ventana; la
-- emisión, resolución y pago los hace el backend (service role) con eventos
-- autoritativos del Match Center.
--
-- Dos tablas:
--   micro_predictions → la micro que emite el sistema (1 fila por micro)
--   micro_responses   → la respuesta de cada usuario (RLS: propia)
-- La "Cadena de Fuego" NO tiene tabla: se DERIVA contando aciertos consecutivos
-- ya resueltos en micro_responses (ver currentFireChain en el store).
-- ============================================================================

-- ─── Micro-predicciones (las emite el sistema) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.micro_predictions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         VARCHAR(50) NOT NULL,
  kind             VARCHAR(40) NOT NULL,   -- penalty_outcome | red_card_response | …
  category         VARCHAR(20) NOT NULL,   -- reactive | temporal
  question         TEXT NOT NULL,
  options          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{key,label}]
  trigger_data     JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {side,playerName,scoreAtOpen,trigger_event_id,emoji}
  open_minute      INTEGER NOT NULL,
  resolve_minute   INTEGER NOT NULL,
  window_seconds   INTEGER NOT NULL,
  base_points      INTEGER NOT NULL,
  match_multiplier NUMERIC NOT NULL DEFAULT 1,
  correct_option   VARCHAR(40),
  status           VARCHAR(20) NOT NULL DEFAULT 'active', -- active | closed | resolved
  activated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at        TIMESTAMPTZ NOT NULL,
  resolved_at      TIMESTAMPTZ
);

-- Micros del partido, recientes primero (UI/historial) y la activa que se sondea.
CREATE INDEX IF NOT EXISTS micro_predictions_match_idx
  ON public.micro_predictions (match_id, activated_at DESC);

-- El cron de resolución busca por estado + vencimiento.
CREATE INDEX IF NOT EXISTS micro_predictions_due_idx
  ON public.micro_predictions (status, closes_at);

-- Idempotencia por evento de disparo: una sola micro por (partido, evento real).
-- Evita duplicar la misma micro cuando dos polls se solapan. Solo aplica cuando
-- hay trigger_event_id (las temporales se controlan en código por kind único).
CREATE UNIQUE INDEX IF NOT EXISTS micro_predictions_trigger_event_uniq
  ON public.micro_predictions (match_id, kind, (trigger_data ->> 'trigger_event_id'))
  WHERE trigger_data ->> 'trigger_event_id' IS NOT NULL;

-- ─── Respuestas de usuario ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.micro_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_id         UUID NOT NULL REFERENCES public.micro_predictions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_option  VARCHAR(40) NOT NULL,
  response_time_ms INTEGER,
  fire_chain_before INTEGER NOT NULL DEFAULT 0,
  fire_multiplier  NUMERIC NOT NULL DEFAULT 1,
  points_earned    INTEGER,
  is_correct       BOOLEAN,
  ghost            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

-- Una sola respuesta por (micro, usuario): anti-doble-respuesta.
CREATE UNIQUE INDEX IF NOT EXISTS micro_responses_micro_user_uniq
  ON public.micro_responses (micro_id, user_id);

-- Racha por usuario en un partido: el join usa micro_id; el filtro temporal usa
-- resolved_at. Este índice cubre el recálculo de la Cadena de Fuego.
CREATE INDEX IF NOT EXISTS micro_responses_user_resolved_idx
  ON public.micro_responses (user_id, resolved_at);

-- Resolución: respuestas pendientes de una micro en orden de llegada.
CREATE INDEX IF NOT EXISTS micro_responses_micro_idx
  ON public.micro_responses (micro_id, created_at);

-- ============================================================================
-- Row Level Security
--   micro_predictions → legible por todos (la UI las pinta); la emite/resuelve
--                       el backend con service role (bypassa RLS).
--   micro_responses   → cada usuario lee y crea SOLO las suyas; la resolución
--                       (update de is_correct/points/resolved_at) la hace el
--                       backend con service role.
-- ============================================================================
ALTER TABLE public.micro_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_responses  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "micro predictions read all" ON public.micro_predictions;
CREATE POLICY "micro predictions read all"
  ON public.micro_predictions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "micro responses read own"   ON public.micro_responses;
DROP POLICY IF EXISTS "micro responses insert own" ON public.micro_responses;
CREATE POLICY "micro responses read own"
  ON public.micro_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "micro responses insert own"
  ON public.micro_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
