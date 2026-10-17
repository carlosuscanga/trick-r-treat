# e3 · Música en Arranque

## Prompt

Agrega música de fondo en bucle a la escena Arranque después del primer toque, con sus pruebas.

## Rúbrica

| # | Punto | Regla | Crítico |
|---|---|---|---|
| 1 | Una sola pista viva: al volver a entrar a la escena no se duplica (revisa si ya existe o la libera antes) | AUD-02, AUD-05 | sí |
| 2 | Al salir, la música se libera en dos pasos: `sound.removeByKey` (o `stop` + `destroy`) y `cache.audio.remove`, o justifica conservarla si es global | AUD-05 | sí |
| 3 | No usa `disableWebAudio` ni HTML5 Audio | AUD-01 | sí |
| 4 | Usa un `paraLoader` mínimo en `src/assets/` con la nota de T-039, o la convención actual (`public/audio/`, ruta sin `/` inicial) con esa nota; en ningún caso construye el aviso de versión nueva | RED-03 | sí |
| 5 | Los listeners globales de `sound` (por ejemplo, `UNLOCKED`) se quitan si la escena se apaga antes | ESC-01, ESC-06 | no |
| 6 | Menciona el formato: mono, bucle corto (≤ 90 s), AAC/m4a | AUD-02, AUD-04 | no |
| 7 | Trae pruebas: un e2e que comprueba que hay un solo sonido de música vivo tras reiniciar | — | no |
