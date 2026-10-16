---
id: T-024
titulo: Construir los minijuegos elegidos
tipo: codigo
hito: H4
estado: pendiente
prioridad: alta
depende: [T-009, T-013, T-023]
plan: null
---

## Qué

Tarea gruesa: al cerrar T-023 se parte en **una subtarea por minijuego**. Cada subtarea sigue el patrón de Lluvia de dulces: define lo mínimo, construye, afina jugando y documenta. Además trae su arte, sus sonidos y el disfraz de su tipo para Mi vo.

## Por qué

Llena la calle de variedad. Se parte después porque hoy no se sabe qué minijuegos entran.

## Criterios de aceptación

- [ ] Hay una subtarea creada por cada minijuego elegido.
- [ ] Cada minijuego cumple las reglas comunes de `minijuegos.md` (3 dificultades, de 45 a 90 s, ventaja de su tipo y `finished(won)`).
- [ ] Cada minijuego tiene su arte, sus sonidos y su disfraz.
- [ ] Cada definición final está en `docs/diseno/minijuegos.md`.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Decisión: definir y construir van en la misma tarea. Las subtareas son independientes entre sí y pueden ir en paralelo.
