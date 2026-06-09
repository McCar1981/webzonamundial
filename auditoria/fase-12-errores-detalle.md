# Fase 12 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-12-notificaciones.md](fase-12-notificaciones.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Web Push — librería núcleo (`lib/push-notifications.ts`)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| VAPID | OK — claves server-only; subject configurable; no se exponen | OK | push-notifications.ts:57-72 |
| Expiración 410/404 | OK — borra la fila al recibir gone | OK | push-notifications.ts:266-274, 355-357 |
| Fallos acumulados | OK — +1 a `failure_count`, a los 5 borra; éxito resetea | OK | markFailureOrDelete:280-297; markSuccess:302-316 |
| Resolución por kind | Híbrida prefs(category,channel=push,enabled) ∪ legacy kinds[]; excluye opt-out explícito | OK (diseño) | listSubscriptionsForKind:136-234 |
| Anónimas | subs sin `user_id` siempre incluidas (no se pueden filtrar por pref) | P3 | push-notifications.ts:216-219 |
| Broadcast | Envío **secuencial**; el propio comentario avisa que no escala a miles | P2 (escala) | broadcastPush:343-365 |

## B. Web Push — endpoints (`api/notifications/push/*`)

| Ruta | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| subscribe | Auth | Acepta suscripciones **anónimas** sin límite (`user?.id ?? null`) | (H-001-24) | subscribe/route.ts:41-45 |
| subscribe | Posesión | No verifica control del endpoint → se puede sobrescribir fila ajena (upsert por endpoint único) | (H-001-24) | subscribe/route.ts:29-38 |
| subscribe | `kinds` | `kinds: body.kinds` sin validar (gobierna qué pushes recibe) | P3 | subscribe/route.ts:48 |
| subscribe | `locale` | sin validar | P3 | subscribe/route.ts:47 |
| subscribe | Forma | OK — valida `endpoint` + `keys.p256dh` + `keys.auth`; error genérico | OK | subscribe/route.ts:30-38,52 |
| unsubscribe | Auth | **Borra por `endpoint` sin auth ni posesión** → DoS de silenciado | (H-001-24, ángulo nuevo) | unsubscribe/route.ts:20-24 |
| resubscribe | Auth | Sin auth; borra `oldEndpoint` arbitrario sin posesión | (H-001-24) | resubscribe/route.ts:41-43 |
| resubscribe | Pérdida de datos | Re-guarda **sin `userId` ni `kinds`** → usuario pierde categorías consentidas | **H-012-05** P2 | resubscribe/route.ts:45-48 |
| resubscribe | Delete sin check | resultado de `deletePushSubscription(old)` ignorado | P3 | resubscribe/route.ts:42 |
| test | Auth/scope | OK — 401 sin sesión; `.eq("user_id", user.id)` → solo subs propias | OK | test/route.ts:19-35 |
| test | Rate-limit | Sin tope; auto-spam acotado a subs propias | P2 | test/route.ts:51 |
| test | Fuga | devuelve `error.message` de Supabase al user autenticado | P3 | test/route.ts:40 |

## C. Preferencias (`api/notifications/preferences` + `notification-preferences.ts`)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| IDOR | OK — identidad de `getCurrentUser()`, usa `user.id`; sin `userId` de body | OK | preferences/route.ts:34-46,69-74 |
| Auth | OK — 401 `no_session` fail-closed | OK | preferences/route.ts:35-37,44-46 |
| Validación | OK — category/channel contra allowlist; `enabled` booleano | OK | preferences/route.ts:56-67 |
| Defaults | OK — política conservadora: solo `news/email` activa; push requiere consent del navegador | OK | notification-preferences.ts:136-151 |

## D. Email — librería (`lib/email.ts`, `lib/email-subscriptions.ts`)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| SMTP | OK — nodemailer con credenciales de env; degrada a no-op si faltan (warn) | OK | email.ts:9-25 |
| Escape HTML | OK — `escapeHtml` en datos de usuario en plantillas | OK | email.ts:159-166 |
| Plantilla branded | **Pie sin enlace de baja** ("puedes ignorarlo") | contribuye a H-012-04 | email.ts:234-235 |
| Digest | OK — incluye baja firmada + "gestionar notificaciones"; subject según nº | OK | email.ts:404-412 |
| Welcome/Founder/Bar | Transaccionales (sin baja, correcto por naturaleza) | OK | email.ts:38,423,463 |
| Token baja | Fallback hardcodeado si faltan ambos secretos | **H-012-09** P2 | email-subscriptions.ts:179-185 |
| Token baja | HMAC truncado a 24 hex (96 bits) | **H-012-09** P2 | email-subscriptions.ts:199,224 |
| Token baja | Comparación `!==` (no `timingSafeEqual`) | **H-012-09** P3 | email-subscriptions.ts:225 |
| subscribe/unsubscribe | OK — idempotentes; reactivan baja previa; normalizan email | OK | email-subscriptions.ts:40-118 |
| listActiveSubscribers | **No filtra `last_sent_at`** → base del bug de dedup | **H-012-02** P1 | email-subscriptions.ts:137-143 |
| markSent | Solo escribe `last_sent_at` (nadie lo lee para excluir) | **H-012-02** P1 | email-subscriptions.ts:156-167 |

## E. Email — endpoints (`api/notifications/digest/*`, `api/notify-module`)

| Ruta | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| digest/subscribe | Anti-abuso | OK — email de la sesión, no del body | OK | subscribe/route.ts:14-24 |
| digest/unsubscribe | HMAC | OK — verifica token; baja solo email/kind firmados | OK | unsubscribe/route.ts:16-42 |
| digest/unsubscribe | Método | Baja por **GET** → prefetch de clientes de correo puede auto-dispararla | P3 | unsubscribe/route.ts:16,32 |
| digest/unsubscribe | Open-redirect | OK — usa `request.nextUrl.origin` | OK | unsubscribe/route.ts:17,40-42 |
| notify-module | Auth | **Envía email a dirección arbitraria sin auth** (relay de spam) | (H-001-25) | notify-module/route.ts:56,72,96-111 |
| notify-module | Rate-limit | Clave `…:{email}:{ip}` → cada víctima su propio cupo; IP spoofable | (H-001-25, detalle nuevo) | notify-module/route.ts:27,34 |
| notify-module | TTL | `kv.incr` + `kv.expire` no atómico → clave puede quedar permanente | **H-012-10** P2 | notify-module/route.ts:35-36 |
| notify-module | GET counts | Cuentas de interés públicas (enumeración) | P2 | notify-module/route.ts:125-135 |
| notify-module | Slug/email | OK — `isValidModuleSlug`, formato de email validado | OK | notify-module/route.ts:61-63,72-75 |

## F. Crons (`api/cron/send-daily-digest`, `api/cron/match-reminders`)

| Cron | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| send-daily-digest | Auth | Fail-open: auth solo `if (CRON_SECRET)` → público si falta | (H-001-01 P0) | route.ts:43-52 |
| send-daily-digest | Secreto en URL | acepta `?secret=` → fuga a logs | **H-012-08** P2 | route.ts:47 |
| send-daily-digest | Dedup | **Sin guarda de double-send** | **H-012-02** P1 | route.ts:65-66 |
| send-daily-digest | Paginación | `limit:1000` sin bucle de offset → cap silencioso | **H-012-03** P1 | route.ts:78-80 |
| send-daily-digest | Opt-out | OK respeta `unsubscribed_at` y pref `news/email=false`… | OK | route.ts:101-125 |
| send-daily-digest | Opt-out (error) | …pero si la consulta de prefs lanza, sigue con set vacío (fail-open) | **H-012-06** P2 | route.ts:118-120 |
| send-daily-digest | Baja por correo | OK — `buildUnsubscribeToken` por destinatario | OK | route.ts:143-147 |
| send-daily-digest | Envío | OK — try/catch por correo, no aborta el lote | OK | route.ts:141-173 |
| send-daily-digest | Schedule | `"0 7 * * *"` (07:00 UTC) | OK | vercel.json:16-18 |
| match-reminders | Auth | Fail-open igual (`if (expected)`) | (H-001-01 P0) | route.ts:20-28 |
| match-reminders | Secreto en URL | acepta `?secret=` | **H-012-08** P2 | route.ts:24 |
| match-reminders | Frecuencia vs ventana | `*/10` ≤ ventana 16 min → OK (margen 6 min, ajustado) | P2 (margen) | vercel.json:57-58 |
| match-reminders | Destinatarios | Emite a `predictions-reminder`, **categoría imposible de activar** → 0 envíos | **H-012-01** P1 | match-reminders.ts:19,90 |
| match-reminders | Hora | Cuerpo solo en ET | (H-005-01) | match-reminders.ts:89-99 |
| match-reminders | Error handling | OK — try/catch, 500 sin filtrar, heartbeat solo en éxito | OK | route.ts:32-37 |

## G. UI de notificaciones (`app/cuenta/notificaciones`)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| Auth de página | OK — `requireUser`; `robots:noindex` | OK | page.tsx:17,32 |
| Persistencia | OK — POST a `/api/notifications/preferences {category,channel,enabled}`; carga prefs existentes | OK | NotificacionesPanel.tsx:220-224; page.tsx:72-76 |
| Activar push | OK — flujo de permiso del navegador en el switch superior; `subscribeToPush({kinds:["news"]})` | OK (con matiz) | NotificacionesPanel.tsx:240-261 |
| Toggles inertes | 6/8 categorías `status:"soon"` deshabilitadas ("Próximamente") | **H-012-07** P2 | NotificacionesPanel.tsx:72-121 |
| Categoría activa sin toggle | El push que sí se emite (recordatorio) no tiene toggle usable | **H-012-07** P2 / H-012-01 | NotificacionesPanel.tsx:89-99 |
| Mismatch kind | top activa `kinds:["news"]`; categorías extra dependen de la vía `prefs` (user_id) para llegar | OK (mitigado por híbrido) | push-notifications.ts:202-212 |

## H. Newsletter admin (`admin/newsletter`, `api/admin/newsletter`)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| Auth endpoint | OK — `checkAdmin()` valida cookie `zm_admin` también en el POST | OK | api/admin/newsletter/route.ts:50 |
| Destinatarios | **Toda la lista de `registros`** (leads), sin cruzar consentimiento | **H-012-04** P1 | route.ts:72-82 |
| Enlace de baja | **Ausente** (pie solo "puedes ignorarlo") | **H-012-04** P1 | email.ts:234 |
| Respeto opt-out | No consulta `email_subscriptions`/`notification_preferences` | **H-012-04** P1 | route.ts:71-82 |
| Lotes | OK — lotes de 25 con pausa de 1.5s (anti rate-limit SMTP) | OK | route.ts:104-115 |
| Confirmación | dry-run + `confirm()` nativo antes del envío | P2 (mínima) | NewsletterComposer.tsx:147,151 |
| PII a cliente | dry-run pinta `sample` (emails) en el DOM | **H-012-11** P2 | NewsletterComposer.tsx:179-186 |
| Blast sin tope | `kind:"all"` + `limit` vacío = sin límite | **H-012-11** P2 | NewsletterComposer.tsx:124-137 |
| HTML del cuerpo | `bodyHtml` libre del admin (verificar saneo si la cuenta admin se compromete) | P3 | NewsletterComposer.tsx:87-94 |

---

## I. Veredictos
- **Infra push/email:** núcleo bien construido (VAPID server-only, expiraciones, tokens firmados, prefs sin IDOR).
- **Recordatorio de partido:** **muerto** — emite a una categoría que nadie puede activar (H-012-01).
- **Digest:** **no idempotente** (reenvío masivo, H-012-02) y **con cap silencioso** a 1000 (H-012-03).
- **Newsletter:** funcional y protegida, pero **sin baja ni respeto de opt-outs** → riesgo legal (H-012-04).
- **Sistémicos re-confirmados:** crons fail-open (H-001-01), push sin posesión (H-001-24), email arbitrario
  (H-001-25), hora en ET (H-005-01) — no se recuentan.
