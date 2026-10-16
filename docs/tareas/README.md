# Tareas

Tablero del proyecto, como un Jira en markdown. Cada tarea es un archivo `T-NNN-titulo-corto.md` en esta carpeta. El proceso completo está en [`docs/README.md`](../README.md).

## Estado actual

Se actualiza al cerrar cada sesión. Es lo primero que se lee al retomar el trabajo.

- **Última sesión (2026-10-16):** entrevista de requerimientos terminada y diseño v0.2 cerrado (tag `diseno-v0.2`). Se definió la forma de trabajo (`docs/README.md`) y se decidió quedarse en Phaser 3.90.
- **Fase:** planeación, de requerimientos a hitos y tareas.
- **Siguiente paso:** definir los hitos y crear las primeras tareas. Propuesta inicial: una prueba técnica de controles en el iPhone y una investigación de minijuegos (WarioWare / Mario Party).
- **Pendiente de decidir:** cómo cortar el primer hito.

## Tablero

Sin tareas todavía.

<!-- Formato del tablero: una tabla por hito.

### Hito v0.1: Prototipo con placeholders

| ID | Tarea | Tipo | Estado | Plan |
|----|-------|------|--------|------|
| [T-001](T-001-ejemplo.md) | Ejemplo | codigo | pendiente | — |
-->

## Estados

- `pendiente`: aún no empieza.
- `en-progreso`: se está trabajando. Solo una a la vez.
- `bloqueada`: no puede avanzar. Anotar el motivo en la bitácora.
- `hecha`: cumple la definición de "hecho" de [`docs/README.md`](../README.md).

## Reglas

- El estado vive en el frontmatter del archivo **y** en el tablero. Al cambiarlo, actualizar ambos.
- Los archivos no se mueven ni se borran al terminar; solo cambia el estado.
- Una tarea grande se parte en subtareas con su propio ID.
- Los IDs son consecutivos y no se reutilizan.
- Si la tarea toca varios archivos o tiene decisiones técnicas, se escribe un plan en `docs/planes/` con el mismo ID antes de programar.

## Plantilla

```markdown
---
id: T-000
titulo: Título corto
tipo: diseno | codigo | arte | bug | investigacion
hito: v0.1
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
