# Fase 8 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-08-ia-noticias.md](fase-08-ia-noticias.md)

Detalle por archivo de IA coach y pipeline de noticias, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. IA Coach

| Modo/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| Todos `*-client.ts` | Modelo | `claude-sonnet-4-5-20250929` legacy en los 5 modos | P1 | anthropic-client.ts:15; coach:19; live:15; debate:17; oracle:19 |
| analyze, coach | Params | `thinking:{enabled,budget_tokens:2500}` + `temperature:1` → 400 al migrar a 4.6/4.8 | P1 | anthropic-client.ts:52-59; coach-client.ts:43-44 |
| Todos | Manejo de errores | Sin excepciones tipadas; todo colapsa a `502`; no lee `retry-after` | P2 | anthropic-client.ts:46-62; analyze/route.ts:80-88 |
| analyze, coach | Streaming | Sin streaming, `max_tokens≈4700`, `maxDuration=60` → timeout p95 | P2 | anthropic-client.ts:20-21; analyze/route.ts:25-27 |
| Todos | Prompt caching Anthropic | No usa `cache_control` sobre system prompts grandes/estables | P2 | (ausente) |
| analyze | Rotación de caché | Slot rota cada 2h → ~12 gen/partido/día; ~$72/día peor caso | P2 | cache.ts:9-17,46-48 |
| Todos | Clave API | OK — `ANTHROPIC_API_KEY` server-side, singleton, error si falta | OK | anthropic-client.ts:26-31 |
| Todos | max_tokens | OK — 500–4700 acotado + truncados en validación | OK | `*-client.ts` MAX_TOKENS |
| analyze/live/coach/oracle | Caché key | OK — server-side determinista (matchId+dataVersion+PROMPT_VERSION+slot) | OK | cache.ts:45-48 |
| Todos | Disclaimer apuestas | Sin disclaimer de juego responsable (genera over/under, odds, picks) | P2 | system-prompt.ts:79-83 |
| Todos | Prompt injection | Input en rol `user` (no system); system prompts anti-desvío robustos; daño acotado (sin tools) | P2 | debate-system-prompt.ts:38-40 |
| analyze/live/oracle/coach | Alucinación | OK — datos reales inyectados; "NO inventes"; oracle valida `isKnownTeam` | OK | context-builder.ts:324-330; oracle-client.ts:182-216 |
| debate | Memoria | OK — KV por userId, 1 registro, stance truncado 120, TTL 60d | OK | debate-memory.ts:15-63 |
| debate | userName en prompt | Interpolado en system prompt (server-side, riesgo bajo) | P3 | debate-client.ts:52-53 |
| Todos | JSON forzado | Parseo+validación manual (no `output_config.format`) — frágil | P3 | anthropic-client.ts:92-104 |
| analyze | Comentario | "temperature 0.7" desalineado con `temperature:1` real | P3 | cache.ts:11 |

---

## B. Pipeline de noticias

| Etapa/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| enrich | Scrape de cuerpo | Descarga HTML completo del medio, extrae ≤4000 chars del cuerpo | P0 | noticias-enrich.ts:133-196 |
| rewriter | Reescribe como propio | "estilo editorial propio… desde cero" → obra derivada | P0 | noticias-rewriter.ts:5-6,42 |
| authors | Autores ficticios | Personas inventadas con bios falsas firman el contenido | P0 | noticias-authors.ts:23-38 |
| ingest/rewriter | Auto-publish | Doc dice "human review" pero publica directo si pasa critic | P1 | ingest.ts:13-14 vs rewriter.ts:203 |
| ArticleView | Atribución | Fuente al pie como "complementaria", `nofollow` | P1 | ArticleView.tsx:309-318 |
| [slug]/page | JSON-LD | `author: Person` ficticio, `publisher: ZonaMundial`, sin `isBasedOn` | P1 | [slug]/page.tsx:84-97 |
| ingest/ArticleView | Imagen | Hotlink de foto del medio (agencia) sin licencia; `<img>` crudo | P1 | ingest.ts:154-157; ArticleView.tsx:196-206 |
| ingest-news | Dedup | `knownFingerprints` no se pasa en tick normal → solo dedup por URL | P2 | ingest-news/route.ts:208-213 |
| rewriter | Alucinación | Permite "conocimiento general verificable" → datos de memoria | P2 | rewriter.ts:45-62 |
| audit-noticias | Verificación factual | Re-auditoría con `sourceText="(no disponible)"` → no verifica hechos | P2 | audit-noticias/route.ts:60-66 |
| rewriter/critic | Modelo del gate | Haiku como QA gate (menos capaz para precisión factual) | P2 | rewriter.ts:21; critic.ts:16 |
| NOTICIAS-SYNC-PLAN.md | Doc vs código | Plan = RSS+Sanity+revisión; real = GNews+KV+autopublish | P2 | NOTICIAS-SYNC-PLAN.md:46-75 |
| rewriter | Fallback IA | OK — fallo → `review`/`draft`, nunca publica raw scrape | OK | noticias-rewriter.ts:162-166 |
| ingest-news | Coste | OK — `NEWS_DAILY_CAP=30`, `NEWS_REWRITE_LIMIT`, deadlines, max_tokens | OK | ingest-news/route.ts:69,90-95 |
| critic | Doble gate | OK — dimensiones críticas ≥3 + media ≥3.0 + no duplicado; decisión en código | OK | critic.ts:157-166 |
| store | Lock / trim | OK — lock distribuido en KV; trim nunca borra `published` | OK | store.ts:118-144; ingest-news:378-384 |
| store/rewriter | Slug | Drafts con slug duplicado se descartan del feed silenciosamente | P3 | store.ts:189-195 |
| ingest/[slug] | Fecha | Hora de publicación fabricada `T08:00:00Z` | P3 | ingest.ts:122; [slug]/page.ts:50 |

---

## C. Veredicto legal (atribución/licencias)

**Riesgo ALTO de infracción de copyright + competencia desleal/atribución falsa.** El sistema descarga el texto
íntegro de terceros (eludiendo el truncado de GNews), genera una obra derivada reescrita, y la publica como
contenido propio firmado por autores inventados, con atribución mínima al pie y JSON-LD de autoría propia. GNews
entrega snippets bajo su ToS, no licencia para reproducir/derivar el contenido completo. El paso de **enrich**
(scrape de cuerpo completo) es el agravante principal. Tratar como **bloqueante legal** junto con **Fase 19**.

## D. Modelos usados (vigencia)
- IA coach (5 modos): `claude-sonnet-4-5-20250929` → **legacy**, migrar a `claude-sonnet-4-6`.
- Noticias rewriter/critic: `claude-haiku-4-5-20251001` → vigente (subir el critic a un modelo más capaz).
- Otros módulos: `claude-opus-4-6`, `claude-sonnet-4-6` → vigentes.
