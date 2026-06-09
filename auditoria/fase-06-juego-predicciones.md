# Fase 6 — Juego: predicciones, bracket, ranking

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías de corrección de lógica)
**Alcance:** `api/predictions/*`, `api/bracket/*`, `api/ranking`, `lib/predictions/*`, `lib/bracket/*`, `lib/economy/ranking.ts`, `components/bracket/*`, `app/app/predicciones`, `app/app/rankings`, `app/bracket`, `app/grupos`. La **seguridad** de estos endpoints ya se cubrió en **Fase 1 (Grupo 5)**: scoring server-side, deadlines, economía atómica idempotente. Esta fase audita la **corrección de la lógica de juego**.

---

## Resumen ejecutivo

El **motor de puntuación** de predicciones (`scoring.ts`) y el modelo de puntuación del bracket
(`scoring.ts` "progresión") están **bien diseñados, son deterministas y robustos**; la economía
(Fútcoins/XP) es idempotente; el ranking **global** por Fútcoins escala y desempata bien.

Pero la fase destapa **los dos problemas más serios de la auditoría hasta ahora**, ambos de funcionalidad
(no de seguridad):

1. **No existe pipeline de resultados reales conectado (P0):** `match-data.ts` **no** construye el resultado
   real (score/events/stats/ratings). La resolución depende **al 100% de que un integrador externo —aún no
   implementado— suba el JSON** vía `POST /api/predictions/resolve`. No hay puente api-football → predicciones.
   Hoy, las predicciones **no se resuelven solas** en producción.
2. **El bracket no sigue el cuadro oficial de la FIFA (P1):** `engine.ts` empareja R32 con un esquema lineal
   inventado (1-vs-32) y coloca los 8 mejores terceros de forma **arbitraria**, ignorando los slots oficiales
   que ya existen en `matches.ts` (1A-2B, 1E-3ABCDF, …). El usuario construye un cuadro que **no ocurrirá** en
   el torneo real (y las fechas/sedes de eliminatorias salen mal). **El scoring "progresión" NO se corrompe**
   por esto (puntúa por equipos que alcanzan cada ronda, no por cruces), así que el daño es de **fidelidad/UX**.

Además, cuando llegue el resultado real, varios tipos darán **0 injustos** si el feed no trae exactamente los
campos esperados (mismatch de IDs de jugador, sin `player_ratings`, sin `stats`), y el leaderboard de
predicciones **no escala** (carga todas las filas en memoria por request).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 1 |
| **P1** | 6 |
| **P2** | 6 |
| **P3** | 5 |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Reglas de puntuación correctas y server-side | ✅ Motor determinista correcto (pero ver completitud del feed) |
| Cierre por deadline (no editable tras inicio) | ✅ Predicciones (`checkOpen`); ⚠️ bracket sin lock (**H-001-16**) |
| Bracket: avance consistente con resultados reales | ❌ No sigue el cuadro oficial FIFA (H-006-02) |
| Ranking: orden, desempates, paginación, rendimiento | ⚠️ Global OK y escalable; **leaderboard de predicciones no escala ni pagina** (H-006-05/09) |
| Idempotencia al re-puntuar; sin doble conteo | ✅ Verificado (`resolved_at`/`consumed_at`) |

---

## A. Hallazgos

### 🔴 H-006-01 (P0) — No hay pipeline de resultados reales: las predicciones no se resuelven solas

`match-data.ts` solo genera metadatos, multiplicadores, duelos y líneas O/U deterministas — **no** produce
`MatchResultReal` (score, events, stats, player_ratings). No existe ningún puente entre `match-center/apiFootball.ts`
(que sí ingiere fixtures reales) y la resolución de predicciones. El cron `resolve-predictions` solo **consume**
lo que alguien haya dejado staged en KV; el único productor es un caller externo vía `POST /api/predictions/resolve`
(`result-store.ts:4-7` lo documenta como "un editor o integración con un proveedor de datos").

**Impacto:** sin ese integrador (no implementado), **ninguna predicción se resuelve** → no se puntúa, no se abonan
Fútcoins/XP, el ranking de predicciones queda vacío. Es un **bloqueante de lanzamiento** para el modo Predicciones.
**Recomendación:** construir la ingestión api-football → `MatchResultReal` (reutilizando el adaptador del Match
Center) y stagearla automáticamente al finalizar el partido.

### 🟠 H-006-02 (P1) — El bracket no sigue el cuadro oficial de la FIFA

`engine.ts:117-134` construye una lista plana `advancing` = [1ºA,2ºA,…,1ºL,2ºL] (0-23) + 8 mejores terceros (24-31)
y empareja `i` vs `31-i`. El cuadro real (ya presente en `matches.ts:102-116`) usa **slots fijos por posición**
(1A-2B, 1E-3ABCDF, 1F-2C, …) con la **tabla combinatoria de asignación de terceros** de la FIFA. Consecuencias:
- El usuario predice cruces de eliminatorias que **nunca ocurrirán** en el torneo real.
- Las **fechas/sedes** de partidos KO mapeadas por `slotIdx` (`match-time.ts:61-85`) pueden ser **erróneas**.

**Mitigante clave:** el scoring (`scoring.ts`, modelo "progresión") puntúa por **conjunto de equipos que alcanzan
cada ronda**, no por acertar cruces → **los puntos NO se corrompen** y `maxBracketScore` (32/16/8/4/2) es coherente.
El daño es de fidelidad del cuadro y UX. **Recomendación:** reescribir el poblado de R32 para usar los slots de
`matches.ts` (parsear `1A`, `2B`, `3ABCDF`) e implementar la tabla FIFA de terceros.

> La **selección** de los 8 mejores terceros (ordenar los 12 terceros por pts/GD/GF y tomar 8) sí es correcta;
> lo incorrecto es su **colocación** en el cuadro.

### 🟠 H-006-03 (P1) — Riesgo de "0 injustos" cuando llegue el resultado real

El scoring asume un `MatchResultReal` completo y con IDs coherentes. Si el integrador no lo cumple:
- **first_scorer / social:** comparan `player_id` contra IDs del **pool de fantasy** (`match-data.ts:128-139`). Si
  el feed trae IDs de api-football, **nunca casan** → 0 injusto (`scoring.ts:104-108,169-177`).
- **duel:** `player_ratings[pa] ?? 0`; sin ratings, `winner=null` → **siempre fallado** (`scoring.ts:171-177`).
- Sin validación de completitud del resultado. **Recomendación:** normalizar IDs y validar que el resultado trae
  todos los campos antes de resolver; degradar/anular tipos no resolubles en vez de puntuarlos 0.

### 🟠 H-006-04 (P1) — Predicciones huérfanas: pending para siempre

Si un partido **nunca recibe** un resultado staged, sus predicciones quedan `resolved_at=NULL`
**indefinidamente** (`cron route:63-64`; `store.ts:418-427`): el cron las lista como `awaiting_result` cada pasada
pero nunca las cierra. No hay fallback ni expiración → no suman stats, no pagan participación, quedan colgadas.
**Recomendación:** expiración/cierre por defecto tras X tiempo del partido.

### 🟠 H-006-05 (P1) — El leaderboard de predicciones no escala

`store.ts:490-504` (`getLeaderboard`), `gamification-store.ts:744-755` (semanal) y `:669-672` (ligas) **cargan
todas las predicciones resueltas de todos los usuarios en memoria** y agregan/ordenan en JS — O(n filas) por
request. Con muchos usuarios no escala. (El ranking **global** por Fútcoins, `economy/ranking.ts`, sí está bien
hecho y escala.) **Recomendación:** materializar agregados (tabla de totales por usuario) o mover el cómputo a SQL.

### 🟠 H-006-06 (P1) — Boost `streak_freeze` comprado pero nunca aplicado

`grantMatchRewards` llama `computeStreak` **siempre sin freeze**; el boost `streak_freeze` se puede comprar pero
**nunca se consume** en la resolución (solo `double_next` y `shield` se aplican) (`store.ts:312-328`;
`gamification.ts:209-225`). El jugador paga por un efecto inerte. **Recomendación:** aplicar el freeze o retirarlo
de la tienda.

### 🟠 H-006-07 (P1) — `mode:"now"` resuelve con resultado parcial sin verificar fin del partido

`resolveMatch` no valida que el `MatchResultReal` esté completo ni que el partido haya terminado de verdad; el
endpoint `mode:"now"` resuelve al instante (`resolve/route:44`). Un resultado parcial subido pronto puntúa mal y
queda "resuelto" **sin reversión**. **Recomendación:** exigir estado FT + completitud antes de resolver.

### 🟡 H-006-08 (P2) — Tipos que dan 0 si el feed omite campos
- **over_under:** sin `stats` (corners/cards/shots), `actual=0` → `under` siempre acierta, `over` siempre falla
  (`scoring.ts:180-194`).
- **minute_drama (first_sub):** sin `first_sub_minute`, "no ocurrió" = 0, aunque siempre hay sustituciones
  (`scoring.ts:209-211`).

### 🟡 H-006-09 (P2) — Leaderboard de predicciones: desempate, paginación y posición
- **Sin desempate secundario** (solo `pts` desc) → orden inestable entre puntos iguales (`store.ts:504`).
- **Sin offset/cursor** → no se puede paginar más allá del top N (`ranking page:27`).
- `my_position` (`leaderboard/route.ts:29`) **solo si estás en el top N**; fuera del top devuelve `null`, incoherente
  con `getUserRank` (que sí escala).

### 🟡 H-006-10 (P2) — Racha intra-partido no determinista

Todas las predicciones de un partido reciben ~el mismo `resolved_at`; `getActiveStreaks` ordena por `resolved_at`
pero la actualización en memoria va por el orden de `list` **sin `ORDER BY`** → qué predicción recibe el ×1.5 de
racha no es determinista (`store.ts:287-291,352`).

### 🟡 H-006-11 (P2) — Página de ranking de predicciones no resalta tu fila

`jugar/ranking/page.tsx:50,58-69` muestra "Tu posición: #N" pero **no marca la fila del usuario** (`isMe` no existe)
y `myPos` es null fuera del top. (La página de ranking **global** sí lo hace bien.)

### 🟡 H-006-12 (P2) — Resolución con dependencia dura de KV

Si faltan `KV_REST_API_URL/TOKEN`, el cron `resolve-predictions` devuelve 500 y **no resuelve nada nunca**
(`cron route:43-45`). Todo queda pending.

### 🟡 H-006-13 (P2) — Orden de grupo inconsistente entre fuentes

`teams.ts` (Grupo A = MEX, ZAF, KOR, CZE) difiere de `selecciones.ts`/`SimuladorGrupos` (MEX, KOR, ZAF, CZE):
mismo conjunto, distinto orden. No afecta la clasificación (se ordena por pts/GD/GF) pero sí el "cabeza de serie"
mostrado y el desempate final por orden de array (`teams.ts:29-32`).

### Hallazgos P3 (menores)
- `engine.ts:92-94`: desempates de grupo solo pts/GD/GF (faltan enfrentamiento directo / fair-play / sorteo FIFA).
- `SimuladorGrupos.tsx`: lógica de desempate duplicada del engine; no puede saber si un 3º entra entre los 8 mejores
  (widget por-grupo, esperable).
- `engine.ts:103-116`: el bracket KO queda bloqueado hasta predecir los 72 partidos de grupo (sin relleno progresivo).
- `store.ts:360-364`: "predicción perfecta" exige exactamente 8 tipos (rígido si jugaste <8 o >8).
- `leaderboard/route.ts:30`: `total_users` = filas devueltas (≤limit), no el total real de predictores.

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Motor de puntuación de predicciones** (`scoring.ts`): determinista, bien estructurado; scoreBase por tipo +
  applyBonuses (racha ×1.5, early bird ×1.2, match multiplier) coherente; negativos no reducidos por bonus personales.
- ✅ **Bracket scoring "progresión"** (`scoring.ts`): robusto, puntúa por equipos por ronda; `maxBracketScore`
  coherente (32/16/8/4/2 + 25 campeón); idempotente y reproducible.
- ✅ **engine `applyPick`**: invalidación correcta aguas abajo cuando cambia un pick aguas arriba.
- ✅ **Resolución idempotente** (`resolveMatch`): filtra `resolved_at IS NULL`, marca al puntuar; boost consumido por
  `consumed_at`; sin doble abono de XP/coins en el flujo normal.
- ✅ **Ranking global** (`economy/ranking.ts`): orden `coins` desc → `xp` desc (desempate estable), `getUserRank`
  escalable (`count head:true`, funciona fuera del top), paginación por `limit`.
- ✅ **Curva de niveles/XP** (`gamification.ts`): `totalXpForLevel(L)=50·(L-1)·L` consistente con la inversa; sin
  off-by-one.
- ✅ **12 grupos** con selecciones reales; "32 clasifican" correcto; UI del bracket maneja TBD/huecos ("Por definir",
  botones disabled) sin romper.
- ✅ **Página de ranking global**: datos reales, maneja vacío/loading y "tú estás aquí" fuera del top.

---

## C. Pendiente de verificación / decisión

- Si el integrador de resultados reales (H-006-01) está planificado y con qué proveedor (define el lanzamiento).
- Confirmar el mapa de IDs de jugador entre el proveedor de datos y el pool de fantasy (H-006-03).

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Construir ingestión api-football → `MatchResultReal` + staging automático | H-006-01 | P0 |
| 2 | Reescribir seeding del bracket con los slots oficiales de `matches.ts` (+ tabla de terceros) | H-006-02 | P1 |
| 3 | Normalizar IDs de jugador + validar completitud del resultado antes de resolver | H-006-03/07 | P1 |
| 4 | Cierre/expiración de predicciones huérfanas | H-006-04 | P1 |
| 5 | Materializar agregados del leaderboard de predicciones (escala) + desempate + paginación | H-006-05/09 | P1/P2 |
| 6 | Aplicar (o retirar) el boost `streak_freeze`; fijar orden de resolución para la racha | H-006-06/10 | P1/P2 |
| 7 | Resaltar fila del usuario en ranking de predicciones; afinar desempates de grupo | H-006-11/13, P3 | P2/P3 |

**Criterio de cierre:** pipeline de resultados reales operativo; bracket fiel al cuadro oficial; sin "0 injustos"
ni predicciones huérfanas; leaderboard de predicciones escalable con desempate y paginación.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-006-01 | P0 | `lib/predictions/match-data.ts`, `result-store.ts`, `resolve/route.ts` (sin pipeline real) | Abierto |
| H-006-02 | P1 | `lib/bracket/engine.ts:117-134` (cuadro no oficial); `match-time.ts:61-85` | Abierto |
| H-006-03 | P1 | `lib/predictions/scoring.ts:104-108,169-177`; `match-data.ts:128-139` | Abierto |
| H-006-04 | P1 | `cron/resolve-predictions`, `store.ts:418-427` (huérfanas) | Abierto |
| H-006-05 | P1 | `store.ts:490-504`, `gamification-store.ts:744-755,669-672` | Abierto |
| H-006-06 | P1 | `store.ts:312-328`, `gamification.ts:209-225` (streak_freeze inerte) | Abierto |
| H-006-07 | P1 | `resolveMatch` / `resolve/route.ts:44` (resultado parcial) | Abierto |
| H-006-08 | P2 | `scoring.ts:180-194,209-211` (0 si faltan stats/sub) | Abierto |
| H-006-09 | P2 | `store.ts:504`, `leaderboard/route.ts:29` (desempate/paginación/posición) | Abierto |
| H-006-10 | P2 | `store.ts:287-291,352` (racha intra-partido) | Abierto |
| H-006-11 | P2 | `app/app/predicciones/jugar/ranking/page.tsx:50,58-69` | Abierto |
| H-006-12 | P2 | `cron/resolve-predictions:43-45` (dependencia KV) | Abierto |
| H-006-13 | P2 | `lib/bracket/teams.ts:29-32` vs `selecciones.ts` | Abierto |
| H-006-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** bracket sin deadline-lock (**H-001-16**); capsule seal sin auth (**H-001-15**); leagues read
IDOR (**H-001-17**); datos del Match Center que podrían alimentar la resolución (**Fase 5**).
