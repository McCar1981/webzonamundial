# Fase 1 — Detalle exhaustivo de hallazgos por endpoint

**Fecha:** 2026-06-08 · **Complemento de:** [fase-01-seguridad.md](fase-01-seguridad.md)

Este documento lista **cada endpoint auditado** (129 en total) con su veredicto, incluyendo los
"OK" y los hallazgos menores (P3) que en el informe principal se resumieron. Organizado por los 7
grupos de la auditoría. Cada fila cita `archivo:línea`.

**Severidad:** `P0` rompe prod/seguridad · `P1` bug/riesgo · `P2` deuda · `P3` menor.

---

## Grupo 1 — Auth y cuenta (12 endpoints)

| Endpoint | Método | Auth | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| auth/apple/notifications | POST | Pública (webhook) | OK — verifica firma JWT + iss/aud (jose/JWKS), dedup por `jti`, service_role solo tras verificación | OK | route.ts:65-97 |
| auth/check-email | POST | Pública | Oráculo de enumeración de usuarios: confirma `exists` + `provider`. Rate-limit fail-open y eludible | P2 | route.ts:46-60,121-125 |
| auth/check-email | POST | Pública | Rate-limit basado en `x-forwarded-for` (spoofeable) y fail-open ante KV ausente | P3 | route.ts:38-59 |
| auth/jwks-info | GET | Pública | Expone team_id, Bundle/Services IDs, providers, email de contacto, doc interna con CORS `*`. Info-disclosure menor | P3 | route.ts:65-91,102 |
| account/avatar | POST/DELETE | Sesión | OK — usa `user.id` de sesión, valida MIME/size, service_role limitado a paths del propio usuario | OK | route.ts:50-58,98-99,142 |
| account/avatar | POST | Sesión | Fuga de detalle: devuelve `uploadError.message` crudo de Storage | P3 | route.ts:128-130 |
| account/delete | POST | Sesión | OK — borra solo `user.id` de sesión, ignora el body | OK | route.ts:30-35,54 |
| cuenta/cancelar | POST | Sesión | OK — reembolso atado a `user.email` de sesión; idempotencia vía `refundedAt` | OK | route.ts:16-31 |
| **eliminar-cuenta** | POST | **Pública** | IDOR/abuso: cualquiera envía email+username y dispara correo de "borrado RGPD" a esa víctima + soporte. Sin verificación de propiedad | **P1** | route.ts:31-57,132-143 |
| **eliminar-cuenta** | POST | Pública | Sin rate-limiting; 2 emails por petición → bombing de víctima y soporte | **P1** | route.ts:132-143 |
| users/me/profile | GET | Bearer JWT | OK — valida JWT, lee perfil por `user.id` del token, anon key (no service_role) | OK | route.ts:84-98 |
| users/me/profile | GET | Bearer JWT | Fuga de detalle: devuelve `userError/profileError.message` | P3 | route.ts:86,101 |
| registro | POST | Pública | Sin rate-limit: registro masivo + notificación interna + auto-suscripción. Enumeración parcial vía 409 | P2 | route.ts:37-43,119-130 |
| waitlist | POST | Pública | Sin rate-limit; `alreadyRegistered` permite enumeración leve | P3 | route.ts:36-66,76-79 |
| app-link/email | POST | Pública | Rate-limit 3/60s pero por `x-forwarded-for` (spoofeable) y fail-open → email-bombing leve | P2 | route.ts:21-43,99-103 |
| app/redirect | GET | Pública | OK — destino fijo (sin open-redirect); `utm_source` con `encodeURIComponent` | OK | route.ts:51-53 |

---

## Grupo 2 — Admin (8 endpoints)

> **Confirmado:** el middleware NO protege `/api/admin/*` (guard usa `startsWith("/admin")`, las APIs son `/api/admin`). Cada endpoint debe autenticarse solo. El comentario en `csv/route.ts:4-6` es falso.

| Endpoint | Método | ¿Auth propia? | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| admin/login | POST | N/A (login) | Sin rate-limit/brute-force; comparación NO constante (`!==`); secreto HMAC = el propio password; fallback dev `zm-admin-dev-only` si falta env → bypass total | Alta (P1) | login/route.ts:11-16; admin-auth.ts:16-24,45-49 |
| admin/logout | POST | No | Inofensivo (borra cookie); sin CSRF token, impacto nulo | Info (P3) | logout/route.ts:4-7 |
| admin/monitor | GET/POST | Sí (ADMIN_TOKEN, NO cookie) | Token estático aceptado por `?token=` → fuga en logs. Comparación no constante. POST ejecuta `runMonitor()` | Media (P2) | monitor/route.ts:19-28,64-68 |
| admin/newsletter | POST | Sí (cookie zm_admin) | OK — verifica `isValidAdminCookie` en el handler. Sin CSRF token (SameSite=lax mitiga) | Baja (P3) | newsletter/route.ts:29-33,49-52 |
| **admin/registros** | GET | Sí (ADMIN_TOKEN, NO cookie) | **Dump de PII (email, nombre, IP) protegido solo por token estático en `?token=`** → fuga en logs | Alta (P1/P2) | registros/route.ts:21-36,60-72 |
| admin/registros/csv | GET | Sí (cookie zm_admin) | OK funcional; comentario falso "middleware enforces"; `parseCookie` preserva bien el `.` | Baja (P3) | registros/csv/route.ts:13-17,31-38 |
| admin/bars/plan | POST/DELETE | Sí (cookie zm_admin) | OK — ambos métodos verifican `checkAdmin()` antes de mutar (acción destructiva protegida) | Baja | bars/plan/route.ts:22-29,58-59 |
| **admin/player-photos** | GET | Sí (ADMIN_TOKEN, NO cookie) | Token en `?token=`; `slug` sin sanear → **path traversal** a `.json` arbitrarios (solo lectura) | Media (P2) | player-photos/route.ts:31-38,48-53 |

---

## Grupo 3 — Pagos y bares (8 endpoints)

| Endpoint | Método | Auth/Authz | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| checkout | POST | OK (sesión) | OK — importe/moneda fijados en servidor desde catálogo; metadata correcta; sin IDOR | OK | route.ts:56-63,88,119-124 |
| checkout | POST | OK | Loguea `secretKeyPrefix` (8 chars de la secret key) en logs de Vercel | P3 | route.ts:166,173-175 |
| bars | GET/POST/PATCH | OK | OK — todo por `getBarByOwner(user.id)`; whitelist `EDITABLE_FIELDS`; publicar exige plan | OK | route.ts:17,25,54; store.ts:261-269 |
| bars | PATCH | OK | Texto libre sin validar/sanear (name, status, etc.) → XSS almacenado si se renderiza sin escape | P2 | route.ts:54; store.ts:254-269 |
| bars/checkout | POST | OK (sesión + dueño) | OK — solo `plan_id` (validado); importe server-side; sin IDOR; bloquea doble pago | OK | route.ts:37-55,78-89; plans.ts:76-78 |
| bars/join | POST | OK (sesión) | OK por diseño — unirse por slug; solo bares live; `qr` acotado al bar.id | P3 | route.ts:22-41 |
| **bars/logo** | POST | OK (sesión + dueño) | Acepta `image/svg+xml`, valida solo MIME por cabecera (sin magic bytes), sirve desde bucket público → **XSS almacenado** bajo el dominio | **P1** | route.ts:26,66,95,103-104 |
| bars/logo | POST/DELETE | OK | OK estructural — path = `${bar.id}/...` (sin traversal/IDOR); size ≤2MB | OK | route.ts:48-49,66-75 |
| bars/prizes | GET/POST/DELETE | OK (sesión + dueño) | Sin IDOR (revalida `owner_user_id`); pero title/description/conditions sin sanear → XSS almacenado | P2 | route.ts:17,26,42; store.ts:319-336 |
| bars/qr | GET/POST/DELETE | OK (sesión + dueño) | OK — revalida dueño, filtra bar_id, límite `maxQrSources`, no borra QR principal | OK | route.ts:19,28,51; store.ts:160-183 |
| bars/export | GET | OK (sesión + dueño) | OK — solo ranking del bar propio; CSV escapado, sin PII | OK | route.ts:25-36; store.ts:193-196 |

---

## Grupo 4 — Crons (24 endpoints)

> **P0 transversal:** patrón `const expected = process.env.CRON_SECRET; if (expected) {…}` → si la env falta, NO verifica. Todos GET; 20/24 aceptan `?secret=` (fuga en logs).

| Cron | ¿Verifica secreto? | Impacto si abierto | Sev | Evidencia |
|---|---|---|---|---|
| reset-store | Parcial (Bearer, gated en `if(expected)`) | **Borrado total del store KV de noticias** | **P0** | route.ts:22-28,34-43 |
| send-daily-digest | Condicional | **Envío masivo de emails** (≤1000) → spam + coste + reputación | **P0** | route.ts:43-52 |
| ingest-news | Condicional | Coste IA + cuota GNews; `?backfill`/`?beats` amplifican; push masivo | **P0** | route.ts:36-45 |
| generate-blog-post | Condicional | Coste IA + push broadcast + email masivo; `?topic` controlable | **P0** | route.ts:30-39 |
| test-rewrite | Parcial (Bearer, gated) | **Inyecta artículo arbitrario y lo publica en producción** (coste IA + SEO/XSS vector) | **P0** | route.ts:26-32,52-93 |
| generate-evergreen | Condicional | Coste IA alto: ≤18 piezas por disparo | P1 | route.ts:70-78 |
| generate-trivia | Condicional | Coste IA (`?count` ≤40 preguntas) | P1 | route.ts:20-28 |
| audit-blog | Condicional | Coste IA; puede marcar `noindex` posts (los saca de Google) | P1 | route.ts:31-40 |
| audit-noticias | Condicional | Coste IA; puede despublicar noticias (`status:"review"`) | P1 | route.ts:26-35 |
| update-team-form | Condicional | ~48 llamadas API-Sports (free tier=100/día) → agota ~48% de cuota; `?last` amplifica | P1 | route.ts:38-47 |
| fix-slugs | Condicional | Mutación masiva de slugs → rompe URLs/SEO | P2 | route.ts:27-36 |
| backfill-blog-images | Condicional | Cuota Wikimedia + reescribe imágenes; `?force=1` reprocesa todo | P2 | route.ts:77-85 |
| daily-stats | Sí, fallback débil (`x-vercel-cron` spoofable) | Filtra métricas de negocio (ingresos, founders) por email | P2 | route.ts:35-50 |
| monitor | Sí, fallback débil | Sondas + auto-remediación + alertas al teléfono del CEO → spam de alertas | P2 | route.ts:17-29 |
| poll-creators-live | Condicional | Cuota Twitch + sobrescribe live store + push masivo | P2 | route.ts:25-36 |
| poll-friendlies | Condicional | Coste API-Sports + push masivo de eventos | P2 | route.ts:424-432 |
| match-center-poll | Condicional | Coste API-Sports + push + micro-predicciones; bucle ≤50s amplifica | P2 | route.ts:123-131 |
| match-reminders | Condicional | Push masivo pre-partido (dedup en KV limita repetición) | P2 | route.ts:19-28 |
| predictions-engagement | Condicional | Push + email de recordatorios de racha → spam | P2 | route.ts:18-27 |
| sync-fixtures | Condicional | Sobrescribe mapa matchId→fixtureId → puede corromper Match Center/scoring | P2 | route.ts:30-38 |
| update-team-injuries | Condicional | Coste API-Sports + sobrescribe lesiones; **filtra `stack` completo en 500** | P2 | route.ts:27-36,110-118 |
| resolve-predictions | Condicional | Idempotente (solo `resolved_at=null`), bajo riesgo | P3 | route.ts:33-41 |
| score-brackets | Condicional | Idempotente (recalcula contra actuals) | P3 | route.ts:18-26 |
| resolve-micro | Condicional | Idempotente con guardia de estado | P3 | route.ts:34-42 |

---

## Grupo 5 — Predicciones, bracket, ranking (~24 endpoints)

| Endpoint | Método | Auth/Authz | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| predictions | POST | OK | Deadline server-side (`checkOpen`), unicidad, puntos potenciales server-side | OK | route.ts:25-26,57-66 |
| predictions/[id] | GET | OK | Lee solo si `row.user_id === user.id` | OK | [id]/route.ts:22-23 |
| predictions/[id] | PATCH | OK | Comprueba propiedad + `resolved_at`/`locked_at` + `checkOpen` antes de editar | OK | [id]/route.ts:33-42 |
| predictions/resolve | POST | OK (Bearer CRON_SECRET) | Scoring interno server-side; rechaza sin secreto | OK | resolve/route.ts:19-23,44 |
| predictions/battlepass/claim | POST | OK | Idempotente (PK), valida tier y `premium_required` | OK | claim/route.ts:35; gamification-store.ts:519-538 |
| predictions/boosts | POST | OK | Cobro atómico `spendCoins` con reembolso si falla | OK | boosts/route.ts:23; wallet.ts:95-119 |
| predictions/cosmetics | POST | OK | Nivel + propiedad + cobro atómico + PK idempotente | OK | cosmetics/route.ts:39-60 |
| predictions/duels | POST (responder) | OK | Valida `opponent_id === uid` y `status==='pending'` | OK | duels/route.ts:28-34 |
| predictions/duels | POST (retar) | Parcial | `createDuel` sin anti-spam (retos ilimitados por username) | P3 | gamification-store.ts:706-717 |
| predictions/leagues | POST | OK | userId de sesión; join idempotente; código generado en servidor | OK | leagues/route.ts:27-32 |
| predictions/leagues/[id] | GET | Parcial | IDOR de lectura: clasificación (usernames/avatars) de cualquier liga sin validar membresía | P3 | leagues/[id]/route.ts:13-17 |
| predictions/leagues/[id] | DELETE | OK | `leaveLeague` borra solo la fila propia | OK | leagues/[id]/route.ts:23 |
| predictions/me / mine / battlepass | GET | OK | Datos del propio uid de sesión | OK | me/route.ts:14-17 |
| **predictions/bracket** | PUT | AuthZ OK, integridad falla | **Sin lock de deadline**: se puede sobrescribir el bracket en cualquier momento antes de puntuar | P2 | bracket/route.ts:42-56; bracket-store.ts:47-58 |
| predictions/bracket | GET | OK | Lee bracket+score del propio uid; score server-side | OK | bracket/route.ts:19-27 |
| predictions/match/[matchId] (+results, live-picks, duels) | GET/POST | OK | Solo datos del propio uid; live-picks valida estado en vivo y anti-duplicado | OK | match/[matchId]/route.ts:22-23; live-picks/route.ts:46-74 |
| ranking | GET | OK | Ranking global por Fútcoins; `me` solo con sesión; datos públicos | OK | ranking/route.ts:22-30 |
| **bracket/capsule/seal** | POST | **NO auth** | Email del body → email-bombing a terceros + enumeración (409 "already_sealed"); sin rate-limit | P2 | seal/route.ts:23-38,62-69 |
| bracket/capsule/[hash] | GET | NO auth (por diseño) | OK — lectura por hash aleatorio (capability), email enmascarado | OK | capsule/[hash]/route.ts:10-28 |

---

## Grupo 6 — Fantasy, modo carrera, trivia, micro (~23 endpoints)

| Endpoint | Método | Auth/Authz | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| **fantasy/team** | PUT | Auth OK | **Persiste `state.totalPoints` del cliente → ranking global manipulable. Scoring NO server-side** | **P0** | store.server.ts:54; team/route.ts:38 |
| fantasy/team | PUT | — | `validateTeam` (presupuesto/formación/MAX_PER_NATION) solo en cliente; server acepta cualquier plantilla | P1 | rules.ts:117 (uso solo en FantasyGame.tsx) |
| fantasy/team | PUT | — | `recordGameweekScore` guarda `gs.points` del body sin recalcular (ranking semanal) | P1 | team/route.ts:42-44; store.server.ts:72 |
| fantasy/team | PUT | — | Abono de Fútcoins OK (importe server-side, idempotente vía `fantasy_coin_claims`) | OK | store.server.ts:85-115 |
| fantasy/team | GET | OK | `getTeam(user.id)` | OK | team/route.ts:18-24 |
| fantasy/leagues | GET/POST | OK | Crear/unirse/listar atados a `user.id` | OK | leagues/route.ts:13-35 |
| fantasy/leagues/[id] | GET | OK | `isMember(user.id, id)` antes de la clasificación (sin IDOR) | OK | leagues/[id]/route.ts:16-20 |
| fantasy/leagues/[id] | DELETE | OK | `leaveLeague(user.id, id)` | OK | leagues/[id]/route.ts:23-27 |
| fantasy/leaderboard | GET | Pública | Solo lectura; `my_position` por sesión | OK | leaderboard/route.ts:18-21 |
| fantasy/live | GET | Sin auth | Solo lectura de snapshots públicos (ids ≤24); llama a api-football sin sesión (consumo de cuota por anónimos) | P3 | live/route.ts:34-61 |
| fantasy/creator | POST | OK | Valida slug contra catálogo; update de fila propia vía RLS | OK | creator/route.ts:18-33 |
| **modo-carrera/save** | PUT | Auth OK | Ranking DT ordena por `overall`/reputación que el cliente fija (acotado por clamps, pero maximizable: overall=99) | P1 | store.server.ts:42-43; store.ts:215-259 |
| modo-carrera/save | PUT | — | Recompensas de misión OK (importe de templates, allowlist, idempotente, rate-limit) | OK | store.server.ts:59-111 |
| modo-carrera/narrativa (+refill) | POST | OK/diseño | Solo genera texto; Pase DT verificado server-side; cobro idempotente con reembolso | OK | narrativa/route.ts:38-68; refill/route.ts:21-50 |
| modo-carrera/entitlement | GET | OK | `isPaseDT(email)` server-side; degrada sin acceso ante fallo | OK | entitlement/route.ts:19-31 |
| modo-carrera/leaderboard | GET | Pública | Solo lectura (refleja el dato manipulable del save) | OK | leaderboard/route.ts:13-19 |
| trivia/start | POST | Sin auth (anon) | OK — NO filtra `correctIndex`/`explanation` al cliente | OK | play.ts:16-24; start/route.ts:96 |
| trivia/answer | POST | Sesión server-side | OK — corrección y puntos server-side; anti-doble-respuesta (409) | OK | answer/route.ts:43-70 |
| trivia/answer | POST | — | `sessionId` no firmado: con el id se puede responder (riesgo bajo, no afecta cuenta ajena) | P3 | answer/route.ts:39 |
| trivia/finish | POST | Sesión o anonId | OK — reenvío bloqueado (estado `finished`); abono idempotente por día/modo | OK | finish/route.ts:46-48,102-118 |
| trivia/finish | POST | — | `anonId`/`name` falsificables → spam de ranking público anónimo (no afecta Fútcoins) | P2 | finish/route.ts:51-58; identity.ts:47-52 |
| trivia/hint | POST | Auth OK | OK — cobro idempotente; no permite pista de pregunta ya respondida | OK | hint/route.ts:44-77 |
| trivia/stats | GET | Sesión o `?anonId=` | Fuga de stats por anonId arbitrario (datos no sensibles) | P3 | stats/route.ts:25-31 |
| trivia/leaderboard | GET | Pública | OK (solo lectura) | OK | leaderboard/route.ts:12-20 |
| micro/duels | GET/POST | Auth OK | OK — atados a `user.id`; `respondMicroDuel` exige `opponent_id===uid`; no auto-duelo | OK | micro/duels/route.ts:23-42 |
| micro/[id]/respond | POST | Auth OK | OK — puntos por cron (`scoreMicro`), no del cliente; ventana validada; anti-doble | OK | respond/route.ts:21; store.ts:246-294 |
| micro/[id]/ghost | POST | Auth OK | OK — solo micros resueltas; puntos ×0.5 server-side; anti-repetición | OK | ghost/route.ts:22; store.ts:453-489 |
| micro/match/[id]/active | GET | Sin auth | OK — NO expone `correct_option` en la micro activa | OK | active/route.ts:34-54 |
| micro/match/[id]/history | GET | Sin auth | OK — `correct_option` solo de micros ya resueltas; respuestas propias por `user.id` | OK | history/route.ts:13-43 |
| micro/me/fire-chain | GET | Auth OK | OK — solo su racha | OK | fire-chain/route.ts:14-19 |

---

## Grupo 7 — Live, IA y notificaciones (~26 endpoints)

| Endpoint | Método | Auth | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|---|
| **ia-coach/analyze** | POST | **Ninguna** | Anthropic sin sesión ni rate-limit; cache evadible variando `match`; prompt-injection | **P0** | analyze/route.ts:34-48,81 |
| **ia-coach/live** | POST | **Ninguna** | Anthropic sin auth; cache evadible variando `state` → llamadas pagas ilimitadas | **P0** | live/route.ts:47-71,104 |
| **ia-coach/oracle** | POST | **Ninguna** | Anthropic sin auth; rama followup con `messages` del cliente sin cachear | **P0** | oracle/route.ts:76,100-123,157 |
| **ia-coach/coach** | POST | **Ninguna** | Anthropic sin auth; cache evadible variando `state` | **P0** | coach/route.ts:44-64,95 |
| ia-coach/debate | POST | Sí (sesión + Founders) | OK — único IA-coach bien gated; sanea historial, cap turnos y longitud | OK | debate/route.ts:40-52,64-71 |
| **match-center/narrate** | POST | **Ninguna** | IA sin auth ni rate-limit (cap 12 eventos, sin tope de requests) | **P1** | narrate/route.ts:16-32 |
| match-center/live/[id] | GET | Pública | Narración IA cacheada en KV por matchId+seed/snapshot; coste bajo, sin rate-limit explícito | P3 | live/[id]/route.ts:64,78-84 |
| match-center/comments/[matchId] | POST | Sí (sesión) | OK — identidad server-side, anti-flood 8s, MAX_LEN 280, uid real | OK | comments/route.ts:43-44,68-97 |
| match-center/comments/[matchId] | POST | — | `clean()` no escapa HTML pero render JSX auto-escapa (sin XSS); anti-flood fail-open si KV cae | P3 | comments/route.ts:24-26; CommentsPanel.tsx:365 |
| match-center/comments/[matchId] | GET | Pública | OK — solo lectura | OK | comments/route.ts:32-37 |
| match-center/featured | GET | Pública | OK — solo lectura | OK | featured/route.ts:98-111 |
| **match-center/follow** | POST | **Ninguna** | Registra/borra `subscription.endpoint` arbitrario sin posesión → ensuciar/quitar follows ajenos | P2 | follow/route.ts:29-74 |
| match-center/h2h/[id] | GET | Pública | OK — `parseInt`+`buildMeta` validan | OK | h2h/[id]/route.ts:19-35 |
| notifications/digest/subscribe | POST | Sí (sesión) | OK — `user.email`/`user.id` de sesión, sin IDOR | OK | digest/subscribe/route.ts:14-24 |
| notifications/digest/unsubscribe | GET | Token HMAC | OK — `verifyUnsubscribeToken` firmado (30d); email del token | OK | digest/unsubscribe/route.ts:25-32 |
| notifications/digest/unsubscribe | POST | Sí (sesión) | OK — baja por `user.email` de sesión | OK | digest/unsubscribe/route.ts:45-53 |
| notifications/preferences | GET/POST | Sí (sesión) | OK — `userId` de sesión; category/channel con allowlist; sin IDOR | OK | preferences/route.ts:33-74 |
| notifications/push/subscribe | POST | Opcional | Acepta anónimos (por diseño); sin rate-limit → inflar filas con endpoints inventados | P3 | push/subscribe/route.ts:21-49 |
| **notifications/push/unsubscribe** | POST | **Ninguna** | Borra subscription por `endpoint` del cliente sin probar posesión | P2 | push/unsubscribe/route.ts:12-24 |
| **notifications/push/resubscribe** | POST | **Ninguna** | Acepta `oldEndpoint` arbitrario y lo borra sin prueba de posesión | P2 | resubscribe/route.ts:22-48 |
| notifications/push/test | POST | Sí (sesión) | OK — solo a subs con `user_id = user.id`; no abusable | OK | push/test/route.ts:18-37 |
| **notify-module/[slug]** | POST | Pública | Email del body → email-bombing; rate-limit por-email evadible cambiando el email | P2 | notify-module/[slug]/route.ts:33-38,72-111 |
| creators/live | GET | Pública | OK — solo lectura de KV | OK | creators/live/route.ts:15-25 |
| friendlies | GET | Pública | OK — sin parámetros; fechas UTC server-side | OK | friendlies/route.ts:30-39 |
| friendlies/[id] | GET | Pública | OK — `Number(id)` validado; sin SSRF | OK | friendlies/[id]/route.ts:17-25 |
| calendar | GET | Pública | OK funcional; `filename` de query sin sanear en Content-Disposition (inyección improbable); CORS `*` sobre datos públicos | P3 | calendar/route.ts:55-67,166-173 |
| og/founder | GET | Pública | OK — `n`/`name` reflejados pero render PNG (satori), no HTML; acotados | OK | og/founder/route.tsx:18-19,109,124 |
| **health** | GET/HEAD | **Ninguna** | Expone qué env/secretos están presentes vs `missing`, latencias, región y errores crudos | P2 | health/route.ts:41-55,86,139-163 |

---

## Nota sobre cobertura

- **Endpoints auditados:** 129/129.
- **Verificación pendiente (no derivable del repo):** políticas RLS en Supabase y presencia efectiva de
  `CRON_SECRET`/`ADMIN_PASSWORD` en todos los entornos de Vercel — ver sección D del informe principal.
- Las recomendaciones de corrección y el plan ordenado están en
  [fase-01-seguridad.md](fase-01-seguridad.md) (secciones E y registro de hallazgos).
