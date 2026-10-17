---
id: T-017
titulo: Música y sonidos
tipo: codigo
hito: H3
estado: pendiente
prioridad: media
depende: [T-003]
plan: null
---

## Qué

Conseguir música y sonidos libres de derechos (o propios), comprimirlos e integrarlos: calle, botones, dulces, sustos y Lluvia de dulces. Los minijuegos de H4 traen sus propios sonidos.

## Por qué

El repo y la página son públicos: todo el audio debe poder publicarse. El audio comprimido mantiene el juego ligero.

## Criterios de aceptación

- [ ] La fuente y la licencia de cada audio están anotadas.
- [ ] Hay música en la calle y sonidos en botones, dulces y sustos.
- [ ] Suena en el iPhone después del primer toque.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Puede adelantarse desde H1: solo depende de T-003.
- 2026-10-16: el aviso de silencio será un ícono de bocina silenciada, mostrado como recordatorio breve en "toca para empezar" (con una nota de "sube el volumen"). Se respeta el interruptor de silencio, pero iOS no expone su estado a la web, así que el ícono no puede aparecer solo cuando hay silencio. Decisión 4 de la guía de T-034; el diseño final del ícono va en esta tarea.
