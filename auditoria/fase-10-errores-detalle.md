# Fase 10 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-10-bares.md](fase-10-bares.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Flujo B2B (escaneo, dashboard, página pública)

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| `/r/[qrCode]` | Resolución QR | OK — `resolveQrScan` cuenta + UTMs, redirige a `/b/[slug]`, fallback `/bares` | OK | r/[qrCode]/route.ts:17-30 |
| store.ts `resolveQrScan` | Conteo atómico | Read-modify-write no atómico → escaneos concurrentes pierden cuenta | P3 | store.ts:309 |
| store.ts `barStats` | Métrica Predicciones | Cuenta `bar_prediction_completed`, evento **nunca emitido** → siempre 0 | P2 | store.ts:502 |
| BarDashboard.tsx | Refresco tras pago | `useState` sin setter; no recarga stats/plan tras Stripe | P2 | BarDashboard.tsx:49-66 |
| BarDashboard.tsx `ZonesSection` | Gating maxQrSources | OK — cliente + servidor; cuenta principal+zonas | OK | BarDashboard.tsx:592-593 |
| context.ts / app/layout | barIsLive | No revalida `barIsLive`; banner persiste tras despublicar | P2 | context.ts:16-22 |
| JoinButton.tsx | Manejo 403 | 403 (bar no live) deja botón idle sin mensaje (raro vía UI) | P3 | JoinButton.tsx:34-50 |
| b/[barSlug]/page.tsx | Slug inexistente | OK — `notFound()` en page/ranking/tv | OK | page.tsx:33 |
| b/[barSlug] | Datos públicos | OK — premio, top-3, participantes, contacto reales | OK | page.tsx |
| barLeaderboard | Ranking | OK — real (predicciones resueltas + bracket), scoped a miembros | OK | store.ts (leagueLeaderboard) |
| tv/AutoRefresh.tsx | Auto-refresh | `window.location.reload()` cada 20s (recarga total, parpadeo) | P3 | AutoRefresh.tsx:8 |
| plans.ts | barVsBar | No implementado ("FASE 3"); correctamente no prometido | P3 | plans.ts:22,51 |

**Veredicto flujo:** funciona end-to-end (escaneo→unirse→jugar→tematizado). Sin mock en datos visibles salvo la
métrica "Predicciones" (siempre 0 por evento no emitido).

---

## B. Kit de materiales

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| kit.ts / PremiumMundialMaterial | Funcional | OK — materiales reales a tamaño exacto, QR incrustado, datos reales | OK | kit.ts:35-64 |
| kit.ts | QR | OK — `qrcode` → `${origin}/r/${code}`, multi-QR por `?code=` | OK | kit.ts:99-102 |
| [material]/page.tsx | Export | Print CSS (`window.print()` + `@page size`); sin PDF/PNG server-side | OK | [material]/page.tsx:78-89 |
| [material]/page.tsx | Gating premium | OK — server-side (`redirect` si `!plan.premiumMaterials`) | OK | [material]/page.tsx:47-51 |
| [material]/page.tsx | Validación | OK — `getKitMaterial`/bar/QR inexistentes → `notFound`/`redirect` | OK | [material]/page.tsx:38-64 |
| kit-image-templates.ts | Plantillas | Solo 1/7 (whatsapp) tiene imagen; 6 caen a fondo CSS genérico | P2 | kit-image-templates.ts:22-32 |
| PremiumMundialMaterial / buildKitData | Temas | NO aplica `bar.theme_id`; paleta dorada hardcodeada | P2 | PremiumMundialMaterial.tsx:14-18; kit.ts:96-114 |
| kit/test/page.tsx | Ruta QA | Desplegada sin gate de entorno (auth+dueño mitiga) | P2 | kit/test/page.tsx:51-65 |
| kit/test/page.tsx | QR del test | `margin:0` (sin quiet zone) — frágil, solo en test | P3 | kit/test/page.tsx:70-72 |
| BarKitPosterTemplate.tsx | qrSvg | `dangerouslySetInnerHTML` (no explotable hoy; latente) | P3 | BarKitPosterTemplate.tsx:128-129 |
| KitPanel.tsx | Descarga QR | OK — PNG/SVG en cliente vía `qrcode` + `a.download` | OK | KitPanel.tsx:54-60 |
| cartel/page.tsx (legacy) | Duplicación | Cartel A4 independiente con `getTheme`, duplica el kit a4 | P3 | cartel/page.tsx:48 |
| themes.ts | Temas | OK — 16 temas válidos con contraste; pero no llegan al kit | OK | themes.ts |
| docs/bar-kit | Coherencia | OK — ASSETS/STORYBOARD honestos (marcan placeholders ⏳) | OK | ASSETS.md:22-30 |

**Veredicto kit:** FUNCIONAL (materiales reales con QR correcto, gating server-side, export por impresión). Limitado
en acabado visual: 6/7 plantillas usan fallback genérico y los temas del bar no se aplican.

---

## C. Resumen de severidades (Fase 10, nuevos)
- **P0/P1:** ninguno.
- **P2 (6):** métrica Predicciones muerta (H-010-01), dashboard sin refresco tras pago (H-010-02), contexto sin
  barIsLive (H-010-03), kit/test desplegado (H-010-04), kit sin tema (H-010-05), 6/7 plantillas en fallback (H-010-06).
- **P3:** conteo escaneos no atómico, slug directo sin tracking, 403 sin mensaje, TV reload total, cartel duplicado,
  qrSvg latente, barVsBar futuro.
- **Cruces:** H-001-12, H-003-03, H-003-07, H-004-01.
