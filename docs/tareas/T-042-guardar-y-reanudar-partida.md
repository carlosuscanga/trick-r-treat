---
id: T-042
titulo: Guardar y reanudar la partida
tipo: codigo
hito: H3
estado: pendiente
prioridad: media
depende: [T-007]
plan: null
---

## Qué

Guardar el `GameState` (disfraz, dulces, sustos y casas visitadas) en `localStorage` en puntos seguros, como al salir de cada casa, y al abrir el juego ofrecer "Continuar" si hay una partida guardada (ROB-03, decisión 2 de la guía de T-034).

## Por qué

Una partida dura de 10 a 15 minutos. Si iOS mata la pestaña por memoria (jetsam), Safari la recarga sin avisar y Mi vo perdería la partida. Es más ligero de lo que suena: el estado es un JSON chico. **Cambia el diseño v0.2**, que hoy no contempla guardar.

## Criterios de aceptación

- [ ] El cambio de diseño se registra en `docs/diseno/` y en `CAMBIOS.md`, avisando antes de programar.
- [ ] Un módulo en `src/estado/`, sin Phaser, serializa `{ v: 1, disfrazId, medios, sustos, visitadas, guardadoEn }` (dulces en medios, sin redondear) al entrar a la Calle y al aplicar el resultado de una casa; nunca a mitad de un minijuego (ROB-03).
- [ ] Al abrir, se ofrece "Continuar" si hay una partida reciente y compatible; una versión distinta o una partida caducada se descarta.
- [ ] Todo acceso a `localStorage` va con `try/catch`: si falla, el juego sigue sin guardar.
- [ ] Se tiene en cuenta que Safari y la pantalla de inicio tienen almacenamientos separados (RED-06): lo guardado en uno no se ve en el otro.
- [ ] Pruebas: unitarias (ida y vuelta, versión distinta o caducada se descarta, `localStorage` que lanza error no truena); e2e (`page.reload()` a mitad de la partida → "Continuar" con el mismo estado); manual en el iPhone (desde la pantalla de inicio, cerrar la app a la fuerza tras una casa y reabrir → "Continuar" con los mismos dulces y casas).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. El product owner la aceptó en H3 por el riesgo de jetsam (decisión 2).
