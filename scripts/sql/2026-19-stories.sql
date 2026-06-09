-- ============================================================================
-- Stories — momentos de la plataforma empaquetados como contenido efímero e
-- interactivo (vertical, datos en vivo, widgets). Aplicar en el SQL editor de
-- Supabase. Idempotente.
--
-- 5 tipos de Story: creator | system | user | narrative | league.
-- TTL de 24h: is_active + expires_at; pasado el plazo se archiva (Momentos).
--
-- Tres tablas:
--   stories         → la Story (1 fila por Story). La emite el sistema/creador/
--                     usuario; los contadores los mueve el backend (service role).
--   story_views     → la vista de cada usuario (RLS: propia) + su interacción
--                     con los widgets (encuestas/micro-predicciones embebidas).
--   story_templates → catálogo de plantillas visuales (lo gestiona el backend).
--
-- Reparto de clientes (igual que micro-predicciones):
--   - stories: legible por todos (la UI las pinta); inserción del sistema y
--     narrativas con service role; el usuario solo inserta/borra las SUYAS.
--   - story_views: cada usuario lee/crea/actualiza SOLO las suyas.
--   - story_templates: legible por todos; gestión por service role.
-- ============================================================================

-- ─── Stories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              VARCHAR(20) NOT NULL,                 -- creator | system | user | narrative | league
  author_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL para system/narrative
  author_type       VARCHAR(20) NOT NULL,                 -- creator | system | user
  league_id         UUID,                                 -- nullable (Stories de liga)
  media_type        VARCHAR(20) NOT NULL DEFAULT 'template', -- image | video | template
  media_url         TEXT,                                 -- foto del usuario como data-URL (base64); puede superar 500 chars
  overlay_text      TEXT,
  widgets           JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{kind,...}] widgets interactivos
  template_id       VARCHAR(50),
  template_data     JSONB NOT NULL DEFAULT '{}'::jsonb,    -- datos para rellenar el template
  related_match_id  VARCHAR(50),                           -- nullable (alineado a match_id string del Match Center)
  community_slug    VARCHAR(60),                           -- comunidad del creador del autor (profiles.fav_creator); scope de visibilidad de Stories de usuario
  view_count        INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  share_count       INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,         -- TRUE si dentro de las 24h
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compat: si la tabla ya existía sin la columna de comunidad, la añade.
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS community_slug VARCHAR(60);

-- Compat: si la tabla ya existía con media_url VARCHAR(500), la amplía a TEXT.
-- Las Stories de foto guardan la imagen como data-URL (base64), que excede 500
-- caracteres y hacía fallar el insert ("value too long for type varchar(500)").
ALTER TABLE public.stories ALTER COLUMN media_url TYPE TEXT;

-- Feed (carrusel): Stories activas, recientes primero.
CREATE INDEX IF NOT EXISTS stories_active_idx
  ON public.stories (is_active, expires_at DESC, created_at DESC);

-- Stories de usuario por comunidad de creador (scope de visibilidad del feed).
CREATE INDEX IF NOT EXISTS stories_community_idx
  ON public.stories (community_slug, created_at DESC)
  WHERE community_slug IS NOT NULL;

-- Stories de un autor (creador/usuario): "Mis Stories" y agrupación por autor.
CREATE INDEX IF NOT EXISTS stories_author_idx
  ON public.stories (author_id, created_at DESC);

-- Stories de una liga.
CREATE INDEX IF NOT EXISTS stories_league_idx
  ON public.stories (league_id, created_at DESC)
  WHERE league_id IS NOT NULL;

-- Stories de un partido (las automáticas del sistema cuelgan de un match).
CREATE INDEX IF NOT EXISTS stories_match_idx
  ON public.stories (related_match_id, created_at DESC)
  WHERE related_match_id IS NOT NULL;

-- El cron de archivado busca por estado + vencimiento.
CREATE INDEX IF NOT EXISTS stories_expiry_idx
  ON public.stories (is_active, expires_at);

-- ─── Vistas de usuario ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_views (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id          UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,        -- vio la Story entera
  widget_interacted BOOLEAN NOT NULL DEFAULT FALSE,
  interaction_data  JSONB NOT NULL DEFAULT '{}'::jsonb,    -- respuestas a encuestas/predicciones
  shared_to         VARCHAR(50),                           -- instagram | whatsapp | twitter | …
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Una sola fila por (story, usuario): la vista se upsertea (vista → completada →
-- interacción) sin duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS story_views_story_user_uniq
  ON public.story_views (story_id, user_id);

-- "Qué Stories ya vio el usuario" para marcar el carrusel (anillo gastado).
CREATE INDEX IF NOT EXISTS story_views_user_idx
  ON public.story_views (user_id, viewed_at DESC);

-- ─── Plantillas visuales ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_templates (
  id            VARCHAR(50) PRIMARY KEY,                   -- ej: goal_celebration | pre_match
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(20) NOT NULL,                      -- match_event | daily | narrative | user | league
  layout        JSONB NOT NULL DEFAULT '{}'::jsonb,        -- definición del layout visual
  placeholders  JSONB NOT NULL DEFAULT '[]'::jsonb,        -- campos a rellenar dinámicamente
  widget_slots  JSONB NOT NULL DEFAULT '[]'::jsonb,        -- posiciones de widgets
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS story_templates_category_idx
  ON public.story_templates (category, is_active);

-- ============================================================================
-- Row Level Security
--   stories         → SELECT abierto (la UI las pinta; el filtrado de visibilidad
--                     —liga, personalización— vive en las queries del store).
--                     El usuario solo inserta/actualiza/borra las SUYAS
--                     (author_type='user'). system/narrative/creator → service role.
--   story_views     → cada usuario lee/crea/actualiza SOLO las suyas.
--   story_templates → SELECT abierto; gestión por service role.
-- ============================================================================
ALTER TABLE public.stories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories read all"    ON public.stories;
DROP POLICY IF EXISTS "stories insert own"  ON public.stories;
DROP POLICY IF EXISTS "stories update own"  ON public.stories;
DROP POLICY IF EXISTS "stories delete own"  ON public.stories;
CREATE POLICY "stories read all"
  ON public.stories FOR SELECT USING (TRUE);
CREATE POLICY "stories insert own"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = author_id AND author_type = 'user');
CREATE POLICY "stories update own"
  ON public.stories FOR UPDATE
  USING (auth.uid() = author_id AND author_type = 'user');
CREATE POLICY "stories delete own"
  ON public.stories FOR DELETE
  USING (auth.uid() = author_id AND author_type = 'user');

DROP POLICY IF EXISTS "story views read own"   ON public.story_views;
DROP POLICY IF EXISTS "story views insert own" ON public.story_views;
DROP POLICY IF EXISTS "story views update own" ON public.story_views;
CREATE POLICY "story views read own"
  ON public.story_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "story views insert own"
  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story views update own"
  ON public.story_views FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "story templates read all" ON public.story_templates;
CREATE POLICY "story templates read all"
  ON public.story_templates FOR SELECT USING (TRUE);

-- ============================================================================
-- Contador atómico de Stories (view_count | interaction_count | share_count).
-- El backend (service role) lo llama tras registrar vista/interacción/compartido
-- para evitar carreras de read-then-write. SECURITY DEFINER + columna en lista
-- blanca para que no se pueda escribir cualquier campo.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_story_counter(
  p_story_id UUID,
  p_column   TEXT,
  p_delta    INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column NOT IN ('view_count', 'interaction_count', 'share_count') THEN
    RAISE EXCEPTION 'invalid counter column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE public.stories SET %I = %I + $1 WHERE id = $2',
    p_column, p_column
  ) USING p_delta, p_story_id;
END;
$$;

-- Solo el service role la invoca desde el backend.
REVOKE ALL ON FUNCTION public.increment_story_counter(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_story_counter(UUID, TEXT, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_story_counter(UUID, TEXT, INTEGER) TO service_role;
