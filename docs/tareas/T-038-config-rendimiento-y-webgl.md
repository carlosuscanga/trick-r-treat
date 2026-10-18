---
id: T-038
titulo: Config de rendimiento y robustez WebGL
tipo: codigo
hito: H2
estado: en-progreso
prioridad: alta
depende: [T-034]
plan: null
rama: T-038-config-rendimiento-y-webgl
worktree: .claude/worktrees/T-038-config-rendimiento-y-webgl
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

- [x] `disablePreFX: true` en la raíz de la config de `main.ts`, y ningún `.preFX` en `src/`.
- [x] Ninguna escena declara `physics.default`; las que usan física declaran `physics: { arcade: {...} }`, y el juego no declara física.
- [x] Hay un módulo de pausa por motivos sin Phaser: el juego se pausa al activarse el primer motivo y se reanuda solo cuando ya no queda ninguno. `pausarEnVertical` lo usa.
- [x] En `LOSE_WEBGL` se activan el motivo "contexto" y la pausa del sonido; en `RESTORE_WEBGL` se quitan. Sin `CONTEXT_LOST` ni `setContextHandlers`.
- [x] `Arranque` quita el listener de `UNLOCKED` al apagarse (con `alLimpiar`).
- [x] La regla de redibujar `RenderTexture`/`DynamicTexture` está en ROB-01 del skill `rendimiento-y-memoria`.
- [ ] Pruebas en las tres capas (unitarias, e2e y manual): unitarias de la pausa por motivos (un motivo, dos motivos, quitar uno no reanuda, quitar uno que no estaba no truena); e2e de la config que leyó Phaser (`game.config`: AUTO, `disablePreFX`, `panicMax: 0`, sin `fps.limit`, sin `disableWebAudio`, sin física por defecto), de la base de GPU ≤ 32 MiB al arrancar, de perder y restaurar el contexto (pausado y reanudado; en vertical sigue pausado) y de que `CallePrueba` tiene `this.physics`; manual en el iPhone con la GPU del overlay (102 → ≈41 MiB), M13 (ir al inicio y volver) y M14 (bloquear y desbloquear) con la calle de prueba.

## Plan

Talla S, plan dentro de la tarea (como T-049). Se carga el skill `rendimiento-y-memoria` antes de programar.

### Pasos

1. **Pausa por motivos** (`src/plataforma/pausa.ts`, sin Phaser). `crearPausa(game, sonido)` devuelve `activar(motivo)`, `quitar(motivo)` y `activos()`. Motivos: `'vertical' | 'contexto'`. Pausa el juego y el sonido (`pauseAll`) al activarse el primer motivo, y reanuda los dos (`resumeAll`) solo cuando ya no queda ninguno. Activar dos veces el mismo motivo, o quitar uno que no estaba, no hace nada. `pausarEnVertical` (`orientacion.ts`) recibe la pausa en lugar del juego y solo activa o quita `'vertical'`. Tests: `pausa.test.ts` nuevo y `orientacion.test.ts` adaptado.
2. **Pérdida de contexto** (`src/plataforma/contexto.ts`, sin importar Phaser en tiempo de ejecución). `pausarSinContexto(renderer, pausa, eventos)` escucha `eventos.perder` y `eventos.restaurar` en el emisor del renderer y activa o quita `'contexto'`. `main.ts` le pasa `Phaser.Renderer.Events.LOSE_WEBGL` y `RESTORE_WEBGL`, y solo si el renderer es WebGL. Test: `contexto.test.ts` con un emisor falso.
3. **Config y escenas:** en `main.ts`, `disablePreFX: true` y crear la pausa una sola vez para los pasos 1 y 2. En `CallePrueba`, quitar `default: 'arcade'` y dejar `physics: { arcade: {...} }`. En `Arranque`, guardar el callback de `UNLOCKED` y quitarlo con `alLimpiar(() => this.sound.off(...))`.
4. **e2e** (`e2e/config.e2e.ts` nuevo, con `?depurar`):
   - `game.config` leído por Phaser: renderer WebGL o AUTO, `disablePreFX` verdadero, `panicMax` 0, sin `fps.limit` (`limitRate` 0), `audio.disableWebAudio` falso y `physics.default` vacío.
   - Base de GPU ≤ 32 MiB en `Arranque` (`__depurar.metricas().gpuMiB`). Se anota en la bitácora el valor que da el CI.
   - Contexto: `WEBGL_lose_context.loseContext()` → `isPaused`; `restoreContext()` → corre otra vez. Caso en vertical: perder, girar a vertical, restaurar → sigue pausado; girar a horizontal → corre.
   - `CallePrueba` tiene `this.physics`.
5. **Skill:** en ROB-01 de `rendimiento-y-memoria` (y en `references/robustez.md` si repite la regla), la regla de redibujar `RenderTexture`/`DynamicTexture` y la mención de la pausa por motivos (nadie llama `game.pause()`/`resume()` directo: se usa un motivo).
6. **Revisión** de toda la rama y **verificación:** `npm test`, `npm run test:e2e`, `npm run build` y `npm run test:presupuestos`.
7. **Prueba manual** en el iPhone, una por una (tabla abajo). Va también en la descripción del PR.

### Pruebas

- **Unitarias:** `pausa.test.ts` (un motivo pausa; dos motivos y quitar uno no reanuda; quitar el último reanuda; repetir `activar` o `quitar` no hace nada; el sonido sigue al juego), `orientacion.test.ts` (adaptado a la pausa) y `contexto.test.ts` (perder activa `'contexto'` y restaurar lo quita).
- **e2e:** los cuatro grupos del paso 4.
- **Manual en el iPhone** (servidor de la rama por WiFi, con `?depurar`):

| # | Paso | Esperado |
|---|---|---|
| 1 | Abrir la calle de prueba y leer GPU en el overlay | ≈41 MiB (antes 102) |
| 2 | M13: a mitad de un salto, ir al inicio, esperar 30 s y volver | Sin salto de física, sin recarga |
| 3 | M14: bloquear el teléfono 2 min y desbloquear | Igual que 2; "recargas inesperadas: 0" |
| 4 | Girar a vertical y volver a horizontal | Aviso de girar, y el juego sigue igual que antes |

La pérdida de contexto no se puede provocar a mano en el iPhone: la cubre el e2e.

### Modelo y esfuerzo

| Paso | Quién | Modelo y esfuerzo | Por qué |
|---|---|---|---|
| 1 y 2 | Un subagente | Sonnet `medium` | Lógica chica y bien especificada, con tests. Van juntos porque el 2 usa la pausa del 1. |
| 3 y 4 | Un subagente (después del 1 y 2) | Sonnet `medium` | Cableado y e2e con patrones que ya existen (`fugas.e2e.ts`, `pantalla.e2e.ts`). |
| 5 | Un subagente, en paralelo con 1 y 2 | Haiku `low` | Texto del skill, mecánico. |
| 6 | `code-reviewer-opus55` | Opus `high` | Revisión de la rama completa, como en T-037. |
| Orquestar y verificar | Sesión principal | Opus `high` | Decide, integra y corre la verificación. |

### Decisión

La pausa por motivos también **pausa el sonido** (decidido por el product owner). Hoy, en vertical, el juego se congela pero el sonido sigue (Phaser no lo pausa con `game.pause()`). Con un solo dueño, vertical y contexto pausan las dos cosas. Hoy no hay música, así que no se nota todavía; con la música de T-017, en vertical se callará.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe estar antes de T-007. Podría ir junto con T-037, pero va separada por la regla de "un cambio a la vez".
- 2026-10-18: refinada al tomarla, tras revisar su alcance (base, esperar medición o descartar). Talla S. Decisiones del product owner, una a una: (1) entra la **pausa por motivos**, porque `pausarEnVertical` ya pausa y ROB-01 sería un segundo dueño de la pausa; (2) la config se prueba en **e2e** leyendo `game.config`, sin exportarla como objeto; (3) redibujar lo dinámico queda para después, con una regla en el skill; (4) el e2e de contexto no revisa el "píxel conocido". `panicMax` y el estado de `Arranque` en `init()` ya estaban hechos. M11 y las perillas de FRA-05/06/09 quedan en T-041. Con esto se resuelve el pendiente de la retro "bajar T-038 a T-040": no hace falta, lo especulativo quedó fuera. Plan dentro de la tarea, como en T-049.
- 2026-10-18: plan escrito dentro de la tarea y aprobado por el product owner (revisado aquí, en resumen). Decisión: la pausa por motivos también pausa el sonido, así que en vertical se calla.
- 2026-10-18: pasos 1 a 5 hechos con subagentes (Sonnet `medium` para el código, Haiku `low` para el skill). El e2e mide la base de GPU en `Arranque` en **29.8 MiB** (límite 32; antes ≈91). JS inicial: 319.4 de 340 KiB. Confirmado en el código de Phaser: `game.renderer` y `game.sound` ya existen en `main.ts` (el módulo corre con el DOM listo) y la pausa no choca con la visibilidad, el *blur* ni el desbloqueo de audio de iOS.
- 2026-10-18: revisión de código (Opus `high`), sin bloqueantes. Se corrigieron: (1) la pausa reanudaba **todos** los sonidos, también los pausados a propósito: ahora pausa los que sonaban y reanuda solo esos (importa para la música de T-017); (2) el e2e de vertical usaba una espera fija de 500 ms; (3) el e2e no detectaba un `physics.default` en la escena; (4) texto viejo de ROB-01 en el skill. **Para después (T-007):** con el juego pausado, los toques siguen llegando a las escenas (Phaser despacha la entrada aunque `isPaused`). En vertical no pasa porque el aviso tapa el canvas; con el contexto perdido, sí. Si una escena dispara sonido o lógica con un toque, conviene revisar `this.game.isPaused`.
