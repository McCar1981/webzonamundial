# Changelog — Pull desde origin/main

> **Fecha:** 2026-06-09  
> **Rango:** `fee1d5d` → `55d11bf`  
> **Commits:** 42  
> **Archivos modificados:** 102  
> **Autor:** McCar1981

---

## 📋 Resumen por área

| Área | Commits | Tipo principal |
|-------|---------|---------------|
| 🎮 **Modo Carrera** | 17 | Features + fixes |
| 🍺 **Bares / Porra Digital** | 9 | Features + rediseño |
| 💰 **Economía / Rankings** | 3 | Ledger + rankings |
| 🏠 **App Hub** | 2 | Links + top-5 |
| 🔐 **Auth / Cuenta / Nav** | 6 | Fixes + UX |
| 🎨 **Assets / Estilo** | 3 | Optimización PNG→WebP |
| 📝 **Docs** | 2 | Storyboard + assets |

---

## 📝 Commits completos (orden cronológico, del más antiguo al más reciente)

| # | Hash | Fecha | Mensaje |
|---|------|-------|---------|
| 1 | `caebdd9` | 2026-06-08 | feat(modo-carrera): formación + once titular con impacto real |
| 2 | `eb1240b` | 2026-06-08 | feat(modo-carrera): partido más pausado (no se resuelve en 4 segundos) |
| 3 | `4ceebd5` | 2026-06-08 | feat(modo-carrera): segunda decisión táctica al minuto 75 |
| 4 | `25a8076` | 2026-06-08 | feat(modo-carrera): expulsiones (tarjeta roja) en partido |
| 5 | `9cb3e5b` | 2026-06-08 | feat(modo-carrera): balón parado a favor (penalti/falta) con decisión |
| 6 | `609ccba` | 2026-06-08 | feat(modo-carrera): amistosos de preparación + fase de clasificación |
| 7 | `a3d4ed3` | 2026-06-08 | feat(modo-carrera): vida de vestuario entre partidos |
| 8 | `4b2d64f` | 2026-06-08 | feat(modo-carrera): hitos de carrera de largo plazo |
| 9 | `9c5b3bf` | 2026-06-08 | docs(modo-carrera): storyboard y prompts de assets del contenido nuevo |
| 10 | `58a00c3` | 2026-06-08 | feat(nav): añadir "Porra Digital" al menú y footer para comercializarla |
| 11 | `2c186cc` | 2026-06-08 | feat(bares): rediseño comercial premium de la landing de Porra Digital |
| 12 | `0d4854d` | 2026-06-08 | fix(bares): copy honesto sin prometer asistencia ni ventas |
| 13 | `580d6d4` | 2026-06-08 | feat(modo-carrera): cambios y cambio de sistema en vivo durante el partido |
| 14 | `c52c418` | 2026-06-08 | style(app/hero): arte de slides de texto más visible y centrado en escritorio |
| 15 | `8cbc64a` | 2026-06-08 | feat(modo-carrera): valorar calidad/idoneidad del cambio y adaptar al rival |
| 16 | `2e36661` | 2026-06-08 | feat(bares): imágenes editoriales con fallback y estilo más respirable |
| 17 | `20258ca` | 2026-06-08 | style(app/hero): sube el encuadre del arte de texto en escritorio (42%→62%) |
| 18 | `5b021f0` | 2026-06-08 | feat(bares): inscripción opcional gestionada por el bar (Opción B) |
| 19 | `f8085b7` | 2026-06-08 | fix(app): la sesión se quedaba en "Modo invitado" al volver a la app |
| 20 | `146f747` | 2026-06-08 | fix(nav): oculta el CTA "Abrir la app" si ya hay sesión |
| 21 | `b573d5c` | 2026-06-08 | feat(cuenta): botón "Cerrar sesión" al fondo del menú de la cuenta |
| 22 | `fe83fa3` | 2026-06-08 | feat(nav): "Cerrar sesión" visible arriba del menú hamburguesa |
| 23 | `f52e7ab` | 2026-06-08 | revert(nav): quita el "Cerrar sesión" duplicado de arriba del menú |
| 24 | `f2d5e64` | 2026-06-08 | feat(bares): alta ligera en la porra del bar sin onboarding largo |
| 25 | `69f76e3` | 2026-06-08 | fix(modo-carrera): ocultar barra inferior y dock en el juego (bloqueaban scroll) |
| 26 | `6fa5f6c` | 2026-06-08 | fix(modo-carrera): excluir lesionados y sancionados del partido |
| 27 | `c443d13` | 2026-06-08 | fix(modo-carrera): ocultar rivales del Mundial hasta clasificar |
| 28 | `207e60f` | 2026-06-08 | feat(bares): email de bienvenida con el BAR como protagonista |
| 29 | `7b82bca` | 2026-06-08 | feat(modo-carrera): modalidad de concentración y entrenamiento entre partidos |
| 30 | `d14a899` | 2026-06-08 | feat(modo-carrera): fondo opcional del modal de concentración + assets |
| 31 | `7548156` | 2026-06-08 | docs(modo-carrera): assets nuevos de concentración/entrenamiento |
| 32 | `646c065` | 2026-06-08 | feat(modo-carrera): cablear assets de concentración con fallback a SVG |
| 33 | `997401d` | 2026-06-08 | fix(modo-carrera): la normalización ya no corrompe saves en fases previas ni borra alineación/frescura |
| 34 | `7abdf67` | 2026-06-08 | feat(bares): añadir imágenes editoriales de la landing Porra Digital |
| 35 | `f90c6f2` | 2026-06-08 | feat(bar-dashboard): kit incluido en el plan + póster impreso opcional |
| 36 | `03a6b22` | 2026-06-08 | feat(app-hub): cards link directly to the game/module |
| 37 | `e925a5a` | 2026-06-08 | fix(economy): rutar picks en vivo por grantCoins (atómico) |
| 38 | `ba36964` | 2026-06-08 | feat(economy): ledger de Fútcoins + rankings por módulo |
| 39 | `b8cdda0` | 2026-06-08 | fix(modo-carrera): fondo de concentración vive en su carpeta de tema, no en partido/ |
| 40 | `457ce1d` | 2026-06-08 | feat(modo-carrera): assets de concentración + rival incógnito (optimizados) |
| 41 | `8cbc64a` | 2026-06-08 | feat(modo-carrera): valorar calidad/idoneidad del cambio y adaptar al rival |
| 42 | `55d11bf` | 2026-06-08 | feat(ranking): top-5 global en vivo en el hub + pestañas por módulo |

---

## 🎮 Modo Carrera (17 commits)

### Nuevas mecánicas de juego
- **Formación + once titular** con impacto real en el resultado (`LineupEditor.tsx`, `lineup.ts`)
- **Segunda decisión táctica** al minuto 75 (`MatchLive.tsx`)
- **Cambios y cambio de sistema** en vivo durante el partido (`match-live.ts`)
- **Balón parado a favor** (penalti/falta) con decisión del jugador
- **Expulsiones** (tarjeta roja) con impacto en el partido
- **Partido más pausado** — ya no se resuelve en 4 segundos

### Ciclo entre partidos
- **Concentración y entrenamiento** entre partidos (`Concentracion.tsx`, `concentracion.ts`)
  - Sesiones: físico, táctico, balón parado, análisis, recuperación
  - Contratiempos: lesión
  - Fondo opcional del modal + assets
- **Vida de vestuario** entre partidos (`vestuario.ts`)
- **Amistosos de preparación** + fase de clasificación al Mundial (`SeasonView.tsx`)

### Progresión y carrera
- **Hitos de carrera** de largo plazo (`board.ts`)
- **Rival incógnito** (assets optimizados)
- Ocultar rivales del Mundial hasta clasificar
- Valorar calidad/idoneidad del cambio y adaptar al rival

### Fixes
- Normalización ya no corrompe saves en fases previas ni borra alineación/frescura
- Excluir lesionados y sancionados del partido
- Ocultar barra inferior y dock en el juego (bloqueaban scroll)
- Fondo de concentración en su carpeta de tema

### Nuevos archivos
```
src/app/app/modo-carrera/jugar/Concentracion.tsx      [+407 líneas]
src/app/app/modo-carrera/jugar/LineupEditor.tsx       [+291 líneas]
src/lib/modo-carrera/concentracion.ts                 [+223 líneas]
src/lib/modo-carrera/lineup.ts                        [+196 líneas]
src/lib/modo-carrera/vestuario.ts                     [+206 líneas]
public/img/modo-carrera/concentracion/                [7 imágenes .webp]
public/img/modo-carrera/rival-incognito.webp
ASSETS_MODO_CARRERA.md
STORYBOARD_MODO_CARRERA.md
```

### Archivos modificados
```
src/app/app/modo-carrera/jugar/CareerGame.tsx
src/app/app/modo-carrera/jugar/MatchLive.tsx           [+715/-331 líneas]
src/app/app/modo-carrera/jugar/SeasonView.tsx
src/lib/modo-carrera/board.ts
src/lib/modo-carrera/constants.ts
src/lib/modo-carrera/engine.ts
src/lib/modo-carrera/live-season.ts
src/lib/modo-carrera/match-live.ts
src/lib/modo-carrera/press.ts
src/lib/modo-carrera/season.ts
src/lib/modo-carrera/store.server.ts
src/lib/modo-carrera/store.ts
src/lib/modo-carrera/types.ts
src/lib/modo-carrera/ASSETS.md
src/lib/modo-carrera/ASSET_PROMPTS.md
```

---

## 🍺 Bares / Porra Digital (9 commits)

### Rediseño comercial
- **Landing premium** de Porra Digital rediseñada (`src/app/bares/page.tsx`)
- Copy honesto sin prometer asistencia ni ventas
- **Imágenes editoriales** con fallback y estilo respirable
- 3 nuevas imágenes editoriales: `hero-porra-bar`, `bar-ranking-tv`, `cta-final-bar`
- **"Porra Digital"** añadida al menú y footer

### Inscripción y onboarding
- **Inscripción opcional** gestionada por el bar (Opción B)
  - Nueva página: `src/app/b/[barSlug]/unirse/page.tsx`
  - Nuevo formulario: `src/app/b/[barSlug]/unirse/JoinForm.tsx`
- **Alta ligera** en la porra del bar sin onboarding largo

### Dashboard y planes
- **Kit incluido** en el plan + póster impreso opcional
- Planes actualizados (`src/lib/bars/plans.ts`)

### Email
- **Email de bienvenida** con el BAR como protagonista (`src/lib/email.ts`)

### Nuevos archivos
```
src/app/b/[barSlug]/unirse/page.tsx                   [+110 líneas]
src/app/b/[barSlug]/unirse/JoinForm.tsx               [+242 líneas]
src/app/bares/BarPhoto.tsx                            [+44 líneas]
public/images/bars/bar-ranking-tv.webp
public/images/bars/cta-final-bar.webp
public/images/bars/hero-porra-bar.webp
scripts/sql/2026-14-bar-entry-fee.sql
```

### Archivos modificados
```
src/app/bares/page.tsx                                [+477/-331 líneas]
src/app/bares/PlanCards.tsx
src/app/bar-dashboard/BarDashboard.tsx
src/app/b/[barSlug]/page.tsx
src/app/b/[barSlug]/JoinButton.tsx
src/app/b/[barSlug]/cartel/page.tsx
src/lib/bars/plans.ts
src/lib/bars/store.ts
src/lib/email.ts                                      [+95 líneas]
```

---

## 💰 Economía / Rankings (3 commits)

### Ledger de Fútcoins
- **Trazabilidad completa** de transacciones (`src/lib/economy/wallet.ts`)
- SQL: `scripts/sql/2026-19-coin-ledger.sql` — crea tabla `coin_ledger`

### Rankings
- **Rankings por módulo** (`src/lib/economy/ranking.ts`)
- **Top-5 global en vivo** en el hub + pestañas por módulo
- API de ranking actualizada (`src/app/api/ranking/route.ts`)
- Página de rankings (`src/app/app/rankings/page.tsx`)

### Fix atómico
- Picks en vivo rutados por `grantCoins` de forma atómica
- Prevención de condiciones de carrera en gamificación

### Nuevos archivos
```
scripts/sql/2026-19-coin-ledger.sql                   [+95 líneas]
src/lib/economy/ranking.ts                            [+88 líneas]
```

### Archivos modificados
```
src/lib/economy/wallet.ts                             [+23 líneas]
src/lib/economy/ranking.ts
src/app/api/ranking/route.ts                          [+38 líneas]
src/app/app/rankings/page.tsx                         [+54 líneas]
src/lib/predictions/live-picks-store.ts
src/lib/predictions/gamification-store.ts
src/app/api/trivia/finish/route.ts
```

---

## 🏠 App Hub (2 commits)

- **Cards del hub** enlazan directamente al juego/módulo correspondiente
- **Top-5 global en vivo** en el hub con pestañas por módulo
- Arte de slides de texto más visible y centrado en escritorio
- Subida del encuadre del arte en escritorio (42% → 62%)

### Archivos modificados
```
src/app/app/page.tsx                                  [+167 líneas]
src/components/AppBottomNav.tsx
src/i18n/home-sections.ts
src/i18n/translations.ts
```

---

## 🔐 Auth / Cuenta / Navegación (6 commits)

### Fixes de sesión
- Fix: la sesión se quedaba en **"Modo invitado"** al volver a la app (`auth/callback/route.ts`)
- Fix: ocultar CTA **"Abrir la app"** si ya hay sesión activa

### Cerrar sesión
- Botón "Cerrar sesión" al fondo del menú de la cuenta
- "Cerrar sesión" visible arriba del menú hamburguesa
- Revert: quita el "Cerrar sesión" duplicado de arriba del menú

### Archivos modificados
```
src/app/auth/callback/route.ts                        [+22 líneas]
src/app/RootLayoutClient.tsx                          [+43 líneas]
src/app/cuenta/CuentaSidebar.tsx                      [+44 líneas]
src/components/AppBottomNav.tsx
```

---

## 🎨 Assets / Optimización (3 commits)

### Card backgrounds: PNG → WebP
Todas las 16 imágenes de fondo de cards convertidas de PNG a WebP (~90% reducción de peso):

| Eliminado (PNG) | Añadido (WebP) |
|-----------------|----------------|
| `calendario.png` | `calendario.webp` |
| `chat-por-ligas.png` | `chat-por-ligas.webp` |
| `fantasy.png` | `fantasy.webp` |
| `grupos.png` | `grupos.webp` |
| `guia-del-mundial.png` | `guia-del-mundial.webp` |
| `ia-coach.png` | `ia-coach.webp` |
| `ligas-privadas.png` | `ligas-privadas.webp` |
| `match-center.png` | `match-center.webp` |
| `micro-predicciones.png` | `micro-predicciones.webp` |
| `modo-carrera.png` | `modo-carrera.webp` |
| `predicciones.png` | `predicciones.webp` |
| `ranking-global.png` | `ranking-global.webp` |
| `reglas-de-puntos.png` | `reglas-de-puntos.webp` |
| `stories.png` | `stories.webp` |
| `trivia-diaria.png` | `trivia-diaria.webp` |
| `zona-streaming.png` | `zona-streaming.webp` |

---

## 📝 Documentación

- `ASSETS_MODO_CARRERA.md` — Documentación de assets del modo carrera
- `STORYBOARD_MODO_CARRERA.md` — Storyboard y prompts de assets

---

## 🔧 Scripts de utilidad (nuevos)

| Script | Propósito |
|--------|-----------|
| `scripts/apply-positions-apifootball.mjs` | Aplica posiciones desde API Football |
| `scripts/audit-positions-apifootball.mjs` | Audita posiciones contra API Football |
| `scripts/audit-rosters.mjs` | Audita alineaciones |
| `scripts/verify-rosters-apifootball.mjs` | Verifica alineaciones contra API Football |
| `scripts/sql/2026-14-bar-entry-fee.sql` | SQL: cuota de entrada del bar |
| `scripts/sql/2026-19-coin-ledger.sql` | SQL: tabla de ledger de Fútcoins |

---

## 📊 Estadísticas del diff

```
102 files changed
+5,008 líneas insertadas
-331 líneas eliminadas
```

### Por tipo de cambio
| Tipo | Cantidad |
|------|----------|
| ⬜ Añadidos (A) | 48 |
| 🔄 Modificados (M) | 36 |
| ❌ Eliminados (D) | 16 |
| → Renombrados (R) | 0 |

---

## 🔗 Información del repositorio

- **Remote:** `https://github.com/McCar1981/webzonamundial.git`
- **Rama local:** `main`
- **Rama remoto:** `origin/main`
- **Commit anterior:** `fee1d5d` (fantasy: subir el valor de los jugadores)
- **Commit actual:** `55d11bf` (feat(ranking): top-5 global en vivo)
- **Nueva rama en remoto:** `feature/stories`
