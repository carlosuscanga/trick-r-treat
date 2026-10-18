---
id: T-009
titulo: Catálogo de minijuegos y contrato
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-007]
plan: requerido
---

## Qué

El catálogo donde se registran los minijuegos con su tipo de reto, y el contrato común: cada minijuego recibe la dificultad y si el disfraz da ventaja, y emite `finished(won)`. La Puerta lanza el minijuego del vecino y espera el resultado. Incluye un minijuego falso ("ganar" / "perder") para probar el contrato. Necesita plan antes de programar.

## Por qué

Es la pieza que hace crecer la librería de minijuegos: agregar uno es registrarlo y nada más.

## Criterios de aceptación

- [ ] La Puerta no conoce ningún minijuego concreto, solo el catálogo.
- [ ] La ventaja se decide por tipo de reto y disfraz, no por minijuego.
- [ ] El minijuego falso funciona de punta a punta.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
