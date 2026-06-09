-- ============================================================================
-- Seed de Stories de prueba (tipo Instagram/WhatsApp) para ver el visor.
-- Aplicar DESPUÉS de 2026-19-stories.sql, en el SQL editor de Supabase.
--
-- SOLO toca la tabla stories del módulo Stories. Idempotente: borra primero el
-- seed previo (template_data->>'seed' = 'true') y reinserta. Stories activas 24h.
-- Correr de nuevo refresca el TTL.
--
-- INFORMACIÓN CIERTA: este seed NO inventa hechos de partidos (marcadores,
-- goles, % de comunidad, número de partidos del día). Esas Stories de sistema
-- las EMITE el motor automático (/api/stories/generate) con datos REALES del
-- Match Center cuando hay partidos en ventana. Aquí solo dejamos:
--   - 1 Story de sistema neutra (bienvenida, sin cifras inventadas).
--   - Stories de CREADOR atadas a creadores REALES (community_slug = su slug de
--     src/data/creadores.ts) → el feed muestra su NOMBRE y FOTO de perfil, y
--     SOLO las ven los usuarios de la comunidad de ese creador (fav_creator).
-- ============================================================================

-- Limpieza idempotente del seed anterior.
DELETE FROM public.stories WHERE template_data ->> 'seed' = 'true';

INSERT INTO public.stories
  (type, author_id, author_type, media_type, overlay_text, widgets, template_data, community_slug, related_match_id, is_active, expires_at)
VALUES
  -- — Sistema: bienvenida neutra (sin datos inventados) —
  ('system', NULL, 'system', 'template',
   '⚽ Bienvenido a ZonaMundial. Sigue el Mundial en directo.',
   '[{"kind":"cta","id":"w-welcome-1","label":"Ver el Match Center","href":"/app/matchcenter"}]'::jsonb,
   '{"seed":true}'::jsonb, NULL, NULL, TRUE, NOW() + INTERVAL '24 hours'),

  -- — Creador REAL (José Cobo): se muestra con su nombre y foto; solo lo ve su comunidad —
  ('creator', NULL, 'creator', 'template',
   '🎬 Hoy analizo las claves del Mundial en mi directo. ¿Te lo pierdes?',
   '[{"kind":"cta","id":"w-creator-1","label":"Únete a mi liga","href":"/app/ligas"}]'::jsonb,
   '{"seed":true}'::jsonb, 'josecobo', NULL, TRUE, NOW() + INTERVAL '24 hours'),

  -- — Creador REAL (SVGiago): encuesta a su comunidad —
  ('creator', NULL, 'creator', 'template',
   '🔥 ¿Con qué selección vas en este Mundial?',
   '[{"kind":"poll","id":"w-creator-2","question":"¿Tu favorita?","options":[{"key":"esp","label":"España"},{"key":"arg","label":"Argentina"},{"key":"otra","label":"Otra"}]}]'::jsonb,
   '{"seed":true}'::jsonb, 'svgiago', NULL, TRUE, NOW() + INTERVAL '24 hours');
