# Plan T-031: Tests obligatorios antes del merge

Tarea: [T-031](../tareas/T-031-tests-obligatorios-antes-del-merge.md)

## Enfoque

Crear un **ruleset** de GitHub sobre `main` que exija que los checks `tests` y `build` del CI estén en verde. Sin eso, GitHub no deja que entre ningún cambio a `main`. Hoy un check en rojo solo avisa; con el ruleset, bloquea.

En términos de backend: `deploy.yml` (T-006) es el pipeline que corre la suite. El ruleset es la **protección de rama**, que convierte ese resultado en requisito. Es lo mismo que "branch protection" en GitHub o GitLab, en su versión nueva (los *rulesets* reemplazan a la protección de ramas clásica y permiten más control sobre quién se salta qué).

La definición del ruleset se guarda en el repo como JSON (`.github/rulesets/main.json`) y se aplica con `gh api`. Así queda versionada y revisable, como infraestructura como código, en vez de vivir solo en la configuración web de GitHub.

## El problema: quién puede escribir directo en `main`

Una regla que exige checks rechaza **cualquier** cambio a `main` cuyos checks no hayan pasado, incluidos los pushes directos. Y hoy hay pushes directos legítimos:

- El orquestador escribe el tablero y el "Estado actual" directo en `main`.
- La Action de T-030 (futura) hará commits a `main` con `GITHUB_TOKEN`.

GitHub permite una lista de **excepciones** (*bypass*). Cada excepción tiene un modo:

| Modo | Qué permite |
|---|---|
| `always` | Saltarse las reglas en pushes directos **y** al mergear PRs. |
| `pull_request` | Saltarse las reglas **solo al mergear PRs**. Justo lo contrario de lo que necesitamos. |
| `exempt` | Las reglas ni se evalúan para ese actor. |

**No existe un modo "solo pushes directos".** Y el `gh` de todos los agentes usa el token de Carlos, que es admin. Si el rol admin está en la lista de excepciones, cualquier agente podría mergear un PR en rojo.

### Opciones

| | A. Excepción para el rol admin | B. Sin excepciones | **C. Excepción solo para una *deploy key*** (recomendada) |
|---|---|---|---|
| Cómo | El rol admin se salta las reglas (`always`). | Nadie se las salta. Todo cambio a `main` entra por PR, tablero incluido. | Una llave SSH del repo (*deploy key*), con permiso de escritura, se salta las reglas. Solo la usan los pushes directos del orquestador (y, en T-030, la Action). El token de Carlos **no** tiene excepción. |
| ¿Se puede mergear un PR en rojo? | Sí, a propósito: `gh pr merge --admin` o una casilla en la web. Y `gh`, al rechazar un merge, **sugiere** usar `--admin`: un agente con prisa lo puede hacer. | No. | No con `gh pr merge` ni desde la web, ni con `--admin`. Solo empujando a mano con la deploy key, algo que no se hace por accidente. |
| Pushes del tablero | Funcionan igual que hoy. | Cada cambio del tablero es un PR con su CI. Lento. | Funcionan con un remoto aparte: `git push directo main`. |
| Configuración | Ninguna extra. | Ninguna extra, pero cambia el flujo. | Una llave SSH en la Mac de Carlos (`~/.ssh/`, fuera del repo), registrada como deploy key, y un remoto `directo` en el checkout de `main`. |

**Recomendación: C.** Protege contra el error más probable, un agente que mergea en rojo, sin volver lento el trabajo del orquestador. La regla escrita ("nunca `--admin`") queda igual en `docs/README.md`, pero ya no es la única defensa.

Límite honesto: C no protege contra alguien que *quiera* saltarse la regla. Carlos es admin y puede editar o borrar el ruleset, y cualquier sesión de la Mac podría usar el remoto `directo`. El objetivo es evitar accidentes, no blindar el repo. Por eso `docs/README.md` dirá que solo el orquestador usa `directo`, y solo para el tablero y el "Estado actual".

### Detalle de C

- La llave se genera sin frase de paso, porque los agentes empujan sin intervención. Su alcance es solo este repo, y se puede revocar en Settings → Deploy keys.
- En el checkout principal (configuración local de git, no versionada):
  - `git remote add directo git@github.com:carlosuscanga/trick-r-treat.git`
  - `git config core.sshCommand "ssh -i ~/.ssh/trick-r-treat-directo -o IdentitiesOnly=yes"` (solo afecta a remotos SSH; `origin` sigue por HTTPS).
- El orquestador sigue con `git pull` desde `origin` y empuja el tablero con `git push directo main`.
- En el ruleset: `bypass_actors: [{ actor_type: "DeployKey", bypass_mode: "always" }]`. Esto aplica a todas las deploy keys del repo, y hoy solo existe esta.

**Por verificar al aplicar** (la documentación de GitHub no lo deja claro):

1. Que un repo personal acepte `DeployKey` como excepción. La API lo lista; la página de ayuda no lo menciona.
2. Que un push directo sin excepción se rechace. Debería: es lo que hace la protección clásica.

Si (1) falla, el plan cae a A, se avisa a Carlos antes de seguir y se refuerza "nunca `--admin`".

Resultado al aplicar (2026-10-16): (1) GitHub aceptó `DeployKey` como excepción. El ruleset quedó con id `25247200` y `current_user_can_bypass: never` para la cuenta de Carlos. (2) Se verifica al cerrar la tarea, con el push del orquestador.

## T-030: la Action que escribirá en `main`

Fuera del alcance de esta tarea, pero el plan deja el camino: la Action empujará con una **segunda deploy key**, guardada como *secret* del repo, en vez de `GITHUB_TOKEN`. Así queda cubierta por la misma excepción. Otra opción sería poner la app "GitHub Actions" como excepción, pero eso dejaría saltarse la regla a **cualquier** workflow. T-030 lo decide en su plan; esta tarea lo anota en su bitácora.

## Checks obligatorios

- `tests` y `build`, los jobs de `deploy.yml`. Se exige que vengan de GitHub Actions (`integration_id: 15368`), para que nadie pueda reportar un check falso con el mismo nombre.
- **Rama al día** (`strict_required_status_checks_policy: true`): un PR solo se mergea si los checks corrieron con la versión más reciente de `main`. Con varias sesiones en paralelo, dos PRs pueden pasar cada uno por su lado y romperse al juntarse. Cuesta un paso más: si `main` avanzó, hay que traerlo (`git merge origin/main` o el botón "Update branch") y esperar el CI (~20 s).
- Además: no se permite *force push* ni borrar `main` (`non_fast_forward` y `deletion`). Son baratas y evitan desastres.

### `e2e` (de T-003)

Regla general: **un check se vuelve obligatorio solo cuando ya corre en `main`**. Si se exige antes, todos los PRs abiertos quedan bloqueados esperando un check que nunca llega.

- T-003 agrega su job `e2e` y, en el mismo PR, lo suma a `.github/rulesets/main.json`.
- Después del merge, el orquestador aplica el JSON con `gh api` y con el OK de Carlos. Ahí `e2e` pasa a ser obligatorio.
- Si las pruebas de navegador resultan inestables (fallan sin razón), no se marcan obligatorias hasta corregirlas: un check que falla al azar bloquea a todos.

## Cómo se aplica

```bash
# Primera vez (crea el ruleset; anotar el id que devuelve)
gh api -X POST repos/carlosuscanga/trick-r-treat/rulesets --input .github/rulesets/main.json
# Cambios después (por ejemplo, agregar e2e)
gh api -X PUT repos/carlosuscanga/trick-r-treat/rulesets/<id> --input .github/rulesets/main.json
```

## Pruebas

Automáticas (`npm test`):

- `src/ci/checks.test.ts`: cada check que exige `.github/rulesets/main.json` existe como job en `.github/workflows/deploy.yml`. Así, si alguien renombra un job, el test falla en su PR, antes de que el ruleset bloquee todo esperando un check que ya no existe. Lee los dos archivos con el import `?raw` de Vite, sin dependencias nuevas.
- Se comprueba que el test sirve rompiéndolo a propósito (renombrando un check en una copia) y regresándolo.

Manuales (en GitHub, con el ruleset ya aplicado):

| Criterio | Prueba |
|---|---|
| Un PR con un test roto queda bloqueado | PR de prueba `prueba-T-031-rojo` con un test que falla a propósito. Se espera el check `tests` en rojo y que `gh pr merge` se niegue. Para la vía `--admin` no se intenta el merge: si el ruleset estuviera mal, metería el test roto a `main`. En su lugar se consulta a GitHub si la cuenta puede saltarse la regla (campo `current_user_can_bypass` del ruleset); debe decir `never`. Se revisa también en la web que el botón de merge esté deshabilitado. Después se cierra el PR y se borra su rama. |
| Un PR en verde se mergea normal | El PR de esta misma tarea: el orquestador lo mergea sin squash con el OK de Carlos. |
| Los pushes directos siguen funcionando | El orquestador, al cerrar T-031: primero `git push origin main` (debe rechazarse) y luego `git push directo main` (debe entrar). Ninguno de los dos deja `main` a medias: el commit es el cierre real de la tarea. |
| `docs/README.md` explica la regla | Revisión de Carlos en Plannotator. |
| El cambio de configuración tiene el OK de Carlos | Se pide explícitamente antes de crear la llave y el ruleset. |

## Archivos

- Crear: `.github/rulesets/main.json`, `src/ci/checks.test.ts`, este plan.
- Modificar: `docs/README.md` (sección nueva "Checks obligatorios" y ajuste del paso 6: el orquestador empuja el tablero con `directo`; nunca `--admin`; qué hacer si un check falla), `docs/tareas/T-031-…` (criterios y bitácora).
- Fuera del repo (con OK de Carlos): la llave `~/.ssh/trick-r-treat-directo`, la deploy key en GitHub, el remoto `directo` y `core.sshCommand` en el checkout principal, y el ruleset en GitHub.
- No se toca: `deploy.yml` (los jobs ya tienen nombres estables desde T-006), código del juego.

## Pasos

1. JSON del ruleset + test `checks.test.ts`. Verificar: `npm test` y `npm run build`.
2. `docs/README.md`. Verificar: Plannotator.
3. Push de la rama y PR (en verde, todavía sin ruleset).
4. **Con OK de Carlos:** crear la llave y la deploy key, configurar el remoto `directo` en el checkout principal y aplicar el ruleset. Verificar los puntos "por verificar" de C.
5. PR de prueba en rojo: comprobar el bloqueo, y luego cerrarlo y borrar su rama.
6. Si `main` avanzó, traerlo (lo exige la regla de "rama al día"). Marcar criterios, llenar la bitácora y avisar al orquestador, que mergea y prueba los pushes al cerrar.

Orden importante: el ruleset se aplica **antes** del merge de este PR, para que el propio PR de T-031 sea la prueba de "PR en verde se mergea normal".

## Riesgos y dudas

- Decidido (2026-10-16, Carlos): opción **C** (excepción solo para una deploy key) y **rama al día** con `main`.
- T-003 está en progreso: cuando se aplique el ruleset, su PR necesitará `tests` y `build` en verde y estar al día con `main`. El orquestador ya les avisó.
- Si la deploy key se filtra, cualquiera podría escribir en `main` saltándose las reglas. Vive solo en `~/.ssh/` de la Mac, nunca en el repo, y se revoca en un clic.
