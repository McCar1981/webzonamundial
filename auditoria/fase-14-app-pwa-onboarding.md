# Fase 14 — App PWA (`/app`) y onboarding

**Estado:** 🟥 Hallazgos abiertos (2 P1; sin P0)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías en paralelo)
**Alcance:** `app/app` (shell: `layout.tsx`, `page.tsx`), `app/onboarding` (page, actions, wizard, layout),
`app/la-app`, `app/descarga`, `components/app-modules/*`, `lib/apple/verify-notification.ts`,
`lib/pasedt/entitlement.ts`, `public/manifest.json`, `public/sw.js`, `lib/push-client.ts`, `api/app/redirect`.
(Los módulos internos `/app/{predicciones,fantasy,trivia,...}` se auditaron en Fases 6–8.)

---

## Resumen ejecutivo

El shell de `/app` (hub) y el onboarding **funcionan y degradan limpio**; la integración con Apple y el sistema de
entitlement están **bien construidos**. Los problemas son de **PWA incompleta** y de **promesas comerciales no
respaldadas**:

1. **La PWA no es instalable por el camino normal** (H-014-01, P1): el Service Worker **solo se registra cuando el
   usuario activa las notificaciones push** (`ensureServiceWorker` se llama desde `subscribeToPush`/`setMatchFollow`,
   nunca al cargar). Sin SW registrado, Chrome/Android **no dispara `beforeinstallprompt`** → el botón "Instalar" del
   hub y de `/descarga` no aparece para quien no haya activado push antes. El núcleo de "app instalable" queda roto
   por defecto.
2. **Beneficios de pago anunciados pero no aplicados** (H-014-02, P1 — consumo): las tablas "Gratis vs Founders" de
   ~12 módulos (`app-modules-content.ts`) prometen ventajas concretas (sin anuncios, stats avanzadas, "10 consultas
   IA/día gratis · ilimitadas con Founders", "retraso máx. 30s", "2.000+ preguntas"...) **sin capa de enforcement**
   (solo Modo Carrera gatea de verdad, vía `isPaseDT`), mientras el **Founders Pass ya se vende por Stripe**. Riesgo
   de cobrar por ventajas no entregadas.

El resto son P2/P3 de robustez (offline, onboarding no reanudable, a11y de formulario, open-redirect `//`, restos de
un plan de "app nativa") y un punto **positivo** notable: **`/la-app` y `/descarga` son honestas** (PWA real, sin
insignias de tienda ni cifras de descargas/valoraciones falsas).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 2 |
| **P2** | 7 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| PWA: manifest, service worker, instalación y offline básico | ⚠️ Manifest e iconos OK; **instalación rota por SW lazy** (H-014-01); **sin offline** (H-014-03) |
| Navegación entre módulos de `/app` consistente; estados carga/error | ✅ Hub degrada limpio; ⚠️ módulos placeholder marcados "Disponible" (H-014-06) |
| Onboarding completo y reanudable; deep links funcionan | ⚠️ Completo pero **no reanudable** (H-014-04); deep link `next` same-origin salvo bypass `//` (H-014-05) |
| Responsive y gestos móviles correctos | ✅ (no se detectaron roturas; revisión fina en Fase 17/18) |

---

## A. Hallazgos nuevos

### 🔴 H-014-01 (P1) — La PWA no es instalable por el camino normal (Service Worker registrado solo al activar push)

`lib/push-client.ts:31-37`: `ensureServiceWorker()` es el **único** punto que registra `/sw.js`, y solo se invoca
desde `subscribeToPush()` (`:96`) y `setMatchFollow()`. No hay registro global del SW al cargar la app
(grep en `src`: única referencia a `serviceWorker.register` está en `push-client.ts`).

Consecuencia: hasta que el usuario **activa las notificaciones**, no hay SW registrado → Chrome/Android **no
dispara `beforeinstallprompt`**. El botón "Instalar" del hub está gateado por ese evento
(`app/app/page.tsx:410-423,661`) y el de `/descarga` (InstallPWAButton) también → **no aparece** para el usuario
medio. El `sw.js` tiene un handler `fetch` no-op precisamente "para que Chrome considere la app instalable"
(`sw.js:24-30`), pero ese requisito no se cumple si el SW nunca se registra.

**Recomendación:** registrar el SW en el arranque (un pequeño componente cliente en el layout raíz o en
`/app/layout`), independiente de la activación de push.

### 🔴 H-014-02 (P1 — protección al consumidor) — Beneficios "Founders" anunciados en ~12 módulos pero no aplicados

Las tablas "Gratis vs Founders" y FAQs (`src/data/app-modules-content.ts`, renderizadas por
`ModuleFreeVsFounders`/`ModuleFAQ`/`ModuleLandingExtras` en las 12 landings de módulo) prometen ventajas concretas:
- "10 consultas IA/día gratis, ilimitadas con Founders" (`:117`), "Match Center retraso máx. 30s" (`:173`),
  "2.000+ preguntas" (`:147`), sin anuncios / stats avanzadas, etc.

Pero **no existe capa de enforcement** para esas ventajas: solo **Modo Carrera** gatea realmente (vía `isPaseDT`,
ver Fase 14 §C). Y el **Founders Pass ya es comprable por Stripe** (`founders/store.ts` con registro de ingresos).
→ Se cobran beneficios cuyo cumplimiento no está implementado.

**Recomendación:** antes de vender, implementar el gating por módulo o ajustar las tablas a lo realmente entregado.
(Cruza con Fase 3 pagos y el tema de transparencia/promesas de fases 7/8.)

### 🟡 H-014-03 (P2) — Sin soporte offline (la PWA no cachea nada)

`public/sw.js:28-30`: el handler `fetch` es **no-op** (sin `respondWith`, sin caché). No hay app-shell cacheado ni
página offline. La PWA se instala pero **no funciona sin red**. El criterio pedía "offline básico".

### 🟡 H-014-04 (P2) — Onboarding no reanudable + validación de listas solo en UI

`OnboardingWizard.tsx:57`: todas las respuestas viven en `useState`; **sin `localStorage` ni borrador en servidor**
→ recargar/salir a mitad **descarta todo** y vuelve al paso 1 (el criterio pedía "reanudable"). Además
`country`/`fav_team`/`fav_creator` no se revalidan contra las listas (en UI vienen de selects, pero ni el wizard ni
la acción server comprueban pertenencia → un FormData manipulado se acepta). El flujo es corto y siempre tiene
"Saltar", así que el impacto es leve.

### 🟡 H-014-05 (P2 — seguridad) — `next` permite redirección protocol-relative en el cierre del onboarding

`OnboardingWizard.tsx:51-52`: `finishDestination = next.startsWith("/") ? next : "/"` acepta `//evil.com`, y el éxito
de `completeOnboardingAction` navega con **`router.push(finishDestination)` en cliente** (`:96`), sin la guarda
server. `skipOnboardingAction` sí valida same-origin. **Recomendación:** `startsWith("/") && !startsWith("//")`.

### 🟡 H-014-06 (P2 — transparencia) — El hub marca módulos placeholder como "Disponible"

`app/app/page.tsx:136-159`: Stories, Zona Streaming, Chat por liga y Ligas privadas aparecen con badge
**"Disponible"**, pero la Fase 7 los clasificó como **maquetas/placeholder** (H-007-05). El usuario entra esperando
función real. (El propio `app/layout.tsx:9-13` reconoce que varios `/app/*` son "visual mockups".)

### 🟡 H-014-07 (P2 — a11y) — Formulario de onboarding sin labels asociadas ni errores anunciados

`OnboardingWizard.tsx`: los `<label>` no tienen `htmlFor` y los inputs no tienen `id`/`aria-labelledby` (`:248,260,
339,385`); el banner de error es un `<div>` sin `role="alert"`/`aria-live` (`:154-158`). (Detalle fino en Fase 18,
pero se registra aquí.)

### 🟡 H-014-08 (P2) — FAQ JSON-LD para funciones aún no vivas + inyección sin escapar `</script>`

`ModuleFAQ.tsx:35-37`: emite `FAQPage` JSON-LD vía `dangerouslySetInnerHTML` para módulos que en su mayoría no están
operativos → riesgo de política de rich-results de Google (schema de producto inexistente). Además `JSON.stringify`
no escapa `</script>` (latente: el contenido es estático y hoy seguro). (Cruza con Fase 15 SEO.)

### 🟡 H-014-09 (P2) — Restos de un plan de "app nativa" que contradicen la realidad PWA

`descarga/page.tsx:5-11,46-57` y `api/app/redirect/route.ts`: los comentarios describen un "smart link" que redirige
iPhone→App Store / Android→Google Play y hablan de "cambiar 2 constantes cuando salgan las URLs reales", pero la ruta
**manda todas las plataformas a `/descarga`** y no existen tales constantes. Relicto que confunde al mantenedor (sin
impacto al usuario). Encaja con el tema "framing de app nativa inexistente".

### Hallazgos P3 (menores)
- **`pushsubscriptionchange` → `/api/notifications/push/resubscribe`** (`sw.js:111-139`): camino real que pierde
  `userId`+`kinds` al rotar (confirma **H-012-05**).
- **`manifest.json` `theme_color:#0b0b0f`** vs navy real `#0a1729` del hub (cosmético); sin campo `id`.
- **Apple S2S `maxTokenAge:"30 days"`** muy laxo (`verify-notification.ts:94`); mitigado por dedup `jti`.
- **Contador de ingresos founders mezcla EUR+USD** (`founders/store.ts:111-113`) — analítica, no seguridad.
- **Promesas con fecha** en landings ("los 9 creators antes del 11 de junio", `app-modules-content.ts:256`) —
  inminente/incumplida a fecha 2026-06-08.
- **Hub = client component de ~1.000 líneas** con estilos inline → JS pesado al cliente (cruce Fase 17).
- **Icono de push `=/img/email/logo-zonamundial.png`** (logo de email, no de app) en `sw.js:52`.

---

## B. Re-confirmaciones (no se recuentan en esta fase)

| Patrón | ID original | Detalle nuevo en Fase 14 |
|--------|-------------|---------------------------|
| `birth_date` sin validar / sin age-gate | **H-002-03** | El **onboarding** es el punto de entrada: `actions.ts:50` guarda raw; el wizard solo bloquea fechas futuras y el campo es opcional, pese a la etiqueta "para premios con restricción de edad" |
| `resubscribe` pierde `userId`+`kinds` | **H-012-05** | El SW (`pushsubscriptionchange`) es el llamador real |
| Módulos placeholder presentados como reales | **H-007-05** | El hub los marca "Disponible" (H-014-06) |
| Username uniqueness por catch de error de DB | **Fase 2 (pendiente constraint)** | Confirmado en `actions.ts:66`; requiere `UNIQUE(profiles.username)` |

---

## C. Aspectos correctos verificados (no regresar)

- ✅ **Apple Sign in — Server-to-Server Notifications** (`lib/apple/verify-notification.ts`): verificación
  **criptográfica real** con `jose` (`createRemoteJWKSet` contra JWKS de Apple, `jwtVerify` con `iss`/`aud`
  fijados), idempotencia por `jti`. No spoofeable. **Bien hecho** y **wired** (`api/auth/apple/notifications`).
- ✅ **Entitlement "Pase DT"** (`lib/pasedt/entitlement.ts`): server-side, email desde sesión (no del cliente),
  fail-closed ante error de KV, re-checado en las rutas de coste (narrativa/refill). Tamper-resistant. **Wired.**
- ✅ **`ModuleNotifyCTA`**: usa el endpoint real `/api/notify-module/[slug]` y muestra el **conteo real** (sin cifra
  falsa).
- ✅ **`/la-app` y `/descarga` honestas**: PWA real, **sin insignias de App Store/Play, sin valoraciones ni descargas
  inventadas**; instalación real (beforeinstallprompt en Android + instrucciones iOS "Compartir → Añadir a inicio");
  ambas `noindex,follow`.
- ✅ **`manifest.json` completo**: iconos 192/512/maskable + `badge-72` **existen**; shortcuts; scope `/`,
  start_url `/app`.
- ✅ **`sw.js` push/notificationclick** bien construidos (foco a pestaña existente o nueva; `renotify` por tag).
- ✅ **Hub degrada limpio**: sesión/perfil/gamificación/partido destacado con `try/catch` y `catch(()=>{})`; modo
  invitado coherente.
- ✅ **Onboarding**: requiere auth; `skipOnboardingAction` redirige same-origin; email de bienvenida fire-and-forget.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Registrar el SW al arranque (no solo al activar push) → restaurar instalación PWA | H-014-01 | P1 |
| 2 | Implementar gating por módulo de los beneficios Founders, o ajustar las tablas a lo entregado | H-014-02 | P1 |
| 3 | Añadir caché de app-shell + página offline en `sw.js` | H-014-03 | P2 |
| 4 | Persistir borrador del onboarding (localStorage) + validar listas en server | H-014-04 | P2 |
| 5 | `next`: rechazar `//…` en el cierre del wizard | H-014-05 | P2 |
| 6 | Estado real (Disponible/Próximamente) de módulos en el hub | H-014-06 | P2 |
| 7 | Labels asociadas + `role="alert"` en el formulario | H-014-07 | P2 (Fase 18) |
| 8 | No emitir FAQ JSON-LD de funciones no vivas; escapar `</script>` | H-014-08 | P2 (Fase 15) |
| 9 | Limpiar comentarios/relicto de "app nativa" | H-014-09 | P3 |

**Criterio de cierre:** la PWA se instala sin activar push y funciona offline básico; onboarding reanudable; el hub no
anuncia como disponible lo que no lo está; los beneficios de pago se entregan o no se anuncian.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-014-01 | P1 | `lib/push-client.ts:31-96` (SW lazy) + `public/sw.js:24-30` | Abierto |
| H-014-02 | P1 (consumo) | `src/data/app-modules-content.ts` + `ModuleFreeVsFounders.tsx` | Abierto |
| H-014-03 | P2 | `public/sw.js:28-30` | Abierto |
| H-014-04 | P2 | `OnboardingWizard.tsx:57`; `onboarding/actions.ts:42-50` | Abierto |
| H-014-05 | P2 | `OnboardingWizard.tsx:51-52,96` | Abierto |
| H-014-06 | P2 | `app/app/page.tsx:136-159` | Abierto |
| H-014-07 | P2 | `OnboardingWizard.tsx:154-158,248-385` | Abierto |
| H-014-08 | P2 | `ModuleFAQ.tsx:35-37` | Abierto |
| H-014-09 | P2/P3 | `descarga/page.tsx:5-57`; `api/app/redirect/route.ts` | Abierto |
| H-014-P3 | P3 | sw push icon; manifest theme; maxTokenAge; ingresos mixtos; promesas con fecha; hub pesado | Abierto |

**Referencias cruzadas:** age-gate/birth_date (**H-002-03**); resubscribe (**H-012-05**); módulos placeholder
(**H-007-05**); pagos/founders (**Fase 3**); JSON-LD/SEO (**Fase 15**); a11y (**Fase 18**); peso del hub (**Fase 17**).
