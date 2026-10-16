# Tareas

Tablero del proyecto, como un Jira en markdown. Cada tarea es un archivo `T-NNN-titulo-corto.md` en esta carpeta. El proceso completo está en [`docs/README.md`](../README.md).

## Estado actual

Se actualiza al cerrar cada sesión. Es lo primero que se lee al retomar el trabajo.

- **Última sesión (2026-10-16, tarde):** primera sesión con tareas en paralelo: una sesión orquestadora en `main` y una trabajadora por tarea. Se cerraron T-002, T-003 y T-006, y de lo que fue saliendo, T-031 y T-033.
  - **T-002 (PR #2):** `main` se publica sola en https://carlosuscanga.github.io/trick-r-treat/. Probado en Safari del iPhone.
  - **T-003 (PR #6):** pantalla base con ancho variable (zona segura de 1280×720), aviso de girar, audio tras el primer toque y modo pantalla de inicio. Probada en el iPhone, en local y en Pages.
  - **T-006 (PR #3):** `GameState` (dulces en medios, sustos, casas) y los JSON de disfraces y vecinos. Trajo Vitest y la regla **"todo lleva tests"**.
  - **T-031 (PR #4) y T-033 (PR #7):** un ruleset en `main` exige `tests`, `build` y `e2e` en verde y la rama al día. Se probó con PRs rotos a propósito (#5 y #8), que quedaron bloqueados. Los pushes directos a `main` (tablero) van con una deploy key, y solo los hace la orquestadora.
  - **Seguridad:** las sesiones usan un token *fine-grained* solo de este repo y sin Administration (ver "Credenciales de GitHub" en `docs/README.md`). El login global de `gh` de la Mac ya no se usa en este proyecto.
  - **Flujo:** `docs/README.md` ya recoge lo visto: el merge lo hace solo la orquestadora, los criterios que solo se verifican en `main` se marcan al cerrar, el orden de limpieza de los worktrees, cómo retomar sesiones, la prueba manual en los PRs visuales y que todo plan lleva su sección "Pruebas".
  - Node: `.nvmrc` fija la 24, pero `engines` en `package.json` dice `>=22.12.0`. No bloquea nada.
- **Fase:** H1 · Esqueleto en el iPhone. Solo falta T-004 para cerrar el hito.
- **Siguiente paso:** T-004 (prueba de controles táctiles), en la ruta crítica. Primero su plan, con el plan de contingencia (A′: otros esquemas táctiles; B: computadora con teclado). En paralelo se pueden hacer T-005 (investigación de minijuegos), T-012 (pipeline de arte), T-018 (nombre del juego) y T-030 (cierre automático; ahora tiene que convivir con el ruleset: el plan de T-031 propone una segunda deploy key como *secret*).
- **Pendiente de decidir:** el plan de T-004. Las revisiones con Mi vo fuera de la demo, cuando el product owner lo decida. T-032 (tutorial de pantalla de inicio) queda en prioridad baja y no bloquea la demo.
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

**Ruta crítica hasta la demo:** T-001 → T-003 → T-004 → T-007 → T-009 → T-010 → T-015 → T-020 → T-021.

**Riesgos:**

- **Controles táctiles en iOS:** T-004, con plan de contingencia (A′: otros esquemas táctiles; B: computadora con teclado). Se decide al cerrar T-004.
- **Pipeline de arte cutout:** T-012, antes de H3.
- **Latencia de audio para Ritmo:** T-022.
- **Alcance que crece:** tope de 4 a 6 minijuegos y el cajón v1.1.

## Tablero

Una tabla por hito. Los **carriles** muestran qué se puede hacer al mismo tiempo: las tareas de un carril van en secuencia, y los carriles distintos avanzan en paralelo.

### H1 · Esqueleto en el iPhone

Al final: un rectángulo camina y salta en el iPhone desde un link público.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-001](T-001-limpieza-tecnica.md) | Limpieza técnica del entorno | codigo | hecha | alta | — | — |
| [T-002](T-002-despliegue-github-pages.md) | Despliegue automático a GitHub Pages | codigo | hecha | alta | T-001 | [plan](../planes/T-002-despliegue-github-pages.md) |
| [T-003](T-003-pantalla-base.md) | Pantalla base para iPhone | codigo | hecha | alta | T-001 | [plan](../planes/T-003-pantalla-base.md) |
| [T-004](T-004-prueba-controles.md) | Prueba de controles táctiles | codigo | pendiente | alta | T-003 | requerido |
| [T-005](T-005-investigar-minijuegos.md) | Investigar minijuegos de referencia | investigacion | pendiente | alta | — | — |
| [T-030](T-030-cierre-automatico-tareas.md) | Cierre automático de tareas al hacer merge | codigo | pendiente | media | T-002 | — |
| [T-031](T-031-tests-obligatorios-antes-del-merge.md) | Tests obligatorios antes del merge | codigo | hecha | alta | T-006 | [plan](../planes/T-031-tests-obligatorios-antes-del-merge.md) |
| [T-033](T-033-e2e-obligatorio.md) | e2e obligatorio antes del merge | codigo | hecha | alta | T-003, T-031 | — |

```
A (ruta crítica)  T-001 ─→ T-003 ─→ T-004
B                     └──→ T-002 ─→ T-030
C                 T-005                       ← desde ya
D (CI)            T-006 ─→ T-031 ─→ T-033     ← T-006 es de H2; no en paralelo con T-030
```

### H2 · Bucle completo

Al final: una partida entera con cajas de colores y 1 minijuego.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-006](T-006-gamestate-y-datos.md) | GameState y datos en JSON | codigo | hecha | alta | T-001 | [plan](../planes/T-006-gamestate-y-datos.md) |
| [T-007](T-007-flujo-de-escenas.md) | Flujo de escenas placeholder | codigo | pendiente | alta | T-004, T-006 | — |
| [T-008](T-008-calle-de-8-casas.md) | Calle de 8 casas con sorteo | codigo | pendiente | alta | T-007 | — |
| [T-009](T-009-catalogo-de-minijuegos.md) | Catálogo de minijuegos y contrato | codigo | pendiente | alta | T-007 | requerido |
| [T-010](T-010-minijuego-lluvia-de-dulces.md) | Minijuego Lluvia de dulces | codigo | pendiente | alta | T-009 | — |
| [T-011](T-011-hud-y-fin-de-partida.md) | HUD y fin de partida | codigo | pendiente | alta | T-008 | — |
| [T-012](T-012-prueba-pipeline-arte.md) | Prueba del pipeline de arte | investigacion | pendiente | alta | — | — |

```
A (ruta crítica)  T-007 ─→ T-009 ─→ T-010
B                     └──→ T-008 ─→ T-011
C                 T-006                       ← puede adelantarse a H1, tras T-001
D (arte)          T-012                       ← desde ya; debe cerrar antes de H3
```

### H3 · La demo → `hito-h3`

Al final: el bucle con 1 minijuego, ya con arte, sonido, nombre y celebración. Mi vo lo juega.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-013](T-013-arte-mi-vo-gata.md) | Mi vo cutout con el disfraz de Gata negra | arte | pendiente | alta | T-007, T-012 | — |
| [T-014](T-014-arte-calle-y-vecinos.md) | Calle con parallax, casas y vecinos | arte | pendiente | alta | T-008, T-012 | — |
| [T-015](T-015-arte-lluvia-de-dulces.md) | Arte de Lluvia de dulces | arte | pendiente | alta | T-010 | — |
| [T-016](T-016-sustos-animados.md) | Sustos animados | arte | pendiente | media | T-014 | — |
| [T-017](T-017-musica-y-sonido.md) | Música y sonidos | codigo | pendiente | media | T-003 | — |
| [T-018](T-018-nombre-del-juego.md) | Nombre del juego | diseno | pendiente | media | — | — |
| [T-019](T-019-menu-y-celebracion.md) | Menú, selector y celebración con arte | arte | pendiente | media | T-011, T-018 | — |
| [T-020](T-020-entrega-demo.md) | Pulido y entrega de la demo | codigo | pendiente | alta | T-013 … T-019 | — |
| [T-021](T-021-playtest-demo-mi-vo.md) | Playtest de la demo con Mi vo | investigacion | pendiente | alta | T-020 | — |
| [T-032](T-032-tutorial-pantalla-de-inicio.md) | Tutorial para añadir el juego a la pantalla de inicio | codigo | pendiente | baja | T-003, T-018 | — |

```
A (personaje)   T-013 ──────────┐
B (escenario)   T-014 ─→ T-016 ─┤
C (minijuego)   T-015 ──────────┼─→ T-020 ─→ T-021
D (audio)       T-017 ──────────┤      ← puede adelantarse desde H1, tras T-003
E (identidad)   T-018 ─→ T-019 ─┘      ← T-018 puede pensarse desde ya
F (inicio)          └──→ T-032          ← opcional: no bloquea la demo
```

### H4 · Minijuegos

Al final: una partida variada, con 4 a 6 minijuegos, cada uno con su arte y su disfraz.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-022](T-022-prueba-latencia-audio.md) | Prueba de latencia de audio en iPhone | investigacion | pendiente | media | T-003 | — |
| [T-023](T-023-elegir-minijuegos-v1.md) | Elegir los minijuegos y disfraces de la v1 | diseno | pendiente | alta | T-004, T-005, T-021, T-022 | — |
| [T-024](T-024-construir-minijuegos-elegidos.md) | Construir los minijuegos elegidos | codigo | pendiente | alta | T-009, T-013, T-023 | — |
| [T-025](T-025-balance-dificultad-y-ventajas.md) | Balance de dificultades y ventajas | diseno | pendiente | media | T-024 | — |

T-022 puede hacerse en cualquier momento después de T-003. T-024 se parte en una subtarea por minijuego, y esas subtareas van en paralelo.

### H5 · Exploración y v1 → `v1.0`

Al final: el juego completo, con trepar, romper y dulces de ½. El regalo.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-026](T-026-definir-exploracion.md) | Definir la exploración | diseno | pendiente | media | — | — |
| [T-027](T-027-trepar-y-techos.md) | Trepar árboles y subir a techos | codigo | pendiente | media | T-008, T-026 | — |
| [T-028](T-028-romper-objetos-y-medio-dulce.md) | Romper objetos y dulces de ½ | codigo | pendiente | media | T-008, T-026 | — |
| [T-029](T-029-entrega-v1.md) | Pulido final y entrega de la v1 | codigo | pendiente | alta | todas | — |

T-026 puede definirse en cualquier momento. T-027 y T-028 van en paralelo.

### Cajón v1.1

Lo que queda fuera de la v1 a propósito. No tiene tareas todavía.

- Los minijuegos que no entren en T-023, junto con los disfraces de sus tipos.
- Todo [`ideas.md`](../diseno/ideas.md): ítems, disfraces encontrables, carrera contra rivales y mini misiones.

## Estados

- `pendiente`: aún no empieza.
- `en-progreso`: se está trabajando, en su propio worktree. Puede haber varias a la vez.
- `bloqueada`: no puede avanzar. Anotar el motivo en la bitácora.
- `hecha`: cumple la definición de "hecho" de [`docs/README.md`](../README.md).

## Reglas

- El estado vive en el frontmatter del archivo **y** en el tablero. Al cambiarlo, actualizar ambos, siempre **en `main`**. Las ramas solo tocan los criterios y la bitácora de su propia tarea.
- Los archivos no se mueven ni se borran al terminar; solo cambia el estado.
- Una tarea grande se parte en subtareas con su propio ID.
- Los IDs son consecutivos y no se reutilizan.
- Si la tarea toca varios archivos o tiene decisiones técnicas, se escribe un plan en `docs/planes/` con el mismo ID antes de programar.

## Plantilla

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
