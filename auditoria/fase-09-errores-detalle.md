# Fase 9 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-09-contenido-editorial.md](fase-09-contenido-editorial.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Historia — rutas

| Ruta/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| `[edicion]`, `jugadores/[slug]`, `selecciones/[slug]`, `momentos-iconicos/[slug]` | Dinámicas | OK — `dynamicParams=false` + `generateStaticParams` + `notFound()`; slug inventado → 404 limpio | OK | [edicion]/page.tsx:16,66,155; jugadores/[slug]/page.tsx:13,27,72 |
| comparar/page.tsx | Input inválido | Default frágil `?? getEdicionBySlug("1970-mexico")!` | P3 | comparar/page.tsx:48-49 |
| comparar-jugadores/page.tsx | Input inválido | `?? all[1]` rompería con <2 jugadores (no real hoy) | P3 | comparar-jugadores/page.tsx:41-42 |
| [edicion] (2026) | Dato faltante | `iso2:"un"` placeholder → imagen flagcdn 404 (no rompe) | P3 | 2026-norteamerica.json:51 |
| momentos vs momentos-iconicos | Navegación | `/momentos-iconicos` huérfano del hub; dataset paralelo en inglés | P2 | historia/page.tsx:346; momentos-iconicos.ts:17 |
| momentos-iconicos/[slug] | Fuente datos | Usa `@/data/momentos-iconicos` (estructura distinta), rompe patrón | P3 | momentos-iconicos/[slug]/page.tsx:4 |
| records/page.tsx | SEO | `title:{absolute}` sin sufijo de marca | P3 | records/page.tsx:10 |
| varias | SEO OG | OG-image desigual entre subrutas | P3 | campeones/page.tsx:23 |
| lib/content/ediciones.ts | Caché | `getCancelados()` devuelve `datoCierre:''` tras cachear | P2 | ediciones.ts:507-509 |
| selecciones-historicas.json | Integridad | OK — 8 slugs coinciden con `getSeleccionSlug`, sin enlaces rotos | OK | historia/page.tsx:580-592 |
| JSON temáticos (todos) | Integridad | OK — todos los `edicionSlug` resuelven (0 rotos) | OK | grep edicionSlug |
| datos editoriales | Factual | OK — muestra verificada correcta (campeones, goleadores, momentos) | OK | momentos-iconicos.ts:24-59 |
| todas | Render | OK — `?.`, guards `!proximo`, fallbacks de bandera | OK | [edicion]/page.tsx:226,331 |

**Inventario:** 4 dinámicas (patrón seguro) + 35 estáticas (todas contenido real, 0 stubs). `momentos-iconicos`
huérfano de navegación pero válido.

---

## B. Blog

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| generator.ts | Origen | OK — original (pool de 20 temas propios); no reescribe terceros | OK | generator.ts:102-123 |
| types.ts/jsonld.ts | Autoría | OK — "Editorial Zona Mundial" (Organization), no personas ficticias | OK | types.ts:151-154; jsonld.ts:17-23 |
| generator.ts | Modelo | OK — Haiku 4.5 vigente (`claude-haiku-4-5-20251001`) | OK | generator.ts:19 |
| evergreen/generator.ts | Origen | OK — dossier de datos internos verificados, temperature 0.2 | OK | dossier.ts:11-13 |
| critic-adapter.ts | QA | OK — mismo critic que noticias; rechazados no se persisten | OK | critic-adapter.ts:14,87-92 |
| generate-blog-post/route.ts | Coste | OK — max_tokens 8000, 1 llamada/cron, idempotente, FIFO 50 | OK | store.ts:19,61-66 |
| image-picker.ts | Imágenes | OK — solo CC libre + crédito (Wikimedia), filtra no-libres | OK | image-picker.ts:178-182 |
| [slug]/page.tsx | Slug inválido | OK — `notFound()`, respeta noindex | OK | [slug]/page.tsx:38-39 |
| rss.xml/route.ts | RSS | OK — RSS 2.0 válido, escapa XML, UTC | OK | rss.xml/route.ts:26-49 |
| jsonld.ts | Tipo schema | `NewsArticle` para contenido editorial (mejor `Article`/`BlogPosting`) | P3 | jsonld.ts:11 |

---

## C. Sanity CMS

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| middleware.ts | /studio protegido | NO cubierto por middleware; solo `noindex`; depende de auth nativa Sanity | P2 | middleware.ts:11-23; studio/layout.tsx:1-4 |
| src/sanity/* | CMS en uso | MUERTO — ningún componente/route de `src/app` lo importa; el front lee KV | P2 | grep sin consumidores; noticias/page.tsx:3 |
| noticia.ts vs queries/types | Coherencia | OK — schema coincide con queries/types (internamente consistente) | OK | noticia.ts:8-125; queries.ts:4-22 |
| env.ts | Config | `projectId`/`dataset` con `assertValue` (rompe /studio si faltan); son NEXT_PUBLIC_* (OK) | P3 | env.ts:4-19 |
| client.ts | Token | `SANITY_API_TOKEN` no se filtra hoy (previewClient sin consumidores); riesgo latente | P3 | client.ts:12-18 |

---

## D. Veredictos

**Blog vs Noticias (legal):** el blog es **original/seguro** (autoría organizacional, imágenes CC, sin reescritura
de terceros) → NO comparte el riesgo H-008-01. La solución de noticias puede modelarse sobre el blog.

**Sanity:** prácticamente **muerto** y sin coexistencia visible (el front usa KV). Recomendación: eliminar o
proteger `/studio`. No hay divergencia de datos en runtime porque Sanity no se lee.
