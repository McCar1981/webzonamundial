-- scripts/sql/2026-19-coin-ledger.sql
--
-- LEDGER (libro mayor) de la economía única: registra CADA abono de Fútcoins/XP
-- con el MÓDULO que lo generó. La billetera (profiles.coins) sigue siendo el saldo
-- vivo y la fuente de verdad del ranking GLOBAL; este ledger es el detalle que
-- permite además rankings POR MÓDULO ("quién va primero en trivia", en fantasy…)
-- todos en la MISMA unidad (Fútcoins), así son comparables entre sí y el global es
-- la suma real de todos.
--
-- Diseño:
--  · Append-only: cada abono inserta UNA fila. No se actualiza ni se borra, así
--    que no hay condición de carrera (a diferencia del saldo, que sí la tenía).
--  · El gasto (spend) NO se registra aquí: el ranking mide cuántas Fútcoins ha
--    GENERADO cada quien por módulo (mérito), no su saldo tras comprar cosas.
--  · module es texto libre validado por CHECK contra el catálogo de SinkModule +
--    los módulos que solo ingresan (trivia, predicciones, micro…).
--
-- Idempotente: CREATE TABLE IF NOT EXISTS; reaplicable sin romper.

CREATE TABLE IF NOT EXISTS public.coin_ledger (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module     TEXT NOT NULL CHECK (module IN (
               'predicciones', 'trivia', 'fantasy', 'modo-carrera',
               'micro', 'otros'
             )),
  coins      INTEGER NOT NULL DEFAULT 0,
  xp         INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ranking por módulo: agregamos SUM(coins) por usuario filtrando por module.
CREATE INDEX IF NOT EXISTS coin_ledger_module_idx ON public.coin_ledger (module);
-- "Mis ingresos por módulo" y desgloses por usuario.
CREATE INDEX IF NOT EXISTS coin_ledger_user_idx   ON public.coin_ledger (user_id);

-- RLS: el ledger lo escribe SOLO el backend (service role, que la bypasea). Para
-- el resto, lectura denegada por defecto (los rankings se sirven vía admin client
-- en el backend, igual que el ranking global).
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;

-- Agregado de Fútcoins generadas por módulo y usuario. SECURITY DEFINER para que
-- el backend (service role) lo invoque y devuelva el top ya ordenado, sin traer
-- todas las filas a JS. Devuelve user_id + total de coins/xp del módulo.
CREATE OR REPLACE FUNCTION public.module_coin_ranking(
  p_module TEXT,
  p_limit  INTEGER
)
RETURNS TABLE (user_id UUID, coins BIGINT, xp BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, SUM(coins)::BIGINT AS coins, SUM(xp)::BIGINT AS xp
    FROM public.coin_ledger
   WHERE module = p_module
   GROUP BY user_id
  HAVING SUM(coins) > 0
   ORDER BY SUM(coins) DESC, SUM(xp) DESC
   LIMIT GREATEST(1, LEAST(200, p_limit));
$$;

REVOKE ALL ON FUNCTION public.module_coin_ranking(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.module_coin_ranking(TEXT, INTEGER) TO service_role;

-- Posición de UN usuario dentro de un módulo: cuántos generaron MÁS coins que él.
-- rank = 1 + ese conteo. Devuelve también su total para la cabecera del módulo.
CREATE OR REPLACE FUNCTION public.module_coin_user_rank(
  p_module TEXT,
  p_uid    UUID
)
RETURNS TABLE (rank INTEGER, coins BIGINT, xp BIGINT, total BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_user AS (
    SELECT user_id, SUM(coins) AS c, SUM(xp) AS x
      FROM public.coin_ledger
     WHERE module = p_module
     GROUP BY user_id
    HAVING SUM(coins) > 0
  ), me AS (
    SELECT c, x FROM per_user WHERE user_id = p_uid
  )
  SELECT
    (1 + (SELECT COUNT(*) FROM per_user pu, me
           WHERE pu.c > me.c OR (pu.c = me.c AND pu.x > me.x)))::INTEGER AS rank,
    COALESCE((SELECT c FROM me), 0)::BIGINT AS coins,
    COALESCE((SELECT x FROM me), 0)::BIGINT AS xp,
    (SELECT COUNT(*) FROM per_user)::BIGINT AS total;
$$;

REVOKE ALL ON FUNCTION public.module_coin_user_rank(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.module_coin_user_rank(TEXT, UUID) TO service_role;
