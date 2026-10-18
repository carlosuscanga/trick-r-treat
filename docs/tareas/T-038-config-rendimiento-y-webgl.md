---
id: T-038
titulo: Config de rendimiento y robustez WebGL
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-034]
plan: null
---

## Qué

La base de config y robustez que T-007 y lo que sigue dan por hecha:

- `disablePreFX: true` en la raíz de la config del juego (TEX-08).
- Física declarada solo por escena (ESC-07): quitar el `default: 'arcade'` que sobra en `CallePrueba`, que T-007 y T-008 van a copiar.
- **Pausa por motivos:** el juego queda pausado mientras haya al menos un motivo activo (vertical, contexto WebGL perdido). `pausarEnVertical` pasa a usarla. Sin esto, reanudar por un motivo despausa al juego aunque otro siga activo.
- Pérdida de contexto (ROB-01): en `LOSE_WEBGL` se pausan el juego (como un motivo) y el sonido; en `RESTORE_WEBGL` se quitan. Sin `CONTEXT_LOST` ni `setContextHandlers`.
- `Arranque`: el `sound.once(UNLOCKED)` se quita al apagar la escena, con `alLimpiar` (ESC-06).
- Regla en el skill `rendimiento-y-memoria` (ROB-01): quien cree una `RenderTexture` o `DynamicTexture`, la redibuja en `RESTORE_WEBGL` en esa misma tarea.

**Fuera del alcance:**
- Ya está hecho: `fps: { panicMax: 0 }` (T-004), `Phaser.AUTO`, sin `fps.limit` ni `disableWebAudio`, y el estado de `Arranque` en `init()` (T-037). Aquí solo lo fijan las pruebas.
- Descartado: exportar la config como objeto (Vitest no carga Phaser; se prueba en e2e), redibujar lo dinámico (hoy no hay ninguna `RenderTexture` ni `DynamicTexture`) y el e2e del "píxel conocido" (prueba a Phaser, no nuestro código).
- Espera a la medición: Modo de bajo consumo con un minijuego (M11) → T-041; `antialiasGL`, `roundPixels`, `loop.sleep`, `maxLights` y postFX (FRA-05, FRA-06, FRA-09) → T-041 y el arte; si el arte extraña `preFX` → T-012 / H3.

## Por qué

`disablePreFX` baja la base de GPU de Phaser de 91 a 30 MiB; en el iPhone, la calle de prueba marca 102 MiB y debería bajar a unos 41. Sin manejar `LOSE_WEBGL`, la lógica sigue corriendo con la pantalla negra. Con dos dueños de la pausa (vertical y contexto), uno despausa al juego detrás del aviso de "gira tu teléfono". Todo esto conviene tenerlo antes de T-007. Con fps 60, p95 17 ms y 0 tirones medidos en el iPhone, no hay presión de fps: lo que habría que medir queda en T-041.

## Criterios de aceptación

- [ ] `disablePreFX: true` en la raíz de la config de `main.ts`, y ningún `.preFX` en `src/`.
- [ ] Ninguna escena declara `physics.default`; las que usan física declaran `physics: { arcade: {...} }`, y el juego no declara física.
- [ ] Hay un módulo de pausa por motivos sin Phaser: el juego se pausa al activarse el primer motivo y se reanuda solo cuando ya no queda ninguno. `pausarEnVertical` lo usa.
- [ ] En `LOSE_WEBGL` se activan el motivo "contexto" y la pausa del sonido; en `RESTORE_WEBGL` se quitan. Sin `CONTEXT_LOST` ni `setContextHandlers`.
- [ ] `Arranque` quita el listener de `UNLOCKED` al apagarse (con `alLimpiar`).
- [ ] La regla de redibujar `RenderTexture`/`DynamicTexture` está en ROB-01 del skill `rendimiento-y-memoria`.
- [ ] Pruebas en las tres capas (unitarias, e2e y manual): unitarias de la pausa por motivos (un motivo, dos motivos, quitar uno no reanuda, quitar uno que no estaba no truena); e2e de la config que leyó Phaser (`game.config`: AUTO, `disablePreFX`, `panicMax: 0`, sin `fps.limit`, sin `disableWebAudio`, sin física por defecto), de la base de GPU ≤ 32 MiB al arrancar, de perder y restaurar el contexto (pausado y reanudado; en vertical sigue pausado) y de que `CallePrueba` tiene `this.physics`; manual en el iPhone con la GPU del overlay (102 → ≈41 MiB), M13 (ir al inicio y volver) y M14 (bloquear y desbloquear) con la calle de prueba.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007. Podría ir junto con T-037, pero va separada por la regla de "un cambio a la vez".
- 2026-10-18: refinada al tomarla, tras revisar su alcance (base, esperar medición o descartar). Talla S. Decisiones del product owner, una a una: (1) entra la **pausa por motivos**, porque `pausarEnVertical` ya pausa y ROB-01 sería un segundo dueño de la pausa; (2) la config se prueba en **e2e** leyendo `game.config`, sin exportarla como objeto; (3) redibujar lo dinámico queda para después, con una regla en el skill; (4) el e2e de contexto no revisa el "píxel conocido". `panicMax` y el estado de `Arranque` en `init()` ya estaban hechos. M11 y las perillas de FRA-05/06/09 quedan en T-041. Con esto se resuelve el pendiente de la retro "bajar T-038 a T-040": no hace falta, lo especulativo quedó fuera. Plan dentro de la tarea, como en T-049.
