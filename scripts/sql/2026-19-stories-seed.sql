-- ============================================================================
-- Seed de Stories de prueba (tipo Instagram/WhatsApp) para ver el visor.
-- Aplicar DESPUÉS de 2026-19-stories.sql, en el SQL editor de Supabase.
--
-- SOLO toca la tabla stories del módulo Stories. Idempotente: borra primero el
-- seed previo (template_data->>'seed' = 'true') y reinserta. Stories activas 24h.
-- Correr de nuevo refresca el TTL.
-- ============================================================================

-- Limpieza idempotente del seed anterior.
DELETE FROM public.stories WHERE template_data ->> 'seed' = 'true';

INSERT INTO public.stories
  (type, author_id, author_type, media_type, overlay_text, widgets, template_data, related_match_id, is_active, expires_at)
VALUES
  -- — Sistema: pre-partido con encuesta —
  ('system', NULL, 'system', 'template',
   '⚽ España 🇪🇸 vs Brasil 🇧🇷 — hoy 21:00',
   '[{"kind":"poll","id":"w-pre-1","question":"¿Quién gana?","options":[{"key":"esp","label":"🇪🇸 España"},{"key":"draw","label":"Empate"},{"key":"bra","label":"🇧🇷 Brasil"}]}]'::jsonb,
   '{"seed":true}'::jsonb, 'demo-esp-bra', TRUE, NOW() + INTERVAL '24 hours'),

  -- — Sistema: predicción de la comunidad + CTA a predecir —
  ('system', NULL, 'system', 'template',
   '📊 La comunidad predice: 67% España, 33% Brasil',
   '[{"kind":"quick_prediction","id":"w-pre-2","label":"Haz tu predicción ahora","matchId":"demo-esp-bra"}]'::jsonb,
   '{"seed":true}'::jsonb, 'demo-esp-bra', TRUE, NOW() + INTERVAL '24 hours'),

  -- — Sistema: gol en vivo con micro-reto —
  ('system', NULL, 'system', 'template',
   '⚽ GOOOL de Yamal (min 34) — España 1-0',
   '[{"kind":"micro_challenge","id":"w-goal-1","question":"¿Habrá más goles?"}]'::jsonb,
   '{"seed":true}'::jsonb, 'demo-esp-bra', TRUE, NOW() + INTERVAL '24 hours'),

  -- — Sistema: diaria con CTA —
  ('system', NULL, 'system', 'template',
   '☀️ Buenos días, DT. Hoy hay 3 partidos, 1 es 💎 Diamante ×2.0',
   '[{"kind":"cta","id":"w-daily-1","label":"Ver partidos del día","href":"/app/matchcenter"}]'::jsonb,
   '{"seed":true}'::jsonb, NULL, TRUE, NOW() + INTERVAL '24 hours'),

  -- — Narrativa (IA / revista) —
  ('narrative', NULL, 'system', 'template',
   '📖 ¿Sabías que...? Brasil tiene 28% de probabilidad de ganar el Mundial según el modelo.',
   '[]'::jsonb, '{"seed":true}'::jsonb, NULL, TRUE, NOW() + INTERVAL '24 hours'),

  ('narrative', NULL, 'system', 'template',
   '💡 El dato del día: 14 de los últimos 20 partidos de España terminaron con +2.5 goles.',
   '[]'::jsonb, '{"seed":true}'::jsonb, NULL, TRUE, NOW() + INTERVAL '24 hours'),

  -- — Creador: predicción cifrada + CTA a liga —
  ('creator', NULL, 'creator', 'template',
   '🎬 Mi predicción del España vs Brasil 🔒 — mañana la revelo',
   '[{"kind":"cta","id":"w-creator-1","label":"Únete a mi liga","href":"/app/ligas"}]'::jsonb,
   '{"seed":true}'::jsonb, NULL, TRUE, NOW() + INTERVAL '24 hours'),

  -- — Creador: equipo fantasy + encuesta —
  ('creator', NULL, 'creator', 'template',
   '🔥 Este es mi once para la jornada. ¿Mejor que el tuyo?',
   '[{"kind":"poll","id":"w-creator-2","question":"¿Mi equipo o el tuyo?","options":[{"key":"yours","label":"El tuyo es mejor"},{"key":"mine","label":"El mío gana"}]}]'::jsonb,
   '{"seed":true}'::jsonb, NULL, TRUE, NOW() + INTERVAL '24 hours');
