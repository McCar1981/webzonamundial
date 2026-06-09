# Fase 4 — Panel de administración

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 1 sub-auditoría de páginas/ops)
**Alcance:** `app/admin/*` (login, bars, founders, module-interest, monitor, newsletter, registros), `lib/admin-auth.ts`, `lib/registros-store.ts`, `lib/module-interest/store.ts`, `lib/ops/*`. Los endpoints `api/admin/*` se auditaron a nivel de seguridad en **Fase 1 (Grupo 2)**; aquí se cubren las **páginas de cada panel**, los stores y la lógica de monitorización.

---

## Resumen ejecutivo

El panel está **bien protegido en el perímetro de páginas**: todas las rutas `/admin/*` (salvo `/admin/login`)
caen bajo el guard de cookie firmada `zm_admin` del middleware; los emails se **censuran server-side** antes de
llegar al cliente (registros y founders), la IP **no se muestra** en la UI, y el envío de newsletter tiene
**dry-run + confirmación**.

Los problemas se concentran en **tres áreas**:

1. **Acciones destructivas sin red de seguridad (P1):** activar/revertir el plan de pago de un bar se ejecuta
   **sin confirmación** ni log de auditoría → riesgo de disparo accidental.
2. **Modelo de auth incoherente en `monitor` (P1):** la página exige además un `ADMIN_TOKEN` por query string
   sobre la cookie ya validada → UX rota y secreto/PII en la URL (eje nuevo de **H-001-06**).
3. **Datos/PII y telemetría (P2):** métrica de ingresos que mezcla monedas, posible **fuga de secreto** en las
   alertas (vuelca `JSON.stringify(errors)` de api-football a Telegram/email/KV), CSV con nombre completo en
   claro, contador de `module-interest` inflable, y recibos de Stripe enlazados (PII completa).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 2 |
| **P2** | 6 |
| **P3** | 7 |

> Cruces: el build roto de `/admin/founders` **y** `/admin/module-interest` (ambos `revalidate=60` sin
> `force-dynamic`) ya está en **H-000-01** (P0, Fase 0); la métrica de ingresos que mezcla monedas comparte
> raíz con **H-003-06**; el `ADMIN_TOKEN` por query string con PII es **H-001-06**.

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Acceso admin protegido server-side; sin escalada | ✅ Páginas bajo middleware (auth débil ya en H-001-04) |
| Cada panel lee/escribe datos reales correctamente | ⚠️ Sí, salvo métricas (H-004-03) y acoplamiento de contador newsletter (H-004-08) |
| `monitor` no expone datos sensibles; métricas correctas | ❌ Posible fuga de secreto en alertas (H-004-04); auth incoherente (H-004-02) |
| Acciones destructivas con confirmación y auditoría/log | ❌ Plan de bar sin confirmación ni log (H-004-01) |
| Exportes sin fugas de PII indebidas | ⚠️ Email censurado, pero nombre completo en CSV (H-004-05) y recibo Stripe enlazado (H-004-07) |

---

## A. Hallazgos

### 🟠 H-004-01 (P1) — Acciones de plan de bar sin confirmación ni log de auditoría

`admin/bars/BarPlanActions.tsx:24-60,75-92`: "Activar/Reactivar plan" y, sobre todo, **"Quitar" (DELETE/revert)**
se ejecutan con un solo clic, **sin `confirm()`** ni paso intermedio. Revertir el plan **despublica el bar** y le
quita el kit premium (vía `api/admin/bars/plan`, que salta Stripe). No hay log de auditoría en la UI. Un clic
accidental tiene impacto comercial directo. **Recomendación:** confirmación explícita + registro de quién/cuándo.

### 🟠 H-004-02 (P1) — `monitor`: modelo de auth incoherente (token en URL sobre cookie)

`admin/monitor/page.tsx:6-7,64-99` es un client component que lee `?token=` de la URL y lo envía a
`/api/admin/monitor` (que exige `ADMIN_TOKEN`). Pero la página **ya** está tras la cookie `zm_admin` del
middleware → doble auth: el admin entra al panel y ve "Falta ?token=". Además propaga el secreto y PII en la
URL (eje de **H-001-06**). El resto del panel no necesita token. **Recomendación:** unificar en la cookie
firmada y eliminar el `ADMIN_TOKEN` por query string.

### 🟡 H-004-03 (P2) — Métrica de ingresos del panel founders sin sentido (mezcla monedas)

`admin/founders/page.tsx:62-68`: "Ingresos brutos" suma **céntimos de EUR y USD mezclados** sin conversión y los
muestra sin moneda; el "Ingreso medio por Founder" deriva de ese total → cifra sin significado. (Raíz común con
**H-003-06**.) **Recomendación:** desglosar por moneda.

### 🟡 H-004-04 (P2) — Posible fuga de secreto en alertas de monitorización

`lib/ops/checks.ts:62-64` incrusta `JSON.stringify(errors)` de la respuesta de api-football en el `detail` del
check, que `monitor.ts` guarda en KV y `alert.ts` **envía a Telegram/email/push**. Si la respuesta de error
contiene fragmentos de token/clave, se filtran a esos canales. **Recomendación:** sanear/recortar el `detail`
antes de persistir o alertar; nunca volcar el cuerpo de error crudo de un tercero.

### 🟡 H-004-05 (P2) — Export CSV de registros con nombre completo en claro

El CSV de `/api/admin/registros/csv` censura el email pero exporta **nombre y apellido en claro**
(`RegistrosDashboard.tsx:82-87`; `registros-seed.ts:168-194`). No incluye IP ni email completo. Sigue siendo PII
exportable en un fichero descargable. (La auth del endpoint es **H-001-06**.) **Recomendación:** decidir si el
nombre debe censurarse o restringir/loggear la descarga.

### 🟡 H-004-06 (P2) — Contador de `module-interest` inflable

`lib/module-interest/store.ts:54-73`: cuenta interés con `SADD` de emails por slug (idempotente, correcto frente a
repetición del **mismo** email), pero **no valida el formato del email** (solo `toLowerCase().trim()`). Vía el
endpoint público de escritura, un atacante puede inflar el contador con emails basura distintos (cada uno suma 1),
sesgando la priorización de producto. **Recomendación:** validar formato de email + rate-limit en el endpoint.

### 🟡 H-004-07 (P2) — Recibos de Stripe enlazados desde el panel founders (PII completa)

`admin/founders/page.tsx:101-105` enlaza el `receiptUrl` de Stripe en claro. El recibo contiene email y nombre
completos del comprador → fuga parcial de PII al abrirlo (aunque tras la cookie admin). Aceptable si el acceso
admin es estricto; conviene tenerlo presente.

### 🟡 H-004-08 (P2) — Newsletter: acoplamiento frágil `count` vs `total`

`NewsletterComposer.tsx:5-14,178-193`: el dry-run muestra `result.count` y el envío real `result.total`. Si el
backend devuelve un campo y no el otro, el contador de destinatarios sale `undefined`. **Recomendación:** unificar
el nombre del campo entre dry-run y envío.

### Hallazgos P3 (menores)
- **`BASE_COUNT` inflado + comentario obsoleto:** `registros-store.ts:36` usa `8642` como baseline público, pero
  el comentario dice `1247`. El contador mostrado a visitantes es ficticio+real (decisión de marketing); el admin
  usa `getRealCount` (separación correcta). Conviene actualizar el comentario y ser consciente de la inflación.
- `module-interest/store.ts:45-52`: almacena `ip` en KV **sin TTL ni anonimización** (retención PII indefinida).
- `ops/checks.ts:158-178`: `checkStripe` marca `reachable` ante **cualquier** status (incl. 500) → falso negativo.
- `ops/checks.ts:148-150`: push-health no alerta con <20 subs aunque fallen el 100% (punto ciego, por diseño).
- `ops/monitor.ts:79-80,186-194`: lentitud puntual abre incidente y **alerta** → ruido por picos transitorios.
- `RegistrosDashboard.tsx:203,266-302`: dos mapeos de etiqueta de fuente duplicados (cliente/servidor) → riesgo de
  divergencia.
- `NewsletterComposer.tsx:20,87-94`: `bodyHtml` es HTML libre sin validar en el composer (saneado depende del
  backend) → posible inyección en emails.
- `BarPlanActions.tsx:35-37,93-97`: el badge "Activado" puede mentir hasta el `router.refresh()` si la mutación
  falló pero devolvió ok.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Todas las páginas `/admin/*` están dentro del matcher del middleware** (ninguna ruta de página se escapa);
  `/admin/login` correctamente excluida.
- ✅ **Censura de email server-side** en registros y founders antes de llegar al cliente; la **IP no se muestra** en
  la UI de registros.
- ✅ **Newsletter** con **dry-run + `confirm()`** antes del envío masivo.
- ✅ **module-interest** no expone emails ni IP en la página (solo agregados); conteo `SCARD` correcto e idempotente.
- ✅ **`lib/ops/store`** degrada con seguridad (no lanza); el retrigger de cron usa `CRON_SECRET` solo en header
  (no en URL), throttled e idempotente.
- ✅ **admin/bars/page** calcula publicados/pagados/participantes correctamente; no expone PII de usuario.

---

## C. Pendiente de verificación / decisión

- Saneado del HTML del newsletter en el backend (H-004-08 / P3 XSS).
- Política de retención de la IP en `module-interest` y de los nombres en el CSV (PII).
- Decisión de producto sobre el `BASE_COUNT` inflado del contador público.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Confirmación + log de auditoría en acciones de plan de bar | H-004-01 | P1 |
| 2 | Unificar auth de `monitor` en la cookie admin (quitar `?token=`) | H-004-02 (=H-001-06) | P1 |
| 3 | Sanear/recortar `detail` antes de persistir/alertar (api-football) | H-004-04 | P2 |
| 4 | Desglosar ingresos por moneda en el panel founders | H-004-03 (=H-003-06) | P2 |
| 5 | Validar email + rate-limit en module-interest; revisar PII de CSV/recibos | H-004-06/05/07 | P2 |
| 6 | Unificar campo de conteo en newsletter (count/total) | H-004-08 | P2 |
| — | (Build) `force-dynamic` en founders y module-interest | H-000-01 | P0 (Fase 0) |

**Criterio de cierre:** acciones destructivas con confirmación/auditoría; `monitor` con auth coherente y sin
filtrar secretos en alertas; PII de exportes acotada y decidida.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-004-01 | P1 | `admin/bars/BarPlanActions.tsx:24-92` | Abierto |
| H-004-02 | P1 | `admin/monitor/page.tsx:64-99` (=H-001-06) | Abierto |
| H-004-03 | P2 | `admin/founders/page.tsx:62-68` (=H-003-06) | Abierto |
| H-004-04 | P2 | `lib/ops/checks.ts:62-64`, `alert.ts:124-130` | Abierto |
| H-004-05 | P2 | `RegistrosDashboard.tsx:82-87`, `registros-seed.ts:168-194` | Abierto |
| H-004-06 | P2 | `lib/module-interest/store.ts:54-73` | Abierto |
| H-004-07 | P2 | `admin/founders/page.tsx:101-105` | Abierto |
| H-004-08 | P2 | `admin/newsletter/NewsletterComposer.tsx:5-193` | Abierto |
| H-004-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** auth admin débil (**H-001-04**); token en query con PII (**H-001-06**); build roto
founders/module-interest (**H-000-01**); ingresos mezcla monedas (**H-003-06**).
