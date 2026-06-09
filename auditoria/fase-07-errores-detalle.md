# Fase 7 — Detalle exhaustivo por archivo

**Fecha:** 2026-06-08 · **Complemento de:** [fase-07-juego-engagement.md](fase-07-juego-engagement.md)

Detalle por módulo/archivo, incluyendo "OK" y P3. Cada fila cita `archivo:línea`.

---

## A. Fantasy

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| scoring.live.ts | Puntuación en vivo | OK — datos REALES de api-football (vía Match Center); gol/asist/tarjeta/min/portería a cero | OK | scoring.live.ts:72-205 |
| scoring.ts `SCORING_TABLE` | Baremo mostrado | Promete MVP-IA, penalti parado, 3+ tiros, recuperaciones que el motor real NO calcula | P1 | scoring.ts:18-36 vs scoring.live.ts:150-205 |
| scoring.live.ts `namesMatch` | Atribución | Matching por apellido/inicial+apellido sin id/dorsal → riesgo de mal-atribuir eventos | P1 | scoring.live.ts:46-60 |
| scoring.ts `simulateGameweek` | Código muerto | Simulación RNG no usada por ninguna UI (solo POWER_UPS/tipos se importan) | P2 | scoring.ts:254-388 |
| rules.ts | Presupuesto/formación/MAX_PER_NATION | OK — €100M, formaciones válidas, máx 3/selección | OK | rules.ts:140-150; types.ts:104-106 |
| team/route.ts | Validación servidor | NO valida ni recalcula; guarda `state` y `points` del cliente | P0 (H-001-18) | team/route.ts:33-47 |
| players.ts | Pool | Jugadores REALES (convocatorias 2026); precios reales si hay Transfermarkt | OK/P3 | players.ts:198-216; fantasy-rosters.ts |
| players.ts | Stats simuladas | form/totalPoints/ownership/startProb/lesión = RNG determinista | P2 | players.ts:111-165 |
| player-stats.ts | Ficha analítica | 18 métricas por partido RNG; KO proyectado | P2 | player-stats.ts:129-174 |
| leagues.server.ts | Ligas | OK — crear/unir/clasificación funcionales | OK | leagues.server.ts:15-96 |
| leagues.server.ts | Fuente de puntos del ranking | Ordena por `total_points` enviado por el cliente (falsificable) | P0 (H-001-18) | leagues.server.ts:74-87 |
| scoring.live.ts | Capitán/vice/power-ups/auto-subs | OK — x2/x1.5/x3, tridente/muro/joker/comodín, auto-subs por compatibilidad | OK | scoring.live.ts:300-386 |
| achievements.ts | Logros | OK — 13 logros derivados del estado (no stub) | OK | achievements.ts:90-236 |
| tournament.ts | Bracket fantasy | Proyección por ranking+RNG, no cuadro real | P2 | tournament.ts:76-129 |
| coach.ts | Coach "IA" | Heurísticas (no LLM) sobre datos simulados del pool | P2 | coach.ts:18-131 |
| season.ts / fixtures.ts | Gate y GW→partido | OK — bloqueado hasta 11-jun-2026; mapeo 8 jornadas correcto | OK | season.ts:9-14; fixtures.ts:22-95 |

**Veredicto:** el scoring de fantasy es REAL (no simulación); `simulateGameweek` RNG es código muerto. Lo simulado
es el resto del pool (form/stats/precios parciales).

---

## B. Modo Carrera

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| doc vs código | Coherencia | Doc = manager de plantilla; código = RPG de progresión DT. Casi nada coincide | P1 | modo-carrera-documentacion.md vs types.ts:264-284 |
| live-season.ts | "En Vivo" real | Solo rival/hora reales; marcador simulado (Poisson); KO con rivales aleatorios | P1 | live-season.ts:60-131,98-128 |
| match-live.ts / season.ts | Simulación | Todo partido es Poisson, no datos reales | P2 | season.ts:157-232 |
| season.ts | Grupo | Tabla con 3 rivales del DT, no el grupo real de 4 | P2 | season.ts:373-406 |
| engine.ts | Overall monótono | Nunca baja; solo sube con XP | P2 | engine.ts:30-63 |
| engine.ts | Reputación | Casi-monótona; ordena el ranking | P3 | engine.ts:83-128 |
| store.ts | narrative/rivalries | No validados (slice 50 / array tal cual) → contenido arbitrario en UI | P2 | store.ts:260,265 |
| store.ts | Resto del estado | OK — clamps de overall/xp/morale/rep/títulos por whitelist; total recalculado | OK | store.ts:205-286 |
| season.ts | Números mágicos | XP/moral/rep con constantes inline dispersas | P3 | season.ts:498-499,608-621 |
| classics.ts | Clásicos | Solo etiqueta cosmética (sin efecto de juego) | P3 | classics.ts:39-51 |
| match-live.ts | Figura del partido | `motm` aleatorio, no persiste ni alimenta stats individuales | P2 | match-live.ts:95-101 |
| missions/board/press/narrative/injuries/suspensions | Completitud | OK — implementados | OK | (varios) |

**Completitud:** engine/season/match-live/missions/streak/injuries/suspensions/board/press/narrative = implementados;
live-season = parcial (calendario real, resultado simulado); classics = cosmético.

---

## C. Trivia

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| generator.ts | Generación IA | OK — Claude + doble verificación a ciegas (descarta alucinaciones) | OK | generator.ts:103-169,213-250 |
| generator.ts | validateQuestion | OK — 4 opciones únicas, correctIndex 0-3, sin comodines | OK | generator.ts:257-298 |
| store.ts + cron | Banco | OK — acumulativo persistente (HASH Redis), crece por cron + on-the-fly; anti-repetición | OK | store.ts:165-185; cron route:36-47 |
| play.ts | Puntuación/dificultad | OK — BASE_POINTS 5/10/15/25, multiplicadores, opciones barajadas | OK | play.ts:49-85 |
| trivia/page.tsx | Cifra "2.000+" | Inflada vs ~24 fallback creciendo 30/día | P2 | trivia/page.tsx:397 |
| generator.ts | Desactualización | Solo hechos atemporales; "actualidad" fija 2026 (bajo riesgo) | P3 | generator.ts:52-70 |

---

## D. Micro

| Área/Archivo | Aspecto | Hallazgo | Sev | Evidencia |
|---|---|---|---|---|
| engine.ts / micro.ts | Resolución real | OK — resuelve contra eventos reales del Match Center, determinista | OK | engine.ts:63-113; micro.ts:329-403 |
| store.ts | Idempotencia | OK — `settleMicro` con guardia, paga solo `resolved_at IS NULL`, Cadena de Fuego recalculada | OK | store.ts:339-400 |
| ai-generator.ts | IA/coste | OK — Haiku solo para redactar, gated `MICRO_AI`, 1 intento/min | OK | ai-generator.ts:35-37,93-95 |
| micro.ts | `goal_in_stoppage` | Depende de `extra` del feed (riesgo de borde) | P3 | micro.ts:386-389 |
| micro/page.tsx | Modos "Fase 2" | IA OFF por defecto sin indicarlo claramente | P3 | micro/page.tsx:34-38 |

---

## E. Módulos secundarios (clasificación)

| Módulo | Clasificación | Backend | Hallazgo | Sev |
|--------|---------------|---------|----------|-----|
| album | Placeholder/maqueta | Solo `notify-module` | Cromos/stats mock; badge "coming" (honesto) | (info) |
| ligas | Placeholder (landing) | Solo `/registro`+notify | APIs de ligas existen pero la landing no las usa | (info) |
| stories | Parcial (preview client) | Ninguno | Editor en navegador sin persistir; CTA "Crear mi primera story" engañosa | P1 (parte de H-007-05) |
| streaming | Placeholder/maqueta | Solo notify | Creadores/recompensas mock; disclaimer legal presente | (info) |
| chat | Placeholder/maqueta | Ninguno | "online" hardcodeado (1.2k/8.4k); CTA "Entrar al chat" sin chat real | P1 (parte de H-007-05) |

Los 5 son una `page.tsx` cada uno, controlados por `NEXT_PUBLIC_APP_AVAILABILITY` (default `waitlist`). El problema
P1 (H-007-05) es la **falta de distinción clara** entre módulos funcionales y maquetas, agravada por cifras de
actividad falsas y CTAs de acción inmediata.

---

## F. Patrón transversal de transparencia
Cifras/promesas no respaldadas por datos, recurrentes en la app:
- `BASE_COUNT=8642` contador de registros inflado (**H-004-P3**).
- Trivia "2.000+ preguntas" (H-007-08).
- chat "8.4k online", album "960+ cromos" (H-007-05).
- Tabla de puntuación de fantasy con acciones no calculadas (H-007-01).
- Doc de modo carrera describiendo otro juego (H-007-03).

→ Recomendación global: revisar copy/cifras de marketing para que reflejen el estado real (tratar en **Fase 19 —
Legal/transparencia** y **Fase 15 — SEO/contenido** además de aquí).
