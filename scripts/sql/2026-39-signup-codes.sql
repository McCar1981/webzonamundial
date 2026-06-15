-- 2026-39-signup-codes.sql
--
-- CÓDIGOS DE CAPTACIÓN (campaña / embajador / sponsor).
--
-- Estrategia de propagación PARALELA a los creadores: el usuario se registra
-- en /registro-codigo (o /registro-codigo/<CODIGO>) con un código que TÚ
-- repartes (radio, flyers, patrocinador, embajador, bar…). A diferencia de
-- los creadores:
--   · No hay landing con marca de creador, solo el código.
--   · Recompensa DOBLE en Fútcoins: al NUEVO usuario (bono de bienvenida) y
--     al DUEÑO del código (embajador/sponsor que tenga cuenta ZM), una vez
--     por cada registro atribuido.
--
-- La atribución se guarda en profiles.signup_code (para métricas/ranking de
-- códigos), igual que fav_creator hace con los creadores.
--
-- Cómo aplicar:
--   Supabase Studio → SQL Editor → pegar este archivo → Run.
-- Idempotente: CREATE ... IF NOT EXISTS + CREATE OR REPLACE.

-- ============================================================================
-- 1) Atribución en el perfil del usuario
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_code TEXT;

CREATE INDEX IF NOT EXISTS profiles_signup_code_idx
  ON public.profiles (signup_code);

-- ============================================================================
-- 2) Catálogo de códigos (lo gestiona el panel /admin/codigos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.signup_codes (
  -- Normalizado en MAYÚSCULAS, solo [A-Z0-9-]. Ej: RADIO5, BAR-MANOLO.
  code             TEXT PRIMARY KEY,
  -- Nombre legible del canal/dueño. Ej: "Radio Marca", "Bar Manolo".
  label            TEXT,
  -- Cuenta ZM del dueño del código (embajador/sponsor). NULL = sin dueño
  -- (solo se cuenta el uso, no se abona a nadie por él).
  owner_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Fútcoins que recibe el NUEVO usuario por registrarse con este código.
  reward_new_user  INTEGER NOT NULL DEFAULT 150
                     CHECK (reward_new_user >= 0 AND reward_new_user <= 100000),
  -- Fútcoins que recibe el DUEÑO del código por cada registro atribuido.
  reward_owner     INTEGER NOT NULL DEFAULT 75
                     CHECK (reward_owner >= 0 AND reward_owner <= 100000),
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  -- Tope de usos. NULL = ilimitado.
  max_uses         INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count       INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3) Canjes: UNA fila por usuario. Garantiza recompensa única por persona.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.signup_code_redemptions (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code             TEXT NOT NULL REFERENCES public.signup_codes(code) ON DELETE CASCADE,
  reward_new_user  INTEGER NOT NULL DEFAULT 0,
  reward_owner     INTEGER NOT NULL DEFAULT 0,
  owner_user_id    UUID,
  redeemed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signup_code_redemptions_code_idx
  ON public.signup_code_redemptions (code);

-- ============================================================================
-- 4) RLS: ambas tablas las maneja SOLO el backend (service role, que bypassa
--    RLS). Sin policies → lectura/escritura denegada para anon/auth.
-- ============================================================================
ALTER TABLE public.signup_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_code_redemptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5) Extender el catálogo de módulos del coin_ledger con 'codigo'
--    (mismo patrón idempotente que 2026-33 / 2026-34).
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
        'micro', 'otros', 'draft-mundial', 'album', 'codigo'
      ));
  END IF;
END $$;

-- ============================================================================
-- 6) handle_new_user: copiar también signup_code desde raw_user_meta_data.
--    Reemplaza la función de 2026-05 añadiendo el campo signup_code. Así el
--    pre-registro web (FormularioRegistro) no pierde el código aunque el
--    usuario nunca complete el onboarding.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    fav_creator,
    country,
    fav_team,
    signup_code,
    locale,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(NEW.raw_user_meta_data->>'fav_creator', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'fav_team', ''),
    -- Normalizamos el código a MAYÚSCULAS y caracteres válidos.
    NULLIF(upper(regexp_replace(
      COALESCE(NEW.raw_user_meta_data->>'signup_code', ''), '[^A-Za-z0-9-]', '', 'g'
    )), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'locale', ''), 'es')::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username    = COALESCE(public.profiles.username, EXCLUDED.username),
    fav_creator = COALESCE(public.profiles.fav_creator, EXCLUDED.fav_creator),
    country     = COALESCE(public.profiles.country, EXCLUDED.country),
    fav_team    = COALESCE(public.profiles.fav_team, EXCLUDED.fav_team),
    signup_code = COALESCE(public.profiles.signup_code, EXCLUDED.signup_code),
    locale      = COALESCE(public.profiles.locale, EXCLUDED.locale),
    updated_at  = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7) RPC de canje ATÓMICA (claim-first).
--    Una sola llamada hace TODO en una transacción:
--      a) Normaliza y valida el código (existe, activo, sin agotar).
--      b) Inserta el canje único por usuario (PK user_id). Si ya existía,
--         devuelve 'already' y NO abona nada (recompensa única por persona).
--      c) Suma el uso, marca la atribución en profiles.signup_code.
--      d) Abona Fútcoins al nuevo usuario y al dueño (si procede) en
--         profiles.coins y registra ambos abonos en coin_ledger (módulo
--         'codigo'). El dueño NO cobra por su propio registro.
--    Devuelve el estado y los importes abonados para logging/UI.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.redeem_signup_code(p_user_id UUID, p_code TEXT)
RETURNS TABLE (
  status              TEXT,
  awarded_new_user    INTEGER,
  awarded_owner       INTEGER,
  out_owner_user_id   UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code      public.signup_codes%ROWTYPE;
  v_norm      TEXT;
  v_rew_owner INTEGER;
  v_inserted  INTEGER;
BEGIN
  v_norm := upper(regexp_replace(COALESCE(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
  IF v_norm = '' THEN
    RETURN QUERY SELECT 'invalid'::TEXT, 0, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Lock de la fila del código para serializar uses_count / max_uses.
  SELECT * INTO v_code FROM public.signup_codes WHERE code = v_norm FOR UPDATE;
  IF NOT FOUND OR NOT v_code.active THEN
    RETURN QUERY SELECT 'invalid'::TEXT, 0, 0, NULL::UUID;
    RETURN;
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.uses_count >= v_code.max_uses THEN
    RETURN QUERY SELECT 'exhausted'::TEXT, 0, 0, NULL::UUID;
    RETURN;
  END IF;

  -- El dueño no cobra por su propio registro (anti-abuso).
  v_rew_owner := CASE
    WHEN v_code.owner_user_id IS NOT NULL AND v_code.owner_user_id <> p_user_id
      THEN v_code.reward_owner
    ELSE 0
  END;

  -- claim-first: una fila por usuario. Si ya canjeó (cualquier código), nada.
  INSERT INTO public.signup_code_redemptions
    (user_id, code, reward_new_user, reward_owner, owner_user_id)
  VALUES
    (p_user_id, v_norm, v_code.reward_new_user, v_rew_owner,
     CASE WHEN v_rew_owner > 0 THEN v_code.owner_user_id ELSE NULL END)
  ON CONFLICT (user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN QUERY SELECT 'already'::TEXT, 0, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Primer canje de este usuario: contar uso + atribución.
  UPDATE public.signup_codes
    SET uses_count = uses_count + 1, updated_at = NOW()
    WHERE code = v_norm;

  UPDATE public.profiles
    SET signup_code = COALESCE(signup_code, v_norm), updated_at = NOW()
    WHERE id = p_user_id;

  -- Abono al NUEVO usuario.
  IF v_code.reward_new_user > 0 THEN
    UPDATE public.profiles
      SET coins = COALESCE(coins, 0) + v_code.reward_new_user
      WHERE id = p_user_id;
    INSERT INTO public.coin_ledger (user_id, module, coins, xp)
      VALUES (p_user_id, 'codigo', v_code.reward_new_user, 0);
  END IF;

  -- Abono al DUEÑO del código (si tiene cuenta y no es el propio usuario).
  IF v_rew_owner > 0 THEN
    UPDATE public.profiles
      SET coins = COALESCE(coins, 0) + v_rew_owner
      WHERE id = v_code.owner_user_id;
    -- Solo registramos en el ledger si el dueño tiene profile (FK).
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_code.owner_user_id) THEN
      INSERT INTO public.coin_ledger (user_id, module, coins, xp)
        VALUES (v_code.owner_user_id, 'codigo', v_rew_owner, 0);
    END IF;
  END IF;

  RETURN QUERY SELECT
    'ok'::TEXT,
    v_code.reward_new_user,
    v_rew_owner,
    CASE WHEN v_rew_owner > 0 THEN v_code.owner_user_id ELSE NULL END;
END;
$$;

-- ============================================================================
-- 8) RPC auxiliar: resolver el user_id de un email (para asignar dueño en el
--    panel admin sin exponer la tabla auth.users). SECURITY DEFINER.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$$;

-- Inverso: email del dueño a partir de su user_id (para mostrarlo en el panel).
CREATE OR REPLACE FUNCTION public.get_email_by_user_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id LIMIT 1;
$$;

-- Permisos: estas RPC las invoca el backend con service_role (que ya puede
-- todo). Revocamos el acceso público por prudencia.
REVOKE ALL ON FUNCTION public.redeem_signup_code(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_email_by_user_id(UUID)     FROM PUBLIC, anon, authenticated;
