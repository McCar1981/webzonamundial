# Fase 0 — Detalle exhaustivo de errores

**Fecha:** 2026-06-08 · **Complemento de:** [fase-00-cimientos.md](fase-00-cimientos.md)

Este documento lista **cada error** detectado en la Fase 0, con archivo, línea y regla, para poder
corregirlos uno a uno. Incluye: (A) error de build, (B) los 57 errores de lint, (C) los 177
warnings agrupados por archivo.

---

## A. Errores de build (`npm run build` → exit 1)

Dos páginas fallan al prerenderizar porque ejecutan `@vercel/kv` en build-time sin las variables
`KV_REST_API_URL` / `KV_REST_API_TOKEN`. Causa: declaran `revalidate = 60` (ISR) en vez de render dinámico.

| # | Ruta | Archivo | Error |
|---|------|---------|-------|
| 1 | `/admin/founders` | `src/app/admin/founders/page.tsx` | `@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN` (digest `3797808913`) |
| 2 | `/admin/module-interest` | `src/app/admin/module-interest/page.tsx` | mismo error de KV en prerender |

**Traza relevante:**
```
Error occurred prerendering page "/admin/module-interest".
Error occurred prerendering page "/admin/founders".
Error: @vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN
    at Object.get (.next/server/chunks/5898.js:1:70407)
Export encountered errors on following paths:
	/admin/founders/page
	/admin/module-interest/page
```
→ Ver hallazgo **H-000-01** (P0). Fix: `export const dynamic = "force-dynamic"`.

---

## B. Errores de lint (`npm run lint` → 57 errores)

### B.1 — Resumen por regla

| Regla | Errores | Naturaleza |
|-------|---------|-----------|
| `react/jsx-no-comment-textnodes` | 33 | Comentario `//` suelto dentro de JSX; debe ir en `{/* */}` |
| `react/no-unescaped-entities` | 22 | Comillas `"` / `'` sin escapar en texto JSX |
| `react-hooks/rules-of-hooks` | 1 | **Bug**: hook tras early-return |
| `@typescript-eslint/no-explicit-any` | 1 | Regla referida en un `eslint-disable` pero no cargada (config) |
| **Total** | **57** | |

### B.2 — El bug funcional (P1)

| Archivo:línea | Regla | Mensaje |
|---------------|-------|---------|
| `src/components/biblia/DeepTabs.tsx:44:31` | `react-hooks/rules-of-hooks` | `useState` llamado condicionalmente (tras `return null` en línea 40) |

### B.3 — Anomalía de configuración (P2)

| Archivo:línea | Regla | Mensaje |
|---------------|-------|---------|
| `src/components/CookieConsent.tsx:59:3` | `@typescript-eslint/no-explicit-any` | "Definition for rule '@typescript-eslint/no-explicit-any' was not found" — hay un `// eslint-disable-next-line @typescript-eslint/no-explicit-any` pero el plugin TS-ESLint no está en la config (`.eslintrc.json` solo extiende `next/core-web-vitals`). El disable apunta a una regla inexistente. |

### B.4 — `react/jsx-no-comment-textnodes` (33 errores)

| # | Archivo:línea |
|---|---------------|
| 1 | `src/app/api/og/founder/route.tsx:108:12` |
| 2 | `src/app/cuenta/comprar/ComprarPanel.tsx:76:106` |
| 3 | `src/app/cuenta/notificaciones/NotificacionesPanel.tsx:312:106` |
| 4 | `src/app/embed/calendario/page.tsx:111:12` |
| 5 | `src/app/founders/page.tsx:74:12` |
| 6 | `src/app/founders/page.tsx:252:10` |
| 7 | `src/app/not-found.tsx:121:152` |
| 8 | `src/app/press/page.tsx:73:10` |
| 9 | `src/app/selecciones/[slug]/opengraph-image.tsx:162:14` |
| 10 | `src/app/_home/sections/GuiaMundial2026Section.tsx:57:10` |
| 11 | `src/app/_home/sections/GuiaMundial2026Section.tsx:351:151` |
| 12 | `src/components/app-modules/ModuleFAQ.tsx:52:10` |
| 13 | `src/components/app-modules/ModuleFreeVsFounders.tsx:56:8` |
| 14 | `src/components/app-modules/ModuleNotifyCTA.tsx:107:10` |
| 15 | `src/components/app-modules/ModuleNotifyCTA.tsx:176:8` |
| 16 | `src/components/blog/BlogHub.tsx:55:44` |
| 17 | `src/components/bracket/BracketEditorialIntro.tsx:52:10` |
| 18 | `src/components/bracket/BracketEditorialIntro.tsx:249:12` |
| 19 | `src/components/bracket/BracketHUD.tsx:47:46` |
| 20 | `src/components/bracket/CapsuleSealModal.tsx:67:50` |
| 21 | `src/components/bracket/CosmicBracket.tsx:323:52` |
| 22 | `src/components/bracket/CosmicBracket.tsx:333:22` |
| 23 | `src/components/bracket/PhaseCompleteOverlay.tsx:34:54` |
| 24 | `src/components/CreadoresEditorial.tsx:43:10` |
| 25 | `src/components/CreadoresEditorial.tsx:213:12` |
| 26 | `src/components/EditorialBlock.tsx:65:10` |
| 27 | `src/components/EditorialBlock.tsx:124:14` |
| 28 | `src/components/grupos/GrupoEditorial.tsx:53:10` |
| 29 | `src/components/grupos/GrupoEditorial.tsx:116:14` |
| 30 | `src/components/historia/CampeonesEditorial.tsx:43:10` |
| 31 | `src/components/historia/CampeonesEditorial.tsx:224:12` |
| 32 | `src/components/sedes/SedeEditorial.tsx:52:10` |
| 33 | `src/components/sedes/SedeEditorial.tsx:222:12` |

**Fix tipo:** envolver el comentario en llaves → `{/* comentario */}` en lugar de `// comentario` suelto entre tags.

### B.5 — `react/no-unescaped-entities` (22 errores)

| # | Archivo:línea | Carácter |
|---|---------------|----------|
| 1 | `src/app/app/fantasy/jugar/LiveView.tsx:233:98` | `'` |
| 2 | `src/app/cuenta/founders-pass/page.tsx:185:28` | `"` |
| 3 | `src/app/cuenta/founders-pass/page.tsx:185:37` | `"` |
| 4 | `src/app/sobre/page.tsx:111:39` | `'` |
| 5 | `src/app/sobre/page.tsx:181:59` | `"` |
| 6 | `src/app/sobre/page.tsx:181:82` | `"` |
| 7 | `src/app/_home/sections/GuiaMundial2026Section.tsx:246:28` | `"` |
| 8 | `src/app/_home/sections/GuiaMundial2026Section.tsx:246:33` | `"` |
| 9 | `src/components/bracket/BracketEditorialIntro.tsx:192:24` | `"` |
| 10 | `src/components/bracket/BracketEditorialIntro.tsx:192:30` | `"` |
| 11 | `src/components/bracket/BracketEditorialIntro.tsx:204:56` | `"` |
| 12 | `src/components/bracket/BracketEditorialIntro.tsx:205:19` | `"` |
| 13 | `src/components/bracket/BracketEditorialIntro.tsx:258:13` | `"` |
| 14 | `src/components/bracket/BracketEditorialIntro.tsx:258:42` | `"` |
| 15 | `src/components/bracket/BracketEditorialIntro.tsx:258:46` | `"` |
| 16 | `src/components/bracket/BracketEditorialIntro.tsx:259:32` | `"` |
| 17 | `src/components/CreadoresEditorial.tsx:96:33` | `"` |
| 18 | `src/components/CreadoresEditorial.tsx:96:48` | `"` |
| 19 | `src/components/CreadoresEditorial.tsx:103:62` | `"` |
| 20 | `src/components/CreadoresEditorial.tsx:103:68` | `"` |
| 21 | `src/components/historia/CampeonesEditorial.tsx:116:47` | `"` |
| 22 | `src/components/historia/CampeonesEditorial.tsx:116:66` | `"` |

**Fix tipo:** escapar a `&quot;` / `&apos;` (o `&ldquo;`/`&rdquo;`), o mover el texto a una expresión `{"..."}`.

---

## C. Warnings de lint (177, no bloquean build)

### C.1 — Resumen por regla

| Regla | Warnings | Fase donde se aborda |
|-------|----------|----------------------|
| `@next/next/no-img-element` | 168 | Fase 17 (Rendimiento) — migrar a `next/image` |
| `@next/next/no-page-custom-font` | 5 | Fase 17 |
| `react-hooks/exhaustive-deps` | 4 | Revisión por módulo (riesgo de bugs sutiles) |

> Nota: la cuenta de la regla `no-page-custom-font` (5) y `exhaustive-deps` (4) suma con los 168 de
> imágenes = 177. El `no-explicit-any` se contabiliza como error de config (sección B.3).

### C.2 — Archivos con más warnings (top, para priorizar Fase 17)

| Warnings | Archivo |
|----------|---------|
| 9 | `src/app/trivia/TriviaGame.tsx` |
| 8 | `src/app/historia/campeones/CampeonesClient.tsx` |
| 6 | `src/zonamundial-home.jsx` |
| 6 | `src/app/grupos/page.tsx` |
| 5 | `src/app/sedes/[slug]/SedeSlugClient.tsx` |
| 5 | `src/app/herramientas/page.tsx` |
| 5 | `src/app/app/page.tsx` |
| 5 | `src/app/app/fantasy/page.tsx` |
| 5 | `src/app/_home/sections/ModulesBentoSection.tsx` |
| 5 | `src/app/_home/sections/AppScreenshotsSection.tsx` |
| 4 | `src/components/HistoriaTimeline.tsx` |
| 4 | `src/app/sedes/page.tsx` |
| 4 | `src/app/registro/[creador]/RegistroCreadorClient.tsx` |
| 4 | `src/app/historia/momentos-iconicos/MomentosIconicosClient.tsx` |
| 4 | `src/app/historia/momentos-iconicos/[slug]/MomentoSlugClient.tsx` |
| 4 | `src/app/app/modo-carrera/page.tsx` |
| 4 | `src/app/app/matchcenter/MatchCenterLive.tsx` |
| 4 | `src/app/app/fantasy/jugar/PlayerModal.tsx` |

*(El resto de archivos tienen entre 1 y 3 warnings; lista completa disponible vía `npm run lint`.)*

### C.3 — `react-hooks/exhaustive-deps` (4 — revisar, pueden esconder bugs)

Estos warnings indican dependencias de `useEffect`/`useCallback` faltantes y conviene revisarlos
manualmente (no es solo cosmético). Uno conocido:

- `src/zonamundial-home.jsx:301` → `useEffect` con dependencia faltante `'th'`.

*(Los otros 3 se localizan con `npm run lint | grep exhaustive-deps`; se revisarán al auditar cada módulo afectado.)*

---

## Plan de corrección sugerido (orden)

1. **H-000-01 (P0):** `force-dynamic` en `admin/founders` y `admin/module-interest` → desbloquea el build.
2. **H-000-02 (P1):** mover `useState` antes del early-return en `DeepTabs.tsx`.
3. **B.4 + B.5 (P2, 55 errores mecánicos):** envolver comentarios en `{/* */}` y escapar comillas.
   Se pueden hacer en lote por archivo. Tras esto, `npm run lint` queda en 0 errores.
4. **B.3 (P2):** o bien añadir el plugin `@typescript-eslint` a `.eslintrc.json`, o quitar el
   `eslint-disable` huérfano en `CookieConsent.tsx:59`.
5. **Warnings:** diferir a Fase 17 (imágenes/fuentes) y a la auditoría de cada módulo (deps de hooks).
