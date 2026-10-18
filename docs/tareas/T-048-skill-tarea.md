---
id: T-048
titulo: Skill `tarea` (tomar, retomar y cerrar) con revisión de "lista"
tipo: codigo
hito: H2
estado: en-progreso
prioridad: alta
depende: []
plan: docs/planes/T-048-skill-tarea.md
rama: T-048-skill-tarea
worktree: .claude/worktrees/T-048-skill-tarea
---

## Qué

Un skill de proyecto, `.claude/skills/tarea/`, que lleva una tarea de punta a punta con tres comandos. Lo mecánico lo hace un script; lo que requiere criterio lo hace Claude con el product owner.

1. **Tomar T-NNN.** Antes de arrancar, revisa si la tarea está **lista** contra una *Definition of Ready* (ver abajo).
   - Si no está lista, se refina **en ese momento**: Claude propone lo que falta y pregunta las decisiones al product owner, una por una. Actualiza la tarea en `main` (y crea su plan si hace falta) y solo entonces arranca.
   - Si está lista, arranca: comprueba que sus dependencias estén `hecha`, la pasa a `en-progreso` con `rama:` y `worktree:`, corre `npm run tablero`, hace commit y push a `main` con la deploy key, crea el worktree, entra y deja la base lista (`npm install` y `npm run build` con Node 24).
2. **Retomar T-NNN.** El protocolo actual de `docs/README.md` ("Retomar T-NNN") pasa al skill, sin cambiar lo que hace.
3. **Cerrar T-NNN.** Después del merge: comprueba que el PR esté mergeado y que la rama no tenga commits fuera de `main`, pasa la tarea a `hecha` con `rama:` y `worktree:` en `null`, corre `npm run tablero`, hace commit y push a `main` y quita el worktree. Claude escribe el "Estado actual" y la entrada del historial, que requieren criterio. Al final le recuerda al product owner borrar la rama local.

**Definition of Ready.** Se agrega a `docs/tareas/README.md`, junto a la plantilla. Una tarea está lista cuando:

- El "Qué" dice qué cambia para quien juega o para el proyecto, sin decisiones abiertas. Las que quedan se resuelven al refinar o se anotan como fuera de alcance.
- Los criterios de aceptación son verificables e incluyen la casilla de las tres capas de pruebas.
- Las dependencias están `hecha`, y las que se pisan con otra tarea dicen quién hace qué (por ejemplo, quién crea el minijuego falso, T-007 o T-009).
- Si la tarea toca varios archivos o tiene decisiones técnicas, su plan existe y está aprobado.

`docs/README.md` y `CLAUDE.md` se acortan: en lugar de los pasos a mano de "Trabajo en paralelo" (arrancar y cerrar) y de "Retomar T-NNN", dicen "usa el skill `tarea`" y conservan solo el porqué de cada regla.

## Por qué

Arrancar y cerrar una tarea hoy son unos 15 pasos a mano, repartidos en `docs/README.md` (unas 2,500 palabras que cada sesión vuelve a leer). Cuatro de las notas de memoria de Claude son parches de este flujo: renombrar la rama del worktree, el falso aviso de "commits descartados" al salir, el PATH de Node 24 y el push directo a `main`. Cada tarea paga ese costo dos veces.

Además, las próximas tareas de la ruta crítica (T-007, T-008 y T-009) no están listas para programarse: tienen pocos criterios, decisiones abiertas y se pisan entre ellas. Con un equipo de dos (el product owner y Claude), refinar en una rutina fija no vale la pena. Conviene refinar justo al tomar cada tarea, y el skill lo vuelve un paso que no se salta.

Salió del análisis de administración del proyecto del 2026-10-18, que siguió a la retro de proceso de ese día.

## Criterios de aceptación

- [ ] "Tomar T-NNN" sobre una tarea que no está lista no arranca: muestra qué le falta según la Definition of Ready y la refina con el product owner antes de crear el worktree.
- [ ] "Tomar T-NNN" sobre una tarea lista deja todo en un solo paso: frontmatter y tablero en `main` (con push), worktree creado, rama con su nombre final y base compilada.
- [ ] "Tomar" se niega si alguna dependencia no está `hecha` y dice cuál.
- [ ] "Cerrar T-NNN" se niega si el PR no está mergeado o si la rama tiene commits fuera de `main`.
- [ ] "Cerrar T-NNN" deja la tarea `hecha`, el tablero al día y el worktree quitado, y pide el "Estado actual" y el historial.
- [ ] "Retomar T-NNN" funciona igual que el protocolo de T-046.
- [ ] La Definition of Ready está en `docs/tareas/README.md`, y la plantilla de tarea la refleja.
- [ ] `docs/README.md` y `CLAUDE.md` apuntan al skill y ya no repiten los pasos.
- [ ] Las notas de memoria que eran parches de este flujo se borran o se actualizan.
- [ ] Pruebas en tres capas según el plan: unitarias, e2e y manual (o el porqué de la que no aplica).

## Decisiones para el plan

- **Cómo se crea el worktree (decidido).** Con `git worktree add .claude/worktrees/T-NNN-titulo -b T-NNN-titulo` y luego `EnterWorktree` con `path`; se quita con `git worktree remove`. La rama nace con su nombre final y desaparecen el renombrado y el falso aviso al salir. Esta tarea actualiza `CLAUDE.md` y `docs/README.md`, que hoy piden la herramienta nativa.
- **Qué parte es script y qué parte es skill.** Propuesta, a confirmar en el plan: el script (`npm run tarea -- tomar|cerrar T-NNN`) hace todo lo que es igual cada vez (validar dependencias, cambiar el frontmatter, `npm run tablero`, commit y push, crear o quitar el worktree, `npm install` y `build`, comprobar el merge con `gh`), con su lógica probada con Vitest. El skill hace lo que requiere criterio: revisar la Definition of Ready, refinar con el product owner, llamar al script, explicar sus errores y escribir el "Estado actual" y el historial.
- **Relación con T-030.** "Cerrar" cubre la parte local del cierre. Al terminar se decide si T-030 (cierre desde una GitHub Action) sigue haciendo falta o se descarta.
- **Fuera de alcance:** el tamaño S/M/L de las tareas y el proceso según el tamaño (propuestas de la retro, aún en "Pendiente de decidir").

## Bitácora

- 2026-10-18: creada a partir del análisis de administración del proyecto. Decisión del product owner: no hay rutina fija de refinamiento; cada tarea se revisa, y si hace falta se refina, al tomarla.
- 2026-10-18: decisión del product owner: los worktrees se crean con `git worktree add`, no con la herramienta nativa, porque esta obliga a renombrar la rama y da avisos falsos al salir.
