# Auditoría por Fases — ZonaMundial

> Objetivo final: dejar la aplicación **auditada al 100%**, módulo por módulo.
> Cada fase se cierra solo cuando **todos** sus criterios de aprobación están en verde.
> Stack: Next.js 14 (App Router) · Supabase (auth/DB) · Stripe · Sanity CMS · Vercel KV · web-push · nodemailer · Anthropic SDK.

## Cómo usar este documento

- Las fases van **por módulos**. Se recomienda el orden propuesto porque las fases base (0–2) protegen al resto.
- Cada módulo tiene: **Objetivo**, **Alcance** (rutas/carpetas reales), **Checklist** y **Criterios de aprobación**.
- Marca el progreso en la tabla de control. Un módulo no se da por auditado hasta tener checklist completo + criterios cumplidos + hallazgos resueltos o ticketeados.

### Leyenda de estado
`⬜ Pendiente` · `🟨 En curso` · `🟥 Hallazgos abiertos` · `✅ Auditado`

### Severidad de hallazgos
`P0` rompe producción / seguridad · `P1` bug funcional o riesgo · `P2` deuda / mejora · `P3` cosmético

---

## Tabla de control

| #  | Fase / Módulo | Estado | P0 | P1 | P2 | Responsable | Fecha cierre |
|----|---------------|--------|----|----|----|-------------|--------------|
| 0  | Cimientos y configuración | ⬜ | | | | | |
| 1  | Seguridad transversal | ⬜ | | | | | |
| 2  | Auth, cuenta y sesión | ⬜ | | | | | |
| 3  | Pagos: Stripe, checkout, founders, premium | ⬜ | | | | | |
| 4  | Panel de administración | ⬜ | | | | | |
| 5  | Datos en vivo: match-center, calendario, amistosos | ⬜ | | | | | |
| 6  | Juego: predicciones, bracket, ranking | ⬜ | | | | | |
| 7  | Juego: fantasy, modo carrera, trivia, micro | ⬜ | | | | | |
| 8  | IA: coach y pipeline de noticias | ⬜ | | | | | |
| 9  | Contenido editorial: historia, blog, CMS Sanity | ⬜ | | | | | |
| 10 | Bares: directorio, dashboard, QR, kit | ✅ | 0 | 0 | 3 | Claude | 2026-06-08 |
| 11 | Creadores y registro por referido | 🟨 | 0 | 0 | 4 | Claude | 2026-06-08 |
| 12 | Notificaciones: push y email | 🟥 | 0 | 4 | 7 | Claude | 2026-06-08 |
| 13 | Contenido país: sedes, selecciones, grupos | 🟥 | 0 | 1 | 9 | Claude | 2026-06-08 |
| 14 | App PWA (/app) y onboarding | 🟥 | 0 | 2 | 7 | Claude | 2026-06-08 |
| 15 | SEO, sitemaps, OG, RSS, embeds | ⬜ | | | | | |
| 16 | Cron jobs y tareas programadas | ⬜ | | | | | |
| 17 | Rendimiento y Core Web Vitals | ⬜ | | | | | |
| 18 | Accesibilidad e i18n | ⬜ | | | | | |
| 19 | Legal y cumplimiento (GDPR) | ⬜ | | | | | |
| 20 | Cierre, regresión y firma final | ⬜ | | | | | |

---

# FASE 0 — Cimientos y configuración

**Objetivo:** asegurar que el proyecto compila, tipa y arranca limpio, y que la configuración base es coherente antes de auditar lógica.

**Alcance:** `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `vercel.json`, `.env.example`, `.eslintrc.json`, `src/middleware.ts`, `scripts/`.

**Checklist**
- [ ] `npm run build` termina sin errores ni warnings nuevos.
- [ ] `npm run lint` sin errores (catalogar warnings).
- [ ] `tsc --noEmit` limpio; revisar si hay `// @ts-ignore` / `any` abusivos.
- [ ] `prebuild`/`validate-content` y `test-gate` se ejecutan y pasan.
- [ ] `.env.example` cubre TODAS las variables usadas en código (grep de `process.env.`).
- [ ] No hay secretos hardcodeados ni `.env` real commiteado (revisar `.gitignore` + `.history`).
- [ ] `next.config.js`: headers de seguridad, dominios de imágenes, redirects coherentes.
- [ ] `vercel.json`: rutas, crons y regiones correctas.
- [ ] Dependencias sin vulnerabilidades críticas (`npm audit`) y sin paquetes muertos.

**Criterios de aprobación:** build + lint + types verdes en local; inventario de variables de entorno completo; cero secretos expuestos.

---

# FASE 1 — Seguridad transversal

**Objetivo:** base de seguridad que aplica a todos los módulos antes de entrar a cada uno.

**Alcance:** `src/middleware.ts`, `src/lib/admin-auth.ts`, `src/lib/auth-helpers.ts`, `src/lib/supabase/`, todas las rutas en `src/app/api/`.

**Checklist**
- [ ] Cada endpoint en `api/` valida **autenticación** y **autorización** (no confiar en el cliente).
- [ ] Validación de entrada en todas las rutas (zod/ajv) — body, query, params.
- [ ] Supabase: revisar uso de `service_role` solo en servidor; **RLS** activo en tablas sensibles.
- [ ] Protección de rutas `admin/` y `api/admin/` independiente del frontend.
- [ ] CSRF/headers, CORS de `api/` restringido; cabeceras de seguridad (CSP, HSTS, X-Frame-Options).
- [ ] Webhooks (Stripe) verifican firma; rate limiting en endpoints sensibles (KV).
- [ ] Sin logging de PII/secretos; manejo de errores no filtra stack a cliente.
- [ ] Cookies de sesión `httpOnly` + `secure` + `sameSite`.

**Criterios de aprobación:** inventario de endpoints con su control de acceso documentado; cero endpoints sin authz; RLS verificado.

---

# FASE 2 — Auth, cuenta y sesión

**Objetivo:** flujo de identidad robusto de extremo a extremo.

**Alcance:** `app/login`, `app/registro`, `app/auth/*` (callback, signout, debug), `app/cuenta/*` (avatar, seguridad, preferencias, notificaciones, comprar, founders-pass), `app/eliminar-cuenta`, `api/auth`, `api/account`, `api/cuenta`, `api/users`, `api/eliminar-cuenta`, `lib/auth-helpers.ts`, `lib/supabase/`, `docs/OAUTH-SETUP.md`, `docs/MOBILE-APP-AUTH-INTEGRATION.md`.

**Checklist**
- [ ] Registro, login, OAuth (callback) y signout funcionan y manejan errores.
- [ ] Recuperación/cambio de contraseña y de email seguros.
- [ ] `auth/debug` no expone datos en producción.
- [ ] Eliminación de cuenta borra/anonimiza datos en todas las tablas (GDPR).
- [ ] Edición de perfil, avatar y preferencias persisten y validan.
- [ ] Sesión expira/renueva correctamente; integración auth de la app móvil coherente.

**Criterios de aprobación:** ciclo completo registro→uso→borrado probado; sin fugas en debug; borrado de cuenta verificado en DB.

---

# FASE 3 — Pagos: Stripe, checkout, founders, premium

**Objetivo:** cero pérdidas de dinero y estados de pago consistentes.

**Alcance:** `api/stripe`, `api/checkout`, `lib/stripe/`, `lib/founders/`, `app/premium`, `app/founders`, `app/cuenta/comprar`, `app/cuenta/founders-pass`, `app/bares/precios`, `admin/founders`.

**Checklist**
- [ ] Webhook de Stripe verifica firma e **idempotencia** (no doble concesión).
- [ ] Mapeo precio→producto→beneficio correcto; importes y moneda revisados.
- [ ] Estados: pago exitoso, fallido, reembolso, suspensión/cancelación reflejados en DB y UI.
- [ ] Concesión de premium/founders solo tras confirmación del webhook, no del redirect.
- [ ] Claves de Stripe (test vs live) y entorno correctos.
- [ ] Manejo de reintentos y errores de red sin estados huérfanos.

**Criterios de aprobación:** flujos de pago probados en modo test (éxito/fallo/reembolso); idempotencia verificada; conciliación DB↔Stripe.

---

# FASE 4 — Panel de administración

**Objetivo:** herramienta interna segura y funcional.

**Alcance:** `app/admin/*` (login, bars, founders, module-interest, monitor, newsletter, registros), `api/admin`, `lib/admin-auth.ts`, `lib/registros-store.ts`, `lib/module-interest/`, `lib/ops/`.

**Checklist**
- [ ] Acceso admin protegido server-side; sin escalada de privilegios.
- [ ] Cada panel lee/escribe datos reales correctamente.
- [ ] `monitor` no expone datos sensibles; métricas correctas.
- [ ] Acciones destructivas con confirmación y auditoría/log.
- [ ] Exportes (newsletter, registros, leads.csv) sin fugas de PII indebidas.

**Criterios de aprobación:** todos los paneles funcionales y protegidos; acciones críticas trazables.

---

# FASE 5 — Datos en vivo: match-center, calendario, amistosos

**Objetivo:** datos deportivos correctos, frescos y con caché sensata (API-Sports).

**Alcance:** `api/match-center`, `api/calendar`, `api/friendlies`, `lib/match-center/`, `lib/friendlies/`, `lib/timezone.ts`, `lib/team-abbr.ts`, `lib/countries.ts`, `app/app/matchcenter`, `app/calendario`, `app/amistosos`, `app/embed/calendario`, `docs/fixture-*-2026.md`.

**Checklist**
- [ ] Llamadas a API-Sports con clave correcta, manejo de rate limit y caché (KV).
- [ ] Zonas horarias correctas por usuario/sede; fechas del fixture 2026 cuadran con docs.
- [ ] Estados de partido (programado/en vivo/finalizado) y polling/refresh adecuados.
- [ ] Fallbacks cuando la API falla; sin romper la UI.
- [ ] Abreviaturas/banderas/países consistentes.

**Criterios de aprobación:** datos verificados contra fuente oficial; caché y rate limit operativos; TZ correcta.

---

# FASE 6 — Juego: predicciones, bracket, ranking

**Objetivo:** integridad de la lógica de juego y puntuación.

**Alcance:** `api/predictions`, `api/bracket`, `api/ranking`, `lib/predictions/`, `lib/bracket/`, `components/bracket/`, `app/app/predicciones`, `app/app/rankings`, `app/bracket`, `app/grupos`.

**Checklist**
- [ ] Reglas de puntuación correctas y a prueba de manipulación (cálculo server-side).
- [ ] Cierre de predicciones por deadline (no se editan tras inicio del partido).
- [ ] Bracket: avance de rondas consistente con resultados reales.
- [ ] Ranking: orden, desempates y paginación correctos; rendimiento con muchos usuarios.
- [ ] Idempotencia al re-puntuar; sin doble conteo.

**Criterios de aprobación:** simulación de torneo con puntuación verificada; deadlines respetados; ranking reproducible.

---

# FASE 7 — Juego: fantasy, modo carrera, trivia, micro

**Objetivo:** módulos de engagement consistentes y libres de exploits.

**Alcance:** `api/fantasy`, `api/modo-carrera`, `api/trivia`, `api/micro`, `lib/fantasy/`, `lib/modo-carrera/`, `lib/trivia/`, `lib/micro/`, `app/app/{fantasy,modo-carrera,trivia,micro,album,ligas,stories,streaming,chat}`, `modo-carrera-documentacion.md`.

**Checklist**
- [ ] Fantasy: presupuesto, fichajes, límites y puntuación validados en servidor.
- [ ] Modo carrera: progresión y estados persisten; coherente con su documentación.
- [ ] Trivia: respuestas no filtradas al cliente; antitrampa; preguntas válidas.
- [ ] Micro/ligas/álbum/stories/chat: funcionalidad real vs placeholder (marcar lo no implementado).
- [ ] Anti-abuso (spam, repetición) en interacciones.

**Criterios de aprobación:** cada submódulo clasificado como funcional o pendiente; lógica de puntos a prueba de cliente; sin exploits triviales.

---

# FASE 8 — IA: coach y pipeline de noticias

**Objetivo:** uso de IA correcto, con costes y contenido controlados.

**Alcance:** `api/ia-coach`, `lib/ia-coach/`, `components/ia-coach/`, `app/app/ia-coach`, `lib/noticias-*.ts` (ingest, enrich, rewriter, critic, store), `lib/gnews.ts`, `app/noticias`, `docs/NOTICIAS-SYNC-PLAN.md`.

**Checklist**
- [ ] Anthropic SDK: modelo y parámetros vigentes; clave server-side; manejo de errores/timeouts.
- [ ] Límites de tokens/coste y rate limiting; prompts sin inyección de datos no saneados.
- [ ] Pipeline noticias: ingest→enrich→rewrite→critic→store sin duplicados ni contenido roto.
- [ ] Atribución/fuentes (gnews) y cumplimiento de licencias.
- [ ] Moderación: no publica contenido inapropiado/alucinado sin control.

**Criterios de aprobación:** pipeline ejecutado end-to-end con salida válida; costes acotados; sin fugas de claves.

---

# FASE 9 — Contenido editorial: historia, blog, CMS Sanity

**Objetivo:** la sección de contenido más grande, navegable y sin enlaces/datos rotos.

**Alcance:** `app/historia/*` (~50 subrutas), `app/blog`, `app/noticias`, `content/`, `src/content/blog`, `src/data/historia-editorial`, `lib/blog/`, `lib/content/`, `lib/evergreen/`, `lib/biblia.ts`, `sanity.config.ts`, `src/sanity/`, `schemas/`, `app/studio`, `docs/cms-analisis.md`.

**Checklist**
- [ ] Todas las subrutas de `historia/` renderizan sin error (smoke test masivo).
- [ ] Rutas dinámicas (`[slug]`, `[edicion]`, `comparar`, `buscar`) manejan inputs inválidos.
- [ ] Datos editoriales validados (`validate-content`); sin enlaces internos rotos.
- [ ] Sanity Studio protegido; schemas coherentes con el código que los consume.
- [ ] Imágenes optimizadas (sharp/next-sanity) y con `alt`.

**Criterios de aprobación:** inventario de rutas de historia con estado OK; validación de contenido en verde; Studio seguro.

---

# FASE 10 — Bares: directorio, dashboard, QR, kit

**Objetivo:** funcionalidad B2B de bares completa y segura.

**Alcance:** `api/bars`, `lib/bars/`, `components/bars/`, `app/bares`, `app/b/[barSlug]`, `app/bar-dashboard`, `app/bar-dashboard/kit`, `app/r/[qrCode]`, `app/api/app-link`, `docs/bar-kit`.

**Checklist**
- [ ] Alta/edición de bar y dashboard protegidos por propietario.
- [ ] Generación y resolución de QR (`r/[qrCode]`) correcta y sin colisiones.
- [ ] Página pública del bar (`b/[barSlug]`) y kit descargable funcionan.
- [ ] Integración con precios/Stripe (cruce con Fase 3).
- [ ] Datos de bares validados; sin acceso cruzado entre cuentas.

**Criterios de aprobación:** ciclo alta→QR→escaneo→dashboard probado; aislamiento entre bares verificado.

### Resultado de auditoría (2026-06-08) — ✅ AUDITADO · COMERCIALIZABLE

**Veredicto: SÍ se puede comercializar.** Sin hallazgos P0/P1. Tres P2 (deuda menor) abiertos, ninguno bloquea el lanzamiento. TypeScript compila limpio (`tsc --noEmit`: 0 errores).

**Checklist verificado**
- [x] **Alta/edición y dashboard protegidos por propietario.** Toda escritura resuelve el bar vía `getBarByOwner(user.id)` o valida `bar.owner_user_id !== uid` (store.ts: `updateBar`, `createQrSource`, `deleteQrSource`, `createPrize`, `deletePrize`; logo.ts). **Nunca se confía en un `bar_id` del body** → imposible tocar bares ajenos. Páginas de material (`/cartel`, `/kit/*`) exigen `requireUser` + comprobación de dueño + redirect.
- [x] **Generación y resolución de QR sin colisiones.** `uniqueQrCode()` reintenta contra la DB hasta encontrar código libre (fallback de 10 chars). `/r/[qrCode]` cuenta escaneo, registra evento y redirige a `/b/[slug]` con UTMs de la fuente; código inexistente → landing `/bares` (sin error). Sin redirección abierta (destino siempre interno).
- [x] **Página pública del bar y kit descargable.** `/b/[barSlug]`, `/ranking`, `/tv` gateadas por `barIsLive` (publicado **Y** plan activo); si no, `BarInactiveScreen`. Kit (7 materiales) con doble gating: dueño + `plan.premiumMaterials`. Export CSV gateado por `plan.exportParticipants` y **no** exporta PII (solo posición/nombre/puntos).
- [x] **Integración con precios/Stripe (cruce Fase 3).** Checkout decide la moneda en el servidor por país del perfil (anti-arbitraje); el cliente no elige importe. Webhook **idempotente** (`recordBarPlanPayment` → `upsert onConflict bar_id`); el plan se concede **solo tras confirmación del webhook**, no del redirect. Reembolso (`charge.refunded`) degrada el bar (quita plan + despublica). Endpoint admin de plan protegido por cookie `zm_admin`.
- [x] **Datos validados; sin acceso cruzado entre cuentas.** Inputs recortados/saneados en el store (slice de longitudes, slugify sin acentos). Atribución de referido fijada solo en el primer ingreso (no se sobrescribe en reescaneos). Aislamiento entre bares verificado en todos los endpoints.

**Hallazgos**
- **H-010 (P2)** — `POST /api/bars/logo` acepta `image/svg+xml` a un bucket público. Un SVG puede contener JS y ejecutarse si se abre la URL del storage directamente (origen Supabase Storage, no el dominio de la app; en las páginas se usa como `background-image` CSS, que no ejecuta scripts). Impacto bajo y auto-infligido (el dueño sube su propio logo). *Recomendación:* eliminar SVG de `ALLOWED_MIME` o sanitizar/rasterizar.
- **H-011 (P2)** — `resolveQrScan` incrementa `scans_count` con read-modify-write no atómico (`scans_count: q.scans_count + 1`). Escaneos concurrentes pueden perder cuentas. Solo afecta la **precisión de analíticas**, no dinero ni seguridad. *Recomendación:* RPC atómico / `increment` en DB.
- **H-012 (P2)** — `POST /api/app-link/email` envía email a una dirección arbitraria sin autenticación; rate-limit de 3/60s por IP (basado en `x-forwarded-for`, spoofable) permite envío masivo de bajo grado a víctimas. Contenido transaccional fijo. *Recomendación:* endurecer límite/captcha (cruce con Fase 12). Tangencial al módulo de bares.

**Criterios de aprobación: CUMPLIDOS.** Ciclo alta→QR→escaneo→dashboard coherente de extremo a extremo; aislamiento entre bares verificado; pagos consistentes e idempotentes. P2 ticketeados para iteración post-lanzamiento.

---

# FASE 11 — Creadores y registro por referido

**Objetivo:** programa de creadores y atribución de referidos correcta.

**Alcance:** `api/creators`, `lib/creators-live/`, `components/` relacionados, `app/creadores`, `app/creadores/[slug]`, `app/registro/[creador]`, `app/zonamundial-images/creators`.

**Checklist**
- [ ] Atribución de referido al registrarse vía `registro/[creador]` persiste correctamente.
- [ ] Páginas de creador renderizan y manejan slug inexistente.
- [ ] Estado "live" de creadores actualizado sin fugas.
- [ ] Sin manipulación de métricas de referido.

**Criterios de aprobación:** referido probado end-to-end; atribución verificada en DB.

---

# FASE 12 — Notificaciones: push y email

**Objetivo:** entrega fiable y respetuosa con las preferencias.

**Alcance:** `api/notifications`, `api/notify-module`, `lib/push-*.ts`, `lib/push-client.ts`, `lib/match-reminders.ts`, `lib/email.ts`, `lib/email-subscriptions.ts`, `lib/notification-preferences.ts`, `app/cuenta/notificaciones`, `admin/newsletter`, `docs/MOBILE-APP-NOTIFICATIONS-INTEGRATION.md`, `docs/email-templates`.

**Checklist**
- [ ] web-push: claves VAPID, suscripción/baja, manejo de endpoints caducados.
- [ ] Email (nodemailer): plantillas, deliverability, enlaces de baja válidos.
- [ ] Respeto de preferencias y consentimiento del usuario.
- [ ] Recordatorios de partido disparan a la hora correcta (cruce con Fase 5 y 16).
- [ ] Sin envíos duplicados ni a usuarios dados de baja.

**Criterios de aprobación:** push y email enviados de prueba; baja funcional; preferencias respetadas.

---

# FASE 13 — Contenido país: sedes, selecciones, grupos

**Objetivo:** páginas informativas del Mundial correctas y completas.

**Alcance:** `app/sedes`, `app/sedes/[slug]`, `app/selecciones`, `app/selecciones/[slug]`, `app/grupos`, `app/grupos/[slug]`, sus `_components`, `components/sedes`, `components/grupos`, `lib/data/`, `lib/player-photos.ts`, `app/zonamundial-images/stadiums`.

**Checklist**
- [ ] Todas las sedes/selecciones/grupos renderizan; slugs inválidos manejados.
- [ ] Datos (sedes 2026, plantillas, grupos) correctos y actualizados.
- [ ] Imágenes de estadios/jugadores cargan y optimizadas.
- [ ] Coherencia con datos en vivo (Fase 5).

**Criterios de aprobación:** inventario de páginas con estado OK; datos verificados contra fuente oficial.

---

# FASE 14 — App PWA (/app) y onboarding

**Objetivo:** shell de la app y primera experiencia sólida.

**Alcance:** `app/app/*` (shell común), `app/onboarding`, `app/la-app`, `app/descarga`, `components/app-modules/`, `lib/apple/`, `lib/pasedt/`, `public/` (manifest, service worker, iconos).

**Checklist**
- [ ] PWA: manifest, service worker, instalación y offline básico.
- [ ] Navegación entre módulos de `/app` consistente; estados de carga/error.
- [ ] Onboarding completo y reanudable; deep links (`app-link`, Apple) funcionan.
- [ ] Responsive y gestos móviles correctos.

**Criterios de aprobación:** instalación PWA verificada; onboarding probado; navegación sin rutas muertas.

---

# FASE 15 — SEO, sitemaps, OG, RSS, embeds

**Objetivo:** indexabilidad y compartibilidad correctas.

**Alcance:** `app/news-sitemap.xml`, `app/blog/rss.xml`, `app/noticias/rss.xml`, `api/og`, `app/embed/*`, `lib/evergreen/`, metadatos de layouts/páginas, `docs/seo`, `robots`.

**Checklist**
- [ ] `metadata`/títulos/descripciones únicos por página clave; canonical correcto.
- [ ] Sitemaps y RSS válidos y completos; `robots` coherente.
- [ ] Imágenes OG (`api/og`) generan correctamente por ruta.
- [ ] Datos estructurados (schema.org) donde aplique.
- [ ] Embeds (`embed/calendario`) funcionan en iframe externo.

**Criterios de aprobación:** sitemaps/RSS validados; OG renderiza; metadatos auditados en rutas top.

---

# FASE 16 — Cron jobs y tareas programadas

**Objetivo:** automatizaciones fiables, idempotentes y observables.

**Alcance:** `api/cron`, `vercel.json` (crons), `lib/match-reminders.ts`, pipeline de noticias, `scripts/`.

**Checklist**
- [ ] Cada cron de `vercel.json` apunta a un endpoint existente y protegido (secret/header).
- [ ] Idempotencia: re-ejecución no duplica efectos.
- [ ] Manejo de fallos, timeouts y logging/alertas.
- [ ] Frecuencias adecuadas (coste vs frescura).

**Criterios de aprobación:** todos los crons mapeados y protegidos; ejecución manual de prueba OK; idempotencia verificada.

---

# FASE 17 — Rendimiento y Core Web Vitals

**Objetivo:** carga rápida y eficiente en móvil.

**Alcance:** toda la app; foco en home (`app/_home`), historia, datos en vivo.

**Checklist**
- [ ] Server/Client Components bien divididos; minimizar JS al cliente.
- [ ] Imágenes con `next/image`, tamaños y `priority` correctos.
- [ ] Estrategia de caché/revalidate por ruta; sin fetch en cascada.
- [ ] Bundle analizado; dependencias pesadas (gsap, framer-motion) cargadas con criterio.
- [ ] LCP/CLS/INP medidos en rutas clave.

**Criterios de aprobación:** Lighthouse móvil ≥ objetivo acordado en rutas top; sin regresiones de bundle.

---

# FASE 18 — Accesibilidad e i18n

**Objetivo:** uso inclusivo y consistencia de idioma.

**Alcance:** `app/accesibilidad`, `src/i18n/`, componentes UI globales.

**Checklist**
- [ ] Navegación por teclado, focus visible, roles/aria en componentes interactivos.
- [ ] Contraste de color y textos alternativos.
- [ ] Formularios con labels y errores accesibles.
- [ ] i18n: cadenas centralizadas, sin texto hardcodeado donde deba traducirse.

**Criterios de aprobación:** auditoría axe sin errores críticos en rutas top; navegación por teclado completa.

---

# FASE 19 — Legal y cumplimiento (GDPR)

**Objetivo:** cumplimiento normativo y consentimiento correcto.

**Alcance:** `app/legal/*` (aviso-legal, cookies, eula, privacidad, terminos), `app/eliminar-cuenta`, banner de cookies, manejo de PII.

**Checklist**
- [ ] Textos legales presentes, accesibles y enlazados desde el footer.
- [ ] Consentimiento de cookies real (bloquea no-esenciales hasta aceptar).
- [ ] Derecho de borrado/exportación de datos operativo (cruce Fase 2).
- [ ] Política de privacidad alineada con datos realmente recogidos (Supabase, Stripe, analytics).

**Criterios de aprobación:** flujos de consentimiento y borrado verificados; textos legales coherentes con la práctica.

---

# FASE 20 — Cierre, regresión y firma final

**Objetivo:** confirmar que la app queda auditada al 100%.

**Checklist**
- [ ] Todos los hallazgos P0/P1 resueltos; P2/P3 ticketeados.
- [ ] Smoke test global de rutas principales tras los arreglos.
- [ ] `build` + `lint` + `types` + `validate-content` + `test-gate` en verde.
- [ ] Re-verificación de seguridad (Fase 1) tras cambios.
- [ ] Documento de auditoría firmado con fecha y responsables.

**Criterios de aprobación:** tabla de control con todos los módulos en `✅`; sin P0/P1 abiertos.

---

## Registro de hallazgos (plantilla)

| ID | Fase | Severidad | Archivo:línea | Descripción | Estado | Resolución |
|----|------|-----------|---------------|-------------|--------|------------|
| H-001 | | | | | Abierto | |
| H-010 | 10 | P2 | `src/app/api/bars/logo/route.ts:26` | Upload de `image/svg+xml` a bucket público (XSS si se abre URL del storage directo) | Abierto | Quitar SVG de ALLOWED_MIME o rasterizar |
| H-011 | 10 | P2 | `src/lib/bars/store.ts:309` | Conteo de escaneos QR no atómico (read-modify-write) | Abierto | Incremento atómico en DB (RPC) |
| H-012 | 10 | P2 | `src/app/api/app-link/email/route.ts:45` | Envío de email sin auth a dirección arbitraria; rate-limit por IP spoofable | Abierto | Endurecer límite/captcha (cruce Fase 12) |

---

## Nota de método

Para cada fase: (1) inventariar el alcance real (rutas/archivos), (2) leer la lógica server-side primero, (3) probar el camino feliz y los bordes, (4) registrar hallazgos con severidad, (5) cerrar solo con criterios cumplidos. Las fases 0–1 son prerrequisito del resto; el orden 2→19 puede paralelizarse por módulos si hay varios auditores.
