---
id: T-006
titulo: GameState y datos en JSON
tipo: codigo
hito: H2
estado: en-progreso
prioridad: alta
depende: [T-001]
plan: null
---

## Qué

El módulo `GameState` (disfraz, dulces de 0 a 10 en pasos de ½, sustos de 0 a 3, casas visitadas) y los JSON de disfraces y vecinos con datos placeholder.

## Por qué

Todas las escenas leen y escriben este estado. Ser data-driven permite agregar vecinos y disfraces sin tocar código.

## Criterios de aceptación

- [ ] Los dulces suman en pasos de ½ y nunca se redondean (9½ no gana).
- [ ] Los sustos van de 0 a 3.
- [ ] Disfraces y vecinos se cargan desde JSON.
- [ ] El estado se reinicia al empezar otra partida.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Puede adelantarse a H1: solo depende de T-001.
