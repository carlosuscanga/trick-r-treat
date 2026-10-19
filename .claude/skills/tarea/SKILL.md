---
name: tarea
description: Lleva una tarea del tablero de 🎃 Trick-r-Treat (docs/tareas/T-NNN-*.md) de punta a punta: revisar si está lista y refinarla con el product owner, arrancarla con su rama y worktree, retomarla en una sesión nueva y cerrarla después del merge. Se usa cuando el product owner dice "toma T-NNN", "arranca T-NNN", "retoma T-NNN", "cierra T-NNN" o "¿qué sigue?", o pide empezar, seguir o terminar una tarea, aunque no nombre el skill.
---

# Tarea: tomar, retomar y cerrar

El script `npm run tarea` hace lo que siempre es igual; este skill hace lo que requiere criterio. El porqué de cada regla está en [`docs/README.md`](../../../docs/README.md) ("Trabajo en paralelo") y la Definition of Ready en [`docs/tareas/README.md`](../../../docs/tareas/README.md).

## Antes de cualquier comando

- npm necesita Node 24 y nvm no carga en el shell del agente. Antepón siempre:
  `export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"`
- `tomar` y `cerrar` corren desde el **checkout principal, en `main`**, sin cambios. Una sesión dentro de un worktree no puede tocar `main`: sale primero con `ExitWorktree keep`.
- **El push a `main` siempre es un comando aparte y visible**, el que imprime el script. Nunca dentro de otro comando. Si el modo auto lo bloquea, no se rodea: el product owner lo corre con `!`.

## ¿Qué sigue?

Lee el "Estado actual" y las tablas de `docs/tareas/README.md`, y propone **una** tarea: la siguiente de la ruta crítica cuyas dependencias estén `hecha`, o una de un carril paralelo si la ruta crítica está tomada. Di por qué.

## Tomar T-NNN

1. **Revisión mecánica:** `npm run -s tarea -- revisar T-NNN`. Lista lo que falta: estado, dependencias, "Qué" vacío o la casilla de las tres capas de pruebas.
2. **Revisión con criterio.** Lee la tarea completa y busca lo que el script no ve:
   - decisiones abiertas en el "Qué" (dos formas razonables de hacerlo y la tarea no elige);
   - criterios vagos, que no se pueden marcar con un sí o un no;
   - pisadas con otra tarea (las dos crean lo mismo, o una necesita algo que la otra no promete): di quién hace qué;
   - contradicciones con `docs/diseno/`. Si las hay, avisa antes de seguir.
3. **Si falta algo, refina en ese momento**, en `main`:
   - Para cada hueco, propón una respuesta con tu recomendación y su porqué. Pregunta **una cosa a la vez** y espera la respuesta.
   - Escribe lo decidido en la tarea: el "Qué", los criterios (con la casilla de tres capas) y una línea en la bitácora con la fecha y "refinada al tomarla".
   - Muestra el resumen y pregunta "¿Quieres revisarlo aquí o en Plannotator?". Con el OK, haz solo el commit (`T-NNN: refina la tarea`), sin push. El paso siguiente (`tomar`) corre `git pull --ff-only`, que acepta un `main` local adelantado, y el push que imprime sube los dos commits.
4. **Arranca:** `npm run -s tarea -- tomar T-NNN --trailer="<línea>" …`, con un `--trailer` por cada línea de atribución de commits que tenga **esta** sesión (por ejemplo, `Co-Authored-By: …`). Deja la tarea `en-progreso` con su commit, crea el worktree con la rama en su nombre final y compila la base. Si algo falla a medias, el script dice qué quedó hecho y qué falta.
5. **Push:** corre el comando que imprimió el script.
6. **Entra:** `EnterWorktree` con la ruta absoluta que imprimió.
7. Si la tarea dice `plan: requerido`, el primer paso es escribir el plan en `docs/planes/` (plantilla en `docs/planes/README.md`). No se programa hasta que el product owner lo apruebe.

## Retomar T-NNN

Para una sesión **nueva** que sigue una tarea ya arrancada, leyendo lo mínimo:

1. La sesión se abre desde la carpeta principal del proyecto, para que cargue el token de GitHub.
2. Lee **solo el frontmatter** de `docs/tareas/T-NNN-*.md` en `main`. Si `worktree` es `null` o no está, la tarea no ha arrancado: sigue con "Tomar T-NNN".
3. `EnterWorktree` con `path` igual al valor de `worktree`.
4. Ya en el worktree, lee la bitácora de la tarea (sobre todo una entrada "para retomar", si existe) y su plan. Se leen en el worktree, no en `main`, porque la copia de la rama es la más nueva.
5. Sigue desde la primera casilla sin marcar del plan, o desde lo que diga "para retomar".

No leas el tablero ni el "Estado actual" completos. Si no hay plan, basta la bitácora.

## Cerrar T-NNN

Después del merge (el product owner lo aprueba; si el modo auto bloquea `gh pr merge`, lo corre él con `!`):

1. Si la sesión está en el worktree: `ExitWorktree keep`.
2. `npm run -s tarea -- cerrar T-NNN`. Comprueba el merge, quita el worktree y deja la tarea `hecha` y el tablero al día, **sin commit**.
3. Si un criterio solo se podía verificar en `main` (por ejemplo, que Pages publique), verifícalo ahora y márcalo.
4. Actualiza el "Estado actual" de `docs/tareas/README.md` (solo lo vigente: fase, en curso, siguiente paso y pendientes) y agrega arriba de `docs/tareas/historial.md` qué se hizo, en 2 o 3 líneas (tarea y PR, qué cambió y, solo si la hubo, una decisión que no esté en otro documento; el detalle ya está en la bitácora y el PR).
5. Un solo commit, `T-NNN: cierra la tarea`, con las líneas de atribución de la sesión. Luego el push, visible.
6. Si otras ramas abiertas se ven afectadas, avísales que traigan `main` (`git merge origin/main`).
7. Pide al product owner borrar la rama local: `git branch -d <rama>` (el hook `dcg` no deja que el agente borre ramas).

## Si algo falla

- **El push falla porque `main` avanzó:** `git pull --rebase` y repite el push. Si el rebase choca en las tablas generadas de `docs/tareas/README.md`, acepta cualquiera de los dos lados y corre `npm run tablero` antes de continuar el rebase.
- **`tomar` o `cerrar` se niegan:** lee el motivo y arréglalo (traer `main`, hacer commit o descartar cambios **preguntando antes**, terminar una dependencia). No edites el frontmatter a mano para saltarte la revisión.
- **`git worktree remove` se niega porque hay cambios:** revisa qué son antes de hacer nada. Nunca `--force` sin el OK del product owner.
