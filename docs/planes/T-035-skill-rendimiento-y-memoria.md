# Plan T-035: Skill `rendimiento-y-memoria` y su regla por ruta

Tarea: [T-035](../tareas/T-035-skill-rendimiento-y-memoria.md)

## Diseño

Acordado en el brainstorming del 2026-10-16. La especificación base es la **sección 11 de la guía de T-034** (`docs/planes/T-034-performance-y-memoria.md`): nombre, `description`, frontmatter, las 8 secciones de `SKILL.md`, los archivos de `references/`, la regla por ruta y las 6 evaluaciones. Lo que sigue son **los cambios y agregados** a esa especificación. Donde este documento no dice nada, manda la sección 11.

### Intención

Que toda sesión que programe, planee o revise escenas desde T-004 aplique las reglas de memoria, frames y caché de la guía **sin que nadie se lo pida**. El objetivo del product owner para el juego es que Mi vo responda al joystick y a los botones, que se mueva suave, que no se bugee y que se cubran los edge cases. El skill aporta a eso: hace que el agente escriba el código que no se rompe al reiniciar escenas, que va a la misma velocidad a 60 y a 120 Hz, y que libera lo que carga.

**Criterio de éxito:** el plan de T-004 incluye, por sí solo, las pruebas de las trampas conocidas que le aplican (por ejemplo, "reiniciar la escena 10 veces y que no se dupliquen los listeners"). Las evaluaciones miden justo eso: la diferencia entre trabajar con el skill y sin él.

### Metas

1. Crear `.claude/skills/rendimiento-y-memoria/` (`SKILL.md` + `references/`), `.claude/rules/rendimiento.md` y una línea en `CLAUDE.md`, como dice la sección 11 y con los cambios de abajo.
2. Correr las evaluaciones y decidir, con sus resultados, si el frontmatter lleva `paths`.

### No metas

- No cambia código del juego (`src/`). En particular, **no se crea `EscenaBase`**: el skill trae la plantilla, y la clase la crea T-004.
- No se instalan ni se copian los skills oficiales de Phaser (son de Phaser 4).
- No se define aquí la tabla de modelos y esfuerzo por paso (eso es T-045).

### Anti-metas (sería un fracaso aunque funcione)

- Que el skill le diga al agente que use algo que todavía no existe (`EscenaBase`, `paraLoader`, `?depurar`, `test:presupuestos`) sin decirle qué hacer mientras tanto.
- Que copie la guía entera. El skill es la versión accionable: receta de una línea más enlace al porqué.
- Que se active en tareas que no tocan escenas (el tablero, el diseño de un vecino) y gaste contexto.
- Que use cualquier API de Phaser 4.

### Cambios a la sección 11 (decisiones del product owner)

1. **`EscenaBase` mínima en dos niveles.** El skill trae una plantilla mínima de `EscenaBase` con `escuchar()`, la limpieza con `once(SHUTDOWN)` y el estado en `init()` (ESC-01, ESC-02 y ESC-03). La regla para el agente es:
   - Si `src/escenas/EscenaBase.ts` **no existe**, la crea con esa plantilla y un comentario "mínima; T-037 la completa".
   - Si **ya existe**, la usa y no la reescribe. Cambiarla es trabajo de T-037.

   T-037 la completa después (`alLimpiar()`, `this.data.reset()`, `?depurar` y el e2e de fugas). Ya está anotado en T-004 y T-037.
2. **"Trampas conocidas → cómo probarlas"** reemplaza el "Cómo verificar" genérico de la sección 11 (punto 6 de `SKILL.md`). Es una tabla con los edge cases que encontró la investigación. Cada fila dice la trampa, el síntoma que vería un jugador, la regla y la capa de prueba (unitaria, e2e o manual en el iPhone), con la prueba concreta. Mínimo estas:

   | Trampa | Síntoma | Regla |
   |---|---|---|
   | Reiniciar la escena duplica listeners | doble salto, joystick que responde dos veces | ESC-01, ESC-02 |
   | El estado sobrevive al reinicio (Phaser reusa la instancia) | el segundo intento no empieza en 0 | ESC-03 |
   | `delta` recortado 120 frames al volver del segundo plano | cámara lenta al regresar a la app | FRA-03 |
   | Movimiento por frame, sin `delta` | al doble de velocidad a 120 Hz (ProMotion) | FRA-04 |
   | El sonido en bucle sigue tras parar la escena | música del minijuego en la Calle | AUD-05 |
   | `group.get()` recicla pero no muestra | dulces invisibles o que no caen | POO-01 |
   | Claves de animación globales | se acumulan en cada `create()` | ESC-04 |
   | Pérdida del contexto WebGL | pantalla negra al volver | ROB-01 |
   | `fps.limit` | 38–48 updates/s en lugar de 60 | FRA-02 |

3. **Evaluaciones con los modelos que de verdad van a programar.** Las evaluaciones 0 a 4 corren con **Sonnet 5.5 y Opus 5.5**, con y sin el skill: 5 × 2 × 2 = **20 corridas**, **una por celda**. Haiku 5.5 entra solo en la evaluación 5 (activación), que es barata. Haiku no va a escribir escenas, y si algún día toca `src/`, la regla por ruta lo cubre. Fable queda fuera.
4. **Evaluación 0 nueva: "Escribe el plan de T-004".** Mide directo el criterio de éxito: si el plan incluye por sí solo las pruebas de las trampas que le aplican (listeners al reiniciar, estado en `init`, `delta`, la `EscenaBase` mínima). Las evaluaciones 1 a 3 siguen pidiendo código, para que también se pruebe la regla por ruta, que solo se carga al editar `src/`.
5. **Permisos de las corridas** (los autorizó el product owner): sesiones `claude -p` con ediciones aceptadas solas (`--permission-mode acceptEdits`), `npm` permitido, y `git commit`, `git push`, `gh` y `ssh` bloqueados (`--disallowedTools`). Cargan la configuración global (superpowers y demás) para parecerse a una sesión real, con la instrucción agregada "modo evaluación: no hagas preguntas ni commits; si te falta información, decide y anota el supuesto". Corren en worktrees desechables que se borran al terminar.
6. **Repeticiones y umbral** (los decidió el product owner): una corrida por celda. Si una celda **con** el skill no cumple todas las trampas de su rúbrica que le aplican, primero se repite esa celda una vez, para no reaccionar al ruido. Solo si vuelve a fallar se ajusta el skill.

### Restricciones

- Las de la sección 11: `name` igual a la carpeta y con el patrón `^[a-z0-9-]+$`; `description` de ≤ 1024 caracteres, en tercera persona y sin `<` ni `>`; sin `disable-model-invocation`; `SKILL.md` de ≤ 250 líneas, con lo crítico en los primeros ~5000 tokens; `references/` a un nivel, con índice en los archivos de más de 100 líneas; la regla por ruta, de 10 a 15 líneas.
- Solo APIs de Phaser 3.90.
- Las reglas citan su ID y enlazan a la guía para el porqué. No duplicar explicaciones largas.
- Está en una rama de tarea: no se tocan el tablero ni el "Estado actual".

### Decisiones mías (las puede revisar el product owner)

- **Reglas que dependen de infraestructura futura.** Cada regla que necesita algo que aún no existe (`paraLoader` de T-039, `?depurar` y el e2e de fugas de T-037, `test:presupuestos` de T-036, la config de T-038) lleva una línea "si todavía no existe:" con qué hacer mientras tanto. El criterio general: **seguir con la convención actual, con un placeholder, y dejar la nota "esto lo resuelve T-0NN"**, sin detenerse y sin construir la infraestructura de otra tarea. Por ejemplo: "si no existe `src/assets/` + `paraLoader`, carga el audio como hoy (`public/audio/`, ruta sin `/` inicial) y deja la nota 'migrar con T-039'". Va con la regla de "lo jugable con placeholders va antes que el arte". La única excepción es `EscenaBase`, que sí se crea (cambio 1). Así se cumple la primera anti-meta. Las rúbricas califican así: aplicar las reglas y dejar la nota suma puntos; detenerse sin programar no.
- **Las evaluaciones parten de `main` tal cual**, sin un repo sembrado. Los prompts se ajustan a lo que existe hoy. Por ejemplo, la evaluación 2 queda como "crea una escena Calle placeholder que se reacomode al cambiar el tamaño", porque la Calle todavía no existe.
- **Cómo se decide `paths`:** en la evaluación 5, la de activación, se comparan dos variantes del skill: sin `paths` y con `paths: ["src/**", "docs/planes/**"]`. Si `paths` le quita activaciones a consultas legítimas, sobre todo al escribir un plan, no se pone. Solo se pone si sin él hay muchas activaciones falsas y con él bajan sin perder las legítimas.
- **Idioma:** el skill va en español, como la guía. Los identificadores de código quedan en inglés.
- **Cómo se corren las evaluaciones:** cada corrida es una sesión nueva de `claude -p` (no interactiva), con `--model`, dentro de un worktree desechable. **Sin el skill:** un worktree de `main` actual (sin skill, sin regla y sin la línea en `CLAUDE.md`). **Con el skill:** un worktree de esta rama. Las sesiones nuevas reproducen mejor la situación real que un subagente, porque cargan el `CLAUDE.md` y los skills del proyecto igual que una sesión de verdad. Las corridas se lanzan en paralelo con subagentes.
- **Cómo se califican:** cada evaluación tiene una rúbrica de 4 a 6 puntos verificables, sacada de las reglas que debería aplicar (por ejemplo, para la evaluación 2: "usa `escuchar()` o `once(SHUTDOWN)` para quitar el listener de `resize`"). Califica un subagente Opus 5.5 que no sabe qué corrida tenía el skill, y el resultado es un puntaje por corrida. La evaluación 4 usa un diff sembrado en `docs/planes/T-035-evaluaciones/` con una fuga de listener y un `fps.limit`.
- **Evaluación 5 (activación):** 20 consultas en español (10 que deben activar el skill y 10 casi aciertos que no), con las herramientas de evaluación del skill `skill-creator`. Si la tasa es mala, se ajusta la `description` y se repite.
- **Dónde quedan los resultados:** el resumen (tabla de puntajes con y sin skill, la decisión de `paths` y lo que se ajustó) va en la bitácora de T-035. Los prompts, las rúbricas y el diff sembrado se versionan en `docs/planes/T-035-evaluaciones/`, para repetirlas cuando cambie el skill. Las salidas crudas van a `.local/t035/`, sin respaldo, como en T-034.
- **Si el skill no mejora el resultado** en alguna evaluación (después de repetir la celda, cambio 6), se ajusta (lo más probable es mover la regla al principio de `SKILL.md` o a la regla por ruta) y se vuelve a correr esa evaluación. Máximo 2 rondas; si sigue sin mejorar, se anota en la bitácora y se decide con el product owner.

### Lo que queda al constructor

- La redacción exacta de `SKILL.md` y de cada `references/*.md`, dentro de los límites de arriba.
- Qué parte de la plantilla de `EscenaBase` va en `SKILL.md` y cuál en `references/escenas-y-fugas.md`.
- El texto de las rúbricas y de las 20 consultas de activación.
- El orden de los commits.

## Pruebas

Esta tarea no cambia código del juego, así que las **evaluaciones hacen el papel de pruebas**:

- Unitarias: no aplican. No hay lógica nueva en `src/`.
- e2e: no aplican. No cambia nada que se vea en el navegador.
- Manual en el iPhone: no aplica. No cambia el juego.
- En su lugar: la evaluación 0 (el plan de T-004) y las evaluaciones 1 a 6 de la sección 11, con los cambios de arriba. `npm test`, `npm run test:e2e` y `npm run build` deben seguir en verde, para comprobar que no se tocó nada del juego.

## Pasos

Se escriben con `superpowers:writing-plans` después de aprobar el diseño.
