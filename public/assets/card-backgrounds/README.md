# Fondos decorativos de las cards del hub /app

Coloca aquí los 4 fondos de categoría (formato `.webp`, ideal 800×800 o 1:1,
peso ligero). Se usan como **capa decorativa interna** de cada card (opacidad
controlada + máscara + velo de legibilidad), nunca como imagen cerrada.

Nombres EXACTOS (en minúscula, con guiones):

| Categoría  | Archivo                   | Módulos que lo usan                                                   |
|------------|---------------------------|----------------------------------------------------------------------|
| Jugar      | `card-bg-jugar.webp`      | Predicciones, Trivia diaria, Fantasy, Modo Carrera, Álbum, Penaltis  |
| En vivo    | `card-bg-en-vivo.webp`    | Match Center, Micro-predicciones, Stories, Zona Streaming            |
| Comunidad  | `card-bg-comunidad.webp`  | Ranking global, Ligas privadas, Chat por liga, IA Coach             |
| Explora    | `card-bg-explora.webp`    | Calendario, Grupos, Reglas de puntos, Guías del Mundial            |

Ruta pública (cómo las referencia el código): `/assets/card-backgrounds/<archivo>`

Si un archivo no existe, la card degrada con elegancia (mantiene base clara +
textura + glow de categoría) sin romperse.
