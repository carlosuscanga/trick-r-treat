---
id: T-039
titulo: Assets versionados y aviso de versión nueva
tipo: codigo
hito: H2
estado: pendiente
prioridad: alta
depende: [T-034]
plan: null
---

## Qué

Mover los assets de `public/` a `src/assets/`, importarlos (con hash de Vite) y pasarlos al loader con `paraLoader`. Mostrar un aviso de "hay versión nueva" cuando un asset o chunk da 404 tras un deploy. Va **antes del primer arte** (T-013 a T-015).

## Por qué

Pages sirve todo con `max-age=600` y cambia el ETag en cada deploy. Un atlas (`.png` + `.json`) o un audio sprite en `public/` puede mezclar versiones en esa ventana; con hash, los dos cambian de nombre y llegan juntos. Y un 404 tras un deploy no debe colgar el juego (decisión 6 de la guía).

## Criterios de aceptación

- [ ] Los assets viven en `src/assets/` y se importan; `public/` queda solo para nombres fijos (manifest, íconos, `sw.js`) (RED-03). El audio de prueba actual se mueve también.
- [ ] `src/plataforma/assets.ts` exporta `paraLoader`, que quita la base para que Phaser no la anteponga dos veces (`/trick-r-treat//trick-r-treat/…`) (RED-03).
- [ ] `vite:preloadError` (con `preventDefault`) y el 404 de `FILE_LOAD_ERROR` muestran el aviso de versión nueva y permiten recargar, sin colgarse (RED-04).
- [ ] `CLAUDE.md` actualiza la convención de "Rutas de assets": assets en `src/assets/`, importados y pasados por `paraLoader` (decisión 6).
- [ ] Pruebas: unitarias de `paraLoader` (base `/trick-r-treat/`, `/` y `data:`) y de la lista blanca de `public/`; e2e de ninguna respuesta ≥ 400 al recorrer las escenas y de un 404 simulado con `page.route` → aviso visible; manual en el iPhone (en Pages, el audio de prueba suena tras el primer toque; con el juego abierto, mergear algo trivial y recargar o entrar a una escena → aviso).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Debe cerrar antes del primer arte (T-013, T-014 y T-015 dependen de ella).
