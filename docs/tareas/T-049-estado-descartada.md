---
id: T-049
titulo: Estado `descartada` en el tablero
tipo: codigo
hito: H2
estado: en-progreso
prioridad: media
depende: []
plan: null
rama: T-049-estado-descartada
worktree: .claude/worktrees/T-049-estado-descartada
---

## Qué

El tablero acepta un quinto estado, `descartada`: la tarea no se va a hacer. Su archivo se queda (los archivos no se borran) y su bitácora dice por qué se descartó.

1. `npm run tablero` acepta `estado: descartada`, y la tarea sigue apareciendo en la tabla de su hito con ese estado.
2. `npm run tarea -- revisar|tomar T-NNN` se niega con una tarea descartada y lo dice.
3. La sección "Estados" de `docs/tareas/README.md` explica el estado nuevo.
4. Después del merge, en `main`: T-030 pasa a `descartada`.

Fuera de alcance: qué pasa con las tareas que dependen de una descartada. Hoy ninguna depende de T-030, y si pasa, `revisar` ya avisa que la dependencia no está `hecha`.

## Por qué

T-030 (cierre automático con una GitHub Action) ya no hace falta, porque "cierra T-NNN" (T-048) cubre el cierre. El product owner decidió descartarla el 2026-10-18, pero el tablero solo tiene `pendiente`, `en-progreso`, `bloqueada` y `hecha`, y la regla dice que los archivos no se borran.

## Criterios de aceptación

- [x] `npm run tablero` acepta `estado: descartada`, y un estado desconocido sigue fallando.
- [x] `revisar` y `tomar` se niegan con una tarea descartada y lo dicen.
- [x] "Estados" en `docs/tareas/README.md` incluye `descartada`.
- [ ] Después del merge, en `main`: T-030 queda `descartada`, con el motivo en su bitácora.
- [ ] Pruebas en tres capas según el plan: unitarias, e2e y manual (o el porqué de la que no aplica).

## Plan

Tarea chica: el plan va aquí y no en `docs/planes/`.

- **Archivos:** `scripts/tablero.ts` (`ESTADOS`), `scripts/tarea.ts` (`revisarLista`: una tarea descartada devuelve `['la tarea está descartada']`, igual que hoy con `hecha`), sus tests (`scripts/tablero.test.ts` y `scripts/tarea.test.ts`) y la sección "Estados" de `docs/tareas/README.md`. `marcarEnProgreso` ya exige `pendiente`, así que no cambia.
- **Pruebas:**
  - Unitarias (`npm test`): el tablero acepta `descartada` y sigue rechazando un estado desconocido; `revisarLista` se niega con una tarea descartada.
  - e2e: no aplica, no cambia nada en el navegador.
  - Manual: no aplica en el iPhone, porque el juego no cambia. En su lugar, en la Mac, después del merge: pasar T-030 a `descartada`, correr `npm run tablero` y `npm run -s tarea -- revisar T-030`.
- **Modelo y esfuerzo:** la sesión principal programa directo, porque son unas pocas líneas y un subagente gastaría más en arrancar. Revisión con `code-reviewer-opus55` (`high`), corta.

## Bitácora

- 2026-10-18: creada al decidir descartar T-030 (decisión del product owner). Nace lista, para probar "toma T-NNN" sobre una tarea lista, que es una de las casillas abiertas de T-048.
- 2026-10-18: tomada. El script la dio por lista y la revisión con criterio no encontró huecos (el tablero no calcula avance por hito, así que no hay que decidir cómo cuenta `descartada`). `tomar` también pasa por `revisarLista`, así que un solo cambio cubre las dos negativas. Unitarias primero (fallaron por el estado no válido), luego el código. `npm test`, `npm run build`, `npm run test:presupuestos` y `npm run test:e2e` en verde. Falta la prueba manual en la Mac, después del merge, con T-030.
