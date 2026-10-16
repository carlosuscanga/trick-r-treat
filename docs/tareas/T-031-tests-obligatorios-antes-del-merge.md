---
id: T-031
titulo: Tests obligatorios antes del merge
tipo: codigo
hito: H1
estado: pendiente
prioridad: alta
depende: [T-006]
plan: null
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
