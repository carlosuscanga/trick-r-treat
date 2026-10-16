---
id: T-009
titulo: Datos de vecinos, ítems y disfraces
estado: pendiente
prioridad: media
depende: [T-005, T-006]
plan: null
---

## Qué

Definir vecinos, ítems y disfraces en archivos JSON y cargarlos en el juego, en lugar de escribirlos en el código.

## Por qué

Así se agrega o ajusta contenido sin tocar la lógica (contenido data-driven).

## Criterios de aceptación

- [ ] JSON de vecinos (nombre, casa, minijuego, recompensa, requisito opcional, susto), de ítems y de disfraces.
- [ ] Tipos de TypeScript que validan esos datos.
- [ ] La calle y el selector se construyen a partir de los JSON.

## Bitácora
