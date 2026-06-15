-- scripts/sql/2026-36-cromos-rls-hardening.sql
--
-- Endurecimiento RLS del módulo de cromos.
--
-- Problema: user_cromos y cromo_pack_claims tenían una política RLS de INSERT
-- "write own" (WITH CHECK auth.uid() = user_id). Como el anon key es público,
-- cualquier usuario autenticado podía insertar filas para sí mismo desde el
-- navegador (supabase.from('user_cromos').insert(...)) y AUTO-REGALARSE los 150
-- cromos, saltándose el servidor y el cooldown de sobres.
--
-- Todas las escrituras legítimas del álbum van por el service-role (adminClient),
-- que ignora RLS, así que estas políticas de INSERT no hacen falta y solo abren
-- superficie de abuso. Las eliminamos. Las políticas de SELECT "read own" se
-- mantienen (las lecturas del cliente sí dependen de ellas).
--
-- Idempotente: DROP POLICY IF EXISTS; reaplicable sin romper.

DROP POLICY IF EXISTS "user_cromos write own"       ON public.user_cromos;
DROP POLICY IF EXISTS "cromo_pack_claims write own" ON public.cromo_pack_claims;

-- Tras esto, user_cromos y cromo_pack_claims quedan SELECT-own + escritura solo
-- service-role. RLS sigue habilitada: al no existir política de INSERT, cualquier
-- inserción desde el cliente queda denegada por defecto.
