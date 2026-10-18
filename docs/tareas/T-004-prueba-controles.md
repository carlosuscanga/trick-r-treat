---
id: T-004
titulo: Prueba de controles táctiles
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-003, T-034, T-035, T-045]
plan: null
---

## Qué

Una calle placeholder con físicas Arcade, donde un rectángulo (Mi vo) camina con el joystick y salta con el botón Saltar. El botón Brazos responde, aunque todavía no haga nada útil. Necesita plan antes de programar.

La escena hereda de una **`EscenaBase` mínima** que crea esta tarea (`escuchar()`, limpieza con `once(SHUTDOWN)` y estado en `init()`), con la plantilla del skill `rendimiento-y-memoria`. T-037 la completa después.

**Plan de contingencia** (punto de decisión: al cerrar esta tarea):

- **Plan A:** joystick + botones, como en el diseño.
- **Plan A′:** si los botones no se sienten bien, probar otros esquemas táctiles antes de rendirse: zonas de toque en lugar de botones, deslizar para saltar, caminar automático.
- **Plan B:** solo si A′ también falla, web de computadora con teclado. Es un cambio de diseño (plataforma): se registra en `docs/diseno/` y `CAMBIOS.md`. Se quiere evitar.

## Por qué

Es el mayor riesgo técnico: si saltar y moverse con controles táctiles no se siente bien, la calle, la exploración y los minijuegos de Plataformas no funcionan. Se prueba antes de construir encima.

## Criterios de aceptación

- [x] Joystick a la izquierda; Saltar y Brazos a la derecha, como en el diseño.
- [x] Mi vo camina, salta y cae con gravedad; la cámara la sigue.
- [ ] Se usan dos dedos a la vez (moverse y saltar) sin que se trabe.
- [ ] Probado en el iPhone, con la decisión anotada en la bitácora: plan A, A′ o B.
- [ ] Retro anotada en la bitácora: qué errores repitieron los agentes, cuánto costó corregirlos y si alguno justifica una skill nueva.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Su resultado también es el gate de los minijuegos de Plataformas (T-023).
- 2026-10-16: en el brainstorming de T-035 se decidió que esta tarea crea la `EscenaBase` mínima (T-037 la completa) y que su plan lleva la sección "Modelo y esfuerzo" de T-045.
- 2026-10-17: arranca. Worktree creado; `npm install` y `npm run build` limpios. Se cargaron los skills de brainstorming y `rendimiento-y-memoria`.
- 2026-10-17: **decisión del product owner:** no se crea otra skill antes de esta tarea. El plan incluye una investigación corta de los dos puntos de riesgo: (1) varios dedos a la vez en Phaser 3.90 (`activePointers`, joystick y botones simultáneos) y (2) la sensación del salto (salto variable, *coyote time*, búfer de salto). Al cerrar la tarea se hace una retro. Si un error de los agentes se repite, ese es el candidato a skill, con su propia tarea y evaluaciones, como en T-035. Candidatas vistas: sensación de plataformas, input táctil en Phaser 3, e2e con toques en WebKit.
- 2026-10-17: brainstorming del plan pendiente. Primera pregunta abierta: ¿qué tiene que sentir o ver el product owner en el iPhone para decir "el plan A funciona"?
- 2026-10-17: brainstorming hecho. Éxito: caminar y frenar sin lag, salto "como Mario de Game Boy", dos pulgares sin trabarse. Falla: que la pantalla se mueva o se sienta torpe. **Decisiones del product owner:** sin doble salto; agacharse y los gestos de Brazos van a `ideas.md`; calle de prueba con bloques de Halloween y una regla de alturas derivada del salto; A′, si hace falta, es un segundo PR de esta misma tarea desde `main` (excepción a "una rama por tarea").
- 2026-10-17: investigación de los dos riesgos con 3 subagentes Sonnet (multitouch, salto, gestos de iOS). Hallazgos clave: Phaser trae un solo puntero táctil por defecto (`activePointers: 3`), riesgo de controles pegados (antídoto por frame) y el gesto "atrás" del borde izquierdo no se puede bloquear (márgenes + pantalla de inicio). Informes en `.local/t004/`. Un revisor (Opus) leyó el diseño y sus 4 preguntas quedaron resueltas.
- 2026-10-17: diseño y plan aprobados por el product owner (revisados en Plannotator): `docs/planes/T-004-prueba-controles.md`, 7 tareas, ejecución con subagentes. La implementación arranca en una sesión nueva.
- 2026-10-17: implementación con subagentes (7 tareas, cada una con su revisión). La prueba e2e de dos dedos sintéticos **sí funciona** con Phaser 3.90, así que el multitouch también se prueba en e2e. El contador de punteros es `game.input.pointers` (`pointers[0]` es el ratón y `1..3` son táctiles).
- 2026-10-17: **desvíos del plan** (decisiones del orquestador; el diseño manda sobre el texto del plan):
  - Búfer de salto: la condición es `>= 0`, con un centinela, para que 130 ms salte y 131 no, como pide el plan.
  - Altura variable: el corte aplica también en el frame del salto si ya se soltó Saltar. Con la regla literal, el toque más corto subía 89 px y cambiaba con los fps; así sube unos 67 px a cualquier framerate.
  - La disposición de los botones sale de `ajustes`, para que el panel `?depurar` pueda moverlos.
  - Suelo para el salto: `blocked.down && velocity.y >= 0`. Evita un doble salto si la física avisa del suelo un frame tarde.
  - Tope vertical: `maxVelocity.y = max(caidaMax, v0)` más un recorte manual de la caída. Antes, un salto rápido afinado en el panel se recortaba sin aviso. La caída puede pasar el tope por un paso de gravedad (≈ 130 px/s con los valores iniciales).
  - Mi vo arranca en x = 340 y no en 200, porque en 200 quedaba debajo del joystick en reposo.
  - `validarBloques` exige que `sobre` apunte a un bloque anterior en la lista; así no puede haber ciclos.
  - El retraso de un frame entre la física y `update()` se dejó como dice el plan, sin pasarlo a `PRE_UPDATE`.
- 2026-10-17: **a vigilar en el iPhone:** un toque humano (50 a 100 ms) sube unos 130 a 180 px, no 70, y el saltito podría alcanzar el auto (fila 3 de la prueba manual). El bote queda a 0.5 px del límite del toque corto. Se afina con `?depurar`. El panel tapa los controles mientras está abierto: hay que cerrarlo para sentir cada cambio.
