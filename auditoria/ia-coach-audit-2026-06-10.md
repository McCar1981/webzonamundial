# Auditoría del módulo IA Coach — 2026-06-10

**Alcance:** 5 endpoints (`analyze`, `coach`, `live`, `debate`, `oracle`), 5 wrappers Anthropic, capa de datos (forma/H2H/lesiones/odds/sim), 4 paneles de UI + widget, y **nivel de respuesta de la IA** (probado con llamadas reales a la API).
**Método:** 3 agentes de auditoría (backend / lógica-datos / frontend) + pruebas empíricas del experto con Claude real.
**Veredicto en una línea:** el **motor (Claude Sonnet 4.5 + extended thinking) es de nivel experto absoluto**, pero el **combustible (datos) está roto**: ~40 de 48 selecciones reciben contexto vacío o de OTRO equipo, así que el usuario medio no ve al experto.

---

## 0. Prueba empírica del "experto" (llamadas reales)

| Prueba | Contexto dado | Resultado | Lectura |
|---|---|---|---|
| **A. Analista con datos ricos** (ESP-FRA) | forma, H2H, lesiones, odds, plantillas | **Élite.** Citó 12-3 en goles, H2H 2-1 (2024), duelo táctico control vs transición, Mbappé como watchPlayer, probabilidades calibradas con el mercado | El techo es altísimo: experto real |
| **B. Analista con datos pobres** (CUW-UZB, "sin datos") | solo ranking + DT + estilo | Honesto pero flojo: confidence baja, declara `missingData`, razona solo con ranking | **Este es el caso REAL de ~40 selecciones.** No es culpa del modelo; es que no recibe datos |
| **C. Debate sin ningún dato** (Marruecos campeón) | nada futbolístico (solo el nombre) | Brillante en estilo PERO **inventó hechos como ciertos** con `confidence: alta`: "han perdido a Bounou, Mazraoui arrastra lesiones, Ziyech…" | Riesgo reputacional: el Retador improvisa con memoria del cutoff y aplomo |

**Conclusión de calidad:** no hay que tocar el modelo ni los prompts (están muy bien escritos). Hay que **arreglar la tubería de datos**. Con datos, el experto es de primer nivel; sin datos, o se queda corto (B) o inventa (C).

---

## 1. CRÍTICOS (P0) — arreglar antes de seguir

| ID | Área | Problema | Evidencia | Impacto |
|---|---|---|---|---|
| **P0-1** | Datos | **Mapeo `API_FOOTBALL_TEAM_IDS` corrupto: 7 IDs duplicados.** Varias selecciones reciben la forma reciente, H2H y odds de OTRO equipo. La "forma de Corea del Sur" son los partidos de Alemania; Austria→México; Suecia→España; Noruega→Japón; Arabia→Argentina; Costa de Marfil→Portugal; Paraguay/Colombia comparten ID | `team-form.ts:39-64` | El experto presenta datos de otro equipo como reales. Peor que no tener datos |
| **P0-2** | Datos | **El cron de forma solo refresca ~8 de 48 selecciones por día, siempre las mismas** (grupos A-B). Sleep 6.500ms × presupuesto 55s, bucle sin offset. ~40 selecciones nunca tienen forma reciente | `update-team-form/route.ts:69,71,101`; TTL 36h `team-form.ts:26` | La mayoría de partidos se analizan con "forma reciente: sin datos" |
| **P0-3** | Backend | **`debate` no tiene rate-limit ni cuota**, y cuenta los turnos sobre el historial que envía el cliente → un usuario puede hacer llamadas ilimitadas a Claude y **agotar la única API key compartida** (tumba los 5 modos) | `debate/route.ts:38-72` | Camino directo para quemar la key / facturar de más |
| **P0-4** | Frontend | **El Coach analiza una quiniela obsoleta.** `useBracketStore` no es global ni re-hidrata: el widget vive en el layout raíz y conserva la foto de la carga inicial. Usuario hace 48 picks → abre widget → "Pronostica al menos 8 partidos (0/8)" y Oráculo/Debate mandan `champion: null` | `useBracketStore.ts:75-87`; `IACoachWidget.tsx:47` | Incumple la promesa central ("el coach conoce tu quiniela") |
| **P0-5** | Config (verificar) | **`API_SPORTS_KEY` en Vercel.** En LOCAL la key es válida (plan Ultra activo, 3.335/75.000 hoy). Pero la memoria del proyecto dice que en Vercel esa var tiene una Stripe key por error. Si sigue así, **en producción TODA la cadena api-football falla en silencio** y los heartbeats verdes lo ocultan (P2-13) | memoria `project_api_football_plan`; `update-team-form/route.ts:104` | Si está rota, convierte P0-1/P0-2 en irrelevantes: no llega NINGÚN dato en prod |

---

## 2. ALTOS (P1)

| ID | Área | Problema | Evidencia |
|---|---|---|---|
| P1-1 | Datos | Chequia: slug `chequia` pero archivo `republica-checa.json` → "(sin datos profundos)" en todos los modos | `teams.ts:32` |
| P1-2 | Datos | Sudáfrica `iso3:"RSA"` vs bracket `ZAF` → rank default **75 inventado** en la sim del Oráculo | `oracle-sim.ts:47,231` vs `sudafrica.json:4` |
| P1-3 | Datos | **El récord H2H no dice quién ganó**: cuenta por "local del fixture" que cambia partido a partido; el propio código admite el bug | `team-h2h.ts:124-150` |
| P1-4 | Datos | Orden de partidos de forma no garantizado: confía en que la API venga ordenada; si no, "últimos 5" son los más antiguos | `team-form.ts:80,161-189` |
| P1-5 | Datos | Las lesiones se congelan durante el Mundial: solo se leen ligas de club (temporada acaba en mayo); una lesión en el torneo nunca entra | `team-injuries.ts:43-58` |
| P1-6 | Backend/Datos | **Live: prompt injection + cache poisoning.** El estado en vivo viene 100% del cliente sin verificar; el hash de caché no incluye las stats → un usuario puede inyectar y envenenar el análisis servido a otros | `live-context.ts:224-261`; `live/route.ts:74,88` |
| P1-7 | Backend | Gates anti-billing **fail-open**: si KV falla, rate-limit y cuota devuelven "permitido" → la key queda sin tope | `auth-helpers.ts:60,74`; `pro/quota.ts:59` |
| P1-8 | Frontend | Pérdida total de conversación (debate premium, oráculo) al cambiar de modo o cerrar el widget (estado local desmontado) | `IACoachWidget.tsx:219-221` |
| P1-9 | Frontend | Fetch sin cleanup al desmontar: **quema la consulta diaria Free en silencio** y descarta la respuesta | los 4 paneles; `coach/route.ts:105` |
| P1-10 | Frontend | `pro_required` (402) no manejado en el seguimiento del Oráculo → bucle de "inténtalo de nuevo" sin paywall | `OraclePanel.tsx:140-145` |
| P1-11 | Frontend | 401/429 sin mapear → el tráfico anónimo del sitio editorial pulsa "Consultar" y recibe un error que nunca funciona, sin CTA de login | `BracketCoachPanel`, `OraclePanel`, `MatchAIAnalysis` |

---

## 3. MEDIOS (P2) — selección

| ID | Problema | Evidencia |
|---|---|---|
| P2-1 | **Fun-facts FALSOS y autocontradictorios** mostrados al usuario en cada carga (p.ej. "Brasil-Italia 94 única final por penaltis" contradice 2 facts del mismo array; "Azteca albergará su 3ª final"; "Maradona goleador 86") | `fun-facts.ts` |
| P2-2 | **El Retador (Debate) no recibe ningún dato real** → todo sale del cutoff (Prueba C) | `debate-client.ts:42-85` |
| P2-3 | **El Entrenador juzga los cruces R32/R16 a ciegas**: solo carga perfiles de campeón+subcampeón+semis, pero el prompt le exige evaluar todo el cuadro | `coach-context.ts:185` |
| P2-4 | Emparejamiento R32 de la sim sesgado: grupos A-D siempre cruzan terceros, E-L entre sí; no es el cuadro FIFA real → infla/deprime probabilidades | `oracle-sim.ts:140-206` |
| P2-5 | SEED fija → la simulación Monte Carlo es idéntica para siempre; el TTL de 24h "refresca" algo que no cambia | `oracle-sim.ts:24`; `oracle/route.ts:40` |
| P2-6 | Modelo de goles irreal (empates 0-0/1-1/2-2 equiprobables; KO sin penaltis) → favoritos avanzan de más | `oracle-sim.ts:158-251` |
| P2-7 | "Lesiones: ninguna confirmada" cuando en realidad es "sin cobertura" (jugadores fuera de las 12 ligas) | `team-injuries.ts:333` |
| P2-8 | Matching de lesiones por nombre sin validar club/nacionalidad → homónimos | `team-injuries.ts:269-302` |
| P2-9 | Heartbeat de cron en verde aunque fallen los 48 equipos → oculta el fallo de datos | `update-team-form/route.ts:104` |
| P2-10 | Payload sin tope máximo en `coach`/`live` → DoS de CPU en la función serverless | `coach/route.ts:64`; `live-context.ts:189` |
| P2-11 | TOCTOU en el rate-limit (get→set no atómico) → ráfagas concurrentes lo superan | `auth-helpers.ts:67-73` |
| P2-12 | Textareas sin `maxLength` vs límite del server (600/1200) → truncado silencioso de la pregunta | `OraclePanel`, `DebatePanel` |
| P2-13 | Odds: resuelve fixture (hasta 3 llamadas) antes de mirar caché; miss no cacheado → quema api-football | `team-odds.ts:194-215` |

---

## 4. Arquitectura / deuda (P3 destacados)

- **Modelo hardcodeado en 5 archivos** (`claude-sonnet-4-5-20250929`), ignora `ANTHROPIC_MODEL`; comentarios incoherentes (uno dice "Sonnet 4.6", otro "4.5"). Cambiar de modelo = editar 5 sitios. `anthropic-client.ts:5,15` y 4 más.
- **Wrapper Anthropic duplicado x5** (`getClient`, `extractJSON`, boilerplate de parseo). Extraer a un `callClaude()` común.
- Sin `timeout`/`maxRetries` explícitos en `messages.create` → una llamada lenta consume la función y reintenta (más coste).
- Paleta de colores duplicada e inconsistente en 4 paneles + dos sistemas de estilo (inline vs CSS Modules).
- Accesibilidad del widget: sin `role="dialog"`, sin focus-trap, sin Escape, tabs sin `aria-pressed`.
- Rankings FIFA con posiciones duplicadas en los JSON (ESP=2 y FRA=2, etc.); numeración rota en `system-prompt.ts:33-43` (1,2,3,4,5,**9**,6,7,8).

---

## 5. Qué datos recibe la IA por modo (y qué le falta)

| Modo | Datos reales que recibe | Lo que le falta para "experto absoluto" |
|---|---|---|
| **Analyze** | fase/sede/fecha, ranking FIFA, DT, estrella, estilo, fortalezas/debilidades, plantilla probable, historia mundialista, forma KV*, lesiones KV*, H2H*, odds | alineación titular real, sanciones por tarjetas, xG real, goleadores actuales, clima/altitud, árbitro (*hoy rotos por P0-1/P0-2) |
| **Live** | marcador, stats (sin verificar), eventos, ranking, formación prevista, banquillo derivado | XI real del feed, banquillo neto de cambios, pases, contexto de clasificación; no recibe forma/lesiones/H2H/odds |
| **Coach** | tu bracket completo + perfiles de campeón/subcampeón/semis | ranking del resto del cuadro (juzga R32/R16 a ciegas), probabilidades del Oráculo, forma/lesiones |
| **Oracle** | tabla top-16 de la sim (solo ranking FIFA, sesgada y congelada) | forma, lesiones, odds de mercado; P(octavos) ni se inyecta |
| **Debate** | **solo el nombre del campeón + nombre del usuario** | **todo** — cero datos futbolísticos (Prueba C lo demuestra) |

---

## 6. Plan de acción recomendado (orden de impacto)

1. **Verificar `API_SPORTS_KEY` en Vercel** (P0-5). 5 min. Si está mal, nada de lo demás importa en prod.
2. **Arreglar el mapeo de IDs + assert de unicidad/cobertura** (P0-1) y **el presupuesto del cron** (P0-2, bajar sleep a ~200ms con plan Ultra). Esto pasa el contexto de "vacío/falso" a "real" para 40+ selecciones — la mayor palanca de calidad.
3. **Poner freno a `debate`** (P0-3): rate-limit + cuota + contador server-side.
4. **Store de bracket compartido** (P0-4): el Coach debe ver la quiniela actual.
5. Corregir H2H (P1-3), Chequia (P1-1), Sudáfrica (P1-2), y mapear 401/402 en el front (P1-10/11).
6. **Inyectar datos baratos al Debate y al Coach** (P2-2, P2-3): ranking + forma KV del campeón y rivales (~300 tokens) — sube el nivel de "experto" sin tocar el modelo.
7. **Fact-check de fun-facts** (P2-1): borrar al menos los autocontradictorios (son texto visible).

**Nota:** ninguno de estos arreglos requiere tocar el modelo ni los system prompts. El experto ya es de primer nivel; el trabajo es darle de comer.
