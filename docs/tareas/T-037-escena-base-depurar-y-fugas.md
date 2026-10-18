---
id: T-037
titulo: "`EscenaBase`, `?depurar` y e2e de fugas"
tipo: codigo
hito: H2
estado: en-progreso
prioridad: alta
depende: [T-004, T-034]
plan: requerido
rama: T-037-escena-base-depurar-y-fugas
worktree: .claude/worktrees/T-037-escena-base-depurar-y-fugas
---

## Qué

La base para que ninguna escena deje basura y para poder medir en el iPhone: la clase `EscenaBase` (con `escuchar()` y `alLimpiar()`), el modo `?depurar` (overlay DOM y `window.__depurar` con contadores) y un e2e que detecta fugas al ciclar escenas. Va **antes de T-007**.

Parte de lo que dejó T-004: la `EscenaBase` mínima (`src/escenas/EscenaBase.ts`) y la carpeta `src/depurar/` (`depurar.ts` con `window.__juego` y `panelAjustes.ts`). El código nuevo de `?depurar` va en `src/depurar/`, no en `src/depuracion/` como dice la guía de T-034. `window.__juego` se queda tal cual, también solo con `?depurar`: es el `Phaser.Game` para que los e2e manejen escenas, y `window.__depurar` tiene los contadores.

Fuera de alcance: los pedidos del panel de ajustes (recordar valores y ayuda por ajuste) van en T-050.

## Por qué

Phaser limpia lo de la escena en `SHUTDOWN`, pero no lo global (listeners en `scale`, `game.events`, `sound`, `window`, texturas, audio y animaciones). En T-034 se midió: un `scale.off` olvidado pasa de 5 a 35 listeners. Sin esta base, las fugas aparecen tarde, en una partida de 15 minutos en el iPhone.

## Criterios de aceptación

- [ ] `EscenaBase` registra la limpieza con `once(SHUTDOWN)`, y los listeners a emisores globales con `escuchar()` o `alLimpiar()` (ESC-01, ESC-02).
- [ ] `init()` de `EscenaBase` reinicia sus limpiezas y hace `this.data.reset()`; las subclases llaman `super.init(data)` (ESC-03).
- [ ] `?depurar` expone `window.__depurar` y un overlay DOM (`<pre>`, cada 500 ms), no un `Text` de Phaser. La lógica pura vive en `src/depurar/metricas.ts` y `src/depurar/fugas.ts`, sin Phaser (DEP-01). `window.__juego` sigue existiendo, solo con `?depurar`.
- [ ] Contadores de DEP-01: listeners globales, texturas, sonidos, caché de audio, animaciones, escenas activas, tweens, MiB de GPU, `actualFps`, p95 y tirones de `rawDelta`, y recargas inesperadas (ROB-04).
- [ ] `?depurar` sirve en producción, apagado por defecto y sin datos personales (decisión 7). Ningún código del juego usa `__depurar`.
- [ ] e2e de fugas: calentamiento, `antes`, N ciclos (hoy, 30 reinicios de `Arranque`), `despues` y `crecimientos(antes, despues) == []`, esperando 2 frames entre pasos (sección 6.2). Queda listo para que T-007 cicle Calle → Puerta → minijuego → Calle.
- [ ] Probado que el detector funciona: con un `off` quitado a propósito, el e2e falla (anotado en la bitácora).
- [ ] e2e sin errores (`pageerror` y `console` de tipo error vacíos) y que imprime el tipo de renderer en el log, para saber si el WebKit del CI tiene WebGL.
- [ ] La guía de T-034 y el skill `rendimiento-y-memoria` dicen `src/depurar/` (no `src/depuracion/`), documentan `window.__juego` junto a `window.__depurar`, y el ejemplo de TEX-07 de la guía solo borra texturas si la escena sigue apagada (`getStatus() === SHUTDOWN`), igual que el skill.
- [ ] Pruebas en las tres capas (unitarias, e2e y manual): unitarias de `metricas.ts` y `fugas.ts`; e2e de fugas y sin errores; manual en el iPhone con M1, M2 y M4 de la guía (overlay visible en Pages, también desde la pantalla de inicio, sin quedar tapado por el notch).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007 o hacerse dentro de ella.
- 2026-10-16: en el brainstorming de T-035 se decidió que T-004 crea una `EscenaBase` mínima (`escuchar()`, `once(SHUTDOWN)` e `init()`). Esta tarea parte de ella y la completa (`alLimpiar()`, `this.data.reset()`, `?depurar` y e2e de fugas).
- 2026-10-18: pedido del product owner tras T-004: que el panel `?depurar` recuerde los valores en el iPhone entre visitas (en el navegador, con `localStorage`) y tenga un botón "volver a los valores por defecto". Así se puede afinar en Pages, de forma casual, sin perder lo ajustado al recargar. Las pruebas no deben depender de lo guardado (ver `docs/planes/README.md`, "Pruebas").
- 2026-10-18: segundo pedido del product owner para el panel `?depurar`: un ícono de ayuda (?) en cada ajuste con **dos partes obligatorias**: (1) **qué es**, en palabras simples, y (2) **cómo se prueba**: los pasos en la calle de prueba y qué se debería notar al subir o bajar el valor. Ejemplo: "Curva de velocidad. Qué es: cuánto recorrido del pulgar se queda en velocidades bajas. Cómo probarla: camina con el pulgar cerca del centro del joystick; con más curva es más fácil ir lento, con menos acelera antes." Hoy hay ajustes que no se entienden solo con el nombre (por ejemplo, ápice colgado).
- 2026-10-18: refinada al tomarla. Decisiones del product owner: (1) los dos pedidos del panel de ajustes pasan a una tarea aparte, T-050, para no agrandar la ruta crítica; (2) el código va en `src/depurar/`, la carpeta que ya existe, y se corrigen la guía y el skill; (3) `window.__juego` se queda junto a `window.__depurar`. Se agregan el criterio de TEX-07 (pendiente de T-035), la casilla de tres capas, `plan: requerido` y la dependencia de T-004.
