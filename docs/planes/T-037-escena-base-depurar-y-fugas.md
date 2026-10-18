# Plan T-037: `EscenaBase`, `?depurar` y e2e de fugas

Tarea: [T-037](../tareas/T-037-escena-base-depurar-y-fugas.md)

## Enfoque

Completar lo que T-004 dejó en versión mínima, siguiendo la guía de T-034 (ESC-01 a ESC-03, DEP-01, ROB-04 y la sección 6.2), que ya trae el diseño y un prototipo probado del detector. Hay tres piezas:

1. **`EscenaBase` completa:** se agregan `alLimpiar()` y `this.data.reset()`.
2. **`?depurar` completo:** `window.__depurar`, un overlay DOM y el conteo de recargas inesperadas.
3. **e2e de fugas:** cicla escenas y exige que ningún contador crezca.

Después se corrigen la guía y el skill para que apunten a lo que de verdad existe.

### Decisiones técnicas

| # | Decisión | Por qué |
|---|---|---|
| D1 | Todo en `src/depurar/`: `metricas.ts`, `fugas.ts` y `recargas.ts` (puros, sin Phaser), `contadores.ts` y `overlay.ts` (leen Phaser o el DOM), y `depurar.ts` (los monta). | Decisión del product owner al refinar. Lo puro se puede probar en Vitest; importar Phaser ahí truena. |
| D2 | `__depurar` separa dos cosas: `instantanea()` devuelve **solo contadores de fuga** (enteros que deben volver a la base) y `metricas()` devuelve lo que se **mide** (fps, p95, tirones, MiB de GPU, recargas y renderer). | `crecimientos()` compara solo lo que no debe crecer. Los fps y el p95 varían solos y darían falsos positivos. |
| D3 | Los tiempos de frame se guardan en un búfer circular **preasignado** de 600 muestras (≈10 s a 60 Hz), con un solo listener a `POST_STEP`, que se registra al montar. Un **tirón** es un frame con `rawDelta` > 34 ms (se perdió al menos un frame a 60 Hz; es el mismo número que el presupuesto p99). | Es cero asignaciones por frame (POO-03). Con 10 s de ventana, el overlay se lee directo contra M6 ("≤ 1 tirón cada 10 s"). El listener es fijo: se registra antes de tomar `antes` y no cuenta como fuga. |
| D4 | Recargas inesperadas (ROB-04): al arrancar se marca `trt:en-partida` en `sessionStorage`, y se borra en `pagehide`. Si al arrancar la marca ya existe, se suma 1 a `trt:recargas`. En `pageshow` con `persisted` se vuelve a marcar (la página volvió del bfcache). Todo con `try/catch`. Solo corre con `?depurar`. | Una recarga normal dispara `pagehide` y no cuenta; un jetsam mata el proceso sin `pagehide` y sí cuenta. Con `?depurar` apagado no se toca el almacenamiento (decisión 7: apagado por defecto). |
| D5 | El overlay es un `<pre>` arriba a la izquierda, con `pointer-events: none`. Su margen es `max(16px, env(safe-area-inset-left))`, y arriba lo mismo con `-top`. Se actualiza cada 500 ms con `setInterval` y se salta la actualización si `document.hidden`. | No tapa el botón ⚙︎ (va arriba al centro) ni el joystick (abajo a la izquierda), no roba toques y respeta el notch en horizontal. |
| D6 | El e2e de fugas tiene **dos ciclos**: (a) 30 reinicios de `Arranque`, como pide la tarea; (b) 30 vueltas `Arranque` → `CallePrueba` → `Arranque`. | `CallePrueba` es la escena con más listeners globales (`scale`, `game.events` ×3) y los controles táctiles. Es lo más cercano al ciclo de T-007, que solo tendrá que agregar su propio ciclo con el mismo helper. |
| D7 | Los módulos de `?depurar` se importan de forma **estática**, no con `import()` dinámico. | Suma ≈1–2 KiB gzip (de 317.6 a ≈319.5, contra un tope de 340). El `import()` dinámico obligaría a manejar `vite:preloadError` (CAR-02) por muy poco ahorro. |
| D8 | Fuera de alcance: las *draw calls* (las agrega T-040, que es quien las usa) y ESC-06 (el `sound.once` de `Arranque`, que es de T-007). | Los criterios de T-037 no las piden y cada una tiene dueña. |

### Contenido de `__depurar`

```ts
interface Instantanea {            // contadores de fuga: deben volver a la base
  listenersResize: number;         // game.scale.listenerCount('resize')
  listenersJuego: number;          // suma de listenerCount de game.events
  listenersRegistro: number;       // registry.events
  listenersSonido: number;         // sound
  listenersTexturas: number;       // textures
  listenersShutdown: number;       // suma de sys.events.listenerCount('shutdown') de todas las escenas (ESC-02)
  texturas: number;                // textures.getTextureKeys().length
  sonidos: number;                 // sound.getAll().length
  audioCache: number;              // cache.audio.getKeys().length
  animaciones: number;             // anims.anims.size
  canvas: number;                  // CanvasPool.total()
  escenasActivas: number;          // scene.getScenes(true).length
  objetos: number;                 // suma de children.length de las escenas activas
  tweens: number;                  // suma de tweens.getTweens().length de las escenas activas
}
interface Metricas {               // se miden, no se comparan
  fps: number; p95: number; max: number; tirones: number;  // ventana de ≈10 s
  gpuMiB: number | null;           // null si el renderer es Canvas
  renderer: 'webgl' | 'canvas';
  recargas: number;                // recargas inesperadas en esta pestaña (ROB-04)
}
window.__depurar = { instantanea(): Instantanea, metricas(): Metricas };
```

`window.__juego` se queda tal cual. Las dos variables existen solo con `?depurar`.

## Archivos

- Crear:
  - `src/depurar/metricas.ts`: `percentil`, `resumirFrames`, `memoriaTexturasMiB` y `textoOverlay`.
  - `src/depurar/fugas.ts`: `crecimientos`.
  - `src/depurar/recargas.ts`: `registrarArranque` y `marcarSalida`, con el `Storage` inyectado.
  - `src/depurar/contadores.ts`: `instantanea(game)`, el muestreador de frames y la GPU estimada.
  - `src/depurar/overlay.ts`: el `<pre>`.
  - Tests: `src/depurar/metricas.test.ts`, `fugas.test.ts` y `recargas.test.ts`.
  - `e2e/fugas.e2e.ts` y `e2e/depurar.e2e.ts`.
- Modificar:
  - `src/escenas/EscenaBase.ts`: `alLimpiar()`, `this.data.reset()` y se quita el comentario "mínima".
  - `src/depurar/depurar.ts`: el tipo de `window.__depurar`. Sigue sin importar Phaser, para que `depurar.test.ts` corra en Vitest.
  - Crear `src/depurar/montar.ts`: `montarDepurar(game)`. Va aparte porque importa `contadores.ts`, que importa Phaser (desvío al programar).
  - `src/main.ts`: llama a `montarDepurar`.
  - `docs/planes/T-034-performance-y-memoria.md`: carpeta, `__juego` y el ejemplo de TEX-07.
  - Skill: `.claude/skills/rendimiento-y-memoria/SKILL.md` (tabla de bases mínimas) y sus referencias `medir.md` y `escenas-y-fugas.md`.
  - `docs/tareas/T-037-…md`: el campo `plan:`, los criterios y la bitácora.

## Pasos

1. **Lógica pura con TDD:** `fugas.ts`, `metricas.ts` y `recargas.ts`, con sus tests antes que el código.
   - Verificar: `npm test` en verde. Ninguno de los tres importa `phaser`.
2. **`EscenaBase` completa:** `alLimpiar(fn)` agrega a `limpiezas`, y `init()` hace `this.data.reset()`. Se quita "mínima; T-037 la completa".
   - Verificar: `npm run build` (tipos) y los e2e actuales siguen verdes.
3. **Contadores, overlay y montaje:** `contadores.ts` (D2, D3), `overlay.ts` (D5), recargas conectadas a `pagehide` y `pageshow` (D4), `montarDepurar` en `depurar.ts` y la llamada en `main.ts`.
   - Verificar: `npm run dev -- --host` y abrir `/?depurar` en el navegador: el overlay cambia cada medio segundo y `__depurar.instantanea()` responde en la consola.
4. **e2e** (`e2e/depurar.e2e.ts` y `e2e/fugas.e2e.ts`; casos en "Pruebas").
   - Verificar: `npm run test:e2e` en verde, y el log imprime el renderer.
5. **Probar el detector:** se quita a propósito el `em.off` de `escuchar()`, se corre el e2e de fugas, debe **fallar** con `listenersResize` creciendo, y se revierte. No entra al commit.
   - Verificar: anotar en la bitácora qué contador creció y de cuánto a cuánto.
6. **Documentación:** la guía de T-034 y el skill dicen `src/depurar/` y documentan `__juego` junto a `__depurar`. En la tabla de bases mínimas del skill, `EscenaBase` y `?depurar` pasan a "ya existe: úsala". El ejemplo de TEX-07 de la guía lleva la guarda `if (this.sys.getStatus() !== Phaser.Scenes.SHUTDOWN) return;`, igual que el skill.
   - Verificar: `grep -rn "src/depuracion" docs .claude` no devuelve nada. La `description` del skill no cambia (no afecta su activación).
7. **Cierre de la rama:** `npm test`, `npm run test:e2e`, `npm run build` y `npm run test:presupuestos` (el JS inicial sigue ≤ 340 KiB; anotar el nuevo total), revisión de código, criterios marcados y PR con la tabla manual.

## Pruebas

### Unitarias (`npm test`)

- `src/depurar/fugas.test.ts`:
  - Mismos valores → `[]`.
  - Un contador sube → aparece con `{ clave, antes, despues }`.
  - Un contador baja → no es fuga.
  - Una clave nueva en `despues` cuenta desde 0.
- `src/depurar/metricas.test.ts`:
  - `percentil`: lista vacía, un valor, p95 de 1..100 y valores sin ordenar.
  - `resumirFrames`: búfer a medio llenar, búfer que ya dio la vuelta y tirones justo en el umbral (34 no cuenta, 34.1 sí). Los valores son propios del test, sin fijar ajustes de juego.
  - `memoriaTexturasMiB`: 1024×1024 POT = 4 MiB × 4/3; 1000×700 NPOT sin el factor; lista vacía = 0.
  - `textoOverlay`: incluye cada contador y muestra "GPU: n/d" con Canvas.
- `src/depurar/recargas.test.ts`:
  - Primer arranque → 0.
  - Arranque con la marca puesta → 1, y se acumula.
  - `marcarSalida` y luego arranque → no cuenta.
  - Un `Storage` que lanza error no truena y devuelve 0.
- `src/depurar/depurar.test.ts` (ya existe): sin cambios.

### e2e (`npm run test:e2e`)

Todos registran `pageerror` y `console` de tipo error, y terminan exigiendo que estén vacíos. Esperan 2 frames entre pasos (dos `requestAnimationFrame`), porque `start` y `stop` se encolan.

- `e2e/fugas.e2e.ts`:
  - **Reiniciar `Arranque` 30 veces no deja fugas:** 1 ciclo de calentamiento, `antes`, 30 × `scene.start('Arranque')`, `despues` y `crecimientos(antes, despues)` igual a `[]`. Si falla, el mensaje muestra los crecimientos.
  - **Ir y volver a la calle de prueba 30 veces no deja fugas:** lo mismo con `Arranque` → `CallePrueba` → `Arranque` (D6).
  - **Imprime el renderer** (`console.log` en el reporte) y no falla con Canvas.
  - El helper `ciclar(page, pasos, n)` queda exportado para que T-007 agregue su ciclo Calle → Puerta → minijuego → Calle.
- `e2e/depurar.e2e.ts`:
  - **Con `?depurar`**, `__depurar` existe y `instantanea()` trae todas las claves numéricas. El overlay `#depurar-overlay` está visible, su texto cambia en ≤ 1.5 s y no recibe toques: `elementFromPoint` sobre él devuelve el canvas.
  - **Sin `?depurar`**, no existen `__depurar` ni `#depurar-overlay`, y `sessionStorage` no tiene `trt:en-partida`.
  - **`EscenaBase` (ESC-02, ESC-03):** se hace `data.set('x', 1)` en `Arranque` y se reinicia; después `data.get('x')` es `undefined` y `listenersShutdown` no creció.
  - **Recargas:** `page.reload()` normal → `metricas().recargas` sigue en 0.
- Las pruebas no dependen de valores afinables ni de lo guardado: cada test abre una página nueva (un contexto limpio de Playwright).

### Manual en el iPhone (va también en la descripción del PR)

| # | Paso | Resultado esperado |
|---|---|---|
| M1 | Activar Web Inspector en el iPhone y conectarlo a la Mac | El iPhone aparece en el menú Desarrollo de Safari |
| M2 | Abrir `…/trick-r-treat/?depurar` desde Pages por WiFi y recargar 5 veces | El overlay se ve arriba a la izquierda y cambia cada medio segundo; `recargas: 0` |
| M4 | Abrir desde la pantalla de inicio (con `?depurar` en el ícono guardado) y buscarla en Desarrollo › Home Screen Web Apps | Se puede inspeccionar; el overlay no queda tapado por el notch, en ninguno de los dos lados horizontales |
| E1 | Con el overlay visible, caminar y saltar en la calle de prueba con el joystick bajo el overlay | El overlay no roba toques; el joystick y el ⚙︎ funcionan igual |
| E2 | En la consola de Web Inspector: `__depurar.instantanea()` y `__depurar.metricas()` | Devuelven números; `renderer: 'webgl'` |
| E3 | Abrir sin `?depurar` | No hay overlay ni ⚙︎ |

M3 y M5 a M15 son de T-041 (la medición de 15 minutos).

### Capas que no aplican

Ninguna: aplican las tres.

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Paso 1: lógica pura con TDD (subagente) | Sonnet | `medium` | Funciones chicas, con tests claros y sin Phaser. |
| Pasos 2–3: `EscenaBase`, contadores, overlay y montaje (subagente) | Sonnet | `high` | APIs de Phaser 3.90 fáciles de confundir con las de la v4, y la regla de cero asignaciones por frame. |
| Paso 4: e2e (subagente) | Sonnet | `high` | Los tiempos de la cola de escenas (2 frames) y las esperas en WebKit son la parte frágil. |
| Paso 5: probar el detector | Opus (sesión principal) | `high` | Decide si el detector sirve de verdad; no se delega. |
| Paso 6: documentación de la guía y el skill | Haiku | `low` | Reemplazos de texto puntuales y ya definidos aquí. |
| Revisión del PR | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol. |
| Orquestación y paso 7 | Opus (sesión principal) | `high` | Referencia por rol. |

## Riesgos y dudas

- **WebGL en el CI:** no se sabe si el WebKit de Linux lo tiene. Por eso el e2e solo imprime el renderer y no falla con Canvas, y `gpuMiB` es `null` en Canvas.
- **Presupuesto del bundle:** si el JS inicial pasa de 340 KiB, no se sube el límite sin decisión del product owner (T-036). Se espera ≈319.5.
- **Contadores que varían solos:** `objetos` y `tweens` dependen de la escena activa. Por eso `antes` y `despues` se toman en el mismo punto del ciclo (con `Arranque` activa). Si alguno resulta inestable sin haber fuga, se anota en la bitácora y se decide si sale de la instantánea.
- **`CallePrueba` hereda de `EscenaBase`** y redefine `init` llamando a `super.init(data)`. Si el ciclo (b) encuentra una fuga real, se arregla en esta tarea y se anota.
