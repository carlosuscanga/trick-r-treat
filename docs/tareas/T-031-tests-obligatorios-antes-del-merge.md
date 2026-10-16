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

- [ ] Un PR con un test roto muestra el check en rojo, y GitHub no deja mergearlo. Se prueba con un PR de prueba que después se cierra.
- [ ] Un PR con tests y build en verde se mergea normal, sin squash.
- [ ] El flujo sigue funcionando: los commits directos a `main` (tablero, "Estado actual") y los de la Action de T-030 no quedan bloqueados, o el plan define otra forma de hacerlos.
- [ ] `docs/README.md` explica la regla y qué hacer cuando un check falla.
- [ ] El cambio de configuración del repo se hace con el OK del product owner.

## Bitácora

- 2026-10-16: creada a pedido del product owner, al notar que el proyecto no tenía tests. Depende de T-006, que trae Vitest y el paso `npm test` en el CI.
  - Riesgo: una regla que exige checks también puede bloquear los pushes directos a `main`, que hoy usan el orquestador y usará la Action de T-030. El plan decide entre tres opciones: una lista de excepciones (*bypass*), exigir los checks solo en los PR, o pasar esos cambios a PR.
  - No conviene hacerla en paralelo con T-030, porque las dos tocan `.github/` y la forma de escribir en `main`.
- 2026-10-16: plan aprobado. Carlos eligió la opción C: la única excepción del ruleset es una *deploy key* que usa el orquestador para el tablero; el token de Carlos (el que usan todos los agentes) no tiene excepción, así que ni con `--admin` se mergea en rojo. También se exige la rama al día con `main`. Hallazgo: GitHub no tiene un modo de excepción "solo pushes directos" (`always`, `pull_request`, `exempt`), por eso no se usó la excepción por rol admin. T-030 queda para después: su Action usará otra deploy key como *secret*, decisión de su plan.
- 2026-10-16: ruleset versionado en `.github/rulesets/main.json`. `src/ci/checks.test.ts` verifica que cada check exigido exista como job en `deploy.yml`; se comprobó renombrando el job `tests` a propósito (falló) y regresándolo. `docs/README.md` explica la regla, el remoto `directo` y qué hacer si un check falla.
