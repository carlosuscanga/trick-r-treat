# Tareas

Tablero del proyecto, como un Jira en markdown. Cada tarea es un archivo `T-NNN-titulo-corto.md` en esta carpeta. El proceso completo está en [`docs/README.md`](../README.md).

## Estado actual

Se actualiza al cerrar cada sesión. Es lo primero que se lee al retomar el trabajo.

- **Última sesión (2026-10-17):** se cerró T-035 (PR #10). El repo ya tiene el skill `rendimiento-y-memoria` (`.claude/skills/`), la regla por ruta `.claude/rules/rendimiento.md` y una línea en `CLAUDE.md`: las sesiones que toquen escenas cargan las reglas de la guía de T-034 sin que se pida.
  - **Evaluaciones (con y sin skill, calificación a ciegas):** con skill, Sonnet cumple 33/34 puntos y 23/23 críticos; sin skill, 23/34 y 15/23. La diferencia está al escribir código; en planear y revisar casi no la hay. Opus solo se corrió en e0 y Haiku no, por el límite de uso.
  - **Activación:** 7/10 con lo que se entrega y 0 falsos positivos. Sin `paths` en el frontmatter.
  - **Bases mínimas:** si falta infraestructura de otra tarea, se crea lo mínimo con `// mínima; T-0NN la completa`. La `?depurar` mínima es solo `window.__juego` para los e2e.
  - **Lección de uso:** las corridas `claude -p` en paralelo agotaron la ventana de 5 horas; se corren de una en una. Detalle y resultados en la bitácora de T-035 y en `.local/t035/`.
- **Sesión (2026-10-16, noche):** se cerró T-034 (investigación de performance, memoria y caché). Se investigó con 5 subagentes en paralelo y un redactor, y la guía se mergeó en el PR #9 (`docs/planes/T-034-performance-y-memoria.md`): 46 reglas con ID, presupuestos para el iPhone 13 (iOS 26.6) y checklist de PR.
  - **Decisiones del product owner (aceptó las 8):** `disablePreFX`; guardar y reanudar la partida en H3; arte a 720 y 1x; se respeta el interruptor de silencio, con un ícono de bocina silenciada como recordatorio; la pantalla de inicio es el modo oficial; assets en `src/assets/` con hash; `?depurar` en producción; física declarada por escena.
  - **Tareas nuevas:** T-035 a T-043 (skill, presupuesto de bundle, `EscenaBase` y `?depurar`, config WebGL, assets versionados, manifest de assets, medición en el iPhone, guardar partida y service worker). Phaser sin Matter quedó en el cajón v1.1.
  - Los informes completos de los subagentes están en `.local/t034/` (local, sin respaldo). Además, la revisión en Plannotator pasó a ser opcional: Claude pregunta "¿aquí o en Plannotator?" (`CLAUDE.md`).
- **Sesión (2026-10-16, tarde):** primera sesión con tareas en paralelo: una sesión orquestadora en `main` y una trabajadora por tarea. Se cerraron T-002, T-003 y T-006, y de lo que fue saliendo, T-031 y T-033.
  - **T-002 (PR #2):** `main` se publica sola en https://carlosuscanga.github.io/trick-r-treat/. Probado en Safari del iPhone.
  - **T-003 (PR #6):** pantalla base con ancho variable (zona segura de 1280×720), aviso de girar, audio tras el primer toque y modo pantalla de inicio. Probada en el iPhone, en local y en Pages.
  - **T-006 (PR #3):** `GameState` (dulces en medios, sustos, casas) y los JSON de disfraces y vecinos. Trajo Vitest y la regla **"todo lleva tests"**.
  - **T-031 (PR #4) y T-033 (PR #7):** un ruleset en `main` exige `tests`, `build` y `e2e` en verde y la rama al día. Se probó con PRs rotos a propósito (#5 y #8), que quedaron bloqueados. Los pushes directos a `main` (tablero) van con una deploy key, y solo los hace la orquestadora.
  - **Seguridad:** las sesiones usan un token *fine-grained* solo de este repo y sin Administration (ver "Credenciales de GitHub" en `docs/README.md`). El login global de `gh` de la Mac ya no se usa en este proyecto.
  - **Flujo:** `docs/README.md` ya recoge lo visto: el merge lo hace solo la orquestadora, los criterios que solo se verifican en `main` se marcan al cerrar, el orden de limpieza de los worktrees, cómo retomar sesiones, la prueba manual en los PRs visuales y que todo plan lleva su sección "Pruebas".
  - Node: `.nvmrc` fija la 24, pero `engines` en `package.json` dice `>=22.12.0`. No bloquea nada.
- **Fase:** H1 · Esqueleto en el iPhone. Falta T-004 para cerrar el hito (T-036 va en paralelo).
- **Siguiente paso:** T-045 (modelo y esfuerzo en la plantilla de planes) y luego el plan de T-004, ya con el skill cargado, con su plan de contingencia (A′: otros esquemas táctiles; B: computadora con teclado). En paralelo se pueden hacer T-036 (presupuesto de bundle), T-005 (investigación de minijuegos), T-012 (pipeline de arte; seguir las reglas de arte de la guía: NPOT, ≤ 2048 px, 1x y atlas por escena), T-018 (nombre del juego) y T-030 (cierre automático; ahora tiene que convivir con el ruleset: el plan de T-031 propone una segunda deploy key como *secret*).
- **Pendiente de decidir:** el plan de T-004 (después de T-045). Después de T-004, volver a medir la activación del skill (`docs/planes/T-035-evaluaciones/activacion.py --variante con-config`); si queda por debajo de 8/10, ajustar la `description`. Para T-037: corregir el `POST_STEP` de TEX-07 en la guía y decidir sobre `window.__juego`. Si la regla de pushes directos a `main` (`docs/README.md`) debe incluir también los cambios a `CLAUDE.md`. Las revisiones con Mi vo fuera de la demo, cuando el product owner lo decida. T-032 (tutorial de pantalla de inicio) queda en prioridad baja y no bloquea la demo.
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

- **Controles táctiles en iOS:** T-004, con plan de contingencia (A′: otros esquemas táctiles; B: computadora con teclado). Se decide al cerrar T-004.
- **Pipeline de arte cutout:** T-012, antes de H3.
- **Latencia de audio para Ritmo:** T-022.
- **Memoria en el iPhone (recarga silenciosa por jetsam):** T-037 (fugas), T-041 (medición) y T-042 (guardar partida).
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
| [T-004](T-004-prueba-controles.md) | Prueba de controles táctiles | codigo | pendiente | alta | T-003, T-034, T-035, T-045 | requerido |
| [T-005](T-005-investigar-minijuegos.md) | Investigar minijuegos de referencia | investigacion | pendiente | alta | — | — |
| [T-030](T-030-cierre-automatico-tareas.md) | Cierre automático de tareas al hacer merge | codigo | pendiente | media | T-002 | — |
| [T-031](T-031-tests-obligatorios-antes-del-merge.md) | Tests obligatorios antes del merge | codigo | hecha | alta | T-006 | [plan](../planes/T-031-tests-obligatorios-antes-del-merge.md) |
| [T-033](T-033-e2e-obligatorio.md) | e2e obligatorio antes del merge | codigo | hecha | alta | T-003, T-031 | — |
| [T-034](T-034-performance-y-memoria.md) | Investigar performance, memoria y caché | investigacion | hecha | alta | T-003 | [guía](../planes/T-034-performance-y-memoria.md) |
| [T-035](T-035-skill-rendimiento-y-memoria.md) | Crear el skill `rendimiento-y-memoria` y su regla por ruta | codigo | hecha | alta | T-034 | — |
| [T-036](T-036-presupuesto-de-bundle-en-ci.md) | Presupuesto de bundle en CI | codigo | pendiente | alta | T-034 | — |
| [T-045](T-045-modelo-y-esfuerzo-en-planes.md) | Modelo y esfuerzo por paso en los planes | codigo | pendiente | alta | — | — |

```
A (ruta crítica)  T-001 ─→ T-003 ─→ T-034 ─→ T-035 ─→ T-004   ← el skill va antes de programar T-004
B                     └──→ T-002 ─→ T-030
C                 T-005                       ← desde ya
D (CI)            T-006 ─→ T-031 ─→ T-033     ← T-006 es de H2; no en paralelo con T-030
E (presupuestos)                        └──→ T-036            ← en paralelo con T-035 y T-004
F (proceso)       T-045                       ← antes del plan de T-004; en paralelo con T-035
```

### H2 · Bucle completo

Al final: una partida entera con cajas de colores y 1 minijuego.

| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |
|----|-------|------|--------|------|---------|------|
| [T-006](T-006-gamestate-y-datos.md) | GameState y datos en JSON | codigo | hecha | alta | T-001 | [plan](../planes/T-006-gamestate-y-datos.md) |
| [T-007](T-007-flujo-de-escenas.md) | Flujo de escenas placeholder | codigo | pendiente | alta | T-004, T-006, T-037, T-038 | — |
| [T-008](T-008-calle-de-8-casas.md) | Calle de 8 casas con sorteo | codigo | pendiente | alta | T-007 | — |
| [T-009](T-009-catalogo-de-minijuegos.md) | Catálogo de minijuegos y contrato | codigo | pendiente | alta | T-007 | requerido |
| [T-010](T-010-minijuego-lluvia-de-dulces.md) | Minijuego Lluvia de dulces | codigo | pendiente | alta | T-009 | — |
| [T-011](T-011-hud-y-fin-de-partida.md) | HUD y fin de partida | codigo | pendiente | alta | T-008 | — |
| [T-012](T-012-prueba-pipeline-arte.md) | Prueba del pipeline de arte | investigacion | pendiente | alta | — | — |
| [T-037](T-037-escena-base-depurar-y-fugas.md) | `EscenaBase`, `?depurar` y e2e de fugas | codigo | pendiente | alta | T-034 | — |
| [T-038](T-038-config-rendimiento-y-webgl.md) | Config de rendimiento y robustez WebGL | codigo | pendiente | alta | T-034 | — |
| [T-039](T-039-assets-versionados.md) | Assets versionados y aviso de versión nueva | codigo | pendiente | alta | T-034 | — |
| [T-041](T-041-medicion-en-el-iphone-13.md) | Medición en el iPhone 13 y calibración de presupuestos | investigacion | pendiente | alta | T-037 | — |

```
A (ruta crítica)  T-037 ─┬→ T-007 ─→ T-009 ─→ T-010
B                 T-038 ─┘      └──→ T-008 ─→ T-011   ← T-037 y T-038 en paralelo, ambas antes de T-007
C                 T-006                       ← puede adelantarse a H1, tras T-001
D (arte)          T-012                       ← desde ya; debe cerrar antes de H3
E (assets)        T-039                       ← desde ya; antes del primer arte (T-013 a T-015)
F (medición)      T-037 ─→ T-041              ← en el iPhone; se repite en H3 con el arte real
```

### H3 · La demo → `hito-h3`

Al final: el bucle con 1 minijuego, ya con arte, sonido, nombre y celebración. Mi vo lo juega.

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
| [T-043](T-043-service-worker-y-manifest.md) | Service worker, manifest y chunk *vendor* | codigo | pendiente | baja | T-039, T-018 | — |

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
