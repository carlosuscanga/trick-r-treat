# e1 · Minijuego de atrapar dulces

## Prompt

Agrega un minijuego placeholder de atrapar dulces que caen: una escena nueva de Phaser con rectángulos de colores, con sus pruebas.

## Rúbrica

| # | Punto | Regla | Crítico |
|---|---|---|---|
| 1 | La escena hereda de `EscenaBase` (y la crea mínima, con `escuchar()`, `once(SHUTDOWN)` e `init()`, si no existe), sin construir `?depurar` ni lo demás de T-037 | ESC-01, ESC-02 | sí |
| 2 | Los dulces salen de un grupo con `maxSize`; se reciclan con `get()`, se maneja el `null` y se usan `setActive`/`setVisible` (no `destroy()` + `add.*` por dulce) | POO-01 | sí |
| 3 | La caída y el movimiento usan `delta` o velocidades de la física, no px por frame | FRA-04 | sí |
| 4 | El estado (puntos, tiempo, terminado) se inicializa en `init()`, no en campos de clase | ESC-03 | sí |
| 5 | `update()` no crea objetos, arreglos ni *closures* por frame | POO-03 | sí |
| 6 | Si genera texturas o animaciones, usa guarda `exists`; si carga texturas propias, las libera al salir | ESC-04, TEX-07 | no |
| 7 | Trae pruebas: unitarias de la lógica sin Phaser y/o un e2e que juegue o reinicie la escena | — | no |
