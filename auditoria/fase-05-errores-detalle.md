# Fase 5 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-05-datos-vivo.md](fase-05-datos-vivo.md)

Detalle por archivo de la capa de datos en vivo, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Capa de datos Match Center

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| match-center/store.ts | Caché KV | OK — `cacheSnapshot` TTL `ex:25s`; ruta lee KV primero | OK | store.ts:14,146-153 |
| match-center/store.ts | TTL vs polling | OK — TTL 25s > 15s; guardia `LIVE_FRESH_MS=45s` | OK | store.ts:14,22-28 |
| match-center/store.ts | HT como in-play | `HT` se marca stale a 45s → refetch innecesario en el descanso | P3 | store.ts:17,24-27 |
| match-center/store.ts | Mapeo matchId→fixtureId | OK — KV → `MC_FIXTURE_MAP` → caso 9002 | OK | store.ts:83-113 |
| match-center/store.ts | setFixtureId sin KV | No-op silencioso; report dice `mapped:N` (engañoso) | P3 | store.ts:115-122 |
| match-center/apiFootball.ts | Manejo de 429 | Solo mira `r.ok`; sin `Retry-After`/backoff/circuit-breaker | P2 | apiFootball.ts:43-46 |
| match-center/apiFootball.ts | IDs de evento | Posicionales `live-{fixtureId}-{idx}` → re-notificación si la API reordena | P2 | apiFootball.ts:218 |
| match-center/apiFootball.ts | Batch + embebidos | OK — `/fixtures?ids=` (20/req) + bloques embebidos (1 req/partido) | OK | apiFootball.ts:177-197,154-166 |
| match-center/apiFootball.ts | Fallback | OK — error→null; degrada a scheduled | OK | apiFootball.ts:44,292-308 |
| match-center/fixtureSync.ts | Emparejamiento | OK — multi-señal (saque+estadio+ciudad), umbral `score≥4 & margen≥2` | OK | fixtureSync.ts:165-198 |
| match-center/fixtureSync.ts | Frecuencia sync | Cada 6h: cambio <6h antes del saque queda desfasado una ventana | P3 | vercel.json:52-55 |
| match-center/push.ts | Idempotencia | OK — `seenEventIds` + flags hito + tag `mc-{matchId}` | OK | push.ts:210-219,272-290 |
| match-center/push.ts | Carrera de polls | Read-modify-write sin lock si solapan pasadas del mismo partido | P3 | push.ts:60-76,199-219 |
| match-center/push.ts | Coste imágenes/evento | Resolución de fotos encadenada puede acercarse a `maxDuration=60s` | P3 | push.ts:272-290 |
| match-center/types.ts | Estados | OK — NS/live/FT desde `fixture.status.short` real | OK | apiFootball.ts:272-273 |
| cron/match-center-poll | Cuota | Cada minuto + bucle 15s → cientos de req/partido; insostenible free tier | P1 | route.ts:149-161; vercel.json:44-47 |
| cron/match-center-poll | Stop tras FT | Bucle corta con `live===0`, pero ventana externa sigue ~1h post-FT | P3 | route.ts:35,55-59,157 |
| cron/match-center-poll | SUSP mismatch | `LIVE_STATUSES` incluye `SUSP`, `IN_PLAY` no → inconsistencia menor | P3 | route.ts:43; store.ts:17 |
| api/match-center/live/[id] | Cache-miss por usuario | Sin KV / TTL vencido → cada request llama API sin single-flight | P2 | live/[id]/route.ts:76-89 |
| api/match-center/live/[id] | Simula vs real | OK — solo simula sin fixtureId y fuera de real-only/grupos | OK | live/[id]/route.ts:62-63,98-108 |
| api/match-center/live/[id] | Cadena de fallback | OK — caché→fetch→último snapshot→scheduled→sim | OK | live/[id]/route.ts:67-108 |

---

## B. Calendario + datos de fixtures

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| _components (todos) | Conversión de huso | Muestran `m.t` crudo (ET) sin convertir; `lib/timezone.ts` no se importa | P1 | MatchCard.tsx:64; MatchModal.tsx:126; MobileTimeline.tsx:59 |
| src/data/matches.ts | Partido de prueba | `i:9002` "Amistoso" (sede vacía) se filtra al calendario/embed con fase="Todas" | P1 | matches.ts:144-147 |
| src/data/matches.ts | Hora #29 | Brasil-Haití `21:00` vs doc `20:30` (error 30 min) | P2 | matches.ts:54 |
| src/data/matches.ts | Horas `23:59` | #6/#20/#36 `23:59` vs `00:00` (workaround; JSON-LD startDate 1 min antes) | P2 | matches.ts:29,43,61; layout.tsx:30 |
| calendario/page.tsx + components | Robustez filtros/modal | OK — KO sin grupo, prev/next con guardas, empty state, headers Dropdown ignorados | OK | page.tsx:107-122,317-334 |
| flags calendario | `tbd` guard | OK — `m.hf && m.hf!=="tbd"` → placeholder "?" | OK | MatchCard.tsx:73,103 |
| useCountdown.ts / CountdownBanner | Target inauguración | Hardcodeado, no derivado del match 1 → puede llegar a 0 antes del saque | P2 | useCountdown.ts:6; CountdownBanner.tsx:22 |
| team-abbr.ts | Cobertura | OK — deriva de las 48 (`BRACKET_TEAMS`); fallback por nombre/iso | OK | team-abbr.ts:14-16 |
| countries.ts | Cobertura | ~31 países (selector de perfil), no las 48; **no se usa en calendario** | P3 | countries.ts:14-50 |

---

## C. Embed calendario

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| embed/calendario/page.tsx | Filtro `?phase=semis` | Roto: mapea a "Semifinales" pero la fase real es "Semifinal" → 0 partidos | P2 | embed/page.tsx:35-44,72 |
| embed/calendario/page.tsx | Banderas `tbd` | `flagSrc("tbd")` → `flagcdn.com/tbd.svg` 404 (imagen rota en modo no compacto) | P2 | embed/page.tsx:46-48,184 |
| embed/calendario/page.tsx | Guarda de fecha | `fmtDate` sin guarda "[POR CONFIRMAR]" (hoy inexistente) | P3 | embed/page.tsx:50-56 |
| embed/calendario/page.tsx | Standalone iframe | OK — server component sin chrome; `X-Frame-Options: ALLOWALL` | OK | next.config.js:142-148 |

---

## D. Amistosos (friendlies)

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| api/friendlies/route.ts | Caché | `no-store` + `force-dynamic`; cada visita = hasta 3 llamadas + escaneo 2 temporadas → quema cuota | P1 | route.ts:21-22,30-39; api.ts:216-217 |
| lib/friendlies/api.ts | Fuente/errores | api-football liga 10; degrada a null en error, pero sin distinguir 429 ni backoff | P2 | api.ts:34-52 |
| app/amistosos/page.tsx | Sin datos / sin key | OK — listas vacías con texto ("No hay amistosos…"), detalle "No se pudo cargar" | OK | page.tsx:601,818-820 |

---

## E. Zonas horarias (lib/timezone.ts)

| Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|
| Implementación | OK — `buildKickoffDate` (DST-aware vía Intl), `formatKickoff`, `VENUE_TIMEZONES` (16 sedes) | OK | timezone.ts:80-112,141-173 |
| Uso | **No se importa en el calendario** (código muerto para el caso de uso principal) | P1 (ver H-005-01) | — |
| `humanizeTz` | `America/Chicago`→"Houston" (etiqueta imprecisa de la zona Central) | P3 | timezone.ts:180 |

---

## F. Validación de fixtures (caveat)

- `docs/fixture-official-2026.md` es **una plantilla vacía** (bloque `BEGIN OFFICIAL FIXTURE` sin partidos) → no
  hay datos oficiales de fechas/sedes/equipos contra los que validar desde el repo.
- `docs/fixture-times-2026.md` sí tiene las 104 horas ET reales → usado para H-005-05.
- Conclusión: la **corrección de fechas/sedes/equipos** del calendario solo es verificable contra una fuente FIFA
  externa, no desde el repositorio.
