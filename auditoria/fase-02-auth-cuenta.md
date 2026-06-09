# Fase 2 — Auth, cuenta y sesión

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías paralelas)
**Alcance:** `app/login`, `app/registro` (+`[creador]`), `app/auth/*` (callback, signout, debug), `app/onboarding/*`, `app/cuenta/*`, `app/eliminar-cuenta`, `api/auth`, `api/account`, `api/cuenta`, `api/users`, `api/eliminar-cuenta`, `lib/auth-helpers.ts`, `lib/supabase/*`, `components/FormularioRegistro.tsx`, `docs/OAUTH-SETUP.md`, `docs/MOBILE-APP-AUTH-INTEGRATION.md`.

> Nota: los **endpoints API** de cuenta/auth se auditaron a nivel de seguridad en la **Fase 1**
> (IDOR, authz, rate-limit). Esta fase cubre los **flujos de página/servidor**, OAuth, sesión,
> contraseña/email, onboarding y la **completitud GDPR del borrado**. Se referencian los hallazgos de
> Fase 1 cuando aplica.

---

## Resumen ejecutivo

El núcleo de autenticación es **correcto y bien diseñado**: solo OAuth (Google/Apple) + magic-link
(sin contraseñas → sin superficie de fuerza bruta de contraseña), el callback valida `next` same-origin,
el signout es POST-only (no disparable por prefetch), el cliente del navegador usa solo la anon key, y
**todas las páginas `/cuenta/*` exigen sesión** (vía `requireUser` en el layout + defensa propia en cada
acción). Las server actions escriben siempre sobre el `user.id` de la sesión.

Los problemas se concentran en **tres áreas**:

1. **Borrado de cuenta (GDPR):** depende casi por completo del `ON DELETE CASCADE` de `auth.users`.
   Hay PII que **queda huérfana** (`email_subscriptions` con `user_id NULL`) y una tabla
   (`user_preferences`) sin migración en el repo cuyo cascade **no es verificable**. Además el flujo de
   borrado usa un self-fetch frágil que puede **fallar en silencio**.
2. **Gestión de credenciales:** **no existe cambio de contraseña**, y el cambio de email se hace
   **sin reautenticación**.
3. **Validación de datos de perfil/onboarding:** `birth_date` (usado para restricción de edad) y los
   campos `country`/`fav_team`/`fav_creator` **no se validan en servidor** contra catálogo; un
   open-redirect protocol-relative (`//evil.com`) en el onboarding; y la página `/auth/debug` es
   **públicamente accesible** y revela la superficie de configuración.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 3 |
| **P2** | 9 |
| **P3** | 5 |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Registro, login, OAuth (callback), signout funcionan y manejan errores | ✅ Correcto |
| Recuperación/cambio de contraseña y email seguros | ❌ No hay cambio de contraseña; cambio de email sin reautenticación |
| `auth/debug` no expone datos en producción | ❌ Público y revela configuración (H-002-08) |
| Eliminación de cuenta borra/anonimiza en TODAS las tablas (GDPR) | ❌ PII huérfana + cascade no verificable (H-002-01) |
| Edición de perfil, avatar, preferencias persisten y validan | ⚠️ Persisten OK; validación de servidor incompleta (H-002-03/06) |
| Sesión expira/renueva; auth móvil coherente | ✅ Middleware refresca sesión; doc móvil coherente (salvo H-002-11) |

---

## A. Hallazgos

### 🟠 H-002-01 (P1 · GDPR) — Borrado de cuenta incompleto: PII huérfana y cascade no verificable

`api/account/delete/route.ts` ejecuta **solo**: `admin.auth.admin.deleteUser(user.id)` (`route.ts:54`)
+ limpieza del bucket `avatars/{user.id}` (`route.ts:62-65`). **No hace ningún `DELETE` explícito** sobre
tablas `public.*`: confía 100% en el `ON DELETE CASCADE` de la FK a `auth.users`.

La mayoría de tablas **sí cascadean** (profiles, predictions y derivadas, fantasy, modo-carrera, micro,
push_subscriptions, notification_preferences, bars y derivadas). **Pero:**

- **`email_subscriptions` con `user_id NULL`** (suscripciones por email sin cuenta vinculada): el cascade
  no aplica → **el email queda almacenado** tras el borrado. Fallo material de GDPR.
- **`user_preferences`** (email_digest, push_*): **no existe migración SQL en el repo** → su FK/cascade
  no es verificable; si carece de cascade, queda huérfana con PII.

**Recomendación:** en el endpoint, borrar/anonimizar explícitamente por `email` en `email_subscriptions`
y verificar/crear la FK con cascade de `user_preferences`, en lugar de confiar en el cascade implícito.
(Cruza con **Fase 19 — Legal/GDPR**.)

### 🟠 H-002-02 (P1) — El borrado se ejecuta vía self-fetch frágil que puede fallar en silencio

`cuenta/actions.ts:110-121` (`deleteAccountAction`) hace `fetch(${NEXT_PUBLIC_SITE_URL}/api/account/delete)`
con un header `x-user-id` que el endpoint ignora (re-valida por SSR). Si `NEXT_PUBLIC_SITE_URL` está mal
configurado o las cookies no viajan en el self-fetch, el endpoint responde 401 y **el borrado falla sin
que el usuario lo perciba**. Debería invocar la lógica admin directamente (sin saltar por HTTP).

### 🟠 H-002-03 (P1) — `onboarding` no valida `birth_date` en servidor (restricción de edad no fiable)

`onboarding/actions.ts:50` guarda `birth_date` crudo del cliente, sin validar formato ni **mayoría de
edad**, pese a que la UI lo justifica por "premios con restricción de edad" (`OnboardingWizard.tsx:395`).
En `cuenta/actions.ts:29` la validación es solo regex de formato (acepta `2026-13-40` y fechas futuras).
**Recomendación:** validar ISO real + calcular edad mínima server-side antes de confiar en este dato.

### 🟡 H-002-04 (P2) — No existe funcionalidad de cambio de contraseña

`seguridad/SecurityPanel.tsx` solo cubre cambio de email y borrado. No hay flujo de cambio/establecimiento
de contraseña en toda la sección `/cuenta`. (Coherente con un modelo solo-OAuth/magic-link, pero conviene
decidir si es un gap intencional o documentarlo.)

### 🟡 H-002-05 (P2) — Cambio de email sin reautenticación

`SecurityPanel.tsx:33-35`: `supabase.auth.updateUser({ email })` se ejecuta sin pedir contraseña actual ni
reautenticación. Una sesión abierta en un dispositivo ajeno permite iniciar secuestro de cuenta por email
(mitigado solo por el doble opt-in de Supabase al email nuevo/antiguo). Recomendable exigir reverificación.

### 🟡 H-002-06 (P2) — Campos de perfil/onboarding sin validar contra catálogo

`country`, `fav_team`, `fav_creator` se guardan con solo `.trim()` tanto en `cuenta/actions.ts:47-49` como
en `onboarding/actions.ts:42-47`. Un cliente manipulado escribe valores arbitrarios en su propio perfil.
`api/registro/route.ts:76-85` **sí** valida contra catálogo → aplicar la misma validación aquí.

### 🟡 H-002-07 (P2) — Open-redirect protocol-relative en onboarding

`onboarding/actions.ts:117` y `OnboardingWizard.tsx:52` usan `next.startsWith("/")` como única defensa;
`//evil.com` pasa el check y `redirect(safeNext)` (sin prefijo de origen) lo trata como protocol-relative.
**Fix:** `next.startsWith("/") && !next.startsWith("//")`. (El callback OAuth NO tiene este fallo porque
prefija `${origin}`.)

### 🟡 H-002-08 (P2) — `/auth/debug` es público y revela la superficie de configuración

`app/auth/debug/page.tsx` es un Server Component **sin gate de auth**. Aunque no imprime secretos, cualquiera
que navegue a `/auth/debug` ve: qué env vars están presentes (incl. `SUPABASE_SERVICE_ROLE_KEY` y su longitud),
el **project ref** de Supabase, los primeros 30 chars de la URL, qué providers OAuth están activos,
`disable_signup`, y las URLs exactas de callback/webhook. Es noindex pero accesible. Análogo a `health`
(H-001-26). **Recomendación:** proteger tras la cookie admin o deshabilitar en producción.

### 🟡 H-002-09 (P2) — Atribución de referido (creador) falsificable

`registro/[creador]` preselecciona el creador, pero el usuario puede cambiarlo (radios) o inyectar cualquier
slug en `raw_user_meta_data.fav_creator` (`FormularioRegistro.tsx:386-399`). Sin verificación server-side ni
firma. Aceptable para marketing; **si se monetiza (comisiones), firmar el slug** en la URL. (Cruza con Fase 11.)

### 🟡 H-002-10 (P2) — Unicidad de username depende de un constraint de DB no verificado

`onboarding/actions.ts` y `cuenta/actions.ts` detectan colisión de username **solo** por el error
"duplicate/unique" de Postgres. Si falta el constraint `UNIQUE` en `profiles.username`, no hay garantía de
unicidad. Verificar que el constraint existe en la DB.

### 🟡 H-002-11 (P2) — Doc `OAUTH-SETUP.md` desactualizado respecto al código

El trigger `handle_new_user` documentado (`OAUTH-SETUP.md:243-249`) solo inserta `(id, email)`, pero el código
**asume** que copia `username`/`fav_creator`/`country`/`fav_team` desde `raw_user_meta_data`
(`FormularioRegistro.tsx:386-399`). El SQL de ejemplo no migra esos campos → onboarding/perfil inconsistente si
se sigue el doc al pie de la letra.

### 🟡 H-002-12 (P2) — Dos caminos de borrado que pueden divergir

Coexisten el **borrado inmediato** (`/cuenta/seguridad` → `api/account/delete`) y una **solicitud manual**
pública (`/eliminar-cuenta` → `api/eliminar-cuenta`, procesada "en hasta 30 días"). Riesgo de datos no borrados
si el proceso manual falla o no se ejecuta. (El abuso del endpoint público ya es **H-001-09** en Fase 1.)

### Hallazgos P3 (menores)
- `birth_date` solo valida formato regex (subsumido en H-002-03). `cuenta/actions.ts:29-32`.
- `FoundersActions.tsx:17-22`: la URL de compartir mete la parte local del email (`email.split("@")[0]`) como
  `name` en `/api/og/founder` → fuga leve de PII en URL compartible.
- `login/page.tsx:51,75`: `next` no se sanea antes de construir el callbackUrl (defensa-en-profundidad ausente;
  hoy el callback lo salva).
- `docs/MOBILE-APP-AUTH-INTEGRATION.md`: expone project ref y Apple Team/Key/App IDs (no son secretos, pero es
  metadata sensible si el repo fuera público).
- `api/registro/route.ts:30-34`: IP tomada de `x-forwarded-for` cruda (solo logging de leads).

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Callback OAuth** (`auth/callback/route.ts`): soporta PKCE (`code`) y OTP cross-device (`token_hash`),
  maneja `?error=` del proveedor, y valida `next` same-origin (`safeNext`, prefijando `${origin}`).
- ✅ **Signout** (`auth/signout/route.ts`): solo POST (no disparable por `<a>` prefetcheado), redirige 303.
- ✅ **Sesión**: `lib/supabase/middleware.ts` refresca la sesión en cada request con `getUser()`; degrada a
  no-op si faltan envs (el sitio sigue vivo).
- ✅ **Protección de `/cuenta/*`**: `requireUser("/cuenta")` en el layout protege todas las subrutas; cada
  server action revalida con `auth.getUser()` antes de mutar y escribe sobre `.eq("id", user.id)`.
- ✅ **Cliente Supabase** (`lib/supabase/client.ts`): solo anon key, nunca service_role; lanza si faltan envs.
- ✅ **Validación de registro**: cliente (`FormularioRegistro.tsx`) y servidor (`api/registro`) con buena
  paridad (email, username 3-30, country ISO-2, fav_team). Buen manejo/humanización de errores en login y registro.
- ✅ **Preferencias/notificaciones**: `upsert onConflict user_id` y API granular por toggle; persisten y
  manejan 401 redirigiendo a login.
- ✅ **Avatar**: MIME + size validados en cliente y servidor (ver Fase 1, `account/avatar` OK).

---

## C. Pendiente de verificación (requiere acceso a la DB)

- Existencia de `ON DELETE CASCADE` real en todas las FK a `auth.users` (especialmente `user_preferences`,
  que no tiene migración en el repo).
- Existencia del constraint `UNIQUE` en `profiles.username`.
- Que el trigger `handle_new_user` desplegado copia los campos de `raw_user_meta_data` que el código asume.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Borrado GDPR explícito por email en `email_subscriptions` + verificar cascade de `user_preferences` | H-002-01 | P1 |
| 2 | Invocar la lógica de borrado directamente (sin self-fetch HTTP) | H-002-02 | P1 |
| 3 | Validar `birth_date` (ISO real + edad mínima) en servidor | H-002-03 | P1 |
| 4 | Decidir/implementar cambio de contraseña; exigir reautenticación en cambio de email | H-002-04/05 | P2 |
| 5 | Validar `country`/`fav_team`/`fav_creator` contra catálogo en cuenta y onboarding | H-002-06 | P2 |
| 6 | Endurecer `next` contra `//` (protocol-relative) en onboarding | H-002-07 | P2 |
| 7 | Proteger/retirar `/auth/debug` en producción | H-002-08 | P2 |
| 8 | Verificar constraint UNIQUE username; actualizar doc OAUTH-SETUP | H-002-10/11 | P2 |
| 9 | Firmar atribución de referido si se monetiza; quitar PII de URL OG | H-002-09, P3 | P2/P3 |

**Criterio de cierre:** borrado GDPR completo y verificado en DB; cambio de email con reautenticación;
`birth_date` y campos de catálogo validados server-side; `/auth/debug` no accesible públicamente.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-002-01 | P1 | `api/account/delete/route.ts` (+`email_subscriptions`, `user_preferences`) | Abierto |
| H-002-02 | P1 | `cuenta/actions.ts:110-121` | Abierto |
| H-002-03 | P1 | `onboarding/actions.ts:50`, `cuenta/actions.ts:29` | Abierto |
| H-002-04 | P2 | `cuenta/seguridad/SecurityPanel.tsx` | Abierto |
| H-002-05 | P2 | `SecurityPanel.tsx:33-35` | Abierto |
| H-002-06 | P2 | `cuenta/actions.ts:47-49`, `onboarding/actions.ts:42-47` | Abierto |
| H-002-07 | P2 | `onboarding/actions.ts:117`, `OnboardingWizard.tsx:52` | Abierto |
| H-002-08 | P2 | `app/auth/debug/page.tsx` | Abierto |
| H-002-09 | P2 | `registro/[creador]`, `FormularioRegistro.tsx:386-399` | Abierto |
| H-002-10 | P2 | `onboarding/actions.ts`, `cuenta/actions.ts` (constraint username) | Abierto |
| H-002-11 | P2 | `docs/OAUTH-SETUP.md:243-249` | Abierto |
| H-002-12 | P2 | `eliminar-cuenta` vs `account/delete` | Abierto |

*(P3 menores documentados en la sección A y en el detalle por archivo.)*

**Referencias cruzadas Fase 1:** `api/eliminar-cuenta` abusable (H-001-09), `api/registro` sin rate-limit
(H-001-11), `api/account/avatar`/`account/delete`/`users/me/profile` sin IDOR (OK).
