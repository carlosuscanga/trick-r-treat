---
id: T-004
titulo: Escalado en móvil y aviso de girar el teléfono
estado: pendiente
prioridad: alta
depende: [T-002]
plan: null
---

## Qué

Hacer que el juego se ajuste a cualquier pantalla y pida girar el teléfono cuando está en vertical.

## Por qué

Hoy el juego mide 1280×720 fijo, sin modo de escalado, y en el iPhone se ve cortado. El diseño pide orientación horizontal con aviso de girar.

## Criterios de aceptación

- [ ] Configuración `scale` de Phaser con `FIT` y centrado.
- [ ] En vertical se muestra un aviso de "gira tu teléfono"; en horizontal desaparece.
- [ ] Probado en el navegador con la vista de dispositivo móvil.

## Bitácora
