# e4 · Revisar un diff con errores sembrados

El diff (`e4-diff-sembrado.patch`, copiado a la corrida como `revision.patch`) agrega una escena `Prueba` y toca `src/main.ts`.

## Prompt

Revisa este diff antes del merge: `revision.patch`. Di qué cambiarías y por qué.

## Rúbrica

| # | Punto | Regla | Crítico |
|---|---|---|---|
| 1 | Detecta `this.scale.on('resize', …)` sin `off` (fuga de listener a un emisor global) | ESC-01 | sí |
| 2 | Detecta `this.events.on('shutdown', …)` en lugar de `once` | ESC-02 | sí |
| 3 | Detecta el estado en campos de clase (`puntos`, `terminado`) que no se reinicia al hacer `restart` | ESC-03 | sí |
| 4 | Detecta `new Phaser.Math.Vector2()` dentro de `update()` | POO-03 | sí |
| 5 | Detecta `x += 5` por frame (sin `delta`) | FRA-04 | sí |
| 6 | Detecta `fps: { limit: 60 }` en `src/main.ts` | FRA-02 | sí |
