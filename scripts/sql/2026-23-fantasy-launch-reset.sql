-- scripts/sql/2026-23-fantasy-launch-reset.sql
--
-- RESET DE LANZAMIENTO DEL FANTASY — EJECUTAR UNA SOLA VEZ, ANTES DEL PITIDO
-- INICIAL (11 jun 2026, 12:00 ET). DESTRUCTIVO a propósito.
--
-- Durante la pretemporada el Fantasy funcionó con una SIMULACIÓN determinista y
-- pruebas internas. Cualquier punto de jornada, cobro de Fútcoins, chip gastado o
-- reembolso registrado hasta hoy es de esa etapa de pruebas — NO de partidos
-- reales (el torneo aún no ha empezado: gameweekIsOver() e isFantasyLive() son
-- false para todo). Si no se purga, ese progreso ficticio contaminaría el ranking
-- competitivo del torneo real y dejaría a algunos usuarios atascados en una
-- "Jornada 3" de pretemporada sin poder jugar las jornadas reales 1-2.
--
-- Este script:
--   1) Borra TODOS los puntos por jornada (ranking semanal de pretemporada).
--   2) Borra TODOS los cobros de Fútcoins del Fantasy (vuelven a estar disponibles).
--   3) Resetea el progreso de cada equipo a Jornada 1 / 0 puntos / sin historial,
--      CONSERVANDO la plantilla (slots, formación, capitán, nombre, creador).
--
-- CONSERVA la plantilla del usuario; RESETEA su progreso. Idempotente: reaplicarlo
-- tras el arranque borraría progreso REAL, así que ejecútalo SOLO antes del saque.
--
-- Nota: budgetBonus y refundedIds se ponen a 0/[] (no hubo eliminaciones reales en
-- pretemporada). Un equipo que se hubiera armado por encima de 100M usando crédito
-- de reembolso simulado quedará "fuera de presupuesto" y el usuario deberá ajustarlo
-- antes de jugar — es el comportamiento correcto para una salida justa.

BEGIN;

-- 1) Puntos por jornada de pretemporada → fuera.
DELETE FROM public.fantasy_gameweek_scores;

-- 2) Cobros de Fútcoins del Fantasy de pretemporada → fuera (se podrán volver a
--    cobrar en el torneo real). La tabla es exclusiva del Fantasy.
DELETE FROM public.fantasy_coin_claims;

-- 3) Reset del progreso por equipo, conservando la plantilla. El merge JSONB (||)
--    sobrescribe solo estas claves; slots/formation/teamName/captainId/viceId/
--    creatorSlug se mantienen intactos.
UPDATE public.fantasy_teams
SET total_points = 0,
    gameweek     = 1,
    state = COALESCE(state, '{}'::jsonb) || jsonb_build_object(
      'gameweek',      1,
      'totalPoints',   0,
      'history',       '[]'::jsonb,
      'committedSlots','[]'::jsonb,   -- el armado de la 1ª jornada real es gratis
      'freeTransfers', 1,
      'powerUp',       null,           -- desarma cualquier chip de pretemporada
      'powerUpsUsed',  '[]'::jsonb,    -- los 5 chips vuelven a estar disponibles
      'budgetBonus',   0,              -- sin reembolsos reales todavía
      'refundedIds',   '[]'::jsonb
    ),
    updated_at = NOW();

COMMIT;

-- Verificación opcional (ejecutar tras el COMMIT):
--   SELECT count(*) AS scores_restantes FROM public.fantasy_gameweek_scores;            -- 0
--   SELECT count(*) AS claims_restantes FROM public.fantasy_coin_claims;                -- 0
--   SELECT count(*) FILTER (WHERE gameweek <> 1 OR total_points <> 0) AS equipos_sin_resetear
--     FROM public.fantasy_teams;                                                        -- 0
