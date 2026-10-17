# e0 · Plan de T-004

Mide el criterio de éxito de T-035: que el plan de T-004 incluya por sí solo las pruebas de las trampas que le aplican.

## Prompt

Escribe el plan de implementación de T-004 (`docs/tareas/T-004-prueba-controles.md`) siguiendo `docs/planes/README.md`, y guárdalo en `docs/planes/T-004-prueba-controles.md`. No programes todavía: solo el plan.

## Rúbrica

| # | Punto | Regla | Crítico |
|---|---|---|---|
| 1 | La escena hereda de una `EscenaBase` mínima (que el plan crea si no existe) con `escuchar()`, limpieza registrada con `once(SHUTDOWN)` y estado reiniciado en `init()` | ESC-01, ESC-02, ESC-03 | sí |
| 2 | El movimiento y el salto dependen de `delta` o de la física en px/s, no de una cantidad fija por frame | FRA-04 | sí |
| 3 | Hay un e2e que reinicia la escena varias veces y comprueba que no crecen los listeners (o que el control no responde doble) | ESC-01, ESC-02 | sí |
| 4 | La física Arcade se declara en la escena que la usa (`physics: { arcade: … }`), no como `default` del juego | ESC-07 | sí |
| 5 | Los listeners de `resize`, del puntero o de `window` se quitan al salir (con `escuchar()`/`alLimpiar()` o `off` en `SHUTDOWN`) | ESC-01 | no |
| 6 | No pone `fps.limit` y no crea objetos dentro de `update()` (o lo pide explícitamente) | FRA-02, POO-03 | no |
| 7 | Menciona al menos una trampa de iOS: la vuelta del segundo plano (`delta` recortado), 120 Hz, o la pérdida del contexto WebGL | FRA-03, FRA-04, ROB-01 | no |
