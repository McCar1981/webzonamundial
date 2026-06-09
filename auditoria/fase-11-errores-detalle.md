# Fase 11 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-11-creadores.md](fase-11-creadores.md)

Detalle por área, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Fuentes de datos

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| `data/creadores.ts` | Fuente canónica | OK — 5 creadores por `slug`; usada por todas las páginas + cron Twitch + fantasy/creator | OK | creadores.ts:31-137 |
| `lib/data/creators.ts` | Fuente muerta | 8 creadores por `code`, `TOTAL_FOLLOWERS="15.1M"`; roster falso (4 fantasmas, omite a Niku); nadie la importa | P2 | creators.ts:20-125 |
| ambas | Divergencia | Distinto nº, rosters, claves y followers → inconsistencia | P2 | creators.ts vs creadores.ts |

## B. Atribución de referido

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| RegistroCreadorClient → addRegistro | Captura | OK — `creador` se persiste por fila en KV | OK | registros-store.ts:173,211 |
| api/admin/registros | Agregación | NO agrega — dump CSV crudo sin GROUP BY | P2 | api/admin/registros/route.ts:60-91 |
| daily-stats | Desglose | Sin breakdown por creador | P2 | daily-stats/route.ts:55-61 |
| api/fantasy/creator | Falsificable | `fav_creator` editable post-registro (valida slug, no propiedad) | P2 (=H-002-09) | fantasy/creator/route.ts:26-33 |
| rankings/page | "Por creador" | Solo copy de marketing, sin tracking real | P3 | rankings/page.tsx:52 |

## C. Twitch / live

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| twitch.ts | Token | OK — App Access Token cacheado server-side, nunca expuesto | OK | twitch.ts:16-55 |
| twitch.ts | Errores/cuota | OK — token/`resp.ok` chequeados, chunks 100, try/catch, degrada a [] | OK | twitch.ts:105-136 |
| store.ts | KV live | OK — key `creators:live:v1`, TTL 600s, guard isKvEnabled | OK | store.ts:9-61 |
| LiveCreatorsBanner / CreadorDetailClient | UI live | OK — polling 60s, no render si vacío, dismiss 30min, iframe Twitch | OK | LiveCreatorsBanner.tsx:85-124 |
| notifications.ts | Idempotencia | OK — cooldown 4h por slug, marca solo si `sent>0`, `tag` por creador | OK | notifications.ts:21,77-114 |
| notifications.ts | Spam en outage KV | KV caído → `hasRecentNotification` false → notifica cada poll | P2 | notifications.ts:33,37 |

## D. Páginas y datos

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| creadores/[slug]/page.tsx | SSG/notFound/imágenes | OK — `generateStaticParams`, `notFound()`, imágenes existen | OK | [slug]/page.tsx:23-66 |
| registro/[creador]/page.tsx | notFound + SEO | OK (Fase 2) — `notFound()`, metadata completa | OK | registro/[creador]/page.tsx:50-57 |
| creadores.ts | Followers | Hardcodeados ("4.7M"…) mostrados como actuales | P2 | creadores.ts:36-37; CreadoresClient.tsx:203-206 |
| CreadoresEditorial.tsx | Fecha/promesas | Fecha fija + features no verificadas | P3 | CreadoresEditorial.tsx:62-116 |

---

## E. Veredictos
- **Dos fuentes:** divergen severamente; `data/creadores.ts` canónica funciona, `lib/data/creators.ts` es muerta con
  roster/total falsos → eliminar/reconciliar.
- **Atribución de referido:** **cosmética** — se persiste por fila pero no se agrega en ningún lado, y es
  falsificable. No apta para monetización sin rehacerla.
- **Twitch/live:** bien construido y seguro; única pega menor el spam potencial durante outage de KV.
