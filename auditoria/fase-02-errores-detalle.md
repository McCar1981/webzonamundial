# Fase 2 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-02-auth-cuenta.md](fase-02-auth-cuenta.md)

Detalle archivo por archivo de los flujos de auth/cuenta/onboarding, incluyendo los "OK" y los P3.
Cada fila cita `archivo:línea`. **Severidad:** `P0`/`P1`/`P2`/`P3`.

---

## A. Flujos centrales de auth (revisados directamente)

| Archivo | Aspecto | Veredicto | Sev | Evidencia |
|---|---|---|---|---|
| auth/callback/route.ts | PKCE + OTP cross-device | OK — soporta `code` y `token_hash`; maneja `?error=` del proveedor | OK | route.ts:48-96 |
| auth/callback/route.ts | Open-redirect | OK — `safeNext` exige `startsWith("/")` y prefija `${origin}` (no protocol-relative explotable) | OK | route.ts:99,124 |
| auth/callback/route.ts | Onboarding gating | OK — tras login comprueba `onboarded_at` y redirige a `/onboarding` preservando `next` | OK | route.ts:109-122 |
| auth/signout/route.ts | Método | OK — solo POST (no disparable por prefetch), redirige 303 | OK | route.ts:11-14 |
| auth/debug/page.tsx | Acceso público | **Público sin gate**: revela env presentes (incl. service_role + longitud), project ref, providers OAuth, disable_signup, URLs callback/webhook. Noindex pero accesible | P2 | page.tsx:30-72,143-147 |
| lib/supabase/middleware.ts | Refresh de sesión | OK — `getUser()` refresca cookies en cada request; no-op si faltan envs | OK | middleware.ts:36-45 |
| lib/supabase/server.ts | Cliente SSR | OK — anon key + cookies; service_role no se usa aquí | OK | server.ts:9-21 |
| lib/supabase/client.ts | Cliente navegador | OK — solo `NEXT_PUBLIC_SUPABASE_ANON_KEY`; lanza si faltan envs | OK | client.ts:19-29 |

---

## B. Login / Registro / Onboarding

| Flujo/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| login/page.tsx | Método de inicio | OAuth Google/Apple (`signInWithOAuth`) + magic-link (`signInWithOtp`) | OK | login/page.tsx:85,104 |
| login/page.tsx | redirectTo | `NEXT_PUBLIC_SITE_URL` con fallback a `window.location.origin`; apunta al propio origen | OK | login/page.tsx:72-75 |
| login/page.tsx | Manejo de `?error=` | `humanizeCallbackError` traduce errores típicos | OK | login/page.tsx:32-47 |
| login/page.tsx | Validación email | Solo `type=email`+`required` (Supabase valida server-side) | P3 | login/page.tsx:233-235 |
| login/page.tsx | `next` sin sanear | Se inserta crudo en `?next=`; defensa delegada al callback (sin defensa-en-profundidad) | P3 | login/page.tsx:51,75 |
| (UI global) | Login con contraseña | NO existe `signInWithPassword` → sin superficie de fuerza de contraseña | OK | — |
| FormularioRegistro.tsx | ¿Lead o cuenta? | **Ambos**: POST a `/api/registro` (lead KV) + `signInWithOtp` `shouldCreateUser:true` (cuenta real) | OK | FormularioRegistro.tsx:336,377-381 |
| FormularioRegistro.tsx | Validación cliente | Robusta: email, nombre/apellido Unicode 2-50, username 3-30, país/team obligatorios, términos | OK | FormularioRegistro.tsx:158-209 |
| FormularioRegistro.tsx | Metadata falsificable | `username/fav_creator/country/fav_team` van en `raw_user_meta_data` (autodeclarados) | P2 | FormularioRegistro.tsx:386-399 |
| FormularioRegistro.tsx | Feedback de errores | Muy bueno (rate-limit, signup disabled, network, provider) | OK | FormularioRegistro.tsx:417-435 |
| api/registro/route.ts | Validación servidor | Valida email, nombre 3-30, country ISO-2, fav_team slug (buena paridad) | OK | route.ts:47-103 |
| api/registro/route.ts | Rate limiting | No aplica rate-limit propio (ver Fase 1 H-001-11) | P2 | route.ts:29-35,105 |
| api/registro/route.ts | Trust x-forwarded-for | IP cruda solo para logging de leads | P3 | route.ts:30-34 |
| registro/[creador]/page.tsx | Slug inexistente | OK — `getCreadorBySlug` → `notFound()` + noindex | OK | [creador]/page.tsx:14-19,51-52 |
| registro/[creador] | Atribución referido | Falsificable (radios + metadata libre); sin verificación/firma | P2 | FormularioRegistro.tsx:817-819 |
| onboarding/layout.tsx | Exige sesión | OK — `requireUser`; si ya onboarded → `/cuenta` | OK | layout.tsx:24-28 |
| onboarding/actions.ts | Sesión en action | OK — `getUser()`, defensa propia | OK | actions.ts:28-31 |
| onboarding/actions.ts | Escribe propio perfil | OK — `.update().eq("id", user.id)` | OK | actions.ts:52-63 |
| onboarding/actions.ts | Username único | Parcial — sanea + ≥3; unicidad solo por error de DB (requiere constraint) | P2 | actions.ts:16-18,65-68 |
| onboarding/actions.ts | Catálogo fav_team/creator/country | No valida contra catálogo (acepta cualquier string) | P2 | actions.ts:42-47 |
| onboarding/actions.ts | birth_date | **No valida** formato ni mayoría de edad (usado para "restricción de edad") | P1 | actions.ts:50; Wizard.tsx:395-397 |
| onboarding/actions.ts | onboarded_at | OK — marca en update y en skip | OK | actions.ts:61,112 |
| onboarding/actions.ts | Open-redirect | `next.startsWith("/")` acepta `//evil.com` (protocol-relative) | P2 | actions.ts:117; Wizard.tsx:52 |
| OnboardingWizard.tsx | Validación username cliente | OK — coincide con server | OK | Wizard.tsx:71-77 |

---

## C. Sección /cuenta

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| cuenta/layout.tsx | Protección | OK — `requireUser("/cuenta")` protege todas las subrutas | OK | layout.tsx:30 |
| cuenta/actions.ts (updateProfile) | Authz | OK — user_id de sesión, `.eq("id", user.id)`, revalida path, maneja username duplicado | OK | actions.ts:36-39,68-77 |
| cuenta/actions.ts (updateProfile) | Catálogo | `country/fav_team/fav_creator` solo `.trim()`, sin validar catálogo | P2 | actions.ts:47-49 |
| cuenta/actions.ts (updateProfile) | birth_date | Solo regex de formato; acepta fechas imposibles/futuras | P3 | actions.ts:29-32 |
| cuenta/actions.ts (deleteAccount) | Self-fetch frágil | `fetch(SITE_URL/api/account/delete)` con `x-user-id` ignorado; puede fallar en silencio si cookies/URL fallan | P1 | actions.ts:110-121 |
| cuenta/actions.ts (deleteAccount) | Signout tras borrar | OK — `signOut()` tras el borrado | OK | actions.ts:128 |
| seguridad/SecurityPanel.tsx | Cambio de contraseña | **No existe** en toda la sección | P2 | SecurityPanel.tsx (todo) |
| seguridad/SecurityPanel.tsx | Cambio de email | `updateUser({email})` sin reautenticación/contraseña actual | P2 | SecurityPanel.tsx:33-35 |
| preferencias/actions.ts | Persistencia | OK — `upsert onConflict user_id`, valida sesión, revalida | OK | actions.ts:14-39 |
| notificaciones/NotificacionesPanel.tsx | Errores | OK — maneja 401→login; toggles persisten vía API | OK | NotificacionesPanel.tsx:225-233 |
| avatar/AvatarUploader.tsx | Validación | OK — MIME+size en cliente y server | OK | AvatarUploader.tsx:47-54 |
| founders-pass/FoundersActions.tsx | Reembolso | `confirm()` + fetch; anti-doble-submit solo por `disabled` | P3 | FoundersActions.tsx:40-54 |
| founders-pass/FoundersActions.tsx | PII en URL OG | Mete parte local del email como `name` en `/api/og/founder` | P3 | FoundersActions.tsx:17-22 |
| eliminar-cuenta/page.tsx | Borrado manual | Solicitud manual (≤30 días) que coexiste con el borrado inmediato → posible divergencia | P2 | eliminar-cuenta/page.tsx:40-44 |

---

## D. Borrado GDPR — tablas cubiertas vs huérfanas

**Lo que `api/account/delete/route.ts` ejecuta literalmente:**
1. `admin.auth.admin.deleteUser(user.id)` → borra `auth.users` (`route.ts:54`).
2. Borra objetos de Storage `avatars/{user.id}/*` (`route.ts:62-65`).
3. `signOut()` en el action que lo invoca (`cuenta/actions.ts:128`).

No hay `DELETE` explícito sobre tablas `public.*` → todo depende del `ON DELETE CASCADE`.

**✅ Cubiertas por CASCADE (confirmado en migraciones):**
`profiles`, `predictions` (+`prediction_chains`, `_social_stats`, `_boosts`), `prediction_achievements`,
`_daily_claims`, `_challenge_progress`, `_duels` (challenger/opponent CASCADE; winner SET NULL),
`_leagues`+`_league_members`, `_season_xp`, `_battlepass_claims`, `_jornada_claims`, `_live_picks`,
`_bracket`+`_bracket_score`, `_cosmetics_owned`, `_rivalries`, `_notifications`,
`fantasy_teams`, `_gameweek_scores`, `_coin_claims`, `_leagues`+`_league_members`,
`modo_carrera_saves`+`_mission_claims`, `micro_responses`, `push_subscriptions`, `notification_preferences`,
`bars` (+`bar_qr_sources`, `_prizes`, `_participants`, `_events`, `_payments`).

**⚠️ HUÉRFANAS / en riesgo:**
- **`email_subscriptions` con `user_id NULL`** → email queda almacenado (no cascadea). **P1 GDPR.**
- **`user_preferences`** → sin migración en repo; cascade no verificable. **P1.**
- `bar_events.user_id`/`winner_user_id`, `bars.winner_user_id`, `prediction_duels.winner_id`,
  `micro_duels.winner_id`, `prediction_boosts.applied_to` → `SET NULL` (anonimización, aceptable GDPR).
- Storage: solo se limpia el bucket `avatars` (no se detectaron otros buckets de usuario).

**Conclusión:** borrado mayoritariamente completo por cascades, con **dos fallos materiales**
(`email_subscriptions` email-only y `user_preferences` sin migración).

---

## E. Pendiente de verificación en la DB (no derivable del repo)
- `ON DELETE CASCADE` real en todas las FK a `auth.users` (en especial `user_preferences`).
- Constraint `UNIQUE` en `profiles.username`.
- Trigger `handle_new_user` desplegado copia `username/fav_creator/country/fav_team` desde metadata.
