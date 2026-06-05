# Prompts de generación de assets — Modo Carrera

Listado COMPLETO de assets con su **prompt de generación** listo para pegar en
tu herramienta (Midjourney, DALL·E, Flux, Sora, Runway, Kling, etc.).

Reglas comunes para TODOS los prompts de imagen:
- **Estilo de marca:** cinematográfico, premium, oscuro, con dorado `#c9a84c` como acento. Fondo base casi negro `#060B14`.
- **Sin texto, sin letras, sin logos, sin marcas de agua** (el texto lo pone la web).
- **Coherencia:** iluminación dramática, alto contraste, profundidad de campo.
- Añade siempre al final: `--no text, watermark, logo, signature` (o el equivalente de tu tool).

Ruta raíz: `public/img/modo-carrera/`. Formatos: imágenes `.webp`/`.jpg`, iconos `.svg`, vídeos `.webm`+`.mp4`.

---

## A. IMÁGENES — Onboarding (Pilar 1)

### A1. `onboarding-bg.webp` — 1920×1080 (horizontal)
**Tipo:** Imagen
**Prompt:**
> Estadio de fútbol monumental visto desde la boca del túnel de vestuarios hacia el campo, hora azul al anochecer, focos encendidos creando haces de luz volumétrica, césped impecable, gradas llenas pero desenfocadas (bokeh), atmósfera épica y solemne de "antes del gran partido". Paleta oscura azul-noche con acentos dorados cálidos. Estilo cinematográfico, fotografía deportiva premium, gran profundidad, contraste alto. Composición con espacio negativo a la izquierda para texto. Sin personas en primer plano. `--ar 16:9 --no text, watermark, logo, people-faces`

### A2. `onboarding-bg-mobile.webp` — 1080×1920 (vertical)
**Tipo:** Imagen
**Prompt:**
> Misma escena que A1 pero en composición VERTICAL: túnel de vestuarios abriéndose al estadio iluminado al anochecer, focos con luz volumétrica, césped perfecto, gradas en bokeh dorado. Espacio negativo en la mitad inferior para texto. Cinematográfico, oscuro azul-noche con acentos dorados. `--ar 9:16 --no text, watermark, logo, faces`

### A3. `card-texture.webp` — 600×840 (3:4.2)
**Tipo:** Imagen (textura, puede llevar leve transparencia)
**Prompt:**
> Textura premium para carta coleccionable de fútbol estilo FIFA Ultimate Team, fondo metálico dorado con degradado de oro claro a oro oscuro, patrón geométrico sutil de líneas finas y destellos de luz diagonales, acabado satinado tipo foil, esquinas con viñeta sutil. Sin iconos ni texto, solo la base/fondo de la carta. Elegante, lujoso. `--ar 5:7 --no text, watermark, logo, characters`

---

## B. IMÁGENES — Narrativa viva (Pilar 6) → `public/img/modo-carrera/narrativa/`

### B1. `prensa-bg.webp` — 1600×900
**Tipo:** Imagen
**Prompt:**
> Sala de rueda de prensa de un club de fútbol vista de frente, mesa con micrófonos, panel/backdrop oscuro neutro y desenfocado, focos de cámara creando flares suaves, atmósfera tensa de conferencia, profundidad de campo cinematográfica. Punto de vista del entrenador (POV) mirando a la sala. Tonos oscuros con acentos dorados. Sin logos reconocibles, sin texto. `--ar 16:9 --no text, watermark, logo, brand`

### B2. `periodico-texture.webp` — 1200×800
**Tipo:** Imagen (textura)
**Prompt:**
> Textura de papel de periódico antiguo color crema con grano y fibra visible, ligeramente envejecido, columnas vacías insinuadas con líneas grises muy tenues (sin texto legible), iluminación plana uniforme para usar como fondo de titulares. Vintage, sobrio. `--ar 3:2 --no readable-text, watermark, logo`

---

## C. IMÁGENES — Legado / Trofeos (Pilar 7) → `public/img/modo-carrera/trofeos/`

### C1. `trofeo-mundial.webp` — 800×1200 (PNG/webp con TRANSPARENCIA)
**Tipo:** Imagen (recortada, fondo transparente)
**Prompt:**
> Trofeo dorado de campeonato de fútbol genérico (copa elegante con base, NO el trofeo oficial de la FIFA), oro brillante pulido con reflejos especulares, iluminación de estudio dramática desde arriba, fondo TRANSPARENTE, render 3D fotorrealista, partículas de luz doradas alrededor. Centrado, vertical. Sin texto ni grabados. `--ar 2:3 --no text, watermark, background, official-fifa-trophy`

### C2. `trofeo-grupos.webp` — 400×600 (transparente)
**Tipo:** Imagen
**Prompt:**
> Pequeño trofeo/placa conmemorativa de bronce-plata para "superar fase de grupos", diseño sobrio, metal con reflejos, fondo transparente, render 3D limpio. Sin texto. `--ar 2:3 --no text, watermark, background`

### C3. `trofeo-octavos.webp` — 400×600 (transparente)
**Tipo:** Imagen
**Prompt:**
> Medalla/trofeo plateado pequeño estilo eliminatoria, metal pulido con reflejos fríos, fondo transparente, render 3D limpio. Sin texto. `--ar 2:3 --no text, watermark, background`

### C4. `vitrina-bg.webp` — 1600×600
**Tipo:** Imagen
**Prompt:**
> Vitrina/sala de trofeos elegante y oscura, estanterías de cristal con iluminación led cálida dorada desde abajo, ambiente de museo deportivo premium, reflejos en vidrio, profundidad, vacía (lista para colocar trofeos encima). Cinematográfico, lujoso, tonos oscuros con dorado. Sin texto. `--ar 8:3 --no text, watermark, logo`

---

## D. IMÁGENES — Estados varios

### D1. `empty-misiones.webp` — 500×500 (transparente)
**Tipo:** Imagen (ilustración)
**Prompt:**
> Ilustración minimalista de un silbato de árbitro y una libreta de táctica cruzados, estilo línea fina dorada sobre fondo transparente, elegante y simple, para estado vacío "sin misiones". Monocromo dorado `#c9a84c`. Sin texto. `--ar 1:1 --no text, watermark, background`

---

## E. ICONOS SVG → `public/img/modo-carrera/icons/`

> Los 4 de filosofía YA están inline en `FichaDT.tsx`. Estos iconos son simples:
> entrégalos como SVG vectorial de trazo (stroke), 24×24 viewBox, `stroke="currentColor"`,
> `stroke-width 2`, sin relleno, para que hereden el color desde CSS.

### E1. `lock.svg` — Nodo bloqueado
**Tipo:** Icono SVG
**Prompt (para generador de iconos / describir al ilustrador):**
> Icono de candado cerrado, estilo línea minimalista, trazo uniforme 2px, esquinas redondeadas, viewBox 24x24, sin relleno, color heredado (currentColor). Outline limpio tipo Lucide/Feather.

### E2. `mission-diaria.svg` — Misión diaria
**Prompt:** Icono de calendario con un punto/sol pequeño, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E3. `mission-semanal.svg` — Misión semanal
**Prompt:** Icono de calendario con 7 marcas/semana, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E4. `mission-torneo.svg` — Misión de torneo
**Prompt:** Icono de cuadro de eliminatoria (bracket) o copa pequeña, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E5. `mission-flash.svg` — Misión flash
**Prompt:** Icono de rayo (bolt) dentro de un círculo de reloj, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E6. `evento-lesion.svg` — Evento lesión
**Prompt:** Icono de cruz médica con vendaje, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E7. `evento-oferta.svg` — Evento oferta/fichaje
**Prompt:** Icono de maletín con flecha de intercambio, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E8. `evento-polemica.svg` — Evento polémica
**Prompt:** Icono de bocadillo de diálogo con signo de exclamación, línea minimalista 2px, 24x24, currentColor, estilo Feather.

### E9. Badges de títulos → `public/img/modo-carrera/icons/badges/`
Uno por cada título de `constants.ts` → `TITLES`:
- `badge-debut.svg` — **Prompt:** Insignia circular con silueta de banquillo/silla de DT, estilo emblema dorado, línea + relleno sutil, 64x64.
- `badge-invicto.svg` — **Prompt:** Insignia circular con escudo y check, emblema dorado, 64x64.
- `badge-remontada.svg` — **Prompt:** Insignia circular con flecha ascendente enérgica, emblema dorado, 64x64.
- `badge-campeon.svg` — **Prompt:** Insignia circular con copa y estrella, emblema dorado brillante, 64x64.
- `badge-dinastia.svg` — **Prompt:** Insignia circular con dos copas y corona, emblema dorado premium, 64x64.

---

## F. VÍDEOS / ANIMACIONES → `public/img/modo-carrera/video/`

> Formato `.webm` (VP9) + `.mp4` (H.264) de respaldo. Sin audio. Fondo transparente
> donde se indique (usa códec con alpha: VP9 `yuva420p` para webm). Bucle corto.

### F1. `reveal-carta.webm` — 2-3 s, fondo TRANSPARENTE
**Tipo:** Vídeo (con alpha)
**Prompt (Sora/Runway/Kling):**
> Animación de una carta coleccionable de fútbol dorada estilo FIFA que aparece girando suavemente en 3D desde el canto hasta quedar de frente, con un barrido de brillo (shine sweep) diagonal y una lluvia de partículas doradas que se desvanece. Fondo transparente. Duración 2-3 segundos, movimiento elegante con ease-out, sin texto en la carta. Cinematográfico, lujoso. `--no text, background, watermark`

### F2. `subida-nivel.webm` — 1-2 s, fondo TRANSPARENTE
**Tipo:** Vídeo (con alpha)
**Prompt:**
> Explosión radial de partículas y destellos dorados desde el centro, con un anillo de luz que se expande y se desvanece, estilo celebración "level up". Fondo transparente, 1-2 segundos, energético pero elegante. Sin texto. `--no text, background, watermark`

### F3. `trofeo-reveal.webm` — 3-4 s, fondo oscuro o transparente
**Tipo:** Vídeo
**Prompt:**
> Trofeo dorado de fútbol genérico (no oficial FIFA) que se levanta lentamente hacia arriba mientras caen serpentinas y confeti dorado, rayos de luz volumétrica de fondo, cámara con ligero contrapicado épico, brillos especulares en el oro. 3-4 segundos, atmósfera de gloria y celebración. Fondo oscuro azul-noche con luz dorada. Sin texto, sin trofeo oficial reconocible. `--no text, watermark, official-fifa-trophy`

### F4. `hub-bg-loop.webm` — 5-8 s, BUCLE (opcional)
**Tipo:** Vídeo (loop)
**Prompt:**
> Plano cenital muy lento y sutil de un césped de estadio con líneas de cal, sombras suaves de focos moviéndose apenas, partículas de polvo flotando en haces de luz, atmósfera tranquila premium. Loop perfecto de 5-8 segundos, movimiento mínimo para usar como fondo detrás de la interfaz. Oscuro con acentos dorados. Sin texto, sin personas. `--no text, watermark, people`

---

## Resumen / checklist rápida

| # | Asset | Tipo | Medidas | Prioridad |
|---|---|---|---|---|
| A1 | onboarding-bg | Imagen | 1920×1080 | 1 |
| A2 | onboarding-bg-mobile | Imagen | 1080×1920 | 1 |
| A3 | card-texture | Imagen | 600×840 | 2 |
| B1 | prensa-bg | Imagen | 1600×900 | 3 |
| B2 | periodico-texture | Imagen | 1200×800 | 3 |
| C1 | trofeo-mundial | Imagen (alpha) | 800×1200 | 3 |
| C2 | trofeo-grupos | Imagen (alpha) | 400×600 | 4 |
| C3 | trofeo-octavos | Imagen (alpha) | 400×600 | 4 |
| C4 | vitrina-bg | Imagen | 1600×600 | 3 |
| D1 | empty-misiones | Imagen (alpha) | 500×500 | 4 |
| E1-E9 | iconos + badges | SVG | 24-64px | 4 |
| F1 | reveal-carta | Vídeo (alpha) | — | 2 |
| F2 | subida-nivel | Vídeo (alpha) | — | 3 |
| F3 | trofeo-reveal | Vídeo | — | 3 |
| F4 | hub-bg-loop | Vídeo loop | — | 5 (opcional) |

Prioridad 1 = imprescindible para que el onboarding "historia" luzca ya.
El código tolera la ausencia de cualquiera (fallbacks SVG/degradado), así que
puedes ir soltando archivos en su carpeta y se integran solos.
