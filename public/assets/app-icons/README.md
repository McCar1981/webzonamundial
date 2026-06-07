# Iconos personalizados de los módulos del hub /app

Coloca aquí un `.svg` por módulo. El sistema los renderiza con **CSS mask**, así
que el color es configurable desde código (se tiñen al color del tema, no usan
el color interno del SVG). Usa SVGs **monocromos** (trazo/relleno simple) para
mejor resultado.

Ruta pública: `/assets/app-icons/<archivo>.svg`

Nombres sugeridos (uno por módulo):

`predicciones.svg`, `trivia.svg`, `fantasy.svg`, `carrera.svg`, `album.svg`,
`penaltis.svg`, `matchcenter.svg`, `micro.svg`, `stories.svg`, `streaming.svg`,
`rankings.svg`, `ligas.svg`, `chat.svg`, `iacoach.svg`, `calendario.svg`,
`grupos.svg`, `reglas.svg`, `guias.svg`

Para activar uno, añade `iconSrc: "/assets/app-icons/predicciones.svg"` al módulo
correspondiente en `src/app/app/page.tsx`. Mientras no exista, se usa el icono
SVG inline de respaldo (no se rompe nada).
