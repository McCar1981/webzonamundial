-- scripts/sql/2026-34-cromos.sql
--
-- Sistema de colección de cromos del Mundial 2026.
--
-- Tablas:
--   user_cromos         → qué cromos tiene cada usuario
--   cromo_pack_claims   → registro de sobres abiertos (rate-limit anti-farmeo)
--   cromo_reward_claims → marcas de idempotencia para recompensas (una por día/módulo)
--   cromo_achievements  → logros del álbum desbloqueados por usuario
--   cromo_trade_offers  → ofertas de intercambio P2P
--
-- Integración:
--   · Añade 'album' al catálogo de módulos del coin_ledger
--   · Usa el mismo patrón de claims que el resto de módulos
--
-- Idempotente: CREATE TABLE IF NOT EXISTS; reaplicable sin romper.

-- ============================================================================
-- 1) Colección de cromos por usuario
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_cromos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cromo_id    INTEGER NOT NULL,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source      TEXT NOT NULL DEFAULT 'pack',  -- pack | trade | reward | purchase
  UNIQUE (user_id, cromo_id)
);

CREATE INDEX IF NOT EXISTS user_cromos_user_idx
  ON public.user_cromos (user_id, obtained_at DESC);
CREATE INDEX IF NOT EXISTS user_cromos_cromo_idx
  ON public.user_cromos (cromo_id);

-- ============================================================================
-- 2) Registro de sobres abiertos (rate-limit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cromo_pack_claims (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cromo_1_id INTEGER NOT NULL,
  cromo_2_id INTEGER NOT NULL,
  cromo_3_id INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cromo_pack_claims_user_opened_idx
  ON public.cromo_pack_claims (user_id, opened_at DESC);

-- ============================================================================
-- 3) Extender catálogo de módulos del coin_ledger
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coin_ledger' AND column_name = 'module'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.coin_ledger DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.coin_ledger'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%module%'
    );

    ALTER TABLE public.coin_ledger
      ADD CONSTRAINT coin_ledger_module_check
      CHECK (module IN (
        'predicciones', 'trivia', 'fantasy', 'modo-carrera',
        'micro', 'otros', 'draft-mundial', 'album'
      ));
  END IF;
END $$;

-- ============================================================================
-- 4) Row Level Security
-- ============================================================================
ALTER TABLE public.user_cromos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cromo_pack_claims  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_cromos read own" ON public.user_cromos;
CREATE POLICY "user_cromos read own"
  ON public.user_cromos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_cromos write own" ON public.user_cromos;
CREATE POLICY "user_cromos write own"
  ON public.user_cromos FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cromo_pack_claims read own" ON public.cromo_pack_claims;
CREATE POLICY "cromo_pack_claims read own"
  ON public.cromo_pack_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cromo_pack_claims write own" ON public.cromo_pack_claims;
CREATE POLICY "cromo_pack_claims write own"
  ON public.cromo_pack_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5) Función: conteo de cromos únicos por usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_cromo_count(p_uid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT cromo_id)::INTEGER
  FROM public.user_cromos
  WHERE user_id = p_uid;
$$;

REVOKE ALL ON FUNCTION public.user_cromo_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_cromo_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.user_cromo_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.user_cromo_count(UUID) TO authenticated;

-- ============================================================================
-- 6) Función: último sobre abierto por usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_last_pack_opened_at(p_uid UUID)
RETURNS TIMESTAMPTZ
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MAX(opened_at)
  FROM public.cromo_pack_claims
  WHERE user_id = p_uid;
$$;

REVOKE ALL ON FUNCTION public.user_last_pack_opened_at(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_last_pack_opened_at(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.user_last_pack_opened_at(UUID) TO authenticated;

-- ============================================================================
-- 7) Recompensas de cromos por acciones (idempotencia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cromo_reward_claims (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_key  TEXT NOT NULL,  -- ej: 'daily:2026-06-11', 'trivia:2026-06-11', 'match:ARG-FRA'
  cromo_id   INTEGER NOT NULL,
  source     TEXT NOT NULL DEFAULT 'reward',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, claim_key)
);

CREATE INDEX IF NOT EXISTS cromo_reward_claims_user_idx
  ON public.cromo_reward_claims (user_id, claimed_at DESC);

-- ============================================================================
-- 8) Logros del álbum
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cromo_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS cromo_achievements_user_idx
  ON public.cromo_achievements (user_id);

-- ============================================================================
-- 9) Intercambio P2P de cromos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cromo_trade_offers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active',  -- active | accepted | cancelled
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS cromo_trade_offers_creator_idx
  ON public.cromo_trade_offers (creator_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS cromo_trade_offers_status_idx
  ON public.cromo_trade_offers (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cromo_trade_offered (
  offer_id  UUID NOT NULL REFERENCES public.cromo_trade_offers(id) ON DELETE CASCADE,
  cromo_id  INTEGER NOT NULL,
  PRIMARY KEY (offer_id, cromo_id)
);

CREATE TABLE IF NOT EXISTS public.cromo_trade_wanted (
  offer_id  UUID NOT NULL REFERENCES public.cromo_trade_offers(id) ON DELETE CASCADE,
  cromo_id  INTEGER NOT NULL,
  PRIMARY KEY (offer_id, cromo_id)
);

-- ============================================================================
-- 10) RLS para tablas nuevas
-- ============================================================================
ALTER TABLE public.cromo_reward_claims  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cromo_achievements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cromo_trade_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cromo_trade_offered  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cromo_trade_wanted   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cromo reward claims read own" ON public.cromo_reward_claims;
CREATE POLICY "cromo reward claims read own"
  ON public.cromo_reward_claims FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cromo achievements read own" ON public.cromo_achievements;
CREATE POLICY "cromo achievements read own"
  ON public.cromo_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cromo trade offers read public" ON public.cromo_trade_offers;
CREATE POLICY "cromo trade offers read public"
  ON public.cromo_trade_offers FOR SELECT USING (status = 'active' OR auth.uid() = creator_id OR auth.uid() = accepted_by);

DROP POLICY IF EXISTS "cromo trade offers write own" ON public.cromo_trade_offers;
CREATE POLICY "cromo trade offers write own"
  ON public.cromo_trade_offers FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "cromo trade offered read" ON public.cromo_trade_offered;
CREATE POLICY "cromo trade offered read"
  ON public.cromo_trade_offered FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.cromo_trade_offers WHERE id = offer_id AND (status = 'active' OR creator_id = auth.uid())
  ));

DROP POLICY IF EXISTS "cromo trade wanted read" ON public.cromo_trade_wanted;
CREATE POLICY "cromo trade wanted read"
  ON public.cromo_trade_wanted FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.cromo_trade_offers WHERE id = offer_id AND (status = 'active' OR creator_id = auth.uid())
  ));
