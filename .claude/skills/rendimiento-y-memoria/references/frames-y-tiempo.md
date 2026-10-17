# Frames, tiempo y pooling (POO y FRA)

Reglas de pooling y de framerate para Phaser 3.90. Guía completa: [T-034](../../../../docs/planes/T-034-performance-y-memoria.md).

### POO-01 · Objetos efímeros en un grupo con `maxSize`
- **Hacer:** dulces y proyectiles van en un grupo con `maxSize`; se reciclan, no se destruyen. `get()` no activa ni muestra el objeto, y con el grupo lleno devuelve `null`: maneja ese caso. Usa `enableBody`/`disableBody`, porque un cuerpo invisible sigue chocando.
  ```ts
  this.dulces = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 30, defaultKey: 'lluvia', defaultFrame: 'dulce' });
  const d = this.dulces.get(x, -40) as Phaser.Physics.Arcade.Image | null;
  if (d) { d.enableBody(true, x, -40, true, true); d.setVelocityY(200); }
  // al recoger: d.disableBody(true, true);
  ```
- **Verifica:** e2e (soltar 200 dulces: `getLength() ≤ 30` y `displayList.length` estable); unitaria (la lógica de cuándo soltar, pura, sin Phaser).
- **Por qué:** `get()` recicla el primer miembro inactivo pero no lo activa. [Guía 4.5](../../../../docs/planes/T-034-performance-y-memoria.md#45-pooling-y-gc-poo).

### POO-02 · Partículas: un emisor por escena
- **Hacer:** crea el emisor una vez en `create()` con `emitting: false` y `maxParticles`; dispara con `explode()`. Nunca un emisor por evento.
  ```ts
  this.chispas = this.add.particles(0, 0, 'lluvia', { frame: 'chispa', emitting: false, maxParticles: 60, lifespan: 600 });
  this.chispas.explode(20, x, y);
  ```
- **Verifica:** revisión de código.
- **Por qué:** `ParticleEmitter` ya es un pool; crear uno por evento genera basura. [Guía 4.5](../../../../docs/planes/T-034-performance-y-memoria.md#45-pooling-y-gc-poo).

### POO-03 · Cero asignaciones evitables en `update()` y en callbacks por frame
- **Hacer:** reutiliza campos (`private tmp = new Phaser.Math.Vector2()` y `this.tmp.set(...)`), bucles `for` indexados, callbacks creados en `create`, `setText` solo cuando cambia el valor, y `physics.add.overlap` una vez en lugar de `filter` por frame. Nada de `new`, `{}`, `[]`, `.map/.filter/.forEach` ni closures dentro de `update()`.
- **Verifica:** revisión de código; manual en el iPhone (Timelines › JavaScript Allocations).
- **Por qué:** una pausa de GC de 1 a 3 ms se nota con 16.7 ms por frame. [Guía 4.5](../../../../docs/planes/T-034-performance-y-memoria.md#45-pooling-y-gc-poo).

### FRA-01 · `Phaser.AUTO`; efectos solo con WebGL
- **Hacer:** `type: Phaser.AUTO`. Aplica postFX solo si `this.renderer.type === Phaser.WEBGL`; Canvas es el respaldo y no tiene postFX ni Light2D.
- **Si todavía no existe:** el overlay que imprime el tipo de renderer es `?depurar` (T-037). Si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-037 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** revisión de código; el overlay imprime el tipo de renderer.
- **Por qué:** 3.90 pide WebGL 1 y Safari lo corre sobre ANGLE + Metal. [Guía 4.6](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-02 · No usar `fps.limit`
- **Hacer:** deja `fps` sin `limit`. Safari ya entrega 60 Hz como máximo por defecto.
- **Si todavía no existe:** la config del juego es de T-038. Si la tarea la necesita, crea la base mínima con el comentario "mínima; T-038 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** unitaria sobre la config del juego (`fps.limit` es `undefined`).
- **Por qué:** `limit: 60` mide 37.7 a 48.1 updates/s por un bug del acumulador. [Guía 4.6](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-03 · `fps: { panicMax: 0 }`
- **Hacer:** en la config del juego, `fps: { panicMax: 0 }` (sin `limit`).
- **Si todavía no existe:** la config es de T-038: crea la base mínima solo si la tarea la necesita, con el comentario "mínima; T-038 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** unitaria de la config; manual en el iPhone con Modo de bajo consumo (M11 y M13).
- **Por qué:** sin esto, tras cada vuelta del segundo plano el juego corre a media velocidad unos 4 s a 30 fps. [Guía 4.6](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-04 · La lógica depende del tiempo, no de los frames
- **Hacer:** mueve con `delta` (`x += vel * delta / 1000`), cuerpos Arcade (`fixedStep: true`, 60 Hz, el valor por defecto), tweens y `this.time.addEvent`. Nunca `if (frame % 30 === 0)`.
- **Verifica:** unitaria (función pura `avanzar(pos, vel, deltaMs)` da el mismo resultado con 8.3, 16.7 y 33.3 ms); manual (M11, M12).
- **Por qué:** el juego puede correr a 30, 60 o 120 fps. [Guía 4.6](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-09 · `antialiasGL`, `roundPixels` y `loop.sleep()`: no tocar sin medir
- **Hacer:** déjalos como están. No cambies `antialiasGL`, `roundPixels` ni uses `loop.sleep()` en menús sin una medición en el iPhone.
- **Verifica:** manual en el iPhone.
- **Por qué:** ahorran poco y tienen costo visual o complejidad. [Guía 4.6](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

## Presupuestos de tiempo de frame

Se miden en el iPhone 13; son SLOs que se calibran ahí. [Guía 5](../../../../docs/planes/T-034-performance-y-memoria.md#5-presupuestos-para-el-iphone-13).

| Qué | Valor | Cómo se mide |
|---|---|---|
| Tiempo de frame | p95 ≤ 18 ms, p99 ≤ 34 ms, ≤ 1 tirón (> 33.4 ms) cada 10 s, `actualFps` ≥ 57 | overlay `?depurar` (`rawDelta`) y Rendering Frames |
| Trabajo por frame en la Calle | ≤ 8 ms | Timelines › Frames |
| Modo de bajo consumo | jugable a 30 fps, a la misma velocidad en segundos | manual |

- **Si todavía no existe:** el overlay `?depurar` que mide `rawDelta` es de T-037. Si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-037 la completa"; no la refines; si ya existe, úsalo.
- `performance.now()` tiene resolución de 1 ms en WebKit, así que los umbrales van en ms enteros.
