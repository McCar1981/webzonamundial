# Plan de Mejoras — Páginas Secundarias | ZonaMundial

> Objetivo: elevar todas las páginas interiores al mismo nivel de impacto visual, fluidez y conversión que la home. Más atractivas, más animadas, más contenido de valor y más potentes.

---

## 1. Estrategia de Imágenes: ¿Gemini/IA, fotos reales o búsqueda manual?

### Respuesta corta
**Fotos reales para lo emocional + Ilustraciones generadas por IA para lo conceptual.**

| Tipo de contenido | Recomendación | ¿Por qué? |
|-------------------|---------------|-----------|
| **Estadios** | Fotos reales (Unsplash, Pexels, Wikimedia, Getty libre) | Credibilidad absoluta. Un estadio generado por IA con asientos deformes destruye la confianza. |
| **Jugadores / Celebraciones históricas** | Fotos reales oficiales (FIFA, Wikimedia Commons) | El usuario busca reconocer el momento icónico. |
| **Banderas / Escudos** | Vectores/ SVG reales o API oficial (flagcdn) | Evita alucinaciones de IA en símbolos nacionales. |
| **Fondos abstractos, partículas, banners dorados** | Ilustraciones generadas por IA (Gemini, Midjourney, DALL·E) | Perfecto para crear atmósfera sin necesidad de realismo. |
| **Mockups de la app / UI explicativos** | Screenshots reales de la web o generación controlada por IA | Mezcla: lo real convierte más, lo ilustrado explica mejor. |
| **Infografías del formato 2026** | Diseño vectorial (Figma) o generación por IA + post-edición | Necesita precisión numérica; la IA sola puede errar diagramas. |

### ¿Puedes generar imágenes con Gemini?
Sí, para:
- Fondos de hero con textura de césped, partículas doradas y estadios abstractos.
- Banners decorativos para secciones (ej: "Calendario", "Historia").
- Ilustraciones de conceptos como "IA Coach" o "Fantasy" en estilo uniforme.

**NO uses Gemini para:** escudos, banderas, rostros de jugadores reconocibles o estadios específicos reales.

### ¿Puedes buscar imágenes tú?
Sí, y es la opción **más segura** para contenido real. Te recomiendo buscar bancos de imágenes gratuitas o solicitar fotos oficiales si tienes acuerdos con creadores/federaciones.

---

## 2. Sistema de Animaciones Unificado

Para que todas las páginas secundarias "respiren" al mismo ritmo, propongo instalar un **kit de animaciones reutilizable** basado en GSAP + ScrollTrigger (ya usado en Sedes y Grupos) y Framer Motion para micro-interacciones.

### Animaciones base a estandarizar

```tsx
// hooks/usePageAnimations.ts (nuevo)
export const useStaggerCards = (ref: RefObject<HTMLElement>, selector: string) => {
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current.querySelectorAll(selector),
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6, ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [ref, selector]);
};
```

### Biblioteca de efectos recomendados

| Efecto | Uso ideal | Tecnología |
|--------|-----------|------------|
| `fadeUpStagger` | Grids de tarjetas (selecciones, grupos, noticias) | GSAP ScrollTrigger |
| `revealText` | Títulos de sección que aparecen palabra por palabra | GSAP SplitText (o custom) |
| `hoverLift` | Cards que se elevan + resplandor dorado | CSS `transform` + `box-shadow` |
| `countUp` | Números estadísticos (rankings, goles, asistencias) | `react-countup` o GSAP |
| `smoothTabSwitch` | Transiciones entre tabs (calendario, herramientas) | Framer Motion `AnimatePresence` |
| `progressBarReveal` | Barras de estadísticas (probabilidades, posesión) | GSAP `width` animado |
| `imageParallax` | Imágenes de fondo en héroes que se mueven lentamente con el scroll | CSS `transform: translateY()` vinculado a GSAP |
| `shimmerBorder` | Bordes dorados animados en CTAs y cards premium | CSS `@keyframes` + `mask-image` |

---

## 3. Mejoras página por página

---

### A. Calendario de Partidos
**Problema actual:** Densidad de datos abrumadora. Scroll interminable. Falta jerarquía visual.

#### Propuestas de diseño
1. **Vista por fases con tabs animadas**
   - Tabs: "Fase de Grupos" | "32avos" | "Octavos" | "Cuartos" | "Semifinales" | "Final"
   - Transición entre tabs: `AnimatePresence` con `layoutId` para que los partidos "cruzados" entre fases tengan movimiento fluido.

2. **Filtros sticky + dinámicos**
   - Barra sticky con:
     - Selector de selección (searchable dropdown con bandera mini)
     - Selector de sede
     - Botón "Solo mis favoritos"
   - Al aplicar filtros, los partidos desaparecen con `scale down` y reaparecen con `fadeUpStagger`.

3. **Tarjeta de partido rediseñada**
   - Fondo con gradiente sutil según la fase (grupos = azul oscuro, eliminatoria = dorado/negro).
   - Bandera grande a cada lado, escudo FIFA centrado.
   - Botón "Añadir recordatorio" con hover de campana animada.
   - Línea de "estadio + hora" con icono de mapa clicable.
   - **Nueva info:** pronóstico de temperatura y probabilidad de lluvia en la sede (dato diferencial).

4. **Timeline vertical alternada**
   - En móvil, convertir el grid en una línea de tiempo vertical con círculos dorados conectados por una línea.
   - Animación: cada nodo aparece al hacer scroll.

5. **Imágenes**
   - Hero: foto panorámica de un estadio lleno (real) + overlay de gradiente oscuro.
   - Fondos de fase: ilustraciones IA abstractas con textura de balón o líneas de campo.

#### Contenido extra a añadir
- Countdown al próximo partido destacado (ej: inaugural).
- Sección "Partidos de hoy" con highlight automático según la fecha del sistema.
- Sección "Clásicos imperdibles" con 4-5 partidos predestacados por rivalidad histórica.

---

### B. Sedes (Estadios)
**Problema actual:** Es la página más pulida visualmente, pero las páginas internas de cada sede pueden ser mucho más potentes.

#### Propuestas de diseño
1. **Hero inmersivo por sede**
   - Imagen a pantalla completa del estadio (foto real, alta calidad).
   - Título con tipografía enorme y máscara de degradado dorado.
   - Stats flotantes: capacidad, inauguración, número de partidos del Mundial 2026.

2. **Sección "Partidos aquí"**
   - Mini-calendario filtrado dinámicamente para esa sede.
   - Tarjetas horizontales deslizables en móvil.
   - Animación: `drag` con inercia (Framer Motion).

3. **Mapa interactivo simplificado**
   - Embed de Google Maps estilizado (modo oscuro) o imagen del mapa de ubicación con punto pulsante dorado.
   - Botón "Cómo llegar" que abra Google Maps en app nativa.

4. **Galería de imágenes swipeable**
   - Carrusel táctil con fotos del estadio (interior, exterior, aérea).
   - Efecto de zoom ligero al hacer hover en desktop.

5. **Curiosidades / Datos de la sede**
   - 3-4 tarjetas con datos curiosos (ej: "Mayor concierto aquí", "Super Bowl 20XX", "Capacidad ampliada para el Mundial").

#### Contenido extra
- Video corto o GIF de la atmósfera del estadio (si hay derechos/libres).
- Comparativa con el resto de sedes del país (si es México/USA/Canadá).

---

### C. Grupos
**Problema actual:** Muy pulida, pero las páginas internas de cada grupo necesitan más potencia y contenido hemeroteca.

#### Propuestas de diseño
1. **Tarjeta de grupo 3D-tilt**
   - Al pasar el mouse por la tarjeta de grupo en el índice, efecto `perspective` + `rotateX/Y` sutil (CSS `transform-style: preserve-3d`).

2. **Página interna de grupo — Layout tipo dashboard**
   - **Columna izquierda (60%):** fixture del grupo con banderas grandes y horarios.
   - **Columna derecha (40%):** tabla de posiciones animada (las filas entran con `stagger`).
   - **Barra inferior:** análisis escrito del grupo + curiosidades.

3. **Simulador de resultados integrado**
   - Input simple de resultado predicho por partido.
   - La tabla de posiciones se recalcula en tiempo real (JS puro).
   - Efecto: las filas de la tabla se reordenen con animación `layoutId` de Framer Motion.

4. **Head-to-head entre selecciones**
   - Para cada enfrentamiento del grupo, un pequeño resumen histórico: "Se han enfrentado 4 veces. Último: X-Y ( Mundial 20XX )".

#### Imágenes
- Fotos de jugadores clave de cada selección (reales).
- Banderas grandes con textura realista o artística (puede ser IA estilizada).

---

### D. Noticias / Blog
**Problema actual:** Páginas planas. Sin animaciones. Sin identidad visual propia.

#### Propuestas de diseño
1. **Magazine layout**
   - Romper la grid uniforme. Artículo destacado ocupa 2x2 celdas con imagen a pantalla completa.
   - Grid asimétrica: algunas tarjetas horizontales, otras verticales, intercaladas.
   - Animación de entrada: cada tarjeta rota desde `opacity: 0, y: 60` a su posición.

2. **Etiquetas animadas**
   - Badge de categoría con borde brillante dorado que recorre el perímetro (CSS `@keyframes`).
   - Hover sobre la tarjeta: la imagen escala 1.05 y el título se subraya con línea dorada creciente.

3. **Filtro por categoría con transición suave**
   - Botones: "Todo" | "Selecciones" | "Fantasy" | "Creadores" | "Mundial 2026"
   - Al cambiar de filtro, las tarjetas se reacomodan con `layout` animation de Framer Motion.

4. **Artículo individual rediseñado**
   - Tipografía editorial: título enorme, foto hero ancha, cuerpo con líneas de lectura controladas (max-width 680px).
   - Quotes destacados con comillas doradas grandes.
   - "Artículos relacionados" al final con scroll horizontal infinito.

#### Contenido extra
- Sección "Análisis de creadores": artículos firmados por los creadores oficiales.
- Podcast / Audio resumen incrustado con reproductor minimalista.
- Newsletter inline: "Recibe cada mañana el resumen del Mundial".

---

### E. Registro
**Problema actual:** El formulario tiene buena intención pero falta micro-interacciones y urgencia.

#### Propuestas de diseño
1. **Formulario con pasos (wizard) animado**
   - Paso 1: Email + selección de selección favorita.
   - Paso 2: Elegir creador que te invitó (con avatares clicables en grid).
   - Paso 3: Confirmación con beneficio inmediato ("Descarga tu calendario PDF").
   - Transiciones entre pasos con `slideInRight` / `slideOutLeft`.

2. **Contador social en tiempo real**
   - Badge pulsante: "+2.847 personas pre-registradas".
   - Animación `countUp` que suba suavemente al cargar la página.

3. **Testimonios de creadores en carrusel**
   - Frases cortas de cada creador sobre por qué usar ZonaMundial.
   - Foto real del creador + firma/avatar.

4. **Beneficios visuales con progreso**
   - 3 iconos grandes que se iluminan uno por uno (auto-play) mientras el usuario lee.

5. **Urgencia**
   - Banner dorado animado: "Plazas limitadas para la liga privada de [Creador]".

---

### F. Creadores
**Problema actual:** La página delega en `CreadoresClient`, pero suele ser básica.

#### Propuestas de diseño
1. **Wall of fame con hover reveal**
   - Grid de fotos de creadores en escala de grises que pasa a color al hacer hover.
   - Overlay con nombre, cantidad de seguidores y redes sociales.
   - Animación: `clip-path` que revela la info desde abajo.

2. **Perfil individual de creador**
   - **Hero personalizado:** banner del creador + foto circular con borde dorado animado.
   - **Stats:** seguidores, contenidos publicados, predicciones acertadas en ZonaMundial.
   - **Enlace directo obligatorio** a TikTok/Instagram/YouTube/Twitch (P1 pendiente).
   - **Contenido del creador:** últimos artículos/vídeos/embeds de sus redes.

3. **Sección "Ligas privadas"**
   - Si el creador tiene una liga privada en ZonaMundial, mostrar la tabla de clasificación de su comunidad.

#### Imágenes
- Fotos reales de los creadores (ya existen algunas en `/creators/`).
- Banners personalizados para cada creador (pueden ser generados por IA con su paleta de colores).

---

### G. Herramientas
**Problema actual:** Selector de 3 cards. Transiciones bruscas. Sin rastro visual de dónde estás.

#### Propuestas de diseño
1. **Dashboard de herramientas**
   - Header fijo con el título y breadcrumbs animados.
   - Grid de "apps" tipo iOS/macOS con iconos grandes y descripciones cortas.

2. **Transiciones de navegación suaves**
   - Al hacer clic en una herramienta, la card se expande a pantalla completa (`layoutId` de Framer Motion).
   - El usuario siempre ve un botón flotante "Volver al dashboard".

3. **Herramienta "Simulador de Octavos"**
   - Visualización del bracket completo del Mundial 2026.
   - Drag & drop de selecciones para simular resultados.
   - Animación de confeti dorado al completar una predicción de campeón.

4. **Herramienta "Comparador de Selecciones"**
   - Selector de 2 selecciones.
   - Radar chart comparativo (usando `recharts` o `chart.js`) con stats históricas.
   - Barras comparativas animadas (goles, asistencias, títulos, ranking FIFA).

---

### H. Formato 2026 / Datos
**Problema actual:** Pared de texto. Sin diagramas. Difícil de entender para alguien que no conozca el formato expandido.

#### Propuestas de diseño
1. **Infografía interactiva scroll-driven**
   - Scroll que revela paso a paso el formato:
     1. 48 selecciones.
     2. 12 grupos de 4.
     3. Mejores terceros avanzan.
     4. 32avos de final.
     5. Bracket hasta la final.
   - Cada paso se ilumina mientras el usuario hace scroll (GSAP ScrollTrigger + `pin`).

2. **Diagrama del bracket visual**
   - SVG animado que dibuja las líneas del bracket progresivamente.
   - Hover sobre cada ronda muestra cuántos partidos y cuándo.

3. **Comparativa Mundial 2022 vs 2026**
   - Dos columnas con stats comparativas animadas:
     - 32 vs 48 equipos.
     - 64 vs 104 partidos.
     - 8 vs 12 grupos.
     - 1 vs 3 países anfitriones.

4. **Video explicativo embebido o animación Lottie**
   - Un GIF/MP4 corto de 20-30 segundos explicando el formato con motion graphics.
   - Alternativa: animación Lottie ligera que se reproduzca al entrar en viewport.

#### Imágenes
- Ilustraciones IA de un balón desglosándose en etapas del torneo.
- Mapa mundial con los 3 países anfitriones resaltados.

---

### I. Historia
**Problema actual:** Mucho contenido pero visualmente plano. Tabla histórica larga y densa.

#### Propuestas de diseño
1. **Línea de tiempo interactiva (Timeline horizontal)**
   - Cada mundial es un punto en la línea.
   - Al hacer clic, se abre una modal o se expande una card con:
     - Campeón y subcampeón (bandera + resultado).
     - Goleador.
     - Sede.
     - Mejor jugador.
     - Anécdota icónica.

2. **Momentos icónicos como "Story cards"**
   - Cards grandes tipo Instagram Stories con foto de fondo real (Maradona, Zidane, Messi, etc.).
   - Texto superpuesto con gradiente.
   - Botón "Ver el gol" que enlace a YouTube oficial de FIFA.

3. **Sección "Récords" con contadores animados**
   - Mayor goleador histórico: número animado de goles.
   - Más títulos: número animado de copas.
   - etc.
   - Barras de progreso visualizando la diferencia entre el 1º y el 2º.

4. **Mapa de campeones mundiales**
   - Mapamundi con los países campeones resaltados en dorado.
   - Tooltip al pasar el mouse: años en los que ganaron.

5. **Tabla histórica con acordeón por década**
   - En vez de una tabla larga de 22 filas, agrupar por década.
   - Expandir/colapsar con animación `height` suave.

---

### J. Premium
**Problema actual:** Muy comercial pero estático. Faltan pruebas sociales y urgencia.

#### Propuestas de diseño
1. **Hero con video de fondo o partículas**
   - Video sutil en loop de un estadio lleno o confeti dorado cayendo.
   - Alternativa low-bandwidth: fondo generado por IA con brillo dorado animado.

2. **Pricing cards con efecto " destacado"**
   - La tarjeta anual tiene un halo dorado pulsante.
   - Badge "Más popular" con brillo.
   - Toggle mensual/anual con rebaja visual (-20%).

3. **Contador de usuarios Premium**
   - "Únete a +1.240 usuarios Premium" con avatares de usuarios reales (anónimos).

4. **Sección "Resultados reales de Premium"**
   - Testimonios de usuarios que ganaron ligas privadas gracias a las stats avanzadas.
   - Logos de ligas o avatares de comunidades.

5. **Garantía visual**
   - Badge grande: "7 días de prueba gratuita. Cancela cuando quieras." con icono de escudo.

---

### K. Selecciones
**Estado actual:** Es la página secundaria más pulida. Podemos llevarla al siguiente nivel con contenido hemeroteca en las páginas internas.

#### Página interna de cada selección
1. **Hero con bandera a pantalla completa**
   - Fondo con textura de la bandera (estilizada, no literal) o foto de la afición celebrando.
   - Escudo grande con brillo dorado.
   - Stats flotantes: ranking FIFA, grupo, mundiales jugados, mejor resultado.

2. **Pestañas: Plantilla | Historial | Rivalidades | Ruta al 2026**
   - Cambio de tab con animación de deslizamiento.
   - **Plantilla:** fotos de jugadores clave con posición, club y edad.
   - **Historial:** línea de tiempo de participaciones en mundiales.
   - **Rivalidades:** comparativa con el clásico rival.
   - **Ruta al 2026:** cómo se clasificó (eliminatoria, playoff, anfitrión).

3. **Video / Highlights**
   - Sección con el último partido de la selección o un resumen de su clasificación.

---

## 4. Componentes Visuales Nuevos Sugeridos

### A. `AnimatedSection`
Wrapper reutilizable para todas las secciones con fade-up automático.

### B. `ShimmerButton`
Botón CTA con borde dorado brillante que recorre el perímetro (ya parcialmente existe, estandarizarlo).

### C. `StatCounter`
Número que cuenta desde 0 hasta el valor objetivo al entrar en viewport.

### D. `VideoBackgroundHero`
Hero que acepta video MP4/WebM optimizado con fallback a imagen estática.

### E. `ImageComparisonSlider`
Para comparativas (2022 vs 2026, antes/después de una jugada).

### F. `HorizontalSnapScroll`
Carrusel táctil con snap obligatorio para móvil (partidos, noticias, creadores).

### G. `ConfettiReward`
Efecto de confeti dorado para momentos de logro (completar registro, simular playoff, ganar trivia).

---

## 5. Roadmap de Implementación Priorizado

### Fase 1 — Impacto inmediato (1-2 semanas)
1. **Noticias/Blog:** añadir GSAP de entrada y hover states en tarjetas.
2. **Calendario:** implementar tabs por fase + filtros sticky.
3. **Formato 2026:** crear infografía SVG del bracket + comparativa 2022 vs 2026.
4. **Registro:** convertir a wizard de 3 pasos con animaciones.

### Fase 2 — Profundidad de contenido (2-3 semanas)
5. **Sedes internas:** mini-calendario filtrado + galería swipeable.
6. **Grupos internos:** simulador de resultados + head-to-head.
7. **Historia:** timeline interactivo horizontal + cards de momentos icónicos.
8. **Creadores:** wall of fame con hover reveal + perfil individual enriquecido.

### Fase 3 — Polish y diferenciación (3-4 semanas)
9. **Herramientas:** dashboard con transiciones `layoutId` + comparador de selecciones con gráficos.
10. **Premium:** video/particle background + testimonios + contador de usuarios.
11. **Selecciones internas:** tabs con plantilla, historial y rivalidades.
12. **Implementar componentes reutilizables** (`AnimatedSection`, `StatCounter`, etc.).

### Fase 4 — Imágenes y assets (paralelo)
- Generar con Gemini/IA: fondos abstractos, banners de sección, ilustraciones conceptuales.
- Buscar/bajar fotos reales: estadios, jugadores, momentos históricos, aficiones.
- Convertir todo a WebP/AVIF y optimizar lazy loading.

---

## 6. Checklist de Imágenes por Página

| Página | Qué buscar/generar | Fuente recomendada |
|--------|--------------------|-------------------|
| Calendario | Foto hero de estadio lleno + fondos abstractos por fase | Unsplash / IA |
| Sedes | 16 fotos reales de estadios (ya existen, optimizar) | Actuales / Wikimedia |
| Grupos | Fotos de jugadores clave (48 selecciones) | Getty libre / Wikimedia |
| Noticias/Blog | Fotos de archivo deportivo variadas | Unsplash / Pexels |
| Registro | Avatares de creadores + mockups de app | Actuales + screenshots propios |
| Creadores | Fotos de perfil + banners personalizados | Actuales + IA para banners |
| Herramientas | Iconos vectoriales grandes y consistentes | Figma / Lucide / IA |
| Formato 2026 | Mapa mundial + diagrama bracket + ilustraciones conceptuales | Figma + IA |
| Historia | Fotos icónicas de momentos históricos | Wikimedia / FIFA archive |
| Premium | Fondo partículas/dorado o video estadio | IA / Pexels video |
| Selecciones | Aficiones celebrando + texturas de banderas | Unsplash / IA estilizada |

---

**Conclusión:** La mayor oportunidad está en las páginas que actualmente son planas (Noticias, Formato, Herramientas) y en las páginas internas que aún no explotan el contenido disponible (sedes, grupos, selecciones). Con un sistema de animaciones unificado, una estrategia de imágenes mixta (reales + IA) y componentes interactivos, las páginas secundarias pasarán de ser "funcionales" a ser "imprescindibles".
