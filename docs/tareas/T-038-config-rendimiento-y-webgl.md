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

Cambios pequeños de alto impacto en la config del juego y en `Arranque`: `disablePreFX: true`, `fps: { panicMax: 0 }`, sin `fps.limit`, sin `disableWebAudio`, física declarada por escena, pausa y reanudación ante la pérdida del contexto WebGL, y los dos arreglos latentes de `Arranque`.

## Por qué

`disablePreFX` baja la base de GPU de Phaser de 91 a 30 MiB. `panicMax: 0` evita segundos de cámara lenta en el Modo de bajo consumo, y `fps.limit` está roto en 3.90. Sin manejar `LOSE_WEBGL`, la lógica sigue corriendo con la pantalla negra. Todo esto conviene tenerlo antes de T-007.

## Criterios de aceptación

- [ ] La config del juego se exporta como objeto, con `Phaser.AUTO` (FRA-01), `disablePreFX: true` en la raíz (TEX-08) y `fps: { panicMax: 0 }` (FRA-03).
- [ ] Sin `fps.limit` (FRA-02) ni `audio.disableWebAudio` (AUD-01), y el juego no declara `physics.default`: cada escena que usa física la declara con `physics: { arcade: {...} }` (ESC-07, decisión 8).
- [ ] En `LOSE_WEBGL` se pausan el juego y el sonido; en `RESTORE_WEBGL` se redibuja lo dinámico y se reanudan. Sin `CONTEXT_LOST` ni `setContextHandlers` (ROB-01).
- [ ] `Arranque`: el `sound.once(UNLOCKED)` no puede tocar un `Text` destruido si la escena se apaga antes del desbloqueo, y `esperandoDesbloqueo` y `errorDeCarga` se inicializan en `init()` (ESC-06, ESC-03).
- [ ] La base de GPU de Phaser al arrancar queda en ≤ 32 MiB (sección 5), medida en e2e si el WebKit del CI tiene WebGL; si no, se anota y se mide con el overlay en el iPhone.
- [ ] Pruebas: unitaria de la config exportada (`disablePreFX`, `panicMax: 0`, sin `fps.limit`, sin `disableWebAudio`, sin física por defecto); e2e de pérdida y restauración de contexto (`WEBGL_lose_context`: pausado, y al restaurar reanuda y un píxel conocido se ve bien); manual en el iPhone con M11, M13 y M14 de la guía (bajo consumo a la misma velocidad en segundos; volver del inicio y desbloquear sin salto de física ni recarga).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007. Podría ir junto con T-037, pero va separada por la regla de "un cambio a la vez".
