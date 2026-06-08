# Storyboard — Contenido nuevo Modo Carrera (temporada extendida)

Contexto de DÓNDE aparece cada visual nuevo de esta tanda de features. Las
imágenes las produce el usuario; los prompts de generación están en
`ASSETS_MODO_CARRERA.md`. Paleta del modo: dorado `#c9a84c`, azul marino
`#0F1D32`, negro `#060B14`.

> Regla del proyecto: en la UI jugable NO se usan emojis ni iconos emoji; los
> elementos in-match (tarjeta roja, balón parado) ya están resueltos con SVG y
> NO requieren raster. Lo único que necesita imagen son las insignias de logro
> (medallones PNG) y, opcionalmente, un icono de evento de vestuario.

---

## 1. Partido jugable (MatchLive) — sin assets raster nuevos

Resuelto íntegro con SVG embebido (cumple "solo SVG"):

- **Tarjeta roja / expulsión**: `RedCardIcon` (rectángulo rojo) en el feed del
  partido + `ManDownBadge` junto a la bandera del equipo con un hombre de menos.
- **Balón parado (penalti / falta)**: panel de decisión con opciones (frío,
  potencia, picada / directa, centro, ensayada) y panel de resultado. Todo
  tipografía + SVG, sin imágenes.
- **Segunda decisión táctica (min 75)**: reutiliza el bloque de decisión del
  min 60; sin assets.

No hay que generar nada para el partido. Si en el futuro se quisiera un golpe
visual extra (p. ej. ilustración de penalti a pantalla completa), ver prompts
"opcionales" en `ASSETS_MODO_CARRERA.md`.

## 2. Temporada extendida (amistosos + clasificación) — sin assets raster nuevos

Los nuevos partidos (2 amistosos + 4 de clasificación) usan la misma tarjeta de
fixture y banderas de selección que ya existen. Sin imágenes nuevas.

## 3. Vida de vestuario (eventos entre partidos)

- **Dónde**: pestaña Narrativa (`NarrativeView`), como entrada `evento` con
  opciones de decisión. También puede surgir el mismo flujo que la rueda de
  prensa.
- **Asset OPCIONAL**: un icono de "evento de vestuario"
  (`/img/modo-carrera/icons/evento-vestuario.png`) análogo a los existentes
  `evento-lesion.png` / `evento-oferta.png`. Si se produce, hay que añadir su
  mapeo por palabras clave en `NarrativeView.eventIcon` (vestuario, filtración,
  suplente, capitán). Hasta entonces el evento se muestra sin icono (correcto).

## 4. Insignias de carrera de largo plazo (REQUERIDO)

- **Dónde**: pestaña Reputación (`ReputationView`), rejilla de "Títulos". Cada
  insignia desbloqueada renderiza
  `/img/modo-carrera/icons/badges/badge-{id}.png` (medallón ~44px con
  drop-shadow dorado y barrido de brillo al revelarse). Las bloqueadas muestran
  un candado SVG.
- **Estilo**: deben CASAR con los 5 medallones que ya existen
  (`badge-campeon`, `badge-debut`, `badge-dinastia`, `badge-invicto`,
  `badge-remontada`): mismo lenguaje de emblema circular dorado sobre fondo
  transparente.
- **7 archivos nuevos requeridos** (sin ellos, imagen rota al desbloquear):
  - `badge-veterano.png` — Veterano del banquillo (50 partidos dirigidos)
  - `badge-centenario.png` — Centenario (100 partidos dirigidos)
  - `badge-centurion.png` — Centurión (50 victorias)
  - `badge-goleador.png` — Goleador histórico (100 goles a favor)
  - `badge-bicampeon.png` — Bicampeón del Mundo (2 Mundiales)
  - `badge-tricampeon.png` — Hegemonía mundial (3 Mundiales)
  - `badge-leyenda_banquillo.png` — Leyenda del banquillo (rango Leyenda, OVR 88)

Prompts de generación de los 7 medallones (+ icono opcional de vestuario) en
`ASSETS_MODO_CARRERA.md`.
