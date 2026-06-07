# Storyboard — Modo Carrera (estilo FIFA)

Mapa completo de **todas las situaciones interactivas** del Modo Carrera, para
producir imágenes/animaciones sin huecos. Cada escena lista: qué se muestra, la
animación, y el asset de imagen necesario.

Convenciones:
- **Paleta:** BG `#060B14`, BG2 `#0F1D32`, BG3 `#0B1825`, GOLD `#c9a84c`, GOLD2 `#e8d48b`.
- **Animaciones:** GSAP + ScrollTrigger (mismo patrón que el resto de la web).
- **Iconos:** SIEMPRE SVG (`src/components/icons.tsx`), nunca emojis.
- **Assets:** ruta sugerida `public/img/modo-carrera/...`. Estado: `[FALTA]` = hay que generarla, `[OK]` = ya existe.

---

## 0. Entrada / Routing

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Landing informativa | Ya existe (`/app/modo-carrera`) | GSAP scroll reveals | varias `[OK]` |
| Carga del juego | Spinner + carta DT en silueta | pulse/shimmer skeleton | — |
| Sin DT creado → Onboarding | Redirige a flujo de creación | crossfade | — |
| Con DT creado → Hub | Entra directo al Hub | slide-up | — |

---

## 1. PILAR 1 — Identidad DT (Onboarding)

Flujo paso a paso (wizard). Cada paso es una "escena".

| # | Escena | Qué se muestra | Animación | Asset `[estado]` |
|---|---|---|---|---|
| 1.1 | Bienvenida | Título "Crea tu leyenda", CTA empezar | hero timeline (badge→title→cta) | fondo banquillo/estadio `[FALTA]` |
| 1.2 | Nombre del DT | Input nombre + preview en carta | typing → carta refleja nombre en vivo | — |
| 1.3 | Elegir filosofía | 4 cartas (Ofensiva/Defensiva/Posesión/Contragolpe) con icono SVG y color | stagger entrada + scale on select + glow color filosofía | icono SVG por filosofía `[FALTA SVG]` |
| 1.4 | Adoptar selección | Grid de 48 banderas (buscador) | filtro instantáneo, flag pop-in | banderas (flagcdn, ya disponible) `[OK]` |
| 1.5 | Reveal carta DT | Carta FIFA completa se "imprime" | flip 3D + brillo dorado barriendo (shine sweep) | textura carta `[FALTA]` |
| 1.6 | Confirmar | Resumen + "Iniciar carrera" | confeti dorado sutil | — |

**Estados límite:** nombre vacío (botón disabled), filosofía no elegida, nación no elegida, salir a mitad (guarda borrador en localStorage).

---

## 2. PILAR 2 — Progresión (visible en Hub y cabecera)

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Overall 0-99 | Número grande estilo FIFA + rango (Amateur…Inmortal) | count-up al cargar | — |
| Barra XP | Progreso al siguiente nivel | fill animado (width) | — |
| **Subida de nivel** | Overlay "¡NIVEL +1!" overall sube | burst de partículas + flash dorado + shake leve | partículas (reusar `GoldParticles`) `[OK]` |
| Moral del vestuario | Medidor 0-100 con color (rojo→verde) | aguja/gradiente animado | — |
| Cambio de moral | Sube/baja tras evento | tween color + pulse | — |

---

## 3. PILAR 3 — Árbol de habilidades

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Vista árbol | 4 ramas (Ataque/Defensa/Mental/Gestión) × 5 nodos | líneas que se "dibujan" entre nodos | — |
| Nodo bloqueado | Candado gris | — | icono SVG candado `[FALTA SVG]` |
| Nodo disponible | Brillo + puntos disponibles | pulse | — |
| **Desbloquear nodo** | Nodo se ilumina con color de rama | scale + glow + línea hacia el siguiente se ilumina | — |
| Sin puntos | Mensaje "Gana XP para desbloquear" | shake suave al intentar | — |

---

## 4. PILAR 4 — Misiones dinámicas

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Lista misiones | Cards por tipo (diaria/semanal/torneo/flash) con barra progreso | stagger entrada | icono SVG por tipo `[FALTA SVG]` |
| Progreso parcial | Barra a media | fill al actualizar | — |
| **Misión completada** | Badge "✓ Completada" (SVG check) | check dibujado + card glow verde | — |
| **Reclamar recompensa** | +XP / +Reputación voladores | números que suben y se desvanecen | — |
| Misión flash (timer) | Cuenta atrás | tick + color rojo al expirar | — |
| Misión fallida/expirada | Card atenuada | fade a gris | — |
| Sin misiones | Estado vacío "Vuelve mañana" | — | ilustración vacío `[FALTA]` |

---

## 5. PILAR 5 — Reputación

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Radar 6 stats | Hexágono (prestigio, carisma, táctica, disciplina, mediático, cantera) | radar que se "expande" desde el centro | — (SVG generado) |
| Subida de stat | Vértice crece | tween del polígono | — |
| Rivalidades | Lista rivales con intensidad y récord | stagger | banderas/escudos rival `[OK flags]` |
| **Nueva rivalidad** | Banner "Rivalidad declarada" | slam-in + shake | — |
| Títulos/insignias | Grid de badges (obtenidos vs bloqueados) | flip al obtener | badge SVG por título `[FALTA SVG]` |
| **Desbloquear título** | Badge se revela con brillo | flip 3D + shine | — |

---

## 6. PILAR 6 — Narrativa viva

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Briefing diario | Tarjeta tipo "prensa" con texto IA | máquina de escribir (typewriter) | foto periódico/prensa `[FALTA]` |
| Titular de prensa | Headline grande estilo periódico | reveal por máscara | textura papel `[FALTA]` |
| **Rueda de prensa (decisión)** | Pregunta + 2-3 opciones | opciones aparecen en stagger; al elegir, las otras se atenúan | fondo sala de prensa `[FALTA]` |
| Resultado de decisión | Efecto en moral/reputación | toast con delta | — |
| Evento aleatorio | Pop-up de evento (lesión, oferta, polémica) | slide-in dramático | iconos evento SVG `[FALTA SVG]` |
| Cargando IA | "El periodista está escribiendo…" | dots animados | — |
| Error IA / offline | Fallback a titular plantilla | fade-in | — |

---

## 7. PILAR 7 — Legado DT

| Escena | Qué se muestra | Animación | Asset |
|---|---|---|---|
| Sala de trofeos | Vitrina con copas obtenidas | trofeos con brillo + reflejo | modelo/imagen trofeo `[FALTA]` |
| **Ganar trofeo** | Copa levantada a pantalla completa | zoom + rayos de luz + confeti | copa Mundial `[FALTA]` |
| Récords | Tabla PJ/G/E/P/GF/GC/Títulos | count-up | — |
| Línea de tiempo | Hitos por temporada | scroll horizontal reveal | — |
| Perfil DT (compartible) | Carta + palmarés para redes | render a imagen | — |

---

## 8. Estados transversales (todas las vistas)

| Estado | Qué se muestra | Asset |
|---|---|---|
| Invitado (sin login) | Banner "Inicia sesión para guardar tu carrera" | — |
| Guardando | Indicador discreto "Guardado ✓" (SVG) | — |
| Sin conexión | Toast "Sin conexión, guardado local" | — |
| Cargando datos | Skeletons shimmer | — |
| Error genérico | Card de error + reintentar | — |

---

## 9. Partido interactivo (jugable, estilo FIFA)

Modal a pantalla completa (`MatchLive.tsx`). Máquina de fases:
`plan → half1 → (lesión) → (charla si pierdes) → decisión 60' → half2 → final`.

| # | Escena | Qué se muestra | Animación | Asset `[estado]` |
|---|---|---|---|---|
| 9.1 | Plan táctico | Jugadores clave de ambos + 4 planes (equilibrado/presión/muro/contragolpe) | stagger cartas + glow al seleccionar | camisetas `[OK]` · **figura `coach-neutral` `[FALTA]`** |
| 9.2 | Saque / reloj | Marcador + cronómetro con tempo cinematográfico | pulse del reloj, frena en tramos finales | — |
| 9.3 | **Celebración de gol** | "GOOOL" a pantalla completa, camiseta del goleador | destello color equipo + barrido de luz + kit salta | camiseta `[OK]` |
| 9.4 | **Lesión + sustitución** (nueva) | Titular que cae + 3 recambios reales (igual/ofensivo/defensivo) | slide-in dramático, cruz médica SVG | icono SVG `[OK inline]` · **`coach-instruccion` `[FALTA]`** |
| 9.5 | **Charla al descanso** (nueva, solo si pierdes) | 3 tonos (arenga/calma/exigir) con delta de moral | cards en stagger, silbato SVG | **`coach-arenga` + `vestuario-bg` `[FALTA]`** |
| 9.6 | Decisión minuto 60 | Cronómetro circular de presión + 2-3 opciones según marcador | header pop, borde dorado latiendo | **`coach-instruccion` + `banquillo-bg` `[FALTA]`** |
| 9.7 | Final | Victoria/Empate/Derrota + figura del partido | win-in + glow dorado + confeti si V | camiseta `[OK]` · **`coach-celebra` / `coach-preocupado` `[FALTA]`** |

**Estados límite:** cancelar antes del saque; auto-pick de la decisión si expira el contador (mantiene el plan); el modo rápido ("Disputar al instante") no muestra este modal.

---

## 10. Gestión de plantel (bajas, sanciones, capitán)

Paneles en la pantalla de Temporada (`SeasonView.tsx`), antes del próximo partido.

| Escena | Qué se muestra | Animación | Asset `[estado]` |
|---|---|---|---|
| Parte médico | Lista de lesionados + fechas de baja + zona que merma | — | cruz médica SVG `[OK inline]` |
| **Sancionados** (nueva) | Lista por tarjetas (roja 2 fechas / amarillas 1) + zona | — | tarjeta SVG `[OK inline]` |
| **Capitán** (nueva) | Capitán designado + selector del plantel; plus de liderazgo | expand/collapse del selector | brazalete SVG `[OK inline]` · opc. `coach-neutral` |

---

## Inventario de assets a producir `[FALTA]`

**Imágenes (generar):**
1. Fondo banquillo/estadio onboarding (vertical y horizontal).
2. Textura/plantilla de la carta DT (estilo carta FIFA, dorada).
3. Fondo sala de prensa (rueda de prensa).
4. Texturas de periódico/papel para titulares.
5. Copa del Mundo (reveal de trofeo) + trofeos secundarios para la vitrina.
6. Ilustración de estado vacío (misiones).
7. **Figura del entrenador (5 poses)** — silueta/ilustración estilizada en paleta de
   marca, fondo transparente: `coach-neutral`, `coach-arenga`, `coach-instruccion`,
   `coach-celebra`, `coach-preocupado`. Es el mayor salto visual para las escenas
   "humanas" (charla, decisión 60', sustitución, final, prensa).
8. **Fondos de partido** (opcionales): `vestuario-bg` (charla al descanso) y
   `banquillo-bg` (decisión minuto 60).

**Iconos SVG (añadir a `src/components/icons.tsx` o inline):**
1. 4 iconos de filosofía (ofensiva, defensiva, posesión, contragolpe).
2. Candado (nodo bloqueado del árbol).
3. Iconos por tipo de misión (diaria, semanal, torneo, flash).
4. Badges de títulos/insignias.
5. Iconos de eventos (lesión, oferta, polémica).

**Animaciones reutilizables (ya en repo):**
- `GoldParticles`, `FloatingElements`, GSAP timelines, ScrollTrigger.

---

## Orden de construcción sugerido (fases)

1. **F1 (esqueleto, este montaje):** Onboarding DT + Hub + Ficha DT + persistencia. Animaciones básicas, sin imágenes nuevas (placeholders).
2. **F2:** Árbol de habilidades + Misiones (motor + UI).
3. **F3:** Reputación (radar, rivalidades, títulos).
4. **F4:** Narrativa viva (Claude API: briefings, titulares, ruedas de prensa).
5. **F5:** Legado + sala de trofeos + perfil compartible.
6. **F6:** Pase de assets de imagen definitivos + pulido de animaciones.
