# Fase 13 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-13-contenido-pais.md](fase-13-contenido-pais.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Rutas y renderizado

| Ruta/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| sedes/[slug]/page.tsx | Slug inválido | OK — `if (!sede) notFound()` | OK | sedes/[slug]/page.tsx:45 |
| selecciones/[slug]/page.tsx | Routing dual | `loadTeam` siempre acierta (48 JSON) → `TeamPageBiblia` siempre; fallback muerto | H-013-02 | selecciones/[slug]/page.tsx:61-72 |
| selecciones/[slug]/page.tsx | Slug inválido | OK — fallback null → `notFound()` | OK | :68 |
| grupos/[slug]/page.tsx | Validación | OK — `VALID_GROUPS` (a–l), `notFound()` | OK | grupos/[slug]/page.tsx:72 |
| grupos/[slug]/page.tsx | Prefijo laxo | `replace('grupo-','')` → slug sin prefijo podría colar | P3 | :71 |
| las 3 dinámicas | dynamicParams | Por defecto (true); no se corta en edge | P2 | (sin `dynamicParams=false`) |
| SSG | Cobertura | OK — 16 sedes / 48 selecciones / 12 grupos | OK | generateStaticParams (×3) |
| SeleccionClient.tsx | Vida | Componente completo **muerto** (no se alcanza) | H-013-02 | SeleccionClient.tsx (todo) |
| dangerouslySetInnerHTML | XSS | OK — solo `JSON.stringify` de JSON-LD curado | OK | sedes/page.tsx:105; grupos/[slug]/page.tsx:78; TeamPageBiblia.tsx:46-49 |

## B. Imágenes

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| SedeSlugClient | Fallback | OK — sin imagen → placeholder SVG, galería omitida | OK | SedeSlugClient.tsx:184-232 |
| SedeSlugClient / stadium-images.ts | Duplicación | `STADIUM_IMAGES` inline **y** en `_components` (idéntico); usa la local | P2 | SedeSlugClient.tsx:14-31 |
| sedes/grupos/selecciones | next/image | `<img>` crudo (flagcdn, /img) → sin optimización/CLS | P2 | page.tsx:140,224; SedeSlugClient.tsx:79+ |
| FlagImage | Fallback | OK — react-world-flags con fallback textual | OK | FlagImage.tsx:54-67 |
| flagcdn `<img>` | Fallback | banderas crudas sin fallback (ISO malo → icono roto) | P3 | grupos/page.tsx; SedesMatches |
| opengraph-image.tsx | OG selección | OK — `flagcdn/${iso}.svg` en request; `loadTeam` falla → OG marca | OK | opengraph-image.tsx:27-31,60,141 |
| TeamPageBiblia → biblia/* | Foto jugador | Fallback a gradiente con dorsal (componentes hijos fuera de lectura) | OK (no verificado a fondo) | TeamPageBiblia.tsx |

## C. Datos en vivo (coherencia Fase 5)

| Componente | Fuente | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| SedesMatches | `MATCHES`/`SEDES` estáticos | No usa API; sin estado async que rompa | OK (gap) | SedesMatches.tsx:5-6 |
| SedesMapa | `SEDES` estático | idem | OK | SedesMapa.tsx:4 |
| PartidosSede / CalendarioGrupo | `@/data/calendario` estático | idem; `PartidosSede` con gate `mounted` (bien) | OK | PartidosSede.tsx:19,39 |
| páginas país | live wiring | No leen `/api/calendar` ni `/api/match-center` | P2 | (gap funcional) |
| SedesMatches / SedesGrupo | join por string | Matching sede por nombre lowercase; rename silencia tarjetas | P3 | SedesMatches.tsx:23-40 |
| date format | TZ | `toLocaleDateString` sin `timeZone` en 2 componentes cliente | P3 | SedesMatches.tsx:8-11; grupos/page.tsx:34-37 |

## D. Datos: selecciones

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| selecciones.ts | Conteo | OK — 48 equipos, grupos A–L, 4 por grupo | OK | selecciones.ts:18-90 |
| selecciones.ts | rankingFIFA | España 8 parece stale (post-Euro24 top-3) | P2 (verificar) | selecciones.ts:62 |
| selecciones.ts | mundiales | México 17, Bélgica 14, Brasil 22 (off-by-one 2026?) | P2 (verificar) | selecciones.ts:20,56,32 |
| selecciones.ts | slots confed | OK — UEFA16/CONMEBOL6+1/CAF9/AFC8/CONCACAF6/OFC1 | OK | selecciones-extended.ts:470-486 |
| selecciones-extended.ts | Vida | Fallback de página muerto, pero **vivo** en `GrupoSlugClient` | H-013-02 | GrupoSlugClient.tsx:295 |
| selecciones-extended.ts | `Math.random()` | Stats de mundial no deterministas/inventadas | **H-013-01** P1 | selecciones-extended.ts:461 |
| selecciones-extended.ts | Jugadores ficticios | "Capitán"/"Portero titular"/"Delantero estrella" renderizados | **H-013-01** P1 | selecciones-extended.ts:504-507 |
| selecciones-extended.ts | Stale vs BIBLIA | 14 fichas curadas duplican y desactualizan la BIBLIA (Messi 187, CR 217) | P2 | selecciones-extended.ts:73-456 |
| selecciones-extended.ts | mexico palmarés | filas 1970/1986 duplicadas | P3 | selecciones-extended.ts:245-250 |
| biblia.ts | Loader | OK — `existsSync`+try/catch; 48 JSON en `data/teams/` | OK | biblia.ts:18-28 |

## E. Datos: grupos

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| grupos/[slug]/page.tsx | GROUP_META | Tercera copia hardcodeada de membresía (SEO) | H-013-04 | grupos/[slug]/page.tsx:12-25 |
| 3 fuentes | Consistencia | OK — membresía A–L coincide entre selecciones/GROUP_META/editorial | OK | (verificado grupo a grupo) |
| grupos-editorial.ts | Factual | Sorteo editorial/pre-sorteo (Italia eliminada por Bosnia, etc.) | verificar | grupos-editorial.ts:40 |
| GrupoSlugClient | jugadores | Pinta `jugadoresClave` ficticios (H-013-01) | P1 | GrupoSlugClient.tsx:325 |

## F. Datos: sedes y fotos

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| sedes.ts | Conteo/nombres | OK — 16 sedes oficiales (11 US/3 MX/2 CA) | OK | sedes.ts:56-830 |
| sedes.ts vs content/sedes-2026.json | Capacidades | Divergen (Filadelfia 69 796 vs 67 594, etc.) | **H-013-03** P2 | sedes.ts:447 vs sedes-2026.json:14 |
| sedes.ts | fases por sede | MetLife lista Semifinal **y** Final; verificar plan oficial | verificar | sedes.ts:68 |
| data/stadiums.json | Propósito | NO es duplicado de capacidades: es mapa de fotos/alias Commons para amistosos | OK | leído por `lib/friendlies/teamInfo.ts` |
| player-photos.ts | Atribución | `credit: "Wikipedia Commons"` (no autor/licencia) — contra CC-BY y el propio comentario | **H-013-06** P2 (legal) | player-photos.ts:60 |
| player-photos.ts | Coste | hasta ~5.000 requests a Wikipedia en corrida completa; KV prometido no implementado | P2 | player-photos.ts:8,50-53 |
| player-photos.ts | Server-only | OK — documentado server-only; fallo no bloqueante | OK | player-photos.ts:42-43 |
| GrupoEditorial / SedeEditorial | Fecha | "Actualizado el 21 de mayo de 2026" hardcodeado | P3 | GrupoEditorial.tsx:72; SedeEditorial.tsx:71 |

---

## G. Veredictos
- **Renderizado:** robusto, sin P0/P1 de ejecución; SSG completo, `notFound()` correcto, sin XSS.
- **Contenido:** el problema real. **Jugadores y stats ficticias en páginas de grupo** (H-013-01, P1, contenido falso
  presentado como real); **datos duplicados/stale** (selecciones-extended vs BIBLIA, sedes vs content JSON,
  GROUP_META triplicado).
- **Atribución de fotos** insuficiente para CC (H-013-06).
- **Sin verificar (externo):** sorteo de grupos, fases por sede, rankings/mundiales → cruce con Fase 5 (doc oficial
  vacío). Internamente consistente, pero su exactitud factual depende de la fuente FIFA.
