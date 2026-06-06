-- 2026-13-bar-production-gating.sql
--
-- Endurece la monetización del módulo "Porras Digitales para Bares":
--   1) Un bar NO tiene plan por defecto. Hasta que paga, bars.plan_id = NULL.
--   2) Degrada bares ya creados que tuvieran plan sin un pago activo asociado.
--   3) Despublica bares que estuvieran publicados sin plan activo (pending_payment).
--
-- Idempotente: puede ejecutarse varias veces sin efectos secundarios.
-- No toca RLS ni datos de participantes; solo plan_id/status de bars.

-- 1) plan_id deja de tener DEFAULT 'arranque' y pasa a ser NULL-able.
ALTER TABLE bars ALTER COLUMN plan_id DROP DEFAULT;
ALTER TABLE bars ALTER COLUMN plan_id DROP NOT NULL;

-- 2) Bares con plan pero SIN pago activo (nunca pagaron o reembolsado) → sin plan.
UPDATE bars b
SET plan_id = NULL, updated_at = now()
WHERE b.plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bar_payments p
    WHERE p.bar_id = b.id AND p.status = 'active' AND p.refunded_at IS NULL
  );

-- 3) Bares publicados sin plan activo → pending_payment (dejan de ser públicos).
UPDATE bars b
SET status = 'pending_payment', updated_at = now()
WHERE b.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM bar_payments p
    WHERE p.bar_id = b.id AND p.status = 'active' AND p.refunded_at IS NULL
  );
