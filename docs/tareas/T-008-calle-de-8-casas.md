---
id: T-008
titulo: Calle de 8 casas con sorteo
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-007]
plan: null
---

## Qué

Generar la calle de cada partida: 8 casas con su dificultad (1, 2 o 3 dulces) y su minijuego sorteados, visibles antes de tocar. Cada casa se visita una sola vez y queda marcada.

## Por qué

Elegir casa es la decisión central de riesgo y recompensa del juego.

## Criterios de aceptación

- [ ] Cada casa muestra cuántos dulces da antes de tocar.
- [ ] Dos partidas seguidas generan calles distintas.
- [ ] La calle siempre tiene dulces suficientes para llegar a 10.
- [ ] Una casa visitada no se puede volver a tocar.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
- 2026-10-19: pendiente heredado de T-007: en la calle de prueba, la puerta 6 (x=3300) quedó dentro del bloque `casa` y no se alcanza jugando (desde un bloque alto ya no se entra). La calle de esta tarea debe poner cada puerta al frente de su casa, sobre la banqueta o el pavimento. Hay un intento sin verificar en el stash `t007-puerta6-wip-sin-verificar`. Idea del product owner: colores de casa según ganó o perdió (`docs/diseno/ideas.md`).
