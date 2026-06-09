# Fase 8 — IA: coach y pipeline de noticias

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías; referencia de modelos vía skill `claude-api`)
**Alcance:** `api/ia-coach/*`, `lib/ia-coach/*`, `app/app/ia-coach`, `lib/noticias-*.ts` (ingest, enrich, rewriter, critic, store), `lib/gnews.ts`, `app/noticias`, `docs/NOTICIAS-SYNC-PLAN.md`. La **seguridad** ya se cubrió en **Fase 1**: IA coach público sin auth/rate-limit (**H-001-02** P0), crons de noticias con auth condicional (**H-001-01**). Esta fase audita **corrección, coste, vigencia de modelos, y cumplimiento legal del contenido**.

---

## Resumen ejecutivo

El **IA coach está bien construido** (clave server-side, system prompts con reglas anti-invención fuertes,
datos reales en contexto, caché efectiva, `max_tokens` acotado), pero usa un **modelo legacy** en sus 5 modos y
tiene manejo de errores genérico.

El **pipeline de noticias destapa el riesgo legal más alto de toda la auditoría (P0):** no es un agregador de
titulares con enlace, sino un sistema que **descarga el cuerpo completo** de artículos de medios (CNN, Marca,
FIFA…), los **reescribe con IA** "como si los hubiera escrito un editor de ZonaMundial desde cero" y los
**publica firmados por autores ficticios** (Carlos Zamudio / Gabriel Venegas no existen), con atribución mínima al
pie y JSON-LD que declara autoría/propiedad propia. Esto combina **infracción de copyright** (obra derivada del
texto íntegro de terceros) con **atribución falsa** (bylines inventadas) y se publica **100% automático sin
revisión humana**, pese a que la documentación afirma lo contrario.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 1 |
| **P1** | 4 |
| **P2** | 6 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Anthropic SDK: modelo/params vigentes; clave server-side; errores/timeouts | ⚠️ Clave OK; **modelo legacy** (H-008-05); manejo de errores genérico (H-008-06) |
| Límites de coste y rate-limit; prompts sin inyección | ⚠️ Coste acotado; sin prompt-caching; rate-limit ausente (H-001-02) |
| Pipeline noticias sin duplicados/contenido roto | ⚠️ Dedup parcial; fallback correcto, pero ver calidad |
| Atribución/fuentes y licencias | ❌ **Riesgo de copyright + atribución falsa** (H-008-01/03/04) |
| Moderación: sin contenido inapropiado/alucinado sin control | ❌ **100% automático, sin revisión humana** (H-008-02) |

---

## A. Hallazgos

### 🔴 H-008-01 (P0 · legal) — Republicación de contenido de terceros reescrito como obra propia con autores ficticios

El pipeline va mucho más allá de un agregador con enlace (uso justo típico):
1. **`noticias-enrich.ts:133-196`** descarga el **HTML completo** del medio original y extrae hasta **4.000
   caracteres del cuerpo** — eludiendo deliberadamente el snippet truncado de GNews.
2. **`noticias-rewriter.ts:5-6,42`** reescribe ese texto íntegro con IA "en estilo editorial propio… como si un
   editor de ZonaMundial lo hubiera escrito desde cero" → **obra derivada** del contenido protegido.
3. Se publica firmado por **autores ficticios** con biografías inventadas (`noticias-authors.ts:23-38`) y
   `publisher: ZonaMundial` en el JSON-LD, **sin `isBasedOn`/`citation`**.

**Veredicto:** **riesgo ALTO de infracción de copyright** (GNews entrega metadatos/snippets bajo su ToS; no
licencia para reproducir ni derivar el contenido completo del medio) **+ atribución falsa** (bylines inventadas) +
riesgo frente a AdSense (penaliza contenido reescrito de baja originalidad y autoría engañosa). **Recomendación
mínima:** eliminar el enrich de cuerpo completo (limitarse a cita corta + enlace `dofollow` prominente), atribución
honesta en cabecera, `isBasedOn` en JSON-LD, y revisar la legalidad de las firmas ficticias. (Cruza con **Fase 19
— Legal** y el patrón de transparencia de **H-007-05**.)

### 🟠 H-008-02 (P1) — Publicación 100% automática sin revisión humana (contradice la doc)

El docstring de `noticias-ingest.ts:13-14` afirma "never auto-published until human review", pero `applyRewrite`
marca `status:"published"` directamente si pasa el critic (`rewriter.ts:203`; `ingest-news/route.ts:302-306`). El
flujo GNews→enrich→rewrite→critic→**publish** es totalmente automático. **Recomendación:** introducir un estado de
revisión humana antes de publicar, o corregir la doc y asumir el riesgo explícitamente.

### 🟠 H-008-03 (P1) — Atribución débil/engañosa y JSON-LD de falsa autoría

- La fuente original aparece solo como "Información **complementaria** de [fuente]" al **pie**, con `rel="nofollow"`
  (`ArticleView.tsx:309-318`) — redacción que niega que la pieza **derive** del original; incluso el callout
  "Fuente" del stub se pierde al reemplazar el body por la salida de la IA.
- El JSON-LD `NewsArticle` declara `author: Person` (nombre ficticio) y `publisher: ZonaMundial`, **sin
  `isBasedOn`/`citation`** a la fuente (`[slug]/page.tsx:84-97`) → afirma autoría/propiedad original ante Google.

### 🟠 H-008-04 (P1) — Hotlinking de imágenes de terceros sin licencia

Se republica `article.image` (hotlink directo al CDN del medio, normalmente foto de agencia Getty/Reuters) como
hero, con `<img>` crudo (no `next/image`) (`noticias-ingest.ts:154-157`; `ArticleView.tsx:196-206`). Reuso de foto
con copyright sin licencia + hotlinking. **Recomendación:** no hotlinkear; usar imágenes propias/licenciadas.

### 🟠 H-008-05 (P1) — IA coach usa modelo legacy en los 5 modos (y la migración romperá)

Los 5 modos (analyze, live, coach, oracle, debate) hardcodean **`claude-sonnet-4-5-20250929`** — modelo **legacy**
(activo pero antiguo). Debería migrarse a `claude-sonnet-4-6` (o `claude-opus-4-8` para analyze/coach). **Además**,
analyze y coach usan `thinking:{type:"enabled",budget_tokens:2500}` + `temperature:1`, que **darán 400** al migrar
a Sonnet 4.6/Opus 4.7-4.8 (esos params están removidos/deprecados → usar `thinking:{type:"adaptive"}`).
- `anthropic-client.ts:15,52-59`, `coach-client.ts:19,43-44`, `live-client.ts:15`, `oracle-client.ts:19`, `debate-client.ts:17`.

### 🟡 H-008-06 (P2) — IA coach: manejo de errores genérico del SDK

Ningún wrapper usa excepciones tipadas (`Anthropic.RateLimitError`, `OverloadedError`, `APIError`): el error sube
crudo y el route lo colapsa a `502 anthropic_failed` para todo (429/529/500/timeout); no se lee `retry-after` ni se
distingue rate-limit de fallo real (`anthropic-client.ts:46-62`). **Recomendación:** clasificar con excepciones
tipadas y respetar `retry-after`.

### 🟡 H-008-07 (P2) — IA coach: sin streaming, sin prompt-caching, rotación de caché que multiplica coste

- analyze/coach: `max_tokens≈4700` con thinking y `maxDuration=60` sin streaming → riesgo de timeout p95
  (`analyze/route.ts:25-27`). Recomendado `stream()` + `.finalMessage()`.
- No se usa **prompt caching** de Anthropic sobre los system prompts grandes y estables (~4K tokens) → se reenvían
  full cada miss; un breakpoint ahorraría ~90% del input.
- El slot de caché de analyze **rota cada 2h** "para variabilidad" → hasta ~12 generaciones/partido/día sin cambio
  de datos; el propio comentario estima **~$72/día** peor caso (`cache.ts:9-17,46-48`).

### 🟡 H-008-08 (P2) — IA coach: sin disclaimer de juego responsable

El coach genera over/under, picks y cuotas implícitas sin un disclaimer explícito de "no es consejo de apuestas /
juego responsable" (`system-prompt.ts:79-83`). Relevante para un producto con quiniela/odds. (Cruza con Fase 19.)

### 🟡 H-008-09 (P2) — Noticias: dedup parcial y verificación factual limitada

- **Dedup:** hay 3 capas (hash de URL, fingerprint de título, slug en el merge), pero el `knownFingerprints` solo
  se pasa en backfill; en el tick normal **no hay dedup por título cross-fuente**, solo por URL
  (`ingest-news/route.ts:208-213`).
- **Alucinación:** el rewriter prohíbe inventar pero permite "contextualizar con conocimiento general verificable"
  (`rewriter.ts:45-62`) → puerta a datos de memoria del modelo no presentes en la fuente.
- **Critic en re-auditoría:** `audit-noticias` pasa `sourceText="(no disponible)"` → el critic **no puede verificar
  precisión factual** al re-auditar; solo relevancia/estilo (`audit-noticias/route.ts:60-66`).

### 🟡 H-008-10 (P2) — Noticias: Haiku como puerta de control de calidad

Rewriter y critic usan `claude-haiku-4-5-20251001` (`rewriter.ts:21`, `critic.ts:16`). Haiku es el modelo **menos
capaz** para juzgar precisión factual / detectar alucinaciones, y es precisamente el **gate** de publicación.
`ANTHROPIC_MODEL` aplica a ambos por igual (no se puede subir solo el critic). **Recomendación:** usar un modelo más
capaz (sonnet-4-6/opus-4-8) al menos para el critic.

### 🟡 H-008-11 (P2) — Doc `NOTICIAS-SYNC-PLAN.md` desactualizada

El plan describe RSS feeds (FIFA/Marca/ESPN/BBC) + Sanity + revisión; lo implementado es **GNews API + Vercel KV +
autopublicación sin humano**. Divergencia grande (`NOTICIAS-SYNC-PLAN.md:46-75` vs código).

### Hallazgos P3 (menores)
- `cache.ts:11`: comentario "temperature 0.7" desalineado con `temperature:1` real.
- `debate-client.ts:52-53`: `userName` (server-side) interpolado en el system prompt — riesgo bajo.
- Noticias: slugs duplicados en drafts se descartan silenciosamente del feed (`store.ts:189`); fecha/hora de
  publicación fabricada (`T08:00:00Z`); dedup del critic es un juicio LLM blando.
- IA coach: JSON forzado manualmente en vez de `output_config.format` (structured outputs) — mejora al migrar.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **IA coach**: `ANTHROPIC_API_KEY` server-side, cliente singleton; system prompts con reglas anti-invención y
  datos reales inyectados (Monte Carlo, odds, forma, lesiones, H2H); `max_tokens` acotado (500–4700); claves de
  caché **server-side y deterministas** (matchId + dataVersion + PROMPT_VERSION); `debate` gated (auth+Founders) con
  `MAX_USER_TURNS`/`MAX_MESSAGE_LEN` y memoria con TTL 60d acotada; oracle valida equipos con `isKnownTeam`.
- ✅ **Noticias — robustez**: si la IA falla, la pieza queda en `review`/`draft` — **nunca se publica el raw scrape**
  (`rewriter.ts:162-166`); coste acotado (`NEWS_DAILY_CAP=30`, `NEWS_REWRITE_LIMIT`, deadlines, max_tokens); critic
  como **doble gate** (dimensiones críticas ≥3 + media ≥3.0 + no duplicado) con la decisión en código, no en el
  `publicar` del modelo; lock distribuido en KV; el trim nunca borra `published`.

---

## C. Notas de modernización de modelos (referencia oficial)

| Uso | Model ID actual | Estado | Recomendado |
|-----|-----------------|--------|-------------|
| IA coach (5 modos) | `claude-sonnet-4-5-20250929` | Legacy (activo) | `claude-sonnet-4-6` (o `claude-opus-4-8` para analyze/coach) |
| Noticias rewriter/critic | `claude-haiku-4-5-20251001` | Vigente | Haiku OK para rewrite; **subir el critic** a sonnet-4-6 |
| (otros módulos) | `claude-opus-4-6`, `claude-sonnet-4-6` | Vigentes | OK |

> Al migrar el coach: quitar `temperature`/`budget_tokens` de analyze/coach y usar `thinking:{type:"adaptive"}`
> (si no, 400 en 4.6/4.8). Las claves de caché no incluyen el modelo → bumpear `PROMPT_VERSION` al migrar.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Reestructurar noticias: cita corta + enlace dofollow, sin scrape de cuerpo completo; atribución honesta; `isBasedOn`; revisar firmas ficticias | H-008-01/03 | P0 |
| 2 | Introducir revisión humana antes de publicar (o corregir la doc) | H-008-02 | P1 |
| 3 | No hotlinkear imágenes de terceros; usar propias/licenciadas | H-008-04 | P1 |
| 4 | Migrar IA coach a `claude-sonnet-4-6` (adaptive thinking; quitar temperature/budget_tokens) | H-008-05 | P1 |
| 5 | Errores tipados + retry-after; streaming en analyze/coach; prompt-caching; revisar rotación de slot | H-008-06/07 | P2 |
| 6 | Disclaimer de juego responsable; subir el critic a un modelo más capaz; activar dedup por fingerprint en tick normal | H-008-08/10/09 | P2 |

**Criterio de cierre:** contenido de noticias sin riesgo de copyright (cita+enlace, atribución honesta, sin firmas
falsas), con control de publicación; IA coach en modelo vigente con manejo de errores robusto.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-008-01 | P0 | `noticias-enrich.ts:133-196`, `noticias-rewriter.ts:5-42`, `noticias-authors.ts:23-38` | Abierto |
| H-008-02 | P1 | `noticias-ingest.ts:13-14` vs `rewriter.ts:203`, `ingest-news/route.ts:302-306` | Abierto |
| H-008-03 | P1 | `ArticleView.tsx:309-318`, `[slug]/page.tsx:84-97` | Abierto |
| H-008-04 | P1 | `noticias-ingest.ts:154-157`, `ArticleView.tsx:196-206` | Abierto |
| H-008-05 | P1 | `lib/ia-coach/*-client.ts` (modelo legacy + params) | Abierto |
| H-008-06 | P2 | `lib/ia-coach/anthropic-client.ts:46-62` | Abierto |
| H-008-07 | P2 | `anthropic-client.ts:20-21`, `cache.ts:9-48` | Abierto |
| H-008-08 | P2 | `lib/ia-coach/system-prompt.ts:79-83` | Abierto |
| H-008-09 | P2 | `ingest-news/route.ts:208-213`, `rewriter.ts:45-62`, `audit-noticias/route.ts:60-66` | Abierto |
| H-008-10 | P2 | `noticias-rewriter.ts:21`, `noticias-critic.ts:16` | Abierto |
| H-008-11 | P2 | `docs/NOTICIAS-SYNC-PLAN.md` vs código | Abierto |
| H-008-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** IA coach sin auth/rate-limit (**H-001-02**, P0); crons de noticias (**H-001-01**);
patrón de transparencia/autoría engañosa (**H-007-05**); legal/GDPR (**Fase 19**).
