-- 2026-45-profiles-mi-club.sql
--
-- "Mi club": liga y club favoritos del usuario en Zona de Ligas. El ancla de
-- retencion de la temporada (el usuario vuelve por SU club: proximo partido,
-- ultimo resultado y noticias). Columnas aditivas y NULLABLES sobre profiles:
-- cero impacto en filas existentes; la RLS de "actualiza tu propia fila" que ya
-- usa el onboarding cubre tambien estas columnas.

alter table public.profiles add column if not exists fav_liga_slug text;
alter table public.profiles add column if not exists fav_club_id bigint;
alter table public.profiles add column if not exists fav_club_name text;
alter table public.profiles add column if not exists fav_club_logo text;
