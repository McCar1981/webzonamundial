-- =============================================================================
-- 2026-27 — PROGRAMA DE CREADORES: panel /admin (creadores + admin)
-- =============================================================================
-- Da soporte al panel de monetización de creadores:
--   * creator_program  — roster del programa (nivel, % revenue share, umbral y
--                        techo del bono mensual, email de acceso al panel).
--   * creator_payments — pagos liquidados a cada creador (bono, rev share…).
--   * creator_sponsors — patrocinadores aportados por cada creador (70/30).
--   * Funciones de agregación (SECURITY DEFINER, solo service_role) para que
--     el panel server-rendered lea registros/premium por creador sin exponer
--     profiles. Las ventanas "mes/día" usan hora de Madrid (igual que el
--     negocio liquida: una vez al mes, mes natural español).
--
-- Modelo (doc "ZonaMundial_Modelo_Ingresos_Creadores"):
--   CAPA 2 — revenue share 35–50% según nivel.
--   CAPA 3 — bono €150 por cada `bonus_threshold` registros atribuidos EN EL
--            MES, con techo mensual por nivel (N2 €600 / N3 €750 / N4 €900).
--   Patrocinadores: 70%–30% según quién aporte la marca.
--
-- Idempotente: se puede re-ejecutar sin duplicar nada (el seed no pisa
-- ediciones hechas desde el panel admin).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tablas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.creator_program (
  slug            TEXT PRIMARY KEY,            -- = profiles.fav_creator
  display_name    TEXT NOT NULL,
  email           TEXT UNIQUE,                 -- email de su cuenta web → acceso al panel /admin
  nivel           SMALLINT NOT NULL DEFAULT 2 CHECK (nivel BETWEEN 2 AND 4),
  rev_share_pct   NUMERIC(5,2) NOT NULL DEFAULT 40 CHECK (rev_share_pct BETWEEN 0 AND 100),
  bonus_threshold INTEGER NOT NULL DEFAULT 250 CHECK (bonus_threshold > 0),
  bonus_unit_eur  NUMERIC(10,2) NOT NULL DEFAULT 150 CHECK (bonus_unit_eur > 0),
  bonus_cap_eur   NUMERIC(10,2) NOT NULL DEFAULT 600 CHECK (bonus_cap_eur >= 0),
  audience_label  TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creator_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_slug  TEXT NOT NULL REFERENCES public.creator_program(slug) ON DELETE CASCADE,
  concepto      TEXT NOT NULL DEFAULT 'bono'
                CHECK (concepto IN ('bono', 'revenue_share', 'patrocinio', 'otro')),
  periodo       TEXT,                          -- mes al que corresponde, 'YYYY-MM'
  amount_eur    NUMERIC(10,2) NOT NULL CHECK (amount_eur > 0),
  note          TEXT,
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creator_sponsors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_slug  TEXT NOT NULL REFERENCES public.creator_program(slug) ON DELETE CASCADE,
  empresa       TEXT NOT NULL,
  contacto      TEXT,
  estado        TEXT NOT NULL DEFAULT 'propuesto'
                CHECK (estado IN ('propuesto', 'en_conversacion', 'cerrado', 'descartado')),
  valor_eur     NUMERIC(10,2),                 -- valor del deal (lo fija admin al cerrar)
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2) Índices
-- ---------------------------------------------------------------------------

-- Las agregaciones del panel filtran profiles por fav_creator + created_at.
CREATE INDEX IF NOT EXISTS idx_profiles_fav_creator_created
  ON public.profiles (fav_creator, created_at)
  WHERE fav_creator IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creator_payments_slug
  ON public.creator_payments (creator_slug, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_creator_sponsors_slug
  ON public.creator_sponsors (creator_slug, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3) RLS — solo service_role (el panel es server-rendered con el admin client)
-- ---------------------------------------------------------------------------

ALTER TABLE public.creator_program  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_sponsors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.creator_program  FROM anon, authenticated;
REVOKE ALL ON public.creator_payments FROM anon, authenticated;
REVOKE ALL ON public.creator_sponsors FROM anon, authenticated;
-- Sin policies a propósito: nadie salvo service_role (que bypassa RLS) accede.

-- ---------------------------------------------------------------------------
-- 4) Funciones de agregación (SECURITY DEFINER, solo service_role)
-- ---------------------------------------------------------------------------

-- Stats por creador para el panel y el ranking. Ventanas en hora de Madrid.
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
    COUNT(p.id)                                                                          AS registros_total,
    COUNT(p.id) FILTER (WHERE p.created_at >= lim.mes0)                                  AS registros_mes,
    COUNT(p.id) FILTER (WHERE p.created_at >= lim.dia0)                                  AS registros_hoy,
    COUNT(p.id) FILTER (WHERE p.created_at >= now() - INTERVAL '7 days')                 AS registros_7d,
    COUNT(p.id) FILTER (WHERE p.created_at >= now() - INTERVAL '14 days'
                          AND p.created_at <  now() - INTERVAL '7 days')                 AS registros_7d_prev,
    COUNT(p.id) FILTER (WHERE p.is_premium)                                              AS premium_total
  FROM public.creator_program cp
  CROSS JOIN lim
  LEFT JOIN public.profiles p ON p.fav_creator = cp.slug
  GROUP BY cp.slug;
$$;

-- Serie diaria (últimos p_days días, incluye días a cero) para el gráfico.
CREATE OR REPLACE FUNCTION public.creator_registros_diarios(p_slug TEXT, p_days INTEGER DEFAULT 14)
RETURNS TABLE (dia DATE, registros BIGINT, premium BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH series AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Europe/Madrid')::date - (GREATEST(p_days, 1) - 1),
      (now() AT TIME ZONE 'Europe/Madrid')::date,
      INTERVAL '1 day'
    )::date AS dia
  )
  SELECT
    s.dia,
    COUNT(p.id)                                  AS registros,
    COUNT(p.id) FILTER (WHERE p.is_premium)      AS premium
  FROM series s
  LEFT JOIN public.profiles p
    ON p.fav_creator = p_slug
   AND (p.created_at AT TIME ZONE 'Europe/Madrid')::date = s.dia
  GROUP BY s.dia
  ORDER BY s.dia;
$$;

-- Serie mensual completa (para el histórico del bono, mes natural de Madrid).
CREATE OR REPLACE FUNCTION public.creator_registros_mensuales(p_slug TEXT)
RETURNS TABLE (mes TEXT, registros BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(p.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM') AS mes,
    COUNT(*) AS registros
  FROM public.profiles p
  WHERE p.fav_creator = p_slug
  GROUP BY 1
  ORDER BY 1;
$$;

-- Suscripciones premium vivas de la comunidad del creador y su equivalente
-- mensual en céntimos (yearly se prorratea /12). Base del revenue share.
--
-- plpgsql A PROPÓSITO: pro_subscriptions la crea la migración 2026-20 (Plan
-- Pro), que puede no estar aplicada aún. LANGUAGE sql valida las tablas al
-- CREAR la función (y abortaría esta migración entera); plpgsql solo las
-- resuelve al ejecutar cada rama, así que con el guard de to_regclass la
-- función devuelve ceros hasta que exista la tabla, y datos reales después
-- sin tener que recrearla.
CREATE OR REPLACE FUNCTION public.creator_premium_revenue(p_slug TEXT)
RETURNS TABLE (subs_activas BIGINT, ingresos_mes_cents BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.pro_subscriptions') IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(
      CASE WHEN s.plan = 'yearly' THEN COALESCE(s.amount, 0) / 12
           ELSE COALESCE(s.amount, 0) END
    ), 0)::BIGINT
  FROM public.pro_subscriptions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE p.fav_creator = p_slug
    AND s.status IN ('active', 'trialing');
END;
$$;

REVOKE ALL ON FUNCTION public.creator_program_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_registros_diarios(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_registros_mensuales(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_premium_revenue(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.creator_program_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.creator_registros_diarios(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.creator_registros_mensuales(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.creator_premium_revenue(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 5) Seed — roster ACTIVO (catálogo web src/data/creadores.ts) + condiciones
--    del doc de ingresos. Pimpeano / Nacho CP / Salvador / Franbar / Joaco ya
--    no están en el proyecto → no se siembran. Niku entra con el umbral del
--    grupo de Nereita (500K) y Elopi23 (300K): 250 registros → €150.
--    ON CONFLICT DO NOTHING: re-ejecutar nunca pisa cambios hechos desde el
--    panel admin (emails, niveles, umbrales…).
-- ---------------------------------------------------------------------------

INSERT INTO public.creator_program
  (slug, display_name, nivel, rev_share_pct, bonus_threshold, bonus_unit_eur, bonus_cap_eur, audience_label, active)
VALUES
  ('josecobo', 'José Cobo', 4, 50, 1000, 150, 900, '+3M (4.7M)', TRUE),
  ('svgiago',  'SVGiago',   3, 45,  750, 150, 750, '1M–3M (2.5M)', TRUE),
  ('nereita',  'Nereita',   2, 40,  250, 150, 600, '500K', TRUE),
  ('elopi23',  'Elopi23',   2, 40,  250, 150, 600, '300K', TRUE),
  ('niku',     'Niku',      2, 40,  250, 150, 600, '339K', TRUE)
ON CONFLICT (slug) DO NOTHING;
