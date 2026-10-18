---
name: rendimiento-y-memoria
description: Reglas de rendimiento, memoria y caché de 🎃 Trick-r-Treat para Phaser 3.90 + Vite en Safari de iPhone (piso iPhone 13, iOS 26.6), con presupuestos y cómo verificarlos. Se usa siempre que se escriba, planee o revise código en src/ que cree, cambie o cierre escenas o minijuegos; cargue o libere assets (imágenes, atlas, spritesheets, audio); use tweens, timers, física Arcade, grupos, partículas, postFX, luces, Text o TileSprite; registre listeners (this.scale.on, this.events.on, game.events, sound, window); cree objetos dentro de update; o toque main.ts, vite.config.ts, public/, src/assets/, el service worker o la caché. También cuando un plan, PR o prueba hable de fps, tirones, memoria, fugas, recargas de la página, tiempos de carga, tamaño del bundle o presupuestos, aunque no se pida.
---

# Rendimiento y memoria

## Contexto

- **Phaser 3.90, nunca Phaser 4.** Los skills y la documentación oficial actual de Phaser son de la v4: no sirven aquí. Ante la duda, lee el código fuente en `node_modules/phaser/src/` (`scene/Systems.js`, `scene/SceneManager.js`, `core/TimeStep.js`, `sound/BaseSoundManager.js`, `textures/TextureManager.js`, `gameobjects/group/Group.js`).
- **Piso:** iPhone 13, iOS 26.6, Safari y pantalla de inicio, en horizontal. Si Safari se queda sin memoria, recarga la página en silencio (jetsam): perder la partida es el peor bug.
- **El porqué completo** de cada regla está en la guía de T-034: [`docs/planes/T-034-performance-y-memoria.md`](../../../docs/planes/T-034-performance-y-memoria.md). Aquí va solo la receta.

## Reglas no negociables

1. **ESC-01:** toda escena hereda de `EscenaBase`; todo listener a un emisor que vive más que la escena (`this.scale`, `this.game.events`, `this.registry.events`, `this.sound`, `this.textures`) va con `this.escuchar(emisor, evento, fn)`.
2. **ESC-02:** la limpieza se registra con `this.events.once(SHUTDOWN, …)`, nunca con `on`.
3. **ESC-03:** el estado de la escena se reinicia en `init()`, no en campos de clase: `start`/`restart` reusan la misma instancia.
4. **ESC-04:** `this.anims.create` y `generateTexture` solo con guarda `exists`.
5. **TEX-07 / AUD-05:** al salir, el minijuego libera sus texturas (`textures.remove`, un tick después de `SHUTDOWN`) y su audio (`sound.removeByKey` + `cache.audio.remove`). Nunca lo compartido (Mi vo, HUD, Calle).
6. **POO-01:** objetos efímeros (dulces, proyectiles) en un grupo con `maxSize`; `get()` puede devolver `null` y no activa ni muestra: usa `enableBody`/`disableBody` o `setActive`/`setVisible`.
7. **POO-03:** cero asignaciones evitables en `update()`: nada de `new`, `{}`, `[]`, `.map/.filter/.forEach` ni *closures* por frame. Reusa campos (`this.tmp.set(…)`).
8. **FRA-04:** todo movimiento depende del tiempo: `x += vel * delta / 1000`, cuerpos Arcade, tweens o `this.time`. Nunca px por frame ni "cada N frames".
9. **FRA-02 / FRA-03:** sin `fps.limit`; `fps: { panicMax: 0 }` en la config del juego.
10. **TEX-08:** `disablePreFX: true` en la raíz de la config del juego; nadie usa `.preFX`.
11. **TEX-02 / TEX-03 / TEX-04:** atlas NPOT, ningún lado mayor que 2048 px, arte a 1x del tamaño lógico (alto 720; máximo ×1.25).
12. **TEX-05:** parallax con `Image` + `setScrollFactor`; `TileSprite` solo con patrones POT de ≤ 512².
13. **RED-03:** los assets viven en `src/assets/`, se importan (con hash) y pasan por `paraLoader()` (`src/plataforma/assets.ts`); `public/` solo para nombres fijos.
14. **ROB-01:** en `LOSE_WEBGL` se pausa con el motivo `'contexto'` y en `RESTORE_WEBGL` se redibuja y se quita. Nunca `game.pause()`/`resume()` directo: usa `pausa.activar`/`quitar` (`src/plataforma/pausa.ts`). Toda `RenderTexture`/`DynamicTexture` se redibuja en `RESTORE_WEBGL`.
15. **ESC-07:** la física se declara en la escena que la usa (`physics: { arcade: {…} }`); el juego no declara `default`.
16. **AUD-01:** todo con Web Audio; nunca `audio.disableWebAudio`.

## Bases mínimas

Varias reglas dependen de piezas que llegan en tareas posteriores. **Criterio:** si la tarea lo necesita, crea la **base mínima** con el comentario `// mínima; T-0NN la completa` y no la refines. Si ya existe, úsala y no la reescribas. Si la tarea no la necesita, no crees nada.

| Si falta… | Base mínima | La completa |
|---|---|---|
| `src/escenas/EscenaBase.ts` | ya existe, completa (T-037): úsala | — |
| `paraLoader` en `src/plataforma/assets.ts` | la función de una línea de RED-03 | T-039 (aviso de versión nueva, lista blanca de `public/`) |
| `?depurar` y el e2e de fugas | ya existen (T-037): úsalos; `window.__juego` y `window.__depurar` | — |
| `test:presupuestos` | ya existe (T-036): úsalo, no lo dupliques | — |
| config del juego (`disablePreFX`, `panicMax`, LOSE/RESTORE) | solo la línea que tu tarea necesite | T-038 |

`EscenaBase` completa está en `src/escenas/EscenaBase.ts`: hereda de ella (plantilla en [`references/escenas-y-fugas.md`](references/escenas-y-fugas.md#plantilla-completa-de-escenabase-t-037)).

## Trampas conocidas → cómo probarlas

Edge cases que encontró la investigación. Si tu tarea toca una, su prueba va en el plan **antes de programar**.

| Trampa | Lo que ve el jugador | Regla | Prueba |
|---|---|---|---|
| Reiniciar la escena duplica listeners | doble salto, joystick que responde dos veces | ESC-01, ESC-02 | e2e: reiniciar N veces y comprobar que `listenerCount` de `scale`/`game.events` no crece |
| El estado sobrevive al reinicio | el segundo intento no empieza en 0 | ESC-03 | e2e: jugar 2 veces seguidas, la segunda empieza en 0 |
| `delta` recortado 120 frames al volver del segundo plano | cámara lenta al regresar a la app | FRA-03 | unitaria de la config (`panicMax: 0`); manual: salir y volver en el iPhone |
| Movimiento por frame | al doble de velocidad a 120 Hz, a la mitad a 30 fps | FRA-04 | unitaria: `avanzar(pos, vel, deltaMs)` da lo mismo con 8.3, 16.7 y 33.3 ms |
| El sonido en bucle sigue tras parar la escena | música del minijuego en la Calle | AUD-05 | e2e: `sound.getAll().length` y `cache.audio.getKeys().length` vuelven a la base |
| `group.get()` recicla pero no muestra | dulces invisibles o que chocan sin verse | POO-01 | e2e: soltar 200 → `getLength() ≤ maxSize` y `displayList.length` estable |
| Claves de animación globales | se acumulan en cada `create()` | ESC-04 | e2e: `game.anims` no crece tras N reinicios |
| Pérdida del contexto WebGL | pantalla negra al volver; la lógica siguió corriendo | ROB-01 | e2e: `WEBGL_lose_context.loseContext()` → pausado; `restoreContext()` → reanuda |
| `fps.limit` | 38–48 updates/s en lugar de 60 | FRA-02 | unitaria de la config: no hay `limit` |

## Presupuestos

Medidos con el canvas de peor caso (1872×720). ✅ = medido o calculado; 🔬 = se calibra en el iPhone (T-041). Detalle: [`references/medir.md`](references/medir.md).

| Qué | Valor | Estado |
|---|---|---|
| JS inicial (gzip) | ≤ 340 KiB (hoy 317.6) | ✅ |
| Assets de la Calle / por minijuego | tope 2.5 MB / 1 MB | 🔬 |
| Lado máximo de textura | ≤ 2048 px | ✅ |
| Base GPU de Phaser con `disablePreFX` | ≤ 32 MiB | ✅ |
| Texturas vivas del juego | ≤ 64 MiB (Calle + Mi vo + HUD ≤ 44; minijuego ≤ 16) | ✅ cálculo / 🔬 tope |
| PCM de audio vivo | ≤ 40 MB (música ≤ 17.3 MB: 90 s mono a 48 kHz) | ✅ cálculo / 🔬 tope |
| Crecimiento tras N ciclos de escenas | 0 en contadores | ✅ método |
| Tiempo de frame | p95 ≤ 18 ms, p99 ≤ 34 ms, `actualFps` ≥ 57 | 🔬 |
| Entrar a un minijuego | ≤ 500 ms precargado | 🔬 |

## Plantilla de minijuego

```ts
import Phaser from 'phaser';
import { EscenaBase } from './EscenaBase';

export class LluviaDeDulces extends EscenaBase {
  private puntos = 0;
  private dulces!: Phaser.Physics.Arcade.Group;
  constructor() { super({ key: 'LluviaDeDulces', physics: { arcade: { gravity: { x: 0, y: 0 } } } }); } // ESC-07
  init(data?: unknown) { super.init(data); this.puntos = 0; }                                        // ESC-03
  preload() { /* atlas y audio sprite propios, con paraLoader (RED-03) */ }
  create() {
    this.dulces = this.physics.add.group({ maxSize: 30 });                                        // POO-01
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);                       // ESC-01
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {                                       // TEX-07, AUD-05
      this.sound.removeByKey('lluvia-sfx'); this.cache.audio.remove('lluvia-sfx');
      this.game.events.once(Phaser.Core.Events.POST_STEP, () => {
        if (this.sys.getStatus() !== Phaser.Scenes.SHUTDOWN) return;                              // restart(): ya volvió a arrancar
        if (this.textures.exists('lluvia')) this.textures.remove('lluvia');
      });
    });
  }
  update(_t: number, delta: number) { /* sin asignaciones; todo con delta (POO-03, FRA-04) */ }
  private reacomodar() { /* lo importante dentro de la zona segura de 1280×720 */ }
}
```

Recibe la dificultad y si el disfraz da ventaja, y emite `finished(won)` (ver `CLAUDE.md`, "Minijuegos desacoplados").

## Checklist de PR

- [ ] ¿Toda escena nueva hereda de `EscenaBase` y las que redefinen `init` llaman `super.init(data)`? (ESC-01, ESC-03)
- [ ] ¿Algún `.on(` a `scale`, `game.events`, `registry.events`, `sound`, `textures`, `window` o `document` fuera de `escuchar()`? (ESC-01)
- [ ] ¿Estado en campos de clase o en `this.data` sin reiniciar? (ESC-03)
- [ ] ¿`anims.create` o `generateTexture` sin guarda `exists`? (ESC-04)
- [ ] ¿`scene.remove` sin motivo, o una Calle que se para en vez de dormir? (ESC-05)
- [ ] ¿Física declarada en la escena que la usa? (ESC-07)
- [ ] ¿El minijuego libera sus texturas y su audio? (TEX-07, AUD-05)
- [ ] ¿`new`, `{}`, `[]`, `.map/.filter/.forEach` o *closures* dentro de `update()`? (POO-03)
- [ ] ¿Efímeros con `destroy()` + `add.*` en vez de pool? ¿Se maneja el `null` de `get()`? (POO-01)
- [ ] ¿Movimiento sin `delta` o "cada N frames"? (FRA-04)
- [ ] ¿`fps.limit`, `disableWebAudio`, `.preFX`, `CONTEXT_LOST` o `setContextHandlers`? (FRA-02, AUD-01, TEX-08, ROB-01)
- [ ] ¿`game.pause()`/`resume()` directo en vez de un motivo de la pausa? ¿`RenderTexture`/`DynamicTexture` sin redibujar en `RESTORE_WEBGL`? (ROB-01)
- [ ] ¿Más de un postFX de cámara permanente? ¿Light2D con `maxLights` por defecto? (FRA-05, FRA-06)
- [ ] ¿`add.tileSprite` con frame mayor que 512²? ¿`Text` que cambia cada frame? (TEX-05, TEX-06)
- [ ] ¿Assets nuevos en `src/assets/` con `paraLoader`? ¿Algo nuevo en `public/`? (RED-03)
- [ ] ¿Textura POT sin justificación, mayor que 2048 o a más de ×1.25? (TEX-02/03/04)
- [ ] ¿`import()` dinámico sin manejar `vite:preloadError`? (CAR-02, RED-04)
- [ ] ¿Las pruebas de las trampas que toca el PR están en unitarias, e2e o en la tabla manual del iPhone?
- [ ] ¿Pasan `npm test`, `npm run test:e2e`, `npm run build` y `npm run test:presupuestos`?

## Mapa de referencias

| Si vas a tocar… | Lee |
|---|---|
| Escenas, `EscenaBase`, listeners, reinicios, `sleep`/`stop` | [`references/escenas-y-fugas.md`](references/escenas-y-fugas.md) |
| Arte, atlas, texturas, postFX, luces, parallax, el cutout de Mi vo | [`references/texturas-y-gpu.md`](references/texturas-y-gpu.md) |
| Música, efectos, audio sprites, el minijuego de Ritmo | [`references/audio.md`](references/audio.md) |
| `update`, `delta`, fps, pools, partículas, GC | [`references/frames-y-tiempo.md`](references/frames-y-tiempo.md) |
| `preload`, `src/assets/`, `public/`, bundle, caché, deploys | [`references/carga-y-cache.md`](references/carga-y-cache.md) |
| Contexto WebGL, recargas por jetsam, guardar partida | [`references/robustez.md`](references/robustez.md) |
| `?depurar`, qué prueba va en qué capa, herramientas del iPhone | [`references/medir.md`](references/medir.md) |
| Fuentes y código de Phaser que respalda cada regla | [`references/fuentes.md`](references/fuentes.md) |

## Patrones descartados

- **Phaser 4** y sus skills oficiales: el proyecto se queda en 3.90 (`CLAUDE.md`).
- **`performance.memory`:** no existe en Safari. Para memoria: contadores de `?depurar` y Web Inspector.
- **`fps.limit`:** pierde updates (FRA-02).
- **`TileSprite` grande** para fondos: hasta ≈29 MiB por capa contra 5 MiB como `Image` (TEX-05).
- **`audio.disableWebAudio`:** en iOS ignora `volume` y tiene peor latencia (AUD-01).
