---
id: T-005
titulo: Bucle completo con placeholders
estado: pendiente
prioridad: alta
depende: [T-004]
plan: null
---

## Qué

Bucle jugable de principio a fin con figuras simples: calle con puertas, minijuego falso con botones Ganar y Perder, contadores de dulces y sustos, y pantallas de victoria y derrota.

## Por qué

Valida las reglas y la arquitectura (estado global, escenas y la señal `finished`) antes de invertir en arte o en minijuegos reales.

## Criterios de aceptación

- [ ] Escenas Menú, Calle, Puerta, Minijuego falso, Resultado y FinJuego conectadas.
- [ ] `GameState` lleva dulces (0/5), sustos (0/3) y casas visitadas.
- [ ] El minijuego falso solo se comunica emitiendo `finished(won)`.
- [ ] Una casa visitada no se puede volver a visitar.
- [ ] 5 dulces lleva a victoria y 3 sustos a derrota.
- [ ] Se puede volver a jugar desde el final.

## Bitácora
