# Plan T-007: Flujo de escenas placeholder

Tarea: [T-007](../tareas/T-007-flujo-de-escenas.md)

## Enfoque

Conectar todas las escenas del diagrama de `concepto.md` con cajas de colores, para recorrer una partida de punta a punta. La lógica que decide a dónde ir (qué puerta está cerca y a dónde se va después de Resultado) va en un módulo sin Phaser, con sus unitarias. Las escenas solo dibujan, escuchan toques y llaman a esa lógica y a `gameState`.

Decisiones técnicas:

- **La Calle es `CallePrueba` renombrada** (`git mv`), no una escena nueva. Así conserva controles, física, cámara y panel de ajustes de T-004 sin copiar código, y el historial de git sigue el archivo.
- **La Calle se duerme, no se para** (ESC-05): al entrar a una puerta, `scene.sleep('Calle')`; al volver de Resultado, `scene.wake('Calle')`. Mi vo aparece donde estaba. Solo se para (`stop`) al terminar la partida, y la siguiente partida la arranca de cero (ESC-03: su estado se reinicia en `init()`).
- **Las 8 puertas viven en JSON** (`src/datos/puertas-prueba.json`: `x` y `dificultad` de cada una, más el radio para "estar cerca"), validado como los demás datos. Es data-driven, como pide `CLAUDE.md`, y T-008 lo cambia por el sorteo sin tocar la escena.
- **Dificultades fijas:** fácil, media, difícil, fácil, media, difícil, fácil y media (1, 2, 3, 1, 2, 3, 1 y 2 dulces, 15 en total). Con ellas se llega a los tres finales: ganar (10 dulces), perder con 3 sustos y quedarse sin casas (ganar las 6 fáciles y medias da 9 dulces; perder las 2 difíciles deja 2 sustos).
- **Entrar a una puerta:** si Mi vo está dentro del radio de una puerta no visitada y se presiona Brazos, se entra. Si no, Brazos hace el destello de siempre. Una puerta visitada se ve atenuada (placeholder; T-008 la dibuja de verdad) y no se abre.
- **El minijuego es `MinijuegoPrueba`**: dos botones, Ganar y Perder. La Puerta lo arranca directo y le pasa la casa. Sin catálogo ni `finished(won)` (eso es de T-009).
- **Resultado aplica el resultado a `gameState`** (`ganarCasa(dulces)` o `recibirSusto()`, y `visitarCasa(i)`) y muestra los dulces ganados o "¡Susto!". Al tocar "Seguir", la lógica decide: FinJuego si `haGanado()` o `haPerdido()`; si no, la Calle.
- **FinJuego tiene dos botones**, como en FIFA (decisión del product owner):
  - **Jugar otra vez:** partida nueva con el mismo disfraz, directo a la Calle. Como `nuevaPartida()` borra el disfraz, se guarda antes y se vuelve a elegir después.
  - **Ir al menú:** va al Menú; desde ahí, Jugar lleva al SelectorDisfraz para cambiar de disfraz.
- **ESC-06 en Arranque:** el `sound.once(UNLOCKED)` pasa por `escuchar()`, y `esperandoDesbloqueo` y `errorDeCarga` se reinician en `init()`. Arranque va al Menú, no a la Calle.

## Archivos

- Crear:
  - `src/flujo/flujo.ts`: `puertaCercana(x, puertas, visitadas, radio)` y `siguienteTrasResultado(estado)`. Sin Phaser.
  - `src/flujo/flujo.test.ts`
  - `src/datos/puertas-prueba.json`
  - `src/escenas/Menu.ts`, `SelectorDisfraz.ts`, `Puerta.ts`, `MinijuegoPrueba.ts`, `Resultado.ts` y `FinJuego.ts`. Todas heredan de `EscenaBase`.
  - `e2e/flujo.e2e.ts`
- Modificar:
  - `src/escenas/CallePrueba.ts` → `src/escenas/Calle.ts` (renombrar, agregar puertas y entrada con Brazos).
  - `src/datos/index.ts` y `src/datos/datos.test.ts`: `validarPuertas` y `PUERTAS`.
  - `src/escenas/Arranque.ts`: ESC-06 y paso al Menú.
  - `src/main.ts`: registrar las escenas nuevas en lugar de `CallePrueba`.
  - `e2e/controles.e2e.ts`, `e2e/fugas.e2e.ts`, `e2e/depurar.e2e.ts` y `e2e/config.e2e.ts`: `CallePrueba` → `Calle`, y llegar a la Calle por el nuevo camino.

## Pasos

Cada paso termina con un commit, push de la rama y una línea "para retomar" en la bitácora. Si el límite semanal se acaba a la mitad, la siguiente sesión sigue desde la primera casilla sin marcar.

- [x] 1. **Lógica y datos.** `flujo.ts`, `puertas-prueba.json`, `validarPuertas` y sus unitarias.
  - Verificar: `npm test` en verde.
- [x] 2. **La Calle.** Renombrar `CallePrueba` → `Calle`, dibujar las 8 puertas, entrar con Brazos (dormir la Calle y arrancar Puerta). Adaptar los e2e existentes al nombre nuevo.
  - Verificar: `npm run test:e2e` con los e2e de controles, depurar y fugas en verde.
- [x] 3. **Escenas placeholder.** Menú, SelectorDisfraz, Puerta, MinijuegoPrueba, Resultado y FinJuego; Arranque → Menú con ESC-06; registrarlas en `main.ts`. Lo importante en la zona segura de 1280×720, con `reacomodar` en `resize`.
  - Verificar: `npm run dev -- --host` y recorrer una partida a mano en el navegador.
- [x] 4. **e2e del flujo y de fugas.** `flujo.e2e.ts` y el ciclo nuevo en `fugas.e2e.ts`.
  - Verificar: `npm run test:e2e` en verde.
- [x] 5. **Cierre.** `npm test`, `npm run test:e2e`, `npm run build` y `npm run test:presupuestos`; una revisión de código; marcar criterios; PR con la tabla de prueba manual.

## Pruebas

- **Unitarias** (`npm test`):
  - `src/flujo/flujo.test.ts`:
    - `siguienteTrasResultado`: FinJuego al llegar a la meta, con 3 sustos y sin casas; Calle en cualquier otro caso. Con un `GameState` nuevo de cada test, no el singleton.
    - `puertaCercana`: devuelve la puerta dentro del radio, `null` fuera de él, `null` si la cercana ya se visitó, y la más cercana cuando dos caben. Con radios y posiciones propios del test, no los del JSON.
  - `src/datos/datos.test.ts`: `validarPuertas` acepta el JSON real (8 puertas, dificultades válidas, `x` dentro de la calle) y rechaza datos malos (faltan puertas, dificultad inexistente, `x` fuera). Las puertas reales suman al menos 10 dulces, para que siempre se pueda ganar.
- **e2e** (`npm run test:e2e`, `e2e/flujo.e2e.ts`). Para entrar a una puerta, el test coloca a Mi vo junto a ella (sus campos públicos, como hace `controles.e2e.ts`) y toca el botón Brazos real. Lee el resultado de campos públicos de solo lectura de Resultado y FinJuego.
  - Recorrido completo: Arranque → Menú → SelectorDisfraz → Calle → Puerta → MinijuegoPrueba → Resultado → Calle.
  - Ganar: Resultado muestra los dulces de la dificultad de la puerta; con 10 dulces se llega a FinJuego "ganaste".
  - Perder: 3 sustos llevan a FinJuego "perdiste".
  - Sin casas: 8 casas visitadas sin llegar a 10 dulces llevan a FinJuego.
  - Orden libre: entrar primero a la puerta 6 y luego a la 2 funciona.
  - Visitada: Brazos junto a una puerta visitada no abre la Puerta.
  - Calle dormida: al volver de Resultado, Mi vo sigue en la misma `x`.
  - Jugar otra vez: va directo a la Calle con el mismo disfraz, y la segunda partida empieza con 0 dulces, 0 sustos y las 8 puertas abiertas (trampa de ESC-03).
  - Ir al menú: FinJuego → Menú → SelectorDisfraz, y se puede elegir otro disfraz.
  - `e2e/fugas.e2e.ts`: ciclo Calle → Puerta → MinijuegoPrueba → Resultado → Calle, 8 casas × 3 partidas, con `crecimientos(antes, despues)` igual a `[]` y sin errores de consola (ESC-01, ESC-05). Reiniciar Arranque N veces sin crecimiento (ESC-06).
  - Los e2e existentes (controles, depurar y fugas) siguen pasando sobre `Calle`.
- **Valores que se afinan:** el radio de las puertas y su `x` se leen del JSON en los e2e, nunca fijos en el test (retro de T-004).
- **Manual en el iPhone** (Pages o `npm run dev -- --host`, en horizontal). Va también en la descripción del PR:

| # | Paso | Se espera |
|---|---|---|
| M1 | Abrir el juego, tocar para empezar | Pasa al Menú; el sonido de prueba suena |
| M2 | Jugar → elegir un disfraz | Llega a la Calle con las 8 puertas; joystick, Saltar y Brazos responden igual que en T-004 |
| M3 | Caminar a la puerta 5 y tocar Brazos | Entra a la Puerta de la casa 5 (orden libre) |
| M4 | Ganar → Seguir | Resultado muestra los dulces de esa casa; vuelve a la Calle en el mismo lugar y la puerta queda atenuada |
| M5 | Brazos junto a la puerta visitada | No entra; solo el destello |
| M6 | Perder 3 veces | FinJuego "perdiste" |
| M7 | Jugar otra vez → ganar hasta 10 dulces | Va directo a la Calle con el mismo disfraz, en 0 y con todas las puertas abiertas; al llegar a 10, FinJuego "ganaste" |
| M7b | Ir al menú → Jugar | Pasa por el SelectorDisfraz y deja elegir otro disfraz |
| M8 | En medio de la partida, salir a otra app y volver | Sigue donde estaba, sin cámara lenta ni pantalla negra |
| M9 | Doble toque rápido en "Tocar" de la Puerta y en "Seguir" de Resultado | El segundo toque no hace nada: no gana el minijuego sin jugar ni se salta la pantalla siguiente |
| M10 | Dentro de la Puerta, girar a vertical y volver a horizontal; luego volver a la Calle | La Calle se ve bien acomodada, sin cortes ni controles fuera de lugar |

- **Capas que no aplican:** ninguna; las tres aplican.

## Modelo y esfuerzo

Con el límite semanal al 95 %, va **un subagente por paso**. Cada uno termina con commit, push y una nota "para retomar", y se detiene. El product owner decide si sigue el próximo paso o lo deja para después.

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Sesión principal (orquesta, revisa el diff, PR) | Opus | `high` | Referencia por rol. |
| Paso 1: lógica y datos | Sonnet | `medium` | Funciones puras y validación con un patrón que ya existe. |
| Paso 2: la Calle | Sonnet | `high` | Renombrar la Calle toca controles con e2e delicados (física, sleep/wake). |
| Paso 3: escenas placeholder | Sonnet | `medium` | Cajas y botones siguiendo `EscenaBase`. |
| Paso 4: e2e del flujo y de fugas | Sonnet | `medium` | Sigue el patrón de `controles.e2e.ts` y `fugas.e2e.ts`. |
| Revisión de código, una al final | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol; una sola pasada para ahorrar límite. |

## Riesgos y dudas

- **Los e2e de controles dependen del nombre `CallePrueba` y de llegar desde Arranque.** Se adaptan con un helper que lleva a la Calle por el SceneManager; si alguno falla por algo más que el nombre, se anota en la bitácora antes de tocar la lógica de controles.
- **`sleep` y `resize`:** una escena dormida sigue recibiendo `resize` (ESC-05). Si se gira el teléfono con la Calle dormida, al despertar debe estar bien acomodada. Lo cubre la prueba manual M8 y, si da problemas, un e2e de resize con la Calle dormida.
- **El panel de ajustes** buscaba la escena por nombre en algún lado: se revisa con `grep` al renombrar.
