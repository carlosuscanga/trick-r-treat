---
id: T-030
titulo: Cierre automático de tareas al hacer merge
tipo: codigo
hito: H1
estado: pendiente
prioridad: media
depende: [T-002]
plan: null
---

## Qué

Una GitHub Action que corre al mergear un PR a `main`. Si el título del PR empieza con un ID (`T-NNN: …`), pasa la tarea a `hecha` en su archivo y en el tablero, y hace commit a `main`.

## Por qué

El paso 6 del flujo ("Merge y cierre") tiene una parte mecánica que es fácil olvidar: cambiar el estado en dos lugares. El merge puede hacerse desde la web de GitHub, sin ninguna sesión de Claude abierta, así que un hook de Claude Code no alcanza: tiene que correr en GitHub.

El "Estado actual" **no** se automatiza, porque contar qué se hizo y qué sigue requiere criterio. Lo sigue escribiendo la sesión que cierra.

## Criterios de aceptación

- [ ] Al mergear un PR `T-NNN: …`, la tarea queda `hecha` en su frontmatter y en su fila del tablero, en un solo commit a `main` hecho por la Action.
- [ ] Un PR sin ID en el título no cambia nada.
- [ ] Si algo falla (la tarea no existe o no está `en-progreso`), la Action falla de forma visible en GitHub y no deja `main` a medias.
- [ ] `docs/README.md` (paso 6) explica qué hace la Action y qué sigue siendo manual: el "Estado actual" y borrar la rama local.
- [ ] Probado con un PR real.

## Bitácora

- 2026-10-16: creada al cerrar T-001. Se eligió una GitHub Action en lugar de un hook de Claude Code porque el merge puede hacerse desde la web. Va después de T-002, que introduce GitHub Actions para Pages, para aprender la herramienta una sola vez. Riesgo conocido: los commits del bot en `main` pueden chocar con commits locales, así que siempre hay que hacer `git pull` antes de editar `main`.
