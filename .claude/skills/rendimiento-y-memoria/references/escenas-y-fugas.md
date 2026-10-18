# Escenas y fugas (ESC-01 a ESC-07)

Phaser 3.90. Phaser limpia solo, en `SHUTDOWN`: display list, update list, tweens, timers, Arcade, input, cámaras, loader y luces. **No limpia:** `this.events` de usuario, `this.data`, texturas, sonidos, caché de audio, animaciones ni listeners en emisores globales.

## Índice

- [Reglas ESC-01 a ESC-07](#esc-01--escenabase-y-escuchar)
- [Plantilla mínima de EscenaBase (T-004)](#plantilla-mínima-de-escenabase-t-004)
- [Plantilla completa de EscenaBase (T-037)](#plantilla-completa-de-escenabase-t-037)
- [e2e de fugas](#e2e-de-fugas)

### ESC-01 · EscenaBase y escuchar()
- **Hacer:** toda escena hereda de `EscenaBase`. Todo listener a un emisor que vive más que la escena (`this.scale`, `this.game.events`, `this.registry.events`, `this.sound`, `this.textures`) va con `this.escuchar(...)`. Para `window`, `document` y `ResizeObserver`, `alLimpiar()`.
- `EscenaBase` completa ya existe (T-037), con `escuchar()` y `alLimpiar()`: úsala y no la reescribas.
- **Verifica:** e2e de fugas (abajo); revisión: ningún `.on(` a un emisor global fuera de `escuchar`.
- **Por qué:** cada `create()` agrega otra copia del listener y la closure retiene la escena entera. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-02 · Limpieza con once(SHUTDOWN)
- **Hacer:** registra la limpieza con `this.events.once(Phaser.Scenes.Events.SHUTDOWN, ...)` en `init()`, nunca con `on`.
- **Si todavía no existe:** viene dentro de `EscenaBase` (ver ESC-01).
- **Verifica:** e2e: `sys.events.listenerCount('shutdown')` estable tras reiniciar la escena.
- **Por qué:** `this.events` sobrevive a `stop`/`start`; con `on`, cada arranque suma otro handler. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-03 · Estado en init(), no en campos de clase
- **Hacer:** `init() { super.init(); this.puntos = 0; this.terminado = false; }`. Si usas `this.data`, `this.data.reset()` (lo hace la `EscenaBase` completa).
- `EscenaBase.init()` ya hace `this.data.reset()` (T-037).
- **Verifica:** e2e: jugar el minijuego 2 veces seguidas empieza en 0.
- **Por qué:** `start` y `restart` reutilizan la misma instancia y el constructor corre una sola vez. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-04 · Animaciones y texturas generadas, una vez o con guarda
- **Hacer:** `if (!this.anims.exists('mivo-camina')) this.anims.create({ key: 'mivo-camina', ... });` Igual con texturas generadas.
- **Verifica:** e2e: `game.anims.anims.size` estable tras ciclar.
- **Por qué:** `AnimationManager` es global y una clave nueva en cada `create()` acumula. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-05 · Calle con sleep/wake; minijuegos con stop
- **Hacer:** la Calle se duerme y se despierta (`scene.sleep` / `scene.wake`); los minijuegos usan `stop`. Nunca `remove`, salvo para descartar una escena para siempre. El `resize` de una escena dormida debe funcionar.
- **Verifica:** revisión; e2e: ciclo Calle → Puerta → minijuego → Calle sin crecimiento.
- **Por qué:** `sleep` es barato al volver, `stop` libera, `remove` destruye la instancia, y una escena dormida sigue recibiendo eventos globales. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-06 · Dos detalles latentes de Arranque (al tocar escenas, T-007)
- **Hacer:** en `src/escenas/Arranque.ts`, el `this.sound.once(UNLOCKED)` es un emisor global: ciérralo al apagar la escena (con `escuchar()`) o protege el `setText` contra un `Text` destruido. Mueve `esperandoDesbloqueo` y `errorDeCarga` a `init()`.
- **Verifica:** e2e de fugas sobre `Arranque` (reiniciarla N veces sin crecimiento).
- **Por qué:** si la escena se apaga antes del desbloqueo, el callback actúa sobre un objeto destruido. [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

### ESC-07 · Física declarada en la escena
- **Hacer:** la escena que usa física la declara con la clave del sistema: `super({ key: 'Calle', physics: { arcade: { gravity: { x: 0, y: 900 } } } })`. El juego no declara `default`.
- **Verifica:** revisión; e2e: `this.physics` existe en las escenas que lo usan.
- **Por qué:** evita un `World` de Arcade en Menú y Resultado; `{ default: 'arcade' }` en una escena falla en silencio (`this.physics` undefined). [guía §4.4](../../../../docs/planes/T-034-performance-y-memoria.md#44-escenas-y-fugas-esc)

## Plantilla mínima de EscenaBase (T-004)

Histórica: ya no hace falta, la completa existe desde T-037.

Si la tarea la necesita y no existe, créala así en `src/escenas/EscenaBase.ts`:

```ts
// mínima; T-037 la completa
export abstract class EscenaBase extends Phaser.Scene {
  private limpiezas: Array<() => void> = [];
  init(_data?: unknown) {                       // las subclases llaman super.init(data)
    this.limpiezas = [];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.limpiezas.splice(0).forEach((f) => f()));
  }
  protected escuchar(em: Phaser.Events.EventEmitter, ev: string | symbol, fn: (...a: any[]) => void) {
    em.on(ev, fn, this); this.limpiezas.push(() => em.off(ev, fn, this));
  }
}
// create(): this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
```

## Plantilla completa de EscenaBase (T-037)

```ts
export abstract class EscenaBase extends Phaser.Scene {
  private limpiezas: Array<() => void> = [];
  init(_data?: unknown) {                       // las subclases llaman super.init(data)
    this.limpiezas = [];
    this.data.reset();                          // this.data no se vacía solo (ESC-03)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.limpiezas.splice(0).forEach((f) => f()));
  }
  protected escuchar(em: Phaser.Events.EventEmitter, ev: string | symbol, fn: (...a: any[]) => void) {
    em.on(ev, fn, this); this.limpiezas.push(() => em.off(ev, fn, this));
  }
  protected alLimpiar(fn: () => void) { this.limpiezas.push(fn); }
}
// create(): this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
```

## e2e de fugas

Es la capa de prueba de ESC-01 a ESC-05 ([guía §6.2](../../../../docs/planes/T-034-performance-y-memoria.md#62-e2e-playwright-webkit-con-emulación-de-iphone)).

- Ya existe (T-037): `e2e/fugas.e2e.ts`, con `window.__depurar.instantanea()` y `crecimientos()` de `src/depurar/fugas.ts`. Para un ciclo nuevo, reusa su helper en lugar de copiarlo.
- **Receta:** abrir `./?depurar`; 1 ciclo de calentamiento; `antes = __depurar.instantanea()`; ciclar N veces (hoy reiniciar `Arranque` 30 veces; después Calle → Puerta → minijuego con `finished(true)` simulado → Calle, 8 casas × 3 vueltas); `despues = ...`; exigir `crecimientos(antes, despues)` igual a `[]`.
- **Esperas:** 2 frames entre pasos, porque `stop` y `start` se encolan.
- **Sin errores:** `page.on('pageerror')` y los `console` de tipo error, vacíos durante los ciclos.
- **No confiable en CI:** fps, p95, tiempos absolutos y memoria absoluta.
- **Antes de abrir el PR:** revisa el [checklist](../../../../docs/planes/T-034-performance-y-memoria.md#8-checklist-para-revisar-un-pr).
