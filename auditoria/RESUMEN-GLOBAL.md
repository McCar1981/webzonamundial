# Resumen global de la auditoría — ZonaMundial

**Fecha de corte:** 2026-06-08 · **Fases completadas:** 0–14 de 20 · **Estado global:** 🟥 En curso

Documento consolidado de todos los hallazgos de las fases auditadas. Para el detalle de cada una, ver su
informe y su archivo de detalle (enlazados en el [README](README.md)).

---

## 1. Conteo global de hallazgos (fases 0–8)

| Severidad | Total | Qué significa |
|-----------|-------|---------------|
| **P0** | **11** | Rompe producción / seguridad / legal — bloqueantes |
| **P1** | **36** | Bug funcional o riesgo serio |
| **P2** | **61** | Deuda / mejora |
| **P3** | ~40 | Menores / cosméticos |

> Muchos hallazgos se cruzan entre fases (un mismo defecto aparece desde varios ángulos). Las referencias
> `H-0XX-YY` permiten rastrearlos. Los conteos por fase están en el [README](README.md).

---

## 2. Los 11 P0 (bloqueantes) — vista única

| ID | Fase | Área | Problema | Acción |
|----|------|------|----------|--------|
| **H-000-01** | 0 | Build | `/admin/founders` y `/admin/module-interest` rompen el build (`revalidate=60` + KV en prerender) | `force-dynamic` |
| **H-001-01** | 1 | Crons | Los 24 crons usan "verifica solo si `CRON_SECRET` existe" → abiertos si falta la env (Preview). `reset-store` borra datos; `test-rewrite` publica contenido arbitrario | Helper `requireCron()` fail-closed, Bearer-only |
| **H-001-02** | 1 | IA coach | 4 endpoints (`analyze/coach/live/oracle`) llaman a Anthropic **sin auth ni rate-limit** → abuso de coste ilimitado | Auth + rate-limit |
| **H-001-18** | 1 | Fantasy | El ranking global persiste `totalPoints` enviado por el **cliente** → manipulación trivial | Recalcular server-side |
| *(7 P0 más en Fase 1)* | 1 | Crons | `reset-store`, `test-rewrite`, `send-daily-digest`, `ingest-news`, `generate-blog-post` son P0 individuales por daño (wipe/publish/email masivo/coste) bajo el patrón de H-001-01 | (ver Fase 1) |
| **H-006-01** | 6 | Predicciones | **No hay pipeline de resultados reales**: las predicciones no se resuelven solas (depende de un integrador externo no implementado) → modo no funcional | Construir ingestión api-football→resultado |
| **H-008-01** | 8 | Noticias | **Riesgo legal alto**: descarga el cuerpo completo de medios, lo reescribe y publica como propio firmado por **autores ficticios** (copyright + atribución falsa) | Reestructurar a cita+enlace, atribución honesta |

> Nota: la Fase 1 contabiliza 8 P0; en la tabla se agrupan los crons de mayor daño como instancias del patrón
> sistémico H-001-01. El detalle endpoint-a-endpoint está en `fase-01-errores-detalle.md`.

---

## 3. Temas transversales (patrones que cruzan varias fases)

### 3.1 🔴 Cableado de datos reales incompleto
La app está lista en UI/motores, pero **faltan los puentes a datos reales** en varios módulos:
- **Predicciones** (H-006-01, P0): sin integrador de resultados → no resuelve.
- **Fantasy** vive con stats de pool simuladas (H-007-06) aunque el scoring en vivo sí es real.
- **Modo Carrera "En Vivo"** simula resultados (H-007-04).
- **Calendario** no aplica los husos horarios reales pese a tener la maquinaria (H-005-01); el push de recordatorio
  hereda el problema (hora solo en ET).
- **Recordatorio de partido** (H-012-01, P1): el cron emite a una categoría que ningún usuario puede activar → **0
  destinatarios** (función muerta).

### 3.2 🟠 Transparencia / cifras y autoría engañosas
Recurrente y con riesgo reputacional/legal:
- Contador de registros inflado (`BASE_COUNT=8642`, H-004-P3).
- "2.000+ preguntas" de trivia (H-007-08), "8.4k online" en chat (H-007-05).
- Tabla de puntuación de fantasy que promete acciones no calculadas (H-007-01).
- Módulos secundarios (chat/stories/streaming) como maquetas con CTAs de acción inmediata (H-007-05).
- **Jugadores clave ficticios** ("Capitán", "Portero titular") y stats con `Math.random()` en páginas de grupo para
  ~34 selecciones (H-013-01, P1).
- **Noticias firmadas por autores ficticios** (H-008-01, P0).
- Doc de modo carrera describe otro juego (H-007-03); doc de noticias desactualizada (H-008-11).

### 3.3 🟠 Cuota de api-football compartida en riesgo
- Match Center poll cada minuto + bucle 15s (H-005-02) y `/api/friendlies` sin caché (H-005-03) comparten clave →
  pueden agotar la cuota que necesitan los datos en vivo. Sin manejo de 429 (H-005-06).

### 3.4 🟠 Modelos de IA y coste
- IA coach en modelo **legacy** (`sonnet-4-5`) en 5 modos (H-008-05); migración romperá por `temperature`/`budget_tokens`.
- Critic de noticias en Haiku (gate de calidad poco capaz, H-008-10).
- Sin prompt-caching ni streaming en coach; rotación de caché costosa (H-008-07).

### 3.5 🟠 Seguridad: superficie pública abusable
- Endpoints que envían email a direcciones arbitrarias (email-bombing): `eliminar-cuenta` (H-001-09),
  `notify-module` (H-001-25), `app-link`, `registro`.
- Push sin prueba de posesión (H-001-24); `health`/`auth/debug` filtran configuración (H-001-26, H-002-08).
- Admin: login débil con fallback hardcodeado (H-001-04), token en query con PII (H-001-06), acciones destructivas
  sin confirmación (H-004-01).

### 3.6 🟠 GDPR / Legal (pendiente Fase 19, ya con hallazgos)
- Borrado de cuenta deja PII huérfana (`email_subscriptions`, `user_preferences`) (H-002-01).
- Sin disclaimer de juego responsable en el coach de apuestas (H-008-08).
- Copyright de noticias (H-008-01).
- **Newsletter de admin** envía a toda la lista de leads **sin enlace de baja** ni respeto de opt-outs
  (H-012-04, P1) → riesgo CAN-SPAM/ePrivacy.
- **Beneficios "Founders" anunciados en ~12 módulos pero no aplicados** (solo Modo Carrera gatea) mientras el
  Founders Pass se vende por Stripe (H-014-02, P1) → exposición de protección al consumidor.

### 3.7 ✅ Lo que está sólido (no regresar)
- **Economía de juego** (Fútcoins/XP): RPC atómicas, idempotente, server-side, sin doble abono.
- **Webhook de Stripe**: firma + idempotencia; precios server-side; moneda por país anti-arbitraje; reembolso revoca.
- **Cabeceras de seguridad** completas (HSTS, X-Frame, CSP, COOP/CORP).
- **Trivia** (IA + doble verificación) y **Micro** (resolución real idempotente) — motores ejemplares.
- **Match Center**: caché KV compartida, batch eficiente, degradación limpia, push idempotente.
- **Auth**: solo OAuth+magic-link (sin contraseñas), callback same-origin, `/cuenta/*` protegido.

---

## 4. Estado por fase

| # | Fase | Estado | P0 | P1 | P2 | Hallazgo más grave |
|---|------|--------|----|----|----|--------------------|
| 0 | Cimientos | 🟥 | 1 | 2 | 4 | Build roto (admin KV) |
| 1 | Seguridad transversal | 🟥 | 8 | 9 | 14 | Crons sin fail-closed; IA coach pública |
| 2 | Auth, cuenta y sesión | 🟥 | 0 | 3 | 9 | Borrado GDPR incompleto |
| 3 | Pagos | 🟥 | 0 | 1 | 4 | Founder por email (pierde acceso al cambiar email) |
| 4 | Panel admin | 🟥 | 0 | 2 | 6 | Acciones destructivas sin confirmación; fuga en alertas |
| 5 | Datos en vivo | 🟥 | 0 | 4 | 7 | Husos horarios sin aplicar; cuota api-football |
| 6 | Predicciones/bracket/ranking | 🟥 | 1 | 6 | 6 | Sin pipeline de resultados reales; bracket no oficial |
| 7 | Fantasy/carrera/trivia/micro | 🟥 | 0 | 5 | 5 | Maquetas con cifras falsas; doc divergente |
| 8 | IA coach + noticias | 🟥 | 1 | 4 | 6 | Copyright + autores ficticios |
| 9 | Contenido editorial (historia/blog/Sanity) | 🟨 | 0 | 0 | 4 | Sanity CMS muerto / /studio sin proteger |
| 10 | Bares (directorio/dashboard/QR/kit) | 🟨 | 0 | 0 | 6 | Métrica muerta; kit sin tema del bar |
| 11 | Creadores y referido | 🟨 | 0 | 0 | 4 | Fuente muerta divergente; referido cosmético |
| 12 | Notificaciones push/email | 🟥 | 0 | 4 | 7 | Recordatorio de partido no llega a nadie; digest no idempotente; newsletter sin baja |
| 13 | Contenido país (sedes/selecc./grupos) | 🟥 | 0 | 1 | 9 | Jugadores/stats ficticias en grupos; datos duplicados/stale; sorteo sin verificar |
| 14 | App PWA y onboarding | 🟥 | 0 | 2 | 7 | PWA no instalable (SW lazy); beneficios Founders sin aplicar |
| 15–20 | (pendientes) | ⬜ | | | | |

---

## 5. Prioridad recomendada antes de lanzamiento

**Bloqueantes legales/funcionales (resolver primero):**
1. Noticias: eliminar scrape de cuerpo completo + autores ficticios (H-008-01).
2. Pipeline de resultados reales para predicciones (H-006-01).
3. Crons fail-closed + IA coach con auth (H-001-01, H-001-02).
4. Fantasy ranking server-side (H-001-18).
5. Build: `force-dynamic` en admin (H-000-01).

**Alto impacto:**
6. Borrado GDPR completo (H-002-01); Founder por user_id (H-003-01).
7. Husos horarios en calendario (H-005-01); cuota api-football (H-005-02/03).
8. Migrar IA coach a modelo vigente (H-008-05); revisión humana de noticias (H-008-02).
9. Transparencia: cifras reales y "próximamente" claro (H-007-05, H-004-P3).

---

## 6. Verificaciones pendientes que requieren infra (no derivables del repo)
- **RLS** activo en las tablas de Supabase (Fase 1).
- `CRON_SECRET`, `ADMIN_PASSWORD`, claves Stripe live/test presentes en todos los entornos de Vercel.
- Cascades reales hacia `auth.users` y constraint `UNIQUE` en `profiles.username` (Fase 2).
- Plan de api-football (free vs pago) y consumo de cuota (Fase 5).
- Validación de fechas/sedes del Mundial contra fuente FIFA (el doc oficial del repo está vacío) (Fase 5).
