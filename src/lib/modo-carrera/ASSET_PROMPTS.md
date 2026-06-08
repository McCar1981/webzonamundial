# Prompts de generación de assets — Modo Carrera

Listado COMPLETO de assets con su **prompt de generación** listo para pegar en
tu herramienta (Midjourney, DALL·E, Flux, Sora, Runway, Kling, etc.).

Reglas comunes para TODOS los prompts de imagen:
- **Estilo de marca:** cinematográfico, premium, oscuro, con dorado `#c9a84c` como acento. Fondo base casi negro `#060B14`.
- **Sin texto, sin letras, sin logos, sin marcas de agua** (el texto lo pone la web).
- **Coherencia:** iluminación dramática, alto contraste, profundidad de campo.
- Añade siempre al final: `--no text, watermark, logo, signature` (o el equivalente de tu tool).

Ruta raíz: `public/img/modo-carrera/`. Formatos: imágenes `.webp`/`.jpg`, iconos `.svg`, vídeos `.webm`+`.mp4`.

**Convención responsive (vertical / móvil):** todo fondo de escena horizontal
(16:9, 8:3, etc.) lleva una variante VERTICAL con el sufijo `-mobile` y relación
`9:16` (p.ej. `prensa-bg.webp` → `prensa-bg-mobile.webp`). El código las sirve con
`<picture><source media="(max-width: 640px)">`: en móvil carga la `-mobile`, en
el resto la horizontal. Si falta la `-mobile`, se usa la horizontal recortada
(degradado de respaldo si tampoco existe). Texturas, cartas, trofeos recortados,
iconos y badges **no** necesitan variante (escalan / son cuadrados o verticales).

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

### B1b. `prensa-bg-mobile.webp` — 1080×1920 (vertical)
**Tipo:** Imagen
**Prompt:**
> Misma sala de rueda de prensa que B1 pero en composición VERTICAL: encuadre más cerrado sobre la mesa de micrófonos y el backdrop oscuro desenfocado, flares de cámara, atmósfera tensa, POV del entrenador. Espacio limpio en la parte superior para texto. Cinematográfico, oscuro con acentos dorados. Sin logos, sin texto. `--ar 9:16 --no text, watermark, logo, brand`

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

### C4b. `vitrina-bg-mobile.webp` — 1080×1920 (vertical)
**Tipo:** Imagen
**Prompt:**
> Misma vitrina de trofeos que C4 pero en composición VERTICAL: estanterías de cristal apiladas en altura con luz led cálida dorada desde abajo, reflejos en vidrio, profundidad de museo deportivo premium, vacía (lista para colocar trofeos). Cinematográfico, oscuro con dorado. Sin texto. `--ar 9:16 --no text, watermark, logo`

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

### F3b. `trofeo-reveal-mobile.webm` — 3-4 s, vertical
**Tipo:** Vídeo
**Prompt:**
> Misma celebración de trofeo que F3 pero en composición VERTICAL 9:16: el trofeo dorado genérico se levanta llenando el alto del encuadre, confeti y serpentinas doradas cayendo, rayos de luz volumétrica, contrapicado épico, brillos en el oro. 3-4 s. Fondo oscuro azul-noche con dorado. Sin texto, sin trofeo oficial. `--ar 9:16 --no text, watermark, official-fifa-trophy`

### F4. `hub-bg-loop.webm` — 5-8 s, BUCLE (opcional)
**Tipo:** Vídeo (loop)
**Prompt:**
> Plano cenital muy lento y sutil de un césped de estadio con líneas de cal, sombras suaves de focos moviéndose apenas, partículas de polvo flotando en haces de luz, atmósfera tranquila premium. Loop perfecto de 5-8 segundos, movimiento mínimo para usar como fondo detrás de la interfaz. Oscuro con acentos dorados. Sin texto, sin personas. `--no text, watermark, people`

### F4b. `hub-bg-loop-mobile.webm` — 5-8 s, BUCLE vertical (opcional)
**Tipo:** Vídeo (loop)
**Prompt:**
> Mismo césped de estadio que F4 pero en composición VERTICAL 9:16: plano lento y sutil, líneas de cal, sombras de focos moviéndose apenas, polvo flotando en haces de luz. Loop perfecto de 5-8 s, movimiento mínimo para fondo de interfaz. Oscuro con acentos dorados. Sin texto, sin personas. `--ar 9:16 --no text, watermark, people`

---

## G. FIGURA DEL ENTRENADOR (partido jugable) → `public/img/modo-carrera/coach/`

> **Dirección de arte: estilo CÓMIC / novela gráfica** (línea marcada, sombreado
> plano tipo cel-shading, expresión algo exagerada). Es más expresivo y MUCHO más
> fácil de mantener coherente entre poses que un retrato fotorrealista, y pega con
> el tono "épico de cromo" de la marca.
>
> **CLAVE de coherencia — usa SIEMPRE el mismo personaje base** (genera las 5 con el
> mismo prompt de personaje y solo cambia la acción/expresión):
>
> **PERSONAJE BASE (pega esto en las 5):** *"Entrenador de fútbol varón, 45 años,
> complexión media, pelo corto castaño peinado hacia atrás con canas en las sienes,
> barba corta recortada, vistiendo chándal/abrigo técnico oscuro azul-noche con
> ribetes dorados sutiles (sin logos ni marcas), expresión intensa y carismática.
> Estilo cómic / novela gráfica, línea de tinta marcada, sombreado cel-shading
> plano, contorno limpio. Halo/contorno dorado fino para recortar sobre fondo
> oscuro. FONDO TRANSPARENTE. Paleta de marca: dorado #c9a84c sobre azul-noche
> #060B14."*
>
> **Encuadre:** plano medio (de cintura para arriba), cara y torso bien centrados en
> la MITAD SUPERIOR del lienzo (el código lo recorta en un círculo desde arriba, así
> que la cabeza debe quedar arriba-centro). Medidas **600×800**, mirando ligeramente
> hacia el centro de la pantalla. Degrada a nada si falta el archivo. Empieza por
> `coach-arenga` y `coach-instruccion` (las que más se ven).
>
> **GENÉRICO vs POR PAÍS (degradado en cascada):** lo normal es soltar UN solo set
> de 5 poses genéricas en `public/img/modo-carrera/coach/` y sirve para los 48
> países (el entrenador eres tú, el DT). Si quieres personalizar SOLO las selecciones
> importantes, crea una subcarpeta con el slug del país y mete ahí sus 5 poses:
> `public/img/modo-carrera/coach/{slug}/coach-{pose}.png` (p. ej.
> `coach/espana/coach-arenga.png`). El código intenta primero la del país y, si no
> existe, usa la genérica automáticamente. No hace falta crear las 48: solo las que
> quieras. Para la versión por país usa el MISMO personaje base pero con rasgos/tono
> del entrenador real de esa selección (sin parecidos exactos ni nombres).

### G1. `coach-neutral.png` — 600×800 (transparente) · pose: en reposo
**Tipo:** Imagen (alpha)
**Prompt:**
> [PERSONAJE BASE] · POSE: de pie, en reposo, brazos sueltos a los costados, mirada serena y atenta al campo, leve confianza. Plano medio, cara arriba-centro, fondo transparente, estilo cómic con contorno dorado. `--ar 3:4 --no text, watermark, logo, background`

### G2. `coach-arenga.png` — 600×800 (transparente) · pose: motivando (charla)
**Tipo:** Imagen (alpha)
**Prompt:**
> [PERSONAJE BASE] · POSE: gesto enérgico de arenga, puño cerrado al pecho o mano levantada motivando, boca abierta dando una charla apasionada, ceño de determinación. Dinamismo, líneas de acción sutiles. Plano medio, cara arriba-centro, fondo transparente, estilo cómic con contorno dorado. `--ar 3:4 --no text, watermark, logo, background`

### G3. `coach-instruccion.png` — 600×800 (transparente) · pose: dando órdenes
**Tipo:** Imagen (alpha)
**Prompt:**
> [PERSONAJE BASE] · POSE: señalando hacia el campo con el brazo extendido, dando una instrucción táctica concentrada, otra mano indicando una posición, gesto de mando. Plano medio, cara arriba-centro, fondo transparente, estilo cómic con contorno dorado. `--ar 3:4 --no text, watermark, logo, background`

### G4. `coach-celebra.png` — 600×800 (transparente) · pose: celebración
**Tipo:** Imagen (alpha)
**Prompt:**
> [PERSONAJE BASE] · POSE: brazos arriba y puños cerrados en celebración eufórica, gran sonrisa de triunfo, mirada al cielo, energía explosiva, destellos dorados sutiles alrededor. Plano medio, cara arriba-centro, fondo transparente, estilo cómic con contorno dorado. `--ar 3:4 --no text, watermark, logo, background`

### G5. `coach-preocupado.png` — 600×800 (transparente) · pose: tenso / derrota
**Tipo:** Imagen (alpha)
**Prompt:**
> [PERSONAJE BASE] · POSE: brazos cruzados, ceño fruncido, expresión seria y preocupada mirando el partido con tensión, mandíbula apretada. Sobrio, sombras más marcadas. Plano medio, cara arriba-centro, fondo transparente, estilo cómic con contorno dorado. `--ar 3:4 --no text, watermark, logo, background`

---

## H. FONDOS DEL PARTIDO JUGABLE (opcionales) → `public/img/modo-carrera/partido/`

> Fondos SUTILES y desenfocados para las pantallas de decisión del modal (van muy
> atenuados detrás del contenido). Estilo cómic/ilustración a juego con el
> entrenador, o cinematográfico oscuro: en ambos casos MUY oscuros y de bajo
> contraste para no competir con la UI. Sin personas en primer plano, sin texto.

### H1. `vestuario-bg.webp` — 1200×800 · charla al descanso
**Tipo:** Imagen
**Prompt:**
> Interior de un vestuario de fútbol vacío y en penumbra, taquillas y banco de madera desenfocados, una pizarra táctica insinuada, luz cálida tenue, atmósfera íntima de descanso. Muy oscuro y de bajo contraste para usar como fondo atenuado. Estilo ilustración cómic oscura con acentos dorados #c9a84c. Sin personas, sin texto. `--ar 3:2 --no text, watermark, logo, people`

### H2. `banquillo-bg.webp` — 1200×800 · decisión minuto 60
**Tipo:** Imagen
**Prompt:**
> Vista desde el banquillo hacia un campo de fútbol nocturno desenfocado, focos del estadio creando bokeh dorado, borde de la zona técnica insinuado, atmósfera de tensión de partido. Muy oscuro y de bajo contraste para fondo atenuado. Estilo ilustración cómic oscura con acentos dorados #c9a84c. Sin personas en primer plano, sin texto. `--ar 3:2 --no text, watermark, logo, people`

---

## I. CONCENTRACIÓN Y ENTRENAMIENTO (semana entre partidos) — NUEVO

> Feature nueva: la **semana de concentración** previa a cada partido. El DT elige
> 3 sesiones de un catálogo de 5, gestiona la **frescura** del grupo (recurso 0-100)
> y asume un **riesgo de lesión** en el entrenamiento. Modal `Concentracion.tsx`.
>
> **Estado actual del arte:** los 5 iconos de sesión y los estados son **SVG inline**
> (siguen la regla SVG-only de la UI) y NO necesitan asset. Lo que SÍ enriquece la
> pantalla son las **escenas ilustradas** de fondo y las **miniaturas por sesión**.
> Todo es OPCIONAL y degrada con elegancia: si falta el archivo, se usa el color de
> marca / el icono SVG existente.
>
> **Dirección de arte:** misma ilustración **cómic / novela gráfica oscura** que el
> entrenador (sección G): línea de tinta marcada, cel-shading plano, MUY oscuras y
> de bajo contraste, acento dorado `#c9a84c` sobre azul-noche `#060B14`. **Fútbol de
> SELECCIONES** (sin escudos de club, sin marcas). Sin texto, sin caras en primer
> plano reconocibles.

### I1. `concentracion-bg.webp` — 1200×800 (horizontal) → `public/img/modo-carrera/partido/`
**Tipo:** Imagen (fondo atenuado del modal)
**Prompt:**
> Interior de un centro de entrenamiento de alto rendimiento de una selección de fútbol en penumbra: conos, escaleras de agilidad, vallas y balones sobre un césped de cancha auxiliar desenfocado al fondo, una pizarra táctica insinuada en un lateral, luz cálida tenue entrando rasante. Atmósfera de concentración y trabajo silencioso antes del gran partido. Muy oscuro y de bajo contraste para ir atenuado DETRÁS de la interfaz. Estilo ilustración cómic oscura, acentos dorados #c9a84c. Sin personas en primer plano, sin texto. `--ar 3:2 --no text, watermark, logo, people, club-crest`

### I1b. `concentracion-bg-mobile.webp` — 1080×1920 (vertical) → `public/img/modo-carrera/partido/`
**Tipo:** Imagen
**Prompt:**
> Misma escena de centro de entrenamiento que I1 pero en composición VERTICAL: pasillo de conos y escaleras de agilidad hacia una cancha auxiliar desenfocada, pizarra táctica insinuada, luz cálida rasante, muy oscuro y de bajo contraste para fondo atenuado. Estilo cómic oscuro, dorado #c9a84c. Sin personas en primer plano, sin texto. `--ar 9:16 --no text, watermark, logo, people, club-crest`

> Miniaturas de sesión → `public/img/modo-carrera/concentracion/`. Cuadradas
> **240×240**, ilustración cómic, fondo oscuro propio (NO transparente), un acento
> dorado. Se muestran como arte a la izquierda de cada tarjeta de sesión; si faltan,
> se usa el icono SVG actual.

### I2. `sesion-fisico.webp` — 240×240
**Tipo:** Imagen (miniatura)
**Prompt:**
> Miniatura cómic oscura: dos futbolistas de selección haciendo sprints explosivos sobre una escalera de agilidad, gotas de sudor y líneas de movimiento, esfuerzo físico intenso. Encuadre cuadrado centrado, fondo azul-noche, acento dorado #c9a84c. Sin texto, sin escudos. `--ar 1:1 --no text, watermark, logo, club-crest`

### I3. `sesion-tactico.webp` — 240×240
**Tipo:** Imagen (miniatura)
**Prompt:**
> Miniatura cómic oscura: pizarra táctica de fútbol con imanes y flechas de jugada, conos repartidos sobre el césped al fondo, sensación de ensayo de movimientos y presión. Cuadrado, fondo azul-noche, acento dorado #c9a84c. Sin texto legible, sin escudos. `--ar 1:1 --no readable-text, watermark, logo, club-crest`

### I4. `sesion-balon-parado.webp` — 240×240
**Tipo:** Imagen (miniatura)
**Prompt:**
> Miniatura cómic oscura: jugador ensayando un lanzamiento de falta directa, balón quieto sobre el césped y una barrera de maniquíes de entrenamiento, trayectoria curva insinuada con una línea dorada. Cuadrado, fondo azul-noche, acento dorado #c9a84c. Sin texto, sin escudos. `--ar 1:1 --no text, watermark, logo, club-crest`

### I5. `sesion-analisis.webp` — 240×240
**Tipo:** Imagen (miniatura)
**Prompt:**
> Miniatura cómic oscura: sala de vídeo en penumbra con una pantalla mostrando un esquema táctico de un rival (diagramas y flechas, SIN texto legible), una libreta y un mando, ambiente de estudio del adversario. Cuadrado, fondo azul-noche, brillo de pantalla con acento dorado #c9a84c. Sin texto, sin escudos. `--ar 1:1 --no readable-text, watermark, logo, club-crest`

### I6. `sesion-recuperacion.webp` — 240×240
**Tipo:** Imagen (miniatura)
**Prompt:**
> Miniatura cómic oscura: futbolista estirando con calma sobre una camilla / haciendo recuperación (rodillo de espuma, hielo), fisioterapeuta insinuado, ambiente sereno y regenerador, tonos verdosos fríos suaves. Cuadrado, fondo azul-noche, acento dorado #c9a84c tenue. Sin texto, sin escudos. `--ar 1:1 --no text, watermark, logo, club-crest`

### I7. `contratiempo-lesion.webp` — 600×600 (transparente) → `public/img/modo-carrera/concentracion/`
**Tipo:** Imagen (alpha) — pantalla "Contratiempo · {jugador} se resiente"
**Prompt:**
> Ilustración cómic dramática: futbolista de selección en el suelo del entrenamiento agarrándose el gemelo/muslo con gesto de dolor, un miembro del cuerpo técnico arrodillándose hacia él, tensión del momento. Fondo TRANSPARENTE, contorno limpio, paleta oscura con un acento ROJO de alarma (#ef4444) y dorado sutil. Centrado, vertical-cuadrado. Sin texto, sin escudos. `--ar 1:1 --no text, watermark, logo, background, club-crest`

---

## J. RIVAL INCÓGNITO — MUNDIAL SIN SORTEAR (nueva idea) → `public/img/modo-carrera/`

> En Temporada con clasificación pendiente, los rivales del Mundial salen ocultos
> ("Rival por determinar") hasta que se alcanza esa fase. El placeholder actual es
> un **SVG** de bandera punteada con "?" (suficiente y coherente con la regla
> SVG-only). Este asset es **opcional** por si se quiere un placeholder ilustrado.

### J1. `rival-incognito.webp` — 200×200 (transparente)
**Tipo:** Imagen (alpha) — OPCIONAL
**Prompt:**
> Icono ilustrado: una bandera genérica ondeando en silueta sobre un mástil, con un gran signo de interrogación dorado #c9a84c superpuesto, transmitiendo "rival aún por determinar". Estilo cómic limpio, fondo TRANSPARENTE, paleta oscura con dorado. Sin texto, sin banderas de países reales. `--ar 1:1 --no text, watermark, real-flags, background`

---

## Resumen / checklist rápida

| # | Asset | Tipo | Medidas | Prioridad |
|---|---|---|---|---|
| A1 | onboarding-bg | Imagen | 1920×1080 | 1 |
| A2 | onboarding-bg-mobile | Imagen (vert.) | 1080×1920 | 1 |
| A3 | card-texture | Imagen | 600×840 | 2 |
| B1 | prensa-bg | Imagen | 1600×900 | 3 |
| B1b | prensa-bg-mobile | Imagen (vert.) | 1080×1920 | 3 |
| B2 | periodico-texture | Imagen | 1200×800 | 3 |
| C1 | trofeo-mundial | Imagen (alpha) | 800×1200 | 3 |
| C2 | trofeo-grupos | Imagen (alpha) | 400×600 | 4 |
| C3 | trofeo-octavos | Imagen (alpha) | 400×600 | 4 |
| C4 | vitrina-bg | Imagen | 1600×600 | 3 |
| C4b | vitrina-bg-mobile | Imagen (vert.) | 1080×1920 | 3 |
| D1 | empty-misiones | Imagen (alpha) | 500×500 | 4 |
| E1-E9 | iconos + badges | SVG | 24-64px | 4 |
| G1 | coach-neutral | Imagen (alpha) | 600×800 | 2 |
| G2 | coach-arenga | Imagen (alpha) | 600×800 | **1** |
| G3 | coach-instruccion | Imagen (alpha) | 600×800 | **1** |
| G4 | coach-celebra | Imagen (alpha) | 600×800 | 2 |
| G5 | coach-preocupado | Imagen (alpha) | 600×800 | 2 |
| H1 | vestuario-bg | Imagen | 1200×800 | 5 (opcional) |
| H2 | banquillo-bg | Imagen | 1200×800 | 5 (opcional) |
| I1 | concentracion-bg | Imagen | 1200×800 | **2** (concentración) |
| I1b | concentracion-bg-mobile | Imagen (vert.) | 1080×1920 | 3 |
| I2 | sesion-fisico | Miniatura | 240×240 | 3 |
| I3 | sesion-tactico | Miniatura | 240×240 | 3 |
| I4 | sesion-balon-parado | Miniatura | 240×240 | 3 |
| I5 | sesion-analisis | Miniatura | 240×240 | 3 |
| I6 | sesion-recuperacion | Miniatura | 240×240 | 3 |
| I7 | contratiempo-lesion | Imagen (alpha) | 600×600 | 3 |
| J1 | rival-incognito | Imagen (alpha) | 200×200 | 5 (opcional) |
| F1 | reveal-carta | Vídeo (alpha) | — | 2 |
| F2 | subida-nivel | Vídeo (alpha) | — | 3 |
| F3 | trofeo-reveal | Vídeo | — | 3 |
| F3b | trofeo-reveal-mobile | Vídeo (vert.) | — | 3 |
| F4 | hub-bg-loop | Vídeo loop | — | 5 (opcional) |
| F4b | hub-bg-loop-mobile | Vídeo loop (vert.) | — | 5 (opcional) |

Prioridad 1 = imprescindible para que el onboarding "historia" luzca ya.
El código tolera la ausencia de cualquiera (fallbacks SVG/degradado), así que
puedes ir soltando archivos en su carpeta y se integran solos.
