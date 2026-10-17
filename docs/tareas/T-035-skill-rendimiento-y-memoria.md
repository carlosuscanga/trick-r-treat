---
id: T-035
titulo: Crear el skill rendimiento-y-memoria y su regla por ruta
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-034]
plan: docs/planes/T-035-skill-rendimiento-y-memoria.md
---

## Qué

Convertir la guía de T-034 (`docs/planes/T-034-performance-y-memoria.md`) en el skill del repo `.claude/skills/rendimiento-y-memoria/` y en la regla por ruta `.claude/rules/rendimiento.md`, tal como lo propone la sección 11 de la guía, que hace de especificación. Incluye correr las evaluaciones con y sin el skill. No cambia código del juego.

## Por qué

Las sesiones que programen T-004 en adelante tienen que cargar las reglas de memoria, frames y caché sin que nadie se lo pida. Por eso tiene que existir **antes de programar T-004**. La regla por ruta garantiza las 8 reglas que no se pueden saltar cada vez que se edita `src/`, aunque el skill no se active.

## Criterios de aceptación

- [ ] `.claude/skills/rendimiento-y-memoria/SKILL.md` existe, con `name: rendimiento-y-memoria` (igual a la carpeta) y la `description` de la sección 11 de la guía (≤ 1024 caracteres, tercera persona, sin `<` ni `>`), sin `disable-model-invocation`.
- [ ] `SKILL.md` tiene ≤ 250 líneas, lo crítico en los primeros ~5000 tokens, y las 8 secciones de la guía: contexto (Phaser 3.90, nunca v4), reglas no negociables con su ID, presupuestos con ✅/🔬, plantilla mínima de minijuego sobre `EscenaBase`, checklist de PR, cómo verificar, mapa de referencias y patrones descartados.
- [ ] `references/` a un nivel, un archivo por tema (`escenas-y-fugas`, `texturas-y-gpu`, `audio`, `frames-y-tiempo`, `carga-y-cache`, `robustez`, `medir` y `fuentes`), con índice si pasan de 100 líneas, y cada regla enlaza a la guía para el porqué completo.
- [ ] `.claude/rules/rendimiento.md` con `paths: ["src/**/*.ts"]`, de 10 a 15 líneas: ESC-01, ESC-02, ESC-03, TEX-07/AUD-05, POO-03, FRA-04, RED-03 y ROB-01, más "carga el skill `rendimiento-y-memoria` antes de escribir o revisar escenas".
- [ ] Una línea en `CLAUDE.md` que apunta al skill, sin copiar reglas.
- [ ] Solo APIs de Phaser 3.90: no se instalan ni se copian los skills oficiales de Phaser (son de Phaser 4).
- [ ] Evaluaciones 1 a 5 de la sección 11 corridas con y sin el skill (worktrees desechables; Haiku, Sonnet y Opus), con el resultado en la bitácora. Con ellas se decide si el frontmatter lleva `paths` (hoy 🔬).
- [ ] `claude plugin validate .claude/skills` pasa (evaluación 6).
- [ ] Pruebas: las evaluaciones hacen el papel de pruebas. No aplican unitarias, e2e ni prueba manual en el iPhone, porque no cambia código del juego.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034 (secciones 11 y 12). Debe estar hecha antes de programar T-004.
- 2026-10-16: brainstorming y plan aprobados (revisados en Plannotator). Decisiones: T-004 crea una `EscenaBase` mínima que T-037 completa; en general, si falta infraestructura de otra tarea, se crea su base mínima ("mínima; T-0NN la completa") y no se refina; sección "Trampas conocidas → cómo probarlas"; evaluación 0 nueva (el plan de T-004); evaluaciones en Sonnet 5.5 y Opus 5.5, una corrida por celda (Haiku solo en activación); corridas `claude -p` con ediciones y npm, sin git, gh ni ssh; `paths` se decide en la evaluación de activación. Ejecución: nativa con subagentes puntuales. La tabla de modelos y esfuerzo se formaliza en T-045.
