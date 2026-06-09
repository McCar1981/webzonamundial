# Mis cambios en este PR

> Commit: `c3a316b` — *auditoria: Fase 0-1-2-3 — seguridad, auth, GDPR, pagos, fundaciones*

---

## Fase 0 — Cimientos (fix build + lint)

- `force-dynamic` en páginas admin que usan KV (evitan error de build)
- Fix de hook `useState` condicional en `DeepTabs`
- Regenerado `.env.example` con 67 variables
- 57 errores de lint corregidos (comentarios JSX, entidades sin escapar)
- Eliminado `NODE_TLS_REJECT_UNAUTHORIZED=0` de scripts (inseguro)

## Fase 1 — Seguridad transversal

- **25 endpoints cron** protegidos con `requireCron()` fail-closed + `timingSafeEqual`
- **IA Coach** endpoints con auth + rate-limit
- **Fantasy** `total_points` recalculado server-side (anti-trampa)
- **Admin auth** sin fallback hardcodeado, usando `timingSafeEqual`
- **Borrado de cuenta** (`api/eliminar-cuenta`) requiere sesión (mitiga email-bombing)
- Eliminado `image/svg+xml` de subida de logos de bares (XSS almacenado)
- **Middleware** protege `/api/admin/*`
- Rate-limit fail-closed en `auth/check-email` y registro
- Sanitizado texto libre en bares (XSS)
- Health endpoint sin array de secrets (no filtra datos sensibles)

## Fase 2 — Auth, cuenta, sesión (GDPR)

- **Borrado GDPR completo**: incluye `email_subscriptions` + `user_preferences` de forma explícita
- `deleteAccountAction` sin self-fetch (usa admin client directo)
- `birth_date` validada ISO real + mayoría de edad (18+)
- **Cambio de email** con reautenticación (sesión < 10 min)
- `country` / `fav_team` / `fav_creator` validados contra catálogo
- Open-redirect protocol-relative bloqueado (`//evil.com`)
- `/auth/debug` protegido en producción (cookie admin)

## Fase 3 — Pagos (Stripe)

- Entitlement **Founder** vinculada a `user.id` con índice inverso en KV
- `success_url` apunta a `/cuenta/founders-pass`
- Flash optimista del bar con mensaje "procesando"
- Precios `/premium` servidos desde catálogo server (`lib/stripe/pricing.ts`)
- Webhook maneja `charge.dispute.created` (revoca entitlement automáticamente)

## Archivos nuevos

- `src/lib/profile-validation.ts` — validación robusta de perfil
- `src/lib/stripe/pricing.ts` — catálogo de precios server-side
- `auditoria/FIXES-APLICADOS-2026-06-09.md` — registro de fixes aplicados

## Otros commits previos

- `7aa5815` / `5b5df2` — `mejorascompletas` (mejoras generales anteriores)
