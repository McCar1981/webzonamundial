-- =============================================================================
-- 2026-41 — Ajuste manual de registros por creador (offset en el panel)
-- =============================================================================
-- El nº de "seguidores" de cada creador es un CONTEO EN VIVO de profiles con
-- fav_creator = slug; no es editable. Para corregir esa cifra a mano (sin
-- borrar ni tocar usuarios reales) añadimos un offset entero `registros_ajuste`
-- que se suma al total y al mes (y por tanto al cálculo del bono). Reversible:
-- ponerlo a 0 deja la cifra real otra vez.
--
-- NO se aplica a "hoy"/"7d"/"premium" ni a la serie diaria (esas siguen
-- mostrando lo real); solo al total y al mes (las cifras que decide Carlos y
-- sobre las que se calcula el bono).
--
-- Idempotente.
-- =============================================================================

-- 1) Columna de ajuste (puede ser negativa).
ALTER TABLE public.creator_program
  ADD COLUMN IF NOT EXISTS registros_ajuste INTEGER NOT NULL DEFAULT 0;

-- 2) Función de stats: aplica el ajuste al total y al mes (clamp a >= 0).
CREATE OR REPLACE FUNCTION public.creator_program_stats()
RETURNS TABLE (
  slug              TEXT,
  registros_total   BIGINT,
  registros_mes     BIGINT,
  registros_hoy     BIGINT,
  registros_7d      BIGINT,
  registros_7d_prev BIGINT,
  premium_total     BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lim AS (
    SELECT
      (date_trunc('month', now() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid') AS mes0,
      (date_trunc('day',   now() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid') AS dia0
  )
  SELECT
    cp.slug,
    GREATEST(0, COUNT(p.id) + cp.registros_ajuste)::BIGINT                               AS registros_total,
    GREATEST(0, COUNT(p.id) FILTER (WHERE p.created_at >= lim.mes0)
                + cp.registros_ajuste)::BIGINT                                           AS registros_mes,
    COUNT(p.id) FILTER (WHERE p.created_at >= lim.dia0)                                  AS registros_hoy,
    COUNT(p.id) FILTER (WHERE p.created_at >= now() - INTERVAL '7 days')                 AS registros_7d,
    COUNT(p.id) FILTER (WHERE p.created_at >= now() - INTERVAL '14 days'
                          AND p.created_at <  now() - INTERVAL '7 days')                 AS registros_7d_prev,
    COUNT(p.id) FILTER (WHERE p.is_premium)                                              AS premium_total
  FROM public.creator_program cp
  CROSS JOIN lim
  LEFT JOIN public.profiles p ON p.fav_creator = cp.slug
  GROUP BY cp.slug, cp.registros_ajuste;
$$;

-- 3) Nereita: −10 (lo pidió Carlos 24-jun). Editable desde /admin/creadores.
UPDATE public.creator_program SET registros_ajuste = -10, updated_at = now() WHERE slug = 'nereita';

-- 4) Comprobación
SELECT slug, display_name, registros_ajuste FROM public.creator_program ORDER BY display_name;
