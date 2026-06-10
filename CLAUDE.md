# ZonaMundial — Protocolo Git multi-agente (OBLIGATORIO)

Sobre este repo trabajan varios agentes de IA en paralelo (cada chat de Carlos es
un agente distinto). Estas reglas existen porque ya hubo trabajo casi perdido y
commits duplicados por no seguirlas. Cúmplelas siempre.

## Reglas duras

1. **No trabajes en el clon principal** (`Desktop/zonamundial/repo`): suele tener
   trabajo a medias de otro agente. Crea tu propio worktree temporal:

   ```
   git -C C:/Users/Neo-PC/Desktop/zonamundial/repo fetch origin
   git -C C:/Users/Neo-PC/Desktop/zonamundial/repo worktree add D:/Temp/zm-<tarea> -b <modulo>/<tarea> origin/main
   ```

2. **Una rama por tarea, creada SIEMPRE desde `origin/main` recién fetcheado.**
   Nunca crees tu rama encima de la rama de otra tarea ni commitees en una rama
   que no creaste tú (en junio se encadenaron 5 auditorías de módulos distintos
   en una sola rama con nombre de otro módulo y casi se pierde una).

3. **Nombra la rama por su módulo**: `fantasy/...`, `trivia/...`,
   `predicciones/...`, `carrera/...`, `stories/...`, `micro/...`, `coach/...`,
   `seo/...`, `infra/...`. Así se sabe de quién es cada cosa con un `git branch`.

4. **Commitea con rutas explícitas** (`git add src/lib/...`), nunca `git add -A`
   ni `git add .`. No incluyas `tsconfig.tsbuildinfo` ni `_png-backup/`.

5. **Push temprano + PR.** Pushea tu rama en cuanto exista el primer commit y abre
   PR al terminar. El trabajo solo-local en esta máquina se pierde (ya pasó).

6. **Prohibido `push --force`** (a cualquier rama) y **prohibido tocar worktrees
   ajenos** (`wt-*`, `_wt-*`, `zm-*` que no creaste tú) o el stash de otros.

7. **Migraciones SQL**: antes de numerar `scripts/sql/2026-NN-*.sql`, comprueba el
   mayor `NN` en `origin/main` **y en los PRs abiertos** (`gh pr list`), y usa
   `NN+1`. Ya hubo dos colisiones de numeración (2026-22 y 2026-23).

8. **Al acabar, limpia**: con el PR mergeado, borra la rama local, la remota y tu
   worktree (`git worktree remove D:/Temp/zm-<tarea>`). No dejes ramas muertas.

## Antes de empezar cualquier tarea

- `gh pr list` — los PRs abiertos son trabajo vivo de otros agentes; si tocan tu
  mismo módulo, coordina con Carlos antes de duplicar.
- `git -C <repo> worktree list` — para saber qué hay activo.

## Verificación mínima antes de push

- `node node_modules/typescript/lib/tsc.js --noEmit` (en worktrees, crea antes una
  junction: `New-Item -ItemType Junction node_modules -Target <repo>/node_modules`).
  `main` despliega a producción en Vercel: nada que no compile.
