# Propuesta de Rediseño: ZonaMundial Homepage
## "Better Call Zona" — Una landing imparable

---

## 1. Visión Creativa

**El problema:** La home actual es premium, pero genérica. Parece el *template* de una fintech dark-mode más que la entrada a la experiencia definitiva del Mundial 2026.

**La solución:** Aplicar una dosis de marketing "Saul Goodman": confianza extrema, alto contraste, garantías dramáticas, frases pegajosas y movimiento persuasivo. ZonaMundial no es "una app más". Es la **única** forma aceptable de vivir el Mundial 2026.

**Pivot de marca:** De *luxury sports-tech* a **unapologetically confident entertainment**.

---

## 2. Tono y Voz

- **Sin pasiva:** Nunca "se puede disfrutar". Siempre "tú disfrutas".
- **Sin verbos débiles:** Nada de "conocer", "explorar", "ver". Usamos "dominar", "ganar", "reclamar", "vivir".
- **Garantía final:** Casi cada bloque termina con un micro-mensaje de seguridad o gratuidad.
- **Nombre propio como mantra:** "ZonaMundial" aparece en los momentos de cierre.

---

## 3. Transformación de Copy por Sección

### Hero
| Antes (ES) | Después (ES) |
|------------|--------------|
| Vive el Mundial / como nunca antes | **El Mundial 2026 te necesita.** / **¿Vas a dejar que otro lo viva por ti?** |
| Pre-regístrate gratis | **Reserva tu plaza ahora →** |
| Explorar selecciones → | **Ver los 48 equipos →** |

| Antes (EN) | Después (EN) |
|------------|--------------|
| Experience the World Cup / like never before | **The 2026 World Cup needs you.** / **Are you letting someone else live it for you?** |
| Pre-register free | **Claim your spot now →** |
| Explore teams → | **See all 48 teams →** |

### Stats Bar
- **ES:** **48 selecciones. 16 sedes. 104 partidos. 1 ganador: tú.**
- **EN:** **48 teams. 16 venues. 104 matches. 1 winner: you.**

### App Screenshots (Bento Grid)
- **ES:** **Esto no es una app. Es un arma cargada de fútbol.**
- **EN:** **This isn't an app. It's a football weapon.**

### ¿Por qué ZonaMundial?
- **ES:** **¿Por qué ZonaMundial? Porque el resto se queda corto.**
- **EN:** **Why ZonaMundial? Because the rest fall short.**

### Features Carousel
- **ES:** **12 formas de ganar. Elige la tuya.**
- **EN:** **12 ways to win. Pick yours.**

### Creadores
- **ES:** **Respaldado por los que realmente entienden de fútbol.** / **+12.3M de seguidores. Una sola app. Tú eliges con quién vivirlo.**
- **EN:** **Backed by people who actually understand football.** / **12.3M followers. One app. You pick who to watch it with.**

### Explora
- **ES:** **No hay nada escondido. Todo está aquí.**
- **EN:** **Nothing's hidden. It's all right here.**

### CTA Final
- **ES:** **¿Quién ganará el Mundial 2026? Spoiler: da igual. Gana quien lo viva en ZonaMundial.** / **Entra gratis. Si no te gusta, te devolvemos el silencio.**
- **EN:** **Who will win the 2026 World Cup? Spoiler: doesn't matter. Whoever lives it on ZonaMundial wins.** / **Get in free. Don't like it? We'll refund your silence.**

---

## 4. Upgrades Visuales

### Paleta expandida

| Token | Hex | Uso |
|-------|-----|-----|
| `ACCENT_ORANGE` | `#ff6b35` | CTAs urgentes, badges de garantía, micro-headlines |
| `ACCENT_RED` | `#e63946` | Pulsos "live", countdown dramático, highlights |
| `LAW_WHITE` | `#f8f9fa` | Texto de alto contraste sobre oscuro |
| `GOLD_GLOW` | `#c9a84c` | Oro base, ahora con sombras más potentes |

### Tratamientos tipográficos
- **Hero title:** `text-6xl lg:text-8xl`, `font-black`, `tracking-tighter`, `leading-[0.95]`.
- **Keywords:** Gradiente `from-[#C9A84C] via-[#E8D48B] to-[#ff6b35]` con `bg-clip-text`.
- **Badges de garantía:** Pills uppercase, `tracking-widest`, borde izquierdo naranja.
- **Subtítulos de sección:** `text-xl`, gris claro con spans naranja estratégicos.

### Nuevos patrones
1. **Bordes dashed-deal:** Marco dashed grueso alrededor de CTAs y tarjetas destacadas, evocando contratos urgentes.
2. **Spotlight beams:** Gradientes radiales gigantes detrás de cada sección clave para guiar la mirada.
3. **Ticker tape:** Banner rápido de garantías debajo del hero (`GRATIS · 100% LEGAL · SIN SPAM`).
4. **Confetti CTA:** Estallido de partículas doradas desde el botón magnético al hacer hover.

---

## 5. Plan de Componentes y Animaciones

| Asset existente | Estado | Upgrade planeado |
|-----------------|--------|------------------|
| `GoldParticles` | Sutil | Aumentar densidad y velocidad **solo en hero** |
| `LuxuryCursor` | No usado en home | **Activar en home** — anillo dorado que crece sobre CTAs |
| `FloatingElements` | Hero | Añadir formas naranjas y reacción al scroll |
| `LuxuryTextReveal` | No usado | **Aplicar a todos los H2 principales** |
| `ParallaxImage` | No usada | **Usar en CTA final** sobre la imagen de estadio |
| `ShimmerCard` | No usada | **Envolver screenshots bento** y tarjetas de garantía |
| `RippleButton` | No usado directo | **Fusionar ripple en `MagneticButton`** |
| `AnimatedCounter` | Estático | **Implementar contador GSAP real** |
| `CarouselRows` | Genérico | **Edge fades, labels de fila, velocidad agresiva** |

### Nuevos componentes a crear
- **`GuaranteesBar`**: Barra negra con 4 pills de garantía.
- **`SocialProofTicker`**: Marquee rápido de testimonios de usuarios.
- **`WaitlistSection`** (reemplaza `AppBannerSection`): Formulario de email funcional con contador social.

---

## 6. Reestructura de Secciones

### Eliminaciones
- **Ambos `AdSpace` banners genéricos** → eliminados. Rompen el ritmo premium.
- **`AppBannerSection` con botones disabled** → rediseñado a **Waitlist funcional**.

### Nueva secuencia propuesta
1. **Hero** — Video logo, countdown dramático, ticker tape de garantías.
2. **Stats Bar** — 6 contadores animados, copy de ganador.
3. **App Screenshots** — Bento grid envuelto en shimmer, copy agresivo.
4. **Why Different** — Manifesto con `LuxuryTextReveal` y bordes dashed.
5. **Features Carousel** — 12 módulos con labels y velocidad de pitch.
6. **GuaranteesBar** — 4 pills de confianza (reemplaza AdSpace 1).
7. **Creators** — Grid de 8 creadores con nuevo copy y glow.
8. **SocialProofTicker** — Marquee de testimonios (reemplaza AdSpace 2).
9. **Explore** — 6 tiles de descubrimiento, refresh visual.
10. **Waitlist** — Early access funcional con email + counter.
11. **CTA Final** — Estadio con `ParallaxImage`, balón dorado flotante, cierre dramático.

---

## 7. Roadmap de Implementación

1. **Foundation**
   - Colores nuevos en `constants.ts`.
   - `AnimatedCounter` con GSAP real.
   - `MagneticButton` con ripple integrado.

2. **Nuevos bloques**
   - `GuaranteesBar.tsx`
   - `SocialProofTicker.tsx`
   - `WaitlistSection.tsx`

3. **Top funnel**
   - `HeroSection.tsx` (copy + ticker + partículas potentes)
   - `StatsSection.tsx`

4. **Middle funnel**
   - `AppScreenshotsSection.tsx` + `ShimmerCard`
   - `WhyDifferentSection.tsx` + `LuxuryTextReveal`
   - `FeaturesCarouselSection.tsx` + labels + motion

5. **Social proof & explore**
   - `CreatorsSection.tsx`
   - Insertar `GuaranteesBar`
   - `ExploreSection.tsx`

6. **Bottom funnel**
   - `CtaFinalSection.tsx` + `ParallaxImage`
   - Insertar `SocialProofTicker`
   - Reemplazar `AppBannerSection` por `WaitlistSection`

7. **Traducciones & QA**
   - Actualizar `src/i18n/translations.ts` (ES + EN).
   - Typecheck (`tsc --noEmit`).
   - Build (`next build`).
   - Verificar `prefers-reduced-motion`.

---

## 8. Criterios de Aceptación

- [ ] Ningún `AdSpace` genérico permanece en la página.
- [ ] `AppBannerSection` es ahora una sección de lista de espera funcional.
- [ ] `AnimatedCounter` cuenta hacia arriba con GSAP al hacer scroll.
- [ ] Al menos 3 secciones usan `LuxuryTextReveal` o efecto de entrada dramático.
- [ ] El copy nuevo está presente en español e inglés.
- [ ] `next build` completa sin errores.

---

*Propuesta generada para ZonaMundial.*
*Estilo: Better Call Zona.*
