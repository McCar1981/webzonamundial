-- 2026-26 · Tipo de porra: bar | empresa
--
-- Distingue una porra de bar de una corporativa. Por defecto 'bar', así que NO
-- cambia el comportamiento de las porras existentes. El kit de activación usa
-- este valor para elegir el cartel correcto ("EN TU BAR" vs "EN TU EMPRESA").
--
-- El alta de empresa (fase 2) lo pondrá a 'empresa'. Mientras tanto, para marcar
-- una porra como corporativa:
--   UPDATE public.bars SET kind = 'empresa' WHERE slug = '<slug-de-la-porra>';

ALTER TABLE public.bars
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'bar';

DO $$ BEGIN
  ALTER TABLE public.bars ADD CONSTRAINT bars_kind_check CHECK (kind IN ('bar', 'empresa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
