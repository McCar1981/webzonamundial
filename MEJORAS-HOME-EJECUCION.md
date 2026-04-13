# Mejoras Accionables — Home ZonaMundial
## Diagnóstico + Roadmap de implementación

> Este documento complementa `PROPUESTA_HOME_SAL.md`. Enfoca las mejoras desde una perspectiva técnica, de conversión y performance, basadas en el estado actual del código (`src/app/page.tsx` y sus secciones).

---

## 1. Diagnóstico rápido de la home actual

| Aspecto | Estado | Impacto |
|---------|--------|---------|
| **Diseño visual** | Dark-mode premium con partículas doradas, bento grid y carruseles. | Alto |
| **Copy / Voz** | Mejorado por `PROPUESTA_HOME_SAL.md` (tono "Saul Goodman"), pero aún hay secciones conCTA genéricos. | Medio |
| **Performance** | Uso extensivo de `<img>` nativo en lugar de `<Image>` de Next.js. Video de hero sin fallback/poster. Página entera es `"use client"`. | Alto (negativo) |
| **Accesibilidad** | Contrastes bajos en `text-gray-500/600`, carrusel sin pausa al hover, botón dentro de `<Link>` en `MagneticButton`. | Medio |
| SEO Técnico | `page.tsx` es client component → no puede exportar `metadata` ni `generateMetadata`. Faltan datos estructurados (Schema.org). | Alto (negativo) |
| **Conversión** | Formulario de waitlist simula envío local (`setSubmitted`) sin backend. El contador de "1.247" es estático. Faltan micro-conversiones. | Alto |

---

## 2. Mejoras de Alto Impacto (Conversión + Negocio)

### 2.1. Hacer funcional la waitlist (AppBannerSection)
**Problema:** El formulario de `AppBannerSection.tsx` solo hace `setSubmitted(true)` sin guardar el email.

**Solución:**
- Conectar con una API Route (`/api/waitlist`) que persista en una base de datos sencilla (ej. Supabase, Airtable, o incluso un Google Sheet via script).
- Mostrar estados de carga y feedback real.
- Opcional: integrar con Mailchimp / Resend / Brevo para confirmación por email.

**Impacto:** Pasamos de un formulario decorativo a un canal de captación real.

### 2.2. Convertir "1.247" en un contador social dinámico
**Problema:** El número de pre-registros en `AppBannerSection` es hardcodeado.

**Solución:**
- Crear endpoint `/api/waitlist/count` que devuelva el total real.
- Sustituir el número estático por `useSWR` o `useEffect` con fetch.
- Bonus: animar el contador con `AnimatedCounter` al aparecer en viewport.

**Impacto:** Aumenta la confianza social (social proof) con datos reales.

### 2.3. Optimizar el Hero para performance
**Problema:** El hero carga un video MP4 (`video logo dando vueltas.mp4`) que probablemente pesa varios MB y no tiene poster.

**Solución:**
- Generar un poster estático (primer frame o frame clave) como `poster` del `<video>`.
- Agregar atributo `preload="none"` o `preload="metadata"` según el análisis de uso.
- Servir versión WebM además de MP4 para navegadores compatibles.
- En móvil, considerar mostrar solo una imagen estática optimizada en lugar del video.

**Impacto:** Mejora LCP y reduce data móvil.

### 2.4. Añadir trigger de "scrollea para ver más"
**Problema:** En pantallas grandes el hero ocupa 100vh y algunos usuarios pueden no percatarse de que hay más contenido debajo.

**Solución:**
- Añadir un `ScrollIndicator` animado (flecha o "Descubre más") en la parte inferior del hero.
- Al hacer click, hacer scroll suave a la siguiente sección (`StatsSection`).

---

## 3. Mejoras de UX/UI

### 3.1. Pausar carruseles al hover (`CarouselRows`)
**Problema:** El carrusel de features se mueve constantemente, lo cual puede dificultar la lectura y es molesto para usuarios con problemas de atención o movimiento.

**Solución:**
- Agregar `animation-play-state: paused` al hacer hover sobre la fila.
- Respetar `prefers-reduced-motion`: si el usuario lo tiene activado, desactivar la animación por completo.

### 3.2. Arreglar semántica de `MagneticButton`
**Problema:** Actualmente es un `<button>` dentro de `<Link>`, lo cual genera problemas de accesibilidad y navegación por teclado.

**Solución:**
- Convertir el componente para que use el `slot` de Next.js Link o directamente un `<a>` estilizado.
- Mover el efecto ripple a un `span` controlado por React (evitar `document.createElement` directo).

### 3.3. Mejorar contraste y tipografía
**Problema:** Colores como `text-gray-500` (`#6b7280`) sobre fondos oscuros (`#060B14`) no cumplen WCAG AA.

**Solución:**
- Subir grises secundarios mínimo a `text-gray-400` (`#9ca3af`) o `#8a94b0`.
- Asegurar que todos los textos de `<p>` o `<span>` informativos tengan ratio de contraste ≥ 4.5:1.

### 3.4. Añadir micro-interacciones de scroll
**Propuestas:**
- **Progress bar dorada** en la parte superior del viewport que indique % de scroll.
- **Revelado escalonado** de los grids (creatores, explore, screenshots) usando `gsap.fromTo` con `stagger` al entrar en viewport ( ya existe `useGSAPAnimations` pero no aplica a todo).

### 3.5. Hacer las cards de "Explore" más distinguibles
**Problema:** Las 6 tiles de `ExploreSection` son visualmente similares; solo "Únete" tiene color naranja.

**Solución:**
- Añadir iconos con fondos de colores distintivos por categoría (ya existe parcialmente, pero potenciarlo).
- Incluir una micro-ilustración o badge de "Nuevo" en secciones con contenido fresco (ej. si el formato 2026 fue actualizado recientemente).

---

## 4. Performance & SEO Técnico

### 4.1. Migrar `<img>` a `<Image>` de Next.js
**Archivos a tocar:**
- `AppScreenshotsSection.tsx` (5 imágenes)
- `CreatorsSection.tsx` (8 avatares)
- `HeroSection.tsx` (avatares de social proof)
- `CtaFinalSection.tsx` (imagen del balón dorado)

**Tareas:**
- Reemplazar `<img>` por `next/image` con `width`/`height` explícitos o `fill` + `sizes`.
- Aprovechar lazy loading automático en imágenes below-the-fold.
- Añadir `alt` descriptivos en todas (evitar `alt=""` en imágenes informativas).

### 4.2. Extraer metadata de `page.tsx`
**Problema:** `src/app/page.tsx` es `"use client"`, por lo que no puede exportar `metadata`.

**Solución:**
- Convertir `page.tsx` en Server Component.
- Mover la lógica de GSAP y hooks a un wrapper cliente (`HomePageClient.tsx`) importado dentro de `page.tsx`.
- Exportar desde `page.tsx`:
  ```ts
  export const metadata = {
    title: 'ZonaMundial — Vive el Mundial 2026 como nunca',
    description: '...',
    openGraph: { images: ['/og-image.jpg'] },
  };
  ```
- Crear JSON-LD para `SportsEvent` o `WebSite` con datos del Mundial 2026.

### 4.3. Reducir carga de partículas en móvil
**Problema:** `GoldParticles` puede consumir mucha GPU en dispositivos de gama baja.

**Solución:**
- Detectar `prefers-reduced-motion` o `matchMedia('(pointer: coarse)')`.
- En móviles, reducir la cantidad de partículas a la mitad o desactivarlas si el frame rate baja.

### 4.4. Code-split de GSAP y plugins
**Problema:** Todo GSAP se carga de golpe, posiblemente incluso plugins no usados en la home.

**Solución:**
- Usar dynamic imports para plugins pesados (ScrollTrigger, etc.) si no son críticos en el primer paint.
- Verificar tree-shaking de `gsap`.

---

## 5. Mejoras de Contenido (Copy + Estructura)

### 5.1. Unificar CTAs para no dispersar al usuario
**Problema:** Hay demasiados CTAs distintos en la misma página ("/registro", "/selecciones", "/la-app", "/creadores", waitlist).

**Solución:**
- Definir **1 CTA primario** (`/registro`) y el resto como CTAs secundarios/terciarios.
- Destacar visualmente el primario con el botón dorado; los demás como links de texto o outlined buttons.

### 5.2. Sección de "¿Cómo funciona?" (3 pasos)
**Propuesta:** Insertar una sección ligera después del hero o antes del bento grid con 3 pasos simples:
1. Elige tu selección.
2. Juega predicciones y fantasy.
3. Gana premios y vive el Mundial.

Esto reduce fricción para usuarios que llegan sin entender el producto.

### 5.3. Actualizar el ticker de garantías
**Problema:** El `SaulTicker` actual (`GRATIS · 100% LEGAL · SIN SPAM`) es correcto pero puede perderse visualmente.

**Solución:**
- Aumentar ligeramente el tamaño de fuente en desktop.
- Añadir iconos de check (✓) antes de cada claim para reforzar confianza.

---

## 6. Roadmap de implementación priorizado

### Fase 1 — Quick Wins (1-2 días)
- [ ] Arreglar `MagneticButton`: semántica `<a>` y refactorear ripple sin `document.createElement`.
- [ ] Migrar `<img>` a `next/image` en screenshots, creators y hero avatares.
- [ ] Convertir `page.tsx` a Server Component con metadata y JSON-LD; mover lógica cliente a `HomePageClient.tsx`.
- [ ] Subir contraste de textos `text-gray-500/600` a `text-gray-400`.
- [ ] Agregar `prefers-reduced-motion` al `CarouselRows`.

### Fase 2 — Funcionalidad Core (2-3 días)
- [ ] Conectar `/api/waitlist` con base de datos real (Supabase/Prisma/Airtable).
- [ ] Exponer `/api/waitlist/count` y consumirlo dinámicamente en `AppBannerSection`.
- [ ] Optimizar video del hero: poster, formatos alternativos, fallback móvil.
- [ ] Pausar carruseles en hover y detectar dispositivo táctil.

### Fase 3 — Experiencia Premium (2-3 días)
- [ ] Añadir `ScrollIndicator` en el hero.
- [ ] Implementar reveal con `stagger` en grids (creators, explore, screenshots).
- [ ] Añadir progress bar dorada en scroll.
- [ ] Reducir partículas en móvil según capacidad del dispositivo.
- [ ] Insertar sección "¿Cómo funciona?" de 3 pasos.

### Fase 4 — Copy refinado + QA
- [ ] Aplicar/el revisar copy agresivo de `PROPUESTA_HOME_SAL.md` en todas las secciones.
- [ ] Unificar jerarquía de CTAs (1 primario, resto secundarios).
- [ ] Lighthouse audit: buscar ≥ 90 en Performance, Accessibility, Best Practices, SEO.
- [ ] `next build` sin errores y verificación de tipos (`tsc --noEmit`).

---

## 7. Métricas de éxito

| Métrica | Meta |
|---------|------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Waitlist capturas reales / semana | +50% vs. período anterior |
| Tiempo de carga LCP | < 2.5s |
| Tasa de rebote (scroll hasta Stats) | Mejora del 20% |

---

*Documento generado para ZonaMundial — 2026-04-12*
