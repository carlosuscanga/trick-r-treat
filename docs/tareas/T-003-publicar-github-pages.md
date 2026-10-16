---
id: T-003
titulo: Publicar en GitHub Pages
estado: pendiente
prioridad: alta
depende: [T-002]
plan: null
---

## Qué

Publicar el juego en GitHub Pages automáticamente con cada push a `main`.

## Por qué

El diseño pide publicar desde el primer día para poder probar en el iPhone solo abriendo un link.

## Criterios de aceptación

- [ ] `vite.config.ts` con `base: '/trick-r-treat/'` (si no, los assets dan 404 en Pages).
- [ ] Workflow de GitHub Actions que construye y publica `dist/`.
- [ ] El juego abre en `https://carlosuscanga.github.io/trick-r-treat/`.

## Bitácora
