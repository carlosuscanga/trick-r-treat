# Cambios del diseño

Cada versión del diseño, con qué cambió y por qué. El diseño vigente siempre está en esta carpeta; las versiones viejas se consultan con el tag de git `diseno-vX.Y`.

## v0.2 (en curso)

Entrevista de requerimientos, iniciada el 2026-10-15. Todavía no se aplica a los demás documentos de `diseno/`; se aplicará al aprobar la versión.

### Propósito

- El juego es un proyecto para aprender a hacer videojuegos y, a la vez, un regalo para **Mi vo**.
- La v1 no tiene fecha: se entrega cuando esté lista.
- Mi vo juega de forma casual: puede haber reto, pero las reglas deben entenderse rápido.

### Decisiones

- **Protagonista:** Mi vo en versión caricatura. Su diseño lo genera una IA por fuera del proyecto.
- **Vecinos:** personas cualquiera con disfraces, no gente real.
- **Partida:** dura de 5 a 10 minutos.
- **Variedad:** cada partida es distinta, porque los minijuegos y la dificultad se sortean en cada casa.
- **Calle:** tiene 8 casas y cada una se visita una sola vez.
- **Dificultad y recompensa:** cada casa muestra cuántos dulces da, y eso indica su dificultad: fácil da 1, media 2 y difícil 3. Mi vo elige a qué casa ir.
- **Victoria:** juntar 10 dulces. No hay redondeo: con 9½ todavía no se gana.
- **Derrota:** 3 sustos, o quedarse sin casas antes de juntar 10 dulces. La calle siempre se genera con dulces suficientes para poder ganar.
- **Minijuegos v1:** 4, uno por tipo (reflejos, memoria, puzzle, ritmo o habilidad), cada uno con 3 dificultades. Cada minijuego define cómo se gana o se pierde. En una partida pueden repetirse con otra dificultad. La referencia es WarioWare: retos cortos y raros.
- **Disfraces:** 4, uno por tipo de reto. Cada uno da una ventaja en los minijuegos de su tipo. Todos están disponibles desde el inicio.
- **Exploración (en v1):** hay dulces escondidos en la calle que dan ½ dulce. Para alcanzarlos hay que hacer acciones: romper objetos (un auto), trepar árboles o subir a techos. Para trepar, un botón engancha los brazos y el movimiento sube o baja a Mi vo.
- **Final:** al ganar, una celebración simple y la opción de jugar otra vez.
- **Privacidad:** no hay problema con que el repo sea público.

### Por definir

- Cuánto dura cada minijuego. 20 a 40 segundos se siente poco.
- Los 4 minijuegos concretos y la ventaja de cada disfraz.
- Los controles completos: moverse, trepar, romper.
- El nombre del juego.

## v0.1

Primer borrador (antes en `docs/DISENO.md`): concepto, reglas de 5 dulces / 3 sustos, disfraces con habilidad por definir, exploración opcional y orden de construcción.
