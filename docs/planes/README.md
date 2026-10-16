# Planes de implementación

El *cómo* de una tarea: qué archivos se tocan, en qué orden y cómo se verifica cada paso. La tarea dice *qué* y *por qué*; el plan, *cómo*.

## Cuándo escribir un plan

- Sí: la tarea toca varios archivos, crea escenas o sistemas nuevos, o tiene decisiones técnicas que conviene revisar antes de programar.
- No: cambios pequeños de uno o dos pasos. La tarea basta.

## Convenciones

- Nombre: mismo ID que la tarea, `T-NNN-titulo-corto.md`.
- Al crear el plan, enlazarlo en el campo `plan:` de la tarea y en el tablero (`docs/tareas/README.md`).
- Si la implementación se desvía del plan, actualizar el plan. No debe quedar desfasado.
- **Todo plan de código incluye su sección "Pruebas".** La lógica (estado, reglas, datos, catálogo, sorteos) lleva tests automáticos con `npm test`, que se escriben junto con el código y entran en el mismo PR. Lo que no se puede probar en automático (escenas, toques, sonido, el iPhone) lleva una lista de pasos de prueba manual. Si algo queda sin probar, el plan dice por qué.

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

## Pruebas

- Automáticas (`npm test`): qué casos cubren los tests y en qué archivo van.
- Manuales: qué se prueba a mano, en el navegador o en el iPhone, y cómo.

## Riesgos y dudas

- ...
```
