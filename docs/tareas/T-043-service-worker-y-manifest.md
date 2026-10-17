---
id: T-043
titulo: Service worker, manifest y chunk vendor
tipo: codigo
hito: H5
estado: pendiente
prioridad: baja
depende: [T-039, T-018]
plan: null
---

## Qué

Un service worker escrito a mano (`public/sw.js`, unas 60 a 80 líneas, sin dependencias), el manifest de la web app (con el nombre del juego de T-018) y separar Phaser en un chunk *vendor*. Solo cuando el juego ya esté estable (RED-05).

## Por qué

Permite reabrir el juego sin red y esquivar el `max-age=600` de Pages. Sin service worker, separar Phaser en un chunk *vendor* no ahorra nada (RED-01). El riesgo clásico es servir una versión vieja para siempre, por eso va al final y con una estrategia de activación cuidadosa.

## Criterios de aceptación

- [ ] `public/sw.js` con scope `/trick-r-treat/`: HTML *network-first* con *fallback* a caché, `/assets/*` *cache-first*, activación en el siguiente arranque (sin `skipWaiting` automático) y caché por id de build (RED-05).
- [ ] Manifest de la web app en `public/`, con el nombre del juego y sus íconos.
- [ ] Phaser va en un chunk *vendor* aparte, y el presupuesto de bundle de T-036 sigue en verde (CAR-04).
- [ ] El aviso de versión nueva de T-039 sigue funcionando (RED-04).
- [ ] Pruebas: unitaria de la función pura `estrategia(url)`; e2e del registro del service worker (si Playwright WebKit lo soporta, que es 🔬; si no, se anota el porqué); manual en el iPhone (abrir desde la pantalla de inicio en modo avión → el juego abre; tras un deploy, la versión nueva se activa en el siguiente arranque y no a mitad de una partida).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034.
