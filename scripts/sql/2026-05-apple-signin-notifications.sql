-- 2026-05-apple-signin-notifications.sql
-- Migración Supabase para soportar Sign In with Apple — Server-to-Server Notifications.
--
-- Aplica DOS cambios:
--   1. Tabla nueva `apple_signin_events` — audit log idempotente por jti.
--   2. Columnas nuevas en `users` para los flags de estado Apple.
--
-- Cómo aplicar:
--   Opción A: copiar/pegar en Supabase Studio → SQL Editor → Run.
--   Opción B: psql -h <host> -U postgres -d postgres -f este_archivo.sql
--
-- Idempotente: usa IF NOT EXISTS y ON CONFLICT para poder re-ejecutar.

-- ============================================================
-- 1. AUDIT LOG — apple_signin_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.apple_signin_events (
  -- jti del JWT firmado por Apple. Es PK porque Apple lo garantiza
  -- único por evento y reintenta con el mismo jti hasta 24 h.
  -- Insertar con conflict en jti → descartamos duplicados.
  jti              text PRIMARY KEY,

  event_type       text NOT NULL CHECK (event_type IN (
                     'email-disabled',
                     'email-enabled',
                     'consent-revoked',
                     'account-delete'
                   )),

  -- Apple user id (sub del token Apple ID). NO es nuestro user.id.
  -- El handler usa este sub para encontrar al user local.
  apple_sub        text NOT NULL,

  -- Email anónimo de Apple Relay (solo en eventos email-*).
  apple_email      text,
  is_private_email boolean DEFAULT false,

  -- Cuándo ocurrió el evento en Apple (no cuándo lo recibimos).
  event_time       timestamptz NOT NULL,

  -- Payload crudo del evento por si Apple añade campos en el futuro
  -- o necesitamos reprocesar.
  raw_event        jsonb NOT NULL,

  -- Cuándo lo procesamos nosotros.
  received_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apple_events_sub
  ON public.apple_signin_events (apple_sub);

CREATE INDEX IF NOT EXISTS idx_apple_events_received_at
  ON public.apple_signin_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_apple_events_type
  ON public.apple_signin_events (event_type);

COMMENT ON TABLE public.apple_signin_events IS
  'Server-to-Server Notifications de Sign In with Apple. PK = jti del JWT (idempotente para retries de Apple). Procesado por /api/auth/apple/notifications.';

-- RLS: nadie del lado cliente debe leer ni escribir. Solo service_role.
ALTER TABLE public.apple_signin_events ENABLE ROW LEVEL SECURITY;

-- No CREATE POLICY → nadie puede acceder excepto la clave service_role
-- que el route handler usa, que bypassa RLS por diseño.

-- ============================================================
-- 2. Columnas nuevas en `users` para los flags Apple
-- ============================================================
-- (Asume que la tabla public.users existe ya. Si tu user_id es uuid de
--  auth.users y NO tienes tabla public.users espejo, omite esto y aplica
--  las actualizaciones directamente sobre auth.users.user_metadata.)

DO $$
BEGIN
  -- apple_sub: identificador estable que liga al user con su Apple ID.
  -- Se rellena en el login con Apple. Necesario para que el webhook
  -- encuentre al user local.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'apple_sub'
  ) THEN
    ALTER TABLE public.users ADD COLUMN apple_sub text;
    CREATE INDEX IF NOT EXISTS idx_users_apple_sub ON public.users (apple_sub);
  END IF;

  -- consent-revoked: timestamp de cuando el usuario revocó permisos.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'apple_consent_revoked_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN apple_consent_revoked_at timestamptz;
  END IF;

  -- email-disabled: el Relay de Apple desactivó el reenvío.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_disabled'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_disabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_disabled_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_disabled_at timestamptz;
  END IF;

  -- Soft-delete (para account-delete event). Si tu tabla ya tiene
  -- deleted_at no la sobrescribimos.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'deleted_reason'
  ) THEN
    ALTER TABLE public.users ADD COLUMN deleted_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN public.users.apple_sub IS
  'Apple user id (sub del JWT del login con Apple). Estable y único por user. Usado por el webhook /api/auth/apple/notifications para identificar al user local.';
