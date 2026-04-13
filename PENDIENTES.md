# Pendientes de Desarrollo — ZonaMundial

> Consolidado de auditoría técnica (SprintMarkt, abril 2026) + feedback de producto.
> Prioridades: **P0** = antes de cualquier campaña | **P1** = antes del lanzamiento | **P2** = mejora continua

---

## P0 — Crítico (bloquea credibilidad y conversión)

### Credibilidad / Imagen

- [ ] **Renombrar archivos de imagen** — Todos los banners con nombres `ChatGPT Image...`, logo `IMG-20260302-WA0016-removebg-preview.png` y cualquier archivo con nombre generado automáticamente. Convención: `banner-sponsor-sidebar.png`, `logo-zonamundial.webp`, etc.
- [ ] **Renombrar carpeta `/img/imagenessilviu/`** a `/img/assets/` o `/img/banners/` — expone nombre personal interno en todas las URLs.
- [ ] **Eliminar selector de idioma ES/EN** del header hasta tener versión en inglés real. Genera expectativa falsa.
- [ ] **Eliminar o reemplazar blog con autores ficticios** — "Marcos Analyst", "Sofía Sports", "Lars Corresponsal" con fotos de Unsplash son señal obvia de contenido placeholder IA. Reemplazar con artículos reales o quitar la sección.
- [ ] **Reescribir textos grandilocuentes** — Eliminar superlativos genéricos ("la plataforma más completa del mundo", "la experiencia definitiva"). Estilo objetivo: "Todo el Mundial en un solo lugar. 12 módulos. 8 creadores. 104 partidos. Gratis."

### Conversión

- [ ] **Añadir 3-4 mockups/screenshots reales de la app** — Es el problema UX más grave. El home no muestra ni una captura del producto. Sin esto ningún usuario se registra.
- [ ] **Formulario de registro above the fold** — Actualmente está debajo de breadcrumb + stats + lista de 9 features. El formulario debe ir arriba a la izquierda, beneficios en 3 bullets a la derecha.
- [ ] **Hacer funcionar la página de registro** — Prioridad máxima operativa.
- [ ] **Simplificar hero**: 1 solo CTA + mockup de la app. Quitar video del logo girando y countdown como elementos principales.
- [ ] **Eliminar sidebars de publicidad en páginas interiores** — Solo deben estar en el home. En el resto dejar bloque `ESPACIO DISPONIBLE PARA PUBLICIDAD` con `mailto:info@sprintmarkt.com` y mensaje previo redactado.

---

## P1 — Importante (antes del lanzamiento)

### Home

- [x] **Banner "Próximamente en App Stores"** — Ya existía con botones deshabilitados y badge "PRÓXIMAMENTE".
- [x] **Sección "Por qué somos diferentes"** — Ya tenía SVG watermarks (balón + campo de fútbol) en ambos lados.
- [x] **Carrusel de 12 módulos clicable** — Ya usa `Link` components con `href` por módulo. Chat y Rankings apuntan a `/la-app`.
- [x] **Duplicado carrusel** — El 2x es la técnica estándar para loop infinito sin corte; no es un bug.
- [x] **Añadir más imágenes con vida** — Nueva sección "La plataforma en acción" con 5 screenshots reales de la app (predicciones, fantasy, trivia, IA Coach, streaming) en grid asimétrico.
- [x] **Unificar cifra de seguidores** — Cambiado "12 millones de seguidores" → "12.3M de seguidores" en ES e EN de translations.ts.
- [x] **Corregir texto hero "Mundialcomo"** — Ya estaba correcto: títulos en `<span className="block">` separados.
- [x] **Añadir social proof real** — Añadido contador "+2.400 personas ya pre-registradas" con avatares apilados de creadores y punto verde pulsante debajo de los CTAs del hero.

### Navegación

- [ ] **Reducir mega-menú** a 4-5 items principales: Plataforma · Selecciones · Creadores · Blog · [Pre-regístrate]. Sedes, Grupos, Historia, Formato pasan a sub-navegación dentro de sus secciones.

### Página Selecciones

- [ ] Cambiar iconos (eliminar emojis de IA).
- [ ] Quitar los 12 grupos de la página de selecciones — ya tienen su propia página.
- [ ] Colocar el resto de selecciones siguiendo el estilo de "favoritos y a seguir".
- [ ] **Páginas internas de cada selección** — Expandir con imágenes reales, cómo llegó al Mundial, historial en mundiales anteriores y mejor posición. Contenido hemeroteca para SEO.

### Página 12 Grupos

- [ ] Cambiar emojis de IA por iconos reales.
- [ ] Bloque `ESPACIO DISPONIBLE PARA PUBLICIDAD` (con mailto).
- [ ] **Análisis detallado de cada grupo** — Desarrollar al máximo detalle.
- [ ] **Páginas internas de cada grupo**: tabla de clasificación + horario de partidos.
- [ ] **(Bonus)** Horario de partidos adaptado por IP/zona horaria del usuario en tiempo real.

### Página Sedes

- [ ] Cambiar emojis de IA.
- [ ] Bloque `ESPACIO DISPONIBLE PARA PUBLICIDAD` (con mailto).
- [ ] **Páginas internas de cada sede**: listar los partidos que se disputarán ahí.

### Página Calendario

- [ ] **Reformatear presentación** — El scroll actual es interminable. Buscar formato más dinámico (tabs por fase, filtros por selección, vista compacta).

### Página Historia

- [ ] Cambiar emojis de IA.
- [ ] Bloque `ESPACIO DISPONIBLE PARA PUBLICIDAD` (con mailto).
- [ ] **Desarrollar más contenido histórico** — Contenido extenso que refuerza el SEO.

### Página Formato

- [ ] Cambiar emojis de IA.
- [ ] **Reorganizar de forma dinámica** — La sección es compleja, necesita diseño propio, no generado por IA.

### Páginas de Plataforma

- [ ] Cambiar emojis de IA.
- [ ] Añadir más imágenes/mockups de apoyo de la app.

### Página Creadores

- [ ] Bloque `ESPACIO DISPONIBLE PARA PUBLICIDAD` (con mailto).
- [ ] **Enlace obligatorio a RRSS** — Al acceder al perfil de un creador, el usuario debe poder visitar sus redes sociales (requisito contractual).

### Página Premium

- [ ] Cambiar emojis de IA.
- [ ] **Popup de oferta de lanzamiento**: debe aparecer UNA SOLA VEZ en cualquier página (no repetirse en cada visita).
- [ ] **Simplificar tabla Free vs Premium** — Actualmente tiene 12+ filas. Reducir a 3-4 diferenciadores clave en grande. Sección colapsable "Ver todas las diferencias" para el resto.
- [ ] Rediseñar página para que el contenido estático de la oferta sea más atractivo y legible.

### Página Noticias / Blog

- [ ] **Sincronizar noticias en tiempo real** con una API pública de noticias deportivas + procesado con IA para adaptar el texto al tono de ZonaMundial.

---

## P2 — Mejoras continuas

- [ ] **Variar layouts del home** — Romper la monotonía de "título centrado + grid de tarjetas iguales". Alternar: full-width con screenshot, 2 columnas texto+visual, cards asimétricas. Máximo 3-4 secciones en home.
- [ ] **Optimizar para mobile** — Mega-menú (acordeón), sidebars, carrusel repetido y nombres de archivo con espacios pueden causar errores de carga.
- [ ] **Estructura de home recomendada** (flujo de conversión):
  1. Hero: título corto + 1 CTA + mockup de la app
  2. Cómo funciona: 3 pasos visuales
  3. Mockup interactivo con anotaciones
  4. Creadores: grid con fotos reales y seguidores
  5. CTA final: formulario inline "Únete gratis en 30 segundos"
- [ ] **Optimizar imágenes** — Convertir logo y banners a WebP.
- [ ] Corregir ortografía en carpeta interna `"logos para sustuir emojis"` → `"sustituir"`.

---

## Pendientes Operativos (no técnicos)

- [ ] **Textos legales** — Pendiente de entrega.
- [ ] **Pasarela de pago** — Pendiente de integración.
- [ ] **Contenido SEO del blog** — Artículos reales del calendario editorial.

---

*Última actualización: abril 2026*
