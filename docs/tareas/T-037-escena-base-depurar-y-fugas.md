---
id: T-037
titulo: EscenaBase, ?depurar y e2e de fugas
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-034]
plan: null
---

## Qué

La base para que ninguna escena deje basura y para poder medir en el iPhone: la clase `EscenaBase` (con `escuchar()` y `alLimpiar()`), el modo `?depurar` (overlay DOM y `window.__depurar` con contadores) y un e2e que detecta fugas al ciclar escenas. Va **antes o dentro de T-007**.

## Por qué

Phaser limpia lo de la escena en `SHUTDOWN`, pero no lo global (listeners en `scale`, `game.events`, `sound`, `window`, texturas, audio y animaciones). En T-034 se midió: un `scale.off` olvidado pasa de 5 a 35 listeners. Sin esta base, las fugas aparecen tarde, en una partida de 15 minutos en el iPhone.

## Criterios de aceptación

- [ ] `EscenaBase` registra la limpieza con `once(SHUTDOWN)`, y los listeners a emisores globales con `escuchar()` o `alLimpiar()` (ESC-01, ESC-02).
- [ ] `init()` de `EscenaBase` reinicia sus limpiezas y hace `this.data.reset()`; las subclases llaman `super.init(data)` (ESC-03).
- [ ] `?depurar` expone `window.__depurar` y un overlay DOM (`<pre>`, cada 500 ms), no un `Text` de Phaser. La lógica pura vive en `src/depuracion/metricas.ts` y `fugas.ts`, sin Phaser (DEP-01).
- [ ] Contadores de DEP-01: listeners globales, texturas, sonidos, caché de audio, animaciones, escenas activas, tweens, MiB de GPU, `actualFps`, p95 y tirones de `rawDelta`, y recargas inesperadas (ROB-04).
- [ ] `?depurar` sirve en producción, apagado por defecto y sin datos personales (decisión 7). Ningún código del juego usa `__depurar`.
- [ ] e2e de fugas: calentamiento, `antes`, N ciclos (hoy, 30 reinicios de `Arranque`), `despues` y `crecimientos(antes, despues) == []`, esperando 2 frames entre pasos (sección 6.2). Queda listo para que T-007 cicle Calle → Puerta → minijuego → Calle.
- [ ] Probado que el detector funciona: con un `off` quitado a propósito, el e2e falla (anotado en la bitácora).
- [ ] e2e sin errores (`pageerror` y `console` de tipo error vacíos) y que imprime el tipo de renderer en el log, para saber si el WebKit del CI tiene WebGL.
- [ ] Pruebas: unitarias de `metricas.ts` y `fugas.ts`; e2e de fugas y sin errores; manual en el iPhone con M1, M2 y M4 de la guía (overlay visible en Pages, también desde la pantalla de inicio, sin quedar tapado por el notch).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007 o hacerse dentro de ella.
