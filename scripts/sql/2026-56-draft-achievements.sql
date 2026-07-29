-- 2026-56 · Draft de Ligas — logros en SERVIDOR (persistentes y con pago)
-- ============================================================================
-- Hoy los logros del Draft viven en localStorage: se borran al cambiar de
-- móvil (habitual en gama media), no otorgan Fútcoins y nadie más los ve.
-- Esta tabla los mueve al servidor con el mismo patrón idempotente de
-- draft_claims: una fila por (usuario, logro), un solo pago por logro.
--
-- Idempotente y NO destructiva.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.draft_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,            -- id estable del logro (ver lib/draft/logros.ts)
  coins          INTEGER NOT NULL DEFAULT 0,
  xp             INTEGER NOT NULL DEFAULT 0,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Consulta típica: todos los logros de un usuario, más recientes primero.
CREATE INDEX IF NOT EXISTS draft_achievements_user_idx
  ON public.draft_achievements (user_id, unlocked_at DESC);

-- RLS: el usuario lee SOLO sus propios logros. La escritura la hace el
-- servidor con service_role (la ruta /api/draft/logros valida la sesión).
ALTER TABLE public.draft_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "draft achievements read own" ON public.draft_achievements;
CREATE POLICY "draft achievements read own"
  ON public.draft_achievements FOR SELECT USING (auth.uid() = user_id);

-- FIN 2026-56
