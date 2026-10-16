# 🎃 Trick-r-Treat

Juego web de Halloween para jugar en el celular. **Mi vo** elige un disfraz y recorre una calle de 8 casas pidiendo dulces. Cada vecino le pone un minijuego: si gana, le da dulces, y si pierde, le da un susto. Entre casa y casa puede trepar árboles, subir a los techos y romper cosas buscando dulces escondidos. Gana al juntar 10 dulces y pierde con 3 sustos.

Es un regalo para Mi vo y, a la vez, un proyecto para aprender el ciclo completo de desarrollo de un videojuego.

## Estado

- **Diseño:** v0.2 cerrado ([cambios](docs/diseno/CAMBIOS.md)).
- **Fase actual:** planeación de hitos y tareas.
- **Juego:** todavía no es jugable; solo existe una escena de prueba.

## Documentación

- [Forma de trabajo](docs/README.md): cómo se organiza el proyecto (hitos, tareas, git, sesiones).
- [Diseño del juego](docs/diseno/README.md): concepto, reglas, personajes y [minijuegos](docs/diseno/minijuegos.md).
- [Tareas](docs/tareas/README.md): tablero con el estado actual y el avance.
- [Planes](docs/planes/README.md): planes de implementación.

## Desarrollo

Hecho con Phaser 3.90, TypeScript y Vite. Las versiones exactas de las dependencias están en `package.json`.

- `npm install`: instala dependencias.
- `npm run dev -- --host`: servidor de desarrollo (con `--host` se puede abrir desde el celular en la misma red).
- `npm run build`: revisa tipos y genera `dist/`.
