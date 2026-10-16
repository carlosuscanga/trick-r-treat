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

## Conceptos

- **Hito**: un objetivo con algo jugable al final (como un *release* de Jira). Cada tarea pertenece a un hito.
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
- Una rama por tarea: `T-005-calle-con-puertas`.
- Commits pequeños, en español e imperativo, con el ID: `T-005: añade escena Calle con puertas placeholder`.
- Al cerrar una versión del diseño: tag `diseno-vX.Y`. Para ver una versión vieja: `git show diseno-v0.1:docs/diseno/reglas.md`.

## Sesiones con Claude

- **Al empezar:** preguntar "¿qué sigue?". Claude lee el tablero y propone la siguiente tarea.
- **Durante:** una tarea `en-progreso` a la vez. Decisiones y bloqueos van a la bitácora de la tarea.
- **Al terminar:** Claude actualiza el estado de la tarea, su bitácora y el tablero.

## Definición de "hecho"

Una tarea está `hecha` cuando:

1. Cumple todos sus criterios de aceptación.
2. `npm run build` pasa y se probó en el navegador (y en el celular si toca controles o pantalla).
3. Está en `main`.
4. La tarea y el tablero están actualizados.

Las tareas de diseño están hechas cuando el cambio está en `diseno/` y registrado en `CAMBIOS.md`.
