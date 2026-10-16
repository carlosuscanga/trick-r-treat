# Planes de implementación

El *cómo* de una tarea: qué archivos se tocan, en qué orden y cómo se verifica cada paso. La tarea dice *qué* y *por qué*; el plan, *cómo*.

## Cuándo escribir un plan

- Sí: la tarea toca varios archivos, crea escenas o sistemas nuevos, o tiene decisiones técnicas que conviene revisar antes de programar.
- No: cambios pequeños de uno o dos pasos. La tarea basta.

## Convenciones

- Nombre: mismo ID que la tarea, `T-NNN-titulo-corto.md`.
- Al crear el plan, enlazarlo en el campo `plan:` de la tarea y en el tablero (`docs/tareas/README.md`).
- Si la implementación se desvía del plan, actualizar el plan. No debe quedar desfasado.

## Plantilla

```markdown
# Plan T-000: Título

Tarea: [T-000](../tareas/T-000-titulo.md)

## Enfoque

Resumen en 2–3 frases y decisiones técnicas con su porqué.

## Archivos

- Crear: `src/...`
- Modificar: `src/...`

## Pasos

1. Paso pequeño y verificable.
   - Verificar: cómo comprobar que funciona.

## Riesgos y dudas

- ...
```
