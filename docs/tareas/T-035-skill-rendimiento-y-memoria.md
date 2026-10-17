---
id: T-035
titulo: Crear el skill rendimiento-y-memoria y su regla por ruta
tipo: codigo
hito: H1
estado: hecha
prioridad: alta
depende: [T-034]
plan: docs/planes/T-035-skill-rendimiento-y-memoria.md
---

## Qué

Convertir la guía de T-034 (`docs/planes/T-034-performance-y-memoria.md`) en el skill del repo `.claude/skills/rendimiento-y-memoria/` y en la regla por ruta `.claude/rules/rendimiento.md`, tal como lo propone la sección 11 de la guía, que hace de especificación. Incluye correr las evaluaciones con y sin el skill. No cambia código del juego.

## Por qué

Las sesiones que programen T-004 en adelante tienen que cargar las reglas de memoria, frames y caché sin que nadie se lo pida. Por eso tiene que existir **antes de programar T-004**. La regla por ruta garantiza las 8 reglas que no se pueden saltar cada vez que se edita `src/`, aunque el skill no se active.

## Criterios de aceptación

- [x] `.claude/skills/rendimiento-y-memoria/SKILL.md` existe, con `name: rendimiento-y-memoria` (igual a la carpeta) y la `description` de la sección 11 de la guía (≤ 1024 caracteres, tercera persona, sin `<` ni `>`), sin `disable-model-invocation`.
- [x] `SKILL.md` tiene ≤ 250 líneas, lo crítico en los primeros ~5000 tokens, y las 8 secciones de la guía: contexto (Phaser 3.90, nunca v4), reglas no negociables con su ID, presupuestos con ✅/🔬, plantilla mínima de minijuego sobre `EscenaBase`, checklist de PR, cómo verificar, mapa de referencias y patrones descartados.
- [x] `references/` a un nivel, un archivo por tema (`escenas-y-fugas`, `texturas-y-gpu`, `audio`, `frames-y-tiempo`, `carga-y-cache`, `robustez`, `medir` y `fuentes`), con índice si pasan de 100 líneas, y cada regla enlaza a la guía para el porqué completo.
- [x] `.claude/rules/rendimiento.md` con `paths: ["src/**/*.ts"]`, de 10 a 15 líneas: ESC-01, ESC-02, ESC-03, TEX-07/AUD-05, POO-03, FRA-04, RED-03 y ROB-01, más "carga el skill `rendimiento-y-memoria` antes de escribir o revisar escenas".
- [x] Una línea en `CLAUDE.md` que apunta al skill, sin copiar reglas.
- [x] Solo APIs de Phaser 3.90: no se instalan ni se copian los skills oficiales de Phaser (son de Phaser 4).
- [x] Evaluaciones 1 a 5 de la sección 11 corridas con y sin el skill (worktrees desechables; Haiku, Sonnet y Opus), con el resultado en la bitácora. Con ellas se decide si el frontmatter lleva `paths` (hoy 🔬). *Alcance real: Sonnet completo (e0 a e4, con y sin); Opus solo en e0; Haiku no se corrió; activación solo con Sonnet. Ver bitácora del 2026-10-17.*
- [x] `claude plugin validate .claude/skills` pasa (evaluación 6).
- [x] Pruebas: las evaluaciones hacen el papel de pruebas. No aplican unitarias, e2e ni prueba manual en el iPhone, porque no cambia código del juego.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034 (secciones 11 y 12). Debe estar hecha antes de programar T-004.
- 2026-10-16: brainstorming y plan aprobados (revisados en Plannotator). Decisiones: T-004 crea una `EscenaBase` mínima que T-037 completa; en general, si falta infraestructura de otra tarea, se crea su base mínima ("mínima; T-0NN la completa") y no se refina; sección "Trampas conocidas → cómo probarlas"; evaluación 0 nueva (el plan de T-004); evaluaciones en Sonnet 5.5 y Opus 5.5, una corrida por celda (Haiku solo en activación); corridas `claude -p` con ediciones y npm, sin git, gh ni ssh; `paths` se decide en la evaluación de activación. Ejecución: nativa con subagentes puntuales. La tabla de modelos y esfuerzo se formaliza en T-045.
- 2026-10-17: evaluaciones corridas (`claude -p` en copias de `origin/main` sin material de T-035; calificación a ciegas por un subagente Opus). Respaldo local en `.local/t035/`.

  | Evaluación | Sonnet con skill | Sonnet sin skill | Opus con | Opus sin |
  |---|---|---|---|---|
  | e0 · plan de T-004 | 7/7 (4/4 críticos) | 6/7 (3/4) | 6/7 (4/4) | 6/7 (4/4) |
  | e1 · minijuego nuevo | 6/7 → 7/7 tras corregir la rúbrica (5/5) | 3/7 (1/5) | — | — |
  | e2 · corregir escena | 7/7 (4/4) | 4/7 (2/4) | — | — |
  | e3 · arreglar movimiento | 6/7 (4/4) | 4/7 (3/4) | — | — |
  | e4 · revisar un diff | 6/6 (6/6) | 6/6 (6/6) | — | — |

  - Con skill, Sonnet cumple 32/34 puntos y 22/23 críticos (33/34 y 23/23 tras corregir la rúbrica de e1; la celda e1 sin skill no cambia, porque no creó `?depurar`); sin skill, 23/34 y 15/23. La diferencia está en escribir código (e1 a e3): grupos con `maxSize`, estado en `init()`, nada nuevo en `update()`. En planear y revisar (e0, e4) casi no hay diferencia, porque el agente sin skill encuentra la guía de T-034 en el repo.
  - El skill se cargó en las 6 corridas que lo tenían.
  - e1 con skill falló el crítico 1 por crear una `?depurar` mínima. Era una contradicción del skill (la tabla de bases mínimas decía no construirla y tres referencias decían crear la mínima) y la rúbrica chocaba con la regla de bases mínimas. Decisión del product owner: la mínima de `?depurar` es solo exponer `window.__juego` para el e2e; se corrigieron el skill y la rúbrica, sin repetir la corrida.
  - Desvíos del plan: once celdas se cortaron por el límite de uso de la cuenta (corridas en paralelo). Para cuidar el uso, Opus quedó solo en e0 (pendiente opcional: e1 a e4) y Haiku no se corrió.
- 2026-10-17: activación (20 consultas, 10 deben activar y 10 no; Sonnet, modo plan, tope de 8 turnos):
  - Solo la `description`: 5/10 activaciones, 0/10 falsos positivos.
  - Con lo que entrega el PR (skill + regla + línea en `CLAUDE.md`): 7/10 y 0/10. Fallan el plan de T-004, revisar el PR de Puerta y el contador del minijuego: piden cosas que aún no existen en `main` y el agente agota los 8 turnos buscándolas (lectura, no comprobada). En las evaluaciones, sin tope, el plan de T-004 sí cargó el skill.
  - `paths` en el frontmatter: **no**. Es una decisión razonada, no medida (la variante `con-paths` no se corrió): sin falsos positivos no hace falta acotarlo, y limitarlo por archivos impediría cargarlo al planear o revisar.
  - Pendiente: volver a medir la activación cuando exista código real (después de T-004); si sigue por debajo de 8/10, ajustar la `description`.
- 2026-10-17: revisión final (Opus). Se corrigieron tres hallazgos importantes:
  - La liberación de texturas en `POST_STEP` borraba la textura en uso si el minijuego se reiniciaba con `scene.restart()`. Ahora solo borra si la escena sigue apagada. La guía de T-034 (TEX-07) tiene el mismo patrón: T-037 debe corregirla al construir `alLimpiar()`.
  - Quedaban cuatro referencias que mandaban crear el overlay de `?depurar`. Ahora todas dicen que es de T-037.
  - CAR-04 mandaba crear `test:presupuestos`. Ahora dice que es de T-036, igual que el `SKILL.md`.
  - Para T-037: `window.__juego`, la `?depurar` mínima, no está en la guía (que define `window.__depurar`). T-037 decide si lo absorbe o lo reemplaza.
- 2026-10-17: `verificar.py`, `claude plugin validate .claude/skills --strict` (sin advertencias), `npm test` (32/32), `npm run build` y `npm run test:e2e` (4/4) pasan.
- 2026-10-17: mergeada en el PR #10. Pendientes que siguen abiertos: volver a medir la activación después de T-004; T-037 corrige el `POST_STEP` de TEX-07 en la guía y decide sobre `window.__juego`.
