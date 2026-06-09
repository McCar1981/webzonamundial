# Fase 3 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-03-pagos.md](fase-03-pagos.md)

Detalle del flujo de pagos archivo por archivo, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Librerías de pago

| Archivo | Aspecto | Veredicto | Sev | Evidencia |
|---|---|---|---|---|
| lib/stripe/client.ts | Singleton server-only | OK — lanza si falta `STRIPE_SECRET_KEY`; appInfo correcto | OK | client.ts:8-28 |
| lib/stripe/client.ts | apiVersion | No pineada (decisión documentada); riesgo de cambio al bump del SDK | P3 | client.ts:16-19 |
| lib/stripe/client.ts | Catálogo precios | OK — `FOUNDERS_PASS_PRICES` 800/600 céntimos; `isValidCurrency` | OK | client.ts:39-48 |
| lib/founders/store.ts | markFounder idempotente | OK — `sadd` controla `wasNew`; revenue/evento solo la 1ª vez | OK | store.ts:49-65 |
| lib/founders/store.ts | Identidad por email | **Por email normalizado, no user.id** → huérfano/pérdida de acceso al cambiar email | P1 | store.ts:41-43,68-72 |
| lib/founders/store.ts | markFounderRefunded | OK — `srem` + `refundedAt` + decremento + evento | OK | store.ts:86-104 |
| lib/founders/store.ts | getRevenueCents | Mezcla céntimos EUR+USD en un contador (solo analytics) | P3 | store.ts:55,112 |
| lib/pasedt/entitlement.ts | Gating premium | OK — `isPaseDT`=`isFounder`, server-only, centralizado | OK | entitlement.ts:23-26 |
| lib/founders/currency-by-country.ts | Moneda por país | OK — LATAM+USA→usd, resto→eur; default eur; anti-arbitraje | OK | currency-by-country.ts:62-68 |
| lib/bars/plans.ts | Catálogo planes | OK — 49/99/179 EUR (55/109/199 USD); `barPlanAmountCents` en céntimos; cliente no elige precio | OK | plans.ts:25-53,76-77 |

---

## B. Handlers de pago (verificados en Fase 1, confirmados aquí)

| Archivo | Aspecto | Veredicto | Sev | Evidencia |
|---|---|---|---|---|
| api/stripe/webhook/route.ts | Firma + raw body | OK (Fase 1) | OK | webhook/route.ts:184-194 |
| api/stripe/webhook/route.ts | Eventos manejados | Solo `checkout.session.completed` + `charge.refunded`; **sin disputas/chargebacks** | P2 | webhook/route.ts:197-214 |
| api/stripe/webhook/route.ts | Idempotencia refund | OK — comentario + `markFounder` SADD | OK | webhook/route.ts:218-220 |
| api/checkout/route.ts | Precio server-side | OK (Fase 1) — catálogo + moneda por país; rechaza mismatch | OK | checkout/route.ts:56-86 |
| api/checkout/route.ts | success_url | `/cuenta?purchase=success` — banner está en otra ruta (ver C) | P2 | checkout/route.ts:137 |
| api/checkout/route.ts | Bloqueo recompra | OK — `already_founder` 409 | OK | checkout/route.ts:45-50 |
| api/bars/checkout/route.ts | Precio server-side + dueño | OK (Fase 1) | OK | bars/checkout/route.ts:37-55 |
| api/bars/checkout/route.ts | Bloqueo doble pago | OK — `already_paid` 409 | OK | bars/checkout/route.ts:46-48 |

---

## C. Páginas y estados de UI

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| cuenta/founders-pass/page.tsx | Lee estado real | OK — `isFounder`+`getFounderRecord` server; `force-dynamic`; no concede | OK | founders-pass/page.tsx:45-47 |
| founders-pass/PurchaseSuccessBanner.tsx | ¿Concede? | OK — solo UI, lee `?purchase=success` | OK | PurchaseSuccessBanner.tsx:5-26 |
| checkout → /cuenta | Banner inalcanzable | success_url=`/cuenta?purchase=success` pero el banner vive en `/cuenta/founders-pass` → nunca se ve | P2 | checkout/route.ts:137; cuenta/page.tsx:11-67 |
| founders-pass/page.tsx | Carrera redirect/webhook | Si llega antes del webhook ve `BuyCard` ("hazte Founder") → parece que falló; sin estado "procesando" | P2 | founders-pass/page.tsx:62-72 |
| ComprarPanel.tsx | Cancelación | OK — `?canceled=1` muestra aviso naranja | OK | ComprarPanel.tsx:24,96-107 |
| ComprarPanel.tsx | Precio mostrado | OK — coherente con catálogo (8 €/6 USD) | OK | ComprarPanel.tsx:18-21 |
| premium/page.tsx | Qué vende | Landing client; vende "Premium" pero enlaza al **mismo SKU Founders** (`/cuenta/comprar`) | (nota) | premium/page.tsx:455-456 |
| premium/page.tsx | Precio desacoplado | Precios desde i18n (`pT.plans`), no del catálogo server → riesgo de desincronización | P2 | premium/page.tsx:36,126-143 |
| premium/page.tsx | Gating | OK — la landing no desbloquea nada; gating real server-side | OK | premium/page.tsx (UI) |
| founders/page.tsx | Precio | OK — "8 €"/"6 USD" coincide con catálogo | OK | founders/page.tsx:158-159 |
| bares/PlanCards.tsx | Precio | OK — lee `planList()` del catálogo; checkout usa misma fuente | OK | PlanCards.tsx:10,43-48 |
| bar-dashboard | Flash post-pago | "Plan activo" mostrado por `?purchase=success` aunque el webhook no haya registrado aún | P2 | BarDashboard.tsx:58-63 |
| lib/bars/store.ts | Plan activo | OK — `barHasActivePlan` = `active && !refunded`; `barIsLive` = `published && activo` | OK | bars/store.ts:375-386 |
| lib/bars/store.ts | Expiración | El plan no expira (sin corte temporal) | P3 | bars/store.ts:375-378 |
| lib/bars/store.ts | Refund | OK — `refunded`, `plan_id=null`, despublica | OK | bars/store.ts:430-443 |
| admin/founders/page.tsx | Build sin KV | `revalidate=60` + llamadas sin `.catch()` ni `force-dynamic` → rompe build (= H-000-01) | P0→Fase 0 | admin/founders/page.tsx:20,44-49 |
| admin/founders/page.tsx | Contenido | OK — count, revenue (mezcla monedas, etiquetado), lista con estado/recibos, emails censurados | OK | admin/founders/page.tsx:59-143 |

---

## D. Coherencia precio→producto→beneficio

| Producto | Precio UI | Catálogo server | ¿Coincide? |
|----------|-----------|-----------------|------------|
| Founders Pass | 8 € / 6 USD (ComprarPanel, /founders) | `FOUNDERS_PASS_PRICES` 800/600 céntimos | ✅ |
| Premium (landing) | desde i18n `pT.plans` | mismo SKU Founders | ⚠️ desacoplado (H-003-04) |
| Bar · Arranque | 49 € / 55 USD | `plans.ts` priceEur/Usd | ✅ |
| Bar · Completo | 99 € / 109 USD | `plans.ts` | ✅ |
| Bar · Pro | 179 € / 199 USD | `plans.ts` | ✅ |

Moneda: `currencyForCountry` (LATAM+USA→usd, resto→eur), idéntica en founders y bares; backend rechaza
`currency_mismatch`. Beneficio: `isPaseDT`=`isFounder` (server-side) desbloquea premium; plan de bar gatea
features vía flags del catálogo (`maxQrSources`, `exportParticipants`, etc.).

---

## E. Pendiente de verificación (no derivable del repo)
- Claves Stripe live/test correctas por entorno y `STRIPE_WEBHOOK_SECRET` correcto.
- Endpoint del webhook registrado en el Dashboard de Stripe con los eventos correctos.
- `STRIPE_FOUNDERS_PASS_PRICE_ID` (en `.env.example`) parece vestigio: el código usa precios inline.
