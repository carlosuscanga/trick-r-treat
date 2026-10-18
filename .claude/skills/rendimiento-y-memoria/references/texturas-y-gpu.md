# Texturas y GPU

Reglas TEX-01 a TEX-09 (texturas y arte) y FRA-05 a FRA-08 (postFX, Light2D, cutout de Mi vo y parallax). Solo APIs de Phaser 3.90.

## Índice

- [Texturas y arte (TEX)](#texturas-y-arte-tex): TEX-01 a TEX-09
- [Efectos, cutout y parallax (FRA)](#efectos-cutout-y-parallax-fra): FRA-05 a FRA-08

## Texturas y arte (TEX)

### TEX-01 · Un atlas por escena o familia, y objetos ordenados por textura
- **Hacer:** un atlas por disfraz de Mi vo, uno de escenografía de la Calle, uno de HUD y controles y uno por minijuego. Usa `this.add.image(x, y, 'calle', 'farol')`, no un PNG suelto. No intercales en profundidad objetos de atlas distintos.
- **Si todavía no existe:** el contador de `drawArrays` (*draw calls*) lo agrega T-040, no T-037: no lo construyas antes; si el e2e lo necesita, calcula a mano en el test o mide en el iPhone.
- **Verifica:** e2e que cuenta `drawArrays` por frame con `?depurar` (WebKit con emulación de iPhone usa el mismo pipeline móvil); más revisión de código.
- **Por qué:** en móvil cada cambio de textura es otro draw call (11 sprites alternando 2 texturas: 10 draw calls; agrupados: 2). [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-02 · Atlas NPOT; POT solo para texturas que se repiten
- **Hacer:** exporta los atlas con "Power of two: off". Una textura POT solo se justifica si se repite.
- **Si todavía no existe:** si falta el manifest de assets, crea el mínimo con el comentario "mínima; T-040 la completa" y úsalo para la justificación; no lo refines.
- **Verifica:** unitaria que lee ancho y alto del encabezado PNG/WebP y falla si es POT sin justificación en el manifest.
- **Por qué:** Phaser 3.90 genera mipmaps en toda textura POT aunque no se usen: +33 % de memoria. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-03 · Ninguna textura de más de 2048 px de lado
- **Hacer:** corta los fondos largos en segmentos de 2048 px o menos.
- **Si todavía no existe:** igual que TEX-02 (manifest mínimo, "mínima; T-040 la completa").
- **Verifica:** unitaria sobre los encabezados de las imágenes (lado máximo ≤ 2048).
- **Por qué:** el límite real es la memoria, no `MAX_TEXTURE_SIZE`: 4096² POT = 85 MiB. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex) y [presupuestos](../../../../docs/planes/T-034-performance-y-memoria.md#5-presupuestos-para-el-iphone-13).

### TEX-04 · Arte a 1x del tamaño lógico; máximo ×1.25 si crece
- **Hacer:** dibuja cada pieza al tamaño en que se ve en unidades lógicas (alto 720). Máximo ×1.25 para piezas que crecen con tweens o zoom. Ejemplo: cabeza de 120 px lógicos, pieza de 120 a 150 px.
- **Si todavía no existe:** igual que TEX-02 (manifest mínimo con el tamaño en pantalla de cada pieza, "mínima; T-040 la completa").
- **Verifica:** unitaria (manifest: tamaño del archivo / tamaño en pantalla ≤ 1.25); manual en el iPhone (nitidez).
- **Por qué:** en FIT el canvas mide el tamaño lógico y Safari lo estira; un sprite a 2x cuesta 4 veces la memoria sin ganar nitidez. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-05 · Parallax con Image + setScrollFactor
- **Hacer:** `this.add.image(x, 720, 'calle', 'lejos-1').setOrigin(0, 1).setScrollFactor(0.2)`, repitiendo `x` por segmento con el mismo frame. Cielo: `Rectangle` o imagen de 1×720 estirada. `add.tileSprite` solo con patrones POT de 512² o menos.
- **Verifica:** revisión (buscar `add.tileSprite`); e2e de memoria estimada y draw calls.
- **Por qué:** una capa de 1872×720 como `TileSprite` cuesta ≈23.8–29 MiB contra 5.14 MiB como `Image`, y rompe el batch. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-06 · Text para lo estático; BitmapText para contadores vivos
- **Hacer:** `this.add.bitmapText(x, y, 'fuente', '0')` para el contador de dulces. Un `Graphics` estático se vuelve textura una sola vez: `if (!this.textures.exists('marco')) { g.generateTexture('marco', w, h); } g.destroy();`.
- **Verifica:** revisión (ningún `Text` que cambie cada frame; ningún `Graphics` redibujado cada frame).
- **Por qué:** cada `setText` vuelve a subir la textura del `Text`, y `Graphics` vuelve a teselar en cada frame. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-07 · Cada minijuego remueve sus texturas al salir
- **Hacer:** al apagarse la escena, un tick después de `SHUTDOWN`, quita solo las claves propias del minijuego:
  ```ts
  this.alLimpiar(() => this.game.events.once(Phaser.Core.Events.POST_STEP, () => {
    // Con scene.restart() la escena ya volvió a arrancar en este mismo step y usa la textura: no borrar.
    if (this.sys.getStatus() !== Phaser.Scenes.SHUTDOWN) return;
    for (const k of ['lluvia']) if (this.textures.exists(k)) this.textures.remove(k);
  }));
  ```
  No remuevas lo compartido (Mi vo, HUD, Calle).
- `alLimpiar()` ya existe en `EscenaBase` (T-037). El e2e de fugas cuenta las texturas con `__depurar.instantanea().texturas`.
- **Verifica:** e2e de fugas (las claves del minijuego desaparecen al salir y la lista vuelve a la base).
- **Por qué:** las texturas sobreviven a la escena porque el manager es global; `textures.remove` libera GPU y CPU. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-08 · `disablePreFX: true` en la raíz de la config del juego
- **Hacer:** `new Phaser.Game({ ..., disablePreFX: true })`, en la raíz de la config. Nadie usa `.preFX`; los brillos van pintados en el arte, con sprites de halo en `ADD` o con `postFX` de objeto. postFX y Light2D siguen disponibles.
- **Si todavía no existe:** si la config del juego no existe o no la tiene, añade solo `disablePreFX: true` con el comentario "mínima; T-038 la completa"; si ya existe, úsala.
- **Verifica:** unitaria de la config exportada; e2e "base GPU ≤ 32 MiB al arrancar" (si CI tiene WebGL); revisión: nadie usa `.preFX`.
- **Por qué:** −61 MiB medidos (91.3 a 29.8 MiB de base). [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

### TEX-09 · Sin texturas comprimidas (KTX/ASTC) en la v1
- **Hacer:** no las agregues. Se reconsideran solo si la medición en el iPhone muestra presión de memoria.
- **Verifica:** revisión.
- **Por qué:** suman una herramienta al pipeline de arte y artefactos en bordes duros; con 1x, NPOT y carga por escena el total cabe. [Guía, TEX](../../../../docs/planes/T-034-performance-y-memoria.md#42-texturas-y-arte-tex).

## Efectos, cutout y parallax (FRA)

### FRA-05 · Un postFX de cámara barato como máximo; blur y bloom solo en transiciones
- **Hacer:** como máximo uno siempre activo (vignette o colorMatrix): `this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9);`. Blur y bloom solo en transiciones cortas. Presupuesto: ≤ 2 instancias vivas (≈ 11 MiB).
- **Verifica:** manual en el iPhone (fps en el overlay con y sin FX); revisión.
- **Por qué:** cada instancia de postFX reserva un render target de pantalla completa (≈ 5.1 MiB a 1872×720) más un pase extra. [Guía, FRA](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra) y [presupuestos](../../../../docs/planes/T-034-performance-y-memoria.md#5-presupuestos-para-el-iphone-13).

### FRA-06 · Light2D acotado
- **Hacer:** `render.maxLights` al mínimo real (≈ 4), solo en las capas que lo necesitan. Si no, halos en `ADD` o `pointlight`.
- **Verifica:** manual en el iPhone, con el primer arte real (T-012/T-014); lo decide la medición.
- **Por qué:** el shader recorre `maxLights` (10 por defecto) por fragmento y cada normal map duplica la memoria de su textura. [Guía, FRA](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-07 · Cutout de Mi vo: Container plano, un solo atlas
- **Hacer:** un `Container` plano con las piezas del mismo atlas (el del disfraz). Sin postFX sobre el `Container` y sin anidar profundo.
- **Verifica:** e2e (draw calls de Mi vo = 1 por disfraz); revisión.
- **Por qué:** el `Container` no fuerza flush, pero con postFX sí. [Guía, FRA](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).

### FRA-08 · Capas de parallax opacas y recortadas
- **Hacer:** capas opacas y recortadas a lo que se ve; nada de grandes áreas transparentes a pantalla completa. Cuántas capas caben se mide en el iPhone.
- **Verifica:** manual en el iPhone (Timelines › Frames, M10).
- **Por qué:** la sobrepintura se paga por píxel: 5 capas completas ≈ 6.7 Mpx por frame. [Guía, FRA](../../../../docs/planes/T-034-performance-y-memoria.md#46-frames-y-framerate-fra).
