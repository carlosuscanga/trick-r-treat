---
id: T-032
titulo: Tutorial para añadir el juego a la pantalla de inicio
tipo: codigo
hito: H3
estado: pendiente
prioridad: baja
depende: [T-003, T-018]
plan: null
---

## Qué

Cuando el juego se abre en Safari y no desde el ícono de la pantalla de inicio, mostrar un tutorial corto que enseñe a añadirlo. El tutorial usa ilustraciones propias que marcan dónde tocar en Safari de iOS 26 o superior.

Incluye también lo que hace falta para que el ícono se vea bien: el ícono del juego y el *manifest* (nombre, colores y orientación horizontal).

## Por qué

Safari en iPhone no deja esconder su barra, así que en el navegador el juego se ve con franjas y con la barra encima. Abierto desde el ícono, llena la pantalla sin barras, como una app (comprobado en T-003). Mi vo no tiene por qué saber cómo se añade a la pantalla de inicio.

## Criterios de aceptación

- [ ] En Safari, fuera del modo pantalla de inicio, aparece el tutorial, y se puede cerrar para jugar igual.
- [ ] Abierto desde el ícono, el tutorial no aparece.
- [ ] Las ilustraciones son propias (sin capturas ni marcas de terceros) y marcan los toques correctos en Safari de iOS 26 o superior.
- [ ] El ícono y el nombre se ven bien en la pantalla de inicio del iPhone.
- [ ] Probado en el iPhone, en los dos casos (Safari y pantalla de inicio).

## Bitácora

- 2026-10-16: creada a pedido del product owner, a partir de lo que encontró T-003 en el iPhone. Se detecta con `navigator.standalone`. El nombre que aparece bajo el ícono depende de T-018. El diseño ya contempla la pantalla de inicio (`docs/diseno/concepto.md`). Cuando el tutorial exista, se describe en el diseño y se registra en `CAMBIOS.md`.
- 2026-10-16: el product owner la deja en prioridad **baja**. No es necesaria para la demo: se tiene en cuenta, pero no bloquea T-020.
