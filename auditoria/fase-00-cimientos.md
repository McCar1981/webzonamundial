# Fase 0 — Cimientos y configuración

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude
**Alcance:** `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `vercel.json`, `.env.example`, `.eslintrc.json`, `src/middleware.ts`, `scripts/`.

---

## Resumen ejecutivo

El proyecto **tipa limpio** (`tsc --noEmit` sin errores) y la **validación de contenido pasa**
(23 ediciones del Mundial, 0 errores). Sin embargo, **el build de producción falla** y **el lint
tiene 57 errores**, por lo que la Fase 0 **no cumple aún** su criterio de aprobación
(build + lint + types verdes).

Además, `.env.example` está **desactualizado**: faltan ~41 variables que el código sí usa,
incluyendo secretos críticos (`SUPABASE_SERVICE_ROLE_KEY`, claves VAPID, `API_SPORTS_KEY`).

### Veredicto de los gates

| Verificación | Resultado | Detalle |
|--------------|-----------|---------|
| `tsc --noEmit` | ✅ Pasa | 0 errores tras instalar dependencias |
| `npm run validate-content` | ✅ Pasa | 23 archivos, 0 con errores |
| `npm run lint` | ❌ Falla | 57 errores, 177 warnings |
| `npm run build` | ❌ Falla | 2 páginas admin fallan al prerenderizar (KV) |
| `npm audit` | ⚠️ | 34 vulnerabilidades (14 high, 20 moderate) |

> **Nota:** `node_modules` no estaba instalado al inicio. Se ejecutó `npm ci` (1436 paquetes).
> Los errores de tipos iniciales ("Cannot find module 'react'") eran ruido por falta de dependencias.

---

## Hallazgos

### 🔴 H-000-01 (P0) — El build de producción falla: páginas admin prerenderizan datos de KV

**Evidencia:**
```
Error occurred prerendering page "/admin/module-interest"
Error occurred prerendering page "/admin/founders"
Error: @vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN
Export encountered errors on following paths:
	/admin/founders/page
	/admin/module-interest/page
BUILD EXIT: 1
```

**Causa raíz:** ambas páginas declaran `export const revalidate = 60` (ISR), lo que hace que
Next intente **prerenderizarlas en build**. Al hacerlo ejecutan `@vercel/kv`, que requiere
`KV_REST_API_URL`/`KV_REST_API_TOKEN` en build-time.

- `src/app/admin/founders/page.tsx:19` → `export const revalidate = 60;`
- `src/app/admin/module-interest/page.tsx` → lee `getAllModuleCounts()` / `getTotalUsers()` (KV).

**Impacto:** el build rompe sin estas variables. Y aunque estuvieran presentes, **es incorrecto
prerenderizar páginas de admin** con datos en vivo: se hornearía contenido sensible en HTML estático.

**Recomendación:** cambiar ambas páginas a render dinámico:
```ts
export const dynamic = "force-dynamic"; // en vez de revalidate = 60
```
Revisar el resto de `src/app/admin/*` (todas leen datos en vivo) para que ninguna se prerenderice.

---

### 🟠 H-000-02 (P1) — Hook de React llamado condicionalmente (regla de hooks)

**Evidencia (`npm run lint`):**
```
./src/components/biblia/DeepTabs.tsx
44:31  Error: React Hook "useState" is called conditionally. React Hooks must be
       called in the exact same order in every component render. Did you accidentally
       call a React Hook after an early return?  react-hooks/rules-of-hooks
```

**Causa raíz:** `src/components/biblia/DeepTabs.tsx:40` hace `if (total === 0) return null;` y
**después**, en la línea 44, llama `const [active, setActive] = useState(initial);`. Un hook tras
un `return` condicional rompe el orden de hooks y puede causar errores de runtime impredecibles.

**Recomendación:** mover el `useState` por encima del early-return (calcular `total`/`initial`
antes y llamar el hook siempre), o extraer el cuerpo a un subcomponente que se monte solo cuando
`total > 0`.

---

### 🟠 H-000-03 (P1) — `.env.example` desactualizado: faltan ~41 variables (incluye secretos críticos)

**Evidencia:** comparación entre `process.env.*` usados en el código y lo declarado en `.env.example`.

**Variables usadas en código pero ausentes de `.env.example`:**

- **Críticas / secretos:** `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `API_SPORTS_KEY`, `RAPIDAPI_KEY`, `EMAIL_UNSUB_SECRET`,
  `ADMIN_PASSWORD`, `APPLE_CLIENT_ID`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`.
- **Config IA/noticias:** `ANTHROPIC_MODEL_MICRO`, `ANTHROPIC_MODEL_NARRATIVE`,
  `ANTHROPIC_MODEL_NARRATOR`, `ANTHROPIC_MODEL_TRIVIA`, `BLOG_GENERATOR_MODEL`, `MICRO_AI`,
  `BLOG_IMG_TIMEOUT_MS`, y todo el bloque `NEWS_*` (`NEWS_ENRICH`, `NEWS_DAILY_CAP`,
  `NEWS_CRITIC_MIN_*`, `NEWS_BACKFILL_*`, `NEWS_COLD_PER_TICK`, `NEWS_QUERIES_PER_TICK`,
  `NEWS_REWRITE_LIMIT`, `NEWS_ENRICH_*`).
- **Otras:** `CRON_REPORT_EMAIL`, `SUPPORT_EMAIL`, `MC_FIXTURE_MAP`, `WC_LEAGUE_ID`, `WC_SEASON`,
  `NEXT_PUBLIC_ADSENSE_ID`, `NEXT_PUBLIC_APP_AVAILABILITY`, `NODE_TLS_REJECT_UNAUTHORIZED`,
  `NODE_ENV`, `VERCEL_REGION`, `VERCEL_URL`.

**Inversa — declaradas en `.env.example` pero no halladas por grep** (posible muerto o uso dinámico):
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_FOUNDERS_PASS_PRICE_ID` → verificar en Fase 3.

**Impacto:** onboarding de devs y despliegues frágiles; riesgo de que falten secretos en producción
(como acaba de pasar con KV en el build). `SUPABASE_SERVICE_ROLE_KEY` ausente del ejemplo es
especialmente grave porptque es la clave de máximo privilegio.

**Recomendación:** regenerar `.env.example` con TODAS las variables (sin valores reales), agrupadas
por módulo y marcando cuáles son obligatorias vs opcionales.

---

### 🟡 H-000-04 (P2) — 57 errores de lint (no bloquean build pero degradan calidad)

**Desglose por regla (errores + warnings = 234 incidencias):**

| Regla | Conteo | Tipo |
|-------|--------|------|
| `@next/next/no-img-element` | 168 | Warning — usar `next/image` |
| `react/jsx-no-comment-textnodes` | 33 | **Error** — comentarios mal colocados en JSX |
| `react/no-unescaped-entities` | 22 | **Error** — comillas sin escapar |
| `@next/next/no-page-custom-font` | 5 | Warning |
| `react-hooks/exhaustive-deps` | 4 | Warning |
| `@typescript-eslint/no-explicit-any` | 1 | Warning |
| `react-hooks/rules-of-hooks` | 1 | **Error** → ver H-000-02 |

Los 56 errores restantes (aparte del hook) son `jsx-no-comment-textnodes` y `no-unescaped-entities`:
en su mayoría arreglos mecánicos (envolver comentarios en `{/* */}`, escapar comillas). Los 168
`no-img-element` se tratarán a fondo en la **Fase 17 (Rendimiento)**.

**Recomendación:** corregir los 57 errores (mecánicos en su mayoría); catalogar los 177 warnings
para fases específicas (imágenes → Fase 17, deps de hooks → revisión por módulo).

---

### 🟡 H-000-05 (P2) — 34 vulnerabilidades de dependencias (14 high)

**Evidencia (`npm audit`):** `{"high":14,"moderate":20}`.

Paquetes afectados notables: **`next`**, `postcss`, `dompurify`, `follow-redirects`, `prismjs`,
`ws`, `vite`, y toda la cadena de `sanity`/`@sanity/*`. Muchas provienen del subárbol de Sanity
Studio (dev/CMS) más que del runtime de la app.

**Recomendación:** ejecutar `npm audit` detallado, priorizar las que afectan runtime (`next`,
`postcss`, `follow-redirects`, `dompurify`), evaluar `npm audit fix` y bumps de `next`/Sanity.
Cruzar con Fase 1 (seguridad).

---

### 🟡 H-000-06 (P2) — `NODE_TLS_REJECT_UNAUTHORIZED = "0"` en scripts de ingesta de imágenes

**Evidencia:**
```
scripts/fetch-commons-images.cjs:42:  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
scripts/fetch-stadium-images.cjs:27:  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
```

**Impacto:** desactiva la verificación de certificados TLS. Está **solo en scripts de tooling**
(no en el runtime de la app), por lo que el riesgo es acotado, pero sigue siendo una mala práctica
(MITM en la descarga de imágenes).

**Recomendación:** eliminar la línea y, si hay un host con cert problemático, fijar el CA correcto
en lugar de desactivar la verificación global.

---

### 🟢 H-000-07 (P3) — `strict: false` en TypeScript

`tsconfig.json` tiene `"strict": false`. Tipa limpio, pero se pierde gran parte de la red de
seguridad de tipos (null-checks, etc.). No bloquea; recomendable plan de migración gradual a
`strict: true` (no urgente).

---

## Aspectos correctos (verificados)

- ✅ `tsc --noEmit` sin errores.
- ✅ `npm run validate-content` (prebuild) pasa: 23 ediciones del Mundial válidas.
- ✅ `.gitignore` excluye `.env*`, `node_modules`, y los JSON de datos sensibles (`registros.json`,
  `waitlist.json`). No se detectan secretos commiteados en el árbol auditado.
- ✅ `next.config.js` **sí define cabeceras de seguridad**: `Strict-Transport-Security`,
  `X-Frame-Options: DENY`, `Content-Security-Policy`. (Revisión detallada del CSP → Fase 1.)
- ✅ `vercel.json` define 14 crons con rutas coherentes (se auditan a fondo en Fase 16).

---

## Acciones para cerrar la Fase 0

| # | Acción | Hallazgo | Prioridad |
|---|--------|----------|-----------|
| 1 | `force-dynamic` en páginas admin que leen KV (y revisar todo `app/admin/*`) | H-000-01 | P0 |
| 2 | Arreglar hook condicional en `DeepTabs.tsx` | H-000-02 | P1 |
| 3 | Regenerar `.env.example` completo y agrupado | H-000-03 | P1 |
| 4 | Corregir 57 errores de lint (mecánicos) | H-000-04 | P2 |
| 5 | Triage de `npm audit` (priorizar runtime) | H-000-05 | P2 |
| 6 | Quitar `NODE_TLS_REJECT_UNAUTHORIZED=0` de scripts | H-000-06 | P2 |

**Criterio de cierre:** tras las acciones 1–3, `npm run build` y `npm run lint` deben terminar en
verde; entonces la Fase 0 pasa a ✅.

---

## Registro de hallazgos

| ID | Severidad | Archivo | Estado |
|----|-----------|---------|--------|
| H-000-01 | P0 | `src/app/admin/{founders,module-interest}/page.tsx` | Abierto |
| H-000-02 | P1 | `src/components/biblia/DeepTabs.tsx:44` | Abierto |
| H-000-03 | P1 | `.env.example` | Abierto |
| H-000-04 | P2 | (57 archivos, ver lint) | Abierto |
| H-000-05 | P2 | `package-lock.json` (deps) | Abierto |
| H-000-06 | P2 | `scripts/fetch-*-images.cjs` | Abierto |
| H-000-07 | P3 | `tsconfig.json` | Abierto |
