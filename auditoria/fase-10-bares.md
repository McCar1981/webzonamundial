# Fase 10 — Bares: directorio, dashboard, QR, kit

**Estado:** 🟨 Hallazgos menores (sin P0/P1)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías)
**Alcance:** `api/bars/*`, `lib/bars/*`, `components/bars/*`, `app/bares` (+`/precios`), `app/b/[barSlug]/*`, `app/bar-dashboard/*`, `app/r/[qrCode]`, `app/api/app-link`, `docs/bar-kit`. La **seguridad** se cubrió en Fase 1 (IDOR OK, SVG XSS **H-001-12**, texto sin sanear **H-001-13**), los **pagos** en Fase 3 (flash optimista **H-003-03**, plan sin expiración **H-003-07**) y el **admin** en Fase 4 (acciones destructivas **H-004-01**).

---

## Resumen ejecutivo

Módulo **funcional end-to-end, sin P0/P1**. El **flujo B2B completo funciona**: `/r/[qrCode]` cuenta el escaneo y
redirige a `/b/[slug]` con UTMs → `JoinButton` une (cookie `zm_bar` + `bar_participants` + miembro de liga) → el
layout de `/app` tiñe la experiencia con el tema/banner del bar. El gating de "bar no activo" es **consistente** en
las páginas públicas (`BarInactiveScreen`), el ranking del bar es **real** (predicciones resueltas + bracket), y el
**kit genera materiales reales** con el QR correcto del bar, exportables por impresión del navegador (Guardar como
PDF), con **gating premium server-side**.

Los hallazgos son de **acabado y consistencia** (P2/P3):
1. Una **métrica muerta** en el dashboard ("Predicciones" siempre 0 porque su evento nunca se emite).
2. El dashboard **no recarga** datos tras volver de Stripe (datos viejos hasta refrescar).
3. El **kit no aplica el tema del bar** (paleta dorada hardcodeada) y solo 1 de 7 materiales tiene su plantilla
   diseñada (el resto cae a un fondo CSS genérico funcional).
4. Una **ruta de QA** (`kit/test`) desplegada en producción (mitigada por auth+dueño).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 0 |
| **P2** | 6 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Alta/edición de bar y dashboard protegidos por propietario | ✅ (IDOR OK, Fase 1) — pero no refresca tras pago (H-010-02) |
| Generación y resolución de QR correcta y sin colisiones | ✅ `/r/[qrCode]` resuelve y redirige; conteo no atómico (P3) |
| Página pública del bar y kit descargable funcionan | ✅ Ambos funcionales; kit sin tema del bar (H-010-05) |
| Integración con precios/Stripe | ✅ (Fase 3) |
| Datos de bares validados; sin acceso cruzado | ✅ (IDOR OK, Fase 1) |

---

## A. Hallazgos

### 🟡 H-010-01 (P2) — Métrica "Predicciones" del dashboard siempre 0 (evento muerto)

`barStats` (`store.ts:502`) cuenta el evento `bar_prediction_completed`, pero **ese evento nunca se emite** en
ningún sitio del repo (solo aparece en el query). El dashboard del dueño muestra siempre **Predicciones = 0** aunque
los participantes jueguen. **Recomendación:** emitir el evento al resolver predicciones de un participante, o derivar
la métrica del leaderboard.

### 🟡 H-010-02 (P2) — El dashboard no recarga datos tras volver de Stripe

`BarDashboard.tsx:49-66`: `stats`/`qr`/`plan`/`payment` se guardan con `useState` sin setter; al volver de Stripe
(`?purchase=success`) solo se muestra un flash, **no se recargan** métricas ni el estado del plan desde el servidor →
el usuario ve datos viejos hasta refrescar manualmente. (Relacionado con el flash optimista **H-003-03**.)
**Recomendación:** `router.refresh()` tras el retorno de pago.

### 🟡 H-010-03 (P2) — El contexto de `/app` no revalida `barIsLive`

`context.ts:16-22` + `app/layout.tsx:32-35`: el banner/tema de `/app` se activa solo con la cookie `zm_bar` y
`getBarBySlug`, **sin comprobar `barIsLive`**. Si el bar se despublica o pierde el plan tras unirse, el usuario sigue
viendo "Estás jugando en la peña de X" (aunque `/b/slug` ya muestre `BarInactiveScreen`). **Recomendación:** validar
`barIsLive` al resolver el contexto.

### 🟡 H-010-04 (P2) — Ruta de QA `kit/test` desplegada en producción

`b/[barSlug]/kit/test/page.tsx` está desplegada sin `notFound` ni flag de entorno (exige `requireUser`+dueño, así que
no es anónima), con toolbar de debug y logos simulados. **Recomendación:** gatear por `NODE_ENV` o eliminar.

### 🟡 H-010-05 (P2) — El kit no aplica el tema del bar

El material del kit **ignora `bar.theme_id`/`themes.ts`**: `PremiumMundialMaterial` usa colores dorados hardcodeados
y `buildKitData` (`kit.ts:96-114`) no incluye el tema. La promesa "con su tema" no se cumple en el kit nuevo (solo el
`/cartel` legacy aplica `getTheme`). Los 16 temas existen y son válidos, pero **no llegan al material**.
**Recomendación:** pasar el tema del bar a la plantilla del kit.

### 🟡 H-010-06 (P2) — Solo 1 de 7 materiales del kit tiene plantilla diseñada

`kit-image-templates.ts:22-32`: solo `whatsapp` tiene imagen-plantilla real; los otros 6 (a4, a3, mesa-a6, story,
post, tv-slide) caen al fondo CSS genérico `PremiumMundialMaterial`. Funcionan (materiales reales con QR), pero no
usan el diseño documentado. Los docs (`ASSETS.md`) son **honestos** al marcarlos "⏳ falta imagen". **Recomendación:**
completar las plantillas o asumir el fallback como definitivo.

### Hallazgos P3 (menores)
- `store.ts:309`: conteo de escaneos read-modify-write no atómico (escaneos concurrentes pierden cuenta).
- Accesos directos a `/b/[slug]` (no vía `/r/...`) no se atribuyen (por diseño).
- `JoinButton.tsx`: un 403 (bar no live) deja el botón en idle sin mensaje (raro porque `/b` ya muestra inactivo).
- `tv/AutoRefresh.tsx`: recarga toda la página cada 20s (parpadeo) en vez de refresco incremental.
- `cartel/page.tsx` legacy duplica el cartel A4 del kit (uno con tema, otro sin) → inconsistencia.
- `BarKitPosterTemplate.tsx:128-129`: `dangerouslySetInnerHTML` de `qrSvg` (no explotable hoy; vector latente, ligado a H-001-12).
- `barVsBar` ("reto entre bares") no implementado, marcado "FASE 3" — correctamente no prometido en features.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Flujo escaneo→unirse→jugar end-to-end:** `/r/[qrCode]` (`resolveQrScan` cuenta + UTMs) → `/b/[slug]?qr=` →
  `JoinButton` (auto-une con `?qr`, o redirige a login con `?join=1` y auto-une al volver) → `bar_participants` +
  miembro de liga + cookie `zm_bar` (60d) → `/app` tematizado. Correcto.
- ✅ **Gating bar no-live:** `/b`, `/ranking`, `/tv` llaman `barIsLive` → `BarInactiveScreen`; `join` devuelve 403;
  el refund degrada a `pending_payment`.
- ✅ **Página pública `/b/[slug]`:** `notFound()` para slug inexistente; datos reales (premio, top-3, participantes,
  contacto); ranking real vía `barLeaderboard`→`leagueLeaderboard` (scoped a miembros).
- ✅ **Ranking y TV:** reales y en vivo (TV auto-refresca, estados sin participantes manejados).
- ✅ **Dashboard:** crear/editar bar, premios CRUD, QR oficial + por zonas (gating `maxQrSources` cliente+servidor),
  checkout Stripe, export CSV; estados (borrador/pendiente/activo/publicado/suspendido) claros.
- ✅ **Kit funcional:** materiales reales a tamaño exacto con QR correcto (`/r/[code]`, lib `qrcode`); export por
  `window.print()` + `@page size` (Guardar como PDF); **gating premium server-side** (redirect, no solo visual);
  validación de slug/material (`notFound`); descarga de QR PNG/SVG; **docs honestos** sobre placeholders.

---

## C. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Emitir `bar_prediction_completed` (o derivar la métrica) | H-010-01 | P2 |
| 2 | `router.refresh()` en el dashboard tras retorno de Stripe | H-010-02 | P2 |
| 3 | Validar `barIsLive` en el contexto de `/app` | H-010-03 | P2 |
| 4 | Gatear/eliminar `kit/test`; aplicar tema del bar al kit | H-010-04/05 | P2 |
| 5 | Completar plantillas del kit; consolidar cartel legacy vs kit a4 | H-010-06, P3 | P2/P3 |

**Criterio de cierre:** métricas del dashboard reales y refrescadas; contexto coherente con el estado del bar; kit
con tema del bar y sin rutas de QA expuestas.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-010-01 | P2 | `lib/bars/store.ts:502` (evento no emitido) | Abierto |
| H-010-02 | P2 | `app/bar-dashboard/BarDashboard.tsx:49-66` | Abierto |
| H-010-03 | P2 | `lib/bars/context.ts:16-22`, `app/layout.tsx:32-35` | Abierto |
| H-010-04 | P2 | `app/b/[barSlug]/kit/test/page.tsx` | Abierto |
| H-010-05 | P2 | `lib/bars/kit.ts:96-114`, `PremiumMundialMaterial.tsx:14-18` | Abierto |
| H-010-06 | P2 | `lib/bars/kit-image-templates.ts:22-32` | Abierto |
| H-010-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** SVG XSS de logos (**H-001-12**); flash optimista de pago (**H-003-03**); plan sin
expiración (**H-003-07**); acciones destructivas admin (**H-004-01**).
