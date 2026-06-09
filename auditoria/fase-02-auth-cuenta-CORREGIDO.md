# Fase 2 — Auth, cuenta y sesión (CORREGIDO)

**Estado:** 🟩 Hallazgos corregidos
**Fecha corrección:** 2026-06-09
**Auditor original:** 2026-06-08

---

## Resumen de correcciones aplicadas

| Hallazgo | Severidad | Estado | Archivos modificados |
|----------|-----------|--------|---------------------|
| H-002-01 | P1 | ✅ Corregido | `api/account/delete/route.ts`, `cuenta/actions.ts` |
| H-002-02 | P1 | ✅ Corregido | `cuenta/actions.ts` |
| H-002-03 | P1 | ✅ Corregido | `cuenta/actions.ts`, `onboarding/actions.ts`, `lib/profile-validation.ts` (nuevo) |
| H-002-05 | P2 | ✅ Corregido | `cuenta/actions.ts`, `cuenta/seguridad/SecurityPanel.tsx` |
| H-002-06 | P2 | ✅ Corregido | `cuenta/actions.ts`, `onboarding/actions.ts`, `lib/profile-validation.ts` |
| H-002-07 | P2 | ✅ Corregido | `onboarding/actions.ts`, `onboarding/OnboardingWizard.tsx` |
| H-002-08 | P2 | ✅ Corregido | `auth/debug/page.tsx` |

**Hallazgos pendientes (requieren decisión de producto o verificación externa):**
- H-002-04: No existe cambio de contraseña → **Por diseño** (solo OAuth/magic-link, sin contraseñas)
- H-002-09: Atribución de referido falsificable → Aceptable para marketing; firmar si se monetiza
- H-002-10: Unicidad username depende de constraint DB → Requiere verificación en DB
- H-002-11: Doc OAUTH-SETUP.md desactualizado → Requiere actualización manual del doc
- H-002-12: Dos caminos de borrado → Requiere decisión de producto (¿mantener ambos?)

---

## Detalle de cambios

### H-002-01 — Borrado GDPR completo

**Antes:** `api/account/delete/route.ts` ejecutaba solo `admin.auth.admin.deleteUser(user.id)` + limpieza de avatares. Confiaba 100% en `ON DELETE CASCADE`.

**Después:** Antes de `deleteUser`, se ejecuta borrado explícito:
1. `email_subscriptions` por `email` (donde `user_id` es NULL, el cascade no aplica)
2. `user_preferences` por `user_id` (no tiene migración FK verificable en el repo)
3. Luego avatares en storage
4. Finalmente `deleteUser`

La misma lógica se duplica en `deleteAccountAction` (server action) para el caso de borrado directo sin pasar por HTTP.

### H-002-02 — Eliminar self-fetch frágil

**Antes:** `cuenta/actions.ts:110-121` hacía `fetch(${NEXT_PUBLIC_SITE_URL}/api/account/delete)` con header `x-user-id` que el endpoint ignoraba.

**Después:** `deleteAccountAction` crea el admin client `createClient(url, serviceKey)` directamente en la server action, sin saltar por HTTP. Elimina la dependencia de `NEXT_PUBLIC_SITE_URL` para esta operación crítica.

### H-002-03 — Validar birth_date en servidor

**Antes:** Validación regex básica `^\d{4}-\d{2}-\d{2}$` que aceptaba `2026-13-40` y fechas futuras. No verificaba mayoría de edad.

**Después:** Nuevo archivo `lib/profile-validation.ts` con:
- `isValidIsoDate()`: valida fecha real (rechaza meses/días imposibles, fechas futuras)
- `calculateAge()`: calcula edad exacta
- `isAdult(birthDate, minAge=18)`: verifica mayoría de edad

Aplicado en `updateProfileAction` (cuenta) y `completeOnboardingAction` (onboarding). Error: *"Debes ser mayor de edad (18+) para participar en premios"*.

### H-002-05 — Cambio de email con reautenticación

**Antes:** `SecurityPanel.tsx:33-35` llamaba `supabase.auth.updateUser({ email })` directamente desde el cliente, sin verificación adicional.

**Después:**
1. Nueva server action `updateEmailAction` en `cuenta/actions.ts`
2. Verifica `user.last_sign_in_at`: si tiene >10 min, rechaza con *"Por seguridad, cierra sesión y vuelve a entrar antes de cambiar tu email"*
3. El cambio de email solo se ejecuta si la sesión es reciente
4. `SecurityPanel.tsx` ahora llama `updateEmailAction(fd)` en vez de `supabase.auth.updateUser()`

### H-002-06 — Validar campos contra catálogo

**Antes:** `country`, `fav_team`, `fav_creator` se guardaban con solo `.trim()`, permitiendo valores arbitrarios.

**Después:** Nuevas funciones en `lib/profile-validation.ts`:
- `validateCountry()`: busca en `COUNTRIES`, devuelve `null` si no existe
- `validateFavTeam()`: busca en `SELECCIONES`, devuelve `null` si no existe
- `validateFavCreator()`: busca en `CREADORES`, devuelve `null` si no existe

Aplicado en `updateProfileAction` y `completeOnboardingAction`. Valores no encontrados en catálogo se descartan silenciosamente (null), consistente con el comportamiento de `api/registro/route.ts`.

### H-002-07 — Open-redirect protocol-relative

**Antes:** `next.startsWith("/")` como única defensa; `//evil.com` pasaba el check.

**Después:** Doble chequeo: `next.startsWith("/") && !next.startsWith("//")` en:
- `onboarding/actions.ts` (`skipOnboardingAction`)
- `onboarding/OnboardingWizard.tsx` (`finishDestination`)

### H-002-08 — Proteger /auth/debug

**Antes:** Página pública que revelaba env vars presentes, project ref, providers activos, URLs de callback.

**Después:** En producción (`NODE_ENV === "production"`), la página verifica la cookie `admin_session` contra `ADMIN_DEBUG_TOKEN`. Si no coincide, redirige a `/login`. En desarrollo siempre es accesible.

**Nota:** Para acceder en producción, establecer `ADMIN_DEBUG_TOKEN` en Vercel y la cookie `admin_session` con ese valor.

---

## Archivos modificados

```
src/app/api/account/delete/route.ts
src/app/cuenta/actions.ts
src/app/cuenta/seguridad/SecurityPanel.tsx
src/app/onboarding/actions.ts
src/app/onboarding/OnboardingWizard.tsx
src/app/auth/debug/page.tsx
src/lib/profile-validation.ts          (nuevo)
```

## Pendiente de verificación externa (requiere acceso a DB)

- [ ] Existencia de `ON DELETE CASCADE` real en todas las FK a `auth.users`
- [ ] Existencia del constraint `UNIQUE` en `profiles.username`
- [ ] Que el trigger `handle_new_user` desplegado copia los campos de `raw_user_meta_data`
