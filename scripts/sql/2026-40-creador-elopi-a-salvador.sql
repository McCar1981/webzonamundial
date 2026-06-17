-- =============================================================================
-- 2026-40 — Sustitución de creador: Elopi23 → Salvador (Salvador Otero)
-- =============================================================================
-- Sale Elopi23 del proyecto y entra Salvador (@salvadoroterogk). Salvador
-- ocupa su sitio y HEREDA TODO lo de Elopi: seguidores, condiciones de pago y
-- el acceso de ADMINISTRADOR a su panel de creador.
--
-- Qué hace, en orden y dentro de una sola transacción (todo o nada):
--   1) Migra los "seguidores" in-app: cada perfil que tenía a Elopi como
--      creador favorito (profiles.fav_creator = 'elopi23') pasa a 'salvador'.
--      La atribución de registros/bono del programa va por fav_creator, así
--      que con esto Salvador hereda los registros que tenía Elopi.
--   2) Da de alta a Salvador en el programa de pagos con las MISMAS condiciones
--      de Elopi (nivel 2 · 40% rev-share · 250 registros→150€ · tope 600€) y
--      con su EMAIL DE ADMINISTRADOR (acceso a /admin/creadores). Sustituye al
--      administrador de Elopi por el de Salvador.
--      → El email debe ser el de la cuenta web (login) de Salvador. Se usa
--        salvadoroterogk@gmail.com (el que publica en su perfil). Si su cuenta
--        en ZonaMundial usa otro email, cambia SOLO ese valor.
--   3) Re-apunta a Salvador cualquier pago/patrocinio que tuviera Elopi (las
--      FK a creator_program(slug) son ON DELETE CASCADE: hay que moverlos ANTES
--      de borrar a Elopi para no perderlos).
--   4) Retira a Elopi del programa (borra su fila → libera su email/slug).
--
-- Por qué NO se hace un simple "UPDATE creator_program SET slug='salvador'":
--   slug es PRIMARY KEY y las tablas creator_payments / creator_sponsors lo
--   referencian sin ON UPDATE CASCADE → renombrar la PK daría error de FK.
--
-- Idempotente: se puede re-ejecutar sin efectos (todos los pasos quedan en
-- no-op tras la primera ejecución correcta).
--
-- Nota: NO toca la atribución HISTÓRICA de captación (registros con
-- fuente='elopi23' en KV): quién llegó por el enlace de Elopi en su día sigue
-- siendo un hecho histórico. Esto solo cambia el creador favorito actual.
-- Nota: creator_managers (rol de AGENCIA, ve a todos los creadores) no se toca:
-- es de la agencia, no de un creador concreto, y no cambia al sustituir a uno.
-- =============================================================================

BEGIN;

-- 1) Seguidores in-app: Elopi → Salvador
UPDATE public.profiles
   SET fav_creator = 'salvador'
 WHERE fav_creator = 'elopi23';

-- 2) Alta de Salvador en el programa, heredando condiciones + administrador
INSERT INTO public.creator_program
  (slug, display_name, email, nivel, rev_share_pct, bonus_threshold, bonus_unit_eur, bonus_cap_eur, audience_label, active, notes)
VALUES
  ('salvador', 'Salvador Otero', 'salvadoroterogk@gmail.com', 2, 40, 250, 150, 600, '233K', TRUE,
   'Sustituye a Elopi23 (17-jun-2026). Hereda condiciones y acceso de administrador.')
ON CONFLICT (slug) DO UPDATE
  SET display_name   = EXCLUDED.display_name,
      email          = EXCLUDED.email,
      audience_label = EXCLUDED.audience_label,
      active         = TRUE,
      updated_at     = now();

-- 3) Mover a Salvador los pagos/patrocinios previos de Elopi (si existieran)
UPDATE public.creator_payments SET creator_slug = 'salvador' WHERE creator_slug = 'elopi23';
UPDATE public.creator_sponsors SET creator_slug = 'salvador' WHERE creator_slug = 'elopi23';

-- 4) Retirar a Elopi del programa (ya sin filas hijas que apunten a su slug)
DELETE FROM public.creator_program WHERE slug = 'elopi23';

COMMIT;

-- -----------------------------------------------------------------------------
-- Comprobación (opcional, fuera de la transacción):
--   SELECT slug, display_name, email, active FROM public.creator_program ORDER BY slug;
--   SELECT count(*) AS siguen_en_elopi FROM public.profiles WHERE fav_creator = 'elopi23'; -- debe ser 0
--   SELECT count(*) AS ahora_en_salvador FROM public.profiles WHERE fav_creator = 'salvador';
-- -----------------------------------------------------------------------------
