# Guía T-034: performance, memoria y caché

Tarea: [T-034](../tareas/T-034-performance-y-memoria.md)

Guía para que el código de 🎃 Trick-r-Treat nazca eficiente en Phaser 3.90 + Vite + Safari de iPhone + GitHub Pages. Está escrita para el product owner (el porqué y las alternativas) y para convertirse en el skill `rendimiento-y-memoria` (sección 11). El piso es el **iPhone 13** (A15, 4 GB, 60 Hz) con **iOS 26.6**.

Las rutas `phaser/src/...` son de `node_modules/phaser/src/` (Phaser **3.90.0**), la fuente de verdad. Las mediciones se hicieron en el scratchpad de la sesión, con Playwright 1.63 + WebKit emulando un iPhone, `curl` contra Pages y simulaciones del `TimeStep` real de Phaser. No se tocó `src/`.

## 1. Resumen ejecutivo

1. **Lo que más memoria gasta no es el JS sino la GPU.** Una textura ocupa `ancho × alto × 4 B` aunque el PNG pese 300 KB, y Phaser ya reserva **91 MiB** de *render targets* de PreFX en una escena vacía. **Recomendación: `disablePreFX: true`** (baja a 30 MiB). Así se conservan postFX y Light2D.
2. **Cada escena limpia lo suyo en `SHUTDOWN`.** Phaser libera los objetos, tweens, timers, físicas e input de la escena, pero **no** lo global: texturas, sonidos, caché de audio, animaciones y listeners en `scale`, `game.events`, `sound` o `window`. Por eso habrá una clase base `EscenaBase` y un detector de fugas e2e (probado: ve 5 → 35 listeners).
3. **Cada minijuego carga sus assets en su `preload()` y los libera al salir.** Precargarlos todos se pasa del presupuesto (≈92–128 MiB solo en atlas).
4. **Arte a 1x de 720 de alto, atlas por escena, NPOT, ≤ 2048 px de lado y parallax con `Image`, no con `TileSprite`.** En el iPhone, Phaser dibuja con una textura por *batch*, así que cada cambio de textura cuesta un *draw call*.
5. **El tiempo no depende de los frames.** Nada de `fps.limit` (está roto: da 38–48 updates/s), y `fps.panicMax: 0` (evita 4 s de cámara lenta en Modo de bajo consumo).
6. **Audio: Web Audio, música mono en bucle corto y efectos en audio sprites.** El PCM decodificado pesa unas 25 veces más que el `.m4a`. Para liberar audio hacen falta `removeByKey` y `cache.audio.remove`.
7. **Pages pone `max-age=600` a todo y cambia el ETag en cada deploy.** El hash de Vite no da caché larga. No conviene un service worker todavía; sí conviene importar los assets desde `src/` (con hash) y mostrar "hay versión nueva" ante un 404.
8. **Medir:** presupuestos de bytes como *gate* en CI, contadores de fugas en e2e y un overlay `?depurar` + Web Inspector en el iPhone para fps y memoria. En CI no se miden fps ni memoria absoluta.

## 2. Leyenda

- ✅ **Verificado:** con fuente (archivo:línea de Phaser 3.90, URL) o con medición propia. La referencia va al lado.
- 🔬 **Hipótesis:** por confirmar en el iPhone 13 (o al llegar el arte). Los números 🔬 son puntos de partida para calibrar, no verdades.

## 3. Contradicciones entre informes y cómo se resolvieron

| # | Contradicción | Resolución (verificada) |
|---|---|---|
| a | Canvas del iPhone 13: 1872×720 o 1558×720 | **Las dos, según el modo.** `calcularAncho` (`src/plataforma/escala.ts:11-18`) usa `getBoundingClientRect` de `#game`, que es `position: fixed; inset: 0` con `viewport-fit=cover` (`index.html`): toma el viewport completo y **no resta las safe areas**. En pantalla de inicio o con las barras ocultas, 844×390 → `round(720×844/390)` = **1558** ✅. Con la barra de Safari visible, la proporción pasa de 2.6:1 y el ancho topa en **1872** (el test de T-003 da 800×310 → 1858) ✅. Los pt exactos de la barra en iOS 26 son 🔬. **Para presupuestos se usa el peor caso, 1872×720** (1.35 Mpx; *drawing buffer* de 5.14 MiB). |
| b | `TileSprite` de pantalla completa: ~8 MiB o ~23.8 MiB | **Son cosas distintas.** Con un frame de 1872×720, `TileSprite` crea: (1) `canvas` de ancho×alto, 1872×720 (`TileSprite.js:181`), 5.14 MiB en CPU, si WebKit reserva su *backing store* 🔬; (2) `fillCanvas` POT de 2048×1024 (`:258, :267, :277`), 8 MiB en CPU; (3) la textura GL `fillPattern` de ese canvas (`:470`), 8 MiB que, por ser POT, genera mipmaps (`WebGLTextureWrapper.js:356-361`) → **10.67 MiB en GPU**. Sumada la textura original (5.14 MiB), queda en **23.8 MiB**, o **29 MiB** con el canvas (1). Como `Image` cuesta **5.14 MiB**. El informe 04 contó solo la copia GL sin mipmaps; el 03 contó original + `fillCanvas` + GL con mipmaps. El A15 tiene memoria unificada: CPU y GPU salen de los mismos 4 GB. ✅ (cálculo desde el código) |
| c | Base de 91 MiB de PreFX y `disablePreFX: true` | **Confirmado.** Sin `disablePreFX`, `PipelineManager.boot` crea `ceil(min(ancho, alto)/32) − 1 = 22` tamaños cuadrados (de 32 a 704 px) × 3 copias, más 3 *render targets* de pantalla completa (`PipelineManager.js:403-428`). El cálculo da ≈57 MiB, coherente con los −61 MiB medidos ✅. `disablePreFX` **solo** quita eso y `FX_PIPELINE` (`:403, :462`). **Siguen disponibles:** los postFX de cámara y de objeto (`postPipelineClasses` depende de `disablePostFX`, `:383-401`) y Light2D/PointLight (clases por defecto, `:94-101`) ✅. **Se pierde** `obj.preFX.*`: `FX.enable` pondría `pipeline = FX_PIPELINE`, que queda `undefined` (`FX.js:229`). Que falle con error o en silencio es 🔬. **Recomendación: `disablePreFX: true`**. Los brillos se pintan en el arte, con sprites de halo en `ADD` o con `postFX` de objeto (cada instancia reserva un *render target* de pantalla completa: ≈5.1 MiB, ver FRA-05). |
| d | Memoria: texturas ≤ 64 MiB (05) o total ≤ 150 MB (03) | **Un solo presupuesto por capas** (sección 5): base de Phaser ≤ 32 MiB + postFX ≤ 11 MiB + texturas del juego ≤ 64 MiB + PCM ≤ 40 MB ≈ **≤ 150 MiB de assets vivos**. La huella total de la pestaña (JS, WebKit, copias en CPU) se vigila aparte: ≤ 300 MB, alarma en 450 MB. Todo 🔬 hasta la prueba de estrés. |
| e | `?debug` / `?depurar=1` / `?e2e` | **Una sola bandera: `?depurar`** (basta con que exista), que expone **`window.__depurar`**. El código vive en `src/depuracion/`. Funciona también en Pages (los e2e corren contra el build). |
| f | "`physics: { default: 'arcade' }` en una escena deja `this.physics` undefined" | **Cierto solo si el juego no declara física.** `GetPhysicsPlugins.js:20-52` toma `config.physics.default` **del juego** (`Config.js:486`) y, de la escena, cada **clave** + `Physics`. `{ default: 'arcade' }` en una escena pide un plugin `DefaultPhysics` que no existe, y `PluginManager.addToScene` lo salta en silencio (`hasCore`). Si el juego tiene `physics: { default: 'arcade' }`, **todas** las escenas tienen Arcade, y la escena ajusta con `physics: { arcade: {...} }`. La configuración de la escena gana en el `Merge` (`ArcadePhysics.js:191-197`). Hoy `main.ts` no declara física ✅. Convención en ESC-07. |
| g1 | Música "en streaming con HTML5 Audio" (05) vs Web Audio (03) | Phaser 3.90 **no hace streaming** con Web Audio (`AudioFile.js:124-125`, comentado), y `disableWebAudio` cambia **todo** el juego a HTML5, donde iOS ignora `volume` ✅. **Música en Web Audio, mono y en bucle corto.** El streaming solo con `MediaElementSource` fuera de Phaser, y solo si el presupuesto no alcanza 🔬. |
| g2 | Assets de minijuego: liberar (02/03) o dejar cargados (04, hipótesis) | **Liberar.** Seis atlas NPOT de 2000² son 91.6 MiB (128 MiB si son POT), más que todo el presupuesto ✅ (cálculo). |
| g3 | JS ≤ 330 KB (02) vs ≤ 340 KiB (05) | **≤ 340 KiB gzip**: es el valor del prototipo probado. |
| g4 | Assets de Calle 1.5 MB (02) vs 2.5 MB (05); por minijuego 500 KB vs 1 MB | El número alto es el **tope** (*gate* de CI) y el bajo la **meta**. Los dos son 🔬. |
| g5 | Manifest con rutas de `public/` (03/05) vs assets con hash en `src/assets/` (02) | **`src/assets/`** (RED-03). Los tests de manifest leen de ahí. |
| g6 | Calle ≤ 32 MiB (05) vs ≤ 50 MiB (03) | **≤ 44 MiB**: el escenario calculado de la Calle da 43.5 MiB ✅, y Calle + un minijuego quedan en ≤ 60 MiB dentro de 64. |
| g7 | El estimador de texturas suma ×4/3 por POT (03) o no (05) | **Suma ×4/3 si la textura es POT**, porque Phaser genera mipmaps (punto b). |
| g8 | IDs de reglas que chocan (T1 = texturas en 03 y *timestep* en 04) | Se renumeraron por tema (sección 4). |

## 4. Reglas accionables

Cada regla trae qué hacer o no hacer, por qué, un ejemplo y cómo se verifica (unitaria, e2e, manual en el iPhone o revisión de código).

### 4.1 Carga y bundle (CAR)

**CAR-01 · No hacer un build a medida de Phaser por ahora** ✅
- **Hacer:** dejar `import Phaser from 'phaser'` (Vite usa `dist/phaser.esm.js`, que no admite *tree-shaking*: `package.json:12-14`). Si se quiere un ahorro gratis: alias a `dist/phaser-arcade-physics.js` (−32 KiB gzip, −10 %, build oficial sin Matter).
- **Por qué:** un build propio ahorra de 9 % a 28 % (−32 a −88 KiB gzip) ✅ medido, ≈70 ms con 10 Mbps. A cambio, una API olvidada revienta **en runtime**, porque `types/phaser.d.ts` dice que todo existe (`phaser-core` pasó `tsc` y falló en WebKit) ✅. El arte pesará de 10 a 30 veces más que ese ahorro.
- **Verifica:** revisión (`vite.config.ts` sin alias). Si se adopta el alias: e2e de humo con cada API de Phaser que se use.

**CAR-02 · No dividir el código en chunks (`import()`) mientras Phaser sea más del 99 % del JS** ✅
- **Por qué:** un minijuego compila a ~0.6 KB min ✅ medido. Además, dividir trae un riesgo real en Pages: el deploy borra los chunks viejos, y con el juego abierto `import()` falla con "Importing a module script failed" ✅ (WebKit).
- **Si algún día se divide:** manejar `vite:preloadError` (RED-04) y el presupuesto de chunk (sección 5).
- **Verifica:** revisión (no hay `import()` sin manejo); el *gate* de JS inicial.

**CAR-03 · Cada escena carga lo suyo en su `preload()`; lo compartido se carga una vez** ✅
- **Hacer:** Arranque/Menú cargan lo mínimo; la Calle, su escenografía, Mi vo con el disfraz elegido y el HUD; cada minijuego, su atlas y su audio sprite. Opcional: desde la Puerta, mientras el vecino habla, encolar `this.load.*` del minijuego y llamar `this.load.start()`.
- **Por qué:** `TextureManager` y `CacheManager` son del `Game`, globales: lo que carga una escena le sirve a otra ✅ (`textures/TextureManager.js`, `cache/CacheManager.js`). El loader no vuelve a bajar una clave que ya existe (`LoaderPlugin.js:546, 572`) ✅. El motivo principal es la **memoria**, no la red.
- **Ejemplo:** `preload() { this.load.atlas('lluvia', paraLoader(png), paraLoader(json)); this.load.audioSprite('lluvia-sfx', paraLoader(sfxJson), [paraLoader(sfxM4a)]); }`
- **Verifica:** e2e "nada se pide dos veces" (contar requests por URL al volver a entrar); revisión.

**CAR-04 · Presupuesto de JS medido en gzip, como lo sirve Pages** ✅
- **Por qué:** Pages manda gzip, **no brotli** ✅ (`curl`: 317 742 B). `zlib.gzipSync` nivel 6 da 317 412 B: casi igual.
- **Verifica:** unitaria `presupuestos/bundle.test.ts` en el job `build` (sección 6).

### 4.2 Texturas y arte (TEX)

**TEX-01 · Un atlas por escena o familia, y objetos ordenados por textura** ✅
- **Hacer:** un atlas por disfraz de Mi vo (todas sus piezas), uno de escenografía de la Calle, uno de HUD y controles, y uno por minijuego. Evitar que objetos de atlas distintos se intercalen en profundidad.
- **Por qué:** fuera del escritorio, Phaser usa `MobilePipeline` (`Config.js:366`, `PipelineManager.js:495-497`) con `forceZero = true` (`MobilePipeline.js:90`): una textura por *batch*, y cada cambio de textura es otro *draw call* (`WebGLPipeline.js:864`). Medido: 11 sprites que alternan 2 texturas → **10** *draw calls* con emulación de iPhone y 1 en escritorio; agrupados por textura → **2** ✅.
- **Ejemplo:** `this.add.image(x, y, 'calle', 'farol')` en lugar de `this.add.image(x, y, 'farol')` con un PNG suelto.
- **Verifica:** e2e que cuenta `drawArrays` por frame con `?depurar`. Es confiable en CI: Phaser detecta el móvil por *user agent*, así que Playwright con emulación de iPhone usa el mismo pipeline ✅. Más revisión de código.

**TEX-02 · Atlas NPOT ("Power of two: off"); POT solo para texturas que se repiten** ✅
- **Por qué:** Phaser 3.90 llama `generateMipmap` en **toda** textura POT (`WebGLTextureWrapper.js:327-361`), aunque `mipmapFilter` vacío (`Config.js:386`) nunca los use: +33 % de memoria desperdiciada. 2048² POT = 21.33 MiB; 2000² NPOT = 15.26 MiB ✅. WebGL1 acepta NPOT con CLAMP y sin mipmaps, y Phaser lo maneja solo (`WebGLRenderer.js:2171-2188`) ✅.
- **Verifica:** unitaria que lee ancho y alto del encabezado PNG/WebP y falla si es POT sin justificación en el manifest.

**TEX-03 · Ninguna textura de más de 2048 px de lado; los fondos largos se cortan en segmentos** ✅
- **Por qué:** el límite no es `MAX_TEXTURE_SIZE` (16384 en el 98 % de iOS ✅ web3dsurvey; el valor del A15 es 🔬) sino la memoria: 4096² POT = 85 MiB.
- **Verifica:** unitaria sobre los encabezados.

**TEX-04 · Arte a 1x del tamaño en que se ve en unidades lógicas (alto 720); máximo ×1.25 para piezas que crecen con tweens o zoom** ✅
- **Por qué:** en FIT, el canvas mide el tamaño lógico (`ScaleManager.js:796`; no hay `resolution` en 3.90) y Safari lo estira ×1.625 (1170/720). Un sprite a 2x se reduce en el canvas y luego se estira: cuesta 4 veces la memoria y no gana nitidez ✅. Si se ve "suave" es 🔬 visual (decisión 3 en la sección 13).
- **Ejemplo:** si la cabeza de Mi vo se ve de 120 px lógicos, su pieza mide 120–150 px.
- **Verifica:** unitaria (manifest: tamaño en pantalla vs tamaño del archivo ≤ 1.25); manual (nitidez).

**TEX-05 · Parallax con `Image` + `setScrollFactor`, segmentos que comparten frame; `TileSprite` solo con patrones POT pequeños (≤ 512²)** ✅
- **Por qué:** una capa de 1872×720 como `TileSprite` cuesta ≈23.8–29 MiB contra 5.14 MiB como `Image` (sección 3, punto b). Además tiene su propia textura y rompe el *batch*. La documentación de la clase lo advierte (`TileSprite.js:27-31`).
- **Ejemplo:** `this.add.image(x, 720, 'calle', 'lejos-1').setOrigin(0, 1).setScrollFactor(0.2)`, repitiendo `x` en cada segmento. Cielo: un `Rectangle` o una imagen de 1×720 estirada.
- **Verifica:** revisión (buscar `add.tileSprite`); e2e (memoria estimada y *draw calls*).

**TEX-06 · `Text` solo para lo que cambia poco; `BitmapText` para contadores vivos; `Graphics` estático → `generateTexture` una vez** ✅
- **Por qué:** cada `Text` tiene su canvas y su textura, y **cada `setText` vuelve a subirla** (`Text.js:139, 276, 1455`). `Graphics` vuelve a teselar en cada frame (`GraphicsWebGLRenderer.js:60-82`).
- **Ejemplo:** `this.add.bitmapText(x, y, 'fuente', '0')` para el contador de dulces; `g.generateTexture('marco', w, h); g.destroy();` con guarda `if (!this.textures.exists('marco'))`.
- **Verifica:** revisión.

**TEX-07 · Cada minijuego remueve sus texturas al salir, un tick después de `SHUTDOWN`** ✅
- **Por qué:** al parar una escena, sus texturas se quedan (el manager es global) ✅. `this.textures.remove(k)` llama `deleteTexture` y suelta la imagen en CPU (`TextureManager.js:281-310`, `TextureSource.js:347-364`) ✅. Remover una textura que aún se dibuja da errores (doc de `remove`).
- **Ejemplo:**
  ```ts
  this.alLimpiar(() => this.game.events.once(Phaser.Core.Events.POST_STEP, () => {
    for (const k of ['lluvia']) if (this.textures.exists(k)) this.textures.remove(k);
  }));
  ```
- **No:** remover lo compartido (Mi vo, HUD, Calle).
- **Verifica:** e2e de fugas (las claves del minijuego desaparecen al salir y la lista vuelve a la base).

**TEX-08 · `disablePreFX: true` en la raíz de la config del juego** ✅ (memoria) / 🔬 (si el arte no lo extraña)
- **Por qué:** −61 MiB medidos (de 91.3 a 29.8 MiB de base con un canvas de 1546×720) ✅. postFX y Light2D siguen disponibles (sección 3, punto c).
- **Ejemplo:** `new Phaser.Game({ ..., disablePreFX: true })`. Va en la raíz de la config: `Config.js:347` lee `config.disablePreFX`.
- **Verifica:** unitaria de la config exportada; e2e "base GPU ≤ 32 MiB al arrancar" (si CI tiene WebGL, 🔬); revisión: nadie usa `.preFX`.

**TEX-09 · Sin texturas comprimidas (KTX/ASTC) en la v1** 🔬
- **Por qué:** Phaser 3.90 las soporta (KTX v1 y PVR, no Basis/KTX2: `CompressedTextureFile.js`, `KTXParser.js`) ✅ y ASTC ahorraría 4 veces la memoria. Pero suman una herramienta al pipeline de arte, archivos más pesados y artefactos en bordes duros. Con 1x, NPOT y carga por escena, el total cabe sin ellas. Se reconsideran si la medición muestra presión de memoria.
- **Verifica:** revisión.

### 4.3 Audio (AUD)

**AUD-01 · Todo con Web Audio; nunca `audio.disableWebAudio`** ✅
- **Por qué:** hay un solo *sound manager* para todo el juego (`SoundManagerCreator.js`). En HTML5 Audio, iOS ignora `volume` (MDN BCD) y la latencia es peor ✅.
- **Verifica:** revisión de `main.ts` (unitaria si la config se exporta).

**AUD-02 · Música: mono, en bucle corto (≤ 90 s) y una sola pista viva** ✅ (cálculo) / 🔬 (calidad)
- **Por qué:** un `AudioBuffer` es float32 por canal y se remuestrea al `sampleRate` del contexto ✅. 90 s mono a 48 kHz = **17.3 MB**; 3 min estéreo = **69.1 MB** ✅. El códec y el *bitrate* solo cambian la descarga.
- **Verifica:** unitaria (manifest: segundos × canales × 48 000 × 4 ≤ presupuesto); e2e (suma de `cache.audio`).

**AUD-03 · Efectos en audio sprites: uno global (UI, Mi vo, dulces, sustos) y uno por minijuego** ✅
- **Por qué:** una petición, una decodificación y una clave que liberar. `playAudioSprite`/`play` se autodestruyen al terminar (`BaseSoundManager.js`, `once(COMPLETE, destroy)`) ✅.
- **Ejemplo:** `this.sound.playAudioSprite('sfx', 'dulce')`. **No:** `this.sound.add(...)` en cada toque.
- **Verifica:** e2e (`game.sound.getAll().length` no crece tras N efectos).

**AUD-04 · Codificar con `afconvert -f m4af -d aac` (≈96 kbps mono para música, 64–96 kbps para efectos)** ✅
- **Por qué:** es el formato nativo de iOS y viene con macOS. Un clic en t = 1.000 s queda exacto al decodificar, sin desfase de *priming* ✅ (WebKit de Mac; en el iPhone 🔬). Opus no ahorra memoria y tiene bugs en Safari 26.
- **Verifica:** e2e "clic en 1.000 s" como regresión del pipeline (T-017).

**AUD-05 · Liberar audio en dos pasos: sonidos y caché** ✅
- **Por qué:** `sound/` no escucha `SHUTDOWN`: un sonido en bucle sigue sonando después de `scene.stop()` ✅. `removeByKey` destruye los sonidos (`BaseSoundManager.js:427`), pero el PCM sigue en `cache.audio` hasta `remove` (`BaseCache.js:136`) ✅.
- **Ejemplo:** `this.alLimpiar(() => { this.sound.removeByKey('ritmo-cancion'); this.cache.audio.remove('ritmo-cancion'); });`
- **Verifica:** e2e de fugas (`sound.getAll().length` y `cache.audio.getKeys().length` vuelven a la base).

**AUD-06 · Ritmo (T-022): el reloj es el del `AudioContext`, no el `delta`** ✅ (APIs) / 🔬 (latencias reales)
- **Hacer:** `tCancion = ctx.currentTime − inicio − (outputLatency + baseLatency + calibración)`. El toque se pasa al reloj de audio con `getOutputTimestamp()`. Agregar una pantalla de calibración guardada en `localStorage`.
- **Por qué:** rAF y el audio se desfasan. `outputLatency` existe desde iOS 18.4 y `baseLatency`/`getOutputTimestamp` desde 14.5 (MDN BCD) ✅. Bluetooth suma ~100–300 ms 🔬.
- **Verifica:** unitaria (juicio acierto/cerca/fallo como función pura); manual (bocina y AirPods).

### 4.4 Escenas y fugas (ESC)

Qué limpia Phaser solo en `SHUTDOWN` ✅: DisplayList (`DisplayList.js:235-251`), UpdateList y Groups (`UpdateList.js:169-205`), tweens (`TweenManager.js:1124-1132`), timers (`Clock.js:436-464`), Arcade (`ArcadePhysics.js:710-730`), input (`InputPlugin.js:3134`), cámaras, loader (`LoaderPlugin.js:1263`) y luces. **No limpia:** `this.events` de usuario, `this.data`, texturas, sonidos, caché de audio, animaciones ni listeners en emisores globales. Medido en modo "sucio": `scale resize` 5 → 14 → 24 en 1/10/20 ciclos ✅.

**ESC-01 · Toda escena hereda de `EscenaBase`, y todo listener a un emisor que vive más que la escena se registra con `escuchar()`** ✅
- **Hacer:** usar `escuchar()` para `this.scale`, `this.game.events`, `this.registry.events`, `this.sound`, `this.textures`, `this.events` (si se registra en `create`), y `alLimpiar()` para `window`, `document` y `ResizeObserver`.
- **Por qué:** cada `create()` agrega otra copia, y la *closure* retiene la escena entera ✅ (medición arriba).
- **Ejemplo:**
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
- **Verifica:** e2e de fugas (sección 6.2); revisión (ningún `.on(` a un emisor global fuera de `escuchar`).

**ESC-02 · La limpieza se registra con `once(SHUTDOWN)`, nunca con `on`** ✅
- **Por qué:** `this.events` sobrevive a `stop`/`start` (solo `remove()` lo vacía: `Systems.js:775-778` vs `:810`). Con `on`, cada arranque suma otra copia del handler.
- **Verifica:** e2e (`sys.events.listenerCount('shutdown')` estable).

**ESC-03 · El estado de la escena se inicializa en `init()`, no en campos de clase; `this.data.reset()` si se usa `this.data`** ✅
- **Por qué:** `start` y `restart` reutilizan **la misma instancia**: el constructor corre una sola vez (`SceneManager.js:470-511`) ✅. `DataManagerPlugin.shutdown` no vacía los datos (`DataManagerPlugin.js:95-98`; medido: `puntos` llega a 20 en 20 ciclos) ✅.
- **Ejemplo:** `init() { super.init(); this.puntos = 0; this.terminado = false; }`
- **Verifica:** e2e "jugar el minijuego 2 veces seguidas empieza en 0".

**ESC-04 · Animaciones y texturas generadas se crean una vez o con guarda** ✅
- **Por qué:** `AnimationManager` es global; una clave nueva en cada `create()` acumula (`AnimationManager.js:513-538`) ✅.
- **Ejemplo:** `if (!this.anims.exists('mivo-camina')) this.anims.create({ key: 'mivo-camina', ... });`
- **Verifica:** e2e (`game.anims.anims.size` estable).

**ESC-05 · Calle con `sleep`/`wake`; minijuegos con `stop`; nunca `remove` salvo para descartar una escena para siempre** ✅
- **Por qué:** `sleep` conserva todo y es barato al volver (`Systems.js:493-512`). `stop` libera lo de la escena. `remove` destruye la instancia, que ya no se puede reiniciar (`SceneManager.js:426-458`) ✅. Una escena dormida **sigue recibiendo eventos globales** (`Systems.js:480-484`): su `resize` debe funcionar dormida.
- **Verifica:** revisión; e2e (ciclo Calle → Puerta → minijuego → Calle sin crecimiento).

**ESC-06 · Arreglar dos detalles latentes de `Arranque` al tocar escenas (T-007)** ✅
- **Qué:** `this.sound.once(UNLOCKED)` (`src/escenas/Arranque.ts:54`) es un emisor global: si la escena se apaga antes del desbloqueo, el callback hace `setText` sobre un `Text` destruido. Los campos `esperandoDesbloqueo` y `errorDeCarga` (`:8-9`) deben pasar a `init()`. Lo demás de `Arranque` ya está bien (`scale.off` en `once(SHUTDOWN)`, `:37-40`).
- **Verifica:** e2e de fugas sobre `Arranque` (prototipo probado: 30 reinicios sin crecimiento).

**ESC-07 · Física: la escena que la usa la declara con la clave del sistema, `physics: { arcade: {...} }`; el juego no declara `default`** ✅
- **Por qué:** sección 3, punto f. Declararla por escena evita un `World` de Arcade en Menú y Resultado y deja explícito quién usa física. `{ default: 'arcade' }` en una escena falla **en silencio** (`this.physics` undefined).
- **Ejemplo:** `super({ key: 'Calle', physics: { arcade: { gravity: { x: 0, y: 900 } } } })`
- **Alternativa válida:** `physics: { default: 'arcade' }` en el **juego**. Hay que elegir una convención; recomiendo la de escena.
- **Verifica:** revisión; e2e (`this.physics` existe en las escenas que lo usan).

### 4.5 Pooling y GC (POO)

**POO-01 · Objetos efímeros (dulces, proyectiles) en un grupo con `maxSize`; reciclar, no destruir** ✅
- **Por qué:** `get()` recicla el primer miembro inactivo, pero **no** lo activa ni lo muestra (`Group.js:985-998`). Con el grupo lleno devuelve `null` (`:300-303, :1110-1119`). Un cuerpo invisible sigue chocando: hay que usar `disableBody`/`enableBody` (`Enable.js:59-117`) ✅.
- **Ejemplo:**
  ```ts
  this.dulces = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 30, defaultKey: 'lluvia', defaultFrame: 'dulce' });
  const d = this.dulces.get(x, -40) as Phaser.Physics.Arcade.Image | null;
  if (d) { d.enableBody(true, x, -40, true, true); d.setVelocityY(200); }
  // al recoger: d.disableBody(true, true);
  ```
- **Verifica:** e2e (soltar 200 dulces → `getLength() ≤ 30` y `displayList.length` estable); unitaria (la lógica de cuándo soltar, pura).

**POO-02 · Partículas: un emisor por escena, creado en `create()`, con `emitting: false`, `maxParticles` y `explode()`** ✅
- **Por qué:** `ParticleEmitter` ya es un pool (listas `alive`/`dead`, `ParticleEmitter.js:2675-2687`). Crear un emisor por evento sí crea basura.
- **Ejemplo:** `this.chispas = this.add.particles(0, 0, 'lluvia', { frame: 'chispa', emitting: false, maxParticles: 60, lifespan: 600 }); this.chispas.explode(20, x, y);`
- **Verifica:** revisión.

**POO-03 · Cero asignaciones evitables en `update()` y en callbacks por frame** ✅ (mecanismo) / 🔬 (magnitud en el A15)
- **Hacer:** campos reutilizados (`private tmp = new Phaser.Math.Vector2()` + `this.tmp.set(...)`), bucles `for` indexados, callbacks creados en `create`, `setText` solo cuando cambia el valor y `physics.add.overlap` una vez en lugar de `filter` por frame.
- **Por qué:** el GC de JSC (Riptide) es casi todo concurrente, pero se detiene si la asignación agota el margen (webkit.org/blog/7122) ✅. Con 16.7 ms por frame, pausas de 1–3 ms se notan 🔬. Phaser ya asigna algo por frame (partículas, `forEach` del sonido); el objetivo es no sumar más.
- **Verifica:** revisión; manual (Timelines › JavaScript Allocations).

### 4.6 Frames y framerate (FRA)

**FRA-01 · `Phaser.AUTO`; los efectos solo si `renderer.type === Phaser.WEBGL`** ✅
- **Por qué:** 3.90 pide WebGL **1** (`WebGLRenderer.js:770`), que Safari corre sobre ANGLE + Metal. Canvas es el respaldo y no tiene postFX ni Light2D.
- **Verifica:** revisión; el overlay imprime el tipo de renderer.

**FRA-02 · No usar `fps.limit`** ✅
- **Por qué:** `stepLimitFPS` pone el acumulador en 0 en vez de restarle el intervalo (`TimeStep.js:688-694`). Con `limit: 60` se miden **37.7–48.1 updates/s** ✅ (simulación con el `TimeStep` real). Safari ya entrega ≤ 60 Hz por defecto, también en ProMotion (bug 290671) ✅.
- **Verifica:** unitaria sobre la config del juego.

**FRA-03 · `fps: { panicMax: 0 }`** ✅ (simulado) / 🔬 (en el iPhone)
- **Por qué:** durante 120 frames tras arrancar y tras **cada** vuelta del segundo plano, el delta se recorta a 16.67 ms (`TimeStep.js:392, 569-574`). A 30 fps (Modo de bajo consumo, intencional: bug 215745 ✅), el juego corre a **media velocidad durante 4 s** (en 4 s reales avanzan 2.00 s de juego; con `panicMax: 0`, 3.93 s) ✅. Desincroniza el ritmo. El recorte de deltas enormes sigue activo por `fps.min` (máx. 200 ms).
- **Verifica:** unitaria de la config; manual (Modo de bajo consumo, M11 y M13).

**FRA-04 · La lógica depende del tiempo, no de los frames** ✅
- **Hacer:** mover con `delta` (`x += vel * delta / 1000`), cuerpos Arcade (`fixedStep: true`, 60 Hz, que es el valor por defecto: `World.js:936-1006`), tweens y `this.time.addEvent`. **No:** `if (frame % 30 === 0)`.
- **Por qué:** el juego puede correr a 30 fps (bajo consumo), 60 o 120 (ProMotion con el flag apagado).
- **Verifica:** unitaria (función pura `avanzar(pos, vel, deltaMs)` da lo mismo con 8.3, 16.7 y 33.3 ms); manual (M11, M12).

**FRA-05 · Como máximo un postFX de cámara barato (vignette o colorMatrix) siempre activo; blur y bloom solo en transiciones cortas** ✅ (costo) / 🔬 (cuántos caben)
- **Por qué:** cada FX es al menos un pase extra de pantalla completa (1.35 Mpx). Cada **instancia** de postFX reserva su propio *render target* de pantalla completa (`getPostPipeline` crea "a new instance", `PipelineManager.js:700`; `PostFXPipeline.js:105` → `WebGLPipeline.js:505`), ≈**5.1 MiB** a 1872×720 ✅. Blur, bloom y glow hacen 2 pases por `steps` (`FXPipeline.js:399-462`).
- **Ejemplo:** `this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9);`
- **Verifica:** manual (fps en el overlay con y sin FX); revisión.

**FRA-06 · Light2D acotado: `render.maxLights` al mínimo real (≈4), solo en las capas que lo necesitan; si no, halos en `ADD` o `pointlight`** ✅ (mecanismo) / 🔬 (costo en el A15)
- **Por qué:** el shader recorre `maxLights` (10 por defecto, `Config.js:453`) por fragmento y necesita un *normal map* por textura, que duplica su memoria. Al cambiar de *normal map* hace *flush* (`LightPipeline.js:271-273`).
- **Verifica:** manual (medir con el primer arte, T-012/T-014). Lo decide la medición.

**FRA-07 · Cutout de Mi vo: un `Container` plano con piezas de un solo atlas; sin postFX sobre el `Container` y sin anidar profundo** ✅
- **Por qué:** el `Container` no fuerza *flush*; sus hijos van en el mismo *batch* (`ContainerWebGLRenderer.js:39-131`). Con postFX sí hace *flush* (`PipelineManager.js:874-893`). El costo de CPU por 6–10 piezas es despreciable 🔬.
- **Verifica:** e2e (*draw calls* de Mi vo = 1 por disfraz); revisión.

**FRA-08 · Capas de parallax opacas y recortadas; nada de grandes áreas transparentes a pantalla completa** 🔬
- **Por qué:** la sobrepintura se paga por píxel: 5 capas completas ≈ 6.7 Mpx por frame (cálculo). El número de capas que caben se mide en el iPhone.
- **Verifica:** manual (Timelines › Frames, M10).

**FRA-09 · `antialiasGL`, `roundPixels` y `loop.sleep()` en menús: no tocar sin medir** 🔬
- **Por qué:** `antialiasGL: false` podría ahorrar memoria de MSAA, y `roundPixels: true` quitaría el temblor de 1 px de la cámara. Los dos tienen costo visual. `loop.sleep()` agrega complejidad.
- **Verifica:** manual.

### 4.7 Caché y red (RED)

**RED-01 · Asumir que Pages sirve todo con `Cache-Control: max-age=600` y cambia el ETag de todo en cada deploy** ✅
- **Por qué:** medido con `curl`: el ETag es `hex(mtime del deploy)-hex(tamaño)`, así que tras cualquier deploy el navegador vuelve a bajar todo pasados 10 min, aunque el nombre con hash no haya cambiado. Pages no permite headers propios. Que Safari lo haga así exactamente es 🔬 (Web Inspector › Network).
- **Consecuencia:** separar Phaser en un chunk *vendor* no ahorra nada sin service worker.

**RED-02 · No hacer deploys mientras Mi vo juega** ✅ (regla de operación)
- **Por qué:** un deploy borra los archivos viejos (404 medido para un nombre que ya no existe).

**RED-03 · Los assets viven en `src/assets/` y se importan (con hash); `public/` solo para nombres fijos (manifest, íconos, `sw.js`)** ✅
- **Por qué:** un par que depende entre sí (atlas `.png` + `.json`, audio sprite) en `public/` puede mezclar versiones en la ventana de 10 min tras un deploy. Con hash, los dos cambian de nombre y llegan juntos. **Trampa medida:** la URL importada ya trae la base, y Phaser se la vuelve a anteponer: `/trick-r-treat//trick-r-treat/assets/…` → 404 ✅.
- **Ejemplo:**
  ```ts
  // src/plataforma/assets.ts
  export const paraLoader = (url: string) =>
    url.startsWith(import.meta.env.BASE_URL) ? url.slice(import.meta.env.BASE_URL.length) : url;
  import png from '../assets/lluvia/atlas.png'; import json from '../assets/lluvia/atlas.json?url';
  this.load.atlas('lluvia', paraLoader(png), paraLoader(json));
  ```
- **Verifica:** unitaria (`paraLoader` con base `/trick-r-treat/`, con `/` y con `data:`; lista blanca de `public/`); e2e (ninguna respuesta ≥ 400 al recorrer las escenas). Cambia la convención actual de `CLAUDE.md` (`'audio/prueba.m4a'` en `public/`): ver decisión 6.

**RED-04 · Un 404 de un asset o chunk significa "hay versión nueva": avisar y recargar, no colgarse** ✅
- **Ejemplo:**
  ```ts
  window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); avisarVersionNueva(); });
  this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => { if (f.xhrLoader?.status === 404) avisarVersionNueva(); });
  ```
- **Por qué:** sin `preventDefault` queda un `Unhandled Promise Rejection` y el minijuego no arranca ✅ (WebKit).
- **Verifica:** e2e con `page.route('**/assets/*lluvia*', r => r.fulfill({ status: 404 }))`; manual (con el juego abierto, mergear algo trivial y entrar a un minijuego).

**RED-05 · Sin service worker por ahora; después, uno escrito a mano** ✅ (hechos) / 🔬 (Playwright con SW)
- **Después (H5):** HTML *network-first* con *fallback* a caché, `/assets/*` *cache-first*, activación en el siguiente arranque (sin `skipWaiting` automático) y caché por id de build. Unas 60–80 líneas, sin dependencias.
- **Por qué:** daría reapertura sin red y esquivaría el `max-age=600`, pero el riesgo clásico es servir una versión vieja para siempre. El scope de `public/sw.js` es `/trick-r-treat/` sin headers extra (MDN) ✅.
- **Verifica:** unitaria de la función pura `estrategia(url)`; manual en el iPhone.

**RED-06 · Pantalla de inicio y Safari tienen almacenamientos separados** ✅
- **Por qué:** "Home Screen apps are created as isolated entities without shared state with the browser" (bug 181849) ✅. Guardar partida en Safari no se ve en el ícono, y viceversa. El contador de 7 días de ITP de la pantalla de inicio solo avanza con uso (webkit.org/blog/10218) ✅.
- **Decisión:** 5 (sección 13).

### 4.8 Robustez (ROB)

**ROB-01 · Pausar en `LOSE_WEBGL` y redibujar y reanudar en `RESTORE_WEBGL`** ✅
- **Por qué:** Phaser 3.90 restaura las texturas desde las imágenes que guarda (`WebGLRenderer.js:1043-1114`; medido: el píxel vuelve a `[255,0,0,255]`) ✅. Pero **la lógica sigue corriendo con la pantalla negra** (`Game.js:474-520`: `update` antes de `preRender`) y el contenido de `RenderTexture`/`DynamicTexture` se pierde ✅. `Phaser.Core.Events.CONTEXT_LOST` **nunca se emite** ✅. `setContextHandlers()` tiene un bug al llamarse dos veces (`:984`) ✅.
- **Ejemplo:**
  ```ts
  const r = game.renderer;
  if (r instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
    r.on(Phaser.Renderer.Events.LOSE_WEBGL, () => { game.pause(); game.sound.pauseAll(); });
    r.on(Phaser.Renderer.Events.RESTORE_WEBGL, () => { redibujarDinamicas(); game.resume(); game.sound.resumeAll(); });
  }
  ```
- **Verifica:** e2e (`WEBGL_lose_context.loseContext()` → pausado; `restoreContext()` → reanuda y el píxel conocido se ve bien; ya funciona en Playwright WebKit ✅); revisión (ningún `CONTEXT_LOST`).

**ROB-02 · Jetsam: diseñar para la recarga silenciosa** ✅
- **Por qué:** iOS no publica un límite por pestaña. Al pasarse, mata el proceso y Safari recarga la página sin avisar a JS, a veces sin `webglcontextlost` (bugs 300782 y 279637) ✅. El límite de 384 MB de canvas ya no existe desde Safari 17 (commit 6bd11f3) ✅. Defensa: presupuesto conservador (sección 5) + guardar en puntos seguros (ROB-03).

**ROB-03 · Guardar el `GameState` en `localStorage` en puntos seguros y ofrecer "Continuar"** ✅ (mecanismo) / decisión de diseño
- **Hacer:** serializar `{ v: 1, disfrazId, medios, sustos, visitadas, guardadoEn }` al entrar a la Calle y al aplicar el resultado de una casa; nunca a mitad de un minijuego. Al arrancar, ofrecer "Continuar" si hay una partida reciente y compatible. Todo con `try/catch`. Va en `src/estado/`, sin Phaser.
- **Verifica:** unitaria (ida y vuelta; versión distinta o partida caducada → se descarta; `localStorage` que lanza error no truena); e2e (`page.reload()` → "Continuar" con el mismo estado); manual (cerrar Safari a la fuerza).

**ROB-04 · Contar las "recargas inesperadas"** 🔬
- **Hacer:** marcar `trt:en-partida` en `sessionStorage` al arrancar y borrarlo en `pagehide`. Si al arrancar ya existe, la sesión anterior murió. El overlay lo muestra.
- **Verifica:** manual (M14).

**ROB-05 · No duplicar lo que Phaser ya hace con la visibilidad** ✅
- **Por qué:** al ocultarse la página, Phaser pausa y al volver llama `resetDelta`. Con `pauseOnBlur` suspende y reanuda el `AudioContext`, también tras `'interrupted'` (`Game.js:590-634`; `WebAudioSoundManager.js:390-414`).
- **Verifica:** manual (M13, M14).

### 4.9 Depuración (DEP)

**DEP-01 · `?depurar` en la URL expone `window.__depurar` y un overlay DOM; la lógica de medición vive sin Phaser** ✅
- **Archivos:** `src/depuracion/metricas.ts` (pura: `percentil`, `resumirFrames`, `memoriaTexturasMiB`), `src/depuracion/fugas.ts` (pura: `crecimientos(antes, despues)`), `src/depuracion/contadores.ts` (lee Phaser) y `src/depuracion/overlay.ts` (un `<pre>` actualizado cada 500 ms).
- **Por qué:** el overlay no puede ser un `Text` de Phaser: alteraría la medición (TEX-06). Importar código con Phaser en Vitest truena con `window is not defined` ✅. El prototipo suma ≈0.8 KiB gzip ✅. Ningún código del juego usa `__depurar`.
- **Contadores** (APIs de 3.90 ✅): `game.scale.listenerCount('resize')`; suma de `eventNames()/listenerCount` de `game.events`, `registry.events`, `sound` y `textures`; `textures.getTextureKeys().length`; `sound.getAll().length`; `cache.audio.getKeys().length`; `anims.anims.size`; `CanvasPool.total()`; `scene.getScenes(true)`; `children.length`; `tweens.getTweens().length`; MiB de `renderer.glTextureWrappers` (×4/3 si es POT); `game.loop.actualFps` y `rawDelta`; *draw calls* (envolviendo `gl.drawArrays`).
- **Verifica:** unitarias de `metricas.ts` y `fugas.ts`; los e2e lo usan.

## 5. Presupuestos para el iPhone 13

Se mide con el canvas de peor caso, 1872×720. Los de **bytes** son *gates* de CI; los de **tiempo y memoria** son SLOs que se calibran en el iPhone.

| Qué | Valor | Cómo se mide | Estado |
|---|---|---|---|
| JS inicial (gzip) | **≤ 340 KiB** (hoy 310.0) | `presupuestos/bundle.test.ts` en el job `build` | ✅ base medida |
| Chunk de minijuego (solo si se divide, CAR-02) | ≤ 25 KiB gzip c/u; JS total ≤ 420 KiB | Igual | 🔬 |
| Assets hasta "toca para empezar" | ≤ 300 KB | e2e: bytes antes de `trt:listo-para-tocar` | 🔬 |
| Assets de la Calle (escenografía + Mi vo + HUD) | tope **2.5 MB**, meta 1.5 MB | Vitest: manifest + tamaños en `dist/` | 🔬 |
| Assets por minijuego | tope **1 MB**, meta 500 KB | Igual | 🔬 |
| Ningún archivo de `dist/` (fuera del JS) | ≤ 1 MB (2 min AAC 64 kbps = 960 KB) | Vitest | ✅ cálculo / 🔬 tope |
| Todo `dist/` | ≤ 12 MB | Vitest | 🔬 |
| Lado máximo de una textura | ≤ 2048 px | Vitest (encabezados) | ✅ |
| Base GPU de Phaser | ≤ 32 MiB con `disablePreFX` (medido 29.8; 91.3 sin él) | e2e `glTextureWrappers` al arrancar (si CI tiene WebGL) | ✅ medido |
| postFX vivos | ≤ 2 instancias ≈ ≤ 11 MiB (5.14 MiB c/u) | Revisión + overlay | ✅ cálculo / 🔬 tope |
| Texturas del juego vivas | **≤ 64 MiB**: Calle + Mi vo + HUD ≤ 44, minijuego activo ≤ 16 | Vitest (manifest × 4, ×4/3 si es POT) + overlay | ✅ cálculo / 🔬 tope |
| PCM de audio vivo | **≤ 40 MB**: música ≤ 17.3 MB (90 s mono 48 kHz), sprite global ≤ 4 MB, sprite de minijuego ≤ 4 MB | Vitest (duración × canales) + e2e (`cache.audio`) | ✅ cálculo / 🔬 tope |
| Assets vivos en total | **≤ 150 MiB** (32 + 11 + 64 + 40) | Suma de lo anterior | 🔬 |
| Huella total de la pestaña (WebContent + GPU) | objetivo ≤ 300 MB, alarma 450 MB | `xctrace` Activity Monitor (manual) | 🔬 |
| Crecimiento tras N ciclos de escenas | **0** en contadores; piso del heap JS ≤ +10 % | e2e (contadores) + manual (Memory) | ✅ método / 🔬 +10 % |
| *Draw calls* en la Calle | ≤ 25 (fijar con el arte) | e2e (contador) | 🔬 |
| "Toca para empezar" | ≤ 1.5 s WiFi · ≤ 3 s 4G · ≤ 1 s al volver | overlay, mediana de 5 cargas | 🔬 |
| Parse + evaluación del JS | ≤ 300 ms (estimado 150–250 desde 101–119 ms en frío en un M3 Max) | Timelines › JavaScript & Events | 🔬 |
| Entrar a un minijuego | ≤ 500 ms precargado · ≤ 1.5 s la primera vez por 4G | `performance.measure('trt:entrar-minijuego')` | 🔬 |
| Tiempo de frame | p95 ≤ 18 ms · p99 ≤ 34 ms · ≤ 1 tirón (> 33.4 ms) cada 10 s · `actualFps` ≥ 57 | overlay (`rawDelta`) + Rendering Frames | 🔬 |
| Trabajo por frame en la Calle | ≤ 8 ms | Timelines › Frames | 🔬 |
| Modo de bajo consumo | jugable a 30 fps, a la misma velocidad en segundos | manual | ✅ (tope de 30 intencional) |

Nota: `performance.now()` tiene resolución de 1 ms en WebKit ✅, así que los umbrales de frame van en ms enteros.

## 6. Los presupuestos en las tres capas de pruebas

### 6.1 Unitarias (Vitest)

- **Bytes del build (prototipo en verde ✅):** `presupuestos/bundle.test.ts` va **fuera de `src/`**, porque usa `node:fs`/`node:zlib` y el `tsconfig` no tiene `@types/node` (si estuviera en `src/`, rompería `tsc --noEmit`). Además, en el job `tests` no hay `dist/`.
  - `package.json`: `"test": "vitest run --dir src"` y `"test:presupuestos": "vitest run --dir presupuestos"` ✅ (los 32 tests actuales siguen corriendo).
  - `deploy.yml`, job `build`: agregar `- run: npm run test:presupuestos` después de `npm run build`. No hace falta un job nuevo ni tocar el ruleset.
  - No usar "skip si no hay `dist/`": daría un falso verde.
  - El JS inicial es el que referencia `index.html`. El test imprime el total en el log del CI para ver la tendencia.
- **Manifest de assets** (`src/datos/assets.json`, data-driven): las escenas cargan desde ahí. Los tests revisan que cada ruta exista en `src/assets/`, que ningún lado pase de 2048, que la memoria por escena (×4/3 si es POT) quepa en el presupuesto y que vecinos y disfraces solo usen claves que existen. Un test en `presupuestos/` compara las dimensiones declaradas con el encabezado real del PNG/WebP.
- **Lógica pura:** `metricas.ts`, `fugas.ts`, `paraLoader`, guardar y cargar partida, juicio de ritmo, `avanzar(pos, vel, delta)` y la config del juego (`disablePreFX`, sin `fps.limit`, `panicMax: 0`, sin `disableWebAudio`), exportada como objeto.

### 6.2 e2e (Playwright WebKit con emulación de iPhone)

- **Detector de fugas (prototipo ✅):** abrir `./?depurar`, hacer 1 ciclo de calentamiento, tomar `antes = __depurar.instantanea()`, ciclar N veces (hoy: reiniciar `Arranque` 30 veces; después: Calle → Puerta → minijuego con `finished(true)` simulado → Calle, 8 casas × 3 vueltas), tomar `despues` y exigir `crecimientos(antes, despues) == []`. Hay que esperar 2 frames entre pasos, porque `stop`/`start` se encolan (`ScenePlugin.js:21-25`). Con un `scale.off` quitado a propósito, el test **falló: 5 → 35 listeners** ✅.
- **Sin errores:** `page.on('pageerror')` y `console` de tipo error vacíos durante los ciclos ✅.
- **Red:** ninguna respuesta ≥ 400; requests y bytes por fase con `requestfinished` + `request.sizes()` (el *preview* no comprime: aquí se usan bytes crudos, y el gzip se mide en Vitest) ✅; nada se pide dos veces.
- ***Draw calls* y memoria estimada por escena:** envolver `gl.drawArrays` y sumar `glTextureWrappers`, solo si `renderer.type === Phaser.WEBGL`. Que el WebKit de Linux en CI tenga WebGL es 🔬: el primer PR debe imprimir el tipo de renderer en el log.
- **Robustez:** pérdida y restauración de contexto (ROB-01); 404 de un asset → aviso (RED-04); `reload` → "Continuar" (ROB-03).
- **Hitos:** las `performance.mark` existen y van en orden. Como guardarraíl contra cuelgues: `trt:listo-para-tocar` < 10 s.
- **No confiable en CI:** fps, p95 y tiempos absolutos (en la Mac, `actualFps` bajó a 27 mientras el test ciclaba ✅), memoria absoluta y audio.

### 6.3 Manual en el iPhone (tabla para la descripción del PR o del hito)

| # | Paso | Resultado esperado |
|---|---|---|
| M1 | Activar Web Inspector y conectar el iPhone a la Mac (sección 7) | El iPhone aparece en Desarrollo |
| M2 | Abrir `…/trick-r-treat/?depurar` por WiFi, 5 recargas | Overlay visible; `trt:listo-para-tocar` ≤ 1.5 s (mediana) |
| M3 | Igual que M2, por datos móviles | ≤ 3 s |
| M4 | Abrir desde la pantalla de inicio y buscar la app en Desarrollo › Home Screen Web Apps | Se puede inspeccionar; el overlay no queda tapado por el notch |
| M5 | Timelines con Memory y JavaScript Allocations; desmarcar "Stop recording once page loads" | Grabación activa |
| M6 | Jugar 15 min (8 casas) | `fps` ≥ 57 en la Calle, `p95` ≤ 18 ms, ≤ 1 tirón cada 10 s y ninguna recarga |
| M7 | Revisar Memory al final | Sin escalera ascendente; piso final ≤ +10 % del piso tras el primer minijuego |
| M8 | Comparar el snapshot tras el minijuego 1 con el de tras el 8 | No crecen escenas, `GameObject`, `Tween` ni `TimerEvent` de escenas que ya salieron |
| M9 | Mirar `tex` del overlay al volver a la Calle | Vuelve al mismo valor cada vez |
| M10 | Timelines › Frames, 30 s corriendo y saltando | La mayoría de los frames ≤ 8 ms |
| M11 | Modo de bajo consumo + un minijuego de reflejos | ≈30 fps, misma velocidad en segundos y se puede ganar |
| M12 | (13 Pro) Flag "Prefer Page Rendering Updates near 60fps" encendido y luego apagado | ≈60 y ≈120 fps a la misma velocidad de juego |
| M13 | Ir al inicio a mitad de un minijuego, esperar 30 s y volver | Sin salto de física, audio reanudado y sin recarga |
| M14 | Bloquear el teléfono 2 min y desbloquear | Igual que M13; "recargas inesperadas: 0" |
| M15 | Tocar el teléfono tras 15 min | Tibio, no caliente; sin caída progresiva de fps |

## 7. Cómo medir (herramientas)

1. **Web Inspector con el iPhone** ✅ (Apple, "Inspecting iOS"): en el iPhone, Ajustes › Apps › Safari › Avanzado › Web Inspector. En la Mac, Safari › Ajustes › Avanzado › "Mostrar funciones para desarrolladores web". Conectar por cable, confiar, y abrir Desarrollo › [iPhone] › pestaña. Para jugar sin cable: Desarrollo › [iPhone] › "Conectar a través de la red". Las web apps de pantalla de inicio salen en la sección "Home Screen Web Apps" (que funcione en 26.6 es 🔬).
2. **Timelines** ✅ (webkit.org/web-inspector/timelines-tab): Memory, JavaScript Allocations y Media vienen **apagados**; se activan en el engrane. Frames muestra las líneas de 60 y 30 fps; Memory, el piso tras cada GC; Allocations, comparar snapshots. Mientras se graba, el JIT se degrada: **los fps grabados no son los reales** (se leen en el overlay). `console.profile()`/`profileEnd()` y `console.takeHeapSnapshot()` sirven para grabar exactamente "entrar y salir de un minijuego". Que Memory incluya las texturas WebGL (proceso GPU) es 🔬: probablemente no, y por eso existe el estimador propio.
3. **Overlay `?depurar`:** fps (`actualFps`, que es un promedio y esconde tirones), p95, máximo y tirones de `rawDelta`, texturas, MiB de GPU, sonidos, escenas, *draw calls* y recargas inesperadas. Se usa en el build real de Pages.
4. **`xctrace`** 🔬: `/Applications/Xcode.app/Contents/Developer/usr/bin/xctrace record --template 'Activity Monitor' --device '<iPhone>' --all-processes --time-limit 15m --output partida.trace`. Mediría WebContent + GPU, la huella que decide el jetsam. Requiere el Modo desarrollador en el iPhone. `xcrun xctrace` falla porque `xcode-select` apunta a Command Line Tools ✅.
5. **Lo que no existe en Safari** ✅: `performance.memory`, `measureUserAgentSpecificMemory` (además exige COOP/COEP, que Pages no da), `navigator.deviceMemory`, `longtask` y `long-animation-frame`. Sí existen `mark`/`measure`, `resource`, `navigation` y `paint`.

## 8. Checklist para revisar un PR

- [ ] ¿Toda escena nueva hereda de `EscenaBase` y las que redefinen `init` llaman `super.init(data)`? (ESC-01, ESC-03)
- [ ] ¿Algún `.on(` a `scale`, `game.events`, `registry.events`, `sound`, `textures`, `window` o `document` fuera de `escuchar()`/`alLimpiar()`? (ESC-01)
- [ ] ¿Estado de escena en campos de clase o en `this.data` sin `reset()`? (ESC-03)
- [ ] ¿`this.anims.create` o `generateTexture` sin guarda `exists`? (ESC-04)
- [ ] ¿`scene.remove` sin motivo, o una Calle que se para en vez de dormir? (ESC-05)
- [ ] ¿Física declarada como `physics: { arcade: {...} }` en la escena que la usa? (ESC-07)
- [ ] ¿El minijuego libera sus texturas y su audio (`textures.remove`, `removeByKey` + `cache.audio.remove`)? (TEX-07, AUD-05)
- [ ] ¿Algún `new`, `{}`, `[]`, `.map/.filter/.forEach` o *closure* dentro de `update()`? (POO-03)
- [ ] ¿Objetos efímeros con `destroy()` + `add.*` en vez de pool? ¿Se maneja el `null` de `get()`? (POO-01)
- [ ] ¿Movimiento sin `delta`, o "cada N frames"? (FRA-04)
- [ ] ¿`fps.limit`, `disableWebAudio`, `.preFX`, `CONTEXT_LOST` o `setContextHandlers`? (FRA-02, AUD-01, TEX-08, ROB-01)
- [ ] ¿Más de un postFX de cámara permanente? ¿Light2D con `maxLights` por defecto? (FRA-05, FRA-06)
- [ ] ¿`add.tileSprite` con un frame mayor que 512²? ¿`Text` que cambia cada frame? (TEX-05, TEX-06)
- [ ] ¿Assets nuevos en `src/assets/`, importados y pasados por `paraLoader`? ¿Algo nuevo en `public/` fuera de la lista blanca? (RED-03)
- [ ] ¿Textura POT sin justificación, mayor que 2048, o arte a más de ×1.25? (TEX-02/03/04)
- [ ] ¿Piezas de Mi vo o de un minijuego fuera de su atlas? ¿Objetos de atlas distintos intercalados? (TEX-01)
- [ ] ¿Algún `import()` dinámico sin manejar `vite:preloadError`? (CAR-02, RED-04)
- [ ] ¿Subió el JS gzip más de ~5 KiB? ¿Por qué? (log de `test:presupuestos`)
- [ ] ¿Pasan `npm test`, `npm run test:presupuestos`, `npm run test:e2e` (incluido el de fugas) y `npm run build`?
- [ ] Si toca arte, escenas o el loop: ¿la tabla manual del PR trae M6–M9 con los números del overlay?

## 9. Aplicar YA vs medir después

**Aplicar ya (antes del arte, desde T-004 y T-007):**
- `EscenaBase`, ESC-01 a ESC-07, y los arreglos de `Arranque` (ESC-06).
- Config del juego: `disablePreFX: true`, `fps: { panicMax: 0 }`, sin `fps.limit`, sin `disableWebAudio` y la convención de física por escena.
- ROB-01 (pérdida de contexto) y RED-04 (aviso de versión nueva).
- `?depurar` (`src/depuracion/`) y el e2e de fugas.
- `presupuestos/bundle.test.ts` en el job `build`.
- Reglas de código: POO-03 y FRA-04 desde la primera línea.
- RED-03 (`src/assets/` + `paraLoader`) antes del primer asset de arte. Avisar a T-012: NPOT, ≤ 2048, 1x y atlas por escena.

**Con la Calle y el primer minijuego (H2):** POO-01, POO-02, TEX-01, TEX-05, el contador de *draw calls* y el manifest de assets.

**Medir después en el iPhone 13:** el techo real de memoria (prueba de estrés, en Safari y en la pantalla de inicio); `getMaxTextureSize()`; `sampleRate`, `baseLatency` y `outputLatency` (bocina y Bluetooth); cuántas capas, postFX y luces caben (FRA-05, FRA-06, FRA-08); `antialiasGL` y `roundPixels`; el Modo de bajo consumo y ProMotion en 26.6 y en *standalone*; el calor en 15 min; si el estiramiento ×1.625 se ve bien; y calibrar todos los números 🔬 de la sección 5 con el primer arte real.

## 10. Revisión de documentación y skills de Anthropic y de fuentes externas

| Fuente | Qué se reutiliza | Qué se descarta y por qué |
|---|---|---|
| Guía oficial "Skill authoring best practices" y `agentskills.io/specification` ✅ | `name` ≤ 64 caracteres `[a-z0-9-]`, igual a la carpeta; `description` ≤ 1024 caracteres, en tercera persona, con qué hace y cuándo usarlo; `SKILL.md` < 500 líneas; referencias **a un nivel**, con índice si pasan de 100 líneas; evaluaciones antes de escribir mucho; "nada de constantes vudú" (encaja con ✅/🔬) | Nada |
| Docs de Claude Code (skills y memoria) ✅ | Skills de proyecto en `.claude/skills/`, versionados; al compactar se conservan **los primeros 5000 tokens** (lo crítico va arriba); `paths` en el frontmatter; reglas `.claude/rules/*.md` con `paths` que se cargan **de forma determinista** al leer o editar archivos que coinciden; si una regla debe cumplirse siempre, va en un test o un hook, no solo en texto | Empaquetado `.skill` para claude.ai (no aplica) |
| `anthropics/skills` ✅ | **Estructura:** `slack-gif-creator` (restricciones con números + validadores, el modelo para "Presupuestos"); `algorithmic-art` (plantilla obligatoria, para `EscenaBase`); `webapp-testing` (árbol de decisión; esperar estabilidad antes de inspeccionar); `skill-creator` (evaluaciones y optimizador de `description`) | **Contenido:** nada de juegos, WebGL ni performance web. Son demostrativos ("for demonstration and educational purposes") |
| `superpowers/writing-skills` (comunidad) | "La descripción dice cuándo, no resume el flujo"; recetas mejor que prohibiciones | Las metas de palabras más estrictas: la guía oficial basta |
| **Skills oficiales de Phaser** (`phaserjs/phaser/skills`, 27 temas) ✅ | **Solo la estructura:** "Key source paths", "Gotchas" numerados, tabla de eventos, "Related skills" | **Todo el contenido: son de Phaser 4.** Ejemplos: `batchSize` 16384 (3.90: 4096, `Config.js:443`) y `autoMobileTextures` (3.90: `autoMobilePipeline`, `:366`). Mezclarlos es justo lo que prohíbe `CLAUDE.md`. No se instalan ni se copian |
| Código de Phaser 3.90 y su CHANGELOG ✅ | Fuente de verdad de cada regla | — |
| Docs de Phaser (docs.phaser.io) | API 3.90.0 (hay que elegir la versión: por defecto muestra v4) y Concepts | Páginas sin versión clara |
| WebKit (blog, bugs, código) y Apple ✅ | Timelines, Web Inspector, jetsam, rAF a 30 y 60 Hz, almacenamiento | Posts de 2016–2017: el método sirve, la UI pudo cambiar |
| MDN ✅ | WebGL best practices (presupuesto fijo de VRAM), Web Audio, `webglcontextlost`, BCD | "Audio for Web Games": sus afirmaciones de iOS son tentativas |
| web.dev | Conceptos de caché y del ciclo de vida del SW | Core Web Vitals, Lighthouse y `performance.memory` (Chrome) |
| Directorios de skills de terceros, blogs sin mediciones y tutoriales sin versión | — | Confianza baja; riesgo de mezclar v2, v3 y v4 |

## 11. Propuesta del skill (no se crea en esta tarea)

**Nombre:** `rendimiento-y-memoria` (frase nominal, sin acentos para pasar `^[a-z0-9-]+$`).

**`description` propuesta** (≈800 caracteres, tercera persona, sin `<` ni `>`):

```yaml
description: Reglas de rendimiento, memoria y caché de 🎃 Trick-r-Treat para Phaser 3.90 + Vite en Safari de iPhone (piso iPhone 13, iOS 26.6), con presupuestos y cómo verificarlos. Se usa siempre que se escriba, planee o revise código en src/ que cree, cambie o cierre escenas o minijuegos; cargue o libere assets (imágenes, atlas, spritesheets, audio); use tweens, timers, física Arcade, grupos, partículas, postFX, luces, Text o TileSprite; registre listeners (this.scale.on, this.events.on, game.events, sound, window); cree objetos dentro de update; o toque main.ts, vite.config.ts, public/, src/assets/, el service worker o la caché. También cuando un plan, PR o prueba hable de fps, tirones, memoria, fugas, recargas de la página, tiempos de carga, tamaño del bundle o presupuestos, aunque no se pida.
```

**Frontmatter:** sin `disable-model-invocation`. `paths` es 🔬: según la documentación, *restringe* la activación, y podría impedir que cargue al escribir un plan en `docs/planes/`. Se prueba en las evaluaciones.

**`SKILL.md` (≤ 250 líneas, lo crítico en los primeros ~5000 tokens):**
1. Contexto en 3 líneas: Phaser 3.90 (nunca v4; los skills de Phaser son v4), piso iPhone 13 y "Key source paths" de `node_modules/phaser/src/`.
2. Reglas no negociables (≈15, una línea cada una, en forma de receta, con su ID): `EscenaBase` y `escuchar()`, `once(SHUTDOWN)`, estado en `init`, liberar texturas y audio, pool, nada de asignaciones en `update`, `delta`, sin `fps.limit`, `panicMax: 0`, `disablePreFX`, atlas NPOT ≤ 2048 a 1x, parallax con `Image`, `src/assets` + `paraLoader`, LOSE/RESTORE_WEBGL y física por escena.
3. Presupuestos (la tabla de la sección 5, con ✅/🔬).
4. Plantilla mínima de minijuego sobre `EscenaBase`.
5. Checklist de PR (sección 8).
6. Cómo verificar: qué capa cubre cada regla y qué comando correr.
7. Mapa de referencias ("si vas a tocar X, lee Y").
8. Patrones descartados: Phaser 4, `performance.memory`, `fps.limit`, `TileSprite` grande, `disableWebAudio`.

**`references/`** (un nivel, uno por tema, con índice si pasa de 100 líneas): `escenas-y-fugas.md`, `texturas-y-gpu.md`, `audio.md`, `frames-y-tiempo.md`, `carga-y-cache.md`, `robustez.md`, `medir.md` y `fuentes.md`. Cada regla del skill enlaza a esta guía para el porqué completo.

**Regla por ruta `.claude/rules/rendimiento.md`** con `paths: ["src/**/*.ts"]`, de 10 a 15 líneas: las 8 reglas que no se pueden saltar (ESC-01, ESC-02, ESC-03, TEX-07/AUD-05, POO-03, FRA-04, RED-03 y ROB-01), más "carga el skill `rendimiento-y-memoria` antes de escribir o revisar escenas". Se carga sola al editar `src/` ✅ (mecanismo documentado). Más una línea en `CLAUDE.md` que apunte al skill, sin copiar reglas.

**Evaluaciones propuestas** (con y sin skill, en worktrees desechables, con Haiku, Sonnet y Opus):
1. "Agrega un minijuego de atrapar dulces que caen" → pool con `maxSize`, `EscenaBase`, atlas propio liberado al salir.
2. "Haz que la Calle se reacomode al cambiar el tamaño" → `escuchar(this.scale, RESIZE, …)`.
3. "Agrega música de fondo a la Calle" → Web Audio mono en bucle, sin duplicar al volver y liberación correcta.
4. "Revisa este diff" (con una fuga sembrada y un `fps.limit`) → la checklist los detecta.
5. Activación (optimizador del skill-creator): 20 consultas en español, la mitad deben activarlo ("va lento en el iPhone", "agrega partículas al susto") y la otra mitad son casi aciertos que no ("actualiza el tablero", "escribe el diseño del vecino 3").
6. Validar el frontmatter con `claude plugin validate .claude/skills`.

## 12. Tareas nuevas propuestas (no se crean hasta tu OK)

| ID | Título | Tipo | Hito | Depende | Por qué |
|---|---|---|---|---|---|
| T-035 | Crear el skill `rendimiento-y-memoria` y su regla por ruta | codigo | H1 | T-034 | Que T-004 en adelante ya lo carguen; con sus evaluaciones |
| T-036 | Presupuesto de bundle en CI (`presupuestos/`, `test:presupuestos`) | codigo | H1 | T-034 | *Gate* barato y determinista; el prototipo ya está probado |
| T-037 | `EscenaBase` + `?depurar` (overlay, contadores) + e2e de fugas | codigo | H2 | T-034 | Base de toda escena; debe estar antes o dentro de T-007 |
| T-038 | Config de rendimiento y robustez WebGL (`disablePreFX`, `panicMax`, LOSE/RESTORE, arreglos de `Arranque`) | codigo | H2 | T-034 | Cambios pequeños de alto impacto |
| T-039 | Assets versionados (`src/assets` + `paraLoader`) y aviso de versión nueva | codigo | H2 | T-034 | Antes del primer arte (T-013 a T-015) |
| T-040 | Manifest de assets y memoria estimada por escena | codigo | H3 | T-039, T-012 | *Gate* de memoria de texturas y audio en CI |
| T-041 | Medición en el iPhone 13: techo de memoria y calibración de presupuestos | investigacion | H2 (repetir en H3) | T-037 | Convierte los 🔬 en ✅ |
| T-042 | Guardar y reanudar la partida | codigo | H3 | T-007 | Defensa contra jetsam; cambia el diseño (decisión 2) |
| T-043 | Service worker a mano + manifest + chunk *vendor* | codigo | H5 | T-039, T-018 | Reapertura sin red; solo con el juego estable |
| T-044 | (Opcional) Phaser sin Matter (alias `dist-arcade`) | codigo | cualquiera | T-036 | −32 KiB gzip con una línea |

T-037 y T-038 podrían ir juntas, pero separadas siguen la regla de "un cambio a la vez".

## 13. Decisiones pendientes para el product owner

1. **`disablePreFX: true`** (renunciar a `preFX` por objeto a cambio de −61 MiB). **Recomiendo sí**: postFX y Light2D se quedan.
2. **Guardar y reanudar la partida** (ROB-03, T-042). No está en el diseño v0.2. **Recomiendo sí** en H3, por el riesgo de jetsam en una partida de 15 min. Habría que actualizar `docs/diseno/` y `CAMBIOS.md`.
3. **Nitidez: 720 a 1x o "retina".** Retina multiplica ×2.6 los píxeles por frame y la memoria del arte, y cambia el contrato de 720. **Recomiendo 720 y 1x** con estilo caricatura.
4. **Interruptor de silencio:** respetarlo (lo normal en iOS) o forzar el sonido con `navigator.audioSession.type = 'playback'`. **Recomiendo respetarlo** y que el diagnóstico de audio diga "¿tu iPhone está en silencio?".
5. **Modo oficial de juego: pantalla de inicio.** El almacenamiento está separado de Safari (RED-06). **Recomiendo** declararlo y decírselo a Mi vo (encaja con T-032).
6. **Assets en `src/assets/` con hash** en lugar de `public/`. Cambia la convención de rutas de `CLAUDE.md`. **Recomiendo sí**, antes del primer arte.
7. **`?depurar` disponible en producción** (sin datos personales, apagado por defecto). **Recomiendo sí**: permite medir el build real en el iPhone y lo necesitan los e2e.
8. **Convención de física:** por escena (`physics: { arcade }`) o global (`default: 'arcade'` en el juego). **Recomiendo por escena**.

## 14. Pruebas

Esta tarea es de investigación y no trae código: no aplican unitarias, e2e ni prueba manual. Los prototipos (`bundle.test.ts`, detector de fugas, overlay) se probaron en una copia en el scratchpad, no en el repo. Lo que esta guía define es **cómo** las tareas de código meten los presupuestos en las tres capas (sección 6).

## 15. Analogías de backend

| Juego | Backend |
|---|---|
| Frame de 16.7 ms | SLO de latencia p95: cada frame es una request que debe responder antes del siguiente vsync |
| `actualFps` vs `rawDelta` | Latencia promedio vs percentiles: el promedio esconde la cola |
| `SHUTDOWN` | `finally`/`close()`: Phaser cierra lo de la escena, tú lo global |
| Listener sin `off` | Conexión no devuelta al pool: una más por cada vuelta a la escena |
| `TextureManager` sin `remove` | Caché global sin TTL (Redis sin `DEL`): crece hasta el OOM-kill |
| Jetsam de iOS | Pod OOMKilled sin `limits` publicados: sin stacktrace, y si se repite, CrashLoopBackOff ("A problem repeatedly occurred") |
| Pérdida del contexto WebGL | Se cayó la conexión a la base de datos: Phaser reconecta, pero hay que pausar |
| Render targets de PreFX | Pool pre-calentado de 70 conexiones que no usas: `disablePreFX` baja el `minIdle` |
| Pausa del GC de JSC | Stop-the-world de la JVM; el pooling es reusar buffers |
| Modo de bajo consumo | *Rate limit* del proveedor: usa tiempo real (`delta`), no "ticks" |
| Build a medida de Phaser | `jlink` de un JRE: ahorra MB, pero lo olvidado revienta en producción (`ClassNotFoundException`) |
| Loader por escena | *Lazy loading* por endpoint en vez de calentar toda la caché al arrancar |
| `?depurar` | Endpoint `/metrics`: barato y apagado por defecto |
| Web Inspector Timelines | APM / profiler: se enciende para investigar |
| e2e de fugas | Test de *soak* que compara recursos abiertos antes y después |
| Presupuesto de bundle en CI | *Gate* de tamaño de imagen Docker |

## 16. Fuentes

- Phaser 3.90.0: `node_modules/phaser/src/` (archivo:línea citados arriba) · API: https://docs.phaser.io/api-documentation/3.90.0/api-documentation · anuncio: https://phaser.io/news/2025/05/phaser-v390-released · Mobile Pipeline: https://phaser.io/devlogs/270
- Skills de Phaser (v4, solo estructura): https://github.com/phaserjs/phaser/tree/master/skills
- Anthropic: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices · https://code.claude.com/docs/en/skills · https://code.claude.com/docs/en/memory · https://agentskills.io/specification · https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills · https://github.com/anthropics/skills
- Apple: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios · https://developer.apple.com/forums/thread/133449
- WebKit: https://webkit.org/web-inspector/timelines-tab/ · https://webkit.org/blog/6425/memory-debugging-with-web-inspector/ · https://webkit.org/blog/7122/introducing-riptide-webkits-retreating-wavefront-concurrent-garbage-collector/ · https://webkit.org/blog/14403/updates-to-storage-policy/ · https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ · https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/ · https://webkit.org/blog/18178/webkit-features-for-safari-26-6/ · https://github.com/WebKit/WebKit/commit/6bd11f3792f0
- Bugs de WebKit: https://bugs.webkit.org/show_bug.cgi?id=215745 (30 fps en bajo consumo) · https://bugs.webkit.org/show_bug.cgi?id=290671 (60 Hz en ProMotion) · https://bugs.webkit.org/show_bug.cgi?id=300782 y https://bugs.webkit.org/show_bug.cgi?id=279637 (jetsam) · https://bugs.webkit.org/show_bug.cgi?id=195325 (límite de canvas) · https://bugs.webkit.org/show_bug.cgi?id=181849 (almacenamiento de la pantalla de inicio) · https://bugs.webkit.org/show_bug.cgi?id=264473 (`audioSession`) · https://bugs.webkit.org/show_bug.cgi?id=280581 (Memory timeline) · https://bugs.webkit.org/show_bug.cgi?id=321693 (proceso GPU) · https://bugs.webkit.org/show_bug.cgi?id=293310 (Ogg Opus)
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices · https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices · https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event · https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API · https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory · https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
- Khronos (ANGLE + Metal en Safari): https://www.khronos.org/blog/webgl-2-achieves-pervasive-support-from-all-major-web-browsers
- Datos de dispositivos: https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE · https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_IMAGE_UNITS
- Referencia de memoria con el mismo chip (iPhone SE 3): https://lapcatsoftware.com/articles/2026/1/7.html
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits · Vite: https://vite.dev/guide/assets · https://vite.dev/guide/build#load-error-handling
- Mediciones propias (scratchpad de la sesión): `curl` a Pages; Playwright 1.63 WebKit con perfiles iPhone 13 y 17 en horizontal; simulaciones del `TimeStep` real; prototipos `bundle.test.ts`, `fugas.e2e.ts` y overlay.
