# Medir y dónde probar cada cosa

Referencia para medir rendimiento y memoria en Phaser 3.90 sobre Safari de iPhone, y para decidir en qué capa de prueba va cada cosa. Leyenda: ✅ comprobado en la guía, 🔬 por comprobar.

## Índice

- [DEP-01 · `?depurar` y medición sin Phaser](#dep-01--depurar-y-medición-sin-phaser)
- [Capa 1: unitarias (Vitest)](#capa-1-unitarias-vitest)
- [Capa 2: e2e (Playwright WebKit)](#capa-2-e2e-playwright-webkit-con-emulación-de-iphone)
- [Capa 3: manual en el iPhone](#capa-3-manual-en-el-iphone)
- [Herramientas de medición](#herramientas-de-medición)

## Reglas

### DEP-01 · `?depurar` y medición sin Phaser

**Hacer**
- Exponer `window.__depurar` y un overlay DOM solo con `?depurar` en la URL. Ningún código del juego usa `__depurar`.
- Overlay: un `<pre>` DOM actualizado cada 500 ms, nunca un `Text` de Phaser (alteraría la medición).
- Separar la lógica en módulos puros, sin importar Phaser:
  - `src/depurar/metricas.ts`: `percentil`, `resumirFrames`, `memoriaTexturasMiB`.
  - `src/depurar/fugas.ts`: `crecimientos(antes, despues)`.
- Lo que lee Phaser va aparte: `src/depurar/contadores.ts` y `src/depurar/overlay.ts`.
- `window.__juego` (el `Phaser.Game`) también existe solo con `?depurar`: los e2e lo usan para manejar escenas; `__depurar` trae `instantanea()` (contadores de fuga) y `metricas()` (fps, p95, tirones, GPU, recargas).
- Contadores (APIs de 3.90): `game.scale.listenerCount('resize')`; suma de `eventNames()`/`listenerCount` de `game.events`, `registry.events`, `sound` y `textures`; `textures.getTextureKeys().length`; `sound.getAll().length`; `cache.audio.getKeys().length`; `anims.anims.size`; `CanvasPool.total()`; `scene.getScenes(true)`; `children.length`; `tweens.getTweens().length`; MiB de `renderer.glTextureWrappers` (×4/3 si es POT); `game.loop.actualFps` y `rawDelta`; *draw calls* envolviendo `gl.drawArrays`.

**Si todavía no existe**
Criterio del product owner: si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-0NN la completa"; no la refines; si ya existe, úsala.
- `?depurar` y el e2e de fugas ya existen (T-037): úsalos y no los reescribas.
- `presupuestos/bundle.test.ts`: lo completa T-036.
- Manifest de assets (`src/datos/assets.json`): lo completa T-040.

**Verifica**
- Unitarias de `metricas.ts` y `fugas.ts`.
- Los e2e usan `__depurar` (`instantanea()`).

**Por qué**
Importar Phaser en Vitest truena con `window is not defined`, y un overlay de Phaser falsearía la medición; el prototipo suma ≈0.8 KiB gzip. [Guía 4.9](../../../../docs/planes/T-034-performance-y-memoria.md#49-depuración-dep)

## Capa 1: unitarias (Vitest)

Los presupuestos se reparten en tres capas. [Guía sección 6](../../../../docs/planes/T-034-performance-y-memoria.md#6-los-presupuestos-en-las-tres-capas-de-pruebas) · [6.1](../../../../docs/planes/T-034-performance-y-memoria.md#61-unitarias-vitest)

- **Bytes del build:** `presupuestos/bundle.test.ts` va fuera de `src/` (usa `node:fs`/`node:zlib` y el `tsconfig` no tiene `@types/node`; en `src/` rompería `tsc --noEmit`).
  - `package.json`: `"test": "vitest run --dir src"` y `"test:presupuestos": "vitest run --dir presupuestos --silent=false"` (sin `--silent=false`, Vitest 5 oculta los totales en el log).
  - `deploy.yml`, job `build`: agregar `- run: npm run test:presupuestos` después de `npm run build`. Sin job nuevo ni tocar el ruleset.
  - No usar "skip si no hay `dist/`": daría un falso verde (en el job `tests` no hay `dist/`).
  - El JS inicial es el que referencia `index.html`; el test imprime el total en el log del CI.
- **Manifest de assets** (`src/datos/assets.json`, las escenas cargan desde ahí): que cada ruta exista en `src/assets/`, que ningún lado pase de 2048, que la memoria por escena (×4/3 si es POT) quepa en el presupuesto y que vecinos y disfraces solo usen claves existentes. Un test en `presupuestos/` compara dimensiones declaradas con el encabezado real del PNG/WebP.
- **Lógica pura:** `metricas.ts`, `fugas.ts`, `paraLoader`, guardar y cargar partida, juicio de ritmo, `avanzar(pos, vel, delta)` y la config del juego exportada como objeto (`disablePreFX`, sin `fps.limit`, `panicMax: 0`, sin `disableWebAudio`).

## Capa 2: e2e (Playwright WebKit con emulación de iPhone)

[Guía 6.2](../../../../docs/planes/T-034-performance-y-memoria.md#62-e2e-playwright-webkit-con-emulación-de-iphone)

- **Detector de fugas:** abrir `./?depurar`, 1 ciclo de calentamiento, `antes = __depurar.instantanea()`, ciclar N veces, `despues`, y exigir `crecimientos(antes, despues) == []`.
  - Ciclo hoy: reiniciar `Arranque` 30 veces. Después: Calle → Puerta → minijuego con `finished(true)` simulado → Calle, 8 casas × 3 vueltas.
  - Esperar 2 frames entre pasos: `stop`/`start` se encolan (`ScenePlugin.js:21-25`).
  - Con un `scale.off` quitado a propósito el test falló (5 → 35 listeners).
- **Sin errores:** `page.on('pageerror')` y `console` de tipo error vacíos durante los ciclos.
- **Red:** ninguna respuesta ≥ 400; requests y bytes por fase con `requestfinished` + `request.sizes()` (el *preview* no comprime: son bytes crudos; el gzip se mide en Vitest); nada se pide dos veces.
- ***Draw calls* y memoria estimada por escena:** envolver `gl.drawArrays` y sumar `glTextureWrappers`, solo si `renderer.type === Phaser.WEBGL`. 🔬 Que el WebKit de Linux en CI tenga WebGL: el primer PR imprime el tipo de renderer en el log.
- **Robustez:** pérdida y restauración de contexto (ROB-01); 404 de un asset → aviso (RED-04); `reload` → "Continuar" (ROB-03).
- **Hitos:** las `performance.mark` existen y van en orden; guardarraíl contra cuelgues: `trt:listo-para-tocar` < 10 s.
- **No confiable en CI (no afirmar aquí):** fps, p95 y tiempos absolutos, memoria absoluta y audio.

## Capa 3: manual en el iPhone

Tabla para la descripción del PR o del hito. [Guía 6.3](../../../../docs/planes/T-034-performance-y-memoria.md#63-manual-en-el-iphone-tabla-para-la-descripción-del-pr-o-del-hito)

| # | Paso | Resultado esperado |
|---|---|---|
| M1 | Activar Web Inspector y conectar el iPhone a la Mac | El iPhone aparece en Desarrollo |
| M2 | Abrir `…/trick-r-treat/?depurar` por WiFi, 5 recargas | Overlay visible; `trt:listo-para-tocar` ≤ 1.5 s (mediana) |
| M3 | Igual que M2, por datos móviles | ≤ 3 s |
| M4 | Abrir desde la pantalla de inicio y buscar en Desarrollo › Home Screen Web Apps | Se puede inspeccionar; el overlay no queda tapado por el notch |
| M5 | Timelines con Memory y JavaScript Allocations; desmarcar "Stop recording once page loads" | Grabación activa |
| M6 | Jugar 15 min (8 casas) | `fps` ≥ 57 en la Calle, `p95` ≤ 18 ms, ≤ 1 tirón cada 10 s, ninguna recarga |
| M7 | Revisar Memory al final | Sin escalera ascendente; piso final ≤ +10 % del piso tras el primer minijuego |
| M8 | Comparar el snapshot tras el minijuego 1 con el de tras el 8 | No crecen escenas, `GameObject`, `Tween` ni `TimerEvent` de escenas que ya salieron |
| M9 | Mirar `tex` del overlay al volver a la Calle | Vuelve al mismo valor cada vez |
| M10 | Timelines › Frames, 30 s corriendo y saltando | La mayoría de los frames ≤ 8 ms |
| M11 | Modo de bajo consumo + un minijuego de reflejos | ≈30 fps, misma velocidad en segundos, se puede ganar |
| M12 | (13 Pro) Flag "Prefer Page Rendering Updates near 60fps" encendido y luego apagado | ≈60 y ≈120 fps a la misma velocidad de juego |
| M13 | Ir al inicio a mitad de un minijuego, esperar 30 s y volver | Sin salto de física, audio reanudado, sin recarga |
| M14 | Bloquear el teléfono 2 min y desbloquear | Igual que M13; "recargas inesperadas: 0" |
| M15 | Tocar el teléfono tras 15 min | Tibio, no caliente; sin caída progresiva de fps |

## Herramientas de medición

[Guía sección 7](../../../../docs/planes/T-034-performance-y-memoria.md#7-cómo-medir-herramientas)

1. **Web Inspector con el iPhone:** iPhone: Ajustes › Apps › Safari › Avanzado › Web Inspector. Mac: Safari › Ajustes › Avanzado › "Mostrar funciones para desarrolladores web". Cable, confiar, Desarrollo › [iPhone] › pestaña. Sin cable: Desarrollo › [iPhone] › "Conectar a través de la red". Las web apps de pantalla de inicio salen en "Home Screen Web Apps" (🔬 que funcione en 26.6).
2. **Timelines:** Memory, JavaScript Allocations y Media vienen apagados; se activan en el engrane. Frames muestra las líneas de 60 y 30 fps; Memory, el piso tras cada GC; Allocations, comparar snapshots.
   - Mientras se graba, el JIT se degrada: los fps grabados no son los reales (se leen en el overlay).
   - `console.profile()`/`profileEnd()` y `console.takeHeapSnapshot()` graban exactamente "entrar y salir de un minijuego".
   - 🔬 Que Memory incluya las texturas WebGL (proceso GPU): probablemente no, por eso existe el estimador propio.
3. **Overlay `?depurar`:** fps (`actualFps`, un promedio que esconde tirones), p95, máximo y tirones de `rawDelta`, texturas, MiB de GPU, sonidos, escenas, *draw calls* y recargas inesperadas. Se usa en el build real de Pages.
4. **`xctrace`** 🔬: `/Applications/Xcode.app/Contents/Developer/usr/bin/xctrace record --template 'Activity Monitor' --device '<iPhone>' --all-processes --time-limit 15m --output partida.trace`. Mediría WebContent + GPU (la huella que decide el jetsam). Requiere Modo desarrollador en el iPhone. `xcrun xctrace` falla porque `xcode-select` apunta a Command Line Tools.
5. **Lo que no existe en Safari:** `performance.memory`, `measureUserAgentSpecificMemory` (además exige COOP/COEP, que Pages no da), `navigator.deviceMemory`, `longtask` y `long-animation-frame`. Sí existen `mark`/`measure`, `resource`, `navigation` y `paint`.
