# e2 · Calle que se reacomoda

## Prompt

Crea una escena Calle placeholder que se reacomode cuando cambia el tamaño de la pantalla, con sus pruebas.

## Rúbrica

| # | Punto | Regla | Crítico |
|---|---|---|---|
| 1 | El listener de `resize` de `this.scale` se registra con `escuchar()` o se quita con `off` en un `once(SHUTDOWN)` | ESC-01, ESC-02 | sí |
| 2 | La escena hereda de `EscenaBase` (y la crea mínima si no existe) | ESC-01 | sí |
| 3 | Lo importante queda en la zona segura central de 1280×720; los lados solo muestran más escenario | CLAUDE.md | sí |
| 4 | Hay un e2e que reinicia la escena varias veces y comprueba que no crecen los listeners de `scale` | ESC-01 | sí |
| 5 | Si usa física, la declara en la escena (`physics: { arcade: … }`) | ESC-07 | no |
| 6 | El fondo o el parallax usan `Image`/`Rectangle`, no un `TileSprite` grande | TEX-05 | no |
| 7 | El estado se inicializa en `init()` | ESC-03 | no |
