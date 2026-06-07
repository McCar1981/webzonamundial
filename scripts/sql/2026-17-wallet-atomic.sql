-- scripts/sql/2026-17-wallet-atomic.sql
--
-- Incremento ATÓMICO de la billetera única (profiles.coins / profiles.xp).
--
-- Hasta ahora el abono era leer-sumar-escribir en JS (wallet.ts grantCoins), que
-- NO es seguro ante concurrencia: dos abonos simultáneos del mismo usuario (p.ej.
-- cerrar una trivia y confirmar una jornada de fantasy a la vez) podían pisarse y
-- perder uno. Esta función hace el incremento en una sola sentencia SQL, donde el
-- propio UPDATE serializa la fila, eliminando la condición de carrera.
--
-- La escribe SIEMPRE el backend con el cliente admin (service role). Es SECURITY
-- DEFINER para que el incremento se aplique con privilegios del propietario.
--
-- Idempotente: CREATE OR REPLACE; se puede reaplicar sin romper nada.

CREATE OR REPLACE FUNCTION public.increment_wallet(
  p_uid   UUID,
  p_coins INTEGER,
  p_xp    INTEGER
)
RETURNS TABLE (coins INTEGER, xp INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET coins = COALESCE(coins, 0) + GREATEST(0, p_coins),
         xp    = COALESCE(xp, 0)    + GREATEST(0, p_xp)
   WHERE id = p_uid
  RETURNING coins, xp;
$$;

-- Solo el backend (service role) la ejecuta; revocamos al resto.
REVOKE ALL ON FUNCTION public.increment_wallet(UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet(UUID, INTEGER, INTEGER) TO service_role;
