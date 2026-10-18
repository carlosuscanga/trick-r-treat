# Plan T-046: Retomar una tarea en una sesión nueva

Tarea: [T-046](../tareas/T-046-retomar-tareas-en-sesion-nueva.md)

## Enfoque

Que "retoma T-NNN" en una sesión nueva llegue al worktree y al paso siguiente leyendo solo tres cosas: el frontmatter de la tarea (en `main`), y el plan y la bitácora (en el worktree). Para eso, el frontmatter guarda `rama:` y `worktree:`, `docs/README.md` escribe el protocolo y "Estado actual" queda corto, con el historial aparte.

**Choque con el flujo y cómo se resuelve.** La tarea pide editar dos cosas que una rama no puede tocar: el "Estado actual" (solo en `main`) y el archivo de T-004 (otra tarea). Por eso el trabajo se parte en dos:

| Dónde | Qué | Por qué |
|---|---|---|
| **Rama → PR** | `docs/README.md`, `CLAUDE.md`, este plan y el archivo de T-046 | Son reglas del proceso: van por PR para que el product owner revise el diff. |
| **`main`, push directo, después del merge** | Partir "Estado actual" y crear `docs/tareas/historial.md`; `rama:` y `worktree:` en la plantilla y en las tareas `en-progreso` (T-004 y T-046); la nota de escaleras en T-027 | Son tablero y estado, que solo se editan en `main`. Van después del merge para que las reglas y los datos lleguen juntos. |

**Decisiones:**

- `rama:` y `worktree:` se llenan en el paso 2 del flujo ("Arrancar", en `main`), en el mismo commit que pasa la tarea a `en-progreso`. Los valores se conocen desde antes de crear el worktree: la rama es `T-NNN-titulo` y la ruta es `.claude/worktrees/T-NNN-titulo`. Se vacían (`null`) en el paso 6, en el commit que pasa la tarea a `hecha`.
- El frontmatter se lee en `main` (es lo que ve una sesión nueva). El plan y la bitácora se leen **en el worktree**, porque la copia de la rama es la más nueva.
- El `git fetch` después de cada push directo se pega al propio comando en "Checks obligatorios en `main`", que es donde se copia. Así no depende de recordarlo.
- "Estado actual" queda con cinco líneas fijas: Fase, En curso, Siguiente paso, Pendiente de decidir y Al retomar. "En curso" apunta a cada tarea en progreso, sin repetir su bitácora.

## Archivos

En la rama:

- Crear: `docs/planes/T-046-retomar-tareas-en-sesion-nueva.md` (este plan).
- Modificar: `docs/README.md` ("Checks obligatorios en `main`", "Trabajo en paralelo", pasos 2 y 6, y "Sesiones con Claude").
- Modificar: `CLAUDE.md` (regla "Al empezar una sesión…").
- Modificar: `docs/tareas/T-046-retomar-tareas-en-sesion-nueva.md` (`plan:`, criterios y bitácora).

En `main`, después del merge:

- Crear: `docs/tareas/historial.md`.
- Modificar: `docs/tareas/README.md` ("Estado actual", plantilla y enlace al plan en el tablero).
- Modificar: `docs/tareas/T-004-prueba-controles.md` y `docs/tareas/T-046-retomar-tareas-en-sesion-nueva.md` (solo frontmatter).
- Modificar: `docs/tareas/T-027-trepar-y-techos.md` (bitácora: escaleras verticales, pendiente de T-004).

## Pasos

1. **Protocolo en `docs/README.md`.** Nueva viñeta "Retomar T-NNN" en "Sesiones con Claude":
   1. Abrir la sesión desde la carpeta principal (por el token del proyecto).
   2. Leer solo el frontmatter de `docs/tareas/T-NNN-*.md`. Si `worktree` está vacío, la tarea no ha arrancado: seguir el flujo normal desde "Arrancar".
   3. `EnterWorktree` con `path` igual a `worktree`.
   4. En el worktree, leer la bitácora de la tarea (sobre todo una entrada "para retomar", si existe) y el plan. Seguir desde la primera casilla sin marcar.
   5. No leer el tablero ni el "Estado actual" completos.
   - Verificar: el texto nombra los tres archivos y nada más.
2. **`rama:` y `worktree:` en el flujo.** En "Trabajo en paralelo": el paso 2 los llena y el paso 6 los vacía.
   - Verificar: los dos pasos los mencionan con un ejemplo de valor.
3. **`git fetch` tras el push directo.** Añadir `&& git fetch origin` al comando de la deploy key, con una frase del porqué (el push va por URL y no actualiza `origin/main`).
4. **`CLAUDE.md`.** La regla de inicio queda así: con "retoma T-NNN", usar el protocolo de `docs/README.md`; sin eso, leer "Estado actual" como hasta ahora.
   - **Agregado al implementar:** la regla de cierre de sesión (`CLAUDE.md` y "Al terminar" en `docs/README.md`) decía que "qué se hizo" va en "Estado actual". Ahora va arriba de `docs/tareas/historial.md`; si no, el "Estado actual" volvería a crecer.
5. **Archivo de T-046.** `plan:` apunta a este plan, más la bitácora. Commit por paso.
6. **PR** con la sección de prueba manual (abajo). El merge lo hace el product owner.
7. **En `main`, tras el merge** (`git pull` antes, push con la deploy key):
   1. Mover las entradas "Sesión (…)" de "Estado actual" a `historial.md`, la más nueva arriba, **sin cambiar el texto**. Dejar las cinco líneas fijas, al día con el estado real de T-004 (PR #12 y primera ronda en el iPhone hecha).
   2. Plantilla, T-004 y T-046 con `rama:` y `worktree:`. Enlace al plan en la fila de T-046.
   3. Nota de escaleras verticales en la bitácora de T-027.
   - Verificar: "Estado actual" tiene menos de 15 líneas, y un script comprueba que cada línea del bloque viejo aparece en `README.md` o en `historial.md`.
8. **Prueba de aceptación** (sesión nueva, abajo). Se marca el criterio y la tarea pasa a `hecha`, en `main`.

## Pruebas

- **Unitarias:** no aplican. Es un cambio solo de docs, sin lógica.
- **e2e:** no aplican, por lo mismo. El CI del PR corre igual (`tests`, `build` y `e2e`) y debe quedar en verde.
- **Manual:** no es en el iPhone, porque no hay nada que ver en el juego. Es en una sesión nueva de Claude, tras el paso 7:

| Paso | Qué se hace | Qué se espera |
|---|---|---|
| 1 | Abrir Claude desde la carpeta principal y escribir "retoma T-004". | Lee el frontmatter de T-004 y no lee el tablero ni el "Estado actual" completos. |
| 2 | Dejar que siga. | Entra con `EnterWorktree` a `.claude/worktrees/T-004-prueba-controles`. |
| 3 | Dejar que siga. | Lee la bitácora y el plan de T-004 en el worktree y propone lo pendiente de "para retomar" (el escalón y la velocidad proporcional). |
| 4 | Revisar lo que leyó. | Solo el archivo de la tarea, el plan y la bitácora. Se anota en la bitácora de T-046 (en `main`, al cerrarla). |

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Pasos 1–6 (redactar reglas) | Opus, sesión principal | `high` | Es texto del proceso: hay que cuidar que no contradiga otras reglas. Son pocas líneas, así que un subagente no ahorra nada. |
| Paso 7 (mover el historial) | Opus, sesión principal | `high` | Es mecánico (Haiku según la tabla de referencia), pero mover texto sin perder nada se hace con un script de verificación. Lanzar un subagente costaría más que hacerlo directo. |
| Revisión del PR | Product owner, en GitHub | — | Solo docs, sin código. `code-reviewer-opus55` no aporta en un diff de prosa. |
| Paso 8 (prueba) | La sesión nueva, con su modelo por defecto | — | La prueba es justo cómo se comporta una sesión normal. |
