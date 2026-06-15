-- scripts/sql/2026-37-cromos-trade-accept-rpc.sql
--
-- Aceptación ATÓMICA de intercambios P2P de cromos.
--
-- Problema (auditoría 15-jun): acceptTradeOffer hacía la transferencia como una
-- secuencia de DELETE/UPSERT sueltos (sin transacción, sin lock), lo que permitía:
--   · doble-aceptación de la misma oferta -> DUPLICAR cromos (el .update no
--     comprobaba filas afectadas y PostgREST no da error con 0 filas);
--   · el mismo cromo en varias ofertas a la vez -> duplicación de raros;
--   · DESTRUIR un cromo si el receptor ya lo tenía (delete + upsert ignorado);
--   · estado corrupto si fallaba a medias (oferta quedaba 'accepted').
--
-- Solución: una función SECURITY DEFINER que hace TODO en una sola transacción
-- con SELECT ... FOR UPDATE sobre la oferta y las filas a mover. La llama el
-- servidor con service-role (ver src/lib/cromos/trades.ts). Devuelve un código de
-- texto ('ok' o el error) en vez de lanzar, salvo en fallos inesperados.
--
-- Idempotente: CREATE OR REPLACE; DROP CONSTRAINT IF EXISTS antes de añadir.

-- 1) CHECK de integridad sobre el estado (la RLS de visibilidad depende de él)
ALTER TABLE public.cromo_trade_offers
  DROP CONSTRAINT IF EXISTS cromo_trade_offers_status_check;
ALTER TABLE public.cromo_trade_offers
  ADD CONSTRAINT cromo_trade_offers_status_check
  CHECK (status IN ('active', 'accepted', 'cancelled'));

-- 2) Función transaccional de aceptación
CREATE OR REPLACE FUNCTION public.accept_cromo_trade(p_offer_id UUID, p_acceptor UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID;
  v_status  TEXT;
  v_offered INTEGER[];
  v_wanted  INTEGER[];
  v_cnt     INTEGER;
BEGIN
  -- Bloquea la oferta: serializa aceptaciones concurrentes de la MISMA oferta.
  SELECT creator_id, status INTO v_creator, v_status
  FROM cromo_trade_offers
  WHERE id = p_offer_id
  FOR UPDATE;

  IF v_creator IS NULL THEN
    RETURN 'offer_not_found';
  END IF;
  IF v_status <> 'active' THEN
    RETURN 'not_active';
  END IF;
  IF v_creator = p_acceptor THEN
    RETURN 'cannot_accept_own';
  END IF;

  SELECT array_agg(cromo_id) INTO v_offered FROM cromo_trade_offered WHERE offer_id = p_offer_id;
  SELECT array_agg(cromo_id) INTO v_wanted  FROM cromo_trade_wanted  WHERE offer_id = p_offer_id;

  IF v_offered IS NULL OR v_wanted IS NULL THEN
    RETURN 'empty_offer';
  END IF;

  -- Bloquea las filas que se van a mover: serializa contra otros trades / sobres
  -- que toquen las mismas cartas (cierra la dup por ofertas paralelas).
  PERFORM 1 FROM user_cromos
  WHERE (user_id = v_creator  AND cromo_id = ANY(v_offered))
     OR (user_id = p_acceptor AND cromo_id = ANY(v_wanted))
  FOR UPDATE;

  -- El creador debe poseer TODOS los ofrecidos.
  SELECT count(*) INTO v_cnt FROM user_cromos
  WHERE user_id = v_creator AND cromo_id = ANY(v_offered);
  IF v_cnt <> array_length(v_offered, 1) THEN
    RETURN 'creator_missing_offered';
  END IF;

  -- El aceptante debe poseer TODOS los deseados.
  SELECT count(*) INTO v_cnt FROM user_cromos
  WHERE user_id = p_acceptor AND cromo_id = ANY(v_wanted);
  IF v_cnt <> array_length(v_wanted, 1) THEN
    RETURN 'acceptor_missing_wanted';
  END IF;

  -- El aceptante NO debe tener ya ninguno de los ofrecidos (si no, al mover se
  -- destruiría su contrapartida / la carta del creador).
  SELECT count(*) INTO v_cnt FROM user_cromos
  WHERE user_id = p_acceptor AND cromo_id = ANY(v_offered);
  IF v_cnt > 0 THEN
    RETURN 'acceptor_already_owns_offered';
  END IF;

  -- El creador NO debe tener ya ninguno de los deseados.
  SELECT count(*) INTO v_cnt FROM user_cromos
  WHERE user_id = v_creator AND cromo_id = ANY(v_wanted);
  IF v_cnt > 0 THEN
    RETURN 'creator_already_owns_wanted';
  END IF;

  -- Transferencia atómica: mover la propiedad por UPDATE de user_id (respeta el
  -- UNIQUE(user_id,cromo_id) porque ya comprobamos que el receptor no la tiene).
  UPDATE user_cromos
  SET user_id = p_acceptor, source = 'trade', obtained_at = NOW()
  WHERE user_id = v_creator AND cromo_id = ANY(v_offered);

  UPDATE user_cromos
  SET user_id = v_creator, source = 'trade', obtained_at = NOW()
  WHERE user_id = p_acceptor AND cromo_id = ANY(v_wanted);

  UPDATE cromo_trade_offers
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_acceptor
  WHERE id = p_offer_id;

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.accept_cromo_trade(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_cromo_trade(UUID, UUID) TO service_role;
