---
id: T-010
titulo: Minijuego Lluvia de dulces
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-009]
plan: null
---

## Qué

Primer minijuego real (tipo Reflejos): mover la bolsa con el dedo para atrapar dulces y esquivar arañas. Arranca con lo que ya dice `minijuegos.md` y **se termina de definir al implementarlo**: los números de cada dificultad se afinan jugándolo. Arte placeholder; su arte llega en T-015.

## Por qué

Prueba el catálogo con un minijuego real y el arrastre táctil. Es el más simple de entender y su dificultad se ajusta con números.

## Criterios de aceptación

- [ ] Se registra en el catálogo y emite `finished(won)`.
- [ ] Las 3 dificultades se pueden jugar y se sienten distintas.
- [ ] Con la Gata negra todo cae 20% más lento.
- [ ] Dura de 45 a 90 s.
- [ ] Probado en el iPhone.
- [ ] La definición final (reglas y números) queda en `docs/diseno/minijuegos.md` y en `CAMBIOS.md`.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Decisión: no lleva tarea de diseño aparte; se define iterando al implementar.
