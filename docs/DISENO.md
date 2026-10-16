# Trick or Treat: Documento de diseño v0.1

Proyecto personal · Phaser 3 · TypeScript · Web móvil · Pegar este documento como contexto al inicio de cada conversación con la IA.

## Concepto

Una niña elige un disfraz de Halloween y recorre la calle de lado tocando puertas. Cada vecino le pone un reto (minijuego) para darle su dulce. Si gana, suma un dulce. Si falla, el vecino le da un susto con una animación propia.

## Plataforma

- Web móvil (navegador del iPhone), orientación horizontal, con aviso de "gira tu teléfono". Se desarrolla y se prueba 100% en el navegador, sin instalar nada.
- Vista lateral 2D, personaje caminando por la calle.
- Motor: Phaser 3. Lenguaje: TypeScript. Entorno: GitHub Codespaces (alternativa: StackBlitz). Publicación: GitHub Pages.

## Flujo de pantallas

Menú → elegir disfraz → calle → (exploración opcional) → puerta → minijuego → resultado (dulce o susto) → calle → fin (victoria o derrota).

## Reglas

- Victoria: llenar la calavera con 5 dulces (5 minijuegos ganados).
- Derrota: acumular 3 sustos.
- Cada casa se visita una sola vez; después queda marcada como visitada.
- Si hay más de 5 casas, el jugador elige a quién visitar. Cantidad de casas: por definir (5 a 8).

## Personaje y disfraces

- Personaje femenino con varios disfraces (ejemplos: bruja, fantasma, vampira).
- Cada disfraz puede dar una habilidad que ayuda en ciertos minijuegos o con ciertos vecinos. Habilidades: por definir, pero el sistema debe permitirlas desde el inicio.
- Técnica de animación: cutout (cabeza, torso, brazos y piernas como piezas separadas dentro de un contenedor de Phaser animado con tweens). Cada disfraz solo cambia las imágenes de las piezas, no la animación.
- Riesgo principal: que las piezas generadas con IA encajen entre sí. Probar con un solo disfraz antes de comprometerse.

## Vecinos y sustos

Cada vecino es un dato con:

- nombre
- casa (posición en la calle)
- minijuego asignado
- recompensa
- requisito opcional (ítem o disfraz que mejora la recompensa)
- animación de susto propia

El susto es corto y simple: el vecino sale de la puerta con un movimiento exagerado (saltar, temblar, agrandarse), con sonido y temblor de pantalla. Tono cómico y espeluznante, no terrorífico.

## Exploración opcional en la calle

Actividades opcionales entre casas que dan puntos o ítems: buscar objetos escondidos, encontrar disfraces nuevos, conseguir ítems que mejoran las recompensas con ciertos vecinos. Lo opcional nunca bloquea el avance.

## Estilo visual

Tierno y caricaturesco con paleta oscura, inspirado en los colores de Gravity Falls: morados, azules profundos, naranjas cálidos de calabaza, contrastes de luz nocturna.

## Arquitectura técnica

- Módulo de estado global (singleton) `GameState`: disfraz elegido, dulces (0/5), sustos (0/3), casas visitadas, inventario.
- Contenido data-driven: vecinos, ítems y disfraces se definen como datos (archivos JSON), no en código.
- Interfaz de minijuego: cada minijuego es una escena independiente que emite la señal `finished(won: bool)`. El juego principal no conoce el minijuego, solo recibe el resultado.
- Escenas de Phaser: Menú, SelectorDisfraz, Calle, Puerta, Minijuego, Resultado, FinJuego.

## Orden de construcción

1. Crear el repositorio en GitHub, abrirlo en Codespaces, montar Phaser 3 con Vite y TypeScript, y publicar en GitHub Pages desde el primer día.
2. Commits pequeños al terminar cada paso, para poder revertir lo que rompa la IA.
3. Bucle completo con placeholders: calle con puertas, minijuego falso con botones Ganar y Perder, contadores, victoria y derrota.
4. Selector de disfraz con placeholders (cambio de color).
5. Personaje caminando en vista lateral con controles táctiles.
6. Probar en el iPhone abriendo el link publicado, sin cables ni instalaciones.
7. Sistema de datos de vecinos, ítems y disfraces.
8. Minijuegos reales, uno por uno.
9. Exploración opcional.
10. Arte final con IA, animación cutout y sustos.
11. Audio y pulido.

## Compartir el juego con mi novia

El juego es web, así que compartirlo es mandarle un link.

- Enlace: el juego se publica en GitHub Pages y ella lo abre en Safari, sin instalar nada ni crear cuentas.
- Pantalla de inicio: desde Safari, Compartir → Añadir a pantalla de inicio, para que se abra a pantalla completa como una app.
- Privacidad: con la cuenta gratuita de GitHub, el repositorio y la página son públicos. No subir nada del trabajo ni datos personales.
- Riesgo: rendimiento y audio en Safari de iOS (el sonido solo arranca tras el primer toque). Probarlo temprano.
- Restricción de diseño: mantener el juego ligero (2D, audio comprimido, spritesheets pequeños).

## Pendiente por definir

- Cantidad de casas.
- Habilidades de los disfraces.
- Los minijuegos y su dificultad.
- Ítems y actividades de exploración.
- Nombre del juego.

## Instrucciones para la IA

- Responder siempre con Phaser 3.x y TypeScript, con la versión fijada en package.json (nunca código de otros motores ni de versiones antiguas).
- Un cambio a la vez, en archivos pequeños y separados, con la ruta del archivo indicada. Solo puedo trabajar en el navegador: nada de instalaciones locales.
- Soy programador backend y nuevo en videojuegos, y no haré tutoriales: explicar paso a paso qué hacer y por qué (escenas, objetos y configuración), no solo el código.
- Mantener el contenido data-driven y los minijuegos desacoplados vía la señal `finished(won: bool)`.
- Si algo contradice este documento, avisarme antes de continuar.
- Priorizar lo jugable con placeholders sobre el arte.