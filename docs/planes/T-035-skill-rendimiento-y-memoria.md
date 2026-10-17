# Plan T-035: Skill `rendimiento-y-memoria` y su regla por ruta

Tarea: [T-035](../tareas/T-035-skill-rendimiento-y-memoria.md)

## Diseño

Acordado en el brainstorming del 2026-10-16. La especificación base es la **sección 11 de la guía de T-034** (`docs/planes/T-034-performance-y-memoria.md`): nombre, `description`, frontmatter, las 8 secciones de `SKILL.md`, los archivos de `references/`, la regla por ruta y las 6 evaluaciones. Lo que sigue son **los cambios y agregados** a esa especificación. Donde este documento no dice nada, manda la sección 11.

### Intención

Que toda sesión que programe, planee o revise escenas desde T-004 aplique las reglas de memoria, frames y caché de la guía **sin que nadie se lo pida**. Entre los objetivos del product owner para el juego están que Mi vo responda al joystick y a los botones, que se mueva suave, que no se bugee y que se cubran los edge cases, y todos dependen del rendimiento. El skill aporta a eso: hace que el agente escriba el código que no se rompe al reiniciar escenas, que va a la misma velocidad a 60 y a 120 Hz, y que libera lo que carga.

**Criterio de éxito:** el plan de T-004 incluye, por sí solo, las pruebas de las trampas conocidas que le aplican (por ejemplo, "reiniciar la escena 10 veces y que no se dupliquen los listeners"). Las evaluaciones miden justo eso: la diferencia entre trabajar con el skill y sin él.

### Metas

1. Crear `.claude/skills/rendimiento-y-memoria/` (`SKILL.md` + `references/`), `.claude/rules/rendimiento.md` y una línea en `CLAUDE.md`, como dice la sección 11 y con los cambios de abajo.
2. Correr las evaluaciones y decidir, con sus resultados, si el frontmatter lleva `paths`.

### No metas

- No cambia código del juego (`src/`). En particular, **no se crea `EscenaBase`**: el skill trae la plantilla, y la clase la crea T-004.
- No se instalan ni se copian los skills oficiales de Phaser (son de Phaser 4).
- No se define aquí la tabla de modelos y esfuerzo por paso (eso es T-045).

### Anti-metas (sería un fracaso aunque funcione)

- Que el skill le diga al agente que use algo que todavía no existe (`EscenaBase`, `paraLoader`, `?depurar`, `test:presupuestos`) sin decirle qué hacer mientras tanto, o que el agente termine construyendo completa la infraestructura de otra tarea.
- Que copie la guía entera. El skill es la versión accionable: receta de una línea más enlace al porqué.
- Que se active cuando no hace falta. Cuando un skill se activa, todo su `SKILL.md` entra en la memoria de trabajo (el contexto) del agente. Si se carga al actualizar el tablero o al escribir el diseño de un vecino, gasta límite de uso y le mete al agente reglas de Phaser que no vienen al caso. Por eso la evaluación 5 incluye casi aciertos que **no** deben activarlo.
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

- **Reglas que dependen de infraestructura futura.** Cada regla que necesita algo que aún no existe (`paraLoader` de T-039, `?depurar` y el e2e de fugas de T-037, `test:presupuestos` de T-036, la config de T-038) lleva una línea "si todavía no existe:" con qué hacer mientras tanto. El criterio general (corregido por el product owner): **si la tarea lo necesita, se crea la base mínima de eso que falta, con un comentario "mínima; T-0NN la completa", y no se refina hasta que llegue su tarea.** Es el mismo trato que `EscenaBase` (cambio 1). Por ejemplo: "si no existe `paraLoader`, crea la función mínima en `src/assets/` con un comentario 'T-039 la completa' y úsala; el aviso de versión nueva y lo demás de T-039 no se hacen aquí". Si la tarea no lo necesita, no se crea nada. Y si la base ya existe, se usa y no se reescribe. Así se cumple la primera anti-meta. Las rúbricas califican así: aplicar las reglas con la base mínima suma puntos; detenerse sin programar no suma, y refinar la base de otra tarea resta.
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

> **Para agentes:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` tarea por tarea. Los pasos usan casillas (`- [ ]`).

**Meta:** el skill `rendimiento-y-memoria`, su regla por ruta y la línea en `CLAUDE.md`, con evaluaciones que demuestran que cambian lo que hace el agente.

**Arquitectura:** primero las evaluaciones y su verificador (el equivalente a "test que falla"), y la línea base sin skill corriendo en segundo plano. Luego `references/`, `SKILL.md` y la regla. Al final, las corridas con skill, la calificación a ciegas y la decisión de `paths`.

**Stack:** Markdown de skills de Claude Code, `claude -p` (no interactivo), Bash y Python 3 (solo la biblioteca estándar, sin dependencias nuevas).

**Spec:** la sección "Diseño" de este archivo + la sección 11 de `docs/planes/T-034-performance-y-memoria.md`.

### Restricciones globales

- `name: rendimiento-y-memoria`, igual a la carpeta; `description` copiada **literal** de la sección 11 de la guía (≈800 caracteres, ≤ 1024, sin `<` ni `>`); sin `disable-model-invocation`.
- `SKILL.md` ≤ 250 líneas; lo crítico (contexto, reglas, bases mínimas y trampas) va primero, dentro de los primeros ~5000 tokens.
- `references/` a un solo nivel; los archivos de más de 100 líneas abren con un índice.
- `.claude/rules/rendimiento.md`: 10 a 15 líneas, `paths: ["src/**/*.ts"]`.
- Solo APIs de Phaser 3.90. Nada de Phaser 4 ni de los skills oficiales de Phaser.
- Español en los textos; identificadores de código en inglés.
- No se toca `src/`, el tablero ni el "Estado actual".
- Las corridas: `claude-sonnet-5-5` y `claude-opus-5-5`, `--effort high`; Haiku (`claude-haiku-5-5`) solo en activación.
- Node 24: anteponer `export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"` a los comandos de npm.

### Modelo y esfuerzo por tarea

Adelanta la idea de T-045.

| Tarea | Quién | Modelo y esfuerzo | Por qué |
|---|---|---|---|
| 1, 4, 6 y 7 | sesión principal | Opus 5.5, alto | Definen qué se mide y qué dice el skill; un error aquí invalida todo |
| 2 y corridas de 6 | `claude -p` (una por celda) | Sonnet 5.5 y Opus 5.5, alto | Es lo que se evalúa |
| 3 | subagentes en paralelo, uno por archivo | Sonnet 5.5, medio | Es extraer y condensar la guía; lo revisa la principal |
| Calificación (6) | subagente a ciegas | Opus 5.5, alto | El juicio tiene que ser fino y sin sesgo |
| 8 | sesión principal | Opus 5.5, medio | Bitácora y PR |

### Foco de revisión

Lo que más puede fallar sin que ninguna tarea lo pruebe directamente. Cada línea tiene su comprobación en la tarea dueña.

1. **Contaminación del brazo "con skill".** Si la corrida puede leer este plan o las rúbricas, la comparación no vale. Las dos ramas se arman desde `origin/main`, sin `docs/planes/T-035-*`, y la única diferencia es lo que se copia encima (tarea 1, paso 4).
2. **Una corrida que se queda colgada** esperando un permiso o haciendo preguntas. Tiene un límite de 30 minutos y `--max-turns 60`. Si no termina, se anota como "sin terminar" y no como fallo del skill (tarea 1, paso 5).
3. **Una corrida que escribe fuera de su carpeta.** `node_modules` va como enlace simbólico, así que se bloquean `npm install`, `npm i` y `npm ci`. No hay remoto, así que nada puede subirse (tarea 1, paso 4).
4. **Enlaces rotos** de `references/` a la guía, o anclas que no existen. El verificador los revisa (tarea 1, paso 1).
5. **Un skill que se activa, pero cuyas reglas el agente no aplica**, porque lo crítico quedó al final de `SKILL.md`. La calificación separa "se activó" de "aplicó" (tarea 6, paso 3).

---

### Tarea 1: Verificador y material de evaluación

**Archivos:**
- Crear: `docs/planes/T-035-evaluaciones/verificar.py`
- Crear: `docs/planes/T-035-evaluaciones/README.md`, `e0-plan-t004.md` … `e4-revisar-diff.md`, `e4-diff-sembrado.patch`, `activacion.json`, `calificar.md`
- Crear: `docs/planes/T-035-evaluaciones/correr.sh` y `activacion.py`

**Interfaces:**
- Produce `python3 -I docs/planes/T-035-evaluaciones/verificar.py`: sale con 0 si todo cumple; si no, con 1 y un mensaje por falla.
- Produce `bash docs/planes/T-035-evaluaciones/correr.sh <e0..e4> <sonnet|opus> <con|sin> <destino>`. Deja en `<destino>/<eval>-<modelo>-<brazo>/` estos archivos: `transcript.jsonl`, `respuesta.md` (el último mensaje), `cambios.patch` (el diff contra la base), `skill-activado.txt` (`si` o `no`) y `estado.txt` (`terminó`, `sin terminar` o `error`).
- Produce `python3 -I docs/planes/T-035-evaluaciones/activacion.py --variante <sin-paths|con-paths> --modelo <id> --destino <dir>`: escribe `<dir>/activacion-<variante>-<modelo>.json` con el resultado de cada consulta y un resumen (aciertos y falsos positivos).

- [ ] **Paso 1: escribir `verificar.py` (la "prueba que falla").** Revisa:
  - que `name` coincida con la carpeta y cumpla `^[a-z0-9-]+$`;
  - que `description` sea idéntica a la de la sección 11 de la guía (la extrae del bloque `yaml` de esa sección), tenga ≤ 1024 caracteres y no tenga `<` ni `>`;
  - que no exista `disable-model-invocation`;
  - que `SKILL.md` tenga ≤ 250 líneas y las secciones con estos títulos, en este orden: "Contexto", "Reglas no negociables", "Bases mínimas", "Trampas conocidas", "Presupuestos", "Plantilla de minijuego", "Checklist de PR", "Mapa de referencias" y "Patrones descartados";
  - que estén los 8 archivos de `references/` y no haya subcarpetas;
  - que los archivos de más de 100 líneas tengan "## Índice";
  - que todo enlace relativo apunte a un archivo existente, y que su ancla `#…` exista (anclas al estilo de GitHub);
  - que `.claude/rules/rendimiento.md` tenga 10 a 15 líneas, `paths: ["src/**/*.ts"]`, los IDs ESC-01, ESC-02, ESC-03, TEX-07, AUD-05, POO-03, FRA-04, RED-03 y ROB-01, y el nombre del skill;
  - que `CLAUDE.md` tenga exactamente una línea que nombre `rendimiento-y-memoria`.
- [ ] **Paso 2: correrlo.** `python3 -I docs/planes/T-035-evaluaciones/verificar.py` → **falla**: "no existe .claude/skills/rendimiento-y-memoria/SKILL.md".
- [ ] **Paso 3: escribir las 5 evaluaciones.** Cada `eN-*.md` tiene una sección "Prompt" (el texto literal que recibe `claude -p`) y una sección "Rúbrica", con 5 a 7 puntos verificables. Cada punto dice su regla y si es **crítico**. Los prompts y los puntos críticos:
  - **e0:** "Escribe el plan de implementación de T-004 (`docs/tareas/T-004-prueba-controles.md`) siguiendo `docs/planes/README.md`, y guárdalo en `docs/planes/T-004-prueba-controles.md`." Críticos: la `EscenaBase` mínima, con `escuchar()`, `once(SHUTDOWN)` e `init()` (ESC-01/02/03); el movimiento con `delta` (FRA-04); un e2e que reinicia la escena N veces sin que crezcan los listeners; la física declarada en la escena (ESC-07).
  - **e1:** "Agrega un minijuego placeholder de atrapar dulces que caen: una escena nueva de Phaser con rectángulos de colores, con sus pruebas." Críticos: hereda de `EscenaBase` (y la crea mínima si no existe); pool con `maxSize`, manejando el `null` de `get()` y con `setActive`/`setVisible` (POO-01); `delta`; estado en `init()`; nada de asignaciones en `update` (POO-03).
  - **e2:** "Crea una escena Calle placeholder que se reacomode cuando cambia el tamaño de la pantalla, con sus pruebas." Críticos: `RESIZE` con `escuchar()` o con un `off` en `SHUTDOWN` (ESC-01/02); lo importante, dentro de la zona segura de 1280×720; física en la escena; un e2e de reinicio sin crecimiento de listeners.
  - **e3:** "Agrega música de fondo en bucle a la escena Arranque después del primer toque, con sus pruebas." Críticos: una sola pista viva, sin duplicarse al volver a entrar; liberación en dos pasos (`removeByKey` + `cache.audio.remove`, AUD-05); nunca `disableWebAudio` (AUD-01); `paraLoader` mínimo o la convención actual, con la nota de T-039, **sin** construir el aviso de versión nueva.
  - **e4:** "Revisa este diff antes del merge: `revision.patch`." `e4-diff-sembrado.patch` agrega una escena con estos problemas sembrados: `this.scale.on('resize', …)` sin `off`, `this.events.on('shutdown', …)`, estado en campos de clase, `new Phaser.Math.Vector2()` dentro de `update`, `x += 5` por frame, y `fps: { limit: 60 }` en `src/main.ts`. Cada uno es un punto crítico (ESC-01, ESC-02, ESC-03, POO-03, FRA-04 y FRA-02).
- [ ] **Paso 4: escribir `correr.sh`.** Pasos de la corrida:
  1. Exportar con `git archive origin/main | tar -x`, en una carpeta nueva dentro de `<destino>`.
  2. Borrar `docs/planes/T-035-*`. Si quedó algo de `docs/planes/T-035`, abortar (foco 1).
  3. Si el brazo es `con`, copiar encima desde esta rama `.claude/skills/rendimiento-y-memoria/`, `.claude/rules/rendimiento.md` y `CLAUDE.md`.
  4. En `e4`, copiar `e4-diff-sembrado.patch` como `revision.patch`.
  5. Enlazar `node_modules` a los del worktree de la tarea.
  6. Hacer `git init` y un commit base con identidad local (`-c user.name=eval`), sin remoto (foco 3).
  7. Correr esto, sin la variable `CLAUDECODE` en el entorno (igual que `run_eval.py` de skill-creator, para que el `claude -p` anidado funcione):

  ```bash
  claude -p "$PROMPT" --model "$MODELO" --effort high \
    --permission-mode acceptEdits \
    --allowedTools "Bash(npm test:*)" "Bash(npm run:*)" "Bash(npx vitest:*)" "Bash(npx playwright:*)" \
    --disallowedTools "Bash(git commit:*)" "Bash(git push:*)" "Bash(gh:*)" "Bash(ssh:*)" \
                      "Bash(npm install:*)" "Bash(npm i:*)" "Bash(npm ci:*)" \
    --append-system-prompt "Modo evaluación: no hagas preguntas ni commits. Si te falta información, decide y anota el supuesto en tu respuesta final." \
    --output-format stream-json --verbose --max-turns 60 --no-session-persistence
  ```

  8. Cortar la corrida a los 30 minutos (foco 2). Al terminar, generar `cambios.patch` (`git add -A` + `git diff --cached`), `respuesta.md`, `skill-activado.txt` (`si` cuando el transcript tiene un `tool_use` `Skill` con `rendimiento-y-memoria`, o un `Read` de su `SKILL.md`) y `estado.txt`.
- [ ] **Paso 5: probarlo de humo.** Correr `correr.sh e4 sonnet sin <scratchpad>/humo`. Esperado: `estado.txt` = `terminó`, `skill-activado.txt` = `no`, `respuesta.md` con texto, y ningún `docs/planes/T-035*` en la carpeta exportada.
- [ ] **Paso 6: escribir `activacion.json` y `activacion.py`.**
  - `activacion.json` tiene 20 consultas en español, `{"query", "should_trigger"}`, 10 y 10. Las que deben activarlo incluyen "va lento en el iPhone", "agrega partículas al susto", "escribe el plan de T-004" y "revisa este PR de la escena Puerta". Los casi aciertos que no deben activarlo incluyen "actualiza el tablero", "escribe el diseño del vecino 3", "renombra T-018 en el tablero" y "¿qué sigue en el Estado actual?".
  - `activacion.py` exporta `origin/main` **una vez por variante**, copia encima solo el skill (sin la regla), y en la variante `con-paths` le agrega `paths: ["src/**", "docs/planes/**"]` al frontmatter.
  - Corre cada consulta con `claude -p --permission-mode plan` (solo lectura), `--output-format stream-json --verbose --max-turns 8`, 5 en paralelo y una corrida por consulta. Marca "activado" en cuanto aparece el `Skill` o el `Read` del skill, y corta el proceso.
  - No usa `run_eval.py` de skill-creator, porque ese script prueba la `description` con un comando temporal y no puede probar `paths`. Sí toma de él la detección por *stream* y la forma del JSON.
- [ ] **Paso 7: escribir `calificar.md`,** el prompt del calificador. Recibe una rúbrica, `respuesta.md` y `cambios.patch` de una celda con nombre anónimo, y devuelve un JSON `{punto, cumple: true|false, evidencia}` por punto. No sabe ni el brazo ni el modelo.
- [ ] **Paso 8: commit.** `git add docs/planes/T-035-evaluaciones && git commit -m "T-035: añade las evaluaciones del skill y su verificador"`.

### Tarea 2: Línea base sin skill (en segundo plano)

**Interfaces:** consume `correr.sh` (tarea 1). Produce `<scratchpad>/corridas/` con 10 celdas `eN-<modelo>-sin`.

- [ ] **Paso 1:** lanzar en segundo plano las 10 celdas (e0 a e4 × sonnet y opus × `sin`), de 5 en 5. Las tareas 3 a 5 avanzan mientras tanto.
- [ ] **Paso 2:** al terminar, comprobar que cada celda tiene `estado.txt`. Las que quedaron "sin terminar" se repiten una vez.

### Tarea 3: `references/`

**Archivos:** crear `.claude/skills/rendimiento-y-memoria/references/` con estos 8 archivos. Cada regla lleva su ID, la receta en 1 a 3 líneas, "Si todavía no existe:" cuando aplica, "Verifica:" con la capa de prueba, y un enlace a la sección de la guía para el porqué. La ruta de los enlaces es `../../../../docs/planes/T-034-performance-y-memoria.md#<ancla>`.

| Archivo | Reglas y secciones de la guía |
|---|---|
| `escenas-y-fugas.md` | ESC-01 a ESC-07; la `EscenaBase` mínima (de T-004) y la completa (de T-037); e2e de fugas (6.2) |
| `texturas-y-gpu.md` | TEX-01 a TEX-09; FRA-05 a FRA-08 |
| `audio.md` | AUD-01 a AUD-06 |
| `frames-y-tiempo.md` | FRA-01 a FRA-04, FRA-09; POO-01 a POO-03 |
| `carga-y-cache.md` | CAR-01 a CAR-04; RED-01 a RED-06 |
| `robustez.md` | ROB-01 a ROB-05 |
| `medir.md` | DEP-01; secciones 6 (las tres capas) y 7 (herramientas) |
| `fuentes.md` | sección 16 |

- [ ] **Paso 1:** lanzar 8 subagentes Sonnet en paralelo, uno por archivo, con la tabla de arriba, las restricciones globales y este criterio para "Si todavía no existe:" (corrección del product owner): "crea la base mínima solo si la tarea la necesita, con el comentario 'mínima; T-0NN la completa'; no la refines; si ya existe, úsala".
- [ ] **Paso 2:** revisar cada archivo contra la guía: que estén todos los IDs de su fila, que no haya APIs de Phaser 4 y que no se haya copiado el porqué largo.
- [ ] **Paso 3:** correr `verificar.py`. Esperado: los fallos de `references/` desaparecen; siguen los de `SKILL.md`, la regla y `CLAUDE.md`.
- [ ] **Paso 4:** commit: `T-035: añade las referencias del skill por tema`.

### Tarea 4: `SKILL.md`

**Archivos:** crear `.claude/skills/rendimiento-y-memoria/SKILL.md`.

**Interfaces:** consume los 8 archivos de la tarea 3 (los enlaza el "Mapa de referencias").

- [ ] **Paso 1: escribirlo**, con las secciones en el orden del verificador:
  1. **Contexto** (≤ 5 líneas): Phaser 3.90, nunca v4; el piso es el iPhone 13 con iOS 26.6; el código fuente de Phaser está en `node_modules/phaser/src/` (`scene/`, `sound/`, `textures/`, `core/TimeStep.js`); el enlace a la guía.
  2. **Reglas no negociables:** unas 15, una línea cada una, con su ID (la lista del punto 2 de la sección 11).
  3. **Bases mínimas:** el criterio de la corrección del product owner y una tabla "si falta X → base mínima → la completa T-0NN": `EscenaBase` → T-037; `paraLoader` → T-039; `?depurar` → T-037; `test:presupuestos` → T-036; la config del juego (`disablePreFX`, `panicMax`, LOSE/RESTORE) → T-038. Incluye la plantilla de la `EscenaBase` mínima: la del ejemplo de ESC-01 sin `alLimpiar()` ni `this.data.reset()`, que agrega T-037.
  4. **Trampas conocidas → cómo probarlas:** la tabla del diseño (9 filas), con una columna "Prueba" que dice la capa y la prueba concreta.
  5. **Presupuestos:** la tabla de la sección 5, resumida a "qué, valor y ✅/🔬".
  6. **Plantilla de minijuego:** sobre `EscenaBase`, con `init`, `preload`, `create` (pool y listeners con `escuchar`), `update(time, delta)` y la liberación de textura y audio, de ≤ 30 líneas.
  7. **Checklist de PR:** la sección 8, una línea por punto.
  8. **Mapa de referencias:** "si vas a tocar X, lee `references/Y.md`".
  9. **Patrones descartados:** Phaser 4, `performance.memory`, `fps.limit`, un `TileSprite` grande y `disableWebAudio`.
- [ ] **Paso 2:** correr `verificar.py`. Esperado: solo quedan los fallos de la regla y de `CLAUDE.md`.
- [ ] **Paso 3:** commit: `T-035: añade el SKILL.md de rendimiento y memoria`.

### Tarea 5: Regla por ruta, línea en `CLAUDE.md` y validación

**Archivos:** crear `.claude/rules/rendimiento.md`; modificar `CLAUDE.md` (sección "Arquitectura").

- [ ] **Paso 1:** escribir la regla: el frontmatter `paths: ["src/**/*.ts"]`, una línea por regla (ESC-01, ESC-02, ESC-03, TEX-07/AUD-05, POO-03, FRA-04, RED-03 y ROB-01) y al final "Carga el skill `rendimiento-y-memoria` antes de escribir o revisar escenas". De 10 a 15 líneas.
- [ ] **Paso 2:** agregar a `CLAUDE.md`, en "Arquitectura": `- **Rendimiento y memoria:** antes de escribir, planear o revisar escenas, carga el skill \`rendimiento-y-memoria\`.`
- [ ] **Paso 3:** `python3 -I docs/planes/T-035-evaluaciones/verificar.py` → sale con 0.
- [ ] **Paso 4 (evaluación 6):** `claude plugin validate .claude/skills` → pasa. Correr también `--strict` y anotar sus advertencias en la bitácora, sin bloquear.
- [ ] **Paso 5:** con Node 24, `npm test`, `npm run build` y `npm run test:e2e` siguen en verde: no se tocó el juego.
- [ ] **Paso 6:** commit: `T-035: añade la regla por ruta y la línea en CLAUDE.md`.

### Tarea 6: Corridas con skill y calificación a ciegas

**Interfaces:** consume `correr.sh`, `calificar.md` y la línea base (tarea 2).

- [ ] **Paso 1:** correr las 10 celdas `con`, de 5 en 5.
- [ ] **Paso 2:** asignarles nombres anónimos a las 20 celdas (el mapa queda en `<scratchpad>/corridas/mapa.json`, que el calificador no ve) y calificar cada una con un subagente Opus usando `calificar.md`.
- [ ] **Paso 3:** armar la tabla: evaluación × modelo × brazo, con los puntos cumplidos, los críticos cumplidos y `skill-activado`. Una celda "con" que tiene el skill activado pero falla un crítico indica un problema de **contenido**; una que no lo activó indica un problema de **activación** (foco 5).
- [ ] **Paso 4:** si una celda "con" falla un crítico, repetirla una vez. Si vuelve a fallar, ajustar `SKILL.md` o la regla (lo más probable: subir la regla o agregarla a la regla por ruta), volver a correr `verificar.py` y repetir solo esa evaluación. Máximo 2 rondas; si sigue fallando, anotarlo y llevárselo al product owner.
- [ ] **Paso 5:** copiar las corridas a `.local/t035/corridas/`, y commit de los ajustes: `T-035: ajusta el skill con los resultados de las evaluaciones`.

### Tarea 7: Activación y decisión de `paths`

**Interfaces:** consume `activacion.py` y `activacion.json`.

- [ ] **Paso 1:** correr `activacion.py` con las 2 variantes × Haiku, Sonnet y Opus (6 corridas de 20 consultas).
- [ ] **Paso 2:** decidir con la regla del diseño. Sin `paths` gana, salvo que tenga muchos falsos positivos y `paths` los baje sin perder activaciones legítimas, sobre todo en "escribe el plan…". Si se pone `paths`, actualizar el frontmatter y `verificar.py`.
- [ ] **Paso 3:** si una consulta que debe activarlo falla en Sonnet y en Opus, ajustar la `description`: solo agregar palabras clave, sin cambiar su sentido, y anotar el desvío respecto a la sección 11. Volver a correr una vez.
- [ ] **Paso 4:** copiar los resultados a `.local/t035/`, y commit si cambió algo: `T-035: decide paths con la evaluación de activación`.

### Tarea 8: Cierre

- [ ] **Paso 1:** la bitácora de T-035: la tabla de la tarea 6, el resultado de activación y la decisión de `paths`, los ajustes y las advertencias de `--strict`.
- [ ] **Paso 2:** marcar los criterios de aceptación. Si la `description` cambió, anotar la diferencia con la sección 11.
- [ ] **Paso 3:** `verificar.py`, `npm test`, `npm run build` y `npm run test:e2e` en verde; revisión de la rama con `code-reviewer-opus55`.
- [ ] **Paso 4:** push y PR `T-035: skill rendimiento-y-memoria y su regla por ruta`. La descripción lleva la tabla de resultados, y "Prueba manual en el iPhone: no aplica, no cambia el juego". El merge lo hace el product owner.
