---
id: T-004
titulo: Prueba de controles táctiles
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-003, T-034, T-035, T-045]
plan: docs/planes/T-004-prueba-controles.md
rama: T-004-prueba-controles
worktree: .claude/worktrees/T-004-prueba-controles
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
- 2026-10-17: **primera ronda de prueba manual del product owner** (red local, Safari y pantalla de inicio): pasan las filas 1, 2, 4 a 10, 13 y 16. Dos pulgares a la vez sin trabarse, joystick flotante y dedo fuera del círculo que sigue caminando: bien. Brazos y Saltar sin lag perceptible. Sin scroll, sin zoom, sin regresar la página desde el borde. Al salir y volver, el estado se conserva. Falla la fila 3, como se esperaba: el saltito alcanza el auto (se afina en el panel). Faltan las filas 11, 12, 15 y 17. Mi vo se ve un poco grande, pero el product owner decide dejar su tamaño.
- 2026-10-17: **decisiones del product owner tras la prueba:**
  - **Bug de la calle (en este PR):** después de subir al techo y caer del lado de la cerca, no se puede regresar a la izquierda. La casa (380) solo tiene el pórtico del lado izquierdo y desde la derecha es un muro. Se corrige con un escalón del lado derecho de la casa, y `revisarCalle` se amplía para comprobar también que se puede **regresar** (recorrido en los dos sentidos), no solo llegar a cada bloque.
  - **Velocidad proporcional (en este PR):** casilla "velocidad proporcional" en `?depurar`, apagada por defecto; la velocidad crece con la distancia del pulgar al origen. El product owner la compara con la fija en el iPhone y decide. `direccionJoystick` ya calcula el valor analógico.
  - **Escaleras verticales** (joystick arriba para subir, por ejemplo en los pórticos): fuera de alcance. Se anota en la bitácora de T-027 (en `main`).
- 2026-10-17: **para retomar (sesión nueva):** (1) en `main`, anotar las escaleras verticales en T-027 y actualizar "Estado actual"; (2) en este worktree, implementar el escalón con la regla de regreso y la casilla de velocidad proporcional, cada una con sus pruebas, y hacer push al PR #12; (3) segunda ronda en el iPhone: filas 3 (afinar con el panel y pegar el JSON de "Copiar valores"), 11, 12, 15 y 17, la calle corregida y la velocidad proporcional; (4) veredicto A, A′ o B, merge y retro. El ledger de los subagentes, con los hallazgos menores para la retro, está en `.local/t004/sdd-ledger.md`.
- 2026-10-17: **ronda 2 implementada** (sesión nueva con "retoma T-004"). El anexo "Ronda 2" del plan lo aprobó el product owner, que acepta la velocidad mínima de 30 %. Dos subagentes Sonnet en paralelo y revisión con `code-reviewer-opus55`, sin bloqueantes.
  - **Barril:** está a la derecha de la casa, con su cara de arriba a 200. `revisarCalle` usa ahora un perfil de la calle vista de lado y exige llegar a todo y regresar desde todo al tramo donde aparece Mi vo (`X_INICIO` = 340, constante compartida con la escena). Sin el barril, la regla reporta el bug: `desde "banqueta" (x 3720 a 3900) no se puede regresar al inicio`.
  - **Velocidad proporcional:** casilla y deslizador "Velocidad mínima (fracción)" en `?depurar`, apagada por defecto. `velocidadMinima` se valida en (0, 1], y `fuerzaJoystick` no da NaN.
  - **Corregido tras la revisión:** un subagente cambió de más un test (el del pórtico); se revirtió. El inicio pasó de x = 0 a `X_INICIO`. Se agregaron tests directos del perfil y un valor exacto (158.4) en el e2e, y la etiqueta de las casillas ya no se parte.
  - **Límites conocidos de la regla (para la retro, no se corrigen ahora):** (1) es conservadora con rendijas más angostas que Mi vo (90 px): las reporta como trampas aunque ella no quepa; (2) la distancia de salto es la misma para un salto plano que para uno que sube 221 (≈ 174 px reales contra 198.9). Hoy lo compensa el ancho de Mi vo.
- 2026-10-17: **para retomar:** push al PR #12 hecho (ver el PR). Falta la segunda ronda en el iPhone: filas 3, 11, 12, 15 y 17, y las nuevas 19 (regresar por el barril) y 20 (velocidad proporcional contra la fija). Después: veredicto A, A′ o B, la elección entre velocidad fija o proporcional, el merge y la retro. En `main` falta anotar las escaleras verticales en la bitácora de T-027.
