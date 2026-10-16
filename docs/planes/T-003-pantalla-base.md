# Plan T-003: Pantalla base para iPhone

Tarea: [T-003](../tareas/T-003-pantalla-base.md)

## Enfoque

Tres piezas de plataforma, cada una en su archivo: la configuración de escala de Phaser, el aviso de girar el teléfono y una escena de arranque que pide el primer toque y hace sonar un sonido de prueba. `SmokeTest` desaparece y la escena de arranque queda como la primera del juego (T-007 la conectará con el Menú).

Abajo, cada decisión con sus alternativas y la recomendación. Las marcadas con ⚖️ son las que más conviene que revises.

### 1. Escala: `FIT` con ancho dinámico (cambió tras la prueba en el iPhone)

- **Plan original:** `FIT` a 1280×720 fijo. En el iPhone dejaba **franjas negras a los lados**, porque la pantalla en horizontal es mucho más ancha que 16:9 (≈2.17:1, y ≈2.6:1 con la barra de Safari). Carlos pidió quitarlas.
- **Hecho:** `FIT` + `CENTER_BOTH` con **altura lógica fija de 720 y ancho variable** (`src/plataforma/escala.ts`). El ancho se calcula a partir de la proporción de la pantalla, entre 1280 (16:9) y 1872 (2.6:1), y se recalcula con un `ResizeObserver` (al girar, al aparecer o esconderse barras) usando `game.scale.setGameSize`.
- **Regla para las escenas futuras:** lo importante va en la **zona segura central de 1280×720**; los lados solo muestran más escenario. Cada escena se acomoda escuchando `this.scale.on('resize')`, como hace `Arranque` para centrar su texto.
- Alternativas descartadas:
  - `ENVELOP`: llena toda la pantalla pero **recorta** arriba y abajo (≈30% de la altura con la barra de Safari).
  - Franjas decoradas con un fondo de Halloween: simple, pero el juego se ve más chico.
  - `RESIZE`: también cambiaría la altura; cada escena tendría que manejar alturas distintas.

### 2. Aviso de "gira tu teléfono" ⚖️

- **Recomendado: overlay HTML/CSS** en `index.html`, con `@media (orientation: portrait)`. Aparece antes de que Phaser cargue, no depende de ninguna escena y son unas líneas de CSS.
- **Bloqueo de rotación:** si el iPhone tiene activado el bloqueo de orientación vertical, Safari no gira aunque el teléfono sí, y el aviso no se iría nunca. Una página web no puede detectar ese bloqueo, así que el propio aviso lo explica: "Gira tu teléfono. ¿No gira? Quita el bloqueo de rotación en el Centro de control."
- Además, un archivo pequeño `src/plataforma/orientacion.ts` que **pausa el juego mientras está en vertical** y lo reanuda al girar (con `matchMedia` y `game.pause()` / `game.resume()`). Así, cuando haya minijuegos con tiempo, el reloj no corre detrás del aviso. Es opcional para esta tarea; si prefieres dejarlo para después, se quita.
- Alternativas descartadas:
  - Escena de Phaser para el aviso: habría que lanzarla encima de cualquier escena activa y dibujar el aviso a 1280×720 escalado en una pantalla vertical (se vería diminuto). Más código, peor resultado.
  - Bloquear la orientación (`screen.orientation.lock`): Safari en iPhone no lo permite.

### 3. Viewport, safe areas y gestos de iOS

- `meta viewport`: `width=device-width, initial-scale=1, viewport-fit=cover`. `viewport-fit=cover` deja que el juego llegue hasta debajo del notch / Dynamic Island.
- **Cambió tras la prueba en el iPhone:** el plan original ponía `padding` con `env(safe-area-inset-*)` para meter el juego dentro del área segura, pero eso dejaba franjas negras a los lados y abajo. Ahora `#game` ocupa **toda la pantalla** (`position: fixed; inset: 0`). La zona segura central de 1280×720 ya queda lejos del notch; los controles y el HUD (T-004, T-011) deben dejar ≈40 px libres abajo (barra de inicio) y no pegarse a las esquinas redondeadas.
- CSS para que el navegador no estorbe al jugar: `touch-action: none` (sin zoom por doble toque ni scroll), `user-select: none` y `-webkit-touch-callout: none` (sin menú de "copiar" al mantener presionado), `overscroll-behavior: none` (sin rebote).
- **Barra de Safari (agregado tras la prueba):** Safari en iPhone no permite esconderla desde la página (no hay Fullscreen API en iPhone). La única forma es abrir el juego **desde la pantalla de inicio**. Se agregaron las meta tags `apple-mobile-web-app-capable`, `mobile-web-app-capable` y `apple-mobile-web-app-status-bar-style`; Carlos comprobó que así se ve sin barras y suena. El título y el ícono de la pantalla de inicio esperan al nombre del juego (T-018). El tutorial de "agrega a tu pantalla de inicio", el ícono y el manifest quedan para una tarea aparte (la crea el orquestador).

### 4. Desbloqueo de audio en el primer toque

- iOS no deja sonar audio hasta que el usuario toca la pantalla. **Phaser 3.90 ya lo resuelve**: escucha el primer `touchstart`/`touchend` y desbloquea el audio solo, avisando con el evento `UNLOCKED`. No hace falta código propio de desbloqueo.
- **Recomendado:** una escena `Arranque` (`src/escenas/Arranque.ts`) que carga el sonido de prueba y muestra "Toca para empezar". Al tocar, suena el sonido y el texto cambia a "Audio listo". Si el audio aún no estaba desbloqueado en ese instante, espera el evento `UNLOCKED` y suena entonces.
- Por qué una pantalla de "toca para empezar": es el patrón común en juegos web de iPhone, garantiza que el primer toque llegue antes de cualquier sonido y le da a T-007 un punto de entrada natural (Arranque → Menú).
- iOS y el **modo silencio**: por defecto, el audio web respeta el switch de silencio del iPhone. Si el teléfono está en silencio, no suena nada aunque todo funcione. Para esta tarea lo dejo así (comportamiento normal de un juego) y en la prueba hay que quitar el silencio. Se puede forzar con `navigator.audioSession.type = 'playback'` (Safari 17+), pero eso pausa la música de otras apps. Lo dejo anotado para T-017 (música y sonido).

### 5. Sonido de prueba ⚖️

- **Recomendado: archivo generado por mí**, `public/audio/prueba.m4a` (AAC, unos pocos KB): un "ding" corto de dos notas sintetizado con un script de Node (sin dependencias) que escribe un WAV, convertido a AAC con `afconvert`, que trae macOS. Sin licencias de terceros.
  - Ventaja: además de probar el desbloqueo, prueba el **camino real de los assets**: carpeta `public/`, cargador de Phaser y rutas con la base `/trick-r-treat/` de GitHub Pages (T-002).
  - Formato AAC (`.m4a`): Safari en iPhone y Chrome lo reproducen. OGG no es seguro en iPhones viejos. El Chromium de las pruebas automáticas no trae AAC; ahí se verificó con un WAV temporal.
  - El script queda pegado en la bitácora para poder regenerar el sonido.
- Alternativa: sintetizarlo en vivo con WebAudio (un oscilador). Cero archivos, pero no prueba la carga de assets ni las rutas, que es justo lo que T-017 necesitará.
- **Rutas de assets (cambió tras un bug en el iPhone):** el plan decía "ruta relativa a la página". Falló cuando la pestaña quedó en una subruta (`/trick-r-treat/trick-r-treat/`): el audio se pedía en una ruta inexistente, el servidor respondía con `index.html` (200) y Safari fallaba al decodificarlo (`EncodingError`). Ahora `main.ts` fija `loader.baseURL = import.meta.env.BASE_URL` para todo el juego: las rutas en el loader se escriben sin `/` inicial (`'audio/prueba.m4a'`) y siempre se resuelven desde la base de Vite, no desde la URL de la página.
- **Diagnóstico en pantalla:** si no hay sonido, `Arranque` dice por qué (el navegador no soporta AAC, no cargó con su código HTTP, o no se pudo decodificar). Fue lo que permitió encontrar el bug anterior.

## Archivos

- Crear: `src/escenas/Arranque.ts`, `src/plataforma/orientacion.ts`, `src/plataforma/escala.ts`, `src/plataforma/audio.ts`, `public/audio/prueba.m4a`, los unit tests de `src/plataforma/`, `playwright.config.ts` y `e2e/`
- Modificar: `src/main.ts` (quita `SmokeTest`, configura escala, `loader.baseURL` y escenas), `index.html` (viewport, overlay de girar, meta tags de pantalla de inicio)
- Modificar después de que T-006 entre a `main` (cedidos por el orquestador): `package.json` y `package-lock.json` (`@playwright/test`, `test:e2e`), `.github/workflows/deploy.yml` (job `e2e`), `.gitignore` (`test-results/`), `CLAUDE.md` (reglas de pantalla y assets)

## Pasos

1. `index.html`: viewport, CSS del contenedor con safe areas y overlay de girar.
   - Verificar: en el navegador con DevTools en modo iPhone, el aviso aparece en vertical y se va en horizontal.
2. `src/main.ts`: configuración `FIT` + `CENTER_BOTH`, y escena `Arranque` provisional en lugar de `SmokeTest`.
   - Verificar: `npm run build` pasa; al cambiar el tamaño de la ventana el juego se escala sin deformarse.
3. `public/audio/prueba.m4a` + `src/escenas/Arranque.ts` con "Toca para empezar" y el sonido.
   - Verificar: en el navegador de la Mac suena tras el primer clic; en la pestaña Network la ruta es relativa.
4. `src/plataforma/orientacion.ts`: pausa y reanuda al girar.
   - Verificar: en DevTools, al pasar a vertical el juego se congela y al volver sigue.
5. Prueba en el iPhone (la hace Carlos con el dev server en la red local): horizontal sin deformar, aviso en vertical que desaparece al girar, sonido tras el primer toque.

Cada paso es un commit `T-003: …`.

Tras la primera prueba en el iPhone se agregaron: ancho dinámico, juego bajo el notch, meta tags de pantalla de inicio, diagnóstico de audio y `loader.baseURL` (cada uno en su commit).

Pasos de pruebas (después de la prueba en el iPhone):

6. Separar la lógica de `src/plataforma/` en funciones que se puedan probar sin Phaser.
7. Cuando T-006 esté en `main`: `git merge origin/main`, `npm install` y los unit tests de "Pruebas".
   - Verificar: `npm test` pasa.
8. Agregar `@playwright/test` 1.63.0 exacta (aprobado por el product owner y el orquestador), el script `test:e2e`, `playwright.config.ts`, los e2e de `e2e/` y `test-results/` en `.gitignore`.
   - Verificar: `npm run test:e2e` pasa en local.
9. Job `e2e` en `.github/workflows/deploy.yml`, sin renombrar `tests` ni `build`.
   - Verificar: `actionlint` pasa y el PR sale en verde con `tests`, `build` y `e2e`.
10. Reglas en `CLAUDE.md`: zona segura central de 1280×720 con ancho variable, rutas del loader sin `/` inicial y el comando `npm run test:e2e`.

## Pruebas

Decisión del product owner: unit tests y tests end-to-end entran en esta tarea. El PR espera a que T-006 (Vitest) esté en `main`. Para poder probarla sin cargar Phaser (que no corre en Node), la lógica de `src/plataforma/` se separó en funciones que solo usan sus tipos.

- **Unit tests (`npm test`, Vitest de T-006)**, junto a cada archivo (`src/plataforma/*.test.ts`, o la convención que fije T-006):
  - `escala.test.ts`, `calcularAncho`: 16:9 → 1280; iPhone en pantalla de inicio (932×430) → 1561; Safari con barra (800×310) → 1858; más ancho que 2.6:1 → 1872 (tope); vertical → 1280 (piso); tamaño 0 → 1280.
  - `escala.test.ts`, `ajustarAnchoAlContenedor` (con `ResizeObserver` y juego simulados): llama a `setGameSize(ancho, 720)` cuando el ancho cambia y no lo llama cuando es el mismo.
  - `orientacion.test.ts`, `pausarEnVertical` (con `matchMedia` simulado): arranca en vertical → pausa; arranca en horizontal → reanuda; al girar a horizontal → reanuda; al girar a vertical → pausa.
  - `audio.test.ts`, `motivoSinAudio`: sin AAC → "no soporta AAC" (aunque haya error de carga); con error de carga → ese error; sin error → "no se pudo decodificar".
- **End-to-end (`npm run test:e2e`, Playwright 1.63.0 con WebKit)**, mínimos, uno por criterio de la pantalla. Corren contra `npm run build && npm run preview` (puerto 5193, base `/trick-r-treat/`) emulando un iPhone 17 en horizontal. Van en `e2e/pantalla.e2e.ts` y se configuran en `playwright.config.ts`. Se llaman `*.e2e.ts` y no `*.spec.ts` porque Vitest toma los `*.spec.ts` por defecto; así no hace falta tocar `vite.config.ts`:
  - Horizontal: el canvas ocupa todo el viewport (sin franjas) y su proporción interna coincide con la que se ve (sin deformar), con y sin la barra de Safari.
  - Vertical: el aviso de girar se ve; al pasar a horizontal desaparece y el canvas vuelve a llenar la pantalla.
  - Audio: el juego pide `/trick-r-treat/audio/prueba.m4a` y responde 200 con tipo `audio/*`, desde la raíz y con la página en una subruta (el bug de la bitácora). Un test por ruta, cada uno con navegador limpio, para que la caché no conteste 304. El WebKit de Linux puede no traer AAC, así que el test hace que el navegador diga que lo soporta: prueba la ruta, no el códec. Que el sonido suene se sigue probando a mano.
  - En el CI: job propio `e2e` en `deploy.yml` (instala WebKit y corre `npm run test:e2e`), también en `needs` de `deploy`. El ruleset de T-031 exige `tests` y `build`; `e2e` no es obligatorio salvo que el product owner lo pida (se agregaría a `.github/rulesets/main.json` después del merge).
  - Se comprobó que los tests detectan los bugs reales: con el ancho fijo de 1280 fallan los e2e de pantalla y 5 unit tests; sin `loader.baseURL` falla el e2e de la subruta.
- **Manuales, en el navegador** (hechas durante la implementación): `npm run build`; ancho dinámico en 844×390, 800×310, 932×430 y 1280×720; aviso al pasar a vertical y vuelta a horizontal con reescalado; sonido tras el primer clic (con un WAV temporal, porque ese Chromium no trae AAC); `npm run preview` con la base `/trick-r-treat/`, también desde una subruta.
- **Manuales, en el iPhone** (product owner), en Safari y desde la pantalla de inicio: el juego llena la pantalla sin deformarse, también bajo el notch; en vertical aparece el aviso y desaparece al girar; el sonido suena tras el primer toque (sin modo silencio); desde la pantalla de inicio no se ven barras de Safari.

## Riesgos y dudas

- Al girar, Safari a veces reporta el tamaño nuevo con retraso y el juego podría quedar mal escalado un instante. Phaser revisa el tamaño periódicamente, así que debería corregirse solo; si no, se agrega un reajuste tras `orientationchange`.
- Si el audio queda "suspendido" al volver de otra app o de una llamada, eso se atiende en T-017/T-022, no aquí.
- En la computadora, una ventana más alta que ancha también muestra el aviso de girar. Es aceptable (solo afecta desarrollo).
