# Lighthouse Audit — zonamundial.app

**Fecha:** 2026-04-23
**URL auditada:** https://zonamundial.app (redirige a https://www.zonamundial.app)
**Estado del código auditado:** Solo PRs #1 y #2 mergeados. PR #3 (optimización Pexels → WebP local) aún NO desplegado.

---

## Scores

| Categoría | Desktop | Mobile |
|---|---|---|
| **SEO** | **100/100** ✅ | **100/100** ✅ |
| **Best Practices** | **96/100** ✅ | **96/100** ✅ |
| **Accessibility** | **94/100** ✅ | 89/100 ⚠️ |
| **Performance** | 75/100 ⚠️ | **44/100** ❌ |

---

## Core Web Vitals

| Métrica | Target | Desktop | Mobile |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | 1.8s ✅ | **16.0s** ❌ |
| **FCP** (First Contentful Paint) | < 1.8s | 1.6s ✅ | 2.7s ⚠️ |
| **TBT** (Total Blocking Time) | < 200ms | 110ms ✅ | 590ms ⚠️ |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.074 ✅ | 0.095 ✅ |
| **Speed Index** | < 3.4s | 4.7s ⚠️ | 12.9s ❌ |
| **TTI** (Time to Interactive) | < 3.8s | 5.6s ⚠️ | 28.8s ❌ |

---

## Análisis

### Victorias contundentes

1. **SEO 100/100 en mobile y desktop** — metadata, sitemap, robots, canonical, hreflang, structured data = todo OK tras PRs #1 y #2.
2. **Best Practices 96/100** — seguridad y headers bien configurados.
3. **Desktop LCP 1.8s ✅** — hero carga rápido en desktop.
4. **CLS perfecto** (0.074 / 0.095) — sin saltos de layout.

### Problemas reales (mobile)

**LCP mobile 16 s es crítico.** Causas identificadas:

1. **Hero image desde Pexels CDN** (226 KB) — _se arregla con PR #3 (ya pushed, falta merge): migración a WebP local de 145 KB._ Impacto estimado: LCP mobile bajará de ~16s a ~3-5s.
2. **Redirect chain** `zonamundial.app` → `www.zonamundial.app` (+379 ms). _Fix: configurar canonical en Vercel para no redirigir._
3. **Main-thread work alto** (GSAP animaciones pesadas en home) — optimización future.
4. **Legacy JavaScript** — Next.js 14 ya tree-shakes bien, pero Sanity Studio está en el bundle. _Fix: route group para aislar /studio._

### Accesibilidad 89 mobile

- Color contrast insuficiente en algún elemento
- Heading order no-secuencial en algún bloque (arreglable tras auditoría manual de home)

---

## Plan de mejora priorizado

| # | Acción | Esperado | Efecto |
|---|---|---|---|
| 1 | **Mergear PR #3** (ya pushed) — Pexels → WebP local | LCP mobile 16s → 4-5s | Crítico |
| 2 | Fix redirect www.zonamundial.app → zonamundial.app (o al revés) — una sola fuente | −400 ms | Alto |
| 3 | Revisar color-contrast en componentes (auditoría manual en DevTools) | Accessibility 89 → 95+ | Alto |
| 4 | Lazy-load Sanity Studio bundle (ya es dynamic pero hay trazas en shared JS) | TBT −200 ms | Medio |
| 5 | Reducir animaciones GSAP en viewport inicial | Main-thread, TBT | Medio |
| 6 | Re-ejecutar Lighthouse tras PR #3 merged + comparar | Nuevos baseline | — |

---

## Comparativa esperada tras mergear PR #3

| | Antes (hoy) | Tras PR #3 (estimado) |
|---|---|---|
| LCP mobile | 16.0s | **3-5s** |
| Performance mobile | 44 | **75-85** |
| Perf desktop | 75 | **85-95** |

---

## Ficheros

- Desktop HTML: `docs/seo/lighthouse-2026-04-23.report.html`
- Desktop JSON: `docs/seo/lighthouse-2026-04-23.report.json`
- Mobile HTML: `docs/seo/lighthouse-2026-04-23-mobile.report.html`
- Mobile JSON: `docs/seo/lighthouse-2026-04-23-mobile.report.json`

Abrir el HTML en navegador para explorar detalles de cada categoría.
