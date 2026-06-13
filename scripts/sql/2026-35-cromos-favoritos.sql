-- scripts/sql/2026-35-cromos-favoritos.sql
--
-- Añade tabla de cromos favoritos por usuario.

CREATE TABLE IF NOT EXISTS public.user_cromo_favorites (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cromo_id     INTEGER NOT NULL,
  favorited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, cromo_id)
);

CREATE INDEX IF NOT EXISTS user_cromo_favorites_user_idx
  ON public.user_cromo_favorites (user_id);

ALTER TABLE public.user_cromo_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_cromo_favorites read own" ON public.user_cromo_favorites;
CREATE POLICY "user_cromo_favorites read own"
  ON public.user_cromo_favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_cromo_favorites write own" ON public.user_cromo_favorites;
CREATE POLICY "user_cromo_favorites write own"
  ON public.user_cromo_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_cromo_favorites delete own" ON public.user_cromo_favorites;
CREATE POLICY "user_cromo_favorites delete own"
  ON public.user_cromo_favorites FOR DELETE USING (auth.uid() = user_id);
