-- scripts/sql/2026-38-cromos-pack-cooldown-rpc.sql
--
-- Cooldown ATÓMICO de apertura de sobres + endurecimiento menor.
--
-- Problema (auditoría 15-jun): openPack comprobaba el cooldown de 4h leyendo el
-- último opened_at en JS y luego insertaba el claim, sin lock ni constraint. Dos
-- peticiones simultáneas leían "canOpen=true" antes de que ninguna insertara, así
-- que ambas abrían sobre, saltándose el límite (over-grant de cromos).
--
-- Solución: una RPC que, bajo un advisory lock por usuario (serializa las aperturas
-- concurrentes del MISMO usuario), comprueba el cooldown y, si procede, inserta el
-- claim (marca el cooldown) y devuelve su id. El servidor rellena luego los cromos
-- reales. Es "claim-first": el cooldown se marca ANTES de entregar cromos.
--
-- Idempotente: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.try_claim_cromo_pack(p_uid UUID, p_cooldown_seconds INTEGER)
RETURNS UUID  -- id del claim si ganó el slot; NULL si está en cooldown
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last  TIMESTAMPTZ;
  v_id    UUID;
BEGIN
  -- Serializa las aperturas concurrentes del mismo usuario (se libera al terminar
  -- la transacción). Convierte el check-then-insert en una decisión atómica.
  PERFORM pg_advisory_xact_lock(hashtext('cromo_pack:' || p_uid::text));

  SELECT max(opened_at) INTO v_last
  FROM cromo_pack_claims
  WHERE user_id = p_uid;

  IF v_last IS NOT NULL AND v_last > now() - make_interval(secs => p_cooldown_seconds) THEN
    RETURN NULL;  -- en cooldown
  END IF;

  -- Inserta el claim (placeholder de cromos; el servidor lo rellena tras elegirlos).
  INSERT INTO cromo_pack_claims (user_id, cromo_1_id, cromo_2_id, cromo_3_id)
  VALUES (p_uid, 0, 0, 0)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.try_claim_cromo_pack(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_claim_cromo_pack(UUID, INTEGER) TO service_role;

-- Endurecimiento menor: user_cromo_count tenía EXECUTE para anon, lo que dejaba a
-- cualquiera contar los cromos de cualquier UUID. No se usa desde el cliente, así
-- que se revoca el acceso anónimo (queda para service_role/authenticated).
REVOKE EXECUTE ON FUNCTION public.user_cromo_count(UUID) FROM anon;
