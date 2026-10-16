---
id: T-011
titulo: HUD y fin de partida
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-008]
plan: null
---

## Qué

El HUD de la calle (dulces `6/10` y sustos `👻👻○`) y las reglas de fin: gana con 10 dulces; pierde con 3 sustos o si se acaban las casas.

## Por qué

Cierra el bucle: sin esto no hay partida, solo escenas.

## Criterios de aceptación

- [ ] El HUD muestra los medios dulces (por ejemplo, `6½/10`).
- [ ] Con 10 dulces se va a FinJuego como victoria.
- [ ] Con 3 sustos, o sin casas y menos de 10 dulces, se va a FinJuego como derrota.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
