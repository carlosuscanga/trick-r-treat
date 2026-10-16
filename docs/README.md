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

## Trabajo en paralelo (worktrees)

Cada tarea en progreso vive en su propio **worktree**: una carpeta aparte, con su rama, del mismo repo. Así varias tareas avanzan a la vez sin pisarse.

1. **Elegir:** solo tareas cuyas dependencias estén `hecha`. Los carriles del tablero dicen qué puede ir en paralelo. No hay límite fijo de tareas abiertas: si se acumulan PRs sin revisar o las ramas se alejan mucho de `main`, abrir menos.
2. **Arrancar (en `main`):** marcar la tarea `en-progreso` en su archivo y en el tablero, hacer commit y push. Así cualquier sesión sabe qué está tomado.
3. **Crear el worktree:** con la herramienta nativa de Claude Code, en `.claude/worktrees/` (ignorada por git). La herramienta parte de `origin/main`, y por eso el paso 2 hace push antes. Nombra la rama `worktree-T-NNN-titulo`, así que hay que renombrarla enseguida con `git branch -m T-NNN-titulo`. Adentro: `nvm use`, `npm install` y `npm run build` para confirmar que se parte de una base limpia. Cada worktree usa su propio puerto de `vite`.
4. **Trabajar:** en la rama se editan el código, el plan y **solo el archivo de su propia tarea** (criterios y bitácora). El tablero y el "Estado actual" **no se tocan en las ramas**, para evitar conflictos.
5. **Pull request:** push de la rama y PR a `main`, con el ID en el título (`T-007: flujo de escenas placeholder`). El product owner lo revisa en GitHub (diff, comentarios, `/code-review`).
6. **Merge y cierre (en `main`):** merge sin squash, para conservar los commits pequeños. Después, en `main`: la tarea pasa a `hecha` en su archivo y en el tablero, y se actualiza el "Estado actual". Se borran la rama y el worktree. El hook de seguridad `dcg` no deja que el agente borre ramas, así que el borrado de la rama local lo hace el product owner (`git branch -d T-NNN-titulo`).

## Sesiones con Claude

- **Al empezar:** preguntar "¿qué sigue?". Claude lee el "Estado actual" y el tablero (`tareas/README.md`) y propone la siguiente tarea.
- **Durante:** una tarea por worktree. Decisiones y bloqueos van a la bitácora de la tarea.
- **Al terminar:** Claude actualiza la bitácora en la rama, y el estado, el tablero y el "Estado actual" en `main`.

## Definición de "hecho"

Una tarea está `hecha` cuando:

1. Cumple todos sus criterios de aceptación.
2. `npm run build` pasa y se probó en el navegador (y en el celular si toca controles o pantalla).
3. Está en `main` mediante un PR mergeado.
4. La tarea y el tablero están actualizados.

Las tareas de diseño están hechas cuando el cambio está en `diseno/` y registrado en `CAMBIOS.md`.
