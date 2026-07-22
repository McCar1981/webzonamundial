-- 2026-53-profiles-mis-clubes.sql
--
-- Clubes favoritos MÚLTIPLES en Zona de Ligas. Hasta ahora el club era ÚNICO
-- (fav_club_id/name/logo, 2026-45): elegir uno nuevo pisaba al anterior. Ahora
-- el usuario puede seguir VARIOS clubes, igual que ya sigue varias ligas
-- (fav_ligas jsonb, 2026-46). Nuevo array jsonb `fav_clubes`:
--   [ { "id": 442, "name": "América", "logo": "https://…", "slug": "liga-mx" }, … ]
--
-- Las columnas singulares fav_club_* se CONSERVAN como "club primario" (= el
-- primero del array): así el gate y cualquier lectura antigua siguen funcionando
-- sin cambios. La app escribe ambas cosas a la vez.
--
-- Idempotente. Backfill del club único existente al array (una sola vez).

alter table public.profiles add column if not exists fav_clubes jsonb;

update public.profiles
set fav_clubes = jsonb_build_array(
  jsonb_build_object(
    'id',   fav_club_id,
    'name', fav_club_name,
    'logo', fav_club_logo,
    'slug', fav_liga_slug
  )
)
where fav_club_id is not null
  and fav_club_name is not null
  and (fav_clubes is null or jsonb_array_length(fav_clubes) = 0);
