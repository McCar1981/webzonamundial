# Fase 13 — Contenido país: sedes, selecciones, grupos

**Estado:** 🟥 Hallazgos abiertos (1 P1; sin P0)
**Fecha:** 2026-06-08
**Auditor:** Claude (+ 2 sub-auditorías en paralelo)
**Alcance:** `app/sedes` (+`[slug]`, `_components`), `app/selecciones` (+`[slug]`, `_components`), `app/grupos`
(+`[slug]`), `components/sedes`, `components/grupos`, `data/sedes.ts`, `data/selecciones.ts`,
`data/selecciones-extended.ts`, `data/grupos-editorial.ts`, `lib/biblia.ts`, `data/teams/*.json`,
`lib/player-photos.ts`, fuentes de venues (`content/sedes-2026.json`, `data/stadiums.json`).

---

## Resumen ejecutivo

El módulo **renderiza de forma robusta** (cero P0): las tres rutas dinámicas validan slug con `notFound()`,
`generateStaticParams` cubre el set completo (16 sedes, 48 selecciones, 12 grupos), las imágenes degradan con
fallback y no hay XSS (todo `dangerouslySetInnerHTML` es `JSON.stringify` de JSON-LD curado). Los datos base de
selecciones y la membresía de grupos son **internamente consistentes** entre las tres fuentes.

El problema dominante es de **contenido falso/duplicado**, repitiendo patrones ya vistos en fases anteriores:

1. **Jugadores ficticios y estadísticas aleatorias en páginas de grupo** (H-013-01, P1): para ~34 selecciones sin
   ficha curada, las páginas `/grupos/grupo-*` muestran "jugadores clave" literalmente llamados **"Capitán",
   "Portero titular", "Delantero estrella"** y estadísticas generadas con `Math.random()`. Es contenido **falso
   presentado como real** (mismo patrón que las cifras infladas de fases 4/7/11 y el `Math.random` del fantasy
   simulado).
2. **Sistema de datos a medias** (H-013-02, P2): `loadTeam` (BIBLIA, 48 JSON) **siempre** acierta, así que
   `TeamPageBiblia` renderiza todas las páginas de selección y el componente de fallback `SeleccionClient` es
   **código muerto**; pero `selecciones-extended.ts` **no** está muerto del todo (lo usan las páginas de grupo),
   y es un duplicado **stale** de la BIBLIA. Mismo patrón que Sanity (H-009-02) y `lib/data/creators.ts` (H-011-01).
3. **Fuentes duplicadas que ya divergen** (H-013-03, P2): capacidades de estadio distintas entre `data/sedes.ts` y
   `content/sedes-2026.json`; membresía de grupo triplicada (`selecciones.ts` + `GROUP_META` hardcodeado +
   `grupos-editorial.ts`).
4. **Atribución de fotos de jugadores insuficiente** (H-013-06, P2 legal): se acredita genéricamente "Wikipedia
   Commons" en vez del autor + licencia, contra el requisito CC-BY y el propio comentario del archivo.

> **Verificación pendiente (clave):** todo el **sorteo de grupos**, la asignación de **fases por sede** y los
> **rankings FIFA / nº de mundiales** son editoriales/pre-sorteo y **no son verificables desde el repo**. Si no
> coinciden con el sorteo oficial FIFA (dic-2025), **todas** las páginas de grupo/selección/sede serían
> factualmente incorrectas. Cruza con la verificación pendiente de la Fase 5 (doc oficial de fixture vacío).

### Conteo de hallazgos (nuevos de esta fase)

| Severidad | Nº |
|-----------|----|
| **P0** | 0 |
| **P1** | 1 |
| **P2** | 9 |
| **P3** | (varios) |

### Estado de los criterios de aprobación

| Criterio | Estado |
|----------|--------|
| Todas las sedes/selecciones/grupos renderizan; slugs inválidos manejados | ✅ `notFound()` + SSG completo (16/48/12) |
| Datos (sedes 2026, plantillas, grupos) correctos y actualizados | ⚠️ Consistentes entre sí, pero **sorteo/rankings sin verificar** y **jugadores ficticios** (H-013-01) |
| Imágenes de estadios/jugadores cargan y optimizadas | ⚠️ Cargan con fallback, pero `<img>` crudo (no `next/image`) y atribución de fotos floja (H-013-06) |
| Coherencia con datos en vivo (Fase 5) | ⚠️ Páginas 100% estáticas (build-time); no leen `/api/calendar` ni `/api/match-center` |

---

## A. Hallazgos nuevos

### 🔴 H-013-01 (P1) — Jugadores ficticios y estadísticas aleatorias en páginas de grupo

`data/selecciones-extended.ts` solo tiene ficha curada para ~14 selecciones; para el resto, `buildFallbackExtended`
genera contenido sintético:
- **`estimateStats` usa `Math.random()`** (`selecciones-extended.ts:461`) → estadísticas de mundiales
  no deterministas e inventadas (`pj = mundiales*4 + Math.floor(Math.random()*8)`).
- **`genericPlayers`** devuelve jugadores llamados literalmente `"Capitán"`, `"Portero titular"`,
  `"Delantero estrella"` (`selecciones-extended.ts:504-507`).

Y **se renderizan**: `GrupoSlugClient.tsx:295` llama `getExtendedSeleccion(s.slug)` y `:325` pinta
`jugadoresClave.slice(0,3)`. → En `/grupos/grupo-*`, las ~34 selecciones sin ficha muestran "Capitán / Portero
titular / Delantero estrella" como sus estrellas, con stats aleatorias. **Contenido falso presentado como real.**

**Recomendación:** alimentar `jugadoresClave` desde la BIBLIA (`data/teams/*.json`, que sí tiene plantillas reales)
o no renderizar la sección cuando no haya datos curados. Eliminar `Math.random()`.

### 🟡 H-013-02 (P2) — Sistema de selecciones a medias: `SeleccionClient` muerto; `selecciones-extended` duplicado stale

`selecciones/[slug]/page.tsx:61-72`: como **las 48 selecciones tienen JSON BIBLIA** (`data/teams/`), `loadTeam`
nunca devuelve null para un slug válido → **siempre** se renderiza `TeamPageBiblia` y el bloque de fallback
(`getExtendedSeleccion` + `SeleccionClient`) **nunca se ejecuta**. → `SeleccionClient.tsx` (componente completo) es
**código muerto** en esta ruta.

Matiz importante: `getExtendedSeleccion` **sí** se usa (en `GrupoSlugClient`, H-013-01), pero las 14 fichas curadas
de `selecciones-extended.ts` **duplican** datos que ya viven en la BIBLIA y están **desactualizadas** (p.ej. Messi
`internacionalidades: 187`, CR `217`) → divergencia con la fuente autoritativa. Mismo patrón que H-009-02 (Sanity) y
H-011-01 (creators muerto).

**Recomendación:** eliminar `SeleccionClient` y reconciliar `selecciones-extended` con la BIBLIA (fuente única).

### 🟡 H-013-03 (P2) — Capacidades de estadio divergentes entre dos fuentes

`data/sedes.ts` y `content/sedes-2026.json` (esta última consumida por `lib/content/ediciones.ts` y las páginas de
historia) listan las 16 sedes pero con **capacidades distintas**:
- Filadelfia: `sedes.ts:447` = 69 796 vs `sedes-2026.json:14` = 67 594.
- Seattle/Lumen: 69 000 vs 68 740. · Guadalajara/Akron: 46 609 vs 49 850. · Toronto/BMO: 45 000 vs 45 500.
- Azteca: `sedes-2026.json` usa "Estadio Banorte (Azteca)" (rename temporal); `sedes.ts` solo "Estadio Azteca".

El usuario ve cifras diferentes según la sección (sedes vs historia). **Recomendación:** una sola fuente de
capacidades, verificada contra FIFA.

### 🟡 H-013-04 (P2) — Membresía de grupo triplicada (riesgo de drift)

La composición de cada grupo está hardcodeada en **tres** sitios independientes: `data/selecciones.ts` (fuente de
verdad), `GROUP_META` para SEO (`grupos/[slug]/page.tsx:12-25`) y la prosa de `grupos-editorial.ts`. Hoy son
consistentes (verificado grupo a grupo A–L), pero cualquier cambio de roster exige sincronizar a mano los tres o el
texto SEO se desalinea de los equipos renderizados.

### 🟡 H-013-05 (P2) — Rankings FIFA y nº de mundiales posiblemente desactualizados (verificar)

En `data/selecciones.ts`, varios valores parecen stale (enmarcar como "verificar contra fuente FIFA"):
- **España `rankingFIFA: 8`** (`:62`) — tras la Euro 2024 España estuvo top-3; 8 parece viejo.
- `mundiales` (participaciones): México 17 (`:20`), Bélgica 14 (`:56`), Suiza/Suecia 12 — revisar; y posible
  off-by-one según se cuente o no 2026 (Brasil 22 vs 23).

### 🟡 H-013-06 (P2 — legal/licencia) — Atribución de fotos de jugadores insuficiente

`lib/player-photos.ts:60` fija `credit: "Wikipedia Commons"` aunque el propio comentario (`:11-14`) exige acreditar
al **autor** de la imagen. El endpoint `summary` no devuelve autor/licencia y el código no los guarda. La mayoría de
imágenes Commons son CC-BY/CC-BY-SA y exigen autor + licencia → riesgo de incumplimiento. (Cruza con el tema de
copyright H-008-01.) **Recomendación:** usar la API `imageinfo` (`extmetadata`: Artist, LicenseShortName).

### 🟡 H-013-07 (P2) — Páginas de país no cableadas a datos en vivo

Las páginas de sede/grupo leen partidos **estáticos** (build-time: `@/data/matches`, `@/data/calendario`); ninguna
consulta `/api/calendar` ni `/api/match-center`. Para info pre-torneo es aceptable (los fixtures no cambian), pero no
reflejarán resultados/horas en vivo. (Coherencia con Fase 5: los husos horarios tampoco se aplican aquí.)

### 🟡 H-013-08 (P2) — `dynamicParams` por defecto (true) en las tres rutas dinámicas

No hay `export const dynamicParams = false` en `sedes/[slug]`, `selecciones/[slug]` ni `grupos/[slug]`. Un slug no
pre-generado se intenta renderizar bajo demanda (resuelve bien por el `notFound()` interno, pero no corta en el
edge). Endurecimiento recomendado.

### 🟡 H-013-09 (P2) — `<img>` crudo en vez de `next/image` + mapa de imágenes duplicado

Banderas y fotos usan `<img>` crudo (`flagcdn.com`, `/img/...`) en sedes/grupos/selecciones → sin optimización ni
`width/height` (CLS menor). Además `STADIUM_IMAGES` está **duplicado**: inline en `SedeSlugClient.tsx:14-31` y en
`_components/stadium-images.ts` (idéntico); el cliente usa su copia local → riesgo de drift.

### Hallazgos P3 (menores)
- **Fechas "Actualizado el 21 de mayo de 2026" hardcodeadas** en `GrupoEditorial.tsx:72` y `SedeEditorial.tsx:71`
  (hoy ya es 2026-06-08 → desinformación creciente).
- **Banderas `flagcdn.com` por `<img>` sin fallback** (un ISO malo → icono roto; datos curados, riesgo bajo).
- **Matching de sede por string** en `SedesMatches`/`SedesGrupo` (un rename silencia tarjetas, sin crash).
- **`mexico` palmarés con filas duplicadas** (1970/1986 repetidos) en `selecciones-extended.ts`.
- **Parseo laxo del prefijo de grupo** (`grupo-a` → letra; un slug sin prefijo podría colar bajo URL incorrecta).
- **`toLocaleDateString` sin `timeZone`** en dos componentes cliente (riesgo de mismatch si se SSR-eara; `PartidosSede`
  ya lo resolvió con un gate `mounted`).
- **Coste de fetch a Wikipedia** en `player-photos` (hasta ~5.000 requests en una corrida completa; mitigado por
  `revalidate` 7d y por estar tras ruta admin; el caché KV prometido en el comentario no está implementado).

---

## B. Verificación pendiente (requiere fuente externa FIFA — no derivable del repo)
- **Sorteo oficial de grupos** (dic-2025): membresía A–L. Hoy es editorial/pre-sorteo.
- **Asignación de fases por sede** (`fasesQueAlberga`, `partidosDestacados`, `gruposAsignados` en `sedes.ts`): qué
  estadio alberga semifinales/final (p.ej. MetLife lista Semifinal **y** Final; verificar plan oficial).
- **Rankings FIFA y nº de participaciones** (H-013-05).
- (Cruza con la verificación pendiente de la Fase 5: el doc oficial de fixture del repo está vacío.)

## C. Aspectos correctos verificados (no regresar)
- ✅ **Slug inválido → `notFound()`** en las tres rutas; loaders devuelven null/undefined sin lanzar
  (`biblia.ts` con `existsSync`+try/catch).
- ✅ **SSG completo:** 16 sedes / 48 selecciones (48 JSON BIBLIA) / 12 grupos a–l.
- ✅ **Membresía de grupo consistente** entre `selecciones.ts`, `GROUP_META` y `grupos-editorial.ts` (A–L).
- ✅ **16 sedes oficiales correctas** y bien nombradas (11 USA + 3 MX + 2 CAN) en `data/sedes.ts`.
- ✅ **Sin XSS:** todo `dangerouslySetInnerHTML` inyecta `JSON.stringify` de JSON-LD curado/servidor.
- ✅ **Imágenes degradan** sin romper: sede sin imagen → placeholder SVG; OG de selección cae a OG de marca si
  `loadTeam` falla; foto de jugador ausente → gradiente con dorsal.
- ✅ **Asignación de plazas por confederación** (UEFA 16, CONMEBOL 6+1, CAF 9, AFC 8, CONCACAF 6, OFC 1) coherente
  con la edición 2026.

---

## D. Plan de remediación (orden sugerido)

| # | Acción | Hallazgos | Prioridad |
|---|--------|-----------|-----------|
| 1 | Quitar jugadores/stats ficticias: alimentar `jugadoresClave` desde la BIBLIA o no renderizar sin datos; eliminar `Math.random()` | H-013-01 | P1 |
| 2 | Verificar sorteo/fases/rankings contra fuente FIFA oficial | B, H-013-05 | P1-si-incorrecto |
| 3 | Fuente única de selecciones: eliminar `SeleccionClient` y reconciliar `selecciones-extended` con la BIBLIA | H-013-02 | P2 |
| 4 | Una sola fuente de capacidades de sede | H-013-03 | P2 |
| 5 | Derivar `GROUP_META` de `selecciones.ts` (no duplicar) | H-013-04 | P2 |
| 6 | Atribución de fotos con autor + licencia (API imageinfo) | H-013-06 | P2 |
| 7 | `dynamicParams=false`; `next/image`; deduplicar `STADIUM_IMAGES` | H-013-08, H-013-09 | P2 |
| 8 | Quitar fechas "Actualizado" hardcodeadas; limpiar duplicados de palmarés | P3 | P3 |

**Criterio de cierre:** ninguna página muestra jugadores/stats ficticias; sorteo/sedes/rankings verificados contra
FIFA; una sola fuente por tipo de dato; atribución de imágenes conforme a licencia.

---

## Registro de hallazgos

| ID | Sev | Archivo | Estado |
|----|-----|---------|--------|
| H-013-01 | P1 | `data/selecciones-extended.ts:461,504-507` + `GrupoSlugClient.tsx:295,325` | Abierto |
| H-013-02 | P2 | `selecciones/[slug]/page.tsx:61-72`; `SeleccionClient.tsx` (muerto); `selecciones-extended.ts` | Abierto |
| H-013-03 | P2 | `data/sedes.ts` vs `content/sedes-2026.json` | Abierto |
| H-013-04 | P2 | `grupos/[slug]/page.tsx:12-25` (GROUP_META) | Abierto |
| H-013-05 | P2 | `data/selecciones.ts` (rankings/mundiales) | Abierto (verificar) |
| H-013-06 | P2 (legal) | `lib/player-photos.ts:60` | Abierto |
| H-013-07 | P2 | `app/sedes`, `app/grupos` (datos estáticos) | Abierto |
| H-013-08 | P2 | `sedes/[slug]`, `selecciones/[slug]`, `grupos/[slug]` (dynamicParams) | Abierto |
| H-013-09 | P2 | `<img>` crudo; `SedeSlugClient.tsx:14-31` vs `stadium-images.ts` | Abierto |
| H-013-P3 | P3 | fechas hardcodeadas; matching por string; palmarés duplicado; etc. | Abierto |

**Referencias cruzadas:** fuentes muertas/duplicadas (**H-009-02** Sanity, **H-011-01** creators); contenido
ficticio presentado como real (**H-007-01/05**, fantasy `Math.random`); copyright/atribución (**H-008-01**); sorteo y
fixture oficiales sin verificar (**Fase 5**, doc vacío); husos horarios (**H-005-01**).
