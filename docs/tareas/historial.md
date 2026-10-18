# Historial de sesiones

Lo que se hizo en cada sesión, la más nueva arriba. Al cerrar una sesión, su resumen se agrega aquí arriba y el ["Estado actual"](README.md#estado-actual) se queda solo con lo vigente.

- **Sesión (2026-10-17, noche, "retoma T-004"):** primera prueba del protocolo de T-046, que funcionó. Se planeó y se implementó la ronda 2 de T-004 con dos subagentes Sonnet y revisión Opus: el barril junto a la casa, con una regla que exige poder regresar, y la casilla de velocidad proporcional (mínima de 30 %, aprobada por el product owner). Todo quedó en el PR #12, con la rama al día con `main`.
- **Sesión (2026-10-17, noche, T-004):** se implementó T-004 con subagentes (las 7 tareas del plan), se abrió el PR #12 y el product owner hizo la primera ronda de prueba en el iPhone. Esta sesión no actualizó el "Estado actual"; el detalle está en la bitácora de T-004.
- **Sesión (2026-10-17, noche, corta):** se registró T-046 (retomar una tarea en una sesión nueva leyendo lo mínimo), revisada en Plannotator. Se hace al abrir la siguiente ventana de uso. T-004 no se tocó.
- **Sesión (2026-10-17, noche):** se cerró T-045 y arrancó la implementación de T-004.
  - **T-045:** `hecha`. El plan de T-004 es el primero en usar la sección "Modelo y esfuerzo".
  - **T-004:** plan aprobado (`docs/planes/T-004-prueba-controles.md`, 7 tareas, revisado en Plannotator; vive en la rama `T-004-prueba-controles` hasta el merge). Se ejecuta en el worktree `.claude/worktrees/T-004-prueba-controles` con `superpowers:subagent-driven-development` y los modelos de su sección "Modelo y esfuerzo". La investigación de los dos riesgos (multitouch y salto) ya está hecha; informes en `.local/t004/`.
- **Sesión (2026-10-17, tarde):** se mergeó T-045 (PR #11) y arrancó T-004 (worktree y diseño).
  - **Decisión del product owner:** no se crean skills nuevas antes de T-004. Al cerrarla se hace una retro: el error de los agentes que se repita es el candidato a skill. Quedó como criterio de aceptación de T-004.
- **Sesión (2026-10-17, mañana):** se cerró T-035 (PR #10). El repo ya tiene el skill `rendimiento-y-memoria` (`.claude/skills/`), la regla por ruta `.claude/rules/rendimiento.md` y una línea en `CLAUDE.md`: las sesiones que toquen escenas cargan las reglas de la guía de T-034 sin que se pida.
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
