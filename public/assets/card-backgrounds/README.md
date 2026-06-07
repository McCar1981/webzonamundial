# Arte de las cards del hub /app

Un `.webp` por **módulo** (no por categoría). Es el arte protagonista de cada
card del hub `/app`: se pinta a pantalla completa dentro de la card con un velo
de legibilidad por encima (degradado blanco fuerte arriba → suave abajo) para
que icono/título/CTA siempre se lean, sin matar la imagen.

Formato recomendado: `.webp`, 720×900 (4:5 vertical), peso ligero (~40–90 KB).
Fuente original (PNG) en `art-src/card-backgrounds/` (no se publica).

Ruta pública: `/assets/card-backgrounds/<archivo>.webp`

Nombres EXACTOS (minúscula, con guiones), uno por módulo:

`predicciones.webp`, `trivia-diaria.webp`, `fantasy.webp`, `modo-carrera.webp`,
`match-center.webp`, `micro-predicciones.webp`, `stories.webp`,
`zona-streaming.webp`, `ranking-global.webp`, `ligas-privadas.webp`,
`chat-por-ligas.webp`, `ia-coach.webp`, `calendario.webp`, `grupos.webp`,
`reglas-de-puntos.webp`, `guia-del-mundial.webp`

Cada módulo referencia su arte con `art: "/assets/card-backgrounds/<x>.webp"` en
`src/app/app/page.tsx`. Si un módulo no tiene `art` (p. ej. álbum/penaltis aún
sin arte), la card degrada con elegancia al fondo base premium de su categoría
sin romper el layout.
