# Fase 14 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-14-app-pwa-onboarding.md](fase-14-app-pwa-onboarding.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. PWA: manifest, service worker, registro

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| manifest.json | Completitud | OK — name/short/desc, scope `/`, start_url `/app`, standalone, shortcuts | OK | manifest.json:1-66 |
| manifest.json | Iconos | OK — 192/512/maskable + badge-72 **existen** en `/public/icons` | OK | manifest.json:14-33 (verificado) |
| manifest.json | theme_color | `#0b0b0f` ≠ navy real del hub `#0a1729`; sin campo `id` | P3 | manifest.json:9-10 |
| sw.js | install/activate | OK — `skipWaiting` + `clients.claim` | OK | sw.js:13-22 |
| sw.js | fetch | **No-op** → sin caché ni offline | **H-014-03** P2 | sw.js:28-30 |
| sw.js | push | OK — parse seguro, fallback, `renotify` por tag, `requireInteraction`/`silent` | OK | sw.js:32-79 |
| sw.js | push icon | usa logo de **email** como icono de push | P3 | sw.js:52 |
| sw.js | notificationclick | OK — foco a pestaña same-origin o abre nueva | OK | sw.js:81-109 |
| sw.js | pushsubscriptionchange | re-suscribe y POST a resubscribe (pierde userId+kinds) | P3 (=H-012-05) | sw.js:111-139 |
| push-client.ts | Registro SW | **Solo al activar push** (`ensureServiceWorker` desde `subscribeToPush`) → no instalable por defecto | **H-014-01** P1 | push-client.ts:31-37,96 |
| push-client.ts | subscribe | OK — espera SW activo, retry AbortError, idempotente | OK | push-client.ts:96-146 |

## B. Shell `/app` (layout + hub)

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| app/layout.tsx | SEO | OK — `noindex,follow` para mockups; inyecta tema de bar si hay contexto | OK | app/layout.tsx:19-29 |
| app/page.tsx | Tipo | Client component ~1.000 líneas, estilos inline → JS pesado | P3 (Fase 17) | app/page.tsx:1 |
| app/page.tsx | Sesión/datos | OK — degrada limpio (`try/catch`, `catch(()=>{})`); modo invitado | OK | app/page.tsx:447-502 |
| app/page.tsx | Install PWA | botón gateado por `beforeinstallprompt` (no llega sin SW, H-014-01) | P1 | app/page.tsx:410-423,661 |
| app/page.tsx | Estados módulos | Stories/Streaming/Chat/Ligas badge "Disponible" pese a ser placeholder | **H-014-06** P2 | app/page.tsx:136-159 |

## C. Onboarding

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| onboarding/page.tsx | Auth | OK — `getOwnProfile`; `force-dynamic` | OK | onboarding/page.tsx:7-10 |
| actions.ts | Auth | OK — exige `getUser`; sanitiza username (a-z0-9_,3-30) | OK | actions.ts:27-40 |
| actions.ts | birth_date | Guardado **raw sin validar** (sin age-gate) | =H-002-03 | actions.ts:50 |
| actions.ts | Validación listas | country/fav_team/fav_creator raw, sin comprobar pertenencia | P2 | actions.ts:42-47 |
| actions.ts | username unique | depende de catch de error duplicate (requiere constraint UNIQUE) | =Fase 2 | actions.ts:66 |
| actions.ts | "una sola tx" | profile.update + user_preferences.upsert son 2 escrituras, no tx | P3 | actions.ts:52-76 |
| actions.ts | skip redirect | OK — same-origin only | OK | actions.ts:117-118 |
| OnboardingWizard.tsx | Reanudable | **No** — todo en `useState`, sin persistencia | **H-014-04** P1→P2 | OnboardingWizard.tsx:57 |
| OnboardingWizard.tsx | Age gate cliente | solo bloquea fechas futuras; campo opcional | =H-002-03 | OnboardingWizard.tsx:391 |
| OnboardingWizard.tsx | `next` `//` | acepta `//evil.com`; cierre usa `router.push` cliente | **H-014-05** P2 | OnboardingWizard.tsx:51-52,96 |
| OnboardingWizard.tsx | Acciones | OK — llama complete/skip, maneja `{ok,error}`, `useTransition` | OK | OnboardingWizard.tsx:88-109 |
| OnboardingWizard.tsx | Sin dead-end | OK — "Saltar" siempre disponible; Back en pasos 2/3 | OK | OnboardingWizard.tsx:196,279 |
| OnboardingWizard.tsx | a11y labels | `<label>` sin `htmlFor`; inputs sin `id` | **H-014-07** P2 | OnboardingWizard.tsx:248,260,339,385 |
| OnboardingWizard.tsx | a11y errores | banner de error sin `role="alert"`/`aria-live` | **H-014-07** P2 | OnboardingWizard.tsx:154-158 |

## D. Marketing: la-app + descarga

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| descarga | Transparencia | OK — PWA real, "sin tiendas", **sin insignias/cifras falsas** | OK | DescargaClient.tsx:286-289 |
| descarga | Instalación | OK — InstallPWAButton (Android) + instrucciones iOS reales | OK (pero ver H-014-01) | DescargaClient.tsx |
| descarga | Form email | OK — estados idle/loading/sent/error + 429 | OK | DescargaClient.tsx:176-206 |
| descarga / api/app/redirect | Relicto nativo | comentarios de "smart link" a App Store/Play que no existe; redirect → `/descarga` | **H-014-09** P2/P3 | descarga/page.tsx:5-57 |
| descarga vs la-app | Módulos | listas de features distintas (Álbum vs Modo Carrera/Stories...) ambas dicen "12 módulos" | P3 | DescargaClient.tsx:128; la-app/page.tsx:10-23 |
| la-app | Transparencia | OK — `noindex,follow`; sin cifras falsas | OK | la-app/layout.tsx:19 |
| la-app | Deep links | módulos enlazan `/app/${id}` (verificar que todas las rutas existen) | P3 | la-app/page.tsx:40 |

## E. Integración móvil + landings de módulo

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| lib/apple/verify-notification.ts | Verificación | OK — JWS criptográfico (jose JWKS, iss/aud fijados); idempotencia `jti` | OK | verify-notification.ts:32-95 |
| lib/apple/verify-notification.ts | Wired | OK — usado por `api/auth/apple/notifications` | OK | route.ts:45,87 |
| lib/apple/verify-notification.ts | maxTokenAge | "30 days" laxo (mitigado por dedup) | P3 | verify-notification.ts:94 |
| lib/pasedt/entitlement.ts | Entitlement | OK — server-side, email de sesión, fail-closed, re-checado | OK | entitlement.ts:23-29 |
| lib/pasedt/entitlement.ts | Wired | OK — usado por 3 rutas de modo-carrera | OK | narrativa/refill/entitlement routes |
| ModuleNotifyCTA | Endpoint/conteo | OK — `/api/notify-module/[slug]` real; **conteo real**, sin cifra falsa | OK | ModuleNotifyCTA.tsx:47,256-267 |
| ModuleFreeVsFounders + app-modules-content | Promesas | Ventajas Founders sin enforcement (solo Modo Carrera gatea) | **H-014-02** P1 | app-modules-content.ts:117,147,173 |
| ModuleFAQ | JSON-LD | FAQ schema de funciones no vivas; `dangerouslySetInnerHTML` sin escapar `</script>` | **H-014-08** P2 | ModuleFAQ.tsx:35-37 |
| app-modules-content | Promesas con fecha | "9 creators antes del 11 de junio" (inminente/incumplida) | P3 | app-modules-content.ts:256 |
| founders/store.ts | Ingresos | suma EUR+USD en un entero (analítica) | P3 | founders/store.ts:111-113 |

---

## F. Veredictos
- **PWA:** manifest e iconos OK, pero **instalación rota por SW lazy** (H-014-01) y **sin offline** (H-014-03).
- **Onboarding:** funcional y siempre escapable, pero **no reanudable** y con validación de listas solo en UI; a11y de
  formulario floja; age-gate inexistente (H-002-03).
- **Integración Apple + Pase DT:** **bien construidas y seguras** (no regresar).
- **Transparencia marketing:** **honesta** en `/la-app` y `/descarga` (contrasta con el resto del audit); el único
  defecto son comentarios-relicto de "app nativa".
- **Comercial:** **beneficios Founders anunciados sin aplicar** (H-014-02) — riesgo de consumo con Stripe activo.
