# Audio (AUD-01 a AUD-06)

Reglas de audio para Phaser 3.90 y el presupuesto de PCM vivo. Fuente: [sección 4.3 de la guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud).

### AUD-01 · Todo con Web Audio
- **Hacer:** no poner `audio: { disableWebAudio: true }` en la config de `src/main.ts`. Un solo *sound manager* para todo el juego.
- **Verifica:** unitaria, si la config se exporta (que `disableWebAudio` no sea `true`); si no, revisión de `main.ts`.
- **Por qué:** en HTML5 Audio iOS ignora `volume` y la latencia es peor ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

### AUD-02 · Música: mono, bucle corto (≤ 90 s), una sola pista viva
- **Hacer:** pistas mono de 90 s o menos; solo una música cargada a la vez (liberar la anterior, ver AUD-05).
- **Si todavía no existe:** el manifest de assets (con la duración y los canales del audio) es de T-040; los assets salen de `src/assets` + `paraLoader` (T-039). Si la tarea lo necesita, crea la base mínima del manifest con el comentario "mínima; T-040 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** unitaria (manifest: segundos × canales × 48 000 × 4 ≤ presupuesto); e2e (suma de `cache.audio`).
- **Por qué:** el `AudioBuffer` es float32 por canal a 48 kHz: 90 s mono = 17.3 MB y 3 min estéreo = 69.1 MB ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

### AUD-03 · Efectos en audio sprites: uno global y uno por minijuego
- **Hacer:** un sprite global (UI, Mi vo, dulces, sustos) y uno por minijuego. Reproducir con `this.sound.playAudioSprite('sfx', 'dulce')`. No usar `this.sound.add(...)` en cada toque.
- **Si todavía no existe:** los audio sprites y su pipeline son de T-017. Si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-017 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** e2e (`game.sound.getAll().length` no crece tras N efectos).
- **Por qué:** una petición, una decodificación y una clave que liberar; los sonidos se autodestruyen al terminar ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

### AUD-04 · Codificar con `afconvert -f m4af -d aac`
- **Hacer:** ≈96 kbps mono para música y 64–96 kbps para efectos. No usar Opus.
- **Si todavía no existe:** el pipeline de codificación es de T-017. Si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-017 la completa"; no la refines; si ya existe, úsalo.
- **Verifica:** e2e "clic en 1.000 s" como regresión del pipeline (T-017).
- **Por qué:** es el formato nativo de iOS y no desfasa por *priming*; Opus no ahorra memoria y tiene bugs en Safari 26 ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

### AUD-05 · Liberar audio en dos pasos: sonidos y caché
- **Hacer:** al salir de la escena, destruir los sonidos y luego quitar el PCM de la caché:
  ```ts
  this.alLimpiar(() => { this.sound.removeByKey('ritmo-cancion'); this.cache.audio.remove('ritmo-cancion'); });
  ```
- **Si todavía no existe:** `alLimpiar()` llega con la `EscenaBase` completa (T-037). Con la mínima, usa `this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { … })` con las mismas dos líneas.
- **Verifica:** e2e de fugas (`sound.getAll().length` y `cache.audio.getKeys().length` vuelven a la base tras N ciclos de escena).
- **Por qué:** `sound/` no escucha `SHUTDOWN` (un bucle sigue sonando tras `scene.stop()`) y `removeByKey` no libera el PCM de `cache.audio` ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

### AUD-06 · Ritmo: el reloj es el del `AudioContext`, no el `delta`
- **Hacer:** `tCancion = ctx.currentTime − inicio − (outputLatency + baseLatency + calibración)`. Pasar el toque al reloj de audio con `getOutputTimestamp()`. Agregar pantalla de calibración guardada en `localStorage`.
- **Si todavía no existe:** el minijuego de ritmo es de T-022. Si la tarea lo necesita, crea la base mínima con el comentario "mínima; T-022 la completa"; no la refines; si ya existe, úsala.
- **Verifica:** unitaria (juicio acierto/cerca/fallo como función pura); manual en el iPhone (bocina y AirPods).
- **Por qué:** rAF y el audio se desfasan, y Bluetooth suma ~100–300 ms ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#43-audio-aud)).

## Presupuesto de PCM de audio vivo

Tope **≤ 40 MB**: música ≤ 17.3 MB (90 s mono 48 kHz), sprite global ≤ 4 MB, sprite de minijuego ≤ 4 MB.
- **Verifica:** unitaria (Vitest: duración × canales) y e2e (`cache.audio`).
- **Por qué:** el cálculo es verificado y el tope se calibra en el iPhone ([guía](../../../../docs/planes/T-034-performance-y-memoria.md#5-presupuestos-para-el-iphone-13)).
