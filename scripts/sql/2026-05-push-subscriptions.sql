-- 2026-05-push-subscriptions.sql
--
-- FASE 2 del plan de notificaciones: Web Push nativo.
-- Crea la tabla `push_subscriptions` que guarda los endpoints PushSubscription
-- de cada navegador/device del usuario, junto con las claves p256dh + auth
-- necesarias para cifrar payloads.
--
-- Diseño:
--   - Un user puede tener N subscriptions (una por device/browser).
--   - endpoint es UNIQUE — si el mismo navegador re-suscribe, hacemos UPSERT.
--   - Si el navegador devuelve 410 GONE al enviar push, el cron borra esa fila.
--
-- Cómo aplicar:
--   Supabase Studio → SQL Editor → pegar este archivo → Run.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Endpoint del PushManager: URL única por subscription que devuelve
  -- el navegador del usuario.
  endpoint     TEXT NOT NULL,
  -- Claves criptográficas que genera el browser al suscribirse.
  -- p256dh = clave pública del cliente.
  -- auth   = secreto compartido para AES-GCM.
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  -- Metadatos útiles para analytics y debugging.
  user_agent   TEXT,
  locale       TEXT,
  -- Categorías a las que está suscrito. Por defecto todas las noticias.
  -- En el futuro: array de SELECCIONES, categorías concretas, etc.
  kinds        TEXT[] NOT NULL DEFAULT ARRAY['news']::TEXT[],
  -- Si el último send devolvió error 4xx pero no 410, marcamos para
  -- vigilar. Si llega a 5+ fallos seguidos, borramos.
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique endpoint (un browser = una fila). Si re-suscribe, UPSERT.
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_unique
  ON public.push_subscriptions (endpoint);

-- Index para queries del cron: "todos los activos suscritos a 'news'".
CREATE INDEX IF NOT EXISTS push_subscriptions_kinds_idx
  ON public.push_subscriptions USING GIN (kinds);

-- Index para borrar fácil las subs de un user borrado.
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

-- RLS — el usuario solo ve y modifica sus propias subscriptions.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own push subs"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own push subs"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "users can update own push subs"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT lo hace el backend con service_role (bypasses RLS). No abrimos
-- INSERT público para evitar spam de subscriptions vacías.

-- Trigger updated_at.
CREATE OR REPLACE FUNCTION public.touch_push_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_touch_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_touch_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_push_subscriptions_updated_at();

-- Comentarios.
COMMENT ON TABLE public.push_subscriptions IS
  'Web Push subscriptions (Service Worker + VAPID). Una fila por device/browser.
   Source: scripts/sql/2026-05-push-subscriptions.sql';

COMMENT ON COLUMN public.push_subscriptions.kinds IS
  'Categorías a las que está suscrito el device: news, fav-team, blog, sorteo, finales...';

COMMENT ON COLUMN public.push_subscriptions.failure_count IS
  'Veces consecutivas que el endpoint falló. >=5 → borrar (asumir muerto).';
