-- 2026-30-profiles-insert-policy.sql
--
-- Migración Supabase: policy RLS de INSERT para public.profiles.
--
-- Verificado en prod (2026-06-10): profiles solo tiene policies de SELECT
-- (profiles_select_all) y UPDATE (profiles_update_own). Sin policy de
-- INSERT, el upsert del onboarding (PR #61) queda denegado por defecto
-- cuando la fila de profiles no existe (usuario anterior al trigger
-- handle_new_user, o trigger caído en el momento del alta).
--
-- Con esta policy un usuario autenticado puede crear ÚNICAMENTE su propia
-- fila (id = auth.uid()). El path UPDATE del upsert sigue cubierto por
-- profiles_update_own; el INSERT que hace el trigger handle_new_user no
-- se ve afectado (SECURITY DEFINER, salta RLS).
--
-- Cómo aplicar:
--   Supabase Studio → SQL Editor → pegar este archivo → Run.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY.

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
