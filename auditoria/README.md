# Auditoría ZonaMundial — Índice

Carpeta de resultados de la auditoría por fases. El plan maestro está en
[`../AUDITORIA-FASES.md`](../AUDITORIA-FASES.md). Aquí se guarda el **informe de cada fase**
con hallazgos, evidencia y estado.

## 📊 [RESUMEN GLOBAL](RESUMEN-GLOBAL.md) — vista consolidada de todas las fases (11 P0 · 36 P1 · 61 P2)

## Informes por fase

| Fase | Informe | Estado | P0 | P1 | P2 |
|------|---------|--------|----|----|----|
| 0 — Cimientos y configuración | [fase-00-cimientos.md](fase-00-cimientos.md) · [errores detallados](fase-00-errores-detalle.md) | 🟥 Hallazgos abiertos | 1 | 2 | 4 |
| 1 — Seguridad transversal | [fase-01-seguridad.md](fase-01-seguridad.md) · [detalle por endpoint](fase-01-errores-detalle.md) | 🟥 Hallazgos abiertos | 8 | 9 | 14 |
| 2 — Auth, cuenta y sesión | [fase-02-auth-cuenta.md](fase-02-auth-cuenta.md) · [detalle por archivo](fase-02-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 3 | 9 |
| 3 — Pagos: Stripe, checkout, founders, premium | [fase-03-pagos.md](fase-03-pagos.md) · [detalle por archivo](fase-03-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 1 | 4 |
| 4 — Panel de administración | [fase-04-admin.md](fase-04-admin.md) · [detalle por panel](fase-04-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 2 | 6 |
| 5 — Datos en vivo: match-center, calendario, amistosos | [fase-05-datos-vivo.md](fase-05-datos-vivo.md) · [detalle por archivo](fase-05-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 4 | 7 |
| 6 — Juego: predicciones, bracket, ranking | [fase-06-juego-predicciones.md](fase-06-juego-predicciones.md) · [detalle por archivo](fase-06-errores-detalle.md) | 🟥 Hallazgos abiertos | 1 | 6 | 6 |
| 7 — Juego: fantasy, modo carrera, trivia, micro | [fase-07-juego-engagement.md](fase-07-juego-engagement.md) · [detalle por archivo](fase-07-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 5 | 5 |
| 8 — IA: coach y pipeline de noticias | [fase-08-ia-noticias.md](fase-08-ia-noticias.md) · [detalle por archivo](fase-08-errores-detalle.md) | 🟥 Hallazgos abiertos | 1 | 4 | 6 |
| 9 — Contenido editorial: historia, blog, CMS Sanity | [fase-09-contenido-editorial.md](fase-09-contenido-editorial.md) · [detalle por archivo](fase-09-errores-detalle.md) | 🟨 Menores (sin P0/P1) | 0 | 0 | 4 |
| 10 — Bares: directorio, dashboard, QR, kit | [fase-10-bares.md](fase-10-bares.md) · [detalle por archivo](fase-10-errores-detalle.md) | 🟨 Menores (sin P0/P1) | 0 | 0 | 6 |
| 11 — Creadores y registro por referido | [fase-11-creadores.md](fase-11-creadores.md) · [detalle por archivo](fase-11-errores-detalle.md) | 🟨 Menores (sin P0/P1) | 0 | 0 | 4 |
| 12 — Notificaciones: push y email | [fase-12-notificaciones.md](fase-12-notificaciones.md) · [detalle por archivo](fase-12-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 4 | 7 |
| 13 — Contenido país: sedes, selecciones, grupos | [fase-13-contenido-pais.md](fase-13-contenido-pais.md) · [detalle por archivo](fase-13-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 1 | 9 |
| 14 — App PWA (/app) y onboarding | [fase-14-app-pwa-onboarding.md](fase-14-app-pwa-onboarding.md) · [detalle por archivo](fase-14-errores-detalle.md) | 🟥 Hallazgos abiertos | 0 | 2 | 7 |

## Convenciones

- **Estado:** `⬜ Pendiente` · `🟨 En curso` · `🟥 Hallazgos abiertos` · `✅ Auditado`
- **Severidad:** `P0` rompe prod/seguridad · `P1` bug/riesgo · `P2` deuda · `P3` cosmético
- Cada hallazgo tiene ID `H-FFF-NN` (FFF = fase). Se cierra cuando hay fix verificado o ticket.

## Entorno de la auditoría

- Fecha: 2026-06-08
- Node/npm: dependencias instaladas con `npm ci` (1436 paquetes).
- Comandos de verificación usados: `npx tsc --noEmit`, `npx next lint`, `npm run build`,
  `npm run validate-content`, `npm audit`.
