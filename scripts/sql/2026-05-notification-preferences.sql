-- 2026-05-notification-preferences.sql
--
-- FASE 3 del plan de notificaciones: preferencias granulares.
--
-- ESTRATEGIA:
-- Reemplazamos el modelo "1 categor\u00eda = 1 tabla" (email_subscriptions con
-- kind, push_subscriptions con kinds[]) por un modelo unificado:
--   notification_preferences (user_id, category, channel, enabled)
--
-- Esto permite que un user diga "quiero noticias por push pero no por email"
-- o "quiero fav-team por push solo en m\u00f3vil pero no en navegador" sin
-- multiplicar tablas.
--
-- Las tablas existentes (email_subscriptions, push_subscriptions) NO se
-- borran. Email_subscriptions sigue siendo la fuente de verdad de "qu\u00e9
-- email enviar el digest". Push_subscriptions sigue siendo la fuente de
-- "qu\u00e9 endpoint del browser hay activo".
--
-- notification_preferences solo dice S\u00cd/NO por categor\u00eda + canal. El cron
-- consulta esta tabla antes de enviar.
--
-- DECISI\u00d3N: para no romper FASE 1/2, mantenemos las tablas viejas. El
-- backend lee preferences PRIMERO; si est\u00e1 vac\u00edo, fallback a la tabla
-- vieja (compatible hacia atr\u00e1s durante la transici\u00f3n).

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Categor\u00eda l\u00f3gica de la notificaci\u00f3n.
  -- Activas (web): "news"
  -- Preparadas (web/app futuro): "fav-team", "tournament-key-events",
  --   "predictions-reminder", "fantasy", "blog-posts", "creators"
  category    TEXT NOT NULL,
  -- Canal de entrega:
  --   "push" \u2192 Web Push (Service Worker) + FCM en app m\u00f3vil
  --   "email" \u2192 Resend
  --   "in-app" \u2192 campana dentro de la web/app (futuro)
  channel     TEXT NOT NULL,
  -- TRUE \u2192 el user quiere recibir, FALSE \u2192 no quiere.
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Una sola fila por (user, category, channel).
CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_unique
  ON public.notification_preferences (user_id, category, channel);

-- Index para consultas inversas "qui\u00e9nes est\u00e1n suscritos a X categor\u00eda+canal".
CREATE INDEX IF NOT EXISTS notification_preferences_lookup
  ON public.notification_preferences (category, channel, enabled)
  WHERE enabled = TRUE;

-- RLS \u2014 user gestiona solo sus propias preferencias.
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own prefs"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can update own prefs"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own prefs"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own prefs"
  ON public.notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at.
CREATE OR REPLACE FUNCTION public.touch_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_preferences_touch_updated_at
  ON public.notification_preferences;
CREATE TRIGGER notification_preferences_touch_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_notification_preferences_updated_at();

COMMENT ON TABLE public.notification_preferences IS
  'Preferencias granulares por categor\u00eda + canal. Source:
   scripts/sql/2026-05-notification-preferences.sql';

-- Backfill: para los users existentes que YA est\u00e1n suscritos a
-- email_subscriptions (FASE 1) o push_subscriptions (FASE 2),
-- creamos las filas correspondientes en notification_preferences
-- para que la transici\u00f3n sea transparente.

-- 1) Cualquier user con email_subscription activa de daily-digest
--    \u2192 prefiere "news" por "email".
INSERT INTO public.notification_preferences (user_id, category, channel, enabled)
SELECT s.user_id, 'news', 'email', TRUE
FROM public.email_subscriptions s
WHERE s.user_id IS NOT NULL
  AND s.unsubscribed_at IS NULL
  AND s.kind = 'daily-digest'
ON CONFLICT (user_id, category, channel) DO NOTHING;

-- 2) Cualquier user con push_subscription que tenga "news" en kinds
--    \u2192 prefiere "news" por "push".
INSERT INTO public.notification_preferences (user_id, category, channel, enabled)
SELECT DISTINCT p.user_id, 'news', 'push', TRUE
FROM public.push_subscriptions p
WHERE p.user_id IS NOT NULL
  AND 'news' = ANY(p.kinds)
ON CONFLICT (user_id, category, channel) DO NOTHING;
