# Fase 9 — Contenido editorial: historia, blog, CMS Sanity

**Estado:** 🟨 Hallazgos menores (sin P0/P1)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías)
**Alcance:** `app/historia/*` (35 estáticas + 4 dinámicas), `app/blog`, `app/noticias` (presentación; pipeline en Fase 8), `src/data/historia-editorial/*`, `lib/content/`, `lib/blog/*`, `lib/evergreen/*`, `lib/biblia.ts`, `sanity.config.ts`, `src/sanity/*`, `schemas/`, `app/studio`.

---

## Resumen ejecutivo

La fase **más limpia hasta ahora**: **0 P0, 0 P1**. La sección **Historia** (39 rutas) es sólida y madura —
rutas dinámicas con patrón seguro (`dynamicParams=false` + `generateStaticParams` + `notFound()`), **integridad
referencial correcta** (0 enlaces rotos entre los datasets), render defensivo y **datos históricos factualmente
correctos** (muestra verificada: Uruguay 1930, Maracanazo, palmarés, Klose 16 goles…).

Dos hallazgos importantes de contraste/limpieza:
1. **El BLOG NO tiene el riesgo legal de las noticias.** Es contenido **original/evergreen** (pool de temas
   propios + dossier de datos internos verificados), firmado con **autoría organizacional** ("Editorial Zona
   Mundial", no autores-persona ficticios), con QA, imágenes **CC-licenciadas con crédito** (Wikimedia) y modelo
   **vigente** (Haiku 4.5). Confirma que el problema de la Fase 8 es **específico del pipeline de reescritura de
   fuentes**, no de todo el contenido IA.
2. **Sanity CMS es código muerto.** Nadie en `src/app` importa `src/sanity/*`; el sitio lee las noticias desde
   **KV**, no de Sanity. El Studio escribe en un dataset que nadie consume.

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
| Todas las subrutas de historia renderizan sin error | ✅ 39/39, sin crashes (tsc limpio, validate-content OK) |
| Rutas dinámicas manejan inputs inválidos | ✅ `notFound()` + `dynamicParams=false` → 404 limpio |
| Datos editoriales validados; sin enlaces rotos | ✅ 0 referencias rotas; datos factualmente correctos |
| Sanity Studio protegido; schemas coherentes | ⚠️ `/studio` sin protección de middleware (H-009-01); schema coherente pero **CMS muerto** (H-009-02) |
| Imágenes optimizadas y con `alt` | ⚠️ Blog: CC + crédito (OK); historia/noticias: mezcla `<img>` crudo (cruza Fase 17) |

---

## A. Hallazgos

### 🟡 H-009-01 (P2) — `/studio` (Sanity) sin protección del middleware

El middleware protege `/admin/*` pero **no `/studio`** (`middleware.ts:11-23`). La ruta queda servida públicamente
(solo `robots: noindex`), apoyándose enteramente en la auth nativa de proyecto de Sanity. Como el CMS no aporta
nada al sitio (H-009-02), lo más limpio es **retirar la ruta** o protegerla en el middleware como `/admin`.

### 🟡 H-009-02 (P2) — Sanity CMS es código muerto que coexiste con KV

`src/sanity/*` (client, queries, types, image, schema) **no es importado por ninguna página ni route handler** de
`src/app`. El front de noticias lee de **KV** (`@/lib/noticias-store`) y los autores de `@/data/noticias-authors`.
El Studio sigue desplegado y escribe en un dataset **que nadie lee** → dos modelos de datos paralelos donde uno es
inerte (deuda muerta: módulo, schema, env vars obligatorias, dependencia `next-sanity`). Candidato a **eliminación**.

### 🟡 H-009-03 (P2) — Bug de caché en `getCancelados()`

`lib/content/ediciones.ts:507-509`: si `canceladosCache` está poblado, devuelve `datoCierre: ''` (string vacío) en
vez del valor real → el "dato de cierre" **desaparece** tras el primer render cacheado. No rompe, pero muestra dato
incompleto. **Recomendación:** corregir el branch de caché.

### 🟡 H-009-04 (P2) — `momentos` vs `momentos-iconicos`: confusión y navegación huérfana

Dos features con nombre casi idéntico y **datasets separados**: `momentos.json` (`/historia/momentos`, enlazado
desde el hub) y `momentos-iconicos.ts` (`/historia/momentos-iconicos` index + `[slug]`, estructura en inglés). El
hub solo enlaza a `/momentos` → `/momentos-iconicos` parece **huérfano de navegación** (contenido válido pero poco
descubrible). **Recomendación:** consolidar o enlazar desde el hub.

### Hallazgos P3 (menores)
- `comparar/page.tsx:48-49` y `comparar-jugadores/page.tsx:41-42`: defaults frágiles (`!`/`all[1]`) ante renombrado
  de slugs o datasets muy pequeños; hoy no es riesgo real.
- `2026-norteamerica.json:51`: partido inaugural con `iso2:"un"` (placeholder) → imagen flagcdn 404 (no rompe).
- `momentos-iconicos/[slug]` usa un dataset paralelo en inglés (rompe el patrón homogéneo del resto de historia).
- SEO menor (para Fase 15): `records` sin sufijo de marca en el título; OG-image desigual entre subrutas.
- Blog: JSON-LD marca `NewsArticle` cuando es editorial/evergreen (mejor `Article`/`BlogPosting`); impacto SEO, no legal.
- Sanity: `SANITY_API_TOKEN` no se filtra hoy (el `previewClient` no lo importa ningún componente cliente), pero es
  riesgo latente si se reutilizara desde `"use client"`.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Historia — rutas**: las 4 dinámicas (`[edicion]`, `jugadores/[slug]`, `selecciones/[slug]`,
  `momentos-iconicos/[slug]`) usan `dynamicParams=false` + `generateStaticParams` + `notFound()` → slug inventado da
  **404 limpio**, no crash. Las 35 estáticas renderizan con datos reales y render defensivo (`?.`, guards `!proximo`,
  fallbacks de bandera).
- ✅ **Historia — datos**: integridad referencial completa (todos los `edicionSlug` y slugs de selección resuelven;
  0 enlaces rotos); datos históricos verificados como correctos; la edición 2026 marcada `proximo:true` y filtrada
  donde corresponde.
- ✅ **Blog**: contenido **original** (no reescribe terceros), autoría **organizacional** (sin personas ficticias),
  QA con el critic, imágenes **CC-licenciadas con crédito** (Wikimedia, filtra no-libres), modelo **vigente**
  (Haiku 4.5), coste acotado (`max_tokens:8000`, 1 llamada/cron, FIFO 50), `[slug]` con `notFound()`, RSS válido.
- ✅ **Sanity — coherencia**: el schema `noticia.ts` coincide con `queries.ts`/`types.ts`; `projectId`/`dataset` son
  `NEXT_PUBLIC_*` (públicos por diseño). El único problema es que **nadie lo consume**.

---

## C. Diferencia clave con la Fase 8 (importante)

| | Noticias (Fase 8) | Blog (Fase 9) |
|---|---|---|
| Origen | **Reescribe cuerpo completo de terceros** | **Original** (pool propio / dossier interno) |
| Autoría | **Personas ficticias** (Carlos Zamudio…) | **Organización** ("Editorial Zona Mundial") |
| Imágenes | Hotlink de prensa/agencia | **CC-licenciadas con crédito** |
| Riesgo legal | **Alto (H-008-01, P0)** | **Bajo / seguro** |

→ La solución de H-008-01 puede **tomar el modelo del blog** (contenido original + autoría organizacional + imágenes
licenciadas) como referencia.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Decidir Sanity: eliminar el módulo/Studio o protegerlo en middleware | H-009-01/02 | P2 |
| 2 | Corregir el branch de caché de `getCancelados()` | H-009-03 | P2 |
| 3 | Consolidar/enlazar `momentos-iconicos` desde el hub | H-009-04 | P2 |
| 4 | Limpiezas menores (defaults frágiles, JSON-LD del blog, SEO) | P3 | P3 |

**Criterio de cierre:** decisión sobre Sanity tomada (eliminar/proteger); bug de caché corregido; navegación de
historia coherente.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-009-01 | P2 | `src/middleware.ts` (/studio sin proteger) | Abierto |
| H-009-02 | P2 | `src/sanity/*` (CMS muerto) | Abierto |
| H-009-03 | P2 | `lib/content/ediciones.ts:507-509` | Abierto |
| H-009-04 | P2 | `app/historia/momentos-iconicos/*` vs `/momentos` | Abierto |
| H-009-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** noticias y autores ficticios (**H-008-01**, contraste con el blog); `<img>` crudo →
rendimiento (**Fase 17**); SEO detallado (**Fase 15**); presentación de noticias auditada en **Fase 8**.
