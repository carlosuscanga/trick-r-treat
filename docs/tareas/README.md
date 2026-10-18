# Tareas

Tablero del proyecto, como un Jira en markdown. Cada tarea es un archivo `T-NNN-titulo-corto.md` en esta carpeta. El proceso completo está en [`docs/README.md`](../README.md).

## Estado actual

Solo lo vigente. Se actualiza al cerrar cada sesión, y lo que se hizo en cada una va arriba de [`historial.md`](historial.md). Para seguir una sola tarea basta con "retoma T-NNN" ([`docs/README.md`](../README.md), "Sesiones con Claude").

- **Fase:** H2 · Bucle completo. H1 cerró el 2026-10-18 (tag `hito-h1`): el rectángulo camina y salta en el iPhone desde Pages (T-004, **plan A**), y el CI ya tiene presupuesto de bundle (T-036). T-005, T-030 y T-047 pasaron a H2.
- **En curso:** nada. T-047 cerró: las tablas del tablero se generan con `npm run tablero` desde el frontmatter y ya no se editan a mano.
- **Siguiente paso:** T-037 (`EscenaBase`, `?depurar` y e2e de fugas), que sigue en la ruta crítica. El JS inicial pesa 317.6 de 340 KiB: si un PR se pasa, no se sube el límite sin decisión del product owner (T-036, "Riesgos" del plan). En paralelo se pueden hacer T-005 (investigación de minijuegos), T-012 (pipeline de arte; seguir las reglas de arte de la guía: NPOT, ≤ 2048 px, 1x y atlas por escena), T-018 (nombre del juego) y T-030 (cierre automático; ahora tiene que convivir con el ruleset: el plan de T-031 propone una segunda deploy key como *secret*).
- **Pendiente de decidir:** de la retro de proceso del 2026-10-18 (ver historial): proceso según el tamaño de la tarea (T-047 ya probó "plan dentro de la tarea" para una tarea chica), estimación S/M/L contra lo real, podar reglas en cada retro de hito, pendientes con fecha, una mini revisión con Mi vo al cerrar H2 y bajar T-038 a T-040 hasta tener la medición de T-041. Si T-029 debe depender también de T-030 a T-047 (hoy solo de T-001 a T-028). Volver a medir la activación del skill (`docs/planes/T-035-evaluaciones/activacion.py --variante con-config`); si queda por debajo de 8/10, ajustar la `description`. Para T-037: corregir el `POST_STEP` de TEX-07 en la guía y decidir sobre `window.__juego`. Si la regla de pushes directos a `main` (`docs/README.md`) debe incluir también los cambios a `CLAUDE.md`. Las revisiones con Mi vo fuera de la demo, cuando el product owner lo decida. T-032 (tutorial de pantalla de inicio) queda en prioridad baja y no bloquea la demo.
- **Al retomar:** abrir Claude desde la carpeta principal, para que cargue el token del proyecto. Comprobar con `gh auth status` que sale `github_pat_…`.

## Planeación de la v1

Decidida el 2026-10-16.

| Decisión | Elegido | Por qué |
|---|---|---|
| Fecha límite | **Sin fecha** | La restricción dominante es el alcance. El orden va por riesgo y aprendizaje. |
| Hitos | **5, por riesgo, con una demo entregable en H3** | El riesgo técnico (táctil en iOS) va primero. A mitad de camino hay una demo con arte y sonido. |
| La demo (H3) | **Para el product owner y para Mi vo** | Mi vo actúa como cliente: su reacción decide en qué invertir antes de multiplicar los minijuegos. La v1 no es sorpresa. |
| Revisiones con Mi vo | **Las decide el product owner** | Solo el playtest de la demo (T-021) es tarea fija. Las demás se registran como tarea cuando se hagan. |
| Minijuegos en la v1 | **Mínimo 4, hasta 6** | Ritmo y Plataformas entran solo si pasan su prueba de riesgo. Los disfraces de tipos sin minijuego pasan a v1.1. |
| Primer minijuego | **Lluvia de dulces** (con la Gata negra) | Es el más definido, se entiende rápido y prueba el arrastre táctil y el catálogo. |
| Diseño de minijuegos | **Se define al implementar** | Definir lo mínimo, construir, afinar jugando y documentar, sin tarea de diseño aparte. Desde H4, cada minijuego trae su arte, sonido y disfraz. |
| Tags | `hito-h1` … `hito-h5` y `v1.0` | "v0.X" siempre se refiere al diseño, nunca al juego. |

Se planea por oleadas: H1 a H3 van detallados, y H4 y H5 tienen tareas gruesas que se parten al llegar.

**Ruta crítica hasta la demo:** T-001 → T-003 → T-034 → T-035 → T-004 → T-037 → T-007 → T-009 → T-010 → T-015 → T-020 → T-021.

**Riesgos:**

- **Controles táctiles en iOS:** T-004 cerró con **plan A** (2026-10-18): joystick y botones táctiles en web, sin contingencia.
- **Pipeline de arte cutout:** T-012, antes de H3.
- **Latencia de audio para Ritmo:** T-022.
- **Memoria en el iPhone (recarga silenciosa por jetsam):** T-037 (fugas), T-041 (medición) y T-042 (guardar partida).
- **Alcance que crece:** tope de 4 a 6 minijuegos y el cajón v1.1.

## Tablero

Una tabla por hito. Las tablas se **generan** con `npm run tablero` desde el frontmatter de cada tarea: no se editan a mano (`npm test` falla si quedan desfasadas). Los **carriles** muestran qué se puede hacer al mismo tiempo: las tareas de un carril van en secuencia, y los carriles distintos avanzan en paralelo.

### H1 · Esqueleto en el iPhone

Al final: un rectángulo camina y salta en el iPhone desde un link público.

<!-- tablero:H1 -->

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-001](T-001-limpieza-tecnica.md) | Limpieza técnica del entorno | codigo | hecha | alta | — | — |
| [T-002](T-002-despliegue-github-pages.md) | Despliegue automático a GitHub Pages | codigo | hecha | alta | T-001 | [plan](../planes/T-002-despliegue-github-pages.md) |
| [T-003](T-003-pantalla-base.md) | Pantalla base para iPhone | codigo | hecha | alta | T-001 | [plan](../planes/T-003-pantalla-base.md) |
| [T-004](T-004-prueba-controles.md) | Prueba de controles táctiles | codigo | hecha | alta | T-003, T-034, T-035, T-045 | [plan](../planes/T-004-prueba-controles.md) |
| [T-031](T-031-tests-obligatorios-antes-del-merge.md) | Tests obligatorios antes del merge | codigo | hecha | alta | T-006 | [plan](../planes/T-031-tests-obligatorios-antes-del-merge.md) |
| [T-033](T-033-e2e-obligatorio.md) | e2e obligatorio antes del merge | codigo | hecha | alta | T-003, T-031 | — |
| [T-034](T-034-performance-y-memoria.md) | Investigar performance, memoria y caché | investigacion | hecha | alta | T-003 | [plan](../planes/T-034-performance-y-memoria.md) |
| [T-035](T-035-skill-rendimiento-y-memoria.md) | Crear el skill `rendimiento-y-memoria` y su regla por ruta | codigo | hecha | alta | T-034 | [plan](../planes/T-035-skill-rendimiento-y-memoria.md) |
| [T-036](T-036-presupuesto-de-bundle-en-ci.md) | Presupuesto de bundle en CI | codigo | hecha | alta | T-034 | [plan](../planes/T-036-presupuesto-de-bundle-en-ci.md) |
| [T-045](T-045-modelo-y-esfuerzo-en-planes.md) | Modelo y esfuerzo por paso en los planes | codigo | hecha | alta | — | — |
| [T-046](T-046-retomar-tareas-en-sesion-nueva.md) | Retomar una tarea en una sesión nueva | codigo | hecha | media | — | [plan](../planes/T-046-retomar-tareas-en-sesion-nueva.md) |

<!-- /tablero:H1 -->

Cerrado el 2026-10-18 con el tag `hito-h1`. T-005, T-030 y T-047 pasaron a H2.

```
A (ruta crítica)  T-001 ─→ T-003 ─→ T-034 ─→ T-035 ─→ T-004   ← el skill va antes de programar T-004
B                     └──→ T-002
D (CI)            T-006 ─→ T-031 ─→ T-033     ← T-006 es de H2
E (presupuestos)                        └──→ T-036            ← en paralelo con T-035 y T-004
F (proceso)       T-045 ─→ T-046
```

### H2 · Bucle completo

Al final: una partida entera con cajas de colores y 1 minijuego.

<!-- tablero:H2 -->

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-005](T-005-investigar-minijuegos.md) | Investigar minijuegos de referencia | investigacion | pendiente | alta | — | — |
| [T-006](T-006-gamestate-y-datos.md) | GameState y datos en JSON | codigo | hecha | alta | T-001 | [plan](../planes/T-006-gamestate-y-datos.md) |
| [T-007](T-007-flujo-de-escenas.md) | Flujo de escenas placeholder | codigo | pendiente | alta | T-004, T-006, T-037, T-038 | — |
| [T-008](T-008-calle-de-8-casas.md) | Calle de 8 casas con sorteo | codigo | pendiente | alta | T-007 | — |
| [T-009](T-009-catalogo-de-minijuegos.md) | Catálogo de minijuegos y contrato | codigo | pendiente | alta | T-007 | requerido |
| [T-010](T-010-minijuego-lluvia-de-dulces.md) | Minijuego Lluvia de dulces | codigo | pendiente | alta | T-009 | — |
| [T-011](T-011-hud-y-fin-de-partida.md) | HUD y fin de partida | codigo | pendiente | alta | T-008 | — |
| [T-012](T-012-prueba-pipeline-arte.md) | Prueba del pipeline de arte | investigacion | pendiente | alta | — | — |
| [T-030](T-030-cierre-automatico-tareas.md) | Cierre automático de tareas al hacer merge | codigo | pendiente | media | T-002 | — |
| [T-037](T-037-escena-base-depurar-y-fugas.md) | `EscenaBase`, `?depurar` y e2e de fugas | codigo | pendiente | alta | T-034 | — |
| [T-038](T-038-config-rendimiento-y-webgl.md) | Config de rendimiento y robustez WebGL | codigo | pendiente | alta | T-034 | — |
| [T-039](T-039-assets-versionados.md) | Assets versionados y aviso de versión nueva | codigo | pendiente | alta | T-034 | — |
| [T-041](T-041-medicion-en-el-iphone-13.md) | Medición en el iPhone 13 y calibración de presupuestos | investigacion | pendiente | alta | T-037 | — |
| [T-047](T-047-tablero-generado.md) | Tablero generado desde el frontmatter | codigo | hecha | alta | — | — |

<!-- /tablero:H2 -->

```
A (ruta crítica)  T-037 ─┬→ T-007 ─→ T-009 ─→ T-010
B                 T-038 ─┘      └──→ T-008 ─→ T-011   ← T-037 y T-038 en paralelo, ambas antes de T-007
C                 T-006                       ← puede adelantarse a H1, tras T-001
D (arte)          T-012                       ← desde ya; debe cerrar antes de H3
E (assets)        T-039                       ← desde ya; antes del primer arte (T-013 a T-015)
F (medición)      T-037 ─→ T-041              ← en el iPhone; se repite en H3 con el arte real
G (investigación) T-005                       ← desde ya; antes de T-023 (H4)
H (proceso)       T-047 ─→ T-030              ← T-030 tiene que convivir con el ruleset (plan de T-031); no en paralelo con T-047, que también toca el tablero
```

### H3 · La demo → `hito-h3`

Al final: el bucle con 1 minijuego, ya con arte, sonido, nombre y celebración. Mi vo lo juega.

<!-- tablero:H3 -->

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-013](T-013-arte-mi-vo-gata.md) | Mi vo cutout con el disfraz de Gata negra | arte | pendiente | alta | T-007, T-012, T-039 | — |
| [T-014](T-014-arte-calle-y-vecinos.md) | Calle con parallax, casas y vecinos | arte | pendiente | alta | T-008, T-012, T-039 | — |
| [T-015](T-015-arte-lluvia-de-dulces.md) | Arte de Lluvia de dulces | arte | pendiente | alta | T-010, T-039 | — |
| [T-016](T-016-sustos-animados.md) | Sustos animados | arte | pendiente | media | T-014 | — |
| [T-017](T-017-musica-y-sonido.md) | Música y sonidos | codigo | pendiente | media | T-003 | — |
| [T-018](T-018-nombre-del-juego.md) | Nombre del juego | diseno | pendiente | media | — | — |
| [T-019](T-019-menu-y-celebracion.md) | Menú, selector y celebración con arte | arte | pendiente | media | T-011, T-018 | — |
| [T-020](T-020-entrega-demo.md) | Pulido y entrega de la demo | codigo | pendiente | alta | T-013 … T-019 | — |
| [T-021](T-021-playtest-demo-mi-vo.md) | Playtest de la demo con Mi vo | investigacion | pendiente | alta | T-020 | — |
| [T-032](T-032-tutorial-pantalla-de-inicio.md) | Tutorial para añadir el juego a la pantalla de inicio | codigo | pendiente | baja | T-003, T-018 | — |
| [T-040](T-040-manifest-de-assets-y-memoria.md) | Manifest de assets y memoria estimada por escena | codigo | pendiente | media | T-039, T-012 | — |
| [T-042](T-042-guardar-y-reanudar-partida.md) | Guardar y reanudar la partida | codigo | pendiente | media | T-007 | — |

<!-- /tablero:H3 -->

```
A (personaje)   T-013 ──────────┐
B (escenario)   T-014 ─→ T-016 ─┤
C (minijuego)   T-015 ──────────┼─→ T-020 ─→ T-021
D (audio)       T-017 ──────────┤      ← puede adelantarse desde H1, tras T-003
E (identidad)   T-018 ─→ T-019 ─┘      ← T-018 puede pensarse desde ya
F (inicio)          └──→ T-032          ← opcional: no bloquea la demo
G (memoria)     T-040                   ← tras T-039 y T-012, antes del arte pesado
H (partida)     T-042                   ← tras T-007; cambia el diseño v0.2
I (medición)    T-041 (2.ª ronda)       ← con el primer arte real
```

### H4 · Minijuegos

Al final: una partida variada, con 4 a 6 minijuegos, cada uno con su arte y su disfraz.

<!-- tablero:H4 -->

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-022](T-022-prueba-latencia-audio.md) | Prueba de latencia de audio en iPhone | investigacion | pendiente | media | T-003 | — |
| [T-023](T-023-elegir-minijuegos-v1.md) | Elegir los minijuegos y disfraces de la v1 | diseno | pendiente | alta | T-004, T-005, T-021, T-022 | — |
| [T-024](T-024-construir-minijuegos-elegidos.md) | Construir los minijuegos elegidos | codigo | pendiente | alta | T-009, T-013, T-023 | — |
| [T-025](T-025-balance-dificultad-y-ventajas.md) | Balance de dificultades y ventajas | diseno | pendiente | media | T-024 | — |

<!-- /tablero:H4 -->

T-022 puede hacerse en cualquier momento después de T-003. T-024 se parte en una subtarea por minijuego, y esas subtareas van en paralelo.

### H5 · Exploración y v1 → `v1.0`

Al final: el juego completo, con trepar, romper y dulces de ½. El regalo.

<!-- tablero:H5 -->

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-026](T-026-definir-exploracion.md) | Definir la exploración | diseno | pendiente | media | — | — |
| [T-027](T-027-trepar-y-techos.md) | Trepar árboles y subir a techos | codigo | pendiente | media | T-008, T-026 | — |
| [T-028](T-028-romper-objetos-y-medio-dulce.md) | Romper objetos y dulces de ½ | codigo | pendiente | media | T-008, T-026 | — |
| [T-029](T-029-entrega-v1.md) | Pulido final y entrega de la v1 | codigo | pendiente | alta | T-001 … T-028 | — |
| [T-043](T-043-service-worker-y-manifest.md) | Service worker, manifest y chunk *vendor* | codigo | pendiente | baja | T-039, T-018 | — |

<!-- /tablero:H5 -->

T-026 puede definirse en cualquier momento. T-027 y T-028 van en paralelo. T-043 va solo con el juego estable.

### Cajón v1.1

Lo que queda fuera de la v1 a propósito. No tiene tareas todavía.

- Los minijuegos que no entren en T-023, junto con los disfraces de sus tipos.
- Todo [`ideas.md`](../diseno/ideas.md): ítems, disfraces encontrables, carrera contra rivales y mini misiones.
- Phaser sin Matter (alias `dist-arcade`, unos −32 KiB gzip): propuesta en la guía de T-034 y descartada por ahora por el product owner.

## Estados

- `pendiente`: aún no empieza.
- `en-progreso`: se está trabajando, en su propio worktree. Puede haber varias a la vez.
- `bloqueada`: no puede avanzar. Anotar el motivo en la bitácora.
- `hecha`: cumple la definición de "hecho" de [`docs/README.md`](../README.md).

## Reglas

- Los datos de una tarea (estado, prioridad, dependencias, plan) viven **solo en su frontmatter**. Al cambiarlos, correr `npm run tablero`, que regenera las tablas; `npm test` falla si quedan desfasadas. El estado, `rama:` y `worktree:` cambian siempre **en `main`**. Las ramas solo tocan su propia tarea: criterios, bitácora y, si hace falta, `plan:` (con `npm run tablero` y el README que genera).
- Los archivos no se mueven ni se borran al terminar; solo cambia el estado.
- Una tarea grande se parte en subtareas con su propio ID.
- Los IDs son consecutivos y no se reutilizan.
- Si la tarea toca varios archivos o tiene decisiones técnicas, se escribe un plan en `docs/planes/` con el mismo ID antes de programar.

## Plantilla

`plan:` es `null`, `requerido` (todavía no existe, pero hace falta) o la ruta `docs/planes/T-000-titulo.md`. El frontmatter no admite comentarios con `#`.

```markdown
---
id: T-000
titulo: Título corto
tipo: diseno | codigo | arte | bug | investigacion
hito: H1 | H2 | H3 | H4 | H5
estado: pendiente
prioridad: alta | media | baja
depende: []
plan: null
rama: null
worktree: null
---

## Qué

Qué hay que hacer.

## Por qué

Para qué sirve o qué problema resuelve.

## Criterios de aceptación

- [ ] Algo verificable.
- [ ] Pruebas en tres capas según el plan: unitarias, e2e y manual en el iPhone (o el porqué de la que no aplica).

## Bitácora

- AAAA-MM-DD: notas, decisiones y bloqueos.
```
