---
id: T-007
titulo: Flujo de escenas placeholder
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-004, T-006]
plan: null
---

## Qué

Todas las escenas con placeholders y conectadas: Menú → SelectorDisfraz → Calle → Puerta → minijuego → Resultado → Calle, y FinJuego → jugar otra vez. La Calle reutiliza los controles de T-004.

## Por qué

Es el esqueleto del bucle completo. Con él se puede recorrer el juego de punta a punta aunque todo sean cajas de colores.

## Criterios de aceptación

- [ ] Se puede pasar por todas las escenas del diagrama de `concepto.md`.
- [ ] Resultado muestra los dulces ganados o un susto placeholder.
- [ ] "Jugar otra vez" reinicia la partida.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
