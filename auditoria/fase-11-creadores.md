# Fase 11 — Creadores y registro por referido

**Estado:** 🟨 Hallazgos menores (sin P0/P1)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 1 sub-auditoría)
**Alcance:** `api/creators`, `lib/creators-live/*`, `lib/data/creators.ts`, `data/creadores.ts`, `app/creadores` (+`[slug]`), `app/registro/[creador]`, `app/zonamundial-images/creators`, componentes relacionados. La atribución de referido ya se tocó en Fase 2 (**H-002-09** falsificable); `creators/live` y `poll-creators-live` en Fase 1 (**H-001-01**).

---

## Resumen ejecutivo

Módulo **funcional, sin P0/P1**. Las páginas de creador renderizan con datos reales y `notFound()` para slug
inexistente; la **integración Twitch/live está bien construida y es segura** (tokens server-only cacheados, manejo
de errores/cuota, notificaciones idempotentes con cooldown 4h). Los hallazgos son de **consistencia de datos y
completitud**:

1. **Dos fuentes de creadores que divergen** (`data/creadores.ts` canónica con 5 creadores vs `lib/data/creators.ts`
   código muerto con 8 y un total falso "15.1M"). Mismo patrón que el Sanity muerto de la Fase 9.
2. **La atribución de referido es cosmética:** el creador se captura por registro pero **nunca se agrega** (no hay
   contador "referidos por creador"); además es falsificable (H-002-09). No apta para monetización tal cual.
3. Contadores de followers **hardcodeados** presentados como actuales (patrón de transparencia de fases 4/7).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 0 |
| **P2** | 4 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Atribución de referido persiste correctamente | ⚠️ Persiste por-fila, pero **no se agrega** (cosmética) y es falsificable (H-011-02) |
| Páginas de creador renderizan y manejan slug inexistente | ✅ `notFound()` + `generateStaticParams` |
| Estado "live" actualizado sin fugas | ✅ Twitch server-only, KV con TTL, sin fuga de tokens |
| Sin manipulación de métricas de referido | ⚠️ No hay métricas que manipular (no se agregan); el valor sí es falsificable |

---

## A. Hallazgos

### 🟡 H-011-01 (P2) — Dos fuentes de creadores que divergen; una es código muerto con roster falso

Existen dos datasets incompatibles:
- **`src/data/creadores.ts`** (5 creadores, por `slug`) — **canónica**: la usan todas las páginas públicas
  (`/creadores`, `/creadores/[slug]`, `/registro/[creador]`), el cron de Twitch y `fantasy/creator`.
- **`src/lib/data/creators.ts`** (8 creadores "Sportfield Agency", por `code`, `TOTAL_FOLLOWERS="15.1M"`) — **código
  muerto**: nadie la importa. Lista 4 creadores que el público **nunca ve** (Pimpeano, Nacho CP, Salvador, Franbar) y
  omite a Niku (que sí es público). Presenta un roster y un total **falsos** respecto a lo que el sitio muestra.

**Recomendación:** eliminar `lib/data/creators.ts` o reconciliarlo con la fuente canónica. (Cruza con H-009-02 Sanity muerto.)

### 🟡 H-011-02 (P2) — La atribución de referido es cosmética (no se agrega) y es falsificable

El slug del creador se captura bien en el registro (`RegistroCreadorClient` → `FormularioRegistro` → `addRegistro({creador})`)
y se persiste **por fila** en KV. Pero:
1. **No existe ningún agregador**: ni dashboard, ni cron, ni endpoint que cuente "cuántos referidos trajo cada
   creador" (`api/admin/registros` vuelca el CSV crudo sin `GROUP BY`; `daily-stats` no desglosa por creador).
2. Es **falsificable** (H-002-09 confirmado): editable post-registro vía `/api/fantasy/creator` y metadata.
3. Los "rankings Por Creador" son solo copy de marketing.

**Riesgo:** si se introducen **comisiones por referido**, el sistema actual no sirve (atribución no totalizada +
falsificable). **Recomendación:** si se monetiza, agregar conteo server-side y firmar/verificar la atribución.

### 🟡 H-011-03 (P2) — Followers hardcodeados presentados como actuales

`seguidores`/`seguidoresNum` ("4.7M", "2.5M"…) están **hardcodeados** en `creadores.ts:36-37` y el total combinado se
muestra como dato vigente ("X seguidores combinados") en metadata y H1 (`creadores/page.tsx:11`,
`CreadoresClient.tsx:203-206`). Riesgo de cifras desactualizadas presentadas como actuales. (Patrón de transparencia
de fases 4/7.)

### 🟡 H-011-04 (P2) — Riesgo de spam de notificaciones durante outage de KV

`notifications.ts:33,37`: si KV está caído, `hasRecentNotification` devuelve siempre `false` → cada poll (~2 min)
podría notificar "creador en vivo". Mitigado por el `tag` del navegador (colapsa duplicados), pero genera ruido.
**Recomendación:** fail-closed (no notificar) si KV no está disponible.

### Hallazgos P3 (menores)
- `CreadoresEditorial.tsx:62-63`: "Actualizado el 21 de mayo de 2026" hardcodeado; describe features (ligas privadas
  por creador, streaming sincronizado, picks de creador) cuya implementación no está verificada → posible sobre-promesa.
- `lib/data/creators.ts` excluye a "Joaco López por situación legal" (nota legal en un archivo muerto).

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Páginas**: `/creadores` y `/creadores/[slug]` renderizan datos reales; slug inexistente → `notFound()`;
  `generateStaticParams` desde `getAllCreadorSlugs()`; las imágenes de creadores existen y coinciden con el map.
- ✅ **Twitch/live** (`twitch.ts`): App Access Token (client_credentials) **cacheado server-side, nunca expuesto**;
  Helix correcto; manejo robusto de errores/cuota (token/`resp.ok`, chunks de 100, try/catch); degrada a "nadie en
  vivo" sin romper. Estado en KV con TTL 600s.
- ✅ **Banner/detalle live**: polling 60s, no renderiza si vacío, dismiss 30 min; iframe de Twitch con viewers.
- ✅ **Notificaciones** (`notifications.ts`): cooldown 4h por slug, se marca solo si `sent>0` (reintenta si nadie
  suscrito), `tag` por creador para colapsar duplicados → idempotente (salvo el caso de outage de KV, H-011-04).
- ✅ **Registro por creador**: `notFound()` + metadata/SEO completo + `generateStaticParams` (Fase 2 confirmó el flujo).

---

## C. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Eliminar/reconciliar `lib/data/creators.ts` (fuente muerta con roster falso) | H-011-01 | P2 |
| 2 | Si se monetiza el referido: agregar conteo server-side + firmar atribución | H-011-02 | P2 (P1 si se monetiza) |
| 3 | Etiquetar followers como aproximados o alimentarlos de fuente real | H-011-03 | P2 |
| 4 | Fail-closed en notificaciones si KV no disponible | H-011-04 | P2 |
| 5 | Revisar promesas de `CreadoresEditorial` vs features reales | P3 | P3 |

**Criterio de cierre:** una sola fuente de creadores; atribución de referido agregada/fiable si se monetiza; cifras
de followers honestas.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-011-01 | P2 | `src/lib/data/creators.ts` (muerto) vs `src/data/creadores.ts` | Abierto |
| H-011-02 | P2 | `registros-store.ts`, `api/admin/registros`, `api/fantasy/creator` (sin agregación) | Abierto |
| H-011-03 | P2 | `src/data/creadores.ts:36-37`, `creadores/page.tsx:11` | Abierto |
| H-011-04 | P2 | `lib/creators-live/notifications.ts:33,37` | Abierto |
| H-011-P3 | P3 | `CreadoresEditorial.tsx`, `lib/data/creators.ts` | Abierto |

**Referencias cruzadas:** atribución falsificable (**H-002-09**); cuota Twitch + cron (**H-001-01**); patrón de
fuentes muertas (**H-009-02** Sanity); patrón de cifras infladas (**H-004-P3**, **H-007-08**).
