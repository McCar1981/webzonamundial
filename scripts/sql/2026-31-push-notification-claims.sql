-- =============================================================================
-- 2026-31 — Recompensa por activar notificaciones push (una vez por usuario)
-- =============================================================================
-- Da Fútcoins UNA sola vez a cada usuario que active las notificaciones. La
-- idempotencia es la PK (user_id): el backend hace INSERT ... ON CONFLICT DO
-- NOTHING; si la fila ya existe, no vuelve a abonar (no es farmeable
-- activando/desactivando). Mismo patrón que fantasy_coin_claims /
-- prediction_daily_claims.
--
-- El abono real lo hace increment_wallet() desde el endpoint
-- /api/notifications/push/claim-reward con service_role.
--
-- Idempotente: re-ejecutable sin efectos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_notification_claims (
  user_id    UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins      INTEGER NOT NULL DEFAULT 0,
  xp         INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_notification_claims ENABLE ROW LEVEL SECURITY;

-- El usuario puede leer su propia fila (saber si ya reclamó). El INSERT/abono
-- lo hace el backend con service_role (bypassa RLS).
DROP POLICY IF EXISTS "push claims read own" ON public.push_notification_claims;
CREATE POLICY "push claims read own"
  ON public.push_notification_claims FOR SELECT
  USING (auth.uid() = user_id);
