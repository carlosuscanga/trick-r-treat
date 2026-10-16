# Plan T-006: GameState y datos en JSON

Tarea: [T-006](../tareas/T-006-gamestate-y-datos.md)

## Enfoque

Dos piezas independientes que todavía no se conectan al juego (eso es T-007):

1. **Datos** (`src/datos/`): disfraces y vecinos en JSON, con sus tipos de TypeScript y una validación pequeña al cargarlos.
2. **Estado** (`src/estado/`): un objeto `gameState` único con el estado de la partida y métodos que hacen cumplir las reglas (dulces de 0 a 10 en medios, sustos de 0 a 3, casas visitadas, disfraz elegido, reinicio).

En términos de backend: los JSON son la configuración empaquetada en el artefacto, el validador es el equivalente a validar un DTO al deserializarlo, y `gameState` es un servicio *singleton* con estado en memoria, cuyos métodos son la única forma de cambiar ese estado (no hay *setters* sueltos).

## Contraste con guías de referencia

No hay un "estándar" único de arquitectura de videojuegos como lo hay en backend con REST. Las referencias más citadas son el libro *Game Programming Patterns* (Robert Nystrom, gratis en línea) y, para este motor, la documentación oficial de Phaser. Esto dicen sobre lo que propone el plan:

**Datos en JSON = patrón *Type Object*.** El libro lo describe así: en vez de una clase por cada tipo de monstruo, una sola clase y los tipos definidos en un archivo de datos, para que se agreguen "completamente en datos" sin programar. Es justo lo que hacemos con disfraces y vecinos. El libro advierte que con este patrón es fácil definir *datos* por tipo y difícil definir *comportamiento*, y sugiere que el dato **elija** entre comportamientos ya programados. Así queda aquí: el disfraz no programa su ventaja, solo dice su `tipo` de reto, y el minijuego de ese tipo ya sabe cómo aplicarla (T-009).

**Estado global = el libro advierte contra el *Singleton*.** Su crítica: un singleton "es estado global, solo que encapsulado en una clase", e invita a que cualquier parte del código dependa de él (acoplamiento). Propone alternativas: pasarlo como parámetro, colgarlo de algo que ya es global (como el objeto `Game`) o limitar quién lo usa. Phaser, por su parte, recomienda oficialmente su `registry` para datos compartidos entre escenas (puntajes, ajustes, datos de nivel).

Cómo lo aplicamos:

- Un juego de un solo jugador, con un único estado de partida, sí necesita algo global. Lo que importa es **controlar quién lo toca**.
- Regla: solo las escenas del flujo (SelectorDisfraz, Calle, Puerta, Resultado, FinJuego) leen o cambian `gameState`. **Los minijuegos nunca lo importan**: reciben la dificultad y si hay ventaja, y devuelven `finished(won)`. Eso ya dice `CLAUDE.md` y es justo el desacoplamiento que pide el libro.
- Se exporta la clase además de la instancia, para que la verificación cree instancias nuevas sin tocar la global (otra queja del libro: los singletons son difíciles de probar).
- Frente al `registry` de Phaser: lo usaríamos si quisiéramos sus eventos de cambio, pero es un mapa clave→valor sin tipos donde cualquier escena puede escribir cualquier cosa. Una clase propia mantiene las reglas en un solo lugar. Si más adelante conviene, la instancia se puede guardar *dentro* del registry (la opción "colgarlo de algo global" del libro) sin cambiar su API.

Fuentes: [Type Object](https://gameprogrammingpatterns.com/type-object.html) y [Singleton](https://gameprogrammingpatterns.com/singleton.html) en *Game Programming Patterns*; [Cross-scene communication](https://docs.phaser.io/phaser/concepts/scenes/cross-scene-communication) y [Data manager](https://docs.phaser.io/phaser/concepts/data-manager) en la documentación de Phaser.

## Decisiones

### 1. Dulces internamente en medios (enteros)

`gameState` guarda `medios` (0 a 20), no `dulces` (0 a 10).

- Una casa suma 2, 4 o 6 medios; un dulce escondido suma 1.
- Ganar es `medios >= 20`. Con 19 medios (9½) no se gana, y no hay forma de redondear porque nunca hay decimales adentro.
- Hacia afuera se expone `dulces` (por ejemplo `6.5`) solo para mostrar en el HUD.

Nota honesta: ½ se representa exacto en coma flotante, así que sumar `0.5` no daría errores numéricos. La razón real para usar enteros es otra: la regla "nunca redondear" queda garantizada por el tipo de dato y no depende de que nadie escriba `Math.round` en el futuro. Es como guardar dinero en centavos en una base de datos.

Alternativa descartada: guardar `dulces: number` con decimales. Funciona, pero la invariante queda implícita.

Decidido (2026-10-16): se dobla solo en el código. Mi vo sigue viendo `6½/10`, así que el diseño y las demás tareas no cambian. Doblar también lo que ve la jugadora (meta de 20) se descartó porque sería un cambio de diseño.

### 2. Tope de 10 dulces

Si Mi vo tiene 9 y gana una casa de 3, queda en 10, no en 12. El diseño dice "0 a 10" y la partida termina al llegar a 10. Así el HUD nunca muestra `12/10`.

### 3. Forma del estado: clase con una sola instancia exportada

```ts
// src/estado/GameState.ts (forma, no código final)
export class GameState {
  static readonly META_DULCES = 10;
  static readonly MAX_SUSTOS = 3;
  static readonly CASAS_POR_CALLE = 8;

  nuevaPartida(): void;                 // todo a cero, sin disfraz
  elegirDisfraz(disfraz: Disfraz): void;
  get disfraz(): Disfraz | null;

  ganarCasa(dulces: 1 | 2 | 3): void;   // suma 2, 4 o 6 medios (tope 20)
  encontrarMedioDulce(): void;          // suma 1 medio (tope 20)
  get dulces(): number;                 // medios / 2, para mostrar (6.5)
  get medios(): number;                 // 0..20, para lógica

  recibirSusto(): void;                 // tope 3
  get sustos(): number;

  visitarCasa(indice: number): void;    // 0..7; error si ya visitada o fuera de rango
  estaVisitada(indice: number): boolean;
  get casasVisitadas(): number;

  haGanado(): boolean;                  // medios >= 20
  haPerdido(): boolean;                 // 3 sustos, o 8 casas visitadas sin ganar
}

export const gameState = new GameState();
```

- `elegirDisfraz` recibe el objeto `Disfraz` completo (no solo el id), así T-009 puede preguntar `gameState.disfraz?.tipo` para decidir la ventaja.
- `ganarCasa` recibe los dulces de la casa (1, 2 o 3), no la dificultad. La relación dificultad → dulces vive en los datos (`DULCES_POR_DIFICULTAD`), así `GameState` no depende de nada en tiempo de ejecución (ver "Verificación").
- Operaciones inválidas (visitar dos veces la misma casa, índice fuera de rango) lanzan un error claro en vez de ignorarse: mejor que falle fuerte en desarrollo a que la calle quede inconsistente.
- `haGanado` y `haPerdido` son solo consultas. Qué escena se abre al ganar o perder es de T-011.
- Sin persistencia (`localStorage`): si se recarga la página, la partida empieza de cero. No lo pide el diseño.
- Sin inventario ni ítems (`ideas.md`).

Alternativas consideradas:

| Opción | Pros | Contras |
|---|---|---|
| **Clase + instancia única exportada** (recomendada) | Tipada, las reglas viven en los métodos, y para verificar se crea una instancia nueva sin tocar la global. | Ninguno relevante a este tamaño. |
| Funciones sueltas + variables del módulo | Un poco más corto. | Para verificar hay que reiniciar el estado global entre pruebas; no se pueden tener dos instancias. |
| `registry` de Phaser (`game.registry`) | Viene incluido y emite eventos al cambiar un valor. | Es un mapa clave→valor sin tipos: cualquier escena puede escribir `dulces = 12.3`. Las reglas quedarían repartidas por las escenas. |

Si más adelante el HUD necesita enterarse de los cambios sin preguntar en cada frame, se le agregan eventos a la clase (T-011). No se agregan ahora porque nadie los usa todavía.

### 4. Esquema de los JSON

**Tipos compartidos** (`src/datos/tipos.ts`):

```ts
export type TipoReto = 'reflejos' | 'memoria' | 'puzzle' | 'plataformas' | 'ritmo' | 'punteria';
export type Dificultad = 'facil' | 'media' | 'dificil';
export type TipoSusto = 'salta' | 'tiembla' | 'se-agranda';
```

`TipoReto` y `Dificultad` los va a reutilizar el catálogo de minijuegos (T-009).

Desvío al implementar: `tipos.ts` quedó **solo con tipos** (nada que exista al ejecutar). `DULCES_POR_DIFICULTAD` y las listas de valores válidos para el validador se movieron a `src/datos/index.ts`. Así, para Node, todo lo de `tipos.ts` es `import type` y se borra al ejecutar, y el script de verificación funciona sin cambiar `tsconfig.json` (ver "Verificación"). Con Vitest esa restricción ya no hace falta, pero la separación se queda: los tipos en un archivo y los valores en otro. Las listas válidas son `Record<TipoReto, true>`: si alguien agrega un tipo y olvida la lista, `tsc` falla.

**`src/datos/disfraces.json`**: los 5 disfraces definidos en `personajes.md`. El de puntería sigue "por definir", así que no entra hasta que el diseño lo defina.

```json
[
  { "id": "gata", "nombre": "Gata negra", "tipo": "reflejos", "ventaja": "Todo cae un 20% más lento" },
  { "id": "bruja", "nombre": "Bruja", "tipo": "memoria", "ventaja": "La bola de cristal repite la secuencia una vez" }
]
```

**`src/datos/vecinos.json`**: 8 vecinos placeholder, inventados (nada personal: el repo es público).

```json
[
  { "id": "vecino-1", "nombre": "Señor Calabaza", "disfraz": "Calabaza gigante", "susto": "se-agranda" }
]
```

**Diferencia con lo que se pidió:** las instrucciones decían "el vecino tiene dificultad". Pero `reglas.md` y `personajes.md` dicen que la dificultad y el minijuego de cada casa **se sortean en cada partida**. Si la dificultad estuviera en el JSON del vecino, sería fija. Por eso el vecino guarda solo lo que es suyo (nombre, disfraz, susto) y la dificultad la asigna el sorteo de la calle (T-008) en tiempo de ejecución. El tipo `Dificultad` sí se define aquí. Decidido (2026-10-16): así se queda.

### 5. Cómo se cargan: import estático

`src/datos/index.ts` importa los JSON, los valida y exporta `DISFRACES` y `VECINOS` ya tipados.

```ts
import disfracesJson from './disfraces.json' with { type: 'json' };
export const DISFRACES: readonly Disfraz[] = validarDisfraces(disfracesJson);
```

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **Import estático** (recomendada) | Vite mete el JSON dentro del JS al compilar. | Síncrono: los datos existen antes de que arranque cualquier escena. Tipado. Un JSON roto rompe el build, no el juego en el celular. | Cambiar un dato requiere recompilar (en `npm run dev` es instantáneo). |
| Loader de Phaser (`this.load.json`) | Se descarga en el `preload` de una escena, desde `public/`. | Se puede cambiar el JSON sin recompilar. | Asíncrono: solo existe después del `preload`. Llega como `any`. Vive en `public/`, que es de T-003. |

En backend sería la diferencia entre un archivo de configuración dentro del `.jar` y uno que se descarga de un servidor de configuración al arrancar. Aquí no hay nada que cambiar en caliente, así que gana el estático.

**Validación al cargar:** TypeScript solo infiere los JSON como `string`, no como `'reflejos' | 'memoria' | …`. En vez de forzar el tipo con un `as` (que no revisa nada), una función pequeña revisa cada entrada y lanza un error con el id culpable si algo no cuadra: campos faltantes, `tipo` o `susto` desconocido, ids repetidos, o que no haya exactamente 8 vecinos. Es lo mismo que validar un DTO. No se usa una librería (como zod) para no agregar dependencias.

**`tsconfig.json` no cambia.** Lo comprobé: con `moduleResolution: "bundler"`, TypeScript 7 ya permite importar JSON, y tanto `tsc` como Node 24 aceptan el `with { type: 'json' }`.

## Verificación

**Cambio de rumbo (2026-10-16): tests con Vitest.** La primera versión de este plan usaba un script casero (`scripts/verificar-estado.ts`, con `node:assert`). Al revisarlo, Carlos notó que el CI solo compilaba y no corría ese script, y decidió dos cosas: meter tests de verdad en esta misma tarea, y que **todo lleve tests** de aquí en adelante.

- **Vitest 5.0.3** como dependencia de desarrollo (versión exacta, compatible con Vite 8, con dos semanas de uso al elegirla). Es el framework de tests estándar para proyectos con Vite, el equivalente a JUnit. No llega al juego publicado.
- `npm test` (`vitest run`) corre todos los `*.test.ts`. Los tests van al lado de su archivo: `src/estado/GameState.test.ts` y `src/datos/datos.test.ts`.
- El CI corre `npm test` antes de `npm run build`. Si un test falla, el PR sale en rojo y `main` no se publica.
- Se descartó `node:test` (el runner que trae Node, sin dependencias) porque obliga a que los archivos de `src/` no se importen entre sí al ejecutarse, y eso choca con T-008. Vitest lee el código igual que Vite, sin esa restricción. El código de esta tarea igual quedó compatible con ella, porque se escribió antes del cambio.
- Se quitó el script casero; sus comprobaciones pasaron a los tests. Con eso desaparece el aviso del editor sobre `node:assert`, y ya no hace falta decidir lo de `@types/node`.
- Regla nueva en `CLAUDE.md` y en la "Definición de hecho" de `docs/README.md`: la lógica va en módulos sin Phaser y con test; las escenas y lo visual se prueban en el navegador y en el celular.
- Comprobación de que los tests sirven: se rompió a propósito la regla (`haGanado` con 19 medios) y falló el test "9½ no gana". Después se regresó.

| Criterio | Test que lo cubre |
|---|---|
| Los dulces suman en pasos de ½ y nunca se redondean (9½ no gana) | `dulces › suman en pasos de ½ y 9½ no gana`: 4 casas de 2 + 3 medios dulces = 9½ → `haGanado()` es `false`; un medio más → `true`. `dulces › no pasan de 10`: 9 + casa de 3 → `10`, no `12`. |
| Los sustos van de 0 a 3 | `sustos › van de 0 a 3 y con 3 se pierde`: con 4 sustos, `sustos` es `3`; con 3, `haPerdido()` es `true`. |
| Disfraces y vecinos se cargan desde JSON | `datos desde JSON › carga los disfraces y los vecinos`: 5 y 8, con sus tipos. `validarDisfraces` y `validarVecinos`: rechazan una lista inválida, un tipo o susto desconocido, textos vacíos, ids repetidos y una cantidad de vecinos distinta de 8. |
| El estado se reinicia al empezar otra partida | `nuevaPartida › reinicia todo`: después de jugar, todo vuelve a 0, sin disfraz ni casas visitadas. |

## Archivos

- Crear: `src/datos/tipos.ts`, `src/datos/disfraces.json`, `src/datos/vecinos.json`, `src/datos/index.ts` (carga y validación)
- Crear: `src/estado/GameState.ts`
- Crear: `src/estado/GameState.test.ts`, `src/datos/datos.test.ts`
- Modificar: `package.json` y `package-lock.json` (Vitest y `npm test`), `.github/workflows/deploy.yml` (paso de tests), `CLAUDE.md` (línea de tests), `docs/README.md` ("Definición de hecho"). El orquestador asignó estos archivos a T-006 al cambiar el alcance.
- Modificar: `docs/tareas/T-006-gamestate-y-datos.md` (campo `plan:`, criterios y bitácora)
- No se toca: `tsconfig.json`, `src/main.ts` ni nada de T-003.

## Pasos

Cada paso es un commit `T-006: …`.

1. Tipos y JSON: `tipos.ts`, `disfraces.json`, `vecinos.json`.
   - Verificar: `npm run build` pasa.
2. Carga y validación: `src/datos/index.ts`.
   - Verificar: `npm run build` pasa; el script carga los datos y rechaza un JSON inválido.
3. `GameState`.
   - Verificar: `npm run build` pasa; el script cubre los 4 criterios.
4. Script de verificación en `scripts/` (después reemplazado por el paso 5).
5. Vitest: dependencia, `npm test`, tests, paso en el CI y reglas en los docs.
   - Verificar: `npm test` y `npm run build` pasan; el CI del PR corre los tests en verde.
6. Cierre: marcar criterios, llenar la bitácora, push y PR `T-006: GameState y datos en JSON`.

Nota: como nada de esto se conecta todavía a `main.ts`, Vite lo descarta del build (no lo usa nadie). `npm run build` sí revisa sus tipos con `tsc`. Para no esperar a T-007, se hizo un build aparte con Vite de solo `src/datos/index.ts` (salida fuera del repo): empaqueta los JSON y carga 5 disfraces y 8 vecinos.

## Riesgos y dudas

- Nombres y disfraces de los 8 vecinos son placeholder; se reemplazan cuando se defina el arte (T-014).
- El tablero (`docs/tareas/README.md`) también debería enlazar este plan, pero solo se edita en `main`: se lo paso al orquestador.
