# Minijuegos

Los minijuegos son el corazón del juego: cada vecino pone uno.

## Reglas comunes

- Cada minijuego dura de **45 a 90 segundos**.
- Tiene **3 dificultades** (fácil, media, difícil), que corresponden a casas de 1, 2 o 3 dulces.
- Cada minijuego define cómo se gana o se pierde, pero siempre termina con un resultado claro: ganó o perdió.
- Pertenece a un **tipo** de reto, y el disfraz de ese tipo da una ventaja (ver [personajes](personajes.md)).
- Se juega con toques directos en la pantalla.
- En una partida puede repetirse un minijuego con otra dificultad.
- A futuro, los minijuegos forman una librería que crece, y pueden evolucionar hacia mini misiones con historia (ver [ideas](ideas.md)).

## Referencias

WarioWare y Mario Party. Antes de definir cada minijuego hay que investigar cuáles de sus minijuegos son los más populares y divertidos, para adaptarlos y tropicalizarlos al Halloween de este juego.

## Candidatos (tentativos)

Son candidatos, no compromisos. Cada uno se define a detalle en su propia tarea de diseño antes de construirse, y en esa etapa se elige cuáles entran en la v1.

| Tipo | Minijuego | Cómo se juega | Ganar / perder | Qué sube con la dificultad |
|---|---|---|---|---|
| Reflejos | Lluvia de dulces | Mover la bolsa con el dedo para atrapar dulces que caen, esquivando arañas | Gana con N dulces antes de que acabe el tiempo; pierde con 3 arañas | Velocidad, cantidad de arañas, N |
| Memoria | Calderos de la bruja | Repetir la secuencia en que burbujean los calderos (tipo Simon) | Gana al completar X rondas; pierde con 2 errores | Cantidad de calderos (3/4/5), largo de la secuencia, velocidad |
| Puzzle | Enciende las calabazas | Girar piezas de enredadera para llevar la luz de la linterna a todas las calabazas (tipo Pipe Mania) | Gana si todas encienden antes de que acabe el tiempo | Tablero de 4×4, 5×5 o 6×6 |
| Puzzle | Dulces en línea | Match-3 simplificado (tipo Candy Crush): intercambiar dulces vecinos y romper 3 o más iguales | Gana al romper N del dulce pedido antes de que acabe el tiempo | Tipos de dulce (4/5/6) y N |
| Plataformas | Carrera por los techos | Correr y saltar por techos esquivando obstáculos que se mueven (tipo Fall Guys en 2D) | Gana si llega a la meta antes de que acabe el tiempo; si cae, vuelve al último punto de control | Largo del recorrido, obstáculos, tiempo |
| Ritmo | Baile de esqueletos | Tocar las flechas al ritmo de la música en 3 carriles (tipo Guitar Hero simplificado) | Gana con 70% o más de aciertos | Tempo y densidad de notas |
| Puntería | Defiende la casa | Unos niños vandalizan la casa del vecino lanzándole huevos; Mi vo los derriba lanzándoles proyectiles (mini shooter) | Gana si resiste hasta que acabe el tiempo; pierde si la casa queda demasiado sucia y el vecino la manda a volar | Cantidad y velocidad de los niños, tamaño del medidor de suciedad |

## Riesgos conocidos

- **Baile de esqueletos:** en iPhone, la latencia del audio web puede desincronizar la música y los toques. Además, la música debe ser libre de derechos o propia.
- **Carrera por los techos:** saltar con botones táctiles tiene que sentirse bien.
- **Alcance:** 7 candidatos con 3 dificultades son 21 variantes. Hay que priorizar cuáles entran en la v1.
