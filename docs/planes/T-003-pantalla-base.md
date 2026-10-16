# Plan T-003: Pantalla base para iPhone

Tarea: [T-003](../tareas/T-003-pantalla-base.md)

## Enfoque

Tres piezas de plataforma, cada una en su archivo: la configuración de escala de Phaser, el aviso de girar el teléfono y una escena de arranque que pide el primer toque y hace sonar un sonido de prueba. `SmokeTest` desaparece y la escena de arranque queda como la primera del juego (T-007 la conectará con el Menú).

Abajo, cada decisión con sus alternativas y la recomendación. Las marcadas con ⚖️ son las que más conviene que revises.

### 1. Escala: `FIT` a 1280×720, centrado

- **Recomendado:** `scale.mode = FIT`, `autoCenter = CENTER_BOTH`, resolución lógica 1280×720 (16:9). El juego siempre "piensa" en 1280×720 y Phaser lo agranda o encoge sin deformarlo. Lo que sobre se ve como franjas del color de fondo.
- Consecuencia: el iPhone en horizontal es más ancho que 16:9 (≈2.16:1, y menos con las barras de Safari), así que habrá **franjas a los lados**. Es lo esperado con `FIT`.
- Alternativas descartadas:
  - `ENVELOP`: llena toda la pantalla pero **recorta** bordes; un botón o un dulce en la orilla podría quedar fuera.
  - `RESIZE` o ancho variable según el teléfono: aprovecha toda la pantalla, pero cada escena tendría que acomodarse a anchos distintos. Más complejo; se puede revisar cuando haya arte, si las franjas molestan.

### 2. Aviso de "gira tu teléfono" ⚖️

- **Recomendado: overlay HTML/CSS** en `index.html`, con `@media (orientation: portrait)`. Aparece antes de que Phaser cargue, no depende de ninguna escena y son unas líneas de CSS.
- **Bloqueo de rotación:** si el iPhone tiene activado el bloqueo de orientación vertical, Safari no gira aunque el teléfono sí, y el aviso no se iría nunca. Una página web no puede detectar ese bloqueo, así que el propio aviso lo explica: "Gira tu teléfono. ¿No gira? Quita el bloqueo de rotación en el Centro de control."
- Además, un archivo pequeño `src/plataforma/orientacion.ts` que **pausa el juego mientras está en vertical** y lo reanuda al girar (con `matchMedia` y `game.pause()` / `game.resume()`). Así, cuando haya minijuegos con tiempo, el reloj no corre detrás del aviso. Es opcional para esta tarea; si prefieres dejarlo para después, se quita.
- Alternativas descartadas:
  - Escena de Phaser para el aviso: habría que lanzarla encima de cualquier escena activa y dibujar el aviso a 1280×720 escalado en una pantalla vertical (se vería diminuto). Más código, peor resultado.
  - Bloquear la orientación (`screen.orientation.lock`): Safari en iPhone no lo permite.

### 3. Viewport, safe areas y gestos de iOS

- `meta viewport`: `width=device-width, initial-scale=1, viewport-fit=cover`. `viewport-fit=cover` deja que el fondo negro llegue hasta debajo del notch / Dynamic Island.
- El contenedor `#game` ocupa la pantalla con `position: fixed` y tiene `padding` con `env(safe-area-inset-*)`: así **el juego se acomoda dentro del área segura** y nada queda tapado por el notch o la barra de inicio.
- CSS para que el navegador no estorbe al jugar: `touch-action: none` (sin zoom por doble toque ni scroll), `user-select: none` y `-webkit-touch-callout: none` (sin menú de "copiar" al mantener presionado), `overscroll-behavior: none` (sin rebote).
- Fuera de alcance: pantalla completa real. Safari en iPhone no tiene Fullscreen API; la única forma es "Agregar a pantalla de inicio" (necesita manifest e íconos). Lo anoto como idea, no entra aquí.

### 4. Desbloqueo de audio en el primer toque

- iOS no deja sonar audio hasta que el usuario toca la pantalla. **Phaser 3.90 ya lo resuelve**: escucha el primer `touchstart`/`touchend` y desbloquea el audio solo, avisando con el evento `UNLOCKED`. No hace falta código propio de desbloqueo.
- **Recomendado:** una escena `Arranque` (`src/escenas/Arranque.ts`) que carga el sonido de prueba y muestra "Toca para empezar". Al tocar, suena el sonido y el texto cambia a "Audio listo". Si el audio aún no estaba desbloqueado en ese instante, espera el evento `UNLOCKED` y suena entonces.
- Por qué una pantalla de "toca para empezar": es el patrón común en juegos web de iPhone, garantiza que el primer toque llegue antes de cualquier sonido y le da a T-007 un punto de entrada natural (Arranque → Menú).
- iOS y el **modo silencio**: por defecto, el audio web respeta el switch de silencio del iPhone. Si el teléfono está en silencio, no suena nada aunque todo funcione. Para esta tarea lo dejo así (comportamiento normal de un juego) y en la prueba hay que quitar el silencio. Se puede forzar con `navigator.audioSession.type = 'playback'` (Safari 17+), pero eso pausa la música de otras apps. Lo dejo anotado para T-017 (música y sonido).

### 5. Sonido de prueba ⚖️

- **Recomendado: archivo generado por mí**, `public/audio/prueba.m4a` (AAC, unos pocos KB): un "ding" corto de dos notas sintetizado con un script de Node (sin dependencias) que escribe un WAV, convertido a AAC con `afconvert`, que trae macOS. Sin licencias de terceros.
  - Ventaja: además de probar el desbloqueo, prueba el **camino real de los assets**: carpeta `public/`, cargador de Phaser y ruta relativa (`audio/prueba.m4a`, sin `/` inicial), que debe seguir funcionando cuando T-002 ponga `base: '/trick-r-treat/'` para GitHub Pages.
  - Formato AAC (`.m4a`): Safari en iPhone y Chrome lo reproducen. OGG no es seguro en iPhones viejos.
  - El script queda pegado en la bitácora para poder regenerar el sonido.
- Alternativa: sintetizarlo en vivo con WebAudio (un oscilador). Cero archivos, pero no prueba la carga de assets ni las rutas, que es justo lo que T-017 necesitará.

## Archivos

- Crear: `src/escenas/Arranque.ts`, `src/plataforma/orientacion.ts`, `public/audio/prueba.m4a`
- Modificar: `src/main.ts` (quita `SmokeTest`, configura escala y escenas), `index.html` (viewport, safe areas, overlay de girar)

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

## Riesgos y dudas

- Al girar, Safari a veces reporta el tamaño nuevo con retraso y el juego podría quedar mal escalado un instante. Phaser revisa el tamaño periódicamente, así que debería corregirse solo; si no, se agrega un reajuste tras `orientationchange`.
- Si el audio queda "suspendido" al volver de otra app o de una llamada, eso se atiende en T-017/T-022, no aquí.
- En la computadora, una ventana más alta que ancha también muestra el aviso de girar. Es aceptable (solo afecta desarrollo).
