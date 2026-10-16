# Cambios del diseño

Cada versión del diseño, con qué cambió y por qué. El diseño vigente siempre está en esta carpeta; las versiones viejas se consultan con el tag de git `diseno-vX.Y`.

## v0.2 (en curso)

Entrevista de requerimientos, iniciada el 2026-10-15. Todavía no se aplica a los demás documentos de `diseno/`; se aplicará al aprobar la versión.

### Propósito

- El juego es un proyecto para aprender a hacer videojuegos y, a la vez, un regalo para **Mi vo**.
- El objetivo de aprendizaje es el ciclo completo de desarrollo, desde el punto de vista de un manager. El código lo escriben agentes de IA.
- La v1 no tiene fecha: se entrega cuando esté lista.
- Mi vo juega de forma casual: puede haber reto, pero las reglas deben entenderse rápido.

### Decisiones

- **Protagonista:** Mi vo en versión caricatura. Su diseño lo genera una IA por fuera del proyecto.
- **Vecinos:** personas cualquiera con disfraces, no gente real.
- **Partida:** dura de 10 a 15 minutos. Cada minijuego dura de 45 a 90 segundos.
- **Variedad:** cada partida es distinta, porque los minijuegos y la dificultad se sortean en cada casa.
- **Calle:** tiene 8 casas y cada una se visita una sola vez.
- **Dificultad y recompensa:** cada casa muestra cuántos dulces da, y eso indica su dificultad: fácil da 1, media 2 y difícil 3. Mi vo elige a qué casa ir.
- **Victoria:** juntar 10 dulces. No hay redondeo: con 9½ todavía no se gana.
- **Derrota:** 3 sustos, o quedarse sin casas antes de juntar 10 dulces. La calle siempre se genera con dulces suficientes para poder ganar.
- **Minijuegos v1:** 6 minijuegos de 5 tipos, cada uno con 3 dificultades (fácil, media, difícil). Cada minijuego define cómo se gana o se pierde. En una partida pueden repetirse con otra dificultad. La referencia es WarioWare, pero a futuro pueden crecer hacia mini misiones.

  | Tipo | Minijuego | Cómo se juega | Ganar / perder | Qué sube con la dificultad |
  |---|---|---|---|---|
  | Reflejos | Lluvia de dulces | Mover la bolsa con el dedo para atrapar dulces que caen, esquivando arañas | Gana con N dulces antes de que acabe el tiempo; pierde con 3 arañas | Velocidad, cantidad de arañas, N |
  | Memoria | Calderos de la bruja | Repetir la secuencia en que burbujean los calderos (tipo Simon) | Gana al completar X rondas; pierde con 2 errores | Cantidad de calderos (3/4/5), largo de la secuencia, velocidad |
  | Puzzle | Enciende las calabazas | Girar piezas de enredadera para llevar la luz de la linterna a todas las calabazas (tipo Pipe Mania) | Gana si todas encienden antes de que acabe el tiempo | Tablero de 4×4, 5×5 o 6×6 |
  | Puzzle | Dulces en línea | Match-3 simplificado (tipo Candy Crush): intercambiar dulces vecinos y romper 3 o más iguales | Gana al romper N del dulce pedido antes de que acabe el tiempo | Tipos de dulce (4/5/6) y N |
  | Plataformas | Carrera por los techos | Correr y saltar por techos esquivando obstáculos que se mueven (tipo Fall Guys en 2D) | Gana si llega a la meta antes de que acabe el tiempo; si cae, vuelve al último punto de control | Largo del recorrido, obstáculos, tiempo |
  | Ritmo | Baile de esqueletos | Tocar las flechas al ritmo de la música en 3 carriles (tipo Guitar Hero simplificado) | Gana con 70% o más de aciertos | Tempo y densidad de notas |

- **Disfraces:** 5, uno por **tipo** de reto, no por minijuego. Así, un minijuego nuevo hereda el disfraz de su tipo. Todos están disponibles desde el inicio.

  | Disfraz | Tipo | Ventaja |
  |---|---|---|
  | Gata negra | Reflejos | Todo cae un 20% más lento |
  | Bruja | Memoria | La bola de cristal repite la secuencia una vez por minijuego |
  | Vampira | Puzzle | Visión nocturna, que da una pista: en Calabazas brillan las piezas bien puestas; en Dulces en línea brilla una jugada posible |
  | Fantasma | Plataformas | Levita brevemente al caer, lo que le da tiempo para corregir el salto |
  | Esqueleto | Ritmo | Margen de acierto más amplio |
- **Exploración (en v1):** hay dulces escondidos en la calle que dan ½ dulce. Para alcanzarlos hay que hacer acciones: romper objetos (un auto), trepar árboles o subir a techos. Para trepar, un botón engancha los brazos y el movimiento sube o baja a Mi vo.
- **Controles en la calle:** joystick a la izquierda para moverse y para subir o bajar al trepar. A la derecha, dos botones: **Saltar** y **Brazos**. Brazos depende de dónde esté Mi vo: se engancha a un árbol, golpea un objeto o toca una puerta. Dentro de los minijuegos, cada uno usa toques directos en la pantalla.
- **Final:** al ganar, una celebración simple y la opción de jugar otra vez.
- **Privacidad:** no hay problema con que el repo sea público.

### Por definir


### Riesgos detectados

- **Ritmo en iPhone:** la latencia del audio web puede desincronizar la música y los toques. Validarlo pronto. Además, la música debe ser libre de derechos o propia.
- **Saltar con botones táctiles:** hay que validar que se sienta bien (prueba técnica del primer hito).
- **Alcance:** 6 minijuegos con 3 dificultades = 18 variantes. Al crear las tareas, asignar prioridad para decidir cuál se mueve a v1.1 si hace falta.
- El nombre del juego.

## v0.1

Primer borrador (antes en `docs/DISENO.md`): concepto, reglas de 5 dulces / 3 sustos, disfraces con habilidad por definir, exploración opcional y orden de construcción.
