# Guía de producción de assets — Modo Carrera

Lista EXACTA de imágenes/vídeos que debes crear tú (el código ya los referencia
por ruta y nombre; en cuanto sueltes el archivo en su carpeta, aparece).

Reglas generales:
- **Carpeta raíz:** `public/img/modo-carrera/` (créala). En código se referencian como `/img/modo-carrera/...`.
- **Formato imágenes:** `.webp` (preferido) o `.jpg`. Iconos = `.svg`.
- **Formato vídeo:** `.webm` (preferido, ligero) + `.mp4` de respaldo. Sin audio salvo que se indique. Bucle corto (2-5 s).
- **Peso:** imágenes < 250 KB; vídeos < 1.5 MB. Optimiza antes de subir.
- **Paleta de marca:** fondo oscuro `#060B14`, dorado `#c9a84c`. Que peguen con la web.
- **Nombres en minúscula, sin espacios ni acentos** (usa guiones).

---

## 1. Imágenes — Onboarding (Pilar 1)

| Archivo | Ruta | Medidas | Uso |
|---|---|---|---|
| `onboarding-bg.webp` | `public/img/modo-carrera/` | 1920×1080 | Fondo del paso de bienvenida (estadio/banquillo, oscuro) |
| `onboarding-bg-mobile.webp` | `public/img/modo-carrera/` | 1080×1920 | Mismo fondo, vertical para móvil |
| `card-texture.webp` | `public/img/modo-carrera/` | 600×840 (3:4.2) | Textura/patrón de la carta DT (dorada, sutil). Opcional: la carta ya tiene degradado |

## 2. Imágenes — Narrativa viva (Pilar 6)

| Archivo | Ruta | Medidas | Uso |
|---|---|---|---|
| `prensa-bg.webp` | `public/img/modo-carrera/narrativa/` | 1600×900 | Fondo sala de rueda de prensa |
| `periodico-texture.webp` | `public/img/modo-carrera/narrativa/` | 1200×800 | Textura papel periódico para titulares |

## 3. Imágenes — Legado / Trofeos (Pilar 7)

| Archivo | Ruta | Medidas | Uso |
|---|---|---|---|
| `trofeo-mundial.webp` | `public/img/modo-carrera/trofeos/` | 800×1200 (PNG/webp con transparencia) | Copa del Mundo para el reveal a pantalla completa |
| `trofeo-grupos.webp` | `public/img/modo-carrera/trofeos/` | 400×600 transp. | Trofeo secundario (fase de grupos) |
| `trofeo-octavos.webp` | `public/img/modo-carrera/trofeos/` | 400×600 transp. | Trofeo secundario |
| `vitrina-bg.webp` | `public/img/modo-carrera/trofeos/` | 1600×600 | Fondo de la sala de trofeos |

## 4. Imágenes — Estados vacíos / varios

| Archivo | Ruta | Medidas | Uso |
|---|---|---|---|
| `empty-misiones.webp` | `public/img/modo-carrera/` | 500×500 transp. | Ilustración "sin misiones" |

## 4b. Figura del entrenador (Partido jugable) — ALTO IMPACTO

> **Dirección de arte: estilo CÓMIC** (línea marcada, sombreado plano/cel-shading,
> expresión exagerada). Es más expresivo y mucho más fácil de mantener coherente
> entre poses que un estilo fotorrealista, y pega con el tono "épico de cromo" de
> la marca. Mismo personaje en todas las poses (mismo peinado/ropa), **fondo
> transparente**, en paleta de marca (dorado sobre oscuro). El código las muestra
> como capa lateral/inferior del modal del partido; degrada a nada si el archivo no
> existe (igual que `Kit`). Medidas sugeridas **600×800**, mirando ligeramente hacia
> el centro de la pantalla. Idealmente un contorno/halo dorado fino para recortar
> sobre el fondo oscuro. Consistencia recomendada: generar las 5 poses con el mismo
> prompt base de personaje y solo variar la acción.

| Archivo | Ruta | Pose | Uso |
|---|---|---|---|
| `coach-neutral.webp` | `public/img/modo-carrera/coach/` | En reposo, brazos sueltos | Plan táctico, Hub |
| `coach-arenga.webp` | `public/img/modo-carrera/coach/` | Gesto enérgico, motivando | Charla al descanso |
| `coach-instruccion.webp` | `public/img/modo-carrera/coach/` | Señalando/dando órdenes | Decisión min 60' y sustitución |
| `coach-celebra.webp` | `public/img/modo-carrera/coach/` | Brazos arriba, puño | Final con victoria / gol |
| `coach-preocupado.webp` | `public/img/modo-carrera/coach/` | Brazos cruzados, serio | Vas perdiendo / derrota |

## 4c. Fondos del partido jugable (opcionales)

| Archivo | Ruta | Medidas | Uso |
|---|---|---|---|
| `vestuario-bg.webp` | `public/img/modo-carrera/partido/` | 1200×800 | Fondo sutil de la charla al descanso |
| `banquillo-bg.webp` | `public/img/modo-carrera/partido/` | 1200×800 | Fondo sutil de la decisión del minuto 60 |
| `concentracion-bg.webp` | `public/img/modo-carrera/partido/` | 1200×800 | Fondo sutil del modal de concentración/entrenamiento entre partidos (opcional, degrada a color) |

---

## 5. Iconos SVG (vectoriales, `stroke="currentColor"` para heredar color)

> Los 4 de filosofía YA están implementados inline en `FichaDT.tsx`
> (`PhilosophyIcon`). Si quieres versiones más elaboradas, entrégalas como SVG y
> las sustituimos. El resto SÍ hay que crearlos:

| Archivo | Ruta | Uso |
|---|---|---|
| `lock.svg` | `public/img/modo-carrera/icons/` | Nodo bloqueado del árbol de habilidades |
| `mission-diaria.svg` | `public/img/modo-carrera/icons/` | Misión diaria |
| `mission-semanal.svg` | `public/img/modo-carrera/icons/` | Misión semanal |
| `mission-torneo.svg` | `public/img/modo-carrera/icons/` | Misión de torneo |
| `mission-flash.svg` | `public/img/modo-carrera/icons/` | Misión flash |
| `badge-debut.svg` … | `public/img/modo-carrera/icons/badges/` | 1 SVG por título (ver lista en constants.ts → TITLES) |
| `evento-lesion.svg` | `public/img/modo-carrera/icons/` | Evento: lesión |
| `evento-oferta.svg` | `public/img/modo-carrera/icons/` | Evento: oferta/fichaje |
| `evento-polemica.svg` | `public/img/modo-carrera/icons/` | Evento: polémica |

---

## 6. Vídeos / animaciones (opcionales, mejoran el "wow")

| Archivo | Ruta | Duración | Uso |
|---|---|---|---|
| `reveal-carta.webm` | `public/img/modo-carrera/video/` | 2-3 s, bucle no | Animación de "impresión" de la carta DT al crearla |
| `subida-nivel.webm` | `public/img/modo-carrera/video/` | 1-2 s | Overlay al subir de nivel (partículas doradas) |
| `trofeo-reveal.webm` | `public/img/modo-carrera/video/` | 3-4 s | Levantar la copa (con luz/confeti) |
| `hub-bg-loop.webm` | `public/img/modo-carrera/video/` | 5-8 s bucle | Fondo animado sutil del Hub (opcional) |

> Nota: muchas de estas animaciones también pueden lograrse con GSAP/partículas
> ya en el repo (`GoldParticles`), sin vídeo. Prioriza vídeo solo para el
> reveal de carta y el levantamiento de copa, donde aporta más.

---

## Checklist de carpetas a crear

```
public/img/modo-carrera/
├── onboarding-bg.webp
├── onboarding-bg-mobile.webp
├── card-texture.webp
├── empty-misiones.webp
├── coach/
│   ├── coach-neutral.webp
│   ├── coach-arenga.webp
│   ├── coach-instruccion.webp
│   ├── coach-celebra.webp
│   └── coach-preocupado.webp
├── partido/
│   ├── vestuario-bg.webp
│   ├── banquillo-bg.webp
│   └── concentracion-bg.webp
├── narrativa/
│   ├── prensa-bg.webp
│   └── periodico-texture.webp
├── trofeos/
│   ├── trofeo-mundial.webp
│   ├── trofeo-grupos.webp
│   ├── trofeo-octavos.webp
│   └── vitrina-bg.webp
├── icons/
│   ├── lock.svg
│   ├── mission-*.svg
│   ├── evento-*.svg
│   └── badges/badge-*.svg
└── video/
    ├── reveal-carta.webm
    ├── subida-nivel.webm
    └── trofeo-reveal.webm
```

## Prioridad de entrega (para no bloquear el desarrollo)

1. **Imprescindibles F1 (ya jugable sin ellas, pero suman):** `onboarding-bg`, `card-texture`.
2. **Figura del entrenador (estilo cómic) — mayor salto visual del partido jugable:**
   empieza por `coach-arenga` (charla) e `coach-instruccion` (decisión 60'/sustitución),
   luego `coach-celebra`, `coach-preocupado` y `coach-neutral`.
3. **F4 (narrativa):** `prensa-bg`, `periodico-texture`.
4. **F5 (legado):** `trofeo-mundial`, `vitrina-bg`, `reveal-carta.webm`, `trofeo-reveal.webm`.
5. **Pulido:** fondos de partido (`vestuario-bg`, `banquillo-bg`), resto de iconos, eventos, estados vacíos.

El código tolera la ausencia de cualquier asset (usa degradados/SVG inline como
fallback). Ve soltando archivos y se integran solos.
