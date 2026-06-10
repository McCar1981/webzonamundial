# Auditoría — Módulo Predicciones (2ª pasada)

**Estado:** 🟥 Hallazgos críticos abiertos
**Fecha:** 2026-06-10 (el torneo empieza el 11-jun — mañana)
**Auditor:** Claude (5 sub-auditorías en paralelo: backend API, lógica de juego, gamificación/economía, frontend, arquitectura/SQL)
**Alcance:** `api/predictions/*`, `api/cron/{resolve-predictions,predictions-engagement,score-brackets,resolve-micro}`, `lib/predictions/*`, `lib/micro/*`, `lib/economy/*`, `app/app/predicciones/*`, migraciones `scripts/sql/2026-{06,07,08-*,14,15,17,18,21}-*.sql`.
**Predecesor:** `auditoria/fase-06-juego-predicciones.md` (2026-06-08). Esta pasada **re-verifica** aquellos hallazgos y añade los nuevos.

---

## Resumen ejecutivo

El motor de puntuación y la billetera de Fútcoins (`increment_wallet`/`spend_wallet`, atómicos vía RPC `SECURITY DEFINER`) siguen siendo sólidos. Pero esta pasada destapa **dos puertas traseras de RLS** que no se vieron en la Fase 6 (que asumió que "la seguridad ya se cubrió en Fase 1") y que **anulan toda la seguridad de los endpoints**: el cliente del navegador usa la `anon key`, así que las políticas RLS son la única frontera, y dos tablas permiten escritura directa del usuario sobre columnas que mueven dinero y ranking.

Además, **ninguno** de los hallazgos de lógica de juego de la Fase 6 (H-006-01..10) se ha corregido — siguen todos abiertos —, y aparecen **varios exploits nuevos de minteo de Fútcoins** (la moneda es única y compartida con trivia/fantasy/carrera, así que el daño se propaga a todo ZonaMundial).

Tres cosas son **bloqueantes de lanzamiento** para mañana:

1. **Las predicciones clásicas (8 tipos) no se resuelven solas** (H-006-01 sigue abierto): no existe el puente api-football → resultado real. Solo se resuelven si alguien hace un `POST` manual a `/api/predictions/resolve`.
2. **El resultado oficial vive solo en KV con TTL de 7 días** (sin backup — ya perdisteis ~140 noticias así). Un flush deja partidos sin resolver en silencio.
3. **Si la key de api-football falla, las micro y los live-picks pagan Fútcoins contra eventos SIMULADOS** (goles/tarjetas inventados). Tu nota de memoria dice que esa env tiene una Stripe key por error — si sigue así, mañana se paga dinero virtual por goles ficticios.

### Conteo de hallazgos

| Severidad | Nuevos | Previos aún abiertos |
|-----------|:------:|:--------------------:|
| **P0** | 4 | 1 (H-006-01) |
| **P1** | 9 | 6 |
| **P2** | 13 | 3 |
| **P3** | ~12 | varios |

### Estado de los hallazgos de la Fase 6

| ID | Tema | Estado actual | Evidencia |
|----|------|---------------|-----------|
| H-006-01 | Pipeline de resultados reales | 🟥 **ABIERTO** | `match-center-poll` solo hace push+micro; no resuelve los 8 tipos. Único productor: `POST /resolve` (`resolve/route.ts:40`). |
| H-006-03 | IDs de jugador → 0 injustos | 🟥 **ABIERTO** | `scoreFirstScorer` compara contra IDs del pool fantasy (`scoring.ts:104-108`, `match-data.ts:133-143`); sin normalización. |
| H-006-04 | Predicciones huérfanas (pending eterno) | 🟥 **ABIERTO** | Sin expiración; `getUnresolvedMatchIds` las lista cada pasada sin cerrarlas (`store.ts:437-446`). |
| H-006-05/09 | Leaderboard no escala / desempate / posición | 🟥 **ABIERTO** | `getLeaderboard` carga toda la tabla en memoria (`store.ts:509-523`). |
| H-006-06 | `streak_freeze` inerte | 🟥 **ABIERTO (y peor)** | Nunca se consume en `resolveMatch`; además la rama `frozen` de `computeStreak` es un no-op (`gamification.ts:217-223`). |
| H-006-07 | Resuelve con resultado parcial | 🟥 **ABIERTO** | `mode:"now"` resuelve sin verificar FT ni completitud (`resolve/route.ts:44`). |
| H-006-08 | 0 injusto si faltan stats | 🟥 **ABIERTO** | `scoreOverUnder` con `actual=0` → "under" siempre gana (`scoring.ts:180-194`). |
| H-006-10 | Racha intra-partido no determinista | 🟥 **ABIERTO** | `select` de `resolveMatch` sin `ORDER BY` (`store.ts:302-306`). |
| H-006-02 | Bracket no sigue el cuadro FIFA | ⬜ No re-auditado en detalle esta pasada | (fuera de foco; ver Fase 6) |

**Conclusión:** la remediación de la Fase 6 no se ejecutó. Estos hallazgos se reincorporan al backlog con prioridad.

---

## 🔴 P0 — Bloqueantes (dinero / bypass total / lanzamiento)

### NP-01 (P0) — RLS deja al usuario auto-insertarse boosts gratis (×2 puntos, escudo) y "des-consumirlos"
- **Archivo:** `scripts/sql/2026-07-predictions-gamification.sql:141-142`; cliente anon en `src/lib/supabase/client.ts:21`; consumo en `src/lib/predictions/store.ts:327-343`
- **Evidencia:**
  ```sql
  CREATE POLICY "boosts insert own" ON public.prediction_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "boosts update own" ON public.prediction_boosts FOR UPDATE USING (auth.uid() = user_id);
  ```
- **Impacto:** la web usa la `anon key`, así que desde la consola del navegador (con la sesión del propio usuario) se puede `insert` directo en `prediction_boosts` SIN pasar por `buyBoost`/`spendCoins`: boosts ilimitados gratis (`double_next` = ×2 puntos, `shield` = anula negativos) que `resolveMatch` aplica en cada resolución. La política `UPDATE own` además permite poner `consumed_at = NULL` para reutilizar un boost. Es el **bypass del único sumidero de monedas del juego**.
- **Fix:** eliminar las policies de INSERT/UPDATE de `prediction_boosts` para `authenticated`; toda alta/consumo por backend con service role (como ya hacen los cosméticos).

### NP-02 (P0) — RLS deja al usuario editar `points_earned` / `is_correct` / `was_pro` de sus predicciones
- **Archivo:** `scripts/sql/2026-06-predictions.sql:103` (no hay ningún `REVOKE` de columnas en la migración)
- **Evidencia:**
  ```sql
  CREATE POLICY "predictions update own" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
  ```
- **Impacto:** RLS no restringe columnas. Con la `anon key` + su JWT, un usuario puede `PATCH /predictions?id=eq.<propia>` por PostgREST y fijar `points_earned`, `is_correct`, `resolved_at` y `was_pro` a voluntad sobre sus propias filas. `getLeaderboard`/`getMyStats` suman `points_earned` → **ranking inflado a discreción**; `was_pro=TRUE` reactiva todos los multiplicadores. La app solo escribe `prediction_data/confidence` por esta vía, pero la política permite mucho más. Misma clase en `prediction_duels` (`duels update party`, `2026-07:177`) y `prediction_league_members`.
- **Fix:** `REVOKE UPDATE (points_earned, is_correct, resolved_at, was_pro, match_multiplier, points_before_multiplier) ON public.predictions FROM authenticated;` (RLS por sí sola no limita columnas) o mover toda escritura a service role.

### NP-03 (P0) — No hay pipeline de resultados reales: las predicciones clásicas no se resuelven solas (= H-006-01)
- **Archivo:** `src/lib/predictions/match-data.ts` (no produce `MatchResultReal`); `src/app/api/cron/match-center-poll/route.ts:97-116` (push+micro, no resuelve los 8 tipos); productor único: `src/app/api/predictions/resolve/route.ts:40`
- **Impacto:** sin un integrador que haga `POST /api/predictions/resolve` con el JSON del resultado, **ninguna predicción de los 8 tipos se puntúa**: no se pagan Fútcoins/XP, el leaderboard queda vacío, los duelos y ligas no cierran. Bloqueante del modo para mañana.
- **Fix:** construir la ingestión api-football → `MatchResultReal` (reusando el adaptador del Match Center) y stagearla automáticamente al marcar FT.

### NP-04 (P0/config) — Resultado solo-en-KV + caída a simulación = se paga contra eventos inventados
- **Archivo:** `src/lib/predictions/result-store.ts:12-13` (TTL 7d, solo KV); `src/lib/predictions/live-picks-store.ts:63-72` (fallback a simulación)
- **Evidencia:**
  ```ts
  const TTL_SECONDS = 60 * 60 * 24 * 7;            // resultado oficial: solo KV, caduca
  // ...
  // si la API falla, caemos a simulación
  const script = buildSimulation(meta);            // eventos deterministas FICTICIOS
  ```
- **Impacto:** dos riesgos que convergen mañana: (a) si KV se vacía (ya pasó) entre staging y resolución, esas predicciones quedan en `awaitingResult` para siempre, sin alerta (`resolve-predictions` responde `ok:true`); (b) si `fetchLiveSnapshot` falla — y tu memoria dice que la env de api-football tiene una **Stripe key por error** —, `authoritativeState` degrada a **simulación** y micro/live-picks **pagan Fútcoins reales contra goles/tarjetas inventados**.
- **Fix:** (1) persistir el resultado también en Supabase (`match_results`, service role) y leer de ahí; (2) **verificar la env de api-football en Vercel hoy**; (3) si un partido marcado "real" no tiene snapshot, dejar pendiente en vez de liquidar contra simulación; (4) alerta Telegram si un partido lleva >X min en FT sin resolver.

---

## 🟠 P1 — Exploits de moneda y bugs serios

### NP-05 (P1) — Over/Under: `line` y `difficulty` los pone el cliente → 20 pts garantizados
- **Archivo:** `src/lib/predictions/rules.ts:87-93` (validación) + `src/lib/predictions/scoring.ts:188-190` (puntuación)
- **Evidencia:**
  ```ts
  if (typeof d.line !== "number") return err(...);          // no se acota ni se cruza con la línea generada
  // scoring.ts: los puntos salen SOLO de la difficulty declarada por el cliente
  const isOver = actual > d.line;
  const pts = d.difficulty === "hard" ? 20 : d.difficulty === "medium" ? 12 : 8;
  ```
- **Impacto:** enviar `{category:"goals", line:-1, choice:"over", difficulty:"hard"}` → `actual > -1` siempre cierto → **20 pts garantizados por partido** (×multiplicadores si Pro). La dificultad (que fija los puntos) está desacoplada de la línea real de `generateOverUnderLines`.
- **Fix:** validar que `(category, line, difficulty)` coincide exactamente con una entrada de `generateOverUnderLines(matchId)`; derivar `points` server-side.

### NP-06 (P1) — Modo Manada: `community_pct_at_time` lo fija el cliente → ×3 + farmeo de logro contrarian
- **Archivo:** `src/lib/predictions/scoring.ts:231-236`; validación `rules.ts:102-106`; flag en `route.ts:105-107`
- **Evidencia:**
  ```ts
  const pct = d.community_pct_at_time;     // viene del body del cliente
  if (pct < 20) { mult = 3; tag = "ultra-contrarian"; }
  else if (pct < 50) { mult = 2; tag = "contrarian"; }
  ```
- **Impacto:** elegir la opción mayoritaria y declarar `community_pct_at_time:1` → si acierta, **30 pts en vez de 10** + `is_contrarian=true`, que farmea el logro `lone_wolf` y el reto diario. Rompe la mecánica "ir contra la manada".
- **Fix:** estampar `community_pct_at_time` e `is_contrarian` en el server desde `prediction_social_stats`; ignorar el valor del cliente.

### NP-07 (P1) — Cadena: eslabones `card` triviales y repetibles → ~100 pts casi garantizados + logro jackpot
- **Archivo:** `src/lib/predictions/scoring.ts:139-142,158-159`
- **Evidencia:**
  ```ts
  case "card": { ok = r.events.some((e) => e.type === "card" && e.team === step.event_data.team); break; }
  // ...sin consumir cursor, sin exigir minuto, sin unicidad
  if (inOrder >= total && total > 0) return { correct: true, points: 100, detail: `Cadena completa` };
  ```
- **Impacto:** una cadena `[{card,home},{card,away},{card,home}]` da `inOrder=total` si cada equipo recibió ≥1 tarjeta — casi seguro en un partido del Mundial. **100 pts** (× racha/early/match → hasta ~360) + logro `jackpot` cada partido.
- **Fix:** para `card` exigir franja de minuto o consumir tarjetas distintas en orden (como `goal` con cursor); penalizar eslabones repetidos.

### NP-08 (P1) — Duelos: +50 Fútcoins acuñados sin escrow → farmeo por colusión multi-cuenta
- **Archivo:** `src/lib/predictions/gamification-store.ts:277-279`; sin UNIQUE en `scripts/sql/2026-07:104-119`; espejo en `src/lib/micro/store.ts:659`
- **Evidencia:**
  ```ts
  if (winner) { await grantCoins(winner, 50, 0, { module: "predicciones" }); }
  ```
- **Impacto:** el ganador recibe 50 monedas **acuñadas** (no transferidas del perdedor), sin coste para el retador y sin tope por par/partido. Dos cuentas controladas se retan en cada partido y garantizan que gane siempre la misma → ingreso ilimitado de la moneda global. El guard `cannot_duel_self` no frena la colusión. Sin índice UNIQUE, además se pueden crear N duelos del mismo par/partido (N×50).
- **Fix:** escrow real (cobrar stake a ambos al aceptar, pagar el bote al ganador) o eliminar la recompensa fija acuñada; índice único `(challenger_id, opponent_id, match_id) WHERE status IN ('pending','active')`.

### NP-09 (P1) — Modo Fantasma (micro): paga Fútcoins por acertar una micro YA resuelta (resultado público)
- **Archivo:** `src/lib/micro/store.ts:456,488`; lectura pública en `scripts/sql/2026-14:95` (`micro_predictions` SELECT `USING(TRUE)`)
- **Evidencia:**
  ```ts
  if (micro.status !== "resolved" || !micro.correct_option) return { ok: false, error: "not_replayable" };
  // ...
  if (isCorrect && sc.points > 0) await payUser(userId, sc.points, sc.points);
  ```
- **Impacto:** `respondGhostMicro` paga monedas+XP por "adivinar" una micro cuyo `correct_option` ya es público vía RLS. Un usuario que no jugó en vivo cobra el 50% de los puntos en TODAS las micros pasadas, siempre acertando. Sobre un torneo entero = farmeo masivo garantizado. El único límite (índice único `micro_id,user_id`) solo impide cobrarla dos veces.
- **Fix:** el modo Fantasma no debe pagar economía real (solo práctica/feedback), o pagar solo si la respuesta se registró antes de `resolved_at`.

### NP-10 (P1) — `claimDaily`: doble abono del check-in por carrera (TOCTOU)
- **Archivo:** `src/lib/predictions/gamification-store.ts:456-483`
- **Evidencia:**
  ```ts
  if (prof.last_checkin === today) { return { already: true, ... }; }   // guard en memoria
  // ...
  const grant = await grantCoins(uid, gainCoins, gainXp, ...);          // abona SIEMPRE
  await admin.from("profiles").update({ last_checkin: today, ... });
  await admin.from("prediction_daily_claims").upsert({...}, { onConflict: "user_id,day_key" }); // no gatea el grant
  ```
- **Impacto:** dos `POST /api/predictions/daily` concurrentes pasan el guard a la vez → `grantCoins` (incremento atómico, ambos persisten) corre N veces + el cofre inserta N boosts. A diferencia de battlepass/jornada, este abono no está gateado por el INSERT-PK.
- **Fix:** gatear el abono con un INSERT a `prediction_daily_claims` (PK `user_id,day_key`); si choca, devolver `already` sin abonar.

### NP-11 (P1) — `resolveMatch` sin lock ni compare-and-set → doble pago en resolución concurrente
- **Archivo:** `src/lib/predictions/store.ts:302-306` (lee pendientes) y `356-362` (update sin guard); pago en `gamification-store.ts:240,386`
- **Evidencia:**
  ```ts
  .eq("match_id", matchId).is("resolved_at", null);        // lee pendientes
  // ...
  await admin.from("predictions").update({ ..., resolved_at: ... }).eq("id", p.id);   // SIN .is("resolved_at", null)
  ```
- **Impacto:** el cron `*/30` solapado con un `POST /resolve` manual (o con la pasada siguiente) lee dos veces las mismas filas null y **`grantMatchRewards` paga Fútcoins/XP dos veces** y resuelve duelos dos veces. El comentario del cron afirma idempotencia, pero solo es cierta en re-ejecución *secuencial*.
- **Fix:** añadir `.is("resolved_at", null)` al UPDATE y contar/pagar solo las filas cuyo UPDATE afectó fila; lock por `match_id` (advisory lock) y `grantMatchRewards` idempotente por `(user_id, match_id)` con PK.

### NP-12 (P1) — El cron `score-brackets` existe pero NO está programado → el bracket nunca puntúa
- **Archivo:** `src/app/api/cron/score-brackets/route.ts` (existe) vs `vercel.json` (no aparece)
- **Impacto:** `prediction_bracket_score` no se rellena solo → `bracketPointsByUser` suma **0** a la clasificación de **todas las ligas** (`gamification-store.ts:688,698-699`) y el leaderboard de bracket queda vacío. El bracket se vende como que "cuenta en las ligas" y no cuenta. (No bloquea el día 1 porque las eliminatorias son más tarde.)
- **Fix:** añadir `{ "path": "/api/cron/score-brackets", "schedule": "15 */6 * * *" }` a `vercel.json`.

### NP-13 (P1) — Leaderboards y stats leen toda la tabla de predicciones resueltas en cada request
- **Archivo:** `src/lib/predictions/store.ts:509-523` (global), `457-463` (mías); `gamification-store.ts:756-767` (semanal), `398-407` (rachas)
- **Evidencia:**
  ```ts
  const { data } = await admin.from("predictions")
    .select("user_id,points_earned,is_correct").not("resolved_at","is",null);   // sin filtro ni limit
  ```
- **Impacto:** cada vista del ranking trae a Node **todas** las filas resueltas del universo y agrega en memoria (el `limit` recorta después). Con audiencia de Mundial: payload enorme + CPU por request en ruta caliente (pública, sin auth ni cache), y `getActiveStreaks`/`grantMatchRewards` repiten el patrón dentro de la resolución → riesgo de reventar el presupuesto de 55s y dejar partidos a medio resolver. (= H-006-05/09 abiertos.)
- **Fix:** agregación en SQL vía RPC `SECURITY DEFINER` (`SUM(...) GROUP BY user_id ORDER BY ... LIMIT n`) o tabla de standings materializada; cachear el ranking en KV con revalidate corto.

---

## 🟡 P2 — Bugs y riesgos

### Desincronización front ↔ back / datos falsos mostrados como reales

- **NP-14 (P2) — Pleno "+500" anunciado pero nunca abonado.** `PrediccionesGame.tsx:1457` muestra "¡Posible pleno! +500" pero `PERFECT_MATCH_BONUS = 500` (`scoring.ts:302`) no se importa en ningún sitio; `resolveMatch` cuenta `perfect` pero no abona el bono. → quitar el "+500" o abonarlo.
- **NP-15 (P2) — Distribución de la manada del partido destacado siempre 0%.** `FeaturedMatch` busca `option_key === "home"` (`PrediccionesGame.tsx:855`) pero el back guarda con prefijo `winner:home` (`store.ts:190`). La card más prominente del lobby pinta "0% · 0% · 0%" en cuanto hay votos. → usar `get(\`winner:${k}\`)`.
- **NP-16 (P2) — Ranking semanal: precisión "0%" para todos.** `leaderboard/route.ts:22-28` hardcodea `accuracy_pct: 0` en el modo weekly y el front lo pinta como real (`ranking/page.tsx:67`). → ocultar el % en weekly o calcularlo en el back.
- **NP-17 (P2) — Lobby con promesas inventadas.** `app/predicciones/page.tsx` + `i18n/translations.ts` anuncian "Hasta 200x", "x3", "Cuotas en tiempo real", "bonus por predecir en los últimos 10 minutos" y "Gratis · 8 tipos". Realidad: Free solo permite `exact_score`, multiplicador máximo real ×2.0, puntos máximos 100, no hay cuotas, y el bonus es early-bird por predecir 24h **antes**. → reescribir el copy con valores reales.
- **NP-18 (P2) — Stats sintéticas de jugadores mostradas como reales.** Duelos muestran "forma 7.4" (`PrediccionesGame.tsx:1993`) generada por PRNG determinista (`fantasy/players.ts:111`), con blurb "duelo táctico real". Viola la regla de no inventar datos. → no mostrar el número o etiquetarlo como índice propio del juego.

### Sumideros de Fútcoins inútiles / entitlement inconsistente

- **NP-19 (P2) — Boost "Cadena Extendida"/`mega_chain` (150 monedas) comprable pero inusable:** la UI fija la cadena en 3 eslabones y no hay botón para añadir (`PrediccionesGame.tsx:1885-1934`), aunque el back valida hasta 7. → añadir control de eslabones u ocultar el boost.
- **NP-20 (P2) — Boost "Ojo de Halcón" (60 monedas) vende algo gratis:** el SocialForm ya muestra los % de la comunidad a todos (`PrediccionesGame.tsx:2083-2098`). → gate por boost o retirar.
- **NP-21 (P2) — Founders quedan a medias.** Crear predicción usa `isPro()` (incluye Founders) pero el Battle Pass premium y el badge leen `profiles.is_premium` (`gamification-store.ts:88-93,525`), donde los Founders no están. Un Founder recibe multiplicadores pero no puede reclamar el tramo premium ni sale con estrella. → unificar en `isPro()`.

### Frontend robustez / polling

- **NP-22 (P2) — Formularios bloqueados en "busy" para siempre si falla la red.** Los 8 forms hacen `setBusy(true); await onSubmit(...); setBusy(false);` sin `try/finally` y `submit` no tiene try/catch (`PrediccionesGame.tsx:232-262`). Un fetch fallido deja el botón deshabilitado sin aviso. → `try { ... } finally { setBusy(false) }` + toast.
- **NP-23 (P2) — `loadMatch` sin catch:** un 500/red deja el acordeón vacío (sin goleadores, duelos ni tus predicciones) como si fuera estado real (`PrediccionesGame.tsx:185-215`). → estado de error + reintentar.
- **NP-24 (P2) — Live-picks solo se liquidan en el polling del usuario (no hay cron):** un pick ganador solo paga si el usuario reabre la vista (`live-picks/route.ts:28`). Si cierra la pestaña, no cobra. → cron que recorra live-picks `pending` vencidos (como `resolve-micro`).
- **NP-25 (P2) — Polling de `LiveMicroPicks` cada 20s para partidos que no están en vivo, sin parar ni respetar pestaña oculta** (`LiveMicroPicks.tsx:54,74-88`). `data.finished` existe pero no se usa. → espaciar/parar si no live o finished; pausar con `document.hidden`.
- **NP-26 (P2) — Hydration mismatch de horarios:** `fmtKickoff` usa `toLocaleString` sin `timeZone` en una página estática (`PrediccionesGame.tsx:70-74`) → HTML en UTC (build) vs hora local del navegador. → fijar `timeZone` o formatear en `useEffect`.
- **NP-27 (P2) — Duelos: el retador ve "Aceptar/Rechazar" en sus propios retos salientes y el error se silencia.** `ligas/page.tsx:97-103,193-198` no distingue entrantes/salientes y `respond` no maneja el `else` (back devuelve `not_your_duel`). → el back debe marcar `is_incoming`; añadir manejo de error.

### Backend / concurrencia / SQL

- **NP-28 (P2) — `mode:"now"` resuelve sin verificar fin del partido ni completitud** (= H-006-07). `resolve/route.ts:44`. → exigir estado FT + resultado completo.
- **NP-29 (P2) — Reembolsos de compra fallida best-effort:** `buyBoost`/`buyCosmetic` hacen `grantCoins(...).catch(()=>{})` (`gamification-store.ts:589-593`, `cosmetics-store.ts:121-127`). Si el reembolso falla, el usuario pierde monedas sin recibir el ítem. → registrar para reconciliación o RPC transaccional.
- **NP-30 (P2) — `prediction_duels` sin UNIQUE** (ver NP-08): permite duelos duplicados del mismo par/partido → N×50.
- **NP-31 (P2) — Cupo Free por jornada (3) con TOCTOU:** `countPredictionsForMatches` + check + insert sin lock (`route.ts:66-79`). N requests concurrentes superan el límite. (Fuga de monetización, no de dinero.)
- **NP-32 (P2) — `PATCH /predictions/[id]` no aplica su regla "Pro, 1/día":** el handler solo valida sesión/propiedad/ventana; `changesUsedToday` es código muerto (`[id]/route.ts`, `store.ts:114-124`). Ediciones ilimitadas gratis hasta el cierre.
- **NP-33 (P2) — Sin rate limiting en escrituras:** `rateLimitByUser` existe (`auth-helpers.ts:54`, usado en ia-coach) pero no se aplica a POST/PUT de predicciones, boosts, cosméticos, duelos, daily, social-stats. Amplifica los TOCTOU.

---

## 🟢 P3 — Pulido

- **NP-34** Resumen de "Modo Manada" muestra el enum crudo: "home (con la manada)" / "(contrarian)" (`PrediccionesGame.tsx:1683`). → mapear a Local/Empate/Visitante y "(a contracorriente)".
- **NP-35** "Hora Feliz" muestra claves de máquina: "⚡ Hora Feliz: exact_score ×1.5" (`gamification.ts:243,264`, `GamificationHUD.tsx:167`). → mapear con `TYPE_META[type].label`.
- **NP-36** Campos fantasma `username`/`name` en `/api/predictions/me` → la banda en directo siempre dice "Tú está a…" (gramática + fallback) (`PrediccionesGame.tsx:774-779`). → redactar "Estás a X XP del nivel N".
- **NP-37** `/api/predictions/me` se pide 3 veces al montar el tablero (`UserSummaryBar`, `LiveActivityBand`, `GamificationHUD` plegado) + 2 en el detalle. → hook/contexto compartido o lazy-load.
- **NP-38** Badge "Cierra cerrado" tras el deadline y los 8 forms + "Editar" siguen activos (`PrediccionesGame.tsx:1451,1478`); el back rechaza con 403 pero el usuario rellena en balde. → con `diff<=0`, "Predicciones cerradas" + deshabilitar.
- **NP-39** Auto-apertura del acordeón siempre abre `exact_score` aunque esté completado (`PrediccionesGame.tsx:1265-1269`). → condicionar a `state !== null`.
- **NP-40** Micro-picks: opción "Ninguno" del mercado se resuelve mostrando "Nada" (`LiveMicroPicks.tsx:49-52` vs `live-picks.ts:56`). → unificar labels.
- **NP-41** `addSeasonXp` es read-modify-write no atómico (`gamification-store.ts:101-112`) → puede subcontar XP de temporada (no afecta saldo de Fútcoins). → RPC `increment_season_xp`.
- **NP-42** `bumpSocialStat` read-modify-write + write-amplification (N updates por voto) (`store.ts:201-228`). → `vote_count = vote_count + 1` atómico, % en lectura.
- **NP-43** A11y: steppers de marcador sin `aria-label` de equipo; toasts/flash sin `role="status"`/`aria-live` (`PrediccionesGame.tsx:1777`, `GamificationHUD.tsx:234`, etc.).
- **NP-44** `/predictions/resolve` compara el secreto sin `timingSafeEqual` (a diferencia de `requireCron`) (`resolve/route.ts:19-23`). → usar `requireCron`.
- **NP-45** GETs por-usuario sin `Cache-Control: private, no-store` salvo `/me` (`me/route.ts:21`). Riesgo de caché por intermediarios.
- **NP-46** Mantenibilidad: `PrediccionesGame.tsx` ~107KB / 2.119 líneas con 20+ componentes y CSS embebido — riesgo de regresión al tocar.

---

## ✅ Verificado correcto (no regresar)

- **Billetera de Fútcoins atómica:** `increment_wallet`/`spend_wallet` (`SECURITY DEFINER`, `coins >= p_amount` en una sentencia, `REVOKE FROM PUBLIC` + `GRANT service_role`) → sin sobregasto ni saldo negativo bajo concurrencia (`2026-17`, `2026-18`).
- **Auth en mutaciones por sesión Supabase** (`getCurrentUser`), nunca `user_id` del body, en todas las rutas de escritura.
- **Idempotencia gateada por INSERT-PK** (correcta): battlepass (`claimBattlePassTier`), jornada (`claimJornadaIfComplete`), cosméticos, retos. Micro y live-picks resuelven con UPDATE condicional `status=pending` + comprobación de filas → sin doble pago en polling concurrente.
- **Deadlines server-side con TZ real** (`checkOpen` deriva de `kickoff_at` vía ET/Intl; cierra a kickoff−15min); POST y PATCH lo aplican; no se puede editar tras ver alineación/primer gol; no existe `DELETE` de predicciones.
- **Crons protegidos** con `requireCron` fail-closed + `timingSafeEqual` (salvo `/resolve`, ver NP-44).
- **Multiplicadores gateados por `was_pro` foto** (sin nerf retroactivo) (`store.ts:346-354`).
- **`applyBonuses`** correcto: racha ×1.5 y early ×1.2 solo si `points>0`; negativos no reducidos por bonus personales.
- **Ligas privadas SIN premios de Fútcoins (anti-cheat): CUMPLE.** `createLeague/joinLeague/leaveLeague/leagueLeaderboard` no llaman a `grantCoins`; clasificación de solo lectura. No hay farmeo por crear/abandonar ligas.
- **Duelos contra uno mismo: BLOQUEADO** (`cannot_duel_self`). (La colusión multi-cuenta sí farma — NP-08.)
- **Ranking global por Fútcoins escala y desempata** (`economy/ranking.ts`): `order coins desc, xp desc, limit` + `getUserRank` por conteo.
- **RLS habilitado en todas las tablas** del módulo; ninguna policy de **escritura** con `USING(true)` (los `USING(TRUE)` son SELECT de datos públicos). Tipos de dinero `INTEGER` en todas las tablas. UNIQUE presentes donde el código asume unicidad (predicción por user/partido/tipo, micro_responses, live-picks pending, micro_duels, código de liga). **Excepciones:** NP-01/NP-02 (boosts y predictions con escritura de usuario) y NP-30 (duels sin UNIQUE).
- **Coherencia de los 8 tipos** entre `types.ts`/`rules.ts`/`scoring.ts`/`match-data.ts`: no hay tipo creable que no se puntúe ni viceversa.

---

## Plan de remediación sugerido (orden para mañana)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Cerrar las 2 puertas RLS (quitar INSERT/UPDATE de usuario en `prediction_boosts`; revocar columnas de `predictions`/`prediction_duels`/`league_members`) | NP-01, NP-02 | **P0 — hoy** |
| 2 | Verificar la env de api-football en Vercel; no liquidar micro/live-picks contra simulación si el partido es real | NP-04 | **P0 — hoy** |
| 3 | Persistir el resultado oficial en Supabase + alerta de partidos sin resolver | NP-04, NP-03 | **P0** |
| 4 | Construir ingestión api-football → `MatchResultReal` + staging automático | NP-03 (H-006-01) | **P0** |
| 5 | Validar `line/difficulty/duel_id/community_pct` server-side contra lo generado | NP-05, NP-06, NP-12-duel | P1 |
| 6 | Escrow o quitar la recompensa fija de duelos; UNIQUE en `prediction_duels`; modo Fantasma sin pago real | NP-08, NP-09, NP-30 | P1 |
| 7 | CAS + lock en `resolveMatch`; gatear `claimDaily` con INSERT-PK | NP-11, NP-10 | P1 |
| 8 | Programar `score-brackets` en `vercel.json` | NP-12 | P1 |
| 9 | Cadena: endurecer eslabones `card`; agregados de leaderboard en SQL | NP-07, NP-13 | P1 |
| 10 | Alinear copy del lobby/HUD con valores reales; abonar o quitar "+500"; arreglar 0% del destacado; retirar boosts inertes | NP-14..20 | P2 |
| 11 | Robustez frontend (try/finally, catch, polling, hydration) + cron de live-picks | NP-22..27 | P2 |

**Criterio de cierre:** RLS sin escritura de usuario sobre columnas de dinero/ranking; resultados reales ingeridos y persistidos en Supabase; sin minteo por over_under/social/chain/duelos/fantasma; resolución idempotente bajo concurrencia; leaderboards en SQL; copy sin datos inventados.
