---
id: T-046
titulo: Retomar una tarea en una sesión nueva
tipo: codigo
hito: H1
estado: en-progreso
prioridad: media
depende: []
plan: docs/planes/T-046-retomar-tareas-en-sesion-nueva.md
rama: null
worktree: null
---

## Qué

Que una sesión **nueva** de Claude (no `claude --resume`) retome una tarea con "retoma T-NNN" leyendo lo mínimo. Sirve para seguir una tarea cuando la sesión anterior ya acumuló demasiado contexto, o para empezar otra.

1. **Partir "Estado actual"** (`docs/tareas/README.md`): arriba solo lo vigente (fase, en curso, siguiente paso y pendientes, menos de 15 líneas). Las sesiones anteriores pasan a `docs/tareas/historial.md`.
2. **Frontmatter de las tareas `en-progreso`**: agregar `rama:` y `worktree:`, que se llenan al arrancar la tarea y se vacían al cerrarla.
3. **Protocolo "Retomar T-NNN"** en `docs/README.md` ("Sesiones con Claude"): (1) leer el frontmatter de la tarea, (2) `EnterWorktree` con su `worktree`, (3) seguir desde la primera casilla sin marcar del plan, con la bitácora como contexto. Sin leer el tablero completo.
4. Ajustar la regla de `CLAUDE.md` ("Al empezar una sesión…") para que con "retoma T-NNN" se use el protocolo en lugar de leer todo "Estado actual".

## Por qué

Hoy "Estado actual" mezcla lo vigente con el historial de cada sesión, y crece. Al arrancar se lee completo, aunque solo interese una tarea. El worktree, la rama y el punto donde se quedó la tarea están escritos en ese texto, no en el archivo de la tarea. El plan y la bitácora viven en la rama, así que desde `main` no se ven hasta entrar al worktree.

## Criterios de aceptación

- [ ] "Estado actual" queda en menos de 15 líneas y el historial está en `docs/tareas/historial.md`, sin perder contenido.
- [ ] La plantilla de tarea y T-004 tienen `rama:` y `worktree:`. `docs/README.md` ("Trabajo en paralelo") dice cuándo se llenan y cuándo se vacían.
- [x] `docs/README.md` tiene el protocolo "Retomar T-NNN" y `CLAUDE.md` apunta a él.
- [ ] Prueba: una sesión nueva con "retoma T-004" llega al worktree y al paso siguiente del plan leyendo solo el archivo de la tarea, el plan y la bitácora (anotado en la bitácora).
- [ ] Pruebas: no aplican unitarias ni e2e porque es un cambio solo de docs. La prueba manual es el criterio anterior.

## Bitácora

- 2026-10-17: creada. El product owner preguntó si retomar con "retoma T-NNN" era eficiente. Se hace al abrir la siguiente ventana de uso, porque la actual estaba al 96%.
- 2026-10-17: incluir en el protocolo un `git fetch` después de cada push directo a `main`. Ese push va por URL con la deploy key, no por `origin`, así que `origin/main` local queda viejo y el editor muestra "1 adelante" aunque el push sí se hizo.
- 2026-10-17: arranca. Worktree creado; `npm install` y `npm run build` limpios. **Choque con el flujo:** la tarea pide partir "Estado actual" y editar el archivo de T-004, y las ramas no pueden tocar ninguno de los dos. **Decisión del product owner** (plan aprobado aquí, sin Plannotator): las reglas van por PR, y el "Estado actual", el historial, la plantilla y los frontmatter van directo a `main` después del merge. Sin subagentes; todo lo hace la sesión principal (Opus).
- 2026-10-17: pasos 1 a 4 del plan hechos en la rama: protocolo "Retomar T-NNN", cuándo se llenan y se vacían `rama:` y `worktree:`, `git fetch` pegado al comando de push directo, y la regla de `CLAUDE.md`. Al retomar no se lee `.local/notas.md`: el criterio pide leer solo la tarea, el plan y la bitácora. Los criterios 1, 2 y 4 se cumplen en `main` después del merge (paso 7 del plan) y se marcan al cerrar, como dice el paso 6 de "Trabajo en paralelo".
- 2026-10-17: **desvío del plan:** también cambia la regla de cierre de sesión (`CLAUDE.md` y "Al terminar" en `docs/README.md`). "Qué se hizo" ahora va arriba de `historial.md`, no en "Estado actual". Sin esto, el "Estado actual" volvería a crecer en cada sesión. Plan actualizado (paso 4).
- 2026-10-18: PR #13 mergeado y worktree quitado. **Paso 7 en `main`:** el "Estado actual" queda en 7 líneas, y las sesiones viejas pasaron a `historial.md` (un script confirmó que no falta ninguna línea; el único cambio de texto es "Última sesión" → "Sesión"). Se agregó una entrada para la sesión de T-004 que no había dejado resumen. `rama:` y `worktree:` quedaron en la plantilla y en T-004; en T-046 van en `null`, porque su worktree ya no existe y lo que falta se hace en `main`. Se anotaron las escaleras verticales en T-027. Falta la prueba con "retoma T-004" en una sesión nueva.
