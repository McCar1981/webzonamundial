# Fase 7 — Juego: fantasy, modo carrera, trivia, micro

**Estado:** 🟥 Hallazgos abiertos
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 3 sub-auditorías de corrección/completitud)
**Alcance:** `api/{fantasy,modo-carrera,trivia,micro}`, `lib/{fantasy,modo-carrera,trivia,micro}/*`, `app/app/{fantasy,modo-carrera,trivia,micro,album,ligas,stories,streaming,chat}`, `modo-carrera-documentacion.md`. La **seguridad** ya se cubrió en **Fase 1 (Grupo 6)**: fantasy `totalPoints` del cliente (**H-001-18** P0), `validateTeam` solo cliente (**H-001-19**), modo-carrera leaderboard manipulable (**H-001-21**); Trivia/Micro server-side OK. Esta fase audita **corrección de lógica** y **completitud (real vs placeholder)**.

---

## Resumen ejecutivo

Hay **dos motores genuinamente buenos** y un **patrón transversal de sobre-promesa**:

- ✅ **Trivia** es excelente: preguntas generadas con IA + **doble verificación "a ciegas"** (solo sobreviven
  las que un verificador confirma con alta confianza), `validateQuestion` robusto, banco acumulativo que se
  renueva, puntuación coherente, anti-repetición.
- ✅ **Micro** es sólido: micro-predicciones en vivo resueltas de forma **determinista e idempotente contra
  eventos reales** de api-football; IA opcional, barata (Haiku) y apagada por defecto.
- ✅ **Fantasy** SÍ puntúa con **datos reales** en la pantalla de juego (`scoring.live.ts` vía Match Center) —
  bloqueado hasta el 11-jun-2026; reglas (presupuesto €100M, formación, MAX_PER_NATION=3) correctas; pool de
  jugadores **real** (convocatorias oficiales 2026); capitán/power-ups/auto-subs coherentes.
- ✅ **Modo Carrera** tiene casi todos sus submódulos **implementados** (engine, season, match-live, misiones
  con anti-faucet, junta, prensa, narrativa, lesiones/sanciones).

El problema dominante es de **completitud y transparencia** (no de seguridad): elementos que **prometen más de
lo que el backend hace** — la tabla de puntuación de fantasy, la documentación de modo carrera, y sobre todo los
**módulos secundarios** (chat/stories/streaming), que son **maquetas sin backend** con cifras de actividad
**falsas** y CTAs de acción inmediata.

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 5 |
| **P2** | 5 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Fantasy: presupuesto/fichajes/límites/scoring server-side | ⚠️ Reglas y scoring en vivo correctos, **pero no validados/recalculados en servidor** (H-001-18/19) |
| Modo carrera: progresión/estado persisten; coherente con doc | ❌ Doc describe **otro juego** (H-007-03); "En Vivo" no usa resultados reales (H-007-04) |
| Trivia: respuestas no filtradas; anti-trampa; preguntas válidas | ✅ Excelente (IA + doble verificación) |
| Micro/secundarios: funcional vs placeholder marcado | ❌ chat/stories/streaming maquetas con cifras falsas y CTAs engañosas (H-007-05) |
| Anti-abuso (spam, repetición) | ✅ Trivia/Micro idempotentes; misiones con anti-faucet |

---

## A. Hallazgos

### 🟠 H-007-01 (P1) — La tabla de puntuación de fantasy promete acciones que el motor real no calcula

`SCORING_TABLE` (`scoring.ts:18-36`) muestra al usuario "MVP del partido (calculado por IA)", "penalti parado",
"3+ tiros a puerta", "5+ recuperaciones"… pero el **motor en vivo real** (`scoring.live.ts:150-205`) **solo**
computa gol/asistencia/tarjeta/minutos/portería a cero/hat-trick/autogol/penalti fallado. El baremo **anunciado no
coincide con el aplicado** → el usuario puntúa por reglas distintas a las que ve. **Recomendación:** alinear la
tabla con lo que el motor real calcula (o implementar las acciones que faltan).

### 🟠 H-007-02 (P1) — Atribución de eventos por matching de nombres heurístico

`scoring.live.ts:46-60` atribuye goles/asistencias casando **apellido / inicial+apellido** entre el roster y
api-football, **sin id ni dorsal**. Homónimos o apellidos compuestos pueden asignar el evento al jugador
equivocado → puntuación incorrecta. **Recomendación:** mapear por id de api-football (como hace el Match Center),
no por nombre.

### 🟠 H-007-03 (P1) — La documentación de modo carrera describe un juego distinto al implementado

`modo-carrera-documentacion.md` especifica un **manager de plantilla** (elegir 23-26 jugadores, 2 porteros mín.,
6 formaciones, velocidades 1x/2x/4x, 10 logros concretos, 2 carreras simultáneas, partido por el 3er puesto). El
código es un **RPG de progresión de DT** (overall/XP/niveles, árbol de habilidades, reputación, junta, misiones,
racha, lesiones). **Casi ningún feature de la doc existe tal cual.** La doc está completamente desactualizada →
induce a error sobre qué es el producto. **Recomendación:** reescribir la doc para reflejar el juego real.

### 🟠 H-007-04 (P1) — "Temporada en Vivo" del modo carrera no usa resultados reales

`live-season.ts:60-131` toma de `MATCHES` solo el **rival y la hora de saque** reales; el **marcador se simula**
localmente (Poisson), igual que el modo normal. No hay integración api-football. En eliminatorias, los rivales se
eligen **al azar del top del ranking** (no el cuadro real). Contradice la promesa de producto "la carrera avanza
al ritmo de los resultados REALES del Mundial" (`pasedt/entitlement.ts` lo vende así). **Recomendación:** conectar
con resultados reales o ajustar el copy.

### 🟠 H-007-05 (P1) — Módulos secundarios: maquetas con cifras falsas y CTAs engañosas

`chat`, `stories`, `streaming`, `album`, `ligas` son **una sola `page.tsx` cada uno, sin backend propio** (su único
backend es la lista de espera `notify-module`). El problema es la **falta de distinción**:
- `chat`: salas con "online" **hardcodeado** ("1.2k", "8.4k"), mensajes de ejemplo estáticos, CTA "Entrar al chat"
  que no lleva a ningún chat (`chat/page.tsx:26-29,95,139`).
- `stories`: editor que funciona en el navegador pero **no genera/descarga/persiste nada**; CTA "Crear mi primera
  story" (`stories/page.tsx:122,201-203`).
- `streaming`/`album`: creadores/cromos mock; `album` sí muestra badge "coming".

Cifras de actividad inventadas presentadas como reales y CTAs de acción inmediata sobre funciones inexistentes →
**engaño al usuario**. **Recomendación:** marcar claramente "próximamente"/lista de espera en los cinco y retirar
las cifras de actividad falsas. (Se suma al patrón de **BASE_COUNT** inflado, **H-004-P3**, y "2.000+ preguntas",
H-007-08.)

### 🟡 H-007-06 (P2) — El pool de fantasy es real en plantilla pero simulado en stats

Los jugadores son reales (convocatorias 2026), pero `form`, `totalPoints`, `% propiedad`, `startProb`,
lesión/sanción y la ficha analítica de 18 métricas son **RNG determinista** (`players.ts:111-165`,
`player-stats.ts:129-174`); los precios son reales solo donde hay valor Transfermarkt cargado. El **Coach "IA"**
(heurísticas, no LLM) decide capitán/"diamantes" sobre esos números ficticios. **Recomendación:** alimentar form/
ownership con datos reales o etiquetar claramente que son proyecciones.

### 🟡 H-007-07 (P2) — El save de modo carrera no valida `narrative` ni `rivalries`

`store.ts:260,265` normaliza casi todo el estado (clamps de overall/xp/reputación, total recalculado, títulos por
whitelist) **salvo** `narrative` (`slice(0,50)` sin validar cada elemento) y `reputation.rivalries` (se acepta el
array tal cual). Un save manipulado puede inyectar **texto/HTML arbitrario** en la narrativa/rivalidades que luego
se renderiza. No afecta a la economía, sí a la UI. **Recomendación:** validar/sanear esos campos.

### 🟡 H-007-08 (P2) — Trivia: cifra "2.000+ preguntas" inflada

`trivia/page.tsx:397` anuncia "2.000+" por categoría; el banco real arranca con ~24 de fallback y crece ~30/día por
cron. Cifra de marketing no respaldada. (Patrón de transparencia, ver H-007-05.)

### 🟡 H-007-09 (P2) — Modo carrera: grupo y eliminatoria no reflejan el torneo real

La tabla de grupo se construye solo con los **3 rivales del DT** (round-robin de 3), no con el grupo real de 4
(`season.ts:373-406`); la eliminatoria usa **rivales aleatorios** (`live-season.ts:98-128`). Funciona como juego,
pero no refleja el cuadro real.

### 🟡 H-007-10 (P2) — `simulateGameweek` es código muerto

Toda la simulación RNG de `scoring.ts:254-388` **no se invoca desde ninguna UI** (solo se importan `POWER_UPS` y
tipos). Vestigio de una fase previa que genera confusión sobre cómo puntúa el fantasy. **Recomendación:** eliminar
o documentar como histórico.

### Hallazgos P3 (menores)
- Fantasy: `tournament.ts` es proyección por ranking+RNG, no cuadro real; Coach "IA" son heurísticas (marketing).
- Modo carrera: `overall` es monótono creciente (nunca baja); reputación casi-monótona (ordena el ranking);
  abundantes números mágicos inline (`season.ts`); `classics.ts` es solo etiqueta cosmética; figura del partido
  (`motm`) no persiste ni alimenta stats individuales.
- Micro: `goal_in_stoppage` depende de que el feed rellene `extra` (riesgo de borde).
- Trivia: categoría "actualidad" restringida a datos fijos 2026 (bajo riesgo de desactualización, por diseño).

---

## B. Aspectos correctos verificados (no regresar)

- ✅ **Fantasy en vivo** (`scoring.live.ts`): puntúa con eventos **reales** de api-football (vía Match Center);
  bloqueado hasta 11-jun-2026 (`season.ts`); capitán ×2 / vice ×1.5 / francotirador ×3 / tridente / muro / joker /
  auto-subs de banquillo coherentes; pool de jugadores **real** (convocatorias oficiales); reglas (€100M, formación,
  MAX_PER_NATION=3) correctas; ligas funcionales; achievements completos; persistencia localStorage→Supabase con
  pago de Fútcoins idempotente y anti-faucet.
- ✅ **Trivia**: generación IA + **doble verificación a ciegas** (descarta alucinaciones/falsas premisas/ambiguas);
  `validateQuestion` (4 opciones únicas, sin comodines); banco acumulativo persistente que se renueva (cron +
  on-the-fly); puntuación por dificultad/racha/velocidad coherente; opciones barajadas; anti-repetición por usuario.
- ✅ **Micro**: emitidas desde el poller con `LiveSnapshot` real; `resolveMicro`/`settleMicro` deterministas e
  **idempotentes** contra eventos autoritativos; Cadena de Fuego recalculada eslabón a eslabón; IA (Haiku) solo
  para redactar, gated por `MICRO_AI` y con control de coste.
- ✅ **Modo Carrera**: engine/season/match-live (con prórroga y penaltis)/misiones (anti-faucet server-side)/junta/
  prensa/narrativa (con fallback a plantilla)/lesiones/sanciones **implementados**; el store normaliza/clampa casi
  todo el estado salvo narrative/rivalries (H-007-07).

---

## C. Estado de completitud por módulo

| Módulo | Estado | Nota |
|--------|--------|------|
| Trivia | ✅ Implementado y robusto | IA + doble verificación |
| Micro | ✅ Implementado y robusto | Resolución real e idempotente |
| Fantasy | ✅ Implementado (scoring real) | Stats del pool simuladas (H-007-06); seguridad H-001-18/19 |
| Modo Carrera | ✅ Implementado (RPG progresión) | Doc divergente (H-007-03); "En Vivo" simulado (H-007-04) |
| album | 🟡 Placeholder (maqueta + waitlist) | Badge "coming" (honesto) |
| ligas | 🟡 Placeholder (landing marketing) | APIs de ligas existen pero esta landing no las usa |
| stories | 🟡 Parcial (preview client, sin backend) | CTA engañosa |
| streaming | 🟡 Placeholder (maqueta + waitlist) | Disclaimer legal presente |
| chat | 🟡 Placeholder (maqueta + cifras falsas) | CTA "Entrar al chat" sin chat real |

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Alinear `SCORING_TABLE` con el motor real; atribuir eventos por id (no nombre) | H-007-01/02 | P1 |
| 2 | Reescribir la doc de modo carrera; conectar "En Vivo" a resultados reales o ajustar copy | H-007-03/04 | P1 |
| 3 | Marcar claramente "próximamente"/waitlist en los 5 módulos secundarios; quitar cifras falsas | H-007-05 | P1 |
| 4 | Etiquetar/alimentar stats del pool de fantasy; validar narrative/rivalries del save | H-007-06/07 | P2 |
| 5 | Corregir cifras infladas (trivia "2.000+"); eliminar `simulateGameweek` muerto | H-007-08/10 | P2 |

**Criterio de cierre:** baremo de fantasy fiel a la realidad y atribución por id; doc de modo carrera coherente y
"En Vivo" definido; módulos secundarios sin cifras/CTAs engañosas; stats del pool etiquetadas o reales.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-007-01 | P1 | `lib/fantasy/scoring.ts:18-36` vs `scoring.live.ts:150-205` | Abierto |
| H-007-02 | P1 | `lib/fantasy/scoring.live.ts:46-60` (matching por nombre) | Abierto |
| H-007-03 | P1 | `modo-carrera-documentacion.md` vs código | Abierto |
| H-007-04 | P1 | `lib/modo-carrera/live-season.ts:60-131` | Abierto |
| H-007-05 | P1 | `app/app/{chat,stories,streaming}/page.tsx` (maquetas/cifras falsas) | Abierto |
| H-007-06 | P2 | `lib/fantasy/players.ts:111-165`, `player-stats.ts:129-174` | Abierto |
| H-007-07 | P2 | `lib/modo-carrera/store.ts:260,265` (narrative/rivalries) | Abierto |
| H-007-08 | P2 | `app/app/trivia/page.tsx:397` | Abierto |
| H-007-09 | P2 | `lib/modo-carrera/season.ts:373-406`, `live-season.ts:98-128` | Abierto |
| H-007-10 | P2 | `lib/fantasy/scoring.ts:254-388` (código muerto) | Abierto |
| H-007-P3 | P3 | varios (ver sección A) | Abierto |

**Referencias cruzadas:** fantasy `totalPoints`/`validateTeam` cliente (**H-001-18/19**, P0/P1); modo-carrera
leaderboard manipulable (**H-001-21**); trivia anonId ranking (**H-001-22**); micro alimentado por el Match Center
(**Fase 5**); patrón de cifras infladas: BASE_COUNT (**H-004-P3**).
