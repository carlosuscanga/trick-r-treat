# Plan T-048: Skill `tarea` (tomar, retomar y cerrar)

Tarea: [T-048](../tareas/T-048-skill-tarea.md)

> Para agentes: se ejecuta tarea por tarea con `superpowers:subagent-driven-development` y los modelos de "Modelo y esfuerzo". Las casillas `- [ ]` marcan el avance.

## Enfoque

Un **script** hace lo que siempre se hace igual: validar, editar el frontmatter, regenerar el tablero, hacer commit y crear o quitar el worktree. Un **skill** hace lo que requiere criterio: revisar si la tarea está lista, refinarla con el product owner, correr el push, entrar al worktree y escribir el "Estado actual" y el historial. Mismo patrón que el tablero (T-047): lógica pura en `scripts/tarea.ts`, probada con Vitest, y un CLI delgado en `scripts/tarea-cli.mjs` que toca archivos y procesos.

Decisiones del product owner (2026-10-18):

1. **Worktree con `git`:** `git worktree add <ruta> -b <rama> --no-track HEAD`, entrar con `EnterWorktree path` y quitarlo con `git worktree remove`. La rama nace con su nombre final, y `--no-track` evita que un `git push` sin argumentos apunte a `main`.
2. **El plan se escribe en la rama**, como hoy. La Definition of Ready no exige el plan; si la tarea dice `plan: requerido`, el primer paso en el worktree es escribirlo, y no se programa hasta que esté aprobado.
3. **El push a `main` queda visible:** el script nunca hace push, solo imprime el comando. El skill lo corre aparte, así el modo auto lo revisa y el product owner lo ve.

## Archivos

- Crear: `scripts/tarea.ts`, `scripts/tarea.test.ts`, `scripts/tarea-cli.mjs` y `.claude/skills/tarea/SKILL.md`.
- Modificar: `package.json` (script `tarea`), `docs/tareas/README.md` (Definition of Ready y plantilla), `docs/README.md` (pasos 2, 3 y 6 de "Trabajo en paralelo" y "Retomar T-NNN") y `CLAUDE.md` (worktrees con `git` y el skill).
- Fuera del repo: las notas de memoria de Claude que eran parches del flujo.

## Restricciones

- Node 24: el CLI repite la guarda de versión de `tablero-cli.mjs` e importa `.ts` directo, sin compilar.
- Sin dependencias nuevas. Los procesos se llaman con `execFileSync` (sin shell), y siempre desde el checkout principal en `main`.
- Mensajes y nombres en español. Los commits siguen `T-NNN: …` con las líneas de atribución.

## Pasos

### Tarea 1: lógica pura (`scripts/tarea.ts`)

**Interfaz (la usa la Tarea 2):**

```ts
export function nombreDeRama(nombreArchivo: string): string;            // 'T-048-skill-tarea.md' → 'T-048-skill-tarea'
export function rutaDeWorktree(rama: string): string;                    // → '.claude/worktrees/T-048-skill-tarea'
export function revisarLista(tarea: Tarea, texto: string, todas: Tarea[]): string[]; // faltantes; [] = lista
export function marcarEnProgreso(texto: string, rama: string): string;  // estado, rama: y worktree:
export function marcarHecha(texto: string): string;                      // estado: hecha, rama y worktree en null
```

`Tarea` y `leerTareas` se reutilizan de `scripts/tablero.ts`. `marcarEnProgreso` y `marcarHecha` cambian solo esas líneas del frontmatter y, si faltan `rama:` o `worktree:` (42 tareas no los tienen), los insertan después de `plan:`. Lanzan `Error` con mensaje claro si el estado de partida no es el esperado.

`revisarLista` solo revisa lo **mecánico** de la Definition of Ready. Lo demás (decisiones abiertas, criterios vagos) lo juzga el skill:

- Estado `pendiente`. Con `bloqueada` dice "revisa la bitácora"; con `en-progreso` o `hecha`, "ya arrancó" o "ya está hecha".
- Cada dependencia en `hecha`; si no, "T-NNN no está hecha (estado)".
- La sección `## Qué` no está vacía.
- `## Criterios de aceptación` tiene al menos una casilla, y una de ellas menciona las tres capas de pruebas (`/tres capas/i`).

- [ ] **Tests primero** en `scripts/tarea.test.ts`, con textos de tarea escritos en el propio test:
  - `nombreDeRama` quita `.md`, y `rutaDeWorktree` arma la ruta.
  - `revisarLista`: una tarea completa da `[]`; una dependencia `pendiente` aparece por su ID; sin la casilla de tres capas sale ese faltante; con `## Qué` vacío, también; `bloqueada`, `en-progreso` y `hecha` dan su mensaje.
  - `marcarEnProgreso`: cambia `estado`, `rama` y `worktree`, y deja intacto todo lo demás (compara el resto línea por línea); inserta `rama:` y `worktree:` si faltan; lanza si el estado no es `pendiente`.
  - `marcarHecha`: pasa `en-progreso` a `hecha` con `rama: null` y `worktree: null`; lanza si no está `en-progreso`.
  - Correr `npx vitest run scripts/tarea.test.ts`: falla porque no existe el módulo.
- [ ] **Implementar** `scripts/tarea.ts` hasta que pase. Luego `npm test` completo, en verde.
- [ ] **Commit:** `T-048: añade la lógica pura del script tarea`.

### Tarea 2: CLI (`scripts/tarea-cli.mjs`) y `npm run tarea`

`npm run tarea -- <revisar|tomar|cerrar> T-NNN`. Lee todas las tareas con `leerTareas`, busca la del ID y falla con un mensaje claro si el ID no existe o está mal escrito (`T-48`, `t-048`).

- **Precondición** de `tomar` y `cerrar`: el checkout principal, en `main`, sin cambios (`git status --porcelain` vacío) y al día (`git pull --ff-only`). Si no se cumple, se niega **antes de tocar nada**.
- **`revisar`:** imprime los faltantes de `revisarLista`. Sale con 1 si hay alguno.
- **`tomar`:** corre `revisar` (si hay faltantes, se niega) → `marcarEnProgreso` → regenera el tablero con `generarTablero` → `git add` de la tarea y el README → commit `T-NNN: pasa la tarea a en-progreso` → `git worktree add <ruta> -b <rama> --no-track HEAD` → en el worktree, `npm install` y `npm run build`. Al final imprime el comando de push (el de la deploy key de `docs/README.md`) y la ruta para `EnterWorktree`. Si la tarea dice `plan: requerido`, lo recuerda.
- **`cerrar`:** comprueba con `gh pr list --head <rama> --state merged --json number` que haya un PR mergeado y con `git rev-list --count origin/main..<rama>` que dé 0 (si no, se niega y dice cuántos commits faltan) → calcula en memoria `marcarHecha` y el tablero, para que un estado inválido falle antes de tocar nada → `git worktree remove <ruta>` sin `--force` (si el worktree tiene cambios, se niega y lo dice) → escribe la tarea y el README, **sin commit**. Imprime los pasos que siguen: el "Estado actual" y el historial (los escribe el skill), un solo commit `T-NNN: cierra la tarea`, el push y `git branch -d <rama>` para el product owner.
- [ ] Agregar `"tarea": "node scripts/tarea-cli.mjs"` a `package.json`.
- [ ] **Verificar a mano**, en el worktree de T-048 contra sus propias tareas: `npm run tarea -- revisar T-007` lista faltantes y sale con 1 (no tiene casilla de tres capas); `revisar T-999` dice que no existe; `tomar T-007` desde el worktree se niega por no estar en `main` y no cambia nada (`git status` limpio).
- [ ] **Commit:** `T-048: añade el CLI npm run tarea`.

### Tarea 3: skill y documentación

- [ ] `.claude/skills/tarea/SKILL.md`. En el frontmatter, `description` con los disparadores: "toma T-NNN", "retoma T-NNN", "cierra T-NNN", "¿qué sigue?" y arrancar o cerrar una tarea. El cuerpo, corto:
  - **Tomar:** (1) `npm run tarea -- revisar T-NNN`; (2) revisar con criterio lo que el script no ve: decisiones abiertas en el "Qué", criterios vagos y dependencias que se pisan con otra tarea; (3) si falta algo, refinar en `main`: proponer cada decisión con una recomendación, preguntarla una por una, editar la tarea y hacer commit y push; (4) `npm run tarea -- tomar T-NNN`; (5) correr el push que imprime; (6) `EnterWorktree` con la ruta; (7) si dice `plan: requerido`, escribir el plan antes de programar.
  - **Retomar:** el protocolo de T-046, igual que hoy.
  - **Cerrar:** si la sesión está en el worktree, `ExitWorktree keep` primero → `npm run tarea -- cerrar T-NNN` → escribir el "Estado actual" y el historial → un solo commit → push visible → pedir al product owner `git branch -d`.
  - **Fallos comunes:** si el push falla porque `main` avanzó, `git pull --rebase` y repetir el push. Antes de npm, siempre el PATH de Node 24.
- [ ] `docs/tareas/README.md`: sección "Definition of Ready", junto a la plantilla, con las 4 condiciones de T-048, la nota de que el plan se escribe en la rama, y que el script revisa lo mecánico y el skill lo demás.
- [ ] `docs/README.md`: los pasos 2, 3 y 6 de "Trabajo en paralelo" y "Retomar T-NNN" se reducen a "usa el skill `tarea`" más el porqué de cada regla. Se borran el renombrado de la rama y el aviso falso de `ExitWorktree`.
- [ ] `CLAUDE.md`: worktrees creados con `git worktree add` desde el skill `tarea`; "retoma T-NNN" apunta al skill.
- [ ] Memoria de Claude: borrar `exitworktree-tras-renombrar-rama` y actualizar `push-directo-desde-worktree` y `node-24-en-shell-del-agente` si cambian.
- [ ] **Commit:** `T-048: añade el skill tarea y acorta el flujo en los docs`.

## Pruebas

- **Unitarias** (`npm test`): `scripts/tarea.test.ts`, Tarea 1.
- **e2e:** no aplica. No hay nada en el navegador; el CLI se prueba a mano (Tarea 2) y en uso real.
- **Manual en el iPhone:** no aplica, no cambia el juego. En su lugar, una **prueba de uso real**, en una tabla en el PR:

| Paso | Qué se espera |
|---|---|
| `npm run tarea -- revisar T-007` | Lista lo que le falta y no cambia nada. |
| Cerrar T-048 con el skill, después de su merge | Tarea `hecha`, tablero al día, worktree quitado y un solo commit con el "Estado actual". |
| Tomar la siguiente tarea (T-037) con el skill | Si no está lista, la refina; luego queda `en-progreso`, con el push hecho y el worktree compilado y con la rama en su nombre final. |

## Revisión: casos que los tests no cubren

1. **El push falla porque `main` avanzó** entre el `pull` y el push: `git pull --rebase` y repetir (lo dice el skill).
2. **`git worktree remove` con archivos ignorados** (`node_modules`, `dist`): debe quitarlo sin `--force`. Verificar en el primer `cerrar` real.
3. **Dos sesiones toman tareas a la vez:** la segunda falla en el `pull --ff-only` o en el push; repite. Aceptable con dos personas.
4. **El ID existe pero el archivo tiene otro nombre de rama** (por ejemplo, se renombró el archivo): la rama sale siempre del nombre del archivo.
5. **El modo auto bloquea `git worktree add` o el push:** no se rodea; el product owner lo corre con `!`.

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Tarea 1 (subagente que programa) | Sonnet | `medium` | Lógica pura y chica, con tests definidos. |
| Tarea 2 (subagente que programa) | Sonnet | `medium` | Mismo patrón que `tablero-cli.mjs`. |
| Tarea 3 (sesión principal) | Opus | `high` | Es redacción de proceso: decide qué reglas quedan y cómo las lee un agente. |
| Revisión del PR | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol. El riesgo está en el CLI: no dejar `main` a medias. |

## Riesgos y dudas

- Si `revisarLista` es demasiado estricta, casi ninguna tarea vieja pasa (43 no tienen la casilla de tres capas). Es intencional: obliga a refinar al tomar. Si molesta, se baja a advertencia.
- T-030: al cerrar esta tarea se decide si se descarta (recomendación de la tarea).
