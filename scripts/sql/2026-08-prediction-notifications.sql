-- Mejora H: notificaciones de engagement del módulo Predicciones.
--
-- Registro de idempotencia / cooldown: garantiza que un mismo usuario no reciba
-- el mismo aviso (p.ej. "tu racha de check-in está en peligro") más de una vez
-- por ventana. La clave es (user_id, dedup_key); el cron compone dedup_key con
-- el día UTC ("streak-reminder:2026-08-14") para que solo se envíe una vez al día.
--
-- No guarda contenido del mensaje, solo el hecho de que se envió. Las
-- preferencias de canal (push/email) viven en notification_preferences con
-- category='predictions-reminder'.

CREATE TABLE IF NOT EXISTS prediction_notifications (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,            -- "streak-reminder", etc.
  dedup_key  TEXT NOT NULL,            -- p.ej. "streak-reminder:2026-08-14"
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS prediction_notifications_kind_idx
  ON prediction_notifications (kind, sent_at DESC);

ALTER TABLE prediction_notifications ENABLE ROW LEVEL SECURITY;

-- El usuario puede leer su propio historial; las escrituras las hace el cron
-- con service_role (bypassa RLS).
DROP POLICY IF EXISTS "prediction_notifications_read_own" ON prediction_notifications;
CREATE POLICY "prediction_notifications_read_own"
  ON prediction_notifications FOR SELECT
  USING (auth.uid() = user_id);
