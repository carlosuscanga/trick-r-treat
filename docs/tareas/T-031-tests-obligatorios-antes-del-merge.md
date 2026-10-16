---
id: T-031
titulo: Tests obligatorios antes del merge
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-006]
plan: docs/planes/T-031-tests-obligatorios-antes-del-merge.md
---

## Qué

Que GitHub no deje mergear un PR a `main` si los tests o el build fallan.

T-006 agrega Vitest, `npm test` y un paso de tests en el CI que corre en cada PR. Pero hoy un check en rojo solo avisa: el botón de merge sigue activo. Falta una regla en `main` (un *ruleset* de GitHub) que marque ese check como **requerido**. Si conviene, el job de CI se separa del de despliegue.

## Por qué

`main` siempre es jugable y se publica en Pages con cada merge. Con varias sesiones trabajando en paralelo y merges seguidos, un PR roto podría entrar por descuido. Con la regla, GitHub lo impide aunque nadie se dé cuenta.

## Criterios de aceptación

- [x] Un PR con un test roto muestra el check en rojo, y GitHub no deja mergearlo. Se prueba con un PR de prueba que después se cierra.
- [ ] Un PR con tests y build en verde se mergea normal, sin squash.
- [ ] El flujo sigue funcionando: los commits directos a `main` (tablero, "Estado actual") y los de la Action de T-030 no quedan bloqueados, o el plan define otra forma de hacerlos.
- [x] `docs/README.md` explica la regla y qué hacer cuando un check falla.
- [x] El cambio de configuración del repo se hace con el OK del product owner.

## Bitácora

- 2026-10-16: creada a pedido del product owner, al notar que el proyecto no tenía tests. Depende de T-006, que trae Vitest y el paso `npm test` en el CI.
  - Riesgo: una regla que exige checks también puede bloquear los pushes directos a `main`, que hoy usan el orquestador y usará la Action de T-030. El plan decide entre tres opciones: una lista de excepciones (*bypass*), exigir los checks solo en los PR, o pasar esos cambios a PR.
  - No conviene hacerla en paralelo con T-030, porque las dos tocan `.github/` y la forma de escribir en `main`.
- 2026-10-16: plan aprobado. Carlos eligió la opción C: la única excepción del ruleset es una *deploy key* que usa el orquestador para el tablero; el token de Carlos (el que usan todos los agentes) no tiene excepción, así que ni con `--admin` se mergea en rojo. También se exige la rama al día con `main`. Hallazgo: GitHub no tiene un modo de excepción "solo pushes directos" (`always`, `pull_request`, `exempt`), por eso no se usó la excepción por rol admin. T-030 queda para después: su Action usará otra deploy key como *secret*, decisión de su plan.
- 2026-10-16: ruleset versionado en `.github/rulesets/main.json`. `src/ci/checks.test.ts` verifica que cada check exigido exista como job en `deploy.yml`; se comprobó renombrando el job `tests` a propósito (falló) y regresándolo. `docs/README.md` explica la regla, el remoto `directo` y qué hacer si un check falla.
- 2026-10-16: configuración aplicada con el OK de Carlos. Llave `~/.ssh/trick-r-treat-directo` (ed25519, sin frase de paso), registrada como deploy key con escritura (id 166672622, "directo (tablero en main)"). Remoto `directo` y `core.sshCommand` en la configuración local de git (compartida por el checkout principal y los worktrees; `origin` sigue por HTTPS). `ssh -T` con la llave responde "Hi carlosuscanga/trick-r-treat!". Ruleset creado con id `25247200`, `enforcement: active`; GitHub aceptó `DeployKey` como excepción en un repo personal, y `current_user_can_bypass` es `never` para la cuenta de Carlos.
- 2026-10-16: prueba en rojo con el PR #5 (rama `prueba-T-031-rojo`, un test que falla a propósito). `tests` en rojo, PR en `BLOCKED`, y `gh pr merge 5 --merge` se negó con "the base branch policy prohibits the merge". `gh` sugirió `--admin`, como se había previsto; no se intentó, porque si el ruleset estuviera mal metería el test roto a `main`, y `current_user_can_bypass: never` ya muestra que no aplica. El PR se cerró sin mergear y la rama se borró.
- 2026-10-16: dos criterios quedan para el cierre en `main`, porque solo se pueden verificar ahí: (1) que este PR, en verde, se mergee normal sin squash; (2) que `git push origin main` se rechace y `git push directo main` entre (prueba del orquestador con el commit de cierre). Lo de T-030 queda definido en el plan: otra deploy key como *secret*.
- 2026-10-16: endurecimiento antes del merge, aprobado por Carlos. Se quitaron de `.git/config` el remoto `directo` y `core.sshCommand`, porque esa configuración la comparten todos los worktrees y dejaba el atajo a mano de cualquier sesión. Las entradas `credential.*` no se tocaron. El orquestador empuja con la llave en el comando: `GIT_SSH_COMMAND='ssh -i ~/.ssh/trick-r-treat-directo -o IdentitiesOnly=yes' git push git@github.com:carlosuscanga/trick-r-treat.git main`. Desde esta sesión no se pudo probar con `--dry-run`, porque el aislamiento del worktree bloquea git contra otro destino; sí se probó que la llave autentica (`ssh -T` responde "Hi carlosuscanga/trick-r-treat!"). El orquestador prueba el comando completo. Además: las sesiones ahora usan un token fine-grained solo de este repo, sin permiso de administración, así que cambiar el ruleset lo hace Carlos con su cuenta. `docs/README.md` y el plan quedaron actualizados. Se agregó `.claude/settings.local.json` al `.gitignore`.
