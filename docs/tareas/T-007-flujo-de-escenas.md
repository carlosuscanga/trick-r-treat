---
id: T-007
titulo: Flujo de escenas placeholder
tipo: codigo
hito: H2
estado: en-progreso
prioridad: alta
depende: [T-004, T-006, T-037, T-038]
plan: docs/planes/T-007-flujo-de-escenas.md
rama: T-007-flujo-de-escenas
worktree: .claude/worktrees/T-007-flujo-de-escenas
---

## Qué

Todas las escenas con placeholders y conectadas: Arranque → Menú → SelectorDisfraz → Calle → Puerta → minijuego → Resultado → Calle, y FinJuego → jugar otra vez. Todo son cajas de colores; el diseño del nivel no entra aquí.

- **Calle:** reemplaza a `CallePrueba` y reutiliza sus controles, física y panel de ajustes (T-004). Tiene 8 puertas fijas en fila, con dificultad fija de 1, 2 o 3 dulces. Mi vo camina hasta cualquier puerta, en el orden que quiera, y entra con Brazos. Una casa visitada no se vuelve a abrir.
- **Minijuego:** una escena placeholder con dos botones, "Ganar" y "Perder", que la Puerta lanza directo. No hay catálogo ni contrato `finished(won)`.
- **Fin:** después de Resultado, si `gameState.haGanado()` o `haPerdido()`, va a FinJuego; si no, vuelve a la Calle.

Fuera de alcance (para no pisar otras tareas): sortear dificultad y minijuego, y dibujar las casas visitadas (T-008); el catálogo y el contrato de los minijuegos (T-009, que convierte el placeholder en su minijuego falso); el HUD y lo visual del fin (T-011); el arte del menú y de las pantallas de fin (T-019).

## Por qué

Es el esqueleto del bucle completo. Con él se puede recorrer el juego de punta a punta aunque todo sean cajas de colores.

## Criterios de aceptación

- [ ] Se puede pasar por todas las escenas del diagrama de `concepto.md`.
- [ ] Mi vo puede entrar a cualquiera de las 8 puertas, en cualquier orden, y una casa visitada no se vuelve a abrir.
- [ ] Resultado muestra los dulces ganados (los de la dificultad de la puerta) o un susto placeholder.
- [ ] La partida termina en FinJuego al llegar a 10 dulces, a 3 sustos o al quedarse sin casas.
- [ ] FinJuego ofrece "Jugar otra vez" (partida nueva con el mismo disfraz, directo a la Calle) e "Ir al menú" (para cambiar de disfraz).
- [ ] `CallePrueba` ya no existe y el panel de ajustes funciona en la Calle.
- [ ] Pruebas en las tres capas (unitarias, e2e y manual): unitarias de la lógica del flujo (a qué escena se va después de Resultado), e2e que recorre la partida de punta a punta, y manual en el iPhone.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
- 2026-10-18: refinada al tomarla. Decisiones del product owner: (1) minijuego placeholder con botones Ganar/Perder, sin contrato (eso es de T-009); (2) 8 puertas fijas, que se visitan en cualquier orden y se entra con Brazos; (3) T-007 conecta Resultado → FinJuego con `haGanado()`/`haPerdido()` de GameState, y T-011 se queda con el HUD; (4) la Calle reemplaza a `CallePrueba`. El diseño del nivel no entra. Se agregan la casilla de tres capas y `plan: requerido`.
- 2026-10-18: al revisar el plan, el product owner pidió dos botones en FinJuego, como en FIFA: "Jugar otra vez" con el mismo disfraz e "Ir al menú" para cambiarlo.
- 2026-10-18: plan aprobado. Por el límite semanal (95 %), un subagente por paso, y cada uno se detiene después de su commit. Para retomar: empezar por el paso 1 del plan.
- 2026-10-18: paso 1 hecho (lógica y datos, con unitarias). Para retomar: paso 2 del plan (la Calle).
- 2026-10-18: paso 2 hecho (Calle con 8 puertas; Brazos detecta la puerta y entra cuando exista la escena Puerta). Desvíos: también se adaptó `e2e/config.e2e.ts` (usaba `CallePrueba`); la Calle suelta los controles al dormirse (evento SLEEP) para que no queden dedos pegados al volver. Para retomar: paso 3 del plan (escenas placeholder).
- 2026-10-18: paso 3 hecho (Menú, SelectorDisfraz, Puerta, MinijuegoPrueba, Resultado y FinJuego conectados; Arranque → Menú con ESC-06). Para retomar: paso 4 del plan (e2e del flujo y de fugas). Desvíos: botones comunes en `src/escenas/Boton.ts` (caja + texto, una sola pulsación por botón); cada escena expone `botones` (campos con la `caja` Rectangle para tocar y su `texto`); Resultado aplica el resultado en `init()` con la bandera `aplicado` (una vez por entrada); se quitó de la Calle el guard que esperaba a que existiera Puerta; helper `e2e/camino.ts` (`irACalle`) usado en controles y config (fugas y depurar no lo necesitaron). Sin cambios de lógica de controles.
- 2026-10-18: paso 4 hecho (e2e del flujo completo y ciclo de fugas de 8 casas × 3 partidas). Para retomar: paso 5 del plan (verificación, revisión y PR). Sin bugs en las escenas. Desvíos: helpers compartidos en `e2e/flujo.ts`; getter público mínimo `Calle.disfrazId` (solo lectura) para comprobar que Jugar otra vez conserva el disfraz; "Jugar otra vez" se probó en dos casos (tras perder: sustos y puertas; tras ganar: dulces); "reiniciar Arranque N veces" ya estaba cubierto en `fugas.e2e.ts` (30 veces).
- 2026-10-18: revisión de código (Opus) sin hallazgos serios; arreglados el doble toque que atravesaba pantallas, el toque cancelado por el sistema, un forEach en código por frame y Resultado no idempotente, con e2e de doble toque y de joystick suelto. Para retomar: paso 5b (marcar criterios y abrir el PR).
