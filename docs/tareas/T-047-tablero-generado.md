---
id: T-047
titulo: Tablero generado desde el frontmatter
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: []
plan: null
rama: T-047-tablero-generado
worktree: null
---

## Qué

Que el frontmatter de cada tarea sea la **única fuente** de sus datos (título, tipo, estado, prioridad, dependencias y plan), y que las tablas del tablero (`docs/tareas/README.md`) se **generen** con un script (`npm run tablero`).

1. Un script lee todos los `docs/tareas/T-*.md` y reescribe solo las tablas de cada hito, entre marcas en el README. Lo demás del tablero (Estado actual, carriles, riesgos y planeación) se sigue escribiendo a mano.
2. El script valida los datos: estados, tipos, hitos y prioridades permitidos, y dependencias que existen.
3. `npm test` falla si el tablero no coincide con los frontmatter, así el check `tests` del CI lo atrapa sin tocar el ruleset.
4. Las reglas de `CLAUDE.md`, `docs/README.md` y `docs/tareas/README.md` dicen "cambia el frontmatter y corre `npm run tablero`", en lugar de "actualiza ambos".

## Por qué

Hoy el estado vive en dos lugares, el frontmatter y la fila del tablero, y se actualizan a mano. Eso suma pasos a cada cierre de tarea y ya se desfasaron: T-035 tiene plan en su frontmatter y el tablero dice "—". Salió de la retro de proceso del 2026-10-18. Prepara T-030, que solo tendrá que cambiar un campo.

## Criterios de aceptación

- [ ] `npm run tablero` regenera las tablas de H1 a H5 desde los frontmatter, sin tocar el resto del README.
- [ ] Datos inválidos (estado desconocido, dependencia que no existe) hacen fallar el script con un mensaje claro.
- [ ] `npm test` falla si el tablero está desfasado.
- [ ] Los desfases de hoy quedan corregidos en el frontmatter (por ejemplo, el plan de T-035).
- [ ] Las reglas de proceso ya no piden actualizar ambos.
- [ ] Pruebas en tres capas según el plan: unitarias, e2e y manual (o el porqué de la que no aplica).

## Plan

Tarea chica: el plan va aquí y no en `docs/planes/`.

- **Archivos:** `scripts/tablero.ts` (lógica pura: leer frontmatter, validar, generar tablas y reemplazarlas entre marcas `<!-- tablero:HN -->`), `scripts/tablero.mjs` (CLI de `npm run tablero`, que escribe el README) y sus tests en `scripts/`. `tsconfig.json` incluye `scripts/` para revisar tipos.
- **Sin dependencias nuevas:** el frontmatter usa un subconjunto simple de YAML (`clave: valor`, listas `[a, b]`, `null`), así que basta un lector propio. Node 24 corre el `.ts` directo.
- **Formato que se conserva:** orden por ID dentro de cada hito; dependencias seguidas de 3 o más se abrevian (`T-013 … T-019`); `plan:` acepta `null`, `requerido` o la ruta `docs/planes/….md`.
- **Pruebas:**
  - Unitarias (`npm test`): lector de frontmatter, validaciones (estado, tipo, hito o prioridad desconocidos; dependencia inexistente; ID que no coincide con el archivo; plan que no existe), abreviación de dependencias, reemplazo entre marcas (y error si falta una), y un test "tablero al día" que lee los archivos reales con `import.meta.glob` y compara.
  - e2e: no aplica, no hay nada en el navegador.
  - Manual (en la Mac, no en el iPhone): cambiar un estado, correr `npm run tablero` y ver el diff; desfasar el tablero a mano y ver fallar `npm test`. Tabla en el PR.
- **Modelo y esfuerzo:** la sesión principal (Opus, `high`) programa directo, porque es chica y un subagente gastaría más en arrancar que en hacerla. Revisión con `code-reviewer-opus55` (`high`).

## Bitácora

- 2026-10-18: creada en la retro de proceso. El product owner la aprueba y arranca de una vez. Va en el carril F (proceso) de H1 y no bloquea T-037.
- 2026-10-18: **desvío del proceso, decidido por el product owner:** por ser chica, se hace en la sesión de `main`, en una rama sin worktree y con el plan dentro de la tarea. El PR sigue siendo obligatorio por el ruleset. Esta rama toca el tablero y frontmatters de otras tareas: es el objetivo de la tarea, y conviene mergearla antes de cerrar otra.
