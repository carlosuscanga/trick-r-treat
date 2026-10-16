# Tareas

Tablero del proyecto, como un Jira en markdown. Cada tarea es un archivo `T-NNN-titulo-corto.md` en esta carpeta.

## Tablero

| ID | Tarea | Estado | Plan |
|----|-------|--------|------|
| [T-001](T-001-configurar-proyecto.md) | Configurar Vite, TypeScript y Phaser | hecha | — |
| [T-002](T-002-entorno-local.md) | Entorno local y limpieza de package.json | pendiente | — |
| [T-003](T-003-publicar-github-pages.md) | Publicar en GitHub Pages | pendiente | — |
| [T-004](T-004-escalado-movil.md) | Escalado en móvil y aviso de girar el teléfono | pendiente | — |
| [T-005](T-005-bucle-placeholders.md) | Bucle completo con placeholders | pendiente | — |
| [T-006](T-006-selector-disfraz.md) | Selector de disfraz con placeholders | pendiente | — |
| [T-007](T-007-personaje-caminando.md) | Personaje caminando con controles táctiles | pendiente | — |
| [T-008](T-008-prueba-iphone.md) | Prueba en iPhone | pendiente | — |
| [T-009](T-009-datos-contenido.md) | Datos de vecinos, ítems y disfraces | pendiente | — |
| [T-010](T-010-minijuegos.md) | Minijuegos reales | pendiente | — |
| [T-011](T-011-exploracion.md) | Exploración opcional | pendiente | — |
| [T-012](T-012-arte-y-sustos.md) | Arte final, animación cutout y sustos | pendiente | — |
| [T-013](T-013-audio-pulido.md) | Audio y pulido | pendiente | — |

## Estados

- `pendiente`: aún no empieza.
- `en-progreso`: se está trabajando. Idealmente solo una a la vez.
- `bloqueada`: no puede avanzar. Anotar el motivo en la bitácora.
- `hecha`: cumple todos los criterios de aceptación.

## Reglas

- El estado vive en el frontmatter del archivo **y** en el tablero de arriba. Al cambiarlo, actualizar ambos.
- Los archivos no se mueven ni se borran al terminar; solo cambia el estado.
- Una tarea grande (por ejemplo T-010) se parte en subtareas nuevas con su propio ID cuando llegue su turno.
- Los commits mencionan el ID: `T-003: añade workflow de GitHub Pages`.
- Si la tarea necesita varios pasos o tocar varios archivos, se escribe un plan en `docs/planes/` con el mismo ID antes de programar.

## Plantilla

```markdown
---
id: T-000
titulo: Título corto
estado: pendiente
prioridad: alta | media | baja
depende: []
plan: null
---

## Qué

Qué hay que hacer.

## Por qué

Para qué sirve o qué problema resuelve.

## Criterios de aceptación

- [ ] Algo verificable.

## Bitácora

- AAAA-MM-DD: notas, decisiones y bloqueos.
```
