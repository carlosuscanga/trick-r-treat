# Planes de implementación

El *cómo* de una tarea: qué archivos se tocan, en qué orden y cómo se verifica cada paso. La tarea dice *qué* y *por qué*; el plan, *cómo*.

## Cuándo escribir un plan

- Sí: la tarea toca varios archivos, crea escenas o sistemas nuevos, o tiene decisiones técnicas que conviene revisar antes de programar.
- No: cambios pequeños de uno o dos pasos. La tarea basta.

## Convenciones

- Nombre: mismo ID que la tarea, `T-NNN-titulo-corto.md`.
- Al crear el plan, enlazarlo en el campo `plan:` de la tarea y en el tablero (`docs/tareas/README.md`).
- Si la implementación se desvía del plan, actualizar el plan. No debe quedar desfasado.
- **Todo plan de código incluye su sección "Pruebas", con tres capas.** Se definen en el plan, antes de programar, y entran en el mismo PR que el código:
  - **Unitarias** (`npm test`, Vitest): la lógica (estado, reglas, datos, catálogo, sorteos), en módulos sin Phaser.
  - **e2e** (`npm run test:e2e`, Playwright con WebKit): lo que se ve y se toca en el navegador, por ejemplo que una escena aparezca, que un toque haga algo o que un asset cargue con la base de Pages.
  - **Manual** en el iPhone: lo que solo se comprueba en el teléfono real (la sensación al tocar, el sonido, la pantalla de inicio). Va como tabla en la descripción del PR.
  - Si una capa no aplica (por ejemplo, un cambio solo del CI no tiene nada que tocar en el iPhone), el plan dice por qué. Nunca se deja una capa en blanco.

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

- Unitarias (`npm test`): qué casos cubren y en qué archivo `*.test.ts` van.
- e2e (`npm run test:e2e`): qué comportamiento comprueban y en qué archivo `e2e/*.e2e.ts` van.
- Manual en el iPhone: tabla de pasos con lo que se espera en cada uno. Va también en la descripción del PR.
- Capas que no aplican y por qué.

## Riesgos y dudas

- ...
```
