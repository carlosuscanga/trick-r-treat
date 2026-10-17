---
paths: ["src/**/*.ts"]
---

# Rendimiento y memoria (Phaser 3.90, iPhone): lo que no se salta

- ESC-01: toda escena hereda de `EscenaBase`; listeners a `scale`, `game.events`, `sound` o `textures` van con `escuchar()`.
- ESC-02: la limpieza se registra con `this.events.once(SHUTDOWN)`, nunca con `on`.
- ESC-03: el estado de la escena se reinicia en `init()`, no en campos de clase.
- TEX-07 / AUD-05: el minijuego libera al salir sus texturas y su audio (`removeByKey` + `cache.audio.remove`).
- POO-03: nada de `new`, `{}`, `[]` ni *closures* dentro de `update()`.
- FRA-04: todo movimiento con `delta` (px/s), nunca px por frame.
- RED-03: assets en `src/assets/`, importados y con `paraLoader()`; en `public/` solo nombres fijos (manifest, íconos, `sw.js`).
- ROB-01: pausar en `LOSE_WEBGL`, redibujar y reanudar en `RESTORE_WEBGL`.
- Carga el skill `rendimiento-y-memoria` antes de escribir o revisar escenas.
