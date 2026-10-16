# CLAUDE.md

Juego web móvil de Halloween (Phaser 3 + TypeScript + Vite). Una niña disfrazada toca puertas: cada vecino le pone un minijuego; si gana, recibe un dulce, y si pierde, un susto. El diseño completo está en `docs/diseno/`.

## Comandos

- `npm install`: instala dependencias.
- `npm run dev -- --host`: servidor de desarrollo (`--host` permite abrirlo desde el celular en la misma red).
- `npm run build`: revisa tipos (`tsc --noEmit`) y genera `dist/`.
- `npm run preview`: sirve el build.

No hay tests todavía. Verificar con `npm run build` y probando en el navegador.

## Stack y versiones

- Phaser **3.90.0**, TypeScript 7.0.2 y Vite 8.3.4, con versiones exactas (`.npmrc` tiene `save-exact=true`).
- Usar siempre APIs de Phaser 3.x. Nunca código de Phaser 4, de versiones antiguas ni de otros motores.
- Para agregar dependencias, preguntar antes y fijar la versión exacta.

## Arquitectura

- **`GameState`**: módulo singleton con el estado global: disfraz elegido, dulces (0/5), sustos (0/3), casas visitadas e inventario.
- **Data-driven**: vecinos, ítems y disfraces se definen en JSON, no en código.
- **Minijuegos desacoplados**: cada minijuego es su propia escena de Phaser. La escena Puerta lanza la escena del minijuego del vecino y espera el evento `finished(won: boolean)`. El juego principal no conoce el minijuego; solo recibe el resultado.
- **Escenas**: Menú, SelectorDisfraz, Calle, Puerta, (una escena por minijuego), Resultado y FinJuego.
- **Animación cutout**: la niña está hecha de piezas (cabeza, torso, brazos y piernas) dentro de un `Container`, animadas con tweens. Un disfraz solo cambia las texturas de las piezas, no la animación.
- `src/main.ts` hoy solo tiene la escena temporal `SmokeTest`, que se reemplazará.

## Restricciones de plataforma

- Objetivo: Safari en iPhone, en horizontal. Usar el modo de escala `FIT` y mostrar un aviso de "gira tu teléfono" en vertical.
- El audio en iOS solo arranca después del primer toque del usuario.
- Mantener el juego ligero: 2D, audio comprimido y spritesheets pequeños.
- Se publica en GitHub Pages, con repo y página públicos. **Nunca subir datos personales ni nada del trabajo.**

## Flujo de trabajo

Toda la documentación está en `docs/`, en español:

- `docs/diseno/`: qué es el juego, para cualquier lector. Sin detalles técnicos.
- `docs/tareas/`: tablero estilo Jira. Un archivo por tarea (`T-NNN-titulo.md`) con su estado en el frontmatter, más el tablero en `docs/tareas/README.md`. Al cambiar un estado, actualizar **ambos**.
- `docs/planes/`: planes de implementación con el mismo ID que su tarea. **Los planes se guardan aquí**, no en `docs/superpowers/plans/` ni en otra ruta por defecto.

Ciclo: diseño → tarea → plan (si la tarea no es trivial) → código → commit → tarea `hecha`.

- Antes de empezar, marcar la tarea como `en-progreso`. Al terminar, marcar los criterios de aceptación y pasarla a `hecha`.
- Decisiones, bloqueos y desvíos se anotan en la bitácora de la tarea.
- Si un cambio contradice el diseño, avisar antes de continuar. Si el diseño cambia, actualizar `docs/diseno/`.

## Cómo trabajar conmigo

- Soy programador backend y nuevo en videojuegos. Explícame paso a paso qué haces y por qué (escenas, objetos, configuración de Phaser), no solo el código.
- Un cambio a la vez, en archivos pequeños y separados, indicando la ruta de cada archivo.
- Lo jugable con placeholders va antes que el arte.
- Commits pequeños al terminar cada paso, en español y en imperativo, con el ID de la tarea: `T-005: añade escena Calle con puertas placeholder`.
- Responder en español.
