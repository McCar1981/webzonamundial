# Fase 5 — Datos en vivo: match-center, calendario, amistosos

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías paralelas)
**Alcance:** `api/match-center`, `api/calendar`, `api/friendlies`, `lib/match-center/*`, `lib/friendlies/*`, `lib/timezone.ts`, `lib/team-abbr.ts`, `lib/countries.ts`, `app/app/matchcenter`, `app/calendario` (+`_components`), `app/amistosos`, `app/embed/calendario`, `docs/fixture-*-2026.md`, datos `src/data/matches.ts`. Los endpoints GET ya pasaron la Fase 1 (seguridad OK); los crons tienen el defecto de auth condicional (**H-001-01**).

---

## Resumen ejecutivo

La **arquitectura de datos en vivo del Match Center es sólida**: el poller calienta KV (snapshot con TTL 25 s +
guardia de frescura), la ruta lee de caché (los usuarios no pegan a la API por request), el batch
`/fixtures?ids=` baja el gasto a 1 request por 20 partidos, el emparejamiento de fixtures es multi-señal con
umbral de confianza (no sirve datos de otro partido), y degrada limpiamente sin simular partidos reales. El push
de eventos es idempotente por `seenEventIds`.

Los problemas se concentran en **tres ejes**:

1. **Zonas horarias sin aplicar (P1):** `lib/timezone.ts` (toda la maquinaria multi-huso: `buildKickoffDate`,
   `formatKickoff`) **no se importa en ningún componente del calendario**. El calendario muestra la hora **ET
   cruda y sin etiqueta de huso** → un usuario en España/Argentina/México ve una hora que no es la suya, en un
   torneo de 3 países y 4 husos.
2. **Cuota de api-football en riesgo (P1):** el polling del Match Center (cada minuto + bucle interno de 15 s) y
   `/api/friendlies` (`no-store` + escaneo de 2 temporadas por visita) comparten la **misma clave** y pueden
   **agotar la cuota** (free tier ~100/día), tumbando los datos en vivo. No hay manejo de 429 ni backoff.
3. **Datos del calendario (P1/P2):** un **partido de prueba** (`i:9002`, "Amistoso", sede vacía) se filtra al
   calendario y al embed públicos; y hay discrepancias de hora respecto al doc oficial de horarios.

> Caveat de validación: `docs/fixture-official-2026.md` es **una plantilla vacía** (sin partidos). Solo
> `docs/fixture-times-2026.md` tiene datos reales (horas ET). La corrección de fechas/sedes/equipos **no es
> verificable solo desde el repo** — requiere contrastar con una fuente externa.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 4 |
| **P2** | 7 |
| **P3** | 9 |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| API-Sports con clave, manejo de rate-limit, caché KV | ⚠️ Caché OK en Match Center; **sin manejo de 429**; **`/amistosos` sin caché** (H-005-03) |
| Zonas horarias correctas por usuario/sede; fechas 2026 cuadran | ❌ Calendario muestra ET cruda (H-005-01); doc oficial vacío (no validable) |
| Estados de partido y polling/refresh adecuados | ✅ Máquina de estados y caché correctas; afinamientos P3 |
| Fallbacks cuando la API falla | ✅ Degrada a último snapshot → scheduled; nunca simula reales |
| Abreviaturas/banderas/países consistentes | ✅ team-abbr cubre las 48; banderas robustas (`tbd` guard) en el calendario principal |

---

## A. Hallazgos

### 🟠 H-005-01 (P1) — El calendario muestra hora ET cruda; la maquinaria multi-huso está sin usar

`lib/timezone.ts` implementa `buildKickoffDate`/`formatKickoff`/`resolveVenueTimezone` para convertir el kickoff
al huso del usuario o del estadio, **pero no se importa en ningún componente del calendario**: `MatchCard`,
`MatchModal`, `MobileTimeline`, `DateHeader` y el embed muestran `m.t` **literal (ET) sin etiqueta de huso**
(`MatchCard.tsx:64`, `MatchModal.tsx:126`, `MobileTimeline.tsx:59`, `embed/page.tsx:176`). En un Mundial de 3
países / 4 husos, un usuario en Madrid o Buenos Aires ve una hora que cree local y no lo es.
**Recomendación:** usar `buildKickoffDate` + `formatKickoff` con el huso del visitante (y mostrar también el del
estadio), o al menos etiquetar "ET".

### 🟠 H-005-02 (P1) — Polling del Match Center insostenible para la cuota de api-football

El cron `match-center-poll` corre **cada minuto** (`vercel.json:44-47`) con un **bucle interno cada 15 s**
mientras haya partidos en vivo (`match-center-poll/route.ts:149-161`). Aun con el batch eficiente, un solo partido
de 2 h consume **cientos de requests**; el free tier (~100/día) se agota enseguida. No hay guarda de cuota.
**Recomendación:** confirmar plan de pago de api-football y/o añadir guarda de cuota + alerta cuando se acerque al
límite.

### 🟠 H-005-03 (P1) — `/api/friendlies` sin caché: cada visita quema cuota

`api/friendlies/route.ts:21-22` usa `cache:"no-store"` + `force-dynamic`: **cada visita** a `/amistosos` dispara
hasta 3 llamadas (live + hoy + mañana) y `findFriendlyFixtureId` **escanea 2 temporadas completas**
(`api.ts:216-217`). Como comparte la clave api-football con el Match Center, el tráfico de `/amistosos` puede
**agotar la cuota** que necesitan los datos en vivo. **Recomendación:** cachear en KV con TTL (p.ej. 60-120 s) y
deduplicar; evitar el escaneo de 2 temporadas por request.

### 🟠 H-005-04 (P1) — Partido de prueba filtrado al calendario público

`src/data/matches.ts:144-147` contiene un amistoso de prueba `i:9002` (Portugal vs Chile, `p:"Amistoso"`,
`j:99`, `d:2026-06-06`, `vc:""`). Con el filtro de fase en "Todas", aparece en el **calendario público** y en
`/embed/calendario` con ciudad/sede vacías. **Recomendación:** eliminar el registro de prueba de los datos de
producción (o excluirlo explícitamente del render).

### 🟡 H-005-05 (P2) — Discrepancias de hora vs el doc oficial de horarios

Comparando `matches.ts` (`t`) con `docs/fixture-times-2026.md` (las 104 horas ET), coinciden ~100/104. Diferencias:

| # | Partido | `matches.ts` | Doc | Nota |
|---|---------|--------------|-----|------|
| 29 | Brasil vs Haití | `21:00` | `20:30` | **Error real de 30 min** |
| 6 / 20 / 36 | varios | `23:59` | `00:00` | Workaround deliberado (evita rodar de día), pero el JSON-LD `startDate` queda 1 min antes (`layout.tsx:30`) |

El header de `matches.ts` afirma "fidelidad 1:1 con el Excel FIFA" → corregir el #29 y revisar el efecto del
`23:59` en el `startDate` estructurado.

### 🟡 H-005-06 (P2) — Sin manejo de 429/cuota en los adaptadores api-football

Tanto `match-center/apiFootball.ts:43-46` como `friendlies/api.ts:34-52` solo miran `r.ok`: un 429 cae en el
`else` genérico, loguea y devuelve null. No leen `Retry-After`/`x-ratelimit-*`, no hacen backoff ni circuit-breaker,
y no alertan al agotar la cuota (solo `console.error`). **Recomendación:** detectar 429 y alertar/parar el polling.

### 🟡 H-005-07 (P2) — Cache-miss / KV apagado pega a la API por usuario (sin single-flight)

`live/[id]/route.ts:76-89`: si la caché KV está vencida o KV está apagado, **cada request de usuario** llama a
`fetchLiveSnapshot` directamente, en paralelo y sin dedupe → estampida sobre api-football. **Recomendación:**
single-flight/lock por `matchId` en el miss.

### 🟡 H-005-08 (P2) — IDs de evento posicionales → posible re-notificación de goles

Los IDs reales son `live-{fixtureId}-{idx}` **posicionales** (`apiFootball.ts:218`). Si la API reordena o inserta
un evento intermedio, los `idx` se desplazan → IDs "nuevos" para eventos ya vistos → el push podría
**re-notificar goles/rojas antiguos** (`push.ts:273`). La idempotencia depende de que el índice nunca cambie.
**Recomendación:** ID estable derivado de (minuto+tipo+jugador), no de la posición.

### 🟡 H-005-09 (P2) — Embed: filtro `?phase=semis` roto y banderas `tbd` rotas

`embed/calendario/page.tsx`: `PHASE_MAP` mapea `semis`→"Semifinales" pero la fase real es "Semifinal", y el
`.includes("semifinales")` sobre "semifinal" da falso → `?phase=semis` muestra **0 partidos** (`embed/page.tsx:35-44,72`).
Además, para eliminatorias los flags son `"tbd"` y `flagSrc("tbd")` genera `flagcdn.com/tbd.svg` (404) → **imagen
rota** en modo no compacto (`embed/page.tsx:46-48,184`).

### 🟡 H-005-10 (P2) — Countdown de inauguración desfasado

`useCountdown.ts:6` y `CountdownBanner.tsx:22` usan un target **hardcodeado** (`2026-06-11T12:00:00-05:00`) que no
deriva del partido inaugural real → el contador puede llegar a 0 antes del saque. **Recomendación:** derivar el
target del match 1 con `buildKickoffDate`.

### Hallazgos P3 (menores)
- `store.ts:17,24-27`: `HT` (descanso) se marca stale a los 45 s → refetch innecesario durante todo el descanso.
- `match-center-poll/route.ts:55-59`: tras `FT` la ventana externa sigue trayendo el fixture ~1 h (gasto menor).
- Desajuste `LIVE_STATUSES` (incluye `SUSP`) vs `IN_PLAY` (no) entre poll y store → inconsistencia menor.
- `fixtureSync` cada 6 h: un cambio de horario/sede <6 h antes del saque queda desfasado una ventana.
- `setFixtureId` es no-op silencioso sin KV, pero el report dice `mapped:N` (engañoso).
- `push.ts`: posible carrera read-modify-write si dos pasadas solapan el mismo partido; resolución de fotos por
  evento puede acercarse al `maxDuration=60s`.
- `humanizeTz` mapea `America/Chicago`→"Houston" (etiqueta de zona imprecisa).
- `countries.ts` cubre solo ~31 países (selector de perfil), no las 48 selecciones — **pero no se usa en el
  calendario**, así que no rompe nada; conviene aclarar su propósito.
- `embed/page.tsx:50-56`: `fmtDate` sin guarda para fechas "[POR CONFIRMAR]" (hoy inexistentes).

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Caché compartida del Match Center**: poller escribe KV (TTL 25 s + guardia `LIVE_FRESH_MS` 45 s), la ruta
  lee de KV → los usuarios no pegan a la API por request.
- ✅ **Eficiencia de cuota**: batch `/fixtures?ids=` (1 req/20 partidos) + bloques embebidos (1 req/partido en vez
  de 4).
- ✅ **Degradación limpia**: ante fallo de API o sin KV, sirve el último snapshot → `scheduledSnapshot`; **nunca
  simula** partidos reales ni de fase de grupos (ni con `?sim=1`).
- ✅ **Emparejamiento de fixtures** multi-señal (saque+estadio+ciudad) con umbral de confianza → no sirve datos de
  otro partido; sin mapeo → scheduled/sim según tipo.
- ✅ **Push idempotente**: `seenEventIds` + flags de hito (`startSent/htSent/ftSent`) + tag estable `mc-{matchId}`.
- ✅ **Robustez del calendario principal**: filtros (grupo/sede/equipo/favoritos), modal y timeline manejan KO sin
  grupo y banderas `tbd` con placeholder "?"; team-abbr cubre las 48 selecciones.
- ✅ **Amistosos sin API key**: degrada a listas vacías con texto ("No hay amistosos…"), sin romper.

---

## C. Pendiente de verificación (no derivable del repo)

- **Plan de api-football** (free vs pago) y consumo real de cuota — determina la gravedad de H-005-02/03.
- **Corrección de fechas/sedes/equipos** del fixture: `docs/fixture-official-2026.md` está **vacío**; validar
  contra fuente FIFA externa.
- Presencia del env `MC_FIXTURE_MAP` y/o que el cron `sync-fixtures` esté poblando KV en producción.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Aplicar `timezone.ts` en el calendario (huso del usuario + estadio) | H-005-01 | P1 |
| 2 | Confirmar plan api-football / guarda de cuota + alerta; manejar 429 | H-005-02, H-005-06 | P1/P2 |
| 3 | Cachear `/api/friendlies` en KV; evitar escaneo de 2 temporadas | H-005-03 | P1 |
| 4 | Eliminar el partido de prueba `i:9002` de los datos de producción | H-005-04 | P1 |
| 5 | Corregir hora del #29; revisar `23:59`→JSON-LD; arreglar embed (`semis`, flags `tbd`); countdown derivado | H-005-05/09/10 | P2 |
| 6 | Single-flight en cache-miss; IDs de evento estables (no posicionales) | H-005-07/08 | P2 |
| 7 | Afinamientos de cuota/estado (HT, post-FT, SUSP, sync) | P3 varios | P3 |

**Criterio de cierre:** calendario localizado al huso del usuario; cuota api-football sostenible y monitorizada;
datos de calendario sin registros de prueba y validados contra fuente oficial.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-005-01 | P1 | calendario `_components` (no usa `lib/timezone.ts`) | Abierto |
| H-005-02 | P1 | `cron/match-center-poll`, `vercel.json:44-47` | Abierto |
| H-005-03 | P1 | `api/friendlies/route.ts:21-39`, `friendlies/api.ts:216-217` | Abierto |
| H-005-04 | P1 | `src/data/matches.ts:144-147` (partido prueba) | Abierto |
| H-005-05 | P2 | `src/data/matches.ts` (#29 hora), `calendario/layout.tsx:30` | Abierto |
| H-005-06 | P2 | `match-center/apiFootball.ts:43`, `friendlies/api.ts:34` | Abierto |
| H-005-07 | P2 | `api/match-center/live/[id]/route.ts:76-89` | Abierto |
| H-005-08 | P2 | `match-center/apiFootball.ts:218`, `push.ts:273` | Abierto |
| H-005-09 | P2 | `app/embed/calendario/page.tsx:35-48,72,184` | Abierto |
| H-005-10 | P2 | `useCountdown.ts:6`, `CountdownBanner.tsx:22` | Abierto |
| H-005-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** crons sin fail-closed (**H-001-01**); narración IA del Match Center sin auth
(**H-001-23**, Fase 1).
