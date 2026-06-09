-- scripts/sql/2026-21-predictions-was-pro.sql
--
-- Plan PRO en Predicciones: los multiplicadores (underdog, racha, early bird,
-- confianza) pasan a ser beneficio Pro. Como las predicciones se resuelven
-- días después de crearse, persistimos AQUÍ si el autor era Pro al crearla:
-- la resolución no consulta el entitlement (podría haber cambiado) sino esta
-- foto. DEFAULT TRUE para que las predicciones históricas (creadas cuando los
-- multiplicadores eran para todos) conserven sus bonus — sin nerf retroactivo.
--
-- Idempotente.

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS was_pro BOOLEAN NOT NULL DEFAULT TRUE;
