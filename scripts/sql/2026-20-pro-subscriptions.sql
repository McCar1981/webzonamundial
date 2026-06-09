-- scripts/sql/2026-20-pro-subscriptions.sql
--
-- Plan PRO (suscripción Stripe mensual/anual). Una fila por usuario con el
-- estado vivo de su suscripción; la escribe SIEMPRE el webhook de Stripe con
-- el cliente admin (service role). El usuario solo LEE la suya (RLS).
--
-- `profiles.is_premium` (creada en 2026-06-predictions.sql) pasa a ser la
-- caché desnormalizada de "tiene Pro activo": la sincroniza el mismo webhook
-- en cada cambio de estado. Los Founders NO se reflejan ahí — isPro() en
-- código resuelve `suscripción activa OR founder`.
--
-- Idempotente: se puede reaplicar sin romper nada.

CREATE TABLE IF NOT EXISTS public.pro_subscriptions (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  -- Ciclo de cobro elegido en el checkout.
  plan                    TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  -- Estado espejo del de Stripe. `past_due` mantiene acceso hasta
  -- current_period_end (periodo de gracia); `canceled` lo corta.
  status                  TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  currency                TEXT,
  amount                  INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- El webhook de `customer.subscription.updated/deleted` solo trae el customer
-- id: este índice resuelve el lookup inverso customer → usuario.
CREATE INDEX IF NOT EXISTS pro_subscriptions_customer_idx
  ON public.pro_subscriptions (stripe_customer_id);

ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro subscriptions read own" ON public.pro_subscriptions;
CREATE POLICY "pro subscriptions read own"
  ON public.pro_subscriptions FOR SELECT USING (auth.uid() = user_id);
