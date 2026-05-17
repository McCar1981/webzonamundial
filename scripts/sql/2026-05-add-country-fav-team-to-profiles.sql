-- 2026-05-add-country-fav-team-to-profiles.sql
--
-- Migración Supabase: hacer que el trigger handle_new_user copie también
-- `country` y `fav_team` desde raw_user_meta_data al profile recién
-- creado. Esto permite que el pre-registro web (donde pedimos país +
-- selección favorita antes del magic link) no pierda esos datos si el
-- usuario nunca completa el wizard de onboarding posterior.
--
-- Las columnas `country` y `fav_team` ya existían en public.profiles
-- (las usa el wizard de onboarding). Solo cambiamos el trigger para que
-- las popule en el INSERT inicial si vienen en metadata.
--
-- Cómo aplicar:
--   Supabase Studio → SQL Editor → pegar este archivo → Run.
--
-- Idempotente: usa CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

-- 1. Sustituir la función handle_new_user existente.
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
    locale,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- Cada uno de los campos viene de raw_user_meta_data si el
    -- pre-registro lo guardó (FormularioRegistro.tsx). Si no, NULL.
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(NEW.raw_user_meta_data->>'fav_creator', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'fav_team', ''),
    -- locale: solo aceptamos 'es' o 'en'. Default 'es'.
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'locale', ''),
      'es'
    )::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Si la fila ya existe (caso raro: trigger se reinvoca o magic link
    -- reusado), solo actualizamos los campos NULL — nunca pisamos data
    -- que el user ya editó en onboarding.
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    fav_creator = COALESCE(public.profiles.fav_creator, EXCLUDED.fav_creator),
    country = COALESCE(public.profiles.country, EXCLUDED.country),
    fav_team = COALESCE(public.profiles.fav_team, EXCLUDED.fav_team),
    locale = COALESCE(public.profiles.locale, EXCLUDED.locale),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger AFTER INSERT en auth.users: crea fila en public.profiles con los
   metadatos del pre-registro (username, country, fav_team, fav_creator,
   locale). Idempotente vía ON CONFLICT. Source: scripts/sql/2026-05-add-country-fav-team-to-profiles.sql';

-- 2. Reasegurar el trigger (idempotente).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Para usuarios que YA existen en auth.users pero cuyo profile
--    quedó sin country/fav_team (porque se registraron antes de este
--    cambio): rellenarlos retrospectivamente desde su user_meta_data.
--    Comentado por seguridad — descomentar y ejecutar manual si se quiere.
--
-- UPDATE public.profiles p
-- SET
--   country = COALESCE(p.country, NULLIF(u.raw_user_meta_data->>'country', '')),
--   fav_team = COALESCE(p.fav_team, NULLIF(u.raw_user_meta_data->>'fav_team', '')),
--   updated_at = NOW()
-- FROM auth.users u
-- WHERE u.id = p.id
--   AND (p.country IS NULL OR p.fav_team IS NULL)
--   AND (u.raw_user_meta_data ? 'country' OR u.raw_user_meta_data ? 'fav_team');
