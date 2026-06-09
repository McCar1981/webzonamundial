# Fase 12 — Notificaciones: push y email

**Estado:** 🟥 Hallazgos abiertos (sin P0 nuevos; varios P1)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 3 sub-auditorías en paralelo)
**Alcance:** `lib/push-notifications.ts`, `lib/push-client.ts`, `lib/email.ts`, `lib/email-subscriptions.ts`, `lib/notification-preferences.ts`, `lib/match-reminders.ts`, `api/notifications/*` (push subscribe/unsubscribe/resubscribe/test, preferences, digest subscribe/unsubscribe), `api/notify-module/[slug]`, `api/cron/send-daily-digest`, `api/cron/match-reminders`, `app/cuenta/notificaciones`, `admin/newsletter` (+ su `api/admin/newsletter`).

---

## Resumen ejecutivo

La **infraestructura** de notificaciones es sólida en su núcleo: Web Push con VAPID server-only, manejo de
expiraciones (410 → borrar, 5 fallos → borrar), tokens de baja firmados HMAC, y un modelo de preferencias por
(categoría, canal) bien diseñado. El **problema no es la fontanería sino el cableado y el cumplimiento**:

1. **El recordatorio pre-partido no llega a nadie** (H-012-01, P1): el cron emite a la categoría
   `predictions-reminder`, que en la UI está **deshabilitada** ("Próximamente") y que ninguna suscripción puede
   llevar → 0 destinatarios. Función implementada pero **muerta en la práctica**.
2. **El digest diario no es idempotente** (H-012-02, P1): `markSent` escribe `last_sent_at` pero el selector de
   destinatarios **no lo filtra** → re-ejecutar el cron (reintento, disparo manual, o el bug de auth fail-open)
   reenvía el digest a **todos**.
3. **El digest se corta en 1000 suscriptores** (H-012-03, P1): el cron pide `limit:1000` sin bucle de `offset` →
   a partir de ahí, los demás **nunca** reciben el correo (cap silencioso).
4. **La newsletter de admin envía a toda la lista de registros sin enlace de baja** (H-012-04, P1 legal): ignora
   `email_subscriptions`/`notification_preferences` y el pie no incluye "darse de baja" → riesgo GDPR/ePrivacy y de
   reputación de dominio.

Además se **re-confirman** tres hallazgos sistémicos ya abiertos en fases previas (no se recuentan aquí):
crons fail-open (**H-001-01**), push sin prueba de posesión (**H-001-24**), y email a destinatarios arbitrarios en
`notify-module` (**H-001-25**) — con detalle nuevo en cada uno.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 (los de nivel P0 son re-confirmaciones de Fase 1) |
| **P1** | 4 |
| **P2** | 7 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| web-push: VAPID, suscripción/baja, endpoints caducados | ✅ VAPID server-only; 410/5-fallos → borra. ⚠️ baja/alta sin prueba de posesión (H-001-24) |
| Email (nodemailer): plantillas, deliverability, baja válida | ⚠️ Digest sí lleva baja firmada; **newsletter NO** (H-012-04) |
| Respeto de preferencias y consentimiento | ⚠️ Digest respeta opt-out (salvo fail-open en error de DB, H-012-06); **newsletter lo ignora** (H-012-04) |
| Recordatorios de partido a la hora correcta | ❌ **No llegan a nadie** (H-012-01); además hora solo en ET (H-005-01) |
| Sin envíos duplicados ni a usuarios dados de baja | ❌ Digest **sin dedup** → reenvío masivo posible (H-012-02) |

---

## A. Hallazgos nuevos

### 🔴 H-012-01 (P1) — El recordatorio pre-partido se emite a una categoría que nadie puede tener → 0 destinatarios

`lib/match-reminders.ts:19` fija `const CATEGORY = "predictions-reminder"` y `runMatchReminders` llama
`broadcastPush({ kind: CATEGORY, ... })` (`match-reminders.ts:90-99`).

`broadcastPush` → `listSubscriptionsForKind("predictions-reminder")` resuelve destinatarios por **dos vías**
(`push-notifications.ts:136-234`): (a) `notification_preferences` con `category="predictions-reminder"`,
`channel="push"`, `enabled=true`; y (b) `push_subscriptions` cuyo `kinds[]` contenga `"predictions-reminder"`.

**Ninguna de las dos puede tener filas:**
- En la UI (`NotificacionesPanel.tsx:89-99`) la categoría `predictions-reminder` está `status:"soon"` →
  **toggle deshabilitado**; el usuario no puede activar la preferencia.
- `subscribeToPush` registra siempre `kinds:["news"]` (`NotificacionesPanel.tsx:243`), nunca
  `"predictions-reminder"`.

→ El cron corre cada 10 min, detecta partidos "due" y envía a **cero** dispositivos. **Función muerta.**

Agravante: la categoría está **mal etiquetada**. La UI la describe como "Antes del cierre de cada partido"
(recordatorio de *predicciones*), pero el cron manda "Falta poco: X vs Y · arranca a las HH:MM" 90 min antes del
*saque*. Aunque se activara, el rótulo no corresponde al contenido.

**Recomendación:** crear una categoría real "Recordatorio de partido" (activa, con toggle), o reutilizar una
existente, y que el cron emita a ese `kind`. Verificar end-to-end que un dispositivo suscrito la recibe.

### 🔴 H-012-02 (P1) — El digest diario no es idempotente: se puede reenviar a todos

`api/cron/send-daily-digest`: tras enviar, llama `markSent(ids)` que solo escribe `last_sent_at`
(`email-subscriptions.ts:156-167`). Pero `listActiveSubscribers` selecciona por `unsubscribed_at IS NULL`
**sin filtrar `last_sent_at`** (`email-subscriptions.ts:137-143`). No hay marcador "ya enviado hoy".

→ Cualquier segunda invocación el mismo día (reintento de Vercel, disparo manual, o explotando el fail-open de
auth de H-001-01) **reenvía el digest a todos los suscriptores**. El comentario del cron promete "evitar
double-sends" pero no hay guarda por fecha. **Idempotencia rota.**

**Recomendación:** marcar dedup por día (p.ej. `last_sent_at::date = today` excluye) o un flag en KV
`digest:sent:{yyyy-mm-dd}` con NX, igual que hace `match-reminders` con su dedup.

### 🔴 H-012-03 (P1) — El digest se corta silenciosamente en 1000 suscriptores

El cron pide `listActiveSubscribers({ kind:"daily-digest", limit:1000 })` **sin bucle de paginación** (no usa
`offset`). `listActiveSubscribers` soporta `offset` pero el cron nunca itera. A partir de 1000 activos, el resto
**no recibe el digest jamás** y nada lo registra (cap silencioso — mismo patrón "truncado sin avisar" de fases
anteriores).

**Recomendación:** paginar en bucle hasta agotar, o documentar y alertar el límite.

### 🔴 H-012-04 (P1 — legal/consentimiento) — La newsletter de admin envía a toda la lista de registros sin baja ni respeto de opt-outs

`api/admin/newsletter/route.ts:72-82`: toma **todos** los `registros` (lista de pre-registro / leads), filtra solo
por `kind` opcional, deduplica y envía con `sendEmail` en lotes. El cuerpo se compone con `brandedEmail`, cuyo pie
solo dice "Si no esperabas este email, puedes ignorarlo" (`email.ts:234-235`) — **sin enlace de baja**.

Problemas:
1. **Sin mecanismo de baja** en un correo de difusión masiva → incumple CAN-SPAM / ePrivacy y daña la reputación
   del dominio.
2. **Ignora el consentimiento existente**: no cruza con `email_subscriptions.unsubscribed_at` ni con
   `notification_preferences`. Un usuario que se dio de baja del digest **igualmente recibe** la newsletter.
3. La base son *leads de pre-registro*, cuya base de consentimiento para marketing es discutible.

**Recomendación:** enviar solo a suscriptores con consentimiento, incluir `buildUnsubscribeToken` + enlace de baja
en cada correo (ya existe la maquinaria), y excluir bajas. (Cruza con Fase 4 admin y Fase 19 legal.)

### 🟡 H-012-05 (P2) — `resubscribe` pierde `userId` y `kinds` al rotar el endpoint

`api/notifications/push/resubscribe/route.ts:45-48` llama `savePushSubscription` **sin `userId` ni `kinds`**. En
una rotación legítima del navegador, la fila nueva queda **anónima** y con `kinds` por defecto `["news"]` → un
usuario logueado puede dejar de recibir categorías que sí había consentido (las que dependían de su `user_id` vía
`notification_preferences`). Además `deletePushSubscription(oldEndpoint)` no comprueba el resultado.

### 🟡 H-012-06 (P2 — consentimiento) — El filtro de opt-out del digest falla ABIERTO ante error de DB

En `send-daily-digest`, si la consulta de `notification_preferences` (category=news, channel=email, enabled=false)
lanza, se registra y se continúa con un set de opted-out **vacío** → un fallo transitorio de Supabase provoca que
usuarios que se habían dado de baja por preferencia **reciban** el digest. Debería fallar cerrado (no enviar a
quienes no se pueda confirmar) o abortar.

### 🟡 H-012-07 (P2 — transparencia) — Toggles inertes y un push activo sin toggle

`NotificacionesPanel.tsx:55-144`: 6 de 8 categorías están `status:"soon"` con toggle deshabilitado y badge
"Próximamente" (honesto, pero muchas filas visibles que no hacen nada). En paralelo, la **única** categoría push que
sí se emite de forma recurrente (recordatorio de partido, vía `predictions-reminder` deshabilitada — H-012-01) **no
tiene un toggle usable** → el usuario no puede ni activarla ni darse de baja de ella. Incoherencia UI↔envío real.

### 🟡 H-012-08 (P2) — Los crons aceptan el secreto por query string (`?secret=`)

`send-daily-digest` y `match-reminders` aceptan `CRON_SECRET` por query param además de cabecera. Los secretos en
URL acaban en logs de acceso de Vercel, historial y referers. (Detalle del patrón sistémico H-001-01.) Header-only.

### 🟡 H-012-09 (P2) — Token de baja: fallback hardcodeado, HMAC truncado y comparación no constante

`email-subscriptions.ts:179-185`: `getUnsubSecret()` cae a `"fallback-do-not-use-in-production"` si faltan
`EMAIL_UNSUB_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`. Además el HMAC se trunca a 24 hex (96 bits, `:199,224`) y se
compara con `!==` en vez de `timingSafeEqual` (`:225`). Riesgo real bajo (forjar solo permite dar de baja un email
conocido; el service-role suele estar presente), pero es deuda de criptografía.

### 🟡 H-012-10 (P2) — `notify-module`: TTL de rate-limit no atómico

`api/notify-module/[slug]/route.ts:35-36`: `kv.incr` seguido de `kv.expire` por separado. Si el proceso muere entre
ambas, la clave **no expira** y el bucket queda saturado permanentemente (DoS del par email/IP legítimo). Usar
SET NX EX o pipeline atómico.

### 🟡 H-012-11 (P2 — PII) — La newsletter expone emails de muestra al cliente y permite blast sin límite

`NewsletterComposer.tsx:179-186`: el dry-run pinta `result.sample` (primeros 10 destinatarios = emails) en el DOM.
Y `kind:"all"` con `limit` vacío = envío sin tope, tras un único `confirm()` nativo (`NewsletterComposer.tsx:151`).
Protegido por cookie admin (no es público), pero sigue siendo fuga de PII a cliente + blast con guarda mínima.

### Hallazgos P3 (menores)
- **Baja por GET** (`digest/unsubscribe`): el enlace del email hace la baja por `GET`; prefetchers de clientes de
  correo pueden auto-dispararla (baja no deseada). Norma: interstitial de confirmación + POST. Impacto bajo (la baja
  es idempotente y "segura").
- **`kinds` sin validar** en `push/subscribe` (`subscribe/route.ts:48`): se pasa `body.kinds` tal cual; gobierna qué
  pushes recibe el dispositivo.
- **`locale` sin validar** en `push/subscribe`.
- **`kind` del token sin validar contra el enum** (`email-subscriptions.ts:226` cast ciego); va firmado, riesgo bajo.

---

## B. Hallazgos heredados / re-confirmados (NO se recuentan en esta fase)

| Patrón | ID original | Detalle nuevo encontrado en Fase 12 |
|--------|-------------|--------------------------------------|
| Crons fail-open: auth solo "si el secreto existe" | **H-001-01** (P0) | Confirmado en `send-daily-digest` y `match-reminders`; sin `CRON_SECRET` ambos son públicos y disparan email/push masivo |
| Push sin prueba de posesión | **H-001-24** | `push/unsubscribe` borra por `endpoint` sin auth → **DoS de silenciado**: quien conozca el endpoint de una víctima borra su suscripción. `subscribe` acepta suscripciones anónimas sin límite |
| Email a destinatarios arbitrarios | **H-001-25** | `notify-module` confirmado; **detalle nuevo**: el rate-limit `modint:ratelimit:{email}:{ip}` incluye el email en la clave → cada víctima tiene su propio cupo (sin tope agregado); IP spoofable por `x-forwarded-for` |
| Husos horarios sin aplicar | **H-005-01** | El push de recordatorio muestra la hora **solo en ET**; audiencia ES/MX/LatAm ve hora ajena |

---

## C. Aspectos correctos verificados (no regresar)

- ✅ **VAPID server-only** (`push-notifications.ts:57-72`): claves privadas nunca al cliente; subject configurable.
- ✅ **Gestión de expiraciones**: 410/404 → borra la fila (`:266-274, 355-357`); 5 fallos → borra
  (`markFailureOrDelete :280-297`); éxito resetea `failure_count` (`markSuccess`).
- ✅ **`/preferences` sin IDOR**: GET/POST derivan identidad de `getCurrentUser()` y usan `user.id`; nunca un
  `userId` del body; 401 fail-closed; categoría/canal validados contra allowlist (`preferences/route.ts:56-78`).
- ✅ **`/push/test` autenticado y acotado**: 401 sin sesión; query `.eq("user_id", user.id)` → solo empuja a las
  suscripciones propias (`test/route.ts:19-35`).
- ✅ **`/digest/subscribe` no permite suscribir a terceros**: el email sale de `user.email` de la sesión, no del
  body (`subscribe/route.ts:14-24`).
- ✅ **`/digest/unsubscribe` verifica HMAC** y solo da de baja el email/kind del token firmado; redirecciones con
  `request.nextUrl.origin` (sin open-redirect) (`unsubscribe/route.ts:16-42`).
- ✅ **`match-reminders` dedup correcto**: KV `mc:match-reminder:{id}` con NX + TTL 6h; ante fallo de KV **no envía**
  (fail-closed, evita spam) (`match-reminders.ts:48-56`).
- ✅ **`send-daily-digest`**: respeta `unsubscribed_at`; construye token de baja firmado por destinatario; bucle de
  envío resiliente (try/catch por correo).
- ✅ **`admin/newsletter` protegido**: `checkAdmin()` valida la cookie `zm_admin` también en el endpoint, no solo en
  el middleware (`api/admin/newsletter/route.ts:50`); dry-run + `confirm()` antes del envío real.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Crear categoría real "Recordatorio de partido" (activa, con toggle) y emitir el cron a ese `kind`; verificar entrega E2E | H-012-01 | P1 |
| 2 | Dedup del digest (flag por día en KV o filtro `last_sent_at`) | H-012-02 | P1 |
| 3 | Paginar el digest hasta agotar suscriptores | H-012-03 | P1 |
| 4 | Newsletter: enviar solo con consentimiento + enlace de baja firmado + excluir bajas | H-012-04 | P1 (legal) |
| 5 | `resubscribe`: conservar `userId` + `kinds` de la fila previa | H-012-05 | P2 |
| 6 | Opt-out del digest fail-closed ante error de DB | H-012-06 | P2 |
| 7 | Reconciliar toggles UI ↔ categorías que realmente envían | H-012-07 | P2 |
| 8 | Quitar secreto por query en crons (header-only) | H-012-08 | P2 |
| 9 | Endurecer token de baja (secret obligatorio, HMAC completo, timingSafeEqual) | H-012-09 | P2 |
| 10 | TTL atómico en rate-limit de `notify-module`; tope agregado real | H-012-10, H-001-25 | P2 |
| 11 | No exponer emails de muestra; tope/confirmación tipada en newsletter | H-012-11 | P2 |

**Criterio de cierre:** un recordatorio de partido llega a un dispositivo de prueba; el digest no se duplica ni se
corta en 1000; todo email de difusión lleva baja y respeta opt-outs; las suscripciones push exigen prueba de
posesión (cruce H-001-24).

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-012-01 | P1 | `lib/match-reminders.ts:19,90` + `NotificacionesPanel.tsx:89-99` | Abierto |
| H-012-02 | P1 | `api/cron/send-daily-digest` + `email-subscriptions.ts:137-167` | Abierto |
| H-012-03 | P1 | `api/cron/send-daily-digest` (sin paginación) | Abierto |
| H-012-04 | P1 (legal) | `api/admin/newsletter/route.ts:72-82` + `email.ts:234` | Abierto |
| H-012-05 | P2 | `api/notifications/push/resubscribe/route.ts:45-48` | Abierto |
| H-012-06 | P2 | `api/cron/send-daily-digest` (opt-out fail-open) | Abierto |
| H-012-07 | P2 | `NotificacionesPanel.tsx:55-144` | Abierto |
| H-012-08 | P2 | `api/cron/{send-daily-digest,match-reminders}` (?secret=) | Abierto |
| H-012-09 | P2 | `lib/email-subscriptions.ts:179-225` | Abierto |
| H-012-10 | P2 | `api/notify-module/[slug]/route.ts:35-36` | Abierto |
| H-012-11 | P2 | `admin/newsletter/NewsletterComposer.tsx:151,179-186` | Abierto |
| H-012-P3 | P3 | baja por GET; `kinds`/`locale` sin validar; cast de `kind` | Abierto |

**Referencias cruzadas:** crons fail-open (**H-001-01** P0); push sin prueba de posesión (**H-001-24**); email
arbitrario en `notify-module` (**H-001-25**); husos horarios (**H-005-01**); newsletter/admin (Fase 4); consentimiento
y GDPR (Fase 19).
