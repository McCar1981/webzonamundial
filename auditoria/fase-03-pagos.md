# Fase 3 — Pagos: Stripe, checkout, founders, premium

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 1 sub-auditoría de páginas/flujos)
**Alcance:** `lib/stripe/client.ts`, `lib/founders/*`, `lib/pasedt/entitlement.ts`, `lib/bars/plans.ts` + pagos de `lib/bars/store.ts`, `app/premium`, `app/founders`, `app/cuenta/comprar`, `app/cuenta/founders-pass`, `app/bares` (+`/precios`), `app/admin/founders`, y los handlers `api/stripe/webhook`, `api/checkout`, `api/bars/checkout` (estos tres ya verificados a nivel de seguridad en Fase 1).

---

## Resumen ejecutivo

El flujo de pagos es **sólido en lo fundamental**: la concesión de beneficios (Founder y plan de bar)
ocurre **exclusivamente en el webhook** verificado de Stripe — ninguna página de retorno concede nada;
los precios se fijan **en servidor desde catálogo** (8 €/6 USD founders; planes de bar 49/99/179) y la
**moneda se deriva del país** (anti-arbitraje, el backend rechaza `currency_mismatch`); los reembolsos
revocan acceso en ambos productos (`isFounder`→false; el bar se despublica); y `markFounder` es idempotente.

Los problemas se concentran en **dos ejes**:

1. **Identidad de Founder por email (P1):** el acceso premium se almacena por email en KV, no por `user.id`.
   Si el usuario **cambia su email** (posible sin reautenticación, ver H-002-05), `isFounder(nuevoEmail)`
   devuelve `false` → **pagó pero pierde el beneficio**, y el record queda huérfano bajo el email antiguo.
2. **Experiencia post-pago confusa (P2):** el `success_url` y el banner de éxito no coinciden de ruta, no
   hay estado "procesando" para la carrera redirect-antes-que-webhook, y el panel del bar muestra un flash
   optimista que puede mentir momentáneamente. Además los precios de `/premium` salen de i18n, desacoplados
   del catálogo server, y el webhook **no maneja disputas/chargebacks**.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 1 |
| **P2** | 4 |
| **P3** | 3 |

> Cruce: el build roto de `/admin/founders` (revalidate=60 sin KV) ya está registrado como **H-000-01**
> (P0, Fase 0). Es un hallazgo del área de pagos pero se cuenta una sola vez allí.

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Webhook verifica firma e idempotencia | ✅ (Fase 1 + idempotencia `sadd` verificada aquí) |
| Mapeo precio→producto→beneficio correcto; importes/moneda | ✅ Catálogo server, moneda por país coherente |
| Estados: éxito/fallo/reembolso/cancelación reflejados en DB y UI | ⚠️ Reembolso/cancelación OK; **éxito confuso** (H-003-02); **disputa no manejada** (H-003-05) |
| Concesión solo tras webhook, no redirect | ✅ Confirmado |
| Claves Stripe test vs live correctas | ⚠️ No verificable desde repo (env en Vercel); `apiVersion` no pineada (H-003-08) |
| Reintentos/errores sin estados huérfanos | ❌ Cambio de email deja Founder huérfano (H-003-01) |

---

## A. Hallazgos

### 🟠 H-003-01 (P1) — Identidad de Founder por email: pago sin beneficio al cambiar de email

`founders/store.ts` indexa el acceso premium por **email normalizado** (`KEY_EMAILS` set, `KEY_RECORD(email)`),
y el gating se hace con `isFounder(email)` / `isPaseDT(email)` resolviendo el email desde la sesión.
No hay vínculo por `user.id`. Si el usuario **cambia su email** en Supabase (`SecurityPanel`, sin reautenticación,
H-002-05):
- `isFounder(nuevoEmail)` → `false` → **pierde el acceso premium pese a haber pagado**.
- El record y la pertenencia al set quedan **huérfanos** bajo el email antiguo (no se migran).

**Impacto:** pago sin beneficio, tickets de soporte y posibles reembolsos. **Recomendación:** vincular la
entitlement al `user.id` (o reconciliar email↔user_id), o bloquear/migrar la entrada KV cuando cambia el email.
- `founders/store.ts:41-43,68-72` · `cuenta/founders-pass/page.tsx:45`

### 🟡 H-003-02 (P2) — Post-pago Founders confuso: banner inalcanzable + carrera redirect/webhook

- `api/checkout/route.ts:137` usa `success_url = /cuenta?purchase=success`, pero `PurchaseSuccessBanner`
  (que lee `?purchase=success`) vive en **`/cuenta/founders-pass`**, no en `/cuenta` → **el banner de éxito
  nunca se muestra**.
- Si el usuario va manualmente a `/cuenta/founders-pass` **antes de que llegue el webhook**, ve el `BuyCard`
  ("Conviértete en Founder") → sugiere que la compra falló. No hay estado "procesando" ni polling.

**Recomendación:** apuntar `success_url` a `/cuenta/founders-pass?purchase=success` y mostrar un estado
"pago en proceso, refresca en unos segundos" mientras `isFounder` aún sea false tras volver del checkout.

### 🟡 H-003-03 (P2) — Flash optimista en el panel del bar puede mentir

`BarDashboard.tsx:58-63` muestra "Pago confirmado. Tu plan está activo." ante `?purchase=success`
**aunque el webhook aún no haya registrado el pago** (`recordBarPlanPayment`). El server sí recarga el estado
real, pero el flash puede afirmar algo falso momentáneamente. **Recomendación:** condicionar el mensaje al
estado real del pago, o usar copy de "procesando".

### 🟡 H-003-04 (P2) — Precios de `/premium` desacoplados del catálogo server

`premium/page.tsx:36,126-143` toma los precios de i18n (`pT.plans`), no de `FOUNDERS_PASS_PRICES`. Si el
precio del catálogo cambia, `/premium` puede mostrar otro distinto. Además `/premium` y el Founders Pass
**comparten el mismo checkout/SKU** (`/cuenta/comprar`): "Premium" no es un producto de pago separado, sino
las features gateadas por `isPaseDT`=`isFounder`. **Recomendación:** derivar el precio mostrado del catálogo
server y confirmar que premium=founders es intencional (clarificar el copy).

### 🟡 H-003-05 (P2) — El webhook no maneja disputas/chargebacks

`api/stripe/webhook/route.ts` solo procesa `checkout.session.completed` y `charge.refunded`. No maneja
`charge.dispute.created` / `charge.dispute.funds_withdrawn` → un usuario que **abre una disputa/chargeback**
mantiene el acceso de Founder (no se revoca como sí ocurre con el refund). **Recomendación:** manejar el evento
de disputa para revocar la entitlement (o al menos marcarla para revisión).

### 🟢 H-003-06 (P3) — El contador de ingresos mezcla monedas

`getRevenueCents()` (`founders/store.ts:55,112`) suma céntimos de EUR y USD en un único contador
(`founders:revenue:total`). El propio código lo reconoce ("todas las monedas mezcladas"). Solo afecta a la
analítica rápida del panel admin, no a cobros. **Recomendación:** contadores por moneda.

### 🟢 H-003-07 (P3) — El plan de bar no expira

`barHasActivePlan` (`bars/store.ts:375-378`) considera activo cualquier pago `status==="active" && !refunded_at`
sin fecha de vencimiento. Es un "pago único Mundial 2026" pero nada lo desactiva tras el torneo. Probablemente
intencional; conviene decidir si debe haber corte temporal.

### 🟢 H-003-08 (P3) — `apiVersion` de Stripe no pineada

`lib/stripe/client.ts:16-19` no fija `apiVersion` (decisión documentada para no romper si la cuenta no aceptó
el upgrade). Aceptable, pero un bump del SDK puede cambiar la versión por defecto y alterar payloads. Recomendable
pinear una versión y gestionarla explícitamente.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Concesión solo por webhook**: `markFounder()` / `recordBarPlanPayment()` se invocan únicamente desde el
  webhook firmado. Ninguna página de retorno concede beneficios; `PurchaseSuccessBanner` es solo UI.
- ✅ **Idempotencia**: `markFounder` usa `sadd` (`wasNew`) → reentregas del webhook no duplican ingresos ni
  conceden dos veces. Los checkouts bloquean recompra (`already_founder`/`already_paid` → 409).
- ✅ **Precio server-side + moneda por país**: `FOUNDERS_PASS_PRICES` (800/600 céntimos) y `barPlanAmountCents`
  son la única fuente de verdad; `currencyForCountry` (LATAM+USA→usd, resto→eur) idéntica en ambos checkouts;
  el backend rechaza `currency_mismatch`. La UI (`ComprarPanel`, `/founders`, `PlanCards`) muestra precios coherentes.
- ✅ **Reembolso revoca acceso**: `markFounderRefunded` (`srem` + `refundedAt` + decremento revenue + evento);
  `markBarPaymentRefunded` (`status="refunded"`, `plan_id=null`, despublica el bar).
- ✅ **Gating premium centralizado y server-side**: todo pasa por `isPaseDT(email)` (hoy = `isFounder`),
  resuelto siempre desde la sesión, nunca desde el cliente.
- ✅ **Founders vs plan de bar** son productos/stores independientes (KV vs tabla `bar_payments`), distinguidos
  por `metadata.product` → sin doble concesión ni solape.

---

## C. Pendiente de verificación (requiere infra)

- **Claves Stripe**: confirmar en Vercel que se usan claves **live** en producción y **test** en preview/dev,
  y que `STRIPE_WEBHOOK_SECRET` corresponde al endpoint correcto en cada entorno.
- **Entrega del webhook**: confirmar que el endpoint `/api/stripe/webhook` está registrado en el Dashboard de
  Stripe con los eventos `checkout.session.completed` y `charge.refunded` (y, tras el fix, las disputas).
- **`STRIPE_FOUNDERS_PASS_PRICE_ID`** aparece en `.env.example` pero no se usa en el código (los precios son
  inline) → confirmar si es vestigio (cruza con H-000-03).

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Vincular entitlement de Founder a `user.id` (o reconciliar al cambiar email) | H-003-01 | P1 |
| 2 | `success_url` → `/cuenta/founders-pass?purchase=success` + estado "procesando" | H-003-02 | P2 |
| 3 | Condicionar el flash del bar-dashboard al estado real del pago | H-003-03 | P2 |
| 4 | Manejar `charge.dispute.created` en el webhook (revocar/marcar) | H-003-05 | P2 |
| 5 | Derivar precio de `/premium` del catálogo server; clarificar premium=founders | H-003-04 | P2 |
| 6 | Contadores de revenue por moneda; decidir expiración de plan de bar; pinear `apiVersion` | H-003-06/07/08 | P3 |
| — | (Build) `force-dynamic` en `/admin/founders` | H-000-01 | P0 (Fase 0) |

**Criterio de cierre:** entitlement robusto ante cambio de email; UX post-pago clara (éxito/procesando);
disputas manejadas; claves test/live confirmadas en Vercel.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-003-01 | P1 | `lib/founders/store.ts` (identidad por email) | Abierto |
| H-003-02 | P2 | `api/checkout/route.ts:137`, `cuenta/founders-pass/PurchaseSuccessBanner.tsx` | Abierto |
| H-003-03 | P2 | `BarDashboard.tsx:58-63` | Abierto |
| H-003-04 | P2 | `app/premium/page.tsx:36,126-143` | Abierto |
| H-003-05 | P2 | `api/stripe/webhook/route.ts` (sin disputas) | Abierto |
| H-003-06 | P3 | `lib/founders/store.ts:55,112` (revenue mezcla monedas) | Abierto |
| H-003-07 | P3 | `lib/bars/store.ts:375-378` (plan sin expiración) | Abierto |
| H-003-08 | P3 | `lib/stripe/client.ts:16-19` (apiVersion no pineada) | Abierto |

**Referencias cruzadas:** `/admin/founders` rompe el build (**H-000-01**, P0); cambio de email sin
reautenticación que dispara H-003-01 (**H-002-05**); checkouts y webhook seguros (**Fase 1**, OK).
