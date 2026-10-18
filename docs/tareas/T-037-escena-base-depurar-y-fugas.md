---
id: T-037
titulo: "`EscenaBase`, `?depurar` y e2e de fugas"
tipo: codigo
hito: H2
estado: hecha
prioridad: alta
depende: [T-004, T-034]
plan: docs/planes/T-037-escena-base-depurar-y-fugas.md
rama: null
worktree: null
---

## Qué

La base para que ninguna escena deje basura y para poder medir en el iPhone: la clase `EscenaBase` (con `escuchar()` y `alLimpiar()`), el modo `?depurar` (overlay DOM y `window.__depurar` con contadores) y un e2e que detecta fugas al ciclar escenas. Va **antes de T-007**.

Parte de lo que dejó T-004: la `EscenaBase` mínima (`src/escenas/EscenaBase.ts`) y la carpeta `src/depurar/` (`depurar.ts` con `window.__juego` y `panelAjustes.ts`). El código nuevo de `?depurar` va en `src/depurar/`, no en `src/depuracion/` como dice la guía de T-034. `window.__juego` se queda tal cual, también solo con `?depurar`: es el `Phaser.Game` para que los e2e manejen escenas, y `window.__depurar` tiene los contadores.

Fuera de alcance: los pedidos del panel de ajustes (recordar valores y ayuda por ajuste) van en T-050.

## Por qué

Phaser limpia lo de la escena en `SHUTDOWN`, pero no lo global (listeners en `scale`, `game.events`, `sound`, `window`, texturas, audio y animaciones). En T-034 se midió: un `scale.off` olvidado pasa de 5 a 35 listeners. Sin esta base, las fugas aparecen tarde, en una partida de 15 minutos en el iPhone.

## Criterios de aceptación

- [x] `EscenaBase` registra la limpieza con `once(SHUTDOWN)`, y los listeners a emisores globales con `escuchar()` o `alLimpiar()` (ESC-01, ESC-02).
- [x] `init()` de `EscenaBase` reinicia sus limpiezas y hace `this.data.reset()`; las subclases llaman `super.init(data)` (ESC-03).
- [x] `?depurar` expone `window.__depurar` y un overlay DOM (`<pre>`, cada 500 ms), no un `Text` de Phaser. La lógica pura vive en `src/depurar/metricas.ts` y `src/depurar/fugas.ts`, sin Phaser (DEP-01). `window.__juego` sigue existiendo, solo con `?depurar`.
- [x] Contadores de DEP-01: listeners globales, texturas, sonidos, caché de audio, animaciones, escenas activas, tweens, MiB de GPU, `actualFps`, p95 y tirones de `rawDelta`, y recargas inesperadas (ROB-04).
- [x] `?depurar` sirve en producción, apagado por defecto y sin datos personales (decisión 7). Ningún código del juego usa `__depurar`.
- [x] e2e de fugas: calentamiento, `antes`, N ciclos (hoy, 30 reinicios de `Arranque`), `despues` y `crecimientos(antes, despues) == []`, esperando 2 frames entre pasos (sección 6.2). Queda listo para que T-007 cicle Calle → Puerta → minijuego → Calle.
- [x] Probado que el detector funciona: con un `off` quitado a propósito, el e2e falla (anotado en la bitácora).
- [x] e2e sin errores (`pageerror` y `console` de tipo error vacíos) y que imprime el tipo de renderer en el log, para saber si el WebKit del CI tiene WebGL.
- [x] La guía de T-034 y el skill `rendimiento-y-memoria` dicen `src/depurar/` (no `src/depuracion/`), documentan `window.__juego` junto a `window.__depurar`, y el ejemplo de TEX-07 de la guía solo borra texturas si la escena sigue apagada (`getStatus() === SHUTDOWN`), igual que el skill.
- [x] Pruebas en las tres capas (unitarias, e2e y manual): unitarias de `metricas.ts` y `fugas.ts`; e2e de fugas y sin errores; manual en el iPhone con M1, M2 y M4 de la guía (overlay visible en Pages, también desde la pantalla de inicio, sin quedar tapado por el notch).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007 o hacerse dentro de ella.
- 2026-10-16: en el brainstorming de T-035 se decidió que T-004 crea una `EscenaBase` mínima (`escuchar()`, `once(SHUTDOWN)` e `init()`). Esta tarea parte de ella y la completa (`alLimpiar()`, `this.data.reset()`, `?depurar` y e2e de fugas).
- 2026-10-18: pedido del product owner tras T-004: que el panel `?depurar` recuerde los valores en el iPhone entre visitas (en el navegador, con `localStorage`) y tenga un botón "volver a los valores por defecto". Así se puede afinar en Pages, de forma casual, sin perder lo ajustado al recargar. Las pruebas no deben depender de lo guardado (ver `docs/planes/README.md`, "Pruebas").
- 2026-10-18: segundo pedido del product owner para el panel `?depurar`: un ícono de ayuda (?) en cada ajuste con **dos partes obligatorias**: (1) **qué es**, en palabras simples, y (2) **cómo se prueba**: los pasos en la calle de prueba y qué se debería notar al subir o bajar el valor. Ejemplo: "Curva de velocidad. Qué es: cuánto recorrido del pulgar se queda en velocidades bajas. Cómo probarla: camina con el pulgar cerca del centro del joystick; con más curva es más fácil ir lento, con menos acelera antes." Hoy hay ajustes que no se entienden solo con el nombre (por ejemplo, ápice colgado).
- 2026-10-18: refinada al tomarla. Decisiones del product owner: (1) los dos pedidos del panel de ajustes pasan a una tarea aparte, T-050, para no agrandar la ruta crítica; (2) el código va en `src/depurar/`, la carpeta que ya existe, y se corrigen la guía y el skill; (3) `window.__juego` se queda junto a `window.__depurar`. Se agregan el criterio de TEX-07 (pendiente de T-035), la casilla de tres capas, `plan: requerido` y la dependencia de T-004.
- 2026-10-18: plan escrito y aprobado por el product owner (`docs/planes/T-037-escena-base-depurar-y-fugas.md`). Se agregó un segundo ciclo al e2e de fugas (`Arranque` ↔ `CallePrueba`).
- 2026-10-18: probado que el detector funciona (paso 5). Con el `em.off` de `escuchar()` quitado a propósito, los dos e2e de fugas fallaron: reiniciar `Arranque` dio `listenersResize` 6 → 36, y el ciclo con `CallePrueba` dio `listenersResize` 7 → 67 y `listenersJuego` 23 → 113 (los 3 listeners de `game.events` × 30 vueltas). Revertido; no entró al commit.
- 2026-10-18: desvíos al programar: `montarDepurar` vive en `src/depurar/montar.ts` y no en `depurar.ts`, porque importa Phaser y `depurar.test.ts` no puede (plan actualizado). `Instantanea` es un `type` y no una `interface`, para pasarla a `crecimientos()` como `Record<string, number>`. La GPU marca ≈93 MiB con una sola textura del juego porque `disablePreFX` aún no está en la config (T-038); cuadra con los 91 MiB de la guía.
- 2026-10-18: revisión de código (Opus). Se corrigieron dos huecos verificados: (1) el detector no veía listeners acumulados en `this.events` de la escena (el patrón de `finished` en T-007): la instantánea pasó a 16 contadores, con `listenersEscenas`, todos los eventos de `scale` y los del renderer. Con `this.events.on('update', …)` puesto a propósito en `Arranque`, el e2e falló con `listenersEscenas` 77 → 107; revertido. (2) `EscenaBase` no limpiaba con `scene.remove` ni `game.destroy`, que emiten `DESTROY` y no `SHUTDOWN`: ahora limpia en los dos. Además: caso positivo de recargas en el e2e, `visibilitychange` para iOS y el skill al día (ya no dice "es de T-037"). Queda abierto: el CI es el primer e2e que falla con cualquier `console.error`; si el WebKit de Linux no decodifica el audio, se verá en el PR.
- 2026-10-18: verificación final de la rama: `npm test` (161 + 39), `npm run build`, `npm run test:presupuestos` (JS inicial 319.2 de 340 KiB) y `npm run test:e2e` (41 de 41). Falta la prueba manual en el iPhone (casilla de tres capas).
- 2026-10-18: CI del PR #19 en verde. El log del e2e imprime `renderer: webgl`: el WebKit de Linux del CI sí tiene WebGL (era 🔬 en la guía, sección 6.2). Sirve para T-040 (*draw calls* y memoria estimada en el CI). Ningún `console.error` en el CI, ni del audio.
- 2026-10-18: prueba manual en el iPhone (servidor de desarrollo de la rama, por WiFi): pasaron M1, M2, M4, E1, E2 y E3. Primera medición en el iPhone, con la calle de prueba: fps 60.2, p95 17 ms, máximo 19 ms, 0 tirones y GPU 102 MiB. La GPU sale alta porque falta `disablePreFX` (T-038, −61 MiB según la guía); es más que en la Mac (93) por el canvas más ancho. Dato para T-041.
