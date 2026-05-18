-- 2026-05-email-notifications.sql
--
-- Sistema de notificaciones por email — FASE 1 del plan de push.
-- Crea la tabla `email_subscriptions` que controla qué usuarios reciben
-- el digest diario de noticias (y futuras categorías de notificación).
--
-- Diseño:
--   - subscribed_at NOT NULL → cuándo se suscribió por primera vez
--   - unsubscribed_at NULL → si tiene fecha, está dado de baja
--   - kind: por ahora solo "daily-digest", futuro: "match-alerts",
--     "fav-team-news", "blog-posts", etc.
--   - last_sent_at: para evitar reenvíos accidentales y para analytics
--   - source: cómo se suscribió (registro auto, manual, formulario, etc.)
--
-- RGPD: cada email enviado lleva link a /api/notifications/digest/unsubscribe?token=
-- que pone unsubscribed_at = NOW() para esa fila. Idempotente.
--
-- Cómo aplicar:
--   Supabase Studio → SQL Editor → pegar este archivo → Run.

-- 1. Crear tabla.
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Guardamos también el email plano porque el user puede borrar
  -- su cuenta pero seguir queriendo recibir el digest si lo elige.
  -- En la práctica, ON DELETE CASCADE de user_id borra la fila — si
  -- alguien borra cuenta, asumimos que también quiere dejar de recibir.
  email        TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'daily-digest',
  source       TEXT,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices.
-- Unique (email, kind) — un usuario no puede tener 2 filas del mismo kind.
CREATE UNIQUE INDEX IF NOT EXISTS email_subscriptions_email_kind_unique
  ON public.email_subscriptions (LOWER(email), kind);

-- Para el cron diario: filtrar activos eficientemente.
CREATE INDEX IF NOT EXISTS email_subscriptions_active_idx
  ON public.email_subscriptions (kind, unsubscribed_at)
  WHERE unsubscribed_at IS NULL;

-- 3. RLS — usuarios solo ven/editan sus propias suscripciones.
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own subscriptions"
  ON public.email_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can update own subscriptions"
  ON public.email_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- El INSERT y operaciones en bulk las hace el service role (cron, /api/registro
-- al auto-suscribir, etc.) que bypasses RLS. Por eso NO añadimos policy
-- de INSERT pública — solo backend con service_role puede crear filas.

-- 4. Trigger para mantener updated_at.
CREATE OR REPLACE FUNCTION public.touch_email_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_subscriptions_touch_updated_at ON public.email_subscriptions;
CREATE TRIGGER email_subscriptions_touch_updated_at
  BEFORE UPDATE ON public.email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_email_subscriptions_updated_at();

-- 5. Comentarios para documentación dentro de Supabase.
COMMENT ON TABLE public.email_subscriptions IS
  'Suscripciones a emails transaccionales/digest. unsubscribed_at NOT NULL = baja.
   Source: scripts/sql/2026-05-email-notifications.sql';

COMMENT ON COLUMN public.email_subscriptions.kind IS
  'Tipo de email: daily-digest, match-alerts, fav-team-news, blog-posts…';

COMMENT ON COLUMN public.email_subscriptions.source IS
  'Cómo se suscribió: registro-auto, manual-cuenta, footer-web…';

-- 6. (Opcional, comentado) Auto-suscribir TODOS los usuarios existentes al
--    daily-digest. Descomentar y ejecutar manualmente si se quiere.
--
--    Esto auto-suscribe SOLO si no existe ya una fila — idempotente.
--
-- INSERT INTO public.email_subscriptions (user_id, email, kind, source)
-- SELECT u.id, u.email, 'daily-digest', 'backfill-2026-05'
-- FROM auth.users u
-- WHERE u.email IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM public.email_subscriptions s
--     WHERE LOWER(s.email) = LOWER(u.email)
--       AND s.kind = 'daily-digest'
--   );
