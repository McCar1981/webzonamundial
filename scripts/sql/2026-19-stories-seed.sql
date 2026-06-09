-- ============================================================================
-- Stories — NADA de contenido inventado.
--
-- Este archivo YA NO inserta Stories de demo (bienvenida ni creadores de
-- prueba). El feed se rellena SOLO con datos reales:
--   • Sistema  → previas y goles que emite el motor automático
--                (/api/stories/generate) con datos REALES del Match Center,
--                únicamente cuando hay partidos en ventana.
--   • Usuarios → cuando publican sus propias Stories.
--   • Creadores→ cuando publican (atadas a su community_slug real).
--
-- Lo único que hace ahora es LIMPIAR cualquier resto de seeds antiguos, por si
-- se ejecutó una versión previa de este archivo. No inserta nada.
--
-- Para vaciar TODO el feed manualmente (reset total), usar:
--     DELETE FROM public.stories;
-- ============================================================================

-- Limpieza idempotente de cualquier seed de demo anterior. No inserta nada.
DELETE FROM public.stories WHERE template_data ->> 'seed' = 'true';
