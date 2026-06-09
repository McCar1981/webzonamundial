# Fixes aplicados — Auditoría Fase 0 + Fase 1

**Fecha:** 2026-06-09  
**Auditor:** Claude  
**Estado:** Fase 0 ✅ COMPLETADA · Fase 1 ✅ COMPLETADA  
**Build:** `npm run build` pasa · `npm run lint` 0 errores · `tsc --noEmit` limpio (salvo error preexistente en `AdUnit.tsx`)

---

## Fase 0 — Cimientos y configuración ✅

| Hallazgo | Sev | Problema | Fix | Archivos |
|---|---|---|---|---|
| H-000-01 | P0 | Build falla: páginas admin prerenderizan datos de KV | `export const dynamic = "force-dynamic"` en 3 páginas admin | `src/app/admin/founders/page.tsx` · `src/app/admin/module-interest/page.tsx` · `src/app/admin/registros/page.tsx` |
| H-000-02 | P1 | Hook `useState` llamado condicionalmente tras `return null` | Movido `useState` antes del early-return | `src/components/biblia/DeepTabs.tsx` |
| H-000-03 | P1 | `.env.example` desactualizado (faltan ~41 variables) | Regenerado con 67 variables agrupadas por módulo y marcadas obligatorias/opcionales | `.env.example` |
| H-000-04 | P2 | 57 errores de lint | 33 comentarios JSX sueltos → `{/* */}` · 22 entidades sin escapar → `&quot;`/`&apos;` · 1 config `module` reservada renombrada a `mod` | 20+ archivos |
| H-000-06 | P2 | `NODE_TLS_REJECT_UNAUTHORIZED=0` en scripts de imágenes | Eliminado de ambos scripts. Quitado flag `--insecure` de documentación | `scripts/fetch-commons-images.cjs` · `scripts/fetch-stadium-images.cjs` |

### Hallazgos Fase 0 pendientes (no bloqueantes)
- H-000-05 (P2): 34 vulnerabilidades `npm audit` → recomendado `npm audit fix --production`
- H-000-07 (P3): `strict: false` en TypeScript → plan de migración gradual

---

## Fase 1 — Seguridad transversal ✅

### 🔴 P0 Resueltos (3/3)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-001-01** | 24 crons fail-open: si falta `CRON_SECRET` no verifican nada. 20/24 aceptan `?secret=` en query string | Nuevo helper `requireCron()` fail-closed: 401 si no hay CRON_SECRET, solo `Authorization: Bearer`, comparación en tiempo constante (`timingSafeEqual`). Aplicado a 25 endpoints cron | `src/lib/auth-helpers.ts` · 25 archivos en `src/app/api/cron/**/route.ts` |
| **H-001-02** | 4 endpoints IA Coach públicos sin auth ni rate-limit. Cache evadible variando inputs → coste Anthropic ilimitado | `getCurrentUser()` + `rateLimitByUser()` (KV fixed-window) en `analyze`, `coach`, `live`, `oracle` + `match-center/narrate` | 5 archivos en `src/app/api/ia-coach/**` · `src/app/api/match-center/narrate/route.ts` |
| **H-001-18** | Fantasy: `total_points` del cliente persiste en DB y ordena el ranking global → manipulación trivial | `total_points` ya NO se guarda del cliente. `saveTeam` omite el campo. `recordGameweekScore` recalcula server-side como suma de `fantasy_gameweek_scores`. Gameweek points validados (0-200) | `src/lib/fantasy/store.server.ts` · `src/app/api/fantasy/team/route.ts` |

### 🟠 P1 Resueltos (9/9)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-001-03** | `next.config.js` ignora errores TS/ESLint en build | `ignoreBuildErrors: false` · `ignoreDuringBuilds: false` | `next.config.js` |
| **H-001-04** | Admin auth: fallback a contraseña conocida `"zm-admin-dev-only"` si falta env. Secreto HMAC = password. Comparación no constante | Quitado fallback hardcodeado. Fail-closed (503 si falta env). Cookie usa `ADMIN_TOKEN` como secreto independiente. `timingSafeEqual` en login | `src/lib/admin-auth.ts` · `src/app/api/admin/login/route.ts` |
| **H-001-09** | `api/eliminar-cuenta` POST público: envía emails de "borrado RGPD" a víctimas arbitrarias. Sin rate-limit | Exige `getCurrentUser()`. Email del body debe coincidir con `user.email` de la sesión (403 si no) | `src/app/api/eliminar-cuenta/route.ts` |
| **H-001-12** | `api/bars/logo` acepta `image/svg+xml` y lo sirve desde bucket público → XSS almacenado | Eliminado `image/svg+xml` de ALLOWED_MIME. Solo JPG/PNG/WEBP | `src/app/api/bars/logo/route.ts` |
| **H-001-14** | `api/checkout` loguea `secretKeyPrefix` (8 chars de `STRIPE_SECRET_KEY`) | Eliminado `secretKeyPrefix` del log de errores | `src/app/api/checkout/route.ts` |
| **H-001-16** | `api/predictions/bracket` PUT sin deadline lock: se puede sobrescribir en cualquier momento | `isBracketEditable()` usando `CAPSULE_DEADLINE` (2026-06-11). PUT devuelve 403 tras iniciar el torneo | `src/app/api/predictions/bracket/route.ts` |
| **H-001-20** | Fantasy: `recordGameweekScore` guarda `gs.points` del body sin recalcular | Validación de rango (0-200) + recálculo server-side de `total_points` desde gameweek_scores | `src/lib/fantasy/store.server.ts` |
| **H-001-21** | Modo Carrera: ranking DT ordena por `overall`/`reputation` que el cliente fija (maximizables a 99) | `deriveOverallFromXp()` recalcula `overall` server-side desde XP. `reputation` recalculado desde stats acotados | `src/lib/modo-carrera/store.server.ts` |

### 🟡 P2 Resueltos (13/13)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-001-05** | Middleware NO protege `/api/admin/*` (solo `/admin`) | Añadido `url.pathname.startsWith("/api/admin")` al guard del middleware | `src/middleware.ts` |
| **H-001-06** | Admin token aceptado por `?token=` en query string → fuga en logs/Referer | `player-photos`: quitado soporte de `?token=`. Solo `Authorization: Bearer` | `src/app/api/admin/player-photos/route.ts` |
| **H-001-07** | Path traversal en `api/admin/player-photos`: `slug` concatenado sin sanear | `slug` validado con regex `^[a-z0-9-]+$` antes de usar en `path.join()` | `src/app/api/admin/player-photos/route.ts` |
| **H-001-08** | CSP contiene `'unsafe-eval'` pese a documentar lo contrario | Quitado `'unsafe-eval'` de `script-src` en `next.config.js` | `next.config.js` |
| **H-001-10** | `api/auth/check-email`: rate-limit fail-open (spoofeable vía `x-forwarded-for`) | Rate-limit ahora fail-closed: sin KV o error → 429 (bloquea) | `src/app/api/auth/check-email/route.ts` |
| **H-001-11** | `api/registro` sin rate-limit → registro masivo | Añadido rate-limit por IP (5/60s), fail-closed | `src/app/api/registro/route.ts` |
| **H-001-13** | `api/bars` PATCH / `api/bars/prizes`: campos de texto libre sin sanear → XSS almacenado | `sanitizeText()` centralizado en `store.ts`: quita tags HTML y control chars | `src/lib/bars/store.ts` |
| **H-001-15** | `api/bracket/capsule/seal`: email-bombing a terceros + enumeración | Rate-limit por IP (3/60s) | `src/app/api/bracket/capsule/seal/route.ts` |
| **H-001-17** | `api/predictions/leagues/[id]`: lectura de clasificación de cualquier liga sin validar membresía | `isLeagueMember()` valida membresía antes de devolver standings (403 si no es miembro) | `src/app/api/predictions/leagues/[id]/route.ts` · `src/lib/predictions/gamification-store.ts` |
| **H-001-22** | `api/trivia/finish`: `anonId`/`name` falsificables → spam de ranking público anónimo | Rate-limit por IP (10/60s). `sanitizeName()` quita tags HTML y control chars | `src/app/api/trivia/finish/route.ts` |
| **H-001-24** | Push `unsubscribe`/`resubscribe`/`match-center/follow`: operan sobre endpoint arbitrario sin posesión | `getCurrentUser()` en los 3 endpoints. `getPushSubscriptionOwner()` verifica ownership en unsubscribe. `userId` vinculado en subscribe | 3 archivos en `src/app/api/{notifications/push,match-center/follow}` · `src/lib/push-notifications.ts` |
| **H-001-25** | `api/notify-module/[slug]`: email-bombing; rate-limit por email evadible cambiando email | Rate-limit por IP principal + email secundario. Máximo reducido a 3/60s | `src/app/api/notify-module/[slug]/route.ts` |
| **H-001-26** | `api/health`: expone qué secretos/env faltan (array `missing`) + región | Quitado array `missing` del response (solo cuenta). Quitado `region` | `src/app/api/health/route.ts` |

---

## Nuevos helpers creados

| Helper | Ubicación | Propósito |
|---|---|---|
| `requireCron(req)` | `src/lib/auth-helpers.ts` | Guard fail-closed para endpoints cron. Bearer-only, timing-safe |
| `rateLimitByUser(userId, key, limit, window)` | `src/lib/auth-helpers.ts` | Rate-limit por userId usando KV (fixed-window) |
| `deriveOverallFromXp(xp)` | `src/lib/modo-carrera/store.server.ts` | Recalcula overall del Modo Carrera desde XP de forma autoritativa |
| `getPushSubscriptionOwner(endpoint)` | `src/lib/push-notifications.ts` | Devuelve el `user_id` asociado a una subscription push |
| `sanitizeText(raw)` | `src/lib/bars/store.ts` | Quita tags HTML y control chars de texto libre |
| `isLeagueMember(uid, leagueId)` | `src/lib/predictions/gamification-store.ts` | Verifica membresía de usuario en una liga |

---

## Estadísticas

| Métrica | Valor |
|---|---|
| Hallazgos P0 resueltos | 3 / 3 |
| Hallazgos P1 resueltos | 9 / 9 |
| Hallazgos P2 resueltos | 13 / 13 |
| Hallazgos P3 resueltos | 0 (diferidos a fases específicas) |
| Archivos modificados | ~55+ |
| Nuevos helpers creados | 6 |
| Errores de lint | 0 |
| Errores de TypeScript | 0 (preexistente `AdUnit.tsx` no relacionado) |
| Build | ✅ Pasa |

---

---

## Fase 2 — Auth, cuenta y sesión ✅

### 🔴 P1 Resueltos (3/3)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-002-01** | Borrado GDPR incompleto: `email_subscriptions` con `user_id=NULL` queda huérfana; `user_preferences` sin FK verificable | Borrado explícito antes de `deleteUser`: `email_subscriptions` por email + `user_preferences` por `user_id`. Misma lógica en API route y server action | `src/app/api/account/delete/route.ts` · `src/app/cuenta/actions.ts` |
| **H-002-02** | `deleteAccountAction` hace self-fetch HTTP a `/api/account/delete` — frágil si `NEXT_PUBLIC_SITE_URL` está mal o cookies no viajan | Admin client `createClient(url, serviceKey)` creado directamente en la server action. Sin saltar por HTTP | `src/app/cuenta/actions.ts` |
| **H-002-03** | `birth_date` solo valida regex (acepta `2026-13-40`, fechas futuras). No verifica mayoría de edad | Nuevo `lib/profile-validation.ts`: `isValidIsoDate()` valida fecha real + `isAdult()` verifica 18+. Aplicado en cuenta y onboarding | `src/lib/profile-validation.ts` · `src/app/cuenta/actions.ts` · `src/app/onboarding/actions.ts` |

### 🟡 P2 Resueltos (4/4)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-002-05** | Cambio de email sin reautenticación: `supabase.auth.updateUser({ email })` desde el cliente | Nueva server action `updateEmailAction`: verifica `last_sign_in_at < 10 min`. Si la sesión es vieja, rechaza pidiendo re-login | `src/app/cuenta/actions.ts` · `src/app/cuenta/seguridad/SecurityPanel.tsx` |
| **H-002-06** | `country`/`fav_team`/`fav_creator` guardados con solo `.trim()` — cliente manipulado escribe valores arbitrarios | `validateCountry()`/`validateFavTeam()`/`validateFavCreator()` en `profile-validation.ts`. Valores no encontrados en catálogo → `null` | `src/lib/profile-validation.ts` · `src/app/cuenta/actions.ts` · `src/app/onboarding/actions.ts` |
| **H-002-07** | Open-redirect protocol-relative: `//evil.com` pasa `startsWith("/")` | Doble chequeo: `startsWith("/") && !startsWith("//")` en onboarding action y wizard | `src/app/onboarding/actions.ts` · `src/app/onboarding/OnboardingWizard.tsx` |
| **H-002-08** | `/auth/debug` público en producción: revela env vars, project ref, providers activos, URLs | En producción verifica cookie `admin_session` contra `ADMIN_DEBUG_TOKEN`. Sin coincidencia → redirect a `/login` | `src/app/auth/debug/page.tsx` |

### ⏸️ P2 Diferidos (requieren decisión de producto o verificación externa)

| Hallazgo | Razón | Acción necesaria |
|---|---|---|
| **H-002-04** | No existe cambio de contraseña | Por diseño: app usa solo OAuth/magic-link, sin contraseñas | Documentar explícitamente si se desea |
| **H-002-09** | Atribución de referido (creador) falsificable | Aceptable para marketing; solo relevante si se monetiza con comisiones | Firmar slug en URL si se monetiza |
| **H-002-10** | Unicidad de username depende de constraint DB | Requiere verificar en Supabase DB que existe `UNIQUE` en `profiles.username` | `\d` en Supabase |
| **H-002-11** | Doc `OAUTH-SETUP.md` desactualizado | Trigger SQL de ejemplo no copia campos de `raw_user_meta_data` | Actualizar markdown del doc |
| **H-002-12** | Dos caminos de borrado divergentes | `/cuenta/seguridad` (inmediato) vs `/eliminar-cuenta` (manual, 30 días) | Decidir si unificar o mantener ambos |

---

## Nuevos helpers creados (Fase 2)

| Helper | Ubicación | Propósito |
|---|---|---|
| `isValidIsoDate(input)` | `src/lib/profile-validation.ts` | Valida fecha ISO real (rechaza meses/días imposibles, fechas futuras) |
| `calculateAge(birthDateIso)` | `src/lib/profile-validation.ts` | Calcula edad exacta en años |
| `isAdult(birthDateIso, minAge=18)` | `src/lib/profile-validation.ts` | Verifica mayoría de edad |
| `validateCountry(input)` | `src/lib/profile-validation.ts` | Busca en `COUNTRIES`, devuelve `null` si no existe |
| `validateFavTeam(input)` | `src/lib/profile-validation.ts` | Busca en `SELECCIONES`, devuelve `null` si no existe |
| `validateFavCreator(input)` | `src/lib/profile-validation.ts` | Busca en `CREADORES`, devuelve `null` si no existe |

---

## Fase 3 — Pagos: Stripe, checkout, founders, premium ✅

### 🔴 P1 Resueltos (1/1)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-003-01** | Identidad de Founder por email: si el usuario cambia email, pierde el acceso premium pese a haber pagado | Nuevo índice inverso `founders:user:<user_id>` en KV. `markFounder` guarda `userId` + índice. `isPaseDT(email, userId)` busca por email primero, luego por `user_id` como fallback. Todos los callers actualizados | `src/lib/founders/store.ts` · `src/lib/pasedt/entitlement.ts` · `src/app/api/checkout/route.ts` · `src/app/api/stripe/webhook/route.ts` · `src/app/cuenta/founders-pass/page.tsx` · 3 archivos modo-carrera |

### 🟡 P2 Resueltos (4/4)

| Hallazgo | Problema | Fix | Archivos |
|---|---|---|---|
| **H-003-02** | `success_url` apunta a `/cuenta?purchase=success` pero el banner vive en `/cuenta/founders-pass` → nunca se ve | Cambiado `success_url` a `/cuenta/founders-pass?purchase=success` | `src/app/api/checkout/route.ts` |
| **H-003-03** | BarDashboard muestra "Pago confirmado. Tu plan está activo." por `?purchase=success` aunque el webhook no haya llegado | Mensaje cambiado a "Pago procesado. Verificando activación… refresca en unos segundos." | `src/app/bar-dashboard/BarDashboard.tsx` |
| **H-003-04** | Precios de `/premium` desacoplados del catálogo (vienen de i18n) | Nuevo `lib/stripe/pricing.ts` (server/client safe). `premium/page.tsx` sobrescribe el `price` de i18n con el del catálogo `FOUNDERS_PASS_PRICES`. `client.ts` re-exporta desde `pricing.ts` | `src/lib/stripe/pricing.ts` · `src/lib/stripe/client.ts` · `src/app/premium/page.tsx` |
| **H-003-05** | Webhook no maneja disputas/chargebacks: un usuario que abre disputa mantiene el acceso | Nuevo handler `handleDisputeCreated`: resuelve el charge, obtiene metadata (`product`/`email`/`bar_id`) y revoca la entitlement igual que un refund | `src/app/api/stripe/webhook/route.ts` |

### ⏸️ P2/P3 Diferidos (requieren decisión de producto o verificación externa)

| Hallazgo | Razón | Acción necesaria |
|---|---|---|
| **H-003-06** (P3) | Revenue mezcla EUR+USD en un contador | Solo afecta analytics del admin; requiere contadores por moneda | Decisión de producto |
| **H-003-07** (P3) | Plan de bar no expira tras el torneo | Probablemente intencional (pago único Mundial 2026) | Decidir corte temporal |
| **H-003-08** (P3) | `apiVersion` de Stripe no pineada | Aceptable para evitar rotura; se puede pinear cuando la cuenta acepte upgrade | Configuración Stripe |

---

## Estadísticas acumuladas

| Métrica | Fase 0 | Fase 1 | Fase 2 | Fase 3 | Total |
|---|---|---|---|---|---|
| Hallazgos P0 resueltos | 0 | 3 | 0 | 0 | **3** |
| Hallazgos P1 resueltos | 2 | 9 | 3 | 1 | **15** |
| Hallazgos P2 resueltos | 2 | 13 | 4 | 4 | **23** |
| Archivos modificados | 20+ | ~55+ | 7 | 10 | **90+** |
| Nuevos helpers creados | 0 | 6 | 6 | 3 | **15** |
| Nuevos archivos | 0 | 0 | 1 | 1 | **2** |
| Build | ✅ | ✅ | ✅ | ✅ | **✅** |
| TypeScript (`tsc --noEmit`) | ✅ | ✅ | ✅ | ✅ | **✅** |

---

## Verificación pendiente (requiere infra/entorno)

- **RLS en Supabase**: confirmar que está activo en `profiles`, `predictions`, `fantasy_teams`, `bars`, tablas de notificaciones
- **`CRON_SECRET` y `ADMIN_PASSWORD`**: confirmar que están definidos en todos los entornos de Vercel (Production + Preview)
- **npm audit**: ejecutar `npm audit fix --production` para las vulnerabilidades restantes
- **Fase 2 DB**: verificar constraint `UNIQUE` en `profiles.username` y que el trigger `handle_new_user` copia `raw_user_meta_data`
- **Fase 2 env**: establecer `ADMIN_DEBUG_TOKEN` en Vercel si se quiere usar `/auth/debug` en producción
- **Fase 3 Stripe**: confirmar en Vercel que se usan claves **live** en producción y **test** en preview/dev; que `STRIPE_WEBHOOK_SECRET` corresponde al endpoint correcto; y que el endpoint está registrado en Stripe Dashboard con los eventos `checkout.session.completed`, `charge.refunded` y `charge.dispute.created`
- **Fase 3 KV índice**: los founders existentes (pre-cambio) no tienen `userId` en su record ni índice inverso. Al cambiar email, solo los nuevos founders sobrevivirán. Para founders históricos: migración one-off recomendable (leer todos los records, extraer `userId` del email si está en Supabase, crear índices)
- **Fase 3 apiVersion**: pinear versión Stripe cuando la cuenta acepte el upgrade
