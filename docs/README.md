# Documentación y forma de trabajo

Este repo es a la vez el código, el "Jira" y el "Confluence" del proyecto. Todo vive en markdown, versionado con git, para que tanto yo como Claude lo leamos y actualicemos sin herramientas externas.

## Mapa

| Carpeta / archivo | Qué contiene | Equivale a |
|---|---|---|
| [`diseno/`](diseno/README.md) | **Qué** es el juego, explicado para cualquiera. Documento vivo: siempre es la versión vigente. | Confluence |
| [`diseno/CAMBIOS.md`](diseno/CAMBIOS.md) | Cada versión del diseño: qué cambió y **por qué**. | Historial de versiones |
| [`diseno/ideas.md`](diseno/ideas.md) | Ideas sin compromiso para el futuro. | Backlog de ideas |
| [`tareas/`](tareas/README.md) | Una tarea por archivo y el tablero. | Jira |
| [`planes/`](planes/README.md) | **Cómo** se implementa una tarea. | Documento técnico |
| [`../CLAUDE.md`](../CLAUDE.md) | Stack, arquitectura y reglas para trabajar con Claude. | Guía técnica |
| `../.local/` | Notas privadas y assets no oficiales. Ignorada por git: solo existe en la máquina local y no tiene respaldo. | Cajón personal |

## Conceptos

- **Hito**: un objetivo con algo jugable al final (como un *release* de Jira). Cada tarea pertenece a un hito. Se nombran `H1` … `H5`; los hitos y su planeación están en [`tareas/README.md`](tareas/README.md).
- **Revisión con Mi vo**: Mi vo actúa como cliente y juega los entregables para dar retroalimentación. El product owner decide cuándo; cada revisión se registra como tarea y lo que salga se convierte en tareas nuevas o en cambios de diseño.
- **Tarea**: unidad de trabajo con tipo, estado, dependencias y criterios de aceptación. Detalles en [`tareas/README.md`](tareas/README.md).
- **Tipos de tarea**: `diseno`, `codigo`, `arte`, `bug`, `investigacion`. El diseño también se trabaja con tareas, así su refinamiento queda registrado igual que el código.
- **Plan**: el paso a paso técnico de una tarea no trivial. Comparte el ID con su tarea.

## Ciclo de trabajo

El proyecto es iterativo: cada vuelta del ciclo puede refinar el diseño.

```
1. Diseño     → entrevista o discusión; se actualiza diseno/ y CAMBIOS.md (+ tag de git)
2. Tareas     → salen del diseño y se agrupan por hito
3. Plan       → solo si la tarea no es trivial
4. Código     → una rama por tarea; commits con el ID; merge a main
5. Probar     → jugar en el celular; lo que salga → tareas nuevas o de vuelta a 1
```

## Git

- `main` siempre es jugable: lo que entra a `main` se publica en GitHub Pages.
- Una rama por tarea, cada una en su propio worktree: `T-007-flujo-de-escenas`. Entra a `main` por pull request (ver "Trabajo en paralelo").
- Commits pequeños, en español e imperativo, con el ID: `T-007: añade escenas placeholder conectadas`.
- Al cerrar una versión del diseño: tag `diseno-vX.Y`. Para ver una versión vieja: `git show diseno-v0.1:docs/diseno/reglas.md`.
- Al cerrar un hito: tag `hito-hN` (por ejemplo, `hito-h3` es la demo). La entrega final es `v1.0`. "v0.X" siempre se refiere al diseño, nunca al juego.

### Checks obligatorios en `main`

Un *ruleset* de GitHub protege `main` (definido en `.github/rulesets/main.json`). Nada entra a `main` si no cumple:

- Los checks `tests`, `build` y `e2e` del CI están en verde.
- La rama está **al día** con `main`: los checks corrieron con la versión más reciente de `main`. Si `main` avanzó, la rama trae `main` (`git merge origin/main`, o el botón "Update branch" del PR) y espera el CI otra vez.
- No hay *force push* ni se borra `main`.

Si un check falla en un PR: abrir el check en GitHub, leer el error, corregirlo en la rama y hacer push. El PR se desbloquea solo cuando todo vuelve a verde. **Nunca** se usa `gh pr merge --admin` ni la casilla "bypass" de la web para saltarse un check rojo. De todos modos no funcionan, porque la cuenta no tiene excepción, pero la regla queda escrita.

**Pushes directos a `main`:** solo los hace la sesión que trabaja en `main` (la orquestadora), y solo para el tablero y el "Estado actual". Usan una *deploy key*, la única excepción del ruleset, indicada en el propio comando (no hay nada configurado en el repo):

```bash
GIT_SSH_COMMAND='ssh -i ~/.ssh/trick-r-treat-directo -o IdentitiesOnly=yes' git push git@github.com:carlosuscanga/trick-r-treat.git main && git fetch origin
```

El `git fetch` del final va porque el push sale por la URL y no por `origin`, así que no actualiza `origin/main` local. Sin él, el editor muestra "1 adelante" aunque el push sí se hizo, y una sesión que lea `origin/main` ve una versión vieja.

Un `git push origin main` normal se rechaza. Las sesiones de tarea **nunca** usan este comando. Límite honesto: la llave vive en `~/.ssh/trick-r-treat-directo` de la Mac (nunca en el repo) y cualquier sesión podría leerla. Lo que protege `main` de las sesiones de tarea es esta regla escrita, más que su token de `gh` no tiene permiso de administración (no puede tocar el ruleset ni las deploy keys). La llave se revoca en Settings → Deploy keys.

**Cambiar el ruleset** (por ejemplo, para exigir un check nuevo): se edita el JSON en el PR de la tarea y, **después del merge**, el product owner lo aplica con su cuenta (el token de las sesiones no tiene permiso para hacerlo): `gh api -X PUT repos/carlosuscanga/trick-r-treat/rulesets/25247200 --input .github/rulesets/main.json`. Un check solo se vuelve obligatorio cuando ya corre en `main`. Si se exige antes, todos los PRs quedan bloqueados esperándolo. El test `src/ci/checks.test.ts` verifica que cada check exigido exista como job en el CI.

### Credenciales de GitHub

Las sesiones de Claude de este proyecto usan **su propio token**, no el login de `gh` de la Mac. Es un token *fine-grained* limitado al repo `trick-r-treat`:

- Permisos: Contents, Pull requests y Workflows de escritura; Actions y Metadata de lectura. **Sin Administration:** las sesiones no pueden tocar el ruleset, Pages ni las deploy keys (GitHub responde 403).
- Vive en `.local/gh/` (ignorada por git). `.claude/settings.local.json` (tampoco se sube) apunta a esa carpeta con `GH_CONFIG_DIR`, y el `.git/config` local hace que `git push` use el mismo token. El token nunca se escribe en un archivo del repo ni en el chat.
- Lo de administración (ruleset, Pages, deploy keys) lo hace el product owner desde su terminal con su propia cuenta, anteponiendo `GH_CONFIG_DIR=` vacío para no usar el token del proyecto.
- El token vence a los ~90 días. Para renovarlo, el product owner crea uno nuevo con los mismos permisos y, desde la carpeta del proyecto, en su terminal: `GH_CONFIG_DIR="$PWD/.local/gh" gh auth login --with-token --insecure-storage`. `--insecure-storage` lo guarda en esa carpeta y no en el llavero de macOS, que comparte con el login global.
- Para comprobar qué token usa una sesión: `gh auth status` debe mostrar `github_pat_…` desde `.local/gh/hosts.yml`.

## Trabajo en paralelo (worktrees)

Cada tarea en progreso vive en su propio **worktree**: una carpeta aparte, con su rama, del mismo repo. Así varias tareas avanzan a la vez sin pisarse.

1. **Elegir:** solo tareas cuyas dependencias estén `hecha`. Los carriles del tablero dicen qué puede ir en paralelo. No hay límite fijo de tareas abiertas: si se acumulan PRs sin revisar o las ramas se alejan mucho de `main`, abrir menos.
2. **Arrancar (en `main`):** marcar la tarea `en-progreso` en su archivo y en el tablero, y llenar en su frontmatter `rama:` y `worktree:`, que ya se conocen aunque el worktree todavía no exista (por ejemplo, `rama: T-007-flujo-de-escenas` y `worktree: .claude/worktrees/T-007-flujo-de-escenas`). Hacer commit y push con la deploy key (comando en "Checks obligatorios en `main`"). Así cualquier sesión sabe qué está tomado y dónde, y puede retomarlo ("Sesiones con Claude", "Retomar T-NNN").
3. **Crear el worktree:** con la herramienta nativa de Claude Code, en `.claude/worktrees/` (ignorada por git). La herramienta parte de `origin/main`, y por eso el paso 2 hace push antes. Nombra la rama `worktree-T-NNN-titulo`, así que hay que renombrarla enseguida con `git branch -m T-NNN-titulo`. Adentro: `nvm use`, `npm install` y `npm run build` para confirmar que se parte de una base limpia. En el shell del agente nvm no carga, así que en su lugar se antepone `export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"` a los comandos de npm. Cada worktree usa su propio puerto de `vite`. El checkout principal también necesita su propio `npm install`; sin él, el editor marca errores falsos como "Cannot find module 'vite'".
4. **Trabajar:** en la rama se editan el código, el plan y **solo el archivo de su propia tarea** (criterios y bitácora). El tablero y el "Estado actual" **no se tocan en las ramas**, para evitar conflictos.
5. **Pull request:** push de la rama y PR a `main`, con el ID en el título (`T-007: flujo de escenas placeholder`). El product owner lo revisa en GitHub (diff, comentarios, `/code-review`). Todo PR de código incluye en su descripción una sección **"Prueba manual en el iPhone"**: cómo prepararla y una tabla de pasos con lo que se espera en cada uno. Así la prueba queda escrita y se puede repetir, por ejemplo en Pages después del merge. Si no hay nada que probar a mano (por ejemplo, un cambio solo del CI), la sección lo dice.
6. **Merge y cierre (en `main`):** con el OK del product owner, el merge lo hace la sesión que trabaja en `main` (la orquestadora, cuando hay varias tareas en paralelo), nunca la sesión de la rama. Así el cierre y los avisos quedan en un solo lugar. Es sin squash, para conservar los commits pequeños, y GitHub borra sola la rama remota. GitHub solo deja mergear con `tests`, `build` y `e2e` en verde y la rama al día con `main`. Después, en `main` (con `git pull` antes, y el push con la deploy key):
   - La tarea pasa a `hecha` en su archivo y en el tablero, y se actualiza el "Estado actual". En el mismo commit, `rama:` y `worktree:` vuelven a `null`.
   - Si un criterio solo se puede verificar en `main` (por ejemplo, que Pages publique), el PR se mergea con esa casilla abierta y explicada en la bitácora. Se verifica después del merge y se marca en el mismo commit que pasa la tarea a `hecha`.
   - Si el merge afecta a otras ramas abiertas, se les avisa para que traigan `main` con `git merge origin/main`.
   - **Limpieza**, en este orden: (1) en el worktree, confirmar que `git rev-list --count origin/main..HEAD` da 0, es decir, que todo está en `main`; (2) quitar el worktree con `ExitWorktree remove` y `discard_changes: true`. Como la rama ya se renombró, la herramienta busca el nombre viejo `worktree-…`, avisa de commits "descartados" que en realidad ya están en `main`, y no borra la rama. Si la sesión se retomó y la herramienta ya no reconoce el worktree como suyo, se quita con `git worktree remove <ruta>`; (3) el product owner borra la rama local con `git branch -d T-NNN-titulo`. Mientras el worktree exista, ese comando falla con "used by worktree", y el hook de seguridad `dcg` no deja que el agente borre ramas.

## Sesiones con Claude

- **Al empezar:** preguntar "¿qué sigue?". Claude lee el "Estado actual" y el tablero (`tareas/README.md`) y propone la siguiente tarea. Para seguir una tarea que ya arrancó, decir "retoma T-NNN" (viñeta siguiente).
- **Retomar T-NNN:** una sesión **nueva** (no `claude --resume`) sigue una tarea leyendo solo tres cosas: el frontmatter de la tarea, su bitácora y su plan. Sirve cuando la sesión anterior ya acumuló mucho contexto. Pasos:
  1. Abrir la sesión desde la carpeta principal del proyecto (viñeta "Abrir y retomar sesiones").
  2. Leer **solo el frontmatter** de `tareas/T-NNN-*.md` en `main`. Si `worktree` está vacío, la tarea no ha arrancado: se sigue el flujo normal desde "Arrancar" ("Trabajo en paralelo", paso 2).
  3. Entrar al worktree con `EnterWorktree` y `path` igual al valor de `worktree`.
  4. Ya en el worktree, leer la bitácora de la tarea (sobre todo una entrada "para retomar", si existe) y su plan. Estas dos se leen en el worktree y no en `main`, porque la copia de la rama es la más nueva.
  5. Seguir desde la primera casilla sin marcar del plan, o desde lo que diga "para retomar".

  No se leen el tablero ni el "Estado actual" completos. Si la tarea no tiene plan, la bitácora basta.
- **Durante:** una tarea por worktree. Decisiones y bloqueos van a la bitácora de la tarea.
- **Al terminar:** Claude actualiza la bitácora en la rama, y el estado, el tablero y el "Estado actual" en `main`. El "Estado actual" solo dice lo vigente (fase, en curso, siguiente paso y pendientes); lo que se hizo en la sesión va arriba de `tareas/historial.md`, también en `main`.
- **Varias tareas a la vez:** una sesión **orquestadora** trabaja en `main`. Es la única que edita el tablero y el "Estado actual", hace los merges con el OK del product owner, y avisa a las demás. Cada tarea tiene su sesión **trabajadora** en su worktree. Las sesiones se hablan con `ListAgents` y `SendMessage`. Si una sesión *retiene* un mensaje (pasa cuando tienen distinto modo de permisos), el product owner lo aprueba en la terminal de esa sesión. No se reenvía mientras esté retenido.
- **Abrir y retomar sesiones:** siempre desde la carpeta principal del proyecto, porque ahí se carga `.claude/settings.local.json` (el token del proyecto). Una conversación se guarda bajo la carpeta donde **arrancó**, no donde terminó: una sesión de tarea que arrancó en la carpeta principal y entró a su worktree se retoma desde la carpeta principal, con `claude --resume <id>`, y lo primero que hace es volver a su worktree. Al retomarla, cambia su nombre en `ListAgents`.

## Definición de "hecho"

Una tarea está `hecha` cuando:

1. Cumple todos sus criterios de aceptación.
2. Lo nuevo tiene sus tres capas de pruebas: unitarias, e2e y manual en el iPhone (o el porqué de la que no aplica). `npm test`, `npm run test:e2e` y `npm run build` pasan, y la prueba manual del PR se hizo en el iPhone.
3. Está en `main` mediante un PR mergeado.
4. La tarea y el tablero están actualizados.

Las tareas de diseño están hechas cuando el cambio está en `diseno/` y registrado en `CAMBIOS.md`.
