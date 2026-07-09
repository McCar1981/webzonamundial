-- 2026-46-profiles-mis-ligas.sql
--
-- "Mis ligas": el usuario elige UNA O VARIAS ligas favoritas y el hub de Zona
-- de Ligas se convierte en SU feed (solo sus ligas, con el catalogo completo
-- plegado debajo). Columna aditiva y nullable: cero impacto en filas
-- existentes; la RLS de fila propia ya cubre la columna.
--
-- Formato: jsonb con array de slugs del catalogo, p.ej. ["liga-mx","champions-league"].

alter table public.profiles add column if not exists fav_ligas jsonb;
