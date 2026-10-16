---
id: T-003
titulo: Pantalla base para iPhone
tipo: codigo
hito: H1
estado: pendiente
prioridad: alta
depende: [T-001]
plan: null
---

## Qué

Reemplazar la escena `SmokeTest` por la configuración base del juego:

- Modo de escala `FIT` en horizontal.
- Aviso de "gira tu teléfono" cuando está en vertical.
- El audio se desbloquea con el primer toque (requisito de iOS).

## Por qué

Son restricciones de la plataforma que todo lo demás da por hechas. Si fallan, fallan todas las escenas.

## Criterios de aceptación

- [ ] `SmokeTest` ya no existe.
- [ ] En el iPhone en horizontal, el juego ocupa la pantalla sin deformarse.
- [ ] En vertical aparece el aviso de girar, y al girar desaparece.
- [ ] Después del primer toque suena un sonido de prueba en el iPhone.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
