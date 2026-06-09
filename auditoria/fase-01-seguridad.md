# Fase 1 — Seguridad transversal

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 7 sub-auditorías paralelas por grupos de endpoints)
**Alcance:** `src/middleware.ts`, `src/lib/admin-auth.ts`, `src/lib/auth-helpers.ts`, `src/lib/supabase/`, `next.config.js`, y los **129 endpoints** de `src/app/api/`.

---

## Resumen ejecutivo

La base de seguridad tiene **aciertos sólidos**: webhook de Stripe verificado y con idempotencia,
cabeceras de seguridad completas (HSTS, X-Frame-Options, COOP/CORP, nosniff), uso de `service_role`
correctamente confinado al servidor tras verificación, y toda la **economía de puntos/monedas**
(Fútcoins/XP, claims) implementada server-side con RPC atómicas e idempotencia por PK.

Sin embargo, aparecen **vulnerabilidades graves** en cuatro frentes:

1. **Crons sin protección efectiva (P0 sistémico):** los 24 crons usan el patrón "verifica el secreto
   *solo si* `CRON_SECRET` está definido". Si la variable falta en cualquier entorno (p.ej. Preview),
   **los 24 quedan abiertos a internet**. Algunos permiten borrar datos, publicar contenido en producción
   o disparar coste de IA/emails masivos.
2. **IA Coach pública sin límite (P0):** 4 endpoints que llaman a Anthropic (`analyze`, `coach`,
   `live`, `oracle`) no exigen sesión ni rate-limit → **abuso de facturación ilimitado**.
3. **Leaderboards manipulables desde el cliente (P0/P1):** Fantasy persiste `totalPoints` enviado por
   el cliente, y Modo Carrera ordena por stats que el cliente fija.
4. **Endpoints públicos abusables (P1/P2):** `eliminar-cuenta` y varios que envían emails a direcciones
   arbitrarias (email-bombing), SVG con XSS almacenado en logos de bar, y panel admin con token en query string.

### Conteo de hallazgos

| Severidad | Nº | 
|-----------|----|
| **P0** | 8 |
| **P1** | 9 |
| **P2** | 14 |
| **P3** | 12 |

### Estado de los criterios de aprobación de la fase

| Criterio | Estado |
|----------|--------|
| Inventario de endpoints con su control de acceso | ✅ Completado (129 endpoints, ver tablas) |
| Cero endpoints sin authz | ❌ Falla (IA coach, varios públicos, crons) |
| RLS verificado | ⚠️ Parcial — `service_role` confinado a servidor; **falta verificar políticas RLS reales en Supabase** (requiere acceso a la consola del proyecto) |

---

## A. Hallazgos transversales / centrales

### 🔴 H-001-01 (P0) — Crons sin fail-closed: abren 24 endpoints si falta `CRON_SECRET`

Todos los crons siguen el patrón:
```ts
const expected = process.env.CRON_SECRET;
if (expected) { /* …verifica header/secreto… */ }   // ← si NO está definido, NO verifica nada
```
**Consecuencia:** si `CRON_SECRET` no está seteado en algún entorno (típicamente los despliegues
*Preview* de Vercel en `*.vercel.app`), los 24 crons son disparables por cualquiera vía `GET`.
Además **20 de 24 aceptan el secreto por query string** (`?secret=…`) → fuga en logs/Referer/proxy.

Los más peligrosos aunque el secreto esté presente (por daño del disparo):

| Cron | Impacto | Sev |
|------|---------|-----|
| `reset-store` | Borra todo el store KV de noticias (`kv.del` x3) | P0 |
| `test-rewrite` | Inyecta artículo arbitrario (`?title/content/img`), lo reescribe con Claude y **lo publica en producción** | P0 |
| `send-daily-digest` | Envío masivo de emails (≤1000 suscriptores) → spam + coste + reputación de dominio | P0 |
| `ingest-news` | Coste IA (Anthropic) + cuota GNews; `?backfill=30` amplifica; push masivo | P0 |
| `generate-blog-post` | Coste IA + push broadcast + email masivo a suscriptores | P0 |

**Recomendación:** helper único `requireCron(req)` **fail-closed**: si `!CRON_SECRET` en producción → `401`;
aceptar solo `Authorization: Bearer` (nunca query string); comparación en tiempo constante.
Aplicarlo a los 24. Verificar en Vercel que `CRON_SECRET` esté definido en Production **y** Preview.

---

### 🔴 H-001-02 (P0) — IA Coach: 4 endpoints públicos que llaman a Anthropic sin auth ni rate-limit

`ia-coach/analyze`, `ia-coach/coach`, `ia-coach/live`, `ia-coach/oracle` no exigen sesión ni limitan
peticiones. El caché **no protege**: la clave de caché se forma con inputs que controla el cliente
(`match`, `state`, `messages`), así que variarlos fuerza cache-miss y llamadas pagas ilimitadas a la
API de Anthropic. Solo `ia-coach/debate` está bien protegido (sesión + Founders Pass + tope de turnos).

- `analyze/route.ts:34-48,81` · `live/route.ts:47-71,104` · `oracle/route.ts:100-123` · `coach/route.ts:44-64`

**Recomendación:** exigir `getCurrentUser()` + rate-limit por usuario/IP (KV) en los cuatro;
acotar/validar los inputs que entran al prompt (prompt-injection). `match-center/narrate` comparte el
mismo defecto (ver H-001-09, P1).

---

### 🟠 H-001-03 (P1) — `next.config.js` ignora errores de TypeScript y ESLint en el build

```js
typescript: { ignoreBuildErrors: true },
eslint:     { ignoreDuringBuilds: true },
```
El build de producción **no falla** ante errores de tipos ni de lint. Esto anula la red de seguridad
de CI (explica por qué los 57 errores de lint de la Fase 0 no rompen el build) y permite desplegar
código con errores de tipo. Riesgo de regresiones silenciosas (incluidas de seguridad).

**Recomendación:** poner ambos en `false` una vez resueltos los hallazgos de la Fase 0, y dejar que el
build falle ante errores. (Relacionado con H-000-01/02/04.)

---

### 🟠 H-001-04 (P1) — Auth admin: contraseña única débil, sin rate-limit, fallback hardcodeado

`src/lib/admin-auth.ts` + `api/admin/login`:
- **Fallback a contraseña conocida** `"zm-admin-dev-only"` si `ADMIN_PASSWORD` no está seteado
  (`admin-auth.ts:21`, `login/route.ts:12`) → bypass total del panel si la env falta en algún entorno.
- El **secreto HMAC de la cookie deriva del propio password** (`admin-auth.ts:47`): comprometer la
  contraseña permite forjar cookies de sesión admin.
- Login **sin rate-limiting / anti-brute-force** y con comparación de contraseña **no constante** (`!==`).

**Recomendación:** exigir `ADMIN_PASSWORD` (fail-closed, sin fallback), secreto de cookie independiente,
rate-limit en `/api/admin/login` y comparación en tiempo constante.

---

### 🟡 H-001-05 (P2) — El middleware NO protege `/api/admin/*`

El guard del middleware usa `url.pathname.startsWith("/admin")`, pero las rutas API empiezan por
`/api/admin` → **no quedan cubiertas** (`middleware.ts:11-14`). Hoy los 8 endpoints `/api/admin/*`
implementan su propia auth, así que ninguno está totalmente expuesto, **pero el comentario en
`registros/csv/route.ts:4-6` afirma falsamente que "el middleware ya fuerza /admin/*"** → cualquier
endpoint futuro que confíe en esa suposición quedará abierto.

**Recomendación:** ampliar el matcher/guard del middleware para cubrir `/api/admin/*`, o documentar que
cada endpoint debe autenticarse por sí mismo (y corregir el comentario engañoso).

---

### 🟡 H-001-06 (P2) — Inconsistencia de auth admin + token en query string (PII en logs)

Coexisten dos esquemas: cookie firmada `zm_admin` (newsletter, csv, bars/plan — correctos) y **token
estático `ADMIN_TOKEN` aceptado por query string** en `monitor`, `registros`, `player-photos`.
`/api/admin/registros` vuelca **PII completa (email, nombre, IP)** protegida solo por `?token=` →
el token y, por tanto, el acceso a PII, se filtran en logs de acceso/Referer/historial.

**Recomendación:** unificar en la cookie firmada; nunca aceptar el token por query string.

### 🟡 H-001-07 (P2) — Path traversal en `api/admin/player-photos`

`slug` se concatena a `path.join(cwd,"data","teams",slug+".json")` sin sanear (`player-photos/route.ts:48-53`)
→ lectura de `.json` arbitrarios fuera del directorio. Solo lectura, pero debe restringirse con
allowlist/regex.

### 🟡 H-001-08 (P2) — CSP contiene `'unsafe-eval'` pese a documentar lo contrario

`next.config.js:71`: `script-src … 'unsafe-eval' …`. El comentario adyacente dice "'unsafe-eval'
bloqueado", pero está presente → debilita la CSP frente a XSS. (`'unsafe-inline'` es necesario para el
JSON-LD inline de Next; `'unsafe-eval'` normalmente no.)

**Recomendación:** quitar `'unsafe-eval'` y verificar que nada en runtime lo requiera.

---

## B. Hallazgos por módulo (resumen; detalle en tablas de cada grupo)

### B.1 Auth y cuenta

| ID | Endpoint | Sev | Hallazgo |
|----|----------|-----|----------|
| H-001-09 | `api/eliminar-cuenta` (POST, **público**) | P1 | Sin sesión ni verificación de propiedad del email: dispara correos de "solicitud de borrado RGPD" a víctimas arbitrarias + satura soporte. Sin rate-limit. (`route.ts:31-57,132-143`) |
| H-001-10 | `api/auth/check-email` | P2 | Oráculo de enumeración de usuarios + proveedor (apple/google/email). Rate-limit eludible (IP de `x-forwarded-for`, fail-open). |
| H-001-11 | `api/registro`, `api/waitlist`, `api/app-link/email` | P2 | Sin rate-limit (o eludible) → registro masivo / email-bombing a terceros. |

**OK:** `account/avatar`, `account/delete`, `cuenta/cancelar`, `users/me/profile` (sin IDOR, id de sesión),
`auth/apple/notifications` (verifica firma JWT), `app/redirect` (sin open-redirect).

### B.2 Pagos y bares

| ID | Endpoint | Sev | Hallazgo |
|----|----------|-----|----------|
| H-001-12 | `api/bars/logo` (POST) | P1 | Acepta `image/svg+xml` y lo sirve desde bucket público con `contentType` del cliente, validando solo MIME por cabecera (sin magic bytes) → **XSS almacenado** servido bajo el dominio. (`bars/logo/route.ts:26,66,103`) |
| H-001-13 | `api/bars` (PATCH), `api/bars/prizes` | P2 | Campos de texto libre (name, welcome_message, prize title/description…) almacenados sin sanear → XSS almacenado si el front no escapa. |
| H-001-14 | `api/checkout` | P3 | Loguea `secretKeyPrefix` (prefijo de `STRIPE_SECRET_KEY`) en logs de Vercel. |

**OK (muy bien resuelto):** precios de `checkout` y `bars/checkout` fijados en servidor desde catálogo
(anti-manipulación de precio); sin IDOR (todo por `getBarByOwner(user.id)` + revalidación `owner_user_id`);
metadata correcta para el webhook; `bars/export`/`qr`/`prizes` confinados al bar propio.

### B.3 Juego — predicciones, bracket, ranking

| ID | Endpoint | Sev | Hallazgo |
|----|----------|-----|----------|
| H-001-15 | `api/bracket/capsule/seal` (POST, **sin auth**) | P2 | Email del body → email-bombing a terceros + enumeración (409 "already_sealed"). |
| H-001-16 | `api/predictions/bracket` (PUT) | P2 | Sin lock de deadline: se puede sobrescribir el bracket en cualquier momento (incluso con partidos ya iniciados) antes de que el cron puntúe. |
| H-001-17 | `api/predictions/leagues/[id]` (GET) | P3 | Lee la clasificación (usernames/avatars) de cualquier liga por id sin validar membresía. |

**OK (muy bien resuelto):** predicciones respetan `checkOpen`/deadline y propiedad; economía con RPC
atómicas idempotentes (boosts, cosmetics, battlepass claim, duels); scoring 100% server-side;
`predictions/resolve` protegido por `CRON_SECRET`.

### B.4 Juego — fantasy, modo carrera, trivia, micro

| ID | Endpoint | Sev | Hallazgo |
|----|----------|-----|----------|
| H-001-18 | `api/fantasy/team` (PUT) | **P0** | Persiste `state.totalPoints` enviado por el cliente en `fantasy_teams.total_points`, que ordena el **leaderboard global** → manipulación trivial. El scoring de Fantasy NO es server-side. (`store.server.ts:54`) |
| H-001-19 | `api/fantasy/team` (PUT) | P1 | `validateTeam` (presupuesto/formación/MAX_PER_NATION) solo corre en el cliente; el server acepta cualquier alineación. |
| H-001-20 | `api/fantasy/team` (PUT) | P1 | `recordGameweekScore` guarda `gs.points` del body sin recalcular (ranking semanal). |
| H-001-21 | `api/modo-carrera/save` (PUT) | P1 | El ranking DT ordena por `overall`/reputación que el cliente fija (acotados por clamps, pero maximizables) → manipulación de leaderboard. |
| H-001-22 | `api/trivia/finish` (POST) | P2 | `anonId`/`name` del cliente entran al leaderboard público (spam de ranking anónimo; no afecta Fútcoins). |

**OK (muy bien resuelto):** **Trivia** no filtra respuestas correctas al cliente y puntúa server-side
con anti-doble-respuesta; **Micro** puntúa por cron ignorando valores del cliente, con idempotencia y
authz de duelos correcta; recompensas de misión/refill de Modo Carrera idempotentes y server-side.

### B.5 Live, IA y notificaciones

| ID | Endpoint | Sev | Hallazgo |
|----|----------|-----|----------|
| H-001-23 | `api/match-center/narrate` (POST, **sin auth**) | P1 | Llama a IA sin auth ni rate-limit (cap 12 eventos/req pero sin tope de requests) → abuso de coste. |
| H-001-24 | `api/notifications/push/unsubscribe`, `push/resubscribe`, `match-center/follow` | P2 | Operan sobre `endpoint`/`oldEndpoint` arbitrarios sin probar posesión → baja/manipulación de subscripciones ajenas. |
| H-001-25 | `api/notify-module/[slug]` (POST) | P2 | Envía email de confirmación a dirección del cliente; rate-limit por-email evadible cambiando el email → email-bombing. |
| H-001-26 | `api/health` (GET) | P2 | Expone qué secretos/env están presentes vs `missing` (Stripe, VAPID, CRON_SECRET, SMTP, service_role…), latencias internas, región y errores crudos a un endpoint anónimo. |

**OK:** `match-center/comments` (sesión, identidad server-side, anti-flood, React auto-escapa el render);
`notifications/preferences` y `digest/*` (id de sesión o token HMAC firmado, sin IDOR);
`push/test` (confinado al usuario); `og/founder` (render PNG, sin XSS); `calendar`/`friendlies` (sin SSRF).

---

## C. Aspectos correctos verificados (no regresar)

- ✅ **Webhook de Stripe** (`api/stripe/webhook`): verifica firma con `STRIPE_WEBHOOK_SECRET`, lee raw
  body, idempotencia vía `SADD`. Correcto.
- ✅ **Cabeceras de seguridad** (`next.config.js`): HSTS con preload, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, CSP con
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`. (Salvedad: `'unsafe-eval'`, H-001-08.)
- ✅ **`service_role`** confinado al servidor y usado siempre tras verificación (sesión o firma JWT).
- ✅ **Economía de juego** (Fútcoins/XP) con puerta única `grant/spendCoins`, RPC atómicas e idempotencia
  por PK; scoring de predicciones/trivia/micro server-side.
- ✅ **Sin IDOR** en endpoints con sesión auditados de cuenta y bares (id siempre de la sesión).
- ✅ `/embed/*` relaja `X-Frame-Options` a `ALLOWALL` **a propósito** (embeds externos) — comportamiento
  intencional, documentado; revisar en Fase 15 que solo afecte a contenido público.

---

## D. Pendiente de verificación (requiere acceso a infra)

- **Políticas RLS reales en Supabase**: el código confina `service_role`, pero hay que confirmar en la
  consola de Supabase que RLS está **activo** en `profiles`, `predictions`, `fantasy_teams`,
  `bars`, tablas de notificaciones, etc., y que las políticas son correctas. No verificable solo desde el repo.
- **Presencia efectiva de `CRON_SECRET` y `ADMIN_PASSWORD`** en todos los entornos de Vercel
  (Production + Preview). Determinante para H-001-01 y H-001-04.

---

## E. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Helper `requireCron()` fail-closed + Bearer-only en los 24 crons | H-001-01 | P0 |
| 2 | Auth + rate-limit en IA coach (analyze/coach/live/oracle) y narrate | H-001-02, H-001-23 | P0 |
| 3 | Fantasy: recálculo server-side de puntos + `validateTeam` en server | H-001-18/19/20 | P0/P1 |
| 4 | Modo Carrera: derivar ranking de datos no manipulables o validar server-side | H-001-21 | P1 |
| 5 | Admin: exigir `ADMIN_PASSWORD`, secreto de cookie propio, rate-limit, quitar token en query | H-001-04/06 | P1 |
| 6 | `eliminar-cuenta`: exigir sesión + rate-limit | H-001-09 | P1 |
| 7 | `bars/logo`: quitar SVG / verificar magic bytes / forzar Content-Disposition | H-001-12 | P1 |
| 8 | Rate-limit robusto (no fiable en `x-forwarded-for`) en endpoints de email/registro/IA | H-001-10/11/25 | P2 |
| 9 | Probar posesión de subscription en push unsubscribe/resubscribe/follow | H-001-24 | P2 |
| 10 | `health` minimal; quitar `'unsafe-eval'`; sanear texto libre de bares; path-allowlist player-photos | H-001-26/08/13/07 | P2 |
| 11 | Poner `ignoreBuildErrors`/`ignoreDuringBuilds` en `false` (tras Fase 0) | H-001-03 | P1 |

**Criterio de cierre de la fase:** P0 resueltos y verificados; P1 resueltos o con ticket y mitigación;
RLS confirmado en Supabase; `CRON_SECRET`/`ADMIN_PASSWORD` confirmados en todos los entornos.

---

## Registro de hallazgos

| ID | Sev | Endpoint/Archivo | Estado |
|----|-----|------------------|--------|
| H-001-01 | P0 | `api/cron/*` (24, patrón skip-if-unset) | Abierto |
| H-001-02 | P0 | `api/ia-coach/{analyze,coach,live,oracle}` | Abierto |
| H-001-03 | P1 | `next.config.js` (ignore TS/ESLint) | Abierto |
| H-001-04 | P1 | `lib/admin-auth.ts`, `api/admin/login` | Abierto |
| H-001-05 | P2 | `src/middleware.ts` (no cubre /api/admin) | Abierto |
| H-001-06 | P2 | `api/admin/{monitor,registros,player-photos}` (token en query, PII) | Abierto |
| H-001-07 | P2 | `api/admin/player-photos` (path traversal) | Abierto |
| H-001-08 | P2 | `next.config.js` (CSP unsafe-eval) | Abierto |
| H-001-09 | P1 | `api/eliminar-cuenta` | Abierto |
| H-001-10 | P2 | `api/auth/check-email` | Abierto |
| H-001-11 | P2 | `api/registro`, `api/waitlist`, `api/app-link/email` | Abierto |
| H-001-12 | P1 | `api/bars/logo` (SVG XSS) | Abierto |
| H-001-13 | P2 | `api/bars` PATCH, `api/bars/prizes` (XSS texto libre) | Abierto |
| H-001-14 | P3 | `api/checkout` (log de secretKeyPrefix) | Abierto |
| H-001-15 | P2 | `api/bracket/capsule/seal` | Abierto |
| H-001-16 | P2 | `api/predictions/bracket` (sin deadline lock) | Abierto |
| H-001-17 | P3 | `api/predictions/leagues/[id]` GET | Abierto |
| H-001-18 | P0 | `api/fantasy/team` PUT (totalPoints del cliente) | Abierto |
| H-001-19 | P1 | `api/fantasy/team` PUT (sin validateTeam server) | Abierto |
| H-001-20 | P1 | `api/fantasy/team` PUT (gameweek points del cliente) | Abierto |
| H-001-21 | P1 | `api/modo-carrera/save` PUT (ranking manipulable) | Abierto |
| H-001-22 | P2 | `api/trivia/finish` (anonId ranking) | Abierto |
| H-001-23 | P1 | `api/match-center/narrate` (IA sin auth) | Abierto |
| H-001-24 | P2 | `api/notifications/push/{unsubscribe,resubscribe}`, `match-center/follow` | Abierto |
| H-001-25 | P2 | `api/notify-module/[slug]` | Abierto |
| H-001-26 | P2 | `api/health` (info disclosure) | Abierto |

*(Hallazgos P3 adicionales menores documentados en las sub-auditorías: enumeración leve en
`registro`/`waitlist`, `createDuel` sin anti-spam, `fantasy/live` sin auth, `trivia/stats` por anonId,
fugas de `error.message` en `users/me/profile`, `account/avatar`, `update-team-injuries`, etc.)*
