# Assets — Prompts de generación (Modo Carrera, contenido nuevo)

Prompts para que el usuario genere las imágenes del contenido nuevo de Modo
Carrera. Ver `STORYBOARD_MODO_CARRERA.md` para el contexto de dónde aparece cada
una.

## Estilo base de TODAS las insignias (leer primero)

Las 7 insignias nuevas deben ser indistinguibles en estilo de las 5 ya
existentes (`badge-campeon`, `badge-debut`, `badge-dinastia`, `badge-invicto`,
`badge-remontada`). Reglas comunes para cada prompt:

- Formato: PNG cuadrado con **fondo transparente**, 256x256 px (se muestra a
  ~44px con drop-shadow dorado por CSS, así que el motivo debe leerse pequeño).
- Forma: **medallón / emblema circular** dorado, estilo trofeo premium.
- Paleta: oro `#c9a84c` como color dominante, con sombras en oro viejo/bronce y
  reflejos blancos cálidos. Acentos puntuales del color del concepto permitidos
  (p. ej. rojo para victorias) pero el conjunto debe verse DORADO.
- Acabado: relieve metálico, biselado, limpio, sin texto largo (números cortos
  como "50/100" sí). Centrado, simétrico, alto contraste para verse a 44px.
- Coherencia: mismo grosor de borde y nivel de detalle entre las 7.

Sufijo recomendado para pegar al final de cada prompt:

```
Circular golden medallion emblem, premium football trophy style, polished
metallic gold (#c9a84c) with bronze shadows and warm white highlights,
transparent background, centered symmetrical composition, high contrast so it
reads at small size, no long text, 256x256 PNG, game achievement badge.
```

---

## 1. badge-veterano.png — "Veterano del banquillo" (50 partidos)

```
A golden achievement medallion for a long-serving national team head coach.
Central motif: a coach's whistle crossed with a tactics clipboard, framed by a
laurel half-wreath, small golden number "50" at the base.
[+ sufijo de estilo base]
```

## 2. badge-centenario.png — "Centenario" (100 partidos)

```
A golden achievement medallion celebrating 100 matches managed.
Central motif: a bold golden "100" wrapped by a full laurel wreath, subtle
radiant rays behind, a tiny soccer ball as the zero's dot.
[+ sufijo de estilo base]
```

## 3. badge-centurion.png — "Centurión" (50 victorias)

```
A golden achievement medallion for 50 career wins ("Centurion").
Central motif: a roman centurion helmet with a crest, crossed with a sword,
small golden number "50" at the base, victorious heroic tone.
[+ sufijo de estilo base]
```

## 4. badge-goleador.png — "Goleador histórico" (100 goles)

```
A golden achievement medallion for a high-scoring team (100 goals for).
Central motif: a golden soccer ball bursting into the back of a goal net with
motion lines, small golden number "100" at the base.
[+ sufijo de estilo base]
```

## 5. badge-bicampeon.png — "Bicampeón del Mundo" (2 Mundiales)

```
A golden achievement medallion for winning two World Cups.
Central motif: two stylized World Cup trophies side by side under two small
stars, laurel accents, prestigious tone.
[+ sufijo de estilo base]
```

## 6. badge-tricampeon.png — "Hegemonía mundial" (3 Mundiales)

```
A golden achievement medallion for three World Cup titles ("world hegemony").
Central motif: a royal crown above three stars over a single World Cup trophy
silhouette, radiant rays, supreme dominance tone.
[+ sufijo de estilo base]
```

## 7. badge-leyenda_banquillo.png — "Leyenda del banquillo" (rango Leyenda, OVR 88)

```
A golden achievement medallion for a legendary manager reaching elite rank.
Central motif: a glowing golden coach silhouette seated on a throne-like dugout
bench, radiant aura and rising rays behind, awe-inspiring legendary tone.
[+ sufijo de estilo base]
```

---

## 8. (OPCIONAL) evento-vestuario.png — icono de evento de vestuario

Solo si se quiere icono junto a los eventos de vestuario en Narrativa. Estilo
análogo a `evento-lesion.png` / `evento-oferta.png` (icono simple monocromo: la
UI le aplica `filter: brightness(0) invert(1)`, así que basta una silueta
limpia sobre transparente). Requiere además añadir su mapeo en
`NarrativeView.eventIcon`.

```
A simple flat monochrome icon of a football locker room / dressing room:
a row of lockers with a hanging jersey and a bench, clean silhouette,
single color on transparent background, minimalist line/solid style,
will be tinted white by CSS, 64x64 PNG.
```

---

## 9. (OPCIONAL) Golpes visuales in-match a pantalla completa

NO necesarios (el partido usa SVG). Solo si más adelante se quiere un impacto
cinematográfico extra. Mantener fondo oscuro y acento dorado del modo.

- Penalti:
```
Cinematic close-up of a soccer ball placed on the penalty spot, stadium lights
bokeh in dark navy background, golden rim light, tense dramatic mood, premium
sports broadcast aesthetic, 16:9.
```

- Tarjeta roja:
```
Cinematic shot of a referee's hand raising a red card against a dark navy
stadium background with golden floodlight haze, dramatic high contrast, premium
sports broadcast aesthetic, 16:9.
```

---

## Salida deseada

- Insignias y icono: PNG con transparencia. Insignias 256x256; icono 64x64.
- Rutas finales:
  - `public/img/modo-carrera/icons/badges/badge-{id}.png`
  - `public/img/modo-carrera/icons/evento-vestuario.png` (opcional)
- Mantener consistencia con los 5 medallones existentes.
