---
id: T-045
titulo: Modelo y esfuerzo por paso en los planes
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: []
plan: null
---

## Qué

Agregar a la plantilla de planes (`docs/planes/README.md`) una sección **"Modelo y esfuerzo"**: para cada paso o subagente, qué modelo lo hace (Haiku, Sonnet, Opus o Fable), con qué esfuerzo (`low` a `max`) y por qué. Incluye una tabla de referencia por rol y una línea en `CLAUDE.md` que apunte a ella.

Referencia acordada en el brainstorming de T-035 (2026-10-16):

| Rol | Modelo | Esfuerzo |
|---|---|---|
| Sesión principal (orquesta, planea, decide) | Opus | alto |
| Subagentes que programan | Sonnet; Opus si es delicado (física, timing de audio) | según el plan |
| Revisión de código | Opus (`code-reviewer-opus55`) | alto |
| Tareas mecánicas (tablero, docs, renombrar) | Haiku | bajo |
| Bloqueos o riesgo técnico muy alto | Fable, **solo sugerido** y justificado en el plan | según el plan |

## Por qué

Las tareas no pesan igual. Quien escribe el plan ya analizó la tarea a fondo, así que es quien mejor puede dimensionarla, como el *sizing* de un ticket. Al aprobar el plan, el product owner aprueba también el modelo y el esfuerzo, y esa aprobación cuenta como instrucción explícita para fijar el esfuerzo de los subagentes. Evita gastar el límite de uso en tareas simples y quedarse corto en las difíciles.

## Criterios de aceptación

- [x] La plantilla de `docs/planes/README.md` tiene la sección "Modelo y esfuerzo", con la tabla de referencia por rol.
- [x] Fable aparece solo como sugerencia para lo muy complejo (por ejemplo, un bug atorado tras dos intentos de Opus o un plan de riesgo técnico alto como T-022), siempre con su porqué.
- [x] Una línea en `CLAUDE.md` apunta a la sección, sin copiar la tabla.
- [ ] Pruebas: no aplican unitarias, e2e ni prueba manual en el iPhone, porque solo cambia documentación del proceso. Se verifica en el plan de T-004, que debe ser el primero en usar la sección.

## Bitácora

- 2026-10-16: creada en el brainstorming de T-035. Va antes del plan de T-004. Se usa T-045 y no T-044 porque la guía de T-034 ya nombró T-044 (Phaser sin Matter, en el cajón v1.1).
- 2026-10-17: implementada. La sección "Modelo y esfuerzo" va en `docs/planes/README.md` (convención, explicación del esfuerzo, tabla de referencia por rol, cuándo sugerir Fable y qué hacer si un paso resulta más difícil o más fácil de lo previsto) y como tabla por paso en la plantilla. `CLAUDE.md` tiene una línea que apunta a ella. El product owner la revisó en la terminal. El último criterio (pruebas) queda abierto: se verifica cuando el plan de T-004 use la sección, y se marca al cerrar la tarea.
