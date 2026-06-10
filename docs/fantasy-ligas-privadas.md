# Módulo de Ligas Privadas (Fantasy)

Ligas cerradas donde managers **reales** compiten entre sí mediante un **código de
invitación de 6 caracteres**. Es una de las tres superficies de clasificación del
Fantasy, junto a **Global** (🌍 torneo completo) y **Jornada** (📅 gameweek actual).
Las privadas se identifican con 🔒.

> Estado: **listo para producción** (Fase 1, backend real en Supabase). Sin app
> nativa: vive dentro de la webapp en `/app/fantasy/jugar`.

---

## Arquitectura

| Capa | Archivo | Rol |
|------|---------|-----|
| UI | `src/app/app/fantasy/jugar/LeaguesView.tsx` | Pestañas, panel crear/unirse, gestión de dueño, toggle Total/Jornada |
| Cliente HTTP | `src/app/app/fantasy/jugar/api.ts` | Envuelve `/api/fantasy/*`; degrada a `[]`/`null` sin sesión |
| API REST | `src/app/api/fantasy/leagues/route.ts` | Listar / crear / unirse |
| API REST | `src/app/api/fantasy/leagues/[id]/route.ts` | Clasificación, renombrar, salir/borrar/expulsar |
| Lógica server-only | `src/lib/fantasy/leagues.server.ts` | Toda la lógica con `adminClient` (service role) |
| Código de invitación | `src/lib/predictions/gamification.ts` → `leagueCode()` | Genera el código de 6 chars (alfabeto sin ambiguos) |

**Por qué service role:** la clasificación y la gestión cruzan a varios usuarios,
que RLS no permite leer entre sí. Igual que las ligas de Predicciones, todo el
cómputo se hace server-side con el cliente admin que bypassa RLS.

---

## Modelo de datos (Supabase — migración `2026-09-fantasy.sql`)

```
fantasy_leagues          id, name (≤60), code (único, ≤10), owner_id, created_at
fantasy_league_members   league_id, user_id, joined_at   (PK compuesta)
fantasy_teams            user_id, team_name, total_points, gameweek, state(JSONB)
fantasy_gameweek_scores  user_id, gameweek, points        (PK user_id+gameweek)
```

- La **clasificación total** ordena por `fantasy_teams.total_points`.
- La **clasificación por jornada** ordena por `fantasy_gameweek_scores.points` de
  esa gameweek (mismos miembros).
- **No se requiere migración nueva** para las mejoras de gestión: todo se enforce
  en código con el service role.

---

## API

### `GET /api/fantasy/leagues`
Ligas del usuario. → `{ leagues: FantasyLeague[] }` con `is_owner` por liga.

### `POST /api/fantasy/leagues`
- `{ name }` → crea liga (el creador queda inscrito y es dueño). `201`.
- `{ code }` → se une por código. Idempotente si ya es miembro.

Errores (`{ ok:false, error }`):

| error | HTTP | Significado |
|-------|------|-------------|
| `bad_name` | 400 | Nombre vacío tras normalizar |
| `too_many_leagues` | 409 | Superó el tope de creadas/unidas |
| `invalid_code` | 400 | El código no tiene 6 chars válidos |
| `league_not_found` | 404 | No existe liga con ese código |
| `league_full` | 409 | Liga al máximo de miembros |

### `GET /api/fantasy/leagues/{id}?gw=N`
Clasificación (solo miembros, `403` si no). `gw` opcional → ranking de esa jornada.
→ `{ standings, is_owner, gameweek }`.

### `PATCH /api/fantasy/leagues/{id}`  `{ name }`
Renombra. **Solo dueño** (`403` si no).

### `DELETE /api/fantasy/leagues/{id}`
- Sin body: **miembro** → sale; **dueño** → borra la liga entera (cascade).
- `{ memberId }`: **dueño** expulsa a ese miembro.

→ `{ ok:true, action: "left" | "deleted" | "kicked" }`.

---

## Reglas de negocio

1. **Crear**: genera código único (hasta 5 reintentos anticolisión); el creador
   queda inscrito automáticamente como dueño.
2. **Unirse**: por código normalizado a mayúsculas; idempotente (no duplica ni
   consume cupo si ya eres miembro).
3. **Gestión del dueño** (👑): renombrar, expulsar miembros, borrar la liga. El
   dueño no puede expulsarse a sí mismo: para irse, borra la liga.
4. **Autorización**: solo miembros leen la clasificación; solo el dueño gestiona.
5. **Invitados (sin sesión)**: ven una previsualización **simulada con bots** y un
   CTA de login. Nunca compiten de verdad hasta iniciar sesión.

### Topes anti-abuso (`leagues.server.ts`)

| Constante | Valor | Motivo |
|-----------|-------|--------|
| `MAX_MEMBERS_PER_LEAGUE` | 100 | Acota relleno/spam y mantiene las consultas baratas |
| `MAX_LEAGUES_OWNED` | 20 | Evita creación masiva de ligas por un usuario |
| `MAX_LEAGUES_JOINED` | 50 | Evita unirse a un número absurdo de ligas |

---

## Decisión: SIN premios en Fútcoins por ganar liga privada

Los puntos del Fantasy son **cliente-autoritativos** (ver
`src/lib/economy/earn.ts` y la economía unificada). Pagar Fútcoins al ganador de
una liga privada abriría un vector de farmeo: crear una liga con cuentas alt,
"ganarla" y cobrar. Hasta endurecer el anti-cheat (recomputar puntos server-side),
**las ligas privadas no abonan economía**: solo dan estatus/ranking social.

Trabajo futuro cuando el scoring sea server-autoritativo: premio acotado al ganador
de una liga con N miembros reales mínimos, vía `grantCoins(..., module: "fantasy")`.

---

## Pruebas manuales recomendadas antes de producción

- [ ] Crear liga → aparece pestaña 🔒 con código; soy 👑 dueño.
- [ ] Unirse desde otra cuenta con el código → cuenta de miembros sube.
- [ ] Toggle **Total / Jornada** cambia el orden de la tabla.
- [ ] Dueño renombra → el nombre cambia para todos.
- [ ] Dueño expulsa a un miembro → desaparece de la tabla.
- [ ] Miembro pulsa "Salir" → deja la liga; dueño pulsa "Borrar liga" → desaparece para todos.
- [ ] Código inválido / inexistente → mensaje claro, sin romper la vista.
- [ ] Invitado (sesión cerrada) → ve preview simulada + CTA login.

---

## Auditoría 2026-06-10 — correcciones aplicadas

Repaso completo de arquitectura, lógica, backend y frontend. Cambios:

**Backend / datos**
- **RLS recursiva (latente):** la policy de lectura de `fantasy_league_members` se
  auto-referenciaba → `infinite recursion detected in policy` si alguna lectura
  usaba el cliente autenticado (hoy todo va por service role, estaba dormido).
  Arreglado con la función `SECURITY DEFINER public.is_fantasy_league_member(...)`
  que rompe la recursión (`scripts/sql/2026-22-fantasy-leagues-rls-fix.sql`).
- **TOCTOU en los topes:** `createLeague`/`joinLeague` reverifican el aforo TRAS
  insertar y el que sobra retira su propia fila/liga (el chequeo previo solo no
  era atómico).
- **N+1:** `myLeagues` cuenta miembros de todas las ligas en una sola query.
- **Rate-limit:** el `POST /api/fantasy/leagues` limita a 20 acciones/min por
  usuario (frena enumeración de códigos y spam). Degrada sin KV.
- **`?gw` inválido:** antes `?gw=abc` caía a jornada 1 en silencio; ahora valida
  1–8 y devuelve 400.

**Frontend / UX**
- **Crear = Pro señalizado:** badge `PRO` en los accesos de "Crear liga" (preview
  de invitado y panel real); a un Free el botón abre el paywall directo en vez de
  dejarle chocar con el 403. *Unirse sigue siendo gratis.*
- **Errores en rojo:** los mensajes distinguen éxito (verde) de error (rojo);
  antes todo salía en verde de éxito.
- **Anti doble-clic:** los botones Crear/Unirse se deshabilitan mientras procesan
  (evita crear ligas duplicadas).
- **Te resaltas a ti mismo** en la clasificación de la liga privada ("(tú)" +
  fila dorada), igual que en el ranking global.
- **Jornada final:** corregido el off-by-one que mostraba la jornada 7 tras
  confirmar la 8.

**Diferido por decisión de producto (no es bug):** el recompute server-side de los
puntos por jornada (hoy el cliente los calcula, con clamp a 200). Mientras siga
así, las ligas privadas **no** abonan Fútcoins (anti-farmeo).
> Actualización 2026-06-10: el PR #25 hizo el scoring server-authoritative; el
> premio en Fútcoins por liga privada queda como decisión de producto pendiente.

---

## Ligas DRAFT — jugadores exclusivos (2026-06-10)

**Regla:** dentro de una liga Draft, si un manager tiene a un jugador, **ningún
otro miembro puede tenerlo**. El primero que lo ficha (guarda su equipo con él)
se lo queda. Al venderlo, salir de la liga o ser expulsado, queda libre.

**Cómo funciona (diseño):**
- El equipo del usuario sigue siendo **único y global** (`fantasy_teams`). La
  exclusividad vive en `fantasy_league_player_claims`: una fila por
  `(league_id, player_id)` con su dueño. La **PK compuesta garantiza la
  exclusividad en la base de datos** (INSERT … ON CONFLICT DO NOTHING =
  primero-que-llega; un claim jamás se "roba" con update).
- Como un mismo equipo global no puede obedecer las reglas de dos ligas Draft a
  la vez, **cada usuario está como mucho en UNA liga Draft** (`draft_limit`).
- Se elige al **crear la liga** (toggle "Draft: jugadores exclusivos"); no se
  puede cambiar después.
- **Crear** la liga reclama la plantilla actual del dueño. **Unirse** reclama la
  del que llega; sus jugadores que ya tenían dueño quedan "en conflicto": puede
  entrar y competir, pero **no puede guardar cambios de alineación** hasta
  venderlos (el aviso lista cuáles y de quién son).
- **Enforcement servidor** en `PUT /api/fantasy/team`: si la alineación cambió y
  contiene jugadores de otro miembro → `409 draft_conflict` (no se guarda). Tras
  cada guardado válido se sincronizan los claims (libera vendidos, reclama
  nuevos). Los guardados sin cambio de alineación (confirmar jornada, metadatos)
  pasan siempre.
- **UX cliente:** el Mercado muestra los pillados bloqueados ("🔒 De {manager}
  (Draft)"), el picker rechaza ficharlos con aviso, y si el autoguardado es
  rechazado el toast explica el porqué (sin esto sería un fallo silencioso).
  Los pillados se refrescan al entrar a Mercado/Ligas.
- El **auto-draft IA** no consulta los claims: puede proponer jugadores pillados
  y el guardado los rechazará con aviso. Conocido; mejora futura.

**Endpoints:**
- `POST /api/fantasy/leagues` `{name, draft: true}` → crea liga Draft (Pro).
  Errores: `draft_limit` (409) además de los existentes.
- `GET /api/fantasy/leagues/claims` → jugadores pillados por OTROS en mi liga
  Draft (`{league_id, league_name, taken:[{player_id, held_by}]}`).
- `PUT /api/fantasy/team` → `409 {error:"draft_conflict", conflicts:[…]}` si la
  alineación incluye jugadores ajenos; respuesta OK incluye `draftWarnings`
  (carreras perdidas de guardado simultáneo, rarísimo y auto-curativo).

**SQL:** `scripts/sql/2026-24-fantasy-draft-leagues.sql` (requiere 2026-09 y
2026-22 aplicadas). Idempotente. RLS: lectura solo miembros (vía
`is_fantasy_league_member`), escritura solo service role.
