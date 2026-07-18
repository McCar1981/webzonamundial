-- 2026-48-clear-fav-creator.sql
--
-- Retiro de creadores de contenido: los usuarios que se registraron siguiendo a
-- un creador (o lo eligieron después) dejan de tener creador de referencia.
--
-- NO se dropea la columna `fav_creator` (queda dormida, decisión de Carlos):
-- solo se limpia su VALOR para todos los perfiles. Reversible en el sentido de
-- que la columna sigue ahí; los valores previos sí se pierden (es lo pedido:
-- "que ya no tengan ningún creador de referencia").
--
-- Idempotente: re-ejecutarla no hace nada si ya está limpio.

update public.profiles
set fav_creator = null
where fav_creator is not null;
