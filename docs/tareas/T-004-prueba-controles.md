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

- [ ] Joystick a la izquierda; Saltar y Brazos a la derecha, como en el diseño.
- [ ] Mi vo camina, salta y cae con gravedad; la cámara la sigue.
- [ ] Se usan dos dedos a la vez (moverse y saltar) sin que se trabe.
- [ ] Probado en el iPhone, con la decisión anotada en la bitácora: plan A, A′ o B.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Su resultado también es el gate de los minijuegos de Plataformas (T-023).
- 2026-10-16: en el brainstorming de T-035 se decidió que esta tarea crea la `EscenaBase` mínima (T-037 la completa) y que su plan lleva la sección "Modelo y esfuerzo" de T-045.
