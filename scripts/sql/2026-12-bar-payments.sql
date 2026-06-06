-- scripts/sql/2026-12-bar-payments.sql
--
-- Módulo B2B "Porras Digitales para Bares" — FASE 2 (cobro con Stripe).
--
-- Registra el pago de un plan por parte de un bar. Reusa el mismo Stripe ya
-- integrado para el Founders Pass: el flujo crea una Checkout Session y el
-- webhook escribe aquí cuando el pago se completa. A diferencia del Founders
-- Pass (que vive en Vercel KV indexado por email), el plan de un bar se modela
-- como tabla porque la clave de negocio es el BAR, no el email, y queremos
-- trazabilidad relacional (facturación, conciliación de reembolsos, auditoría).
--
-- Una fila ACTIVA por bar (bar_id UNIQUE): un bar tiene a lo sumo un plan vigente.
-- El estado del plan vigente también se refleja en bars.plan_id (lo actualiza el
-- backend con service role al confirmar el pago).
--
-- Idempotente: se puede reaplicar sin romper nada (IF NOT EXISTS / DROP POLICY).

CREATE TABLE IF NOT EXISTS public.bar_payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id                   UUID NOT NULL UNIQUE REFERENCES public.bars(id) ON DELETE CASCADE,
  plan_id                  VARCHAR(40) NOT NULL,            -- arranque | completo | pro
  amount                   INTEGER NOT NULL,                -- céntimos
  currency                 VARCHAR(3) NOT NULL,             -- eur | usd
  status                   VARCHAR(20) NOT NULL DEFAULT 'active', -- active | refunded
  stripe_session_id        VARCHAR(120) UNIQUE,             -- evita duplicar si Stripe reintenta
  stripe_payment_intent_id VARCHAR(120),
  stripe_customer_id       VARCHAR(120),
  receipt_url              TEXT,
  purchased_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bar_payments_bar_idx ON public.bar_payments (bar_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- El dueño LEE el pago de su bar (para verlo en el dashboard). La escritura la
-- hace SIEMPRE el backend con service role desde el webhook de Stripe; nunca el
-- cliente (no debe poder marcarse un plan como pagado sin pasar por Stripe).
ALTER TABLE public.bar_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bar payments owner read" ON public.bar_payments;
CREATE POLICY "bar payments owner read" ON public.bar_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
