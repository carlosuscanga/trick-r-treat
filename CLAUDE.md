# CLAUDE.md

🎃 **Trick-r-Treat**: juego web móvil de Halloween (Phaser + TypeScript + Vite). Es un regalo para **Mi vo**, que es la protagonista: refiérete a ella siempre así. Mi vo, disfrazada, recorre una calle de 8 casas en vista lateral: cada vecino le pone un minijuego; si gana, recibe dulces, y si pierde, un susto. El diseño vigente (v0.2) está en `docs/diseno/`.

## Comandos

- `npm install`: instala dependencias.
- `npm run dev -- --host`: servidor de desarrollo (`--host` permite abrirlo desde el celular en la misma red).
- `npm run build`: revisa tipos (`tsc --noEmit`) y genera `dist/`.
- `npm run preview`: sirve el build.

No hay tests todavía. Verificar con `npm run build` y probando en el navegador.

## Stack y versiones

- Phaser **3.90.0**, TypeScript 7.0.2 y Vite 8.3.4, con versiones exactas (`.npmrc` tiene `save-exact=true`).
- Decisión del 2026-10-16: quedarse en Phaser 3.90 y no pasar a Phaser 4. Phaser 4 (estable desde abril de 2026) tiene poco material, y los agentes de IA mezclarían sus APIs con las de Phaser 3. La 3.90 ya tiene iluminación 2D y postFX, suficiente para el estilo del juego. Migrar a 4 más adelante sigue siendo posible.
- Usar siempre APIs de Phaser 3.x. Nunca código de Phaser 4 ni de otros motores.
- Para agregar dependencias, preguntar antes y fijar la versión exacta.

## Arquitectura

- **`GameState`**: módulo singleton con el estado global: disfraz elegido, dulces (0 a 10, en pasos de ½; nunca redondear), sustos (0/3), casas visitadas e inventario.
- **Data-driven**: vecinos, ítems y disfraces se definen en JSON, no en código.
- **Minijuegos desacoplados**: cada minijuego es su propia escena de Phaser. Recibe la dificultad (`facil | media | dificil`) y si el disfraz da ventaja, y emite `finished(won: boolean)`. La escena Puerta lanza el minijuego del vecino y espera ese evento; el juego principal no conoce el minijuego, solo el resultado.
- **Catálogo de minijuegos**: los minijuegos se registran en un catálogo con su `tipo` de reto. El disfraz se asocia al tipo, no al minijuego, así que agregar un minijuego es registrarlo y nada más. Esto prepara la librería de minijuegos a futuro.
- **Escenas**: Menú, SelectorDisfraz, Calle, Puerta, (una escena por minijuego), Resultado y FinJuego.
- **Calle**: vista lateral con parallax y físicas Arcade (saltar, trepar, romper objetos). Controles táctiles: joystick a la izquierda, y botones Saltar y Brazos a la derecha.
- **Animación cutout**: Mi vo está hecha de piezas (cabeza, torso, brazos y piernas) dentro de un `Container`, animadas con tweens. Un disfraz solo cambia las texturas de las piezas, no la animación.
- `src/main.ts` hoy solo tiene la escena temporal `SmokeTest`, que se reemplazará.

## Carpeta local `.local/`

Está ignorada por git: no se sube a GitHub y no tiene respaldo.

- `.local/notas.md`: notas privadas (sorpresas para Mi vo, ideas a medio cocinar). Nunca copiar su contenido a archivos que se suben al repo sin que yo lo pida.
- `.local/assets/`: assets no oficiales (borradores, pruebas de IA, referencias). El código del juego nunca debe depender de nada en `.local/`. Cuando un asset sea oficial, moverlo al proyecto.

## Restricciones de plataforma

- Objetivo: Safari en iPhone, en horizontal. Usar el modo de escala `FIT` y mostrar un aviso de "gira tu teléfono" en vertical.
- El audio en iOS solo arranca después del primer toque del usuario.
- Mantener el juego ligero: 2D, audio comprimido y spritesheets pequeños.
- Se publica en GitHub Pages, con repo y página públicos. **Nunca subir datos personales ni nada del trabajo.**

## Flujo de trabajo

El proceso completo (hitos, ciclo, git, sesiones y definición de "hecho") está en **`docs/README.md`**. Seguirlo. Toda la documentación está en `docs/`, en español:

- `docs/diseno/`: qué es el juego, para cualquier lector. Sin detalles técnicos. Los cambios se registran en `CAMBIOS.md` y las ideas a futuro en `ideas.md`.
- `docs/tareas/`: tablero estilo Jira. Un archivo por tarea (`T-NNN-titulo.md`) con su estado en el frontmatter, más el tablero en `docs/tareas/README.md`. Al cambiar un estado, actualizar **ambos**.
- `docs/planes/`: planes de implementación con el mismo ID que su tarea. **Los planes y specs se guardan aquí**, no en `docs/superpowers/` ni en otra ruta por defecto.

Reglas:

- Al empezar una sesión, leer **"Estado actual"** en `docs/tareas/README.md` y, si existe, `.local/notas.md`. Sin instrucción concreta, proponer la siguiente tarea.
- Al cerrar una sesión (o cuando yo lo pida), actualizar "Estado actual": qué se hizo, qué sigue y qué está pendiente de decidir.
- Una rama y un worktree por tarea (`T-007-flujo-de-escenas`), creados con la herramienta nativa de worktrees en `.claude/worktrees/`. Entra a `main` por pull request. `main` siempre es jugable. Proceso completo en `docs/README.md`, "Trabajo en paralelo".
- Antes de crear el worktree, marcar la tarea como `en-progreso` **en `main`** (commit y push). En la rama, marcar los criterios de aceptación y llenar la bitácora. Después del merge, pasarla a `hecha` **en `main`**.
- El tablero y el "Estado actual" solo se editan en `main`, nunca en las ramas de tarea.
- Decisiones, bloqueos y desvíos se anotan en la bitácora de la tarea.
- Si un cambio contradice el diseño, avisar antes de continuar. Si el diseño cambia, actualizar `docs/diseno/` y `CAMBIOS.md`.

## Cómo trabajar conmigo

- Soy programador backend y nuevo en videojuegos. Mi objetivo es **aprender el ciclo completo de desarrollo desde todos los roles**: product owner (qué se construye y por qué), manager (planeación, tareas, entrega) y desarrollador (arquitectura y revisión del código). Los agentes de IA escriben el código; yo lo dirijo y lo reviso.
- Explícame el proceso y las decisiones: en qué fase estamos, por qué hacemos cada documento y qué alternativas hay. Del código, solo lo necesario para revisarlo y decidir; no hace falta un tutorial de programación.
- Un cambio a la vez, en archivos pequeños y separados, indicando la ruta de cada archivo.
- Lo jugable con placeholders va antes que el arte.
- Commits pequeños al terminar cada paso, en español y en imperativo, con el ID de la tarea: `T-007: añade escenas placeholder conectadas`.
- Siempre que me presentes un plan o documentación y me pidas retroalimentación, ábrelo en **Plannotator** (`/plannotator-annotate` sobre el archivo markdown) para que lo anote. No basta con mostrarlo en el chat.
- Responder en español.
- Cada vez que se mencione el nombre del proyecto, escribirlo con calabaza: **🎃 Trick-r-Treat** (en docs, README, títulos y mensajes). La excepción son los identificadores técnicos (`package.json`, URLs, rutas).
