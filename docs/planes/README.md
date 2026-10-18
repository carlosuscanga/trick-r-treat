# Planes de implementación

El *cómo* de una tarea: qué archivos se tocan, en qué orden y cómo se verifica cada paso. La tarea dice *qué* y *por qué*; el plan, *cómo*.

## Cuándo escribir un plan

- Sí: la tarea toca varios archivos, crea escenas o sistemas nuevos, o tiene decisiones técnicas que conviene revisar antes de programar.
- No: cambios pequeños de uno o dos pasos. La tarea basta.

## Convenciones

- Nombre: mismo ID que la tarea, `T-NNN-titulo-corto.md`.
- Al crear el plan, ponerlo en el campo `plan:` de la tarea (`docs/planes/T-NNN-titulo.md`) y correr `npm run tablero`. En `main` se ve hasta el merge.
- Si la implementación se desvía del plan, actualizar el plan. No debe quedar desfasado.
- **Todo plan de código incluye su sección "Pruebas", con tres capas.** Se definen en el plan, antes de programar, y entran en el mismo PR que el código:
  - **Unitarias** (`npm test`, Vitest): la lógica (estado, reglas, datos, catálogo, sorteos), en módulos sin Phaser.
  - **e2e** (`npm run test:e2e`, Playwright con WebKit): lo que se ve y se toca en el navegador, por ejemplo que una escena aparezca, que un toque haga algo o que un asset cargue con la base de Pages.
  - **Manual** en el iPhone: lo que solo se comprueba en el teléfono real (la sensación al tocar, el sonido, la pantalla de inicio). Va como tabla en la descripción del PR.
  - Si una capa no aplica (por ejemplo, un cambio solo del CI no tiene nada que tocar en el iPhone), el plan dice por qué. Nunca se deja una capa en blanco.
- **Todo plan incluye su sección "Modelo y esfuerzo"**: qué modelo hace cada paso o subagente, con qué esfuerzo y por qué. Ver la sección siguiente.

## Modelo y esfuerzo

Las tareas no pesan igual. Quien escribe el plan ya analizó la tarea a fondo, así que es quien mejor puede dimensionarla, como el *sizing* de un ticket. Por eso el plan dice, para cada paso o subagente:

- **Modelo:** Haiku, Sonnet, Opus o Fable, de menor a mayor capacidad y costo.
- **Esfuerzo:** `low`, `medium`, `high`, `xhigh` o `max`. Es cuánto razona el modelo antes de responder: más esfuerzo da mejores resultados en lo difícil, pero tarda más y gasta más del límite de uso.
- **Por qué:** una frase que justifique la elección.

Al aprobar el plan, el product owner aprueba también el modelo y el esfuerzo. Esa aprobación cuenta como instrucción explícita para lanzar cada subagente con ese modelo y ese esfuerzo (los parámetros `model` y `effort` de la herramienta Agent). Sin ella, los subagentes usan su configuración por defecto.

### Referencia por rol

El punto de partida. El plan se aparta de ella cuando un paso lo pide, y lo justifica.

| Rol | Modelo | Esfuerzo |
|---|---|---|
| Sesión principal (orquesta, planea, decide) | Opus | `high` |
| Subagentes que programan | Sonnet; Opus si es delicado (física, timing de audio) | según el plan |
| Revisión de código | Opus (`code-reviewer-opus55`) | `high` |
| Tareas mecánicas (tablero, docs, renombrar) | Haiku | `low` |
| Bloqueos o riesgo técnico muy alto | Fable, **solo sugerido** y justificado en el plan | según el plan |

### Cuándo sugerir Fable

Fable es el modelo más capaz y el más caro, así que nunca es la opción por defecto. El plan solo lo **sugiere**, con su porqué, y el product owner decide al aprobar. Casos típicos:

- Un bug que sigue atorado después de dos intentos de Opus.
- Un plan de riesgo técnico alto, como T-022.

### Durante la implementación

- Si un paso resulta más difícil de lo previsto (por ejemplo, Sonnet falla dos veces), se sube a Opus y se anota en la bitácora de la tarea. Pasar a Fable siempre se pregunta antes al product owner.
- Si resulta más fácil, se puede bajar de modelo o de esfuerzo, también con nota en la bitácora.
- Las tareas sin plan usan la tabla de referencia tal cual.

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
- Las pruebas no fijan los valores que se afinan jugando (velocidades, tiempos, alturas): la lógica se prueba con valores propios del test, y los e2e leen el JSON de ajustes. Si no, cada ajuste en el iPhone rompe el CI (retro de T-004).
- Manual en el iPhone: tabla de pasos con lo que se espera en cada uno. Va también en la descripción del PR.
- Capas que no aplican y por qué.

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Pasos 1–2 (subagente que programa) | Sonnet | `medium` | ... |
| Revisión del PR | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol. |

## Riesgos y dudas

- ...
```
