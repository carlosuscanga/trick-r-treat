# Fuentes

> **Advertencia:** los skills y la documentación oficial actuales de Phaser son de **Phaser 4**. No usarlos como fuente de APIs para este proyecto (Phaser 3.90). Los skills de Phaser solo sirven como modelo de estructura.

Guía de origen: [guía §16](../../../../docs/planes/T-034-performance-y-memoria.md#16-fuentes)

## Índice

- [Phaser 3.90](#phaser-390)
- [Skills de Phaser (v4)](#skills-de-phaser-v4)
- [Anthropic](#anthropic)
- [Apple](#apple)
- [WebKit](#webkit)
- [Bugs de WebKit](#bugs-de-webkit)
- [MDN](#mdn)
- [Khronos](#khronos)
- [Datos de dispositivos](#datos-de-dispositivos)
- [Referencia de memoria con el mismo chip](#referencia-de-memoria-con-el-mismo-chip)
- [GitHub Pages y Vite](#github-pages-y-vite)
- [Mediciones propias](#mediciones-propias)
- [Código fuente de Phaser 3.90](#código-fuente-de-phaser-390)

## Phaser 3.90

- API: https://docs.phaser.io/api-documentation/3.90.0/api-documentation
- Anuncio: https://phaser.io/news/2025/05/phaser-v390-released
- Mobile Pipeline: https://phaser.io/devlogs/270

## Skills de Phaser (v4)

- https://github.com/phaserjs/phaser/tree/master/skills (solo estructura; contenido de Phaser 4)

## Anthropic

- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/memory
- https://agentskills.io/specification
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- https://github.com/anthropics/skills

## Apple

- https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios
- https://developer.apple.com/forums/thread/133449

## WebKit

- https://webkit.org/web-inspector/timelines-tab/
- https://webkit.org/blog/6425/memory-debugging-with-web-inspector/
- https://webkit.org/blog/7122/introducing-riptide-webkits-retreating-wavefront-concurrent-garbage-collector/
- https://webkit.org/blog/14403/updates-to-storage-policy/
- https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- https://webkit.org/blog/18178/webkit-features-for-safari-26-6/
- https://github.com/WebKit/WebKit/commit/6bd11f3792f0

## Bugs de WebKit

- https://bugs.webkit.org/show_bug.cgi?id=215745 (30 fps en bajo consumo)
- https://bugs.webkit.org/show_bug.cgi?id=290671 (60 Hz en ProMotion)
- https://bugs.webkit.org/show_bug.cgi?id=300782 (jetsam)
- https://bugs.webkit.org/show_bug.cgi?id=279637 (jetsam)
- https://bugs.webkit.org/show_bug.cgi?id=195325 (límite de canvas)
- https://bugs.webkit.org/show_bug.cgi?id=181849 (almacenamiento de la pantalla de inicio)
- https://bugs.webkit.org/show_bug.cgi?id=264473 (`audioSession`)
- https://bugs.webkit.org/show_bug.cgi?id=280581 (Memory timeline)
- https://bugs.webkit.org/show_bug.cgi?id=321693 (proceso GPU)
- https://bugs.webkit.org/show_bug.cgi?id=293310 (Ogg Opus)

## MDN

- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event
- https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register

## Khronos

- ANGLE + Metal en Safari: https://www.khronos.org/blog/webgl-2-achieves-pervasive-support-from-all-major-web-browsers

## Datos de dispositivos

- https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE
- https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_IMAGE_UNITS

## Referencia de memoria con el mismo chip

- iPhone SE 3: https://lapcatsoftware.com/articles/2026/1/7.html

## GitHub Pages y Vite

- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://vite.dev/guide/assets
- https://vite.dev/guide/build#load-error-handling

## Mediciones propias

- Scratchpad de la sesión de T-034: `curl` a Pages; Playwright 1.63 WebKit con perfiles iPhone 13 y 17 en horizontal; simulaciones del `TimeStep` real; prototipos `bundle.test.ts`, `fugas.e2e.ts` y overlay. No es una fuente externa y no se conserva en el repo.

## Código fuente de Phaser 3.90

Rutas bajo `node_modules/phaser/src/`. La guía cita archivo y línea (por ejemplo `TimeStep.js:688-694`); abrir la guía para ver qué afirma cada línea.

- `core/TimeStep.js`: bucle de tiempo, delta y límites de fps.
- `core/Game.js`: arranque, pausa y destrucción del juego.
- `core/Config.js`: valores por defecto de la config (`disablePreFX`, `maxLights`, pipeline móvil, mipmaps, física).
- `scene/Systems.js`: ciclo de vida de una escena (sleep, shutdown, destroy).
- `scene/SceneManager.js`: arranque, parada y reinicio de escenas.
- `scene/ScenePlugin.js`: API `this.scene` (start, launch, stop).
- `scene/GetPhysicsPlugins.js`: qué física instala cada escena.
- `sound/BaseSoundManager.js`: ciclo de vida y limpieza de sonidos.
- `sound/webaudio/WebAudioSoundManager.js`: `AudioContext` y desbloqueo en iOS.
- `sound/SoundManagerCreator.js`: elección del gestor de audio.
- `loader/LoaderPlugin.js`: cola de carga y eventos del loader.
- `loader/filetypes/AudioFile.js`: carga y decodificación de audio.
- `textures/TextureManager.js`: alta y baja de texturas.
- `textures/TextureSource.js`: fuente de cada textura y su liberación en GPU.
- `cache/CacheManager.js`: cachés por tipo (audio, JSON, etc.).
- `cache/BaseCache.js`: vaciado de una caché.
- `animations/AnimationManager.js`: animaciones globales.
- `data/DataManagerPlugin.js`: datos de escena y su limpieza.
- `gameobjects/group/Group.js`: destrucción y reciclaje de grupos.
- `gameobjects/DisplayList.js`: lista de dibujo de la escena.
- `gameobjects/UpdateList.js`: lista de objetos con update.
- `gameobjects/tilesprite/TileSprite.js`: textura propia y costo del `TileSprite`.
- `gameobjects/text/Text.js`: canvas y textura de cada `Text`.
- `gameobjects/graphics/GraphicsWebGLRenderer.js`: costo de dibujar `Graphics`.
- `gameobjects/container/ContainerWebGLRenderer.js`: render de `Container` (Mi vo).
- `gameobjects/particles/ParticleEmitter.js`: partículas y su costo.
- `gameobjects/components/FX.js`: efectos postFX por objeto.
- `tweens/TweenManager.js`: tweens activos y su limpieza.
- `time/Clock.js`: eventos temporizados de la escena.
- `input/InputPlugin.js`: entrada y listeners.
- `scale/ScaleManager.js`: escala y resize.
- `physics/arcade/ArcadePhysics.js`: plugin de física Arcade.
- `physics/arcade/World.js`: paso de simulación Arcade.
- `physics/arcade/components/Enable.js`: alta de cuerpos físicos.
- `renderer/webgl/WebGLRenderer.js`: render, contexto y texturas en GPU.
- `renderer/webgl/WebGLPipeline.js`: batches y draw calls.
- `renderer/webgl/PipelineManager.js`: pipelines y su selección.
- `renderer/webgl/pipelines/MobilePipeline.js`: pipeline para móvil (una textura por batch).
- `renderer/webgl/pipelines/PostFXPipeline.js`: base de los efectos postFX.
- `renderer/webgl/pipelines/FXPipeline.js`: efectos preFX/postFX integrados.
- `renderer/webgl/pipelines/LightPipeline.js`: iluminación 2D y su costo.
- `renderer/webgl/wrappers/WebGLTextureWrapper.js`: subida de texturas y mipmaps.
