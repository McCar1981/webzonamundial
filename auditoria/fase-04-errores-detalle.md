# Fase 4 — Detalle exhaustivo por panel/archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-04-admin.md](fase-04-admin.md)

Detalle panel por panel, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Perímetro y layout

| Archivo | Aspecto | Veredicto | Sev | Evidencia |
|---|---|---|---|---|
| middleware.ts | Cobertura del guard | OK — matcher cubre `/admin/*` salvo `/admin/login`; todas las páginas admin bajo cookie `zm_admin` | OK | middleware.ts:11-23,57 |
| admin/layout.tsx | Defensa propia | Passthrough; ninguna página revalida sesión (asumen middleware). Sin defensa-en-profundidad para rutas futuras | P3 | layout.tsx:16-18 |
| admin/layout.tsx | SEO | OK — `robots: noindex/nofollow/nocache` en cascada | OK | layout.tsx:12-14 |

## B. Login

| Archivo | Aspecto | Veredicto | Sev | Evidencia |
|---|---|---|---|---|
| admin/login/page.tsx + LoginClient.tsx | Auth | Cookie firmada `zm_admin`; debilidades ya en **H-001-04** (sin rate-limit, comparación no constante, fallback `zm-admin-dev-only`) | ref H-001-04 | — |

## C. Bares (admin)

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/bars/page.tsx | Lectura datos | OK — `listAllBars(300)`, calcula publicados/pagados/participantes; `fmtAmount` maneja null; sin PII de usuario | OK | bars/page.tsx:29-47 |
| admin/bars/BarPlanActions.tsx | Acción destructiva | "Activar" y "Quitar" (DELETE/revert) **sin confirmación** ni log → disparo accidental despublica el bar | P1 | BarPlanActions.tsx:24-60,75-92 |
| admin/bars/BarPlanActions.tsx | Estado huérfano | Badge "Activado" (`paid \|\| justDone`) puede mentir hasta el `router.refresh()` | P3 | BarPlanActions.tsx:35-37,93-97 |

## D. Founders (admin)

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/founders/page.tsx | Build sin KV | `revalidate=60` + KV en prerender sin `force-dynamic` → rompe build (= **H-000-01**) | P0→Fase 0 | founders/page.tsx:20 |
| admin/founders/page.tsx | Métrica ingresos | Suma céntimos EUR+USD mezclados, sin moneda; media derivada sin sentido | P2 | founders/page.tsx:62-68 |
| admin/founders/page.tsx | PII recibo | Enlaza `receiptUrl` de Stripe (email+nombre completos) | P2 | founders/page.tsx:101-105 |
| admin/founders/page.tsx | Censura email | OK — `censorEmail` server-side | OK | founders/page.tsx:22-27 |

## E. Module-interest (admin)

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/module-interest/page.tsx | Build sin KV | `revalidate=60` sin `force-dynamic` (= **H-000-01**) | P0→Fase 0 | module-interest/page.tsx:21 |
| admin/module-interest/page.tsx | Datos mostrados | OK — ranking por `counts`, media módulos/usuario correcta; solo agregados (sin PII) | OK | module-interest/page.tsx:30-56,120-123 |
| lib/module-interest/store.ts | Conteo | `SCARD` por slug idempotente y correcto | OK | store.ts:101-108 |
| lib/module-interest/store.ts | Inflable | No valida formato de email antes de `SADD` → emails basura inflan el contador | P2 | store.ts:54-73 |
| lib/module-interest/store.ts | PII | Guarda `ip` en KV sin TTL ni anonimización | P3 | store.ts:45-52,86-95 |

## F. Monitor (admin) + ops

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/monitor/page.tsx | Modelo de auth | Exige `?token=ADMIN_TOKEN` sobre la cookie del middleware → UX rota + secreto/PII en URL | P1 | monitor/page.tsx:6-7,64-99 |
| lib/ops/checks.ts | Fuga en alertas | `JSON.stringify(errors)` de api-football va al `detail` → KV/Telegram/email | P2 | checks.ts:62-64 |
| lib/ops/alert.ts | Datos a Telegram/email | OK salvo el `detail` anterior; `retriggerCron` usa `CRON_SECRET` solo en header | OK | alert.ts:46-67,124-127 |
| lib/ops/checks.ts | Sonda Stripe | `reachable` OK ante cualquier status (incl. 500) → falso negativo | P3 | checks.ts:158-178 |
| lib/ops/checks.ts | Push-health | No alerta con <20 subs aunque fallen 100% (punto ciego) | P3 | checks.ts:148-150 |
| lib/ops/monitor.ts | Alertas por lentitud | Lentitud puntual abre incidente + alerta → ruido | P3 | monitor.ts:79-80,186-194 |
| lib/ops/store.ts | Degradación | OK — nunca lanza | OK | store.ts |

## G. Newsletter (admin)

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/newsletter/NewsletterComposer.tsx | Confirmación | OK — dry-run + `confirm("¿Enviar de verdad?")` | OK | NewsletterComposer.tsx:143-152 |
| admin/newsletter/NewsletterComposer.tsx | Conteo destinatarios | `count` (dry-run) vs `total` (real) → posible `undefined` | P2 | NewsletterComposer.tsx:5-14,178-193 |
| admin/newsletter/NewsletterComposer.tsx | HTML libre | `bodyHtml` sin validar en composer (saneado depende del backend) | P3 | NewsletterComposer.tsx:20,87-94 |

## H. Registros (admin) + store

| Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| admin/registros/page.tsx | Censura email | OK — `censorEmail` server-side; IP no se muestra | OK | registros/page.tsx:23-34 |
| admin/registros/RegistrosDashboard.tsx | Nombre completo | Muestra nombre+apellido en claro (UI y CSV) | P3 (UI) / P2 (CSV) | RegistrosDashboard.tsx:253-256 |
| admin/registros/csv (export) | PII en CSV | Email censurado pero nombre+apellido en claro | P2 | registros-seed.ts:168-194 |
| admin/registros/RegistrosDashboard.tsx | Etiquetas duplicadas | Dos mapeos fuente (cliente/servidor) → riesgo de divergencia | P3 | RegistrosDashboard.tsx:203,266-302 |
| lib/registros-store.ts | BASE_COUNT | `8642` en código vs `1247` en comentario; contador público inflado (admin usa `getRealCount`) | P3 | registros-store.ts:36 |
| lib/registros-store.ts | Unicidad email/nombre | OK — `SADD` + rollback de email si el nombre colisiona | OK | registros-store.ts:143-164 |

---

## Resumen de severidades (Fase 4, nuevos)
- **P1 (2):** acción destructiva de plan de bar sin confirmación (H-004-01); auth incoherente de monitor (H-004-02).
- **P2 (6):** métrica de ingresos mezclada (H-004-03), fuga de secreto en alertas (H-004-04), nombre en CSV
  (H-004-05), contador inflable (H-004-06), recibo Stripe PII (H-004-07), conteo newsletter (H-004-08).
- **P3 (7):** layout sin defensa propia, IP sin TTL, sonda Stripe falso-negativo, push-health punto ciego, alertas
  ruidosas por lentitud, etiquetas duplicadas, BASE_COUNT inflado + bodyHtml sin validar + badge optimista.
- **Cruces:** H-000-01, H-001-04, H-001-06, H-003-06.
