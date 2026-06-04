-- Mejora I: rivalidades 1v1 persistentes del módulo Predicciones.
--
-- Los duelos (prediction_duels) son de un solo partido. Esta tabla agrega el
-- HISTORIAL cara a cara entre dos usuarios: cuántos duelos jugaron, quién va
-- ganando, puntos acumulados y la racha de victorias vigente. Convierte duelos
-- sueltos en una "némesis" persistente ("Vas 5-3 con Carlos · racha de 2").
--
-- Una sola fila por pareja: se guarda con orden canónico (user_low < user_high)
-- para que da igual quién retó a quién. Las escrituras las hace la resolución de
-- duelos con service_role; los usuarios solo leen las suyas.

CREATE TABLE IF NOT EXISTS prediction_rivalries (
  user_low      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wins_low      INT NOT NULL DEFAULT 0,   -- duelos ganados por user_low
  wins_high     INT NOT NULL DEFAULT 0,   -- duelos ganados por user_high
  draws         INT NOT NULL DEFAULT 0,
  duels_count   INT NOT NULL DEFAULT 0,
  points_low    INT NOT NULL DEFAULT 0,   -- puntos acumulados en duelos
  points_high   INT NOT NULL DEFAULT 0,
  streak_holder UUID,                     -- quién lleva la racha (NULL si último fue empate)
  streak_len    INT NOT NULL DEFAULT 0,
  last_match_id  TEXT,
  last_winner_id UUID,                    -- NULL = empate
  last_duel_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_low, user_high),
  CHECK (user_low < user_high)
);

CREATE INDEX IF NOT EXISTS prediction_rivalries_low_idx  ON prediction_rivalries (user_low);
CREATE INDEX IF NOT EXISTS prediction_rivalries_high_idx ON prediction_rivalries (user_high);

ALTER TABLE prediction_rivalries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prediction_rivalries_read_own" ON prediction_rivalries;
CREATE POLICY "prediction_rivalries_read_own"
  ON prediction_rivalries FOR SELECT
  USING (auth.uid() = user_low OR auth.uid() = user_high);
