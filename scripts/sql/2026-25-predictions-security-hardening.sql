-- ============================================================================
-- 2026-23 — Endurecimiento de seguridad del módulo Predicciones
-- ============================================================================
-- Auditoría predicciones-2026-06-10. Cierra dos puertas traseras de RLS y añade
-- las garantías de unicidad/idempotencia que la lógica de juego asume.
--
-- ⚠️ ORDEN DE DESPLIEGUE: aplicar JUNTO con los cambios de código de esta tanda.
--    En particular, `createPrediction`/`updatePredictionData` pasan a escribir con
--    service-role (no con el cliente del usuario). Si se aplica este SQL ANTES de
--    desplegar ese código, la creación de predicciones fallaría (el cliente del
--    usuario ya no puede escribir). Aplicar SQL + deploy en la misma ventana.
--
-- Idempotente: se puede ejecutar varias veces sin efectos colaterales.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- NP-01 / NP-02 — RLS: el usuario NO debe poder escribir tablas de dinero/puntos
-- ----------------------------------------------------------------------------
-- El cliente del navegador usa la anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY), por lo
-- que las políticas RLS eran la única frontera. Permitían que un usuario, vía
-- PostgREST con su propia sesión:
--   • prediction_boosts: auto-insertarse boosts (×2 puntos, escudo) gratis y
--     "des-consumirlos" (consumed_at = NULL) → bypass del único sumidero de monedas.
--   • predictions: editar points_earned / is_correct / was_pro / match_multiplier
--     de sus filas, o INSERTAR con was_pro=TRUE y match_multiplier alto → inflar
--     ranking y multiplicadores sin haberlos ganado.
--   • prediction_duels: manipular duelos.
-- Todas estas escrituras las hace SIEMPRE el backend con service-role (que bypassa
-- RLS), así que retiramos el permiso de escritura al rol del usuario. Lectura intacta.

-- predictions: quitar políticas de escritura de usuario (lectura propia se mantiene).
DROP POLICY IF EXISTS "predictions insert own" ON public.predictions;
DROP POLICY IF EXISTS "predictions update own" ON public.predictions;

-- prediction_boosts: quitar insert/update de usuario (lectura propia se mantiene).
DROP POLICY IF EXISTS "boosts insert own" ON public.prediction_boosts;
DROP POLICY IF EXISTS "boosts update own" ON public.prediction_boosts;

-- prediction_duels: quitar insert/update de usuario (lectura de las dos partes se mantiene).
DROP POLICY IF EXISTS "duels insert" ON public.prediction_duels;
DROP POLICY IF EXISTS "duels update party" ON public.prediction_duels;

-- Red de seguridad a nivel de privilegios de tabla (defensa en profundidad):
-- aunque alguien recree una política por error, el rol del usuario no tiene el
-- privilegio de escritura. El backend opera con service_role, que conserva todo.
REVOKE INSERT, UPDATE, DELETE ON public.predictions       FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.prediction_boosts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.prediction_duels  FROM anon, authenticated;
-- Los eslabones de cadena también se escriben solo desde el backend.
REVOKE INSERT, UPDATE, DELETE ON public.prediction_chains FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- NP-30 / NP-08 — Unicidad de duelos: evitar N duelos del mismo par/partido
-- ----------------------------------------------------------------------------
-- Sin esto, un usuario podía crear muchos duelos contra la misma cuenta para el
-- mismo partido (vector de farmeo en colusión). El backend ya traduce el 23505 de
-- este índice a un error legible `duel_exists`.
CREATE UNIQUE INDEX IF NOT EXISTS prediction_duels_unique_active
  ON public.prediction_duels (challenger_id, opponent_id, match_id)
  WHERE status IN ('pending', 'active');

-- ----------------------------------------------------------------------------
-- NP-11 — Idempotencia de recompensas por (usuario, partido)
-- ----------------------------------------------------------------------------
-- `grantMatchRewards` inserta aquí antes de pagar XP/monedas a un usuario por un
-- partido; si la fila ya existe (otra ejecución concurrente del cron / POST manual
-- a /resolve), se salta el pago. Garantiza "se paga una sola vez por partido".
CREATE TABLE IF NOT EXISTS public.prediction_match_rewards (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id    VARCHAR(50) NOT NULL,
  rewarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, match_id)
);
ALTER TABLE public.prediction_match_rewards ENABLE ROW LEVEL SECURITY;
-- Solo backend (service_role). Sin políticas → el rol del usuario no accede.
REVOKE ALL ON public.prediction_match_rewards FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- NP-04 / NP-03 — Persistencia del resultado oficial fuera de KV (sin backup)
-- ----------------------------------------------------------------------------
-- El resultado "staged" vivía SOLO en Vercel KV con TTL de 7 días. Un flush de KV
-- (ya ocurrió una vez) deja partidos sin resolver en silencio. Persistimos también
-- aquí (Supabase, con backup) como fuente de verdad duradera; KV queda como caché.
CREATE TABLE IF NOT EXISTS public.match_results (
  match_id    VARCHAR(50) PRIMARY KEY,
  result      JSONB NOT NULL,
  status      VARCHAR(20),
  source      VARCHAR(40),
  staged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
-- Solo backend (service_role). Sin políticas → el rol del usuario no accede.
REVOKE ALL ON public.match_results FROM anon, authenticated;
