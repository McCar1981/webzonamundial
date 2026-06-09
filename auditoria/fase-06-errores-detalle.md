# Fase 6 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-06-juego-predicciones.md](fase-06-juego-predicciones.md)

Detalle por archivo de la lógica de predicciones, bracket y ranking, incluyendo "OK" y P3. Cada fila cita
`archivo:línea`.

---

## A. Motor de bracket (corrección de avance)

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| engine.ts `propagate` | Seeding R32 | Lista lineal `1-vs-32`, NO el cuadro oficial FIFA (`1A-2B`, `1E-3ABCDF`…) | P1 | engine.ts:117-134 vs matches.ts:102-116 |
| engine.ts `propagate` | Colocación de terceros | Selección de 8 mejores terceros correcta, pero **colocación arbitraria** (no tabla FIFA) | P1 | engine.ts:122-134 |
| engine.ts `propagate` | R32→FINAL | OK dentro de su esquema — `toMatches[i]` ← winners de `fromMatches[2i]/[2i+1]`; maneja huecos | P2 (árbol no oficial) | engine.ts:144-155 |
| engine.ts `applyPick` | Invalidación aguas arriba | OK — borra picks cuyo ganador ya no está; idempotente | OK | engine.ts:220-227 |
| engine.ts | Bloqueo hasta 72 picks | `areAllGroupsComplete` exige los 12 grupos antes de poblar R32 (sin relleno progresivo) | P3 | engine.ts:103-116 |
| engine.ts `groupStandings` | Desempates | Solo pts/GD/GF; faltan enfrentamiento directo/fair-play/sorteo FIFA | P3 | engine.ts:92-94 |
| scoring.ts `predictedReached` | Coherencia engine↔scoring | Hereda el seeding incorrecto, pero puntúa por conjunto de equipos por ronda → **no afecta puntos** | P2 | scoring.ts:33-48 |
| scoring.ts `maxBracketScore` | Nº equipos/ronda | OK — R32:32, R16:16, QF:8, SF:4, FINAL:2 coherente con el modelo | OK | scoring.ts:81-86 |
| scoring.ts `scoreBracket` | Modelo progresión | OK — robusto, idempotente, reproducible; campeón +25 | OK | scoring.ts:57-78 |
| match-time.ts `findMatchData` | Fecha/sede KO | `slotIdx` del engine no corresponde al cuadro oficial → fecha/sede KO posiblemente erróneas | P1 | match-time.ts:61-85 |
| teams.ts vs selecciones.ts | Orden de grupo | Mismo conjunto, distinto orden (afecta cabeza de serie / desempate por array) | P2 | teams.ts:29-32 |
| grupos/page.tsx, [slug] | 12 grupos | OK — 12 grupos A-L con selecciones reales; "32 clasifican" correcto | OK | grupos/page.tsx:307,442 |
| SimuladorGrupos.tsx | Simulador | Desempate simplificado duplicado; no sabe si un 3º entra global (esperable) | P3 | SimuladorGrupos.tsx:169-177 |
| ClassicBracket/CosmicBracket | TBD/huecos | OK — "Por definir" para null, botones disabled, badges done/total | OK | ClassicBracket.tsx:441-481 |

**Veredicto formato 48/terceros:** clasificación correcta, **colocación en el cuadro incorrecta** (P1). El scoring
no se corrompe porque puntúa por equipos-por-ronda, no por cruces.

---

## B. Motor de puntuación de predicciones

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| scoring.ts `scoreExactScore` | Exacto/cerca/ganador | OK — 25 exacto, 10 diff1, 5 mismo ganador, 0 fallo | OK | scoring.ts:76-86 |
| scoring.ts `scoreWinner` | Confianza ×1-3 | OK — +10×m acierto, -5×m fallo; clamp [1,3] | OK | scoring.ts:88-93 |
| scoring.ts `scoreFirstScorer` | IDs de jugador | Compara contra IDs del pool fantasy → mismatch con api-football = 0 injusto | P1 | scoring.ts:104-108; match-data.ts:128-139 |
| scoring.ts `scoreChain` | Cadena en orden | OK — 100 completa, tabla {4:50,3:25,2:10,1:3}; `inOrder` consecutivos | OK | scoring.ts:155-164 |
| scoring.ts `scoreDuel` | player_ratings | Sin ratings → `winner=null` → siempre fallado (0 injusto) | P1 | scoring.ts:171-177 |
| scoring.ts `scoreOverUnder` | stats | Sin stats → `actual=0` → under siempre acierta, over siempre falla | P2 | scoring.ts:180-194 |
| scoring.ts `scoreMinuteDrama` | first_sub_minute | Sin el dato → "no ocurrió" = 0 (siempre hay subs) | P2 | scoring.ts:209-211 |
| scoring.ts `scoreSocial` | contrarian | OK — ×1/×2/×3 según `community_pct_at_time` | OK | scoring.ts:221-237 |
| scoring.ts `applyBonuses` | Multiplicadores | OK — racha ×1.5, early bird ×1.2 solo si >0; match mult amplifica negativos | OK | scoring.ts:270-291 |

---

## C. Resolución y datos reales

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| match-data.ts | Origen del resultado | **NO** construye score/events/stats/ratings reales; solo metadatos/multiplicadores/duelos/OU | P0 | match-data.ts:1-187 |
| result-store.ts | Staging | El resultado real llega EXTERNO vía `/api/predictions/resolve`; no hay puente api-football | P0 | result-store.ts:4-7 |
| store.ts `resolveMatch` | Aplica a todas las pendientes | OK — `match_id=X AND resolved_at IS NULL` | OK | store.ts:287-358 |
| store.ts `resolveMatch` | Idempotencia | OK — marca `resolved_at`; boost por `consumed_at`; sin doble abono normal | OK | store.ts:290-291,337-349 |
| store.ts `resolveMatch` | Resultado parcial / antes de tiempo | `mode:"now"` resuelve sin verificar FT ni completitud; sin reversión | P1 | resolve/route.ts:44; cron:60-69 |
| store.ts `resolveMatch` | Racha intra-partido | Orden de actualización no determinista (sin `ORDER BY`) | P2 | store.ts:287-291,352 |
| store.ts | Predicciones huérfanas | Sin resultado staged → `resolved_at=NULL` para siempre; sin fallback | P1 | store.ts:418-427 |
| store.ts | Predicción perfecta | Exige exactamente 8 tipos | P3 | store.ts:360-364 |
| gamification-store.ts | streak_freeze | Comprado pero nunca aplicado en resolución | P1 | gamification.ts:209-225 |
| cron/resolve-predictions | Dependencia KV | 500 si falta KV → no resuelve nada | P2 | cron route:43-45 |

---

## D. Ranking y gamificación

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| economy/ranking.ts | Orden global | OK — `coins` desc → `xp` desc (desempate estable); filtra coins>0 | OK | ranking.ts:61-82 |
| economy/ranking.ts | `getUserRank` | OK — escalable (`count head:true`), funciona fuera del top | OK | ranking.ts:90-130 |
| store.ts `getLeaderboard` | Escala | Carga TODAS las predicciones resueltas en memoria por request (no escala) | P1 | store.ts:490-504 |
| gamification-store.ts | Leaderboard semanal/ligas | Mismo patrón no escalable | P1 | gamification-store.ts:744-755,669-672 |
| store.ts `getLeaderboard` | Desempate | Solo `pts` desc → orden inestable en empates | P2 | store.ts:504 |
| store.ts `getLeaderboard` | Paginación | Solo `limit` (top-N), sin offset/cursor | P2 | store.ts:504 |
| leaderboard/route.ts | `my_position` | Solo si estás en el top N; null fuera (incoherente con getUserRank) | P2 | leaderboard/route.ts:29 |
| leaderboard/route.ts | `total_users` | = filas devueltas (≤limit), no el total real | P3 | leaderboard/route.ts:30 |
| gamification.ts | Curva XP/niveles | OK — `totalXpForLevel(L)=50·(L-1)·L` consistente; sin off-by-one | OK | gamification.ts:58-99 |
| gamification.ts | XP/coins por resolución | OK — acertar paga más que participar | OK | gamification.ts:102-120 |
| app/app/rankings/page.tsx | Global | OK — datos reales, vacío/loading, "tú aquí" fuera del top, `isMe` | OK | rankings/page.tsx:71-85 |
| jugar/ranking/page.tsx | Predicciones | No resalta la fila del usuario (`isMe` ausente); `myPos` null fuera del top | P2 | jugar/ranking/page.tsx:50,58-69 |

---

## E. Caveats de verificación
- La resolución de predicciones **depende de un integrador externo no implementado** (H-006-01) — el modo no es
  funcional en producción tal cual.
- La fidelidad del bracket al cuadro real (H-006-02) solo se notará plenamente cuando arranquen las eliminatorias;
  el scoring por progresión la enmascara en los puntos.
