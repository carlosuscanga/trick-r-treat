# Robustez (ROB-01 a ROB-05)

Reglas para que el juego sobreviva a la pérdida de contexto WebGL, a que iOS mate la pestaña y a los cambios de visibilidad. Solo Phaser 3.90.

### ROB-01 · Pausar en LOSE_WEBGL y reanudar en RESTORE_WEBGL
- **Hacer:** escuchar los eventos del renderer WebGL: al perder el contexto, pausar; al restaurarlo, redibujar las texturas dinámicas y reanudar. Phaser restaura solo las texturas normales, pero no el contenido de `RenderTexture`/`DynamicTexture`.
  ```ts
  const r = game.renderer;
  if (r instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
    r.on(Phaser.Renderer.Events.LOSE_WEBGL, () => pausa.activar('contexto'));
    r.on(Phaser.Renderer.Events.RESTORE_WEBGL, () => { redibujarDinamicas(); pausa.quitar('contexto'); });
  }
  ```
  La pausa es por motivos (`src/plataforma/pausa.ts`): juego y sonido se pausan mientras haya al menos un motivo activo (`'vertical'`, `'contexto'`); se pausan los sonidos que sonaban y se reanudan solo esos. `src/plataforma/contexto.ts` ya lo hace; no lo reimplementes.
  - **Nunca** llames `game.pause()`, `game.resume()`, `sound.pauseAll()` ni `sound.resumeAll()` directo: una pausa nueva agrega su motivo.
  - **Nunca** dejes una `RenderTexture` o `DynamicTexture` sin redibujarla en `RESTORE_WEBGL`. Quien la crea la registra en esa misma tarea.
  - No uses `Phaser.Core.Events.CONTEXT_LOST` (nunca se emite) ni llames dos veces a `setContextHandlers()`.
- **Ya existe:** `src/plataforma/pausa.ts` y `src/plataforma/contexto.ts`; úsalos.
- **Verifica:** e2e (Playwright WebKit): `WEBGL_lose_context.loseContext()` deja el juego pausado y `restoreContext()` lo reanuda; otro caso cubre la restauración con la pantalla en vertical (sigue pausado). Revisión: ningún `CONTEXT_LOST` en el código.
- **Por qué:** sin esto la lógica sigue corriendo con la pantalla negra y se pierden las texturas dinámicas. [Guía, 4.8](../../../../docs/planes/T-034-performance-y-memoria.md#48-robustez-rob).

### ROB-02 · Jetsam: diseñar para la recarga silenciosa
- **Hacer:** asume que iOS puede matar el proceso y que Safari recarga la página sin avisar a JS, a veces sin `webglcontextlost`. No hay evento al que engancharse: respeta el presupuesto de memoria y guarda en puntos seguros (ROB-03).
- **Verifica:** manual en el iPhone, junto con ROB-03 (cerrar Safari a la fuerza y comprobar que se puede continuar).
- **Por qué:** iOS no publica un límite de memoria por pestaña. [Guía, 4.8](../../../../docs/planes/T-034-performance-y-memoria.md#48-robustez-rob).

### ROB-03 · Guardar el GameState en localStorage y ofrecer "Continuar"
- **Hacer:** serializar `{ v: 1, disfrazId, medios, sustos, visitadas, guardadoEn }` al entrar a la Calle y al aplicar el resultado de una casa; nunca a mitad de un minijuego. Al arrancar, ofrecer "Continuar" si hay una partida reciente y compatible. Todo con `try/catch`, en `src/estado/`, sin Phaser.
- **Si todavía no existe:** si la tarea lo necesita, crea la base mínima de guardar y reanudar con el comentario "mínima; T-042 la completa"; no la refines. Si ya existe, úsala.
- **Verifica:** unitaria (ida y vuelta; versión distinta o partida caducada se descarta; un `localStorage` que lanza error no truena). e2e: `page.reload()` ofrece "Continuar" con el mismo estado ([Guía, 6.2](../../../../docs/planes/T-034-performance-y-memoria.md#62-e2e-playwright-webkit-con-emulación-de-iphone)). Manual en el iPhone: cerrar Safari a la fuerza.
- **Por qué:** es la defensa contra la recarga silenciosa de una partida larga. [Guía, 4.8](../../../../docs/planes/T-034-performance-y-memoria.md#48-robustez-rob).

### ROB-04 · Contar las "recargas inesperadas"
- **Hacer:** marcar `trt:en-partida` en `sessionStorage` al arrancar y borrarlo en `pagehide`. Si al arrancar ya existe, la sesión anterior murió; el overlay de `?depurar` lo muestra.
- **Ya existe:** `?depurar` ya cuenta las recargas inesperadas (T-037): `__depurar.metricas().recargas` y el overlay.
- **Verifica:** manual en el iPhone (M14 de la guía).
- **Por qué:** es la única forma de saber cuántas veces mató iOS la pestaña. [Guía, 4.8](../../../../docs/planes/T-034-performance-y-memoria.md#48-robustez-rob).

### ROB-05 · No duplicar lo que Phaser ya hace con la visibilidad
- **Hacer:** no escribas manejadores propios de `visibilitychange` ni de pausa del audio al ocultar la página. Phaser pausa, llama `resetDelta` al volver, y con `pauseOnBlur` suspende y reanuda el `AudioContext`, también tras `'interrupted'`.
- **Verifica:** manual en el iPhone (M13 y M14 de la guía).
- **Por qué:** duplicarlo choca con el manejo interno de Phaser. [Guía, 4.8](../../../../docs/planes/T-034-performance-y-memoria.md#48-robustez-rob).
