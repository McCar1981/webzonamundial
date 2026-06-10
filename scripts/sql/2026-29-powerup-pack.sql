-- scripts/sql/2026-29-powerup-pack.sql
--
-- Pack Comodines x3 (compra mínima 1,99): la comisión fija de Stripe (~0,25)
-- se come ~27% de un cargo de 0,99, así que la ÚNICA compra pasa a ser un pack
-- de 3 usos universales. Los comodines se CONSUMEN de un monedero de usos:
--   · compra pack (Stripe) → +3 créditos  → powerup_apply_pack (atómico)
--   · usar un comodín      → -1 crédito   → powerup_spend_credit (atómico)
-- Con créditos no hay redirect a Stripe: la aplicación es instantánea.
--
-- Requiere 2026-28-powerups.sql aplicada. Idempotente: se puede reaplicar.

-- ── Monedero de usos ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.powerup_wallet (
  user_id    UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits    INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.powerup_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS powerup_wallet_select_own ON public.powerup_wallet;
CREATE POLICY powerup_wallet_select_own
  ON public.powerup_wallet FOR SELECT
  USING (auth.uid() = user_id);

-- ── La compra del pack entra en el CHECK de sku ───────────────────────────────
-- (las filas de USO siguen usando los sku base con amount=0 / currency='credit')

ALTER TABLE public.powerup_purchases
  DROP CONSTRAINT IF EXISTS powerup_purchases_sku_check;
ALTER TABLE public.powerup_purchases
  ADD CONSTRAINT powerup_purchases_sku_check
  CHECK (sku IN ('second_chance', 'double_down', 'trivia_revive', 'pack3'));

-- ── RPCs atómicas (solo service role) ─────────────────────────────────────────

-- Claim de la compra + abono de créditos en UNA transacción. Idempotente frente
-- a reintentos del webhook: si la fila ya no está 'pending' devuelve NULL y no
-- vuelve a abonar. Devuelve el saldo resultante.
CREATE OR REPLACE FUNCTION public.powerup_apply_pack(
  p_purchase_id   UUID,
  p_credits       INTEGER,
  p_payment_intent TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user    UUID;
  v_balance INTEGER;
BEGIN
  UPDATE powerup_purchases
     SET status = 'applied',
         paid_at = now(),
         applied_at = now(),
         stripe_payment_intent_id = COALESCE(p_payment_intent, stripe_payment_intent_id)
   WHERE id = p_purchase_id AND status = 'pending'
   RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN
    RETURN NULL; -- ya aplicada (reintento) o descartada
  END IF;

  INSERT INTO powerup_wallet (user_id, credits)
  VALUES (v_user, GREATEST(p_credits, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET credits = powerup_wallet.credits + GREATEST(p_credits, 0),
        updated_at = now()
  RETURNING credits INTO v_balance;

  RETURN v_balance;
END;
$$;

-- Gasta 1 crédito si hay saldo. Devuelve el saldo restante o NULL si no había.
CREATE OR REPLACE FUNCTION public.powerup_spend_credit(p_uid UUID) RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE powerup_wallet
     SET credits = credits - 1, updated_at = now()
   WHERE user_id = p_uid AND credits >= 1
   RETURNING credits;
$$;

-- Abona créditos (compensación si un uso no pudo aplicarse). Devuelve el saldo.
CREATE OR REPLACE FUNCTION public.powerup_grant_credits(p_uid UUID, p_n INTEGER) RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO powerup_wallet (user_id, credits)
  VALUES (p_uid, GREATEST(p_n, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET credits = powerup_wallet.credits + GREATEST(p_n, 0),
        updated_at = now()
  RETURNING credits;
$$;

-- Retira créditos sin bajar de 0 (refund/disputa del pack). Devuelve el saldo.
CREATE OR REPLACE FUNCTION public.powerup_revoke_credits(p_uid UUID, p_n INTEGER) RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE powerup_wallet
     SET credits = GREATEST(credits - GREATEST(p_n, 0), 0), updated_at = now()
   WHERE user_id = p_uid
   RETURNING credits;
$$;

REVOKE ALL ON FUNCTION public.powerup_apply_pack(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.powerup_spend_credit(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.powerup_grant_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.powerup_revoke_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.powerup_apply_pack(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerup_spend_credit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerup_grant_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerup_revoke_credits(UUID, INTEGER) TO service_role;
