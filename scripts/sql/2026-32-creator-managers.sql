-- =============================================================================
-- 2026-32 — Managers de creadores (rol intermedio del panel /admin)
-- =============================================================================
-- Un MANAGER (p.ej. la agencia que representa a los creadores) entra en
-- zonamundial.app/admin con su cuenta normal y ve la REMUNERACIÓN ECONÓMICA de
-- TODOS los creadores del programa — pero SOLO LECTURA y SIN acceso al resto
-- del admin (gestión, founders, push…). Esas secciones siguen tras la cookie
-- de admin (ADMIN_PASSWORD), que el manager no tiene.
--
-- Jerarquía de acceso del panel /admin:
--   * Cookie admin (Carlos)         → admin completo (/admin/panel, gestión).
--   * Email en creator_managers     → panel financiero agregado (read-only).
--   * Email en creator_program      → panel de SU creador (solo lo suyo).
--   * Sin vínculo                   → aviso de cuenta no vinculada.
--
-- Idempotente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.creator_managers (
  email      TEXT PRIMARY KEY,           -- email de su cuenta web (login) en minúsculas
  name       TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creator_managers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.creator_managers FROM anon, authenticated;
-- Sin policies: solo el backend (service_role) la lee/escribe.
