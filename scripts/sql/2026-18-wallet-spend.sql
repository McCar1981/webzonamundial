-- scripts/sql/2026-18-wallet-spend.sql
--
-- Débito ATÓMICO de la billetera única (profiles.coins). El reverso de
-- increment_wallet (2026-17): aquí se GASTAN Fútcoins, no se abonan.
--
-- Por qué una función dedicada y no un UPDATE normal: el gasto exige una
-- comprobación de saldo (no se puede quedar negativo) Y la deducción en la MISMA
-- sentencia, o dos compras concurrentes del mismo usuario podrían leer ambas el
-- saldo viejo y sobregastar (saldo negativo / artículos gratis). El WHERE con
-- `coins >= p_amount` hace la comprobación-y-deducción atómica: si no alcanza, el
-- UPDATE no afecta filas y no devuelve nada → el backend lo trata como rechazo.
--
-- La ejecuta SIEMPRE el backend con el cliente admin (service role). SECURITY
-- DEFINER para aplicar con privilegios del propietario.
--
-- Idempotente a nivel de definición: CREATE OR REPLACE; reaplicable sin romper.

CREATE OR REPLACE FUNCTION public.spend_wallet(
  p_uid    UUID,
  p_amount INTEGER
)
RETURNS TABLE (coins INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET coins = coins - p_amount
   WHERE id = p_uid
     AND p_amount >= 0
     AND coins >= p_amount
  RETURNING coins;
$$;

-- Solo el backend (service role) la ejecuta; revocamos al resto.
REVOKE ALL ON FUNCTION public.spend_wallet(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_wallet(UUID, INTEGER) TO service_role;
