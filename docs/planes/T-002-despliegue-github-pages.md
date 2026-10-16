# Plan T-002: Despliegue automático a GitHub Pages

Tarea: [T-002](../tareas/T-002-despliegue-github-pages.md)

## Enfoque

Un workflow de GitHub Actions compila el juego con `npm run build` y publica `dist/` en GitHub Pages cada vez que algo entra a `main`. En los pull requests corre el mismo build, pero no publica: sirve de revisión automática ("¿compila?") antes del merge. Vite necesita saber que el juego vive en `/trick-r-treat/` y no en la raíz del dominio; eso se configura con `base` en un `vite.config.ts` nuevo.

URL final: https://carlosuscanga.github.io/trick-r-treat/

### GitHub Actions en 1 minuto

Para que el resto del plan se lea fácil (y porque T-030 reutiliza todo esto):

- **Workflow**: un archivo YAML en `.github/workflows/`. GitHub lo ejecuta solo cuando ocurre un **evento** (*trigger*): un push, un PR, un clic manual…
- **Job**: un grupo de pasos que corre en una máquina virtual limpia (`ubuntu-latest`). Los jobs de un workflow corren en paralelo, salvo que uno diga `needs: otro`.
- **Step**: un comando (`run: npm ci`) o una **acción** reutilizable (`uses: actions/checkout@…`), que es código de otro repo.
- **`GITHUB_TOKEN` y `permissions`**: cada ejecución recibe un token temporal con los permisos que el workflow declara. Se piden los mínimos y por job.
- **Artifact**: un archivo que un job sube y otro job descarga. Aquí, el `dist/` empaquetado.
- **Environment**: un "destino" con nombre (`github-pages`) que GitHub muestra en el repo, con historial de despliegues y reglas (por ejemplo, solo desde `main`).

### Decisiones

**1. `base` solo en build y preview** (recomendado)

| Opción | Pros | Contras |
|---|---|---|
| **A. `/trick-r-treat/` solo en `build` y `preview`** ✅ | `npm run dev` sigue en `http://<ip>:5173/`, así que T-003 y las pruebas en el iPhone no cambian. `preview` sirve el build tal como quedará en Pages. Es lo que recomienda la guía de Vite para Pages. | El nombre del repo queda escrito en la config: si se renombra el repo, hay que cambiarlo. |
| B. `/trick-r-treat/` siempre | Dev y producción idénticos. | Cambia la URL de dev a `/trick-r-treat/`: rompe el link que Carlos usa en el iPhone en medio de T-003. |
| C. `base: './'` (rutas relativas) | No depende del nombre del repo. | Se comporta distinto en dev (Vite lo ignora y usa `/`) y en algunos casos borde (workers, CSS anidado). Menos explícito para depurar. |

**Decisión: A** (aprobada por Carlos en la revisión del plan, 2026-10-16). Detalle para el futuro:

- **Qué hace `base`:** es el prefijo que Vite antepone a las rutas que genera (el `<script>` de `index.html`, los archivos de `assets/` y lo que se copia de `public/`). Pages sirve el repo en `https://carlosuscanga.github.io/trick-r-treat/`, no en la raíz del dominio. Con `base: '/'`, el navegador pediría `https://carlosuscanga.github.io/assets/…`, que no existe, y la página quedaría en negro.
- **Cómo se aplica:** `vite.config.ts` exporta una función que recibe `command` (`'build'` o `'serve'`) e `isPreview`. `base` vale `'/trick-r-treat/'` cuando `command === 'build'` o `isPreview` es verdadero; en cualquier otro caso (`npm run dev`) vale `'/'`. `preview` tiene que entrar en la condición porque sirve el `dist/` ya compilado con `/trick-r-treat/`: sin eso, `npm run preview` daría 404 en los assets.
- **Dónde está escrito el nombre del repo:** solo en `vite.config.ts`. Si el repo se renombra o se pasa a un dominio propio (`juego.ejemplo.com`, que sirve en la raíz), es la única línea que cambia (a `'/nuevo-nombre/'` o a `'/'`).
- **Consecuencia para el código del juego** (T-003, T-006 y siguientes): las rutas de assets en Phaser **no deben empezar con `/`**. `this.load.image('x', 'assets/x.png')` funciona en dev y en Pages; `'/assets/x.png'` funciona en dev pero se rompe en Pages, y el error no se ve hasta publicar. Si alguna vez hace falta una ruta absoluta, usar `import.meta.env.BASE_URL`, que Vite llena con el `base` correcto en cada modo.
- **Cómo detectar el problema:** probar siempre con `npm run build && npm run preview` antes de un merge que agregue assets. Si en preview carga, en Pages también.

**2. Triggers: push a `main`, pull requests a `main` y manual**

- `push` a `main`: compila y publica.
- `pull_request` hacia `main`: solo compila. Así cada PR muestra un ✅ o ❌ en GitHub antes del merge.
- `workflow_dispatch`: botón "Run workflow" en la pestaña Actions, para volver a publicar sin hacer commit.
- No se filtran rutas (`paths-ignore: docs/**`). Un push que solo toca docs vuelve a publicar lo mismo (≈1 min, gratis en repo público). Filtrar ahorra poco y puede dejar la página desfasada si algún día se olvida un caso.

**3. Un workflow con dos jobs** (recomendado), en vez de dos archivos

- Job `build` (siempre): checkout → setup-node con `.nvmrc` → `npm ci` → `npm run build` → sube `dist/` como artifact de Pages (este último paso, solo fuera de PR).
- Job `deploy` (solo push a `main` o manual, `needs: build`): `configure-pages` → `deploy-pages`.
- Alternativa: `ci.yml` para PRs y `deploy.yml` para `main`. Cada archivo es más simple, pero duplica los pasos del build y pueden divergir: el PR podría compilar distinto de lo que se publica. Con un archivo, lo que se revisa en el PR es exactamente lo que se publica.

**4. Permisos mínimos por job**

- Arriba del workflow: `permissions: {}` (nada por defecto).
- `build`: `contents: read` (leer el código). Es lo único que corre con código de un PR, así que no puede publicar ni escribir nada.
- `deploy`: `pages: write` (publicar) e `id-token: write` (deploy-pages pide un token OIDC para demostrarle a Pages que el despliegue viene de este workflow). No hace checkout del código.

**5. Concurrency**

- Workflow: `group: pages-${{ github.ref }}`. En PRs, `cancel-in-progress: true`: si se hace otro push al PR, se cancela el build viejo. En `main`, `false`: cada despliegue termina, en orden, y nunca se corta uno a la mitad (es lo que recomienda GitHub).

**6. Versiones de las acciones: fijadas por SHA**

Las acciones son código de terceros que corre con permisos de publicar. Un tag como `v5.0.1` puede moverse; el SHA de un commit no. Se fija el SHA y se deja el tag en un comentario para que se lea:

| Acción | Versión | Publicada |
|---|---|---|
| `actions/checkout` | v7.0.1 | 2026-07-20 |
| `actions/setup-node` | v7.0.0 | 2026-07-14 |
| `actions/configure-pages` | v6.0.0 | 2026-03-25 |
| `actions/upload-pages-artifact` | v5.0.0 | 2026-04-10 |
| `actions/deploy-pages` | v5.0.1 | 2026-09-01 |

En `setup-node` se elige v7.0.0 y no la v7.1.0 (del 8 de octubre, con solo una semana de publicada): para algo que publica, mejor una versión con unos meses de uso.

Alternativa: el major flotante (`actions/checkout@v7`). Recibe arreglos solo, pero también cualquier cambio sin revisión. Más adelante se puede activar Dependabot para que proponga las actualizaciones como PR.

**7. Sin caché de npm**

`setup-node` puede guardar `node_modules` entre ejecuciones (`cache: npm`). Con 3 dependencias, `npm ci` tarda segundos, y la caché compartida entre PRs y `main` es un vector conocido de *cache poisoning*. No se usa. Se puede agregar si el build se vuelve lento. Desde v7, `setup-node` activa la caché sola si `package.json` declara `packageManager`; por eso el workflow pone `package-manager-cache: false` explícitamente, para que la decisión no cambie sin querer.

**8. Tokens, secretos y variables de entorno**

El repo es público, y el workflow y sus logs también. Reglas:

- **Ningún secreto.** Publicar en Pages no necesita ninguno: el `GITHUB_TOKEN` temporal y el token OIDC bastan, y GitHub los crea y los borra en cada ejecución. No se agregan *repository secrets* ni variables `env:` con datos.
- **El token no se queda en el disco.** `actions/checkout` guarda por defecto el `GITHUB_TOKEN` en `.git/config` para que se pueda hacer push después. Aquí no hace falta, así que va `persist-credentials: false`.
- **`pull_request`, nunca `pull_request_target`.** El primero corre el código del PR sin permisos de escritura ni secretos. El segundo corre con permisos del repo, y un PR malicioso (de un fork) podría robarlos.
- **Nada de `${{ … }}` con texto que escribe un usuario dentro de `run:`.** Por ejemplo, el título de un PR: GitHub lo pega tal cual en el script, y un título como `"; curl … #` se ejecutaría (*script injection*). Este workflow no usa nada así. **Importa en T-030**, que sí lee el título del PR: allí se pasa por `env:` y se lee como `"$TITULO"`.
- **Variables de Vite:** Vite solo mete en el bundle las variables que empiezan con `VITE_` (de `.env` o del entorno). No hay ninguna, `.env` está en `.gitignore` y el workflow no define ninguna. Si algún día se agrega una, hay que recordar que **todo lo que entra al bundle es público**.

## Archivos

- Crear: `vite.config.ts`
- Crear: `.github/workflows/deploy.yml`
- Modificar: `README.md` (URL del juego y cómo se publica)
- Modificar: `docs/tareas/T-002-despliegue-github-pages.md` (campo `plan:`, criterios, bitácora)

## Pasos

1. `vite.config.ts` con `base` condicional (decisión 1).
   - Verificar: `npm run dev -- --port 5174 --strictPort` sigue en `http://localhost:5174/`. `npm run build && npm run preview -- --port 5174 --strictPort` sirve el juego en `http://localhost:5174/trick-r-treat/` y los assets cargan (sin 404 en la consola). `dist/index.html` apunta a `/trick-r-treat/assets/…`.
   - Commit: `T-002: configura la ruta base de Vite para GitHub Pages`.
2. `.github/workflows/deploy.yml` (decisiones 2 a 8).
   - Verificar: el YAML es válido, y al abrir el PR el job `build` corre en verde y `deploy` aparece como omitido.
   - Commit: `T-002: añade el workflow de despliegue a GitHub Pages`.
3. Revisar que no se publique nada privado.
   - Verificar: `dist/` solo contiene `index.html` y `assets/`, sin nada de `.local/`, `docs/` ni datos personales (`find dist` y `grep` de rutas y nombres).
4. `README.md`: URL del juego y una línea sobre el despliegue automático. Revisión en Plannotator antes del commit.
   - Commit: `T-002: anota la URL del juego en el README`.
5. Tarea: criterios verificables en la rama, bitácora y PR a `main`.

## Después del merge (lo hace el orquestador en `main`)

1. **Antes del merge**, con OK explícito de Carlos (hace pública la página): activar Pages con fuente "GitHub Actions":
   `gh api -X POST repos/carlosuscanga/trick-r-treat/pages -f build_type=workflow`
   O en GitHub: Settings → Pages → Source: GitHub Actions.
2. Merge del PR → corre el workflow en `main` → la página queda en la URL.
3. Verificar los dos criterios pendientes: el push a `main` publica, y el juego carga en Safari del iPhone.

## Riesgos y dudas

- Si se hace merge sin activar Pages, el job `deploy` falla en `configure-pages` (con "Get Pages site failed"). No rompe nada: se activa Pages y se vuelve a correr con "Re-run jobs".
- El environment `github-pages` que crea GitHub solo acepta despliegues desde `main`. Es lo que queremos; si algún día se quisiera publicar una rama de prueba, habría que cambiar esa regla.
- Rutas de assets que empiecen con `/` en el código del juego: funcionan en dev y fallan en Pages (ver decisión 1). Conviene avisarle a T-003 y T-006.
- Renombrar el repo cambia la URL y obliga a cambiar `base`.
