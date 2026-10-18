# Plan T-004: Prueba de controles táctiles

Tarea: [T-004](../tareas/T-004-prueba-controles.md)

> **Estado:** diseño aprobado por el product owner (2026-10-17). El plan de implementación está al final, en "Implementación".

## Para qué es esta tarea

Es el mayor riesgo técnico de 🎃 Trick-r-Treat: si caminar y saltar con controles táctiles no se siente bien en el iPhone, no funcionan la calle, la exploración ni los minijuegos de Plataformas. T-004 lo prueba **antes** de construir encima, con un rectángulo en lugar de Mi vo y cajas grises en lugar de arte. Al final, el product owner decide en su iPhone entre el plan A, el A′ o el B (ver "Contingencia").

## Qué es éxito (palabras del product owner)

- **Caminar sin lag.** Mueves el joystick a la derecha y Mi vo se mueve a la derecha en ese mismo momento. Lo mismo a la izquierda.
- **Frenar al instante.** Sueltas el joystick y se detiene de inmediato, sin resbalar.
- **Saltos fluidos "como cualquier Mario plataformero de Game Boy".**
- **Dos pulgares a la vez sin trabarse:** moverse y saltar al mismo tiempo.

## Qué es falla (palabras del product owner)

- **La pantalla se mueve mientras juegas**, como el scroll de una página web.
- **Se siente torpe:** no responde a tiempo o los gráficos hacen que el movimiento se sienta pesado.

El veredicto lo da la **prueba manual del product owner en su iPhone**. Los e2e y las unitarias son la red de seguridad de los agentes, no el juez. Por cada punto que falle, el agente responde si se corrige con ajustes o si es casi imposible en web, y eso alimenta la decisión de contingencia.

## Alcance

### Entra

1. **Calle de prueba** de unas 3 pantallas de ancho, con cajas grises que representan elementos de una calle de Halloween: banqueta, bote, auto, pórtico y techo. Más los adornos que se quieran agregar (ver "Regla de plataformas").
2. **Mi vo como rectángulo** de unos 200 px de alto (≈ 28 % de la pantalla), con un color que contraste.
3. **Joystick virtual** a la izquierda: caminar a la izquierda y a la derecha.
4. **Botón Saltar** a la derecha: un solo salto con altura variable.
5. **Botón Brazos** a la derecha: solo demuestra que recibió el toque, con un destello o un texto breve. No hace nada más.
6. **Cámara** que sigue a Mi vo.
7. **Protecciones contra gestos del navegador** que faltan después de T-003.
8. **Modo `?depurar`:** panel para afinar el salto en el iPhone sin reprogramar, y el gancho mínimo `window.__juego` para los e2e.
9. **Aviso de bajo rendimiento:** si el juego corre sostenido a ~30 fps (modo de bajo consumo), se muestra un aviso discreto una sola vez. *Mi decisión:* es solo de la escena de prueba, para que el product owner sepa por qué algo se siente lento. No es un mensaje del juego final ni cambia el diseño. Si el juego final lo necesita, se decide en T-038 o T-041.
10. **`EscenaBase` mínima** (la plantilla del skill `rendimiento-y-memoria`; T-037 la completa).

### No entra (decisión del product owner)

- **Doble salto:** fuera.
- **Agacharse** (joystick abajo): no se implementa. Se anota en `docs/diseno/ideas.md` como idea a futuro.
- **Gestos de Brazos** (toque = golpe, doble toque = patada, mantener = agarrar): fuera. También van a `ideas.md`.
- **Trepar** (joystick arriba en un árbol con Brazos): es de T-027.
- Ítems, romper objetos y exploración real: T-026, T-027 y T-028.
- Arte, sonido de salto y animación cutout.

T-004 no cambia el diseño vigente (`docs/diseno/concepto.md`: joystick, Saltar y Brazos contextual). Solo agrega dos ideas a `ideas.md` y su línea en `CAMBIOS.md`.

## Decisiones

### 1. Caminar: digital e instantáneo

- El joystick da **izquierda, derecha o nada**, a **velocidad fija** (inicial: 360 px/s; cruza 1280 px en ≈ 3.5 s). Sin aceleración ni frenado: la velocidad se fija directo en el cuerpo de Arcade, sin `drag`. Es lo que pidió el product owner: arranca y frena al instante.
- **Zona muerta con histéresis:** se activa al pasar el 25 % del radio y se suelta al bajar del 15 %, para que no parpadee entre moverse y no moverse. La función pura también calcula el valor analógico (−1 a 1) por si después se quiere velocidad proporcional. T-004 no lo usa.
- **Control en el aire igual que en el suelo**, como en Mario de Game Boy.

### 2. Saltar: tipo Mario, con altura variable

Valores iniciales para un personaje de ~200 px en una pantalla de 720. Todo se afina en el iPhone (decisión 7).

| Parámetro | Inicial | Para qué |
|---|---|---|
| Altura máxima (mantener Saltar) | 260 px | ≈ 1.3 veces Mi vo |
| Altura mínima (toque corto) | 70 px | Saltito |
| Tiempo hasta el punto más alto | 0.38 s | Ritmo del salto |
| Tiempo de caída desde la altura máxima | 0.27 s | Cae más rápido de lo que sube: se siente con peso |
| Velocidad máxima de caída | 1500 px/s | Que la caída no se descontrole y la física no atraviese el piso |
| *Coyote time* | 100 ms | Puedes saltar unos milisegundos después de salir del borde |
| Búfer de salto | 130 ms | Si tocas Saltar justo antes de aterrizar, el salto sale al tocar el suelo |

- La gravedad de subida, la de bajada y la velocidad inicial **se calculan** a partir de la altura y los tiempos (`g = 2H/t²`, `v₀ = 2H/t`), no se escriben a mano. Así el product owner ajusta en términos que entiende: qué tan alto y qué tan rápido.
- **Altura variable:** al soltar Saltar mientras sube, la velocidad hacia arriba se recorta a la que corresponde a la altura mínima. Es determinista y se puede probar con unitarias.
- **Sin doble salto:** el *coyote time* no aplica si Mi vo dejó el suelo por un salto.
- **Ápice "colgado"** (gravedad menor en la punta del salto, como Celeste): opcional y apagado por defecto. Se puede encender en `?depurar` si el salto se siente muy brusco arriba.
- La lógica del salto vive en un **módulo puro sin Phaser**, con su estado en un objeto reutilizado (sin crear objetos por frame). La escena solo aplica el resultado (gravedad y velocidad) al cuerpo de Arcade.

### 3. Física

- **Arcade a 120 pasos por segundo** con paso fijo (`fps: 120`), declarada en la escena (regla ESC-07), con la gravedad del mundo en 0 y la gravedad por cuerpo. Con el paso de 60 que trae por defecto, la pantalla de 60 Hz del iPhone 13 alterna frames con 0 y 2 pasos, y eso se ve como microtirones. A 120 el salto sale igual en cualquier dispositivo.
- Todo el movimiento depende del tiempo (`delta`), nunca de los frames (regla FRA-04).

### 4. Multitouch y controles

- **Phaser 3.90 trae un solo puntero táctil por defecto:** tal como está, moverse y saltar a la vez no funcionaría. Se configura `input.activePointers: 3` (dos pulgares más uno de margen por si un dedo extra toca la pantalla).
- **Cada dedo se queda con su control.** Al tocar, el dedo se asigna al joystick o a un botón según dónde cayó, y ese control solo escucha a ese dedo hasta que se levanta. Un dedo no puede robarle el control al otro. Esta asignación es un **módulo puro** (`ControlTactil`) y es la pieza más importante de las unitarias.
- **Antídoto contra controles "pegados":** en cada frame se revisa si el dedo asignado sigue abajo; si no, el control se suelta. Además, se sueltan todos los controles al cancelarse un toque (llega una notificación o se abre el Centro de control), al salir el dedo del canvas, al ocultarse la página (`visibilitychange`) y al perder el foco (`blur`).
- **Respuesta inmediata:** Phaser procesa el toque en el mismo evento del navegador. Los manejadores de toque solo guardan el estado (dirección y botón presionado) y `update()` lo aplica. El retraso máximo es un frame.
- **Capa de intenciones (mi decisión):** los controles táctiles no mueven a Mi vo directamente. Producen *intenciones* (dirección −1/0/1, Saltar presionado o sostenido, Brazos) en un objeto simple, y la escena solo lee esas intenciones. Así, probar otro esquema táctil (plan A′) o un teclado (plan B, y también para depurar en la computadora) es cambiar quién llena las intenciones, sin tocar la escena ni el salto.
- **Joystick hecho a mano**, sin plugins (unas 60 líneas). El plugin de rexrainbow sería una dependencia nueva, su compatibilidad con 3.90 no está confirmada y el presupuesto de bundle tiene unos 30 KiB libres.
- **Joystick flotante:** aparece donde cae el pulgar dentro de la mitad izquierda de la pantalla. Una base tenue en reposo indica dónde va. Radio de ~75 px.

### 5. Posición de los controles ⚖️

- **Los controles se anclan a los bordes reales de la pantalla, no a la zona segura de 1280×720.** En un iPhone de 1872 de ancho lógico, anclarlos a la zona segura los dejaría a ~300 px del borde, lejos de los pulgares. El HUD sigue visible en cualquier ancho porque se recalcula con `resize`. *Es una decisión de esta tarea, no algo que el product owner haya dicho; se apoya en que la regla de zona segura de `CLAUDE.md` es para el contenido de la escena.*
- **Márgenes:**
  - el joystick no se activa en la franja de ~48 px junto al borde izquierdo (es la zona del gesto "atrás" de Safari);
  - nada interactivo en la franja de ~40 px de abajo (barra de inicio) ni arriba (Centro de notificaciones y de control);
  - en horizontal, el notch queda en uno de los lados: los controles van en la parte baja, lejos de él.
- **Botones:** dibujo de ~120 px y zona de toque de ~150 px (≈ 81 pt, muy por encima del mínimo de Apple de 44 pt). Saltar y Brazos en diagonal, siguiendo el arco del pulgar, con ≥ 40 px entre sus zonas de toque y sin solaparse. Saltar es el principal: va más abajo y más a la derecha.
- Todos estos números son estimaciones. El panel `?depurar` permite mover los botones y cambiar su tamaño para probarlos en el iPhone.

### 6. Protecciones contra gestos del navegador

T-003 ya dejó `touch-action: none`, `overscroll-behavior: none`, sin selección de texto y sin menú de mantener presionado en `html` y `body`. Phaser, por su lado, ya cancela los toques sobre el canvas (`preventDefault`). Se agrega:

- `touch-action: none` también en `#game` y en el `canvas`.
- Un módulo en `src/plataforma/` que cancela `gesturestart`, `gesturechange` y `gestureend` (el zoom con pellizco de Safari), como cinturón de seguridad.
- Lo que **no se puede bloquear desde la web:** el gesto "atrás" desde el borde izquierdo, deslizar desde abajo y deslizar desde arriba. La mitigación son los márgenes de la decisión 5 y **abrir el juego desde la pantalla de inicio**, que no tiene historial ni barras de Safari. El modo oficial sigue siendo la pantalla de inicio (decisión de T-034). La prueba manual se hace en los dos modos para conocer la diferencia.

### 7. Afinar en el iPhone: `?depurar`

- Con `?depurar` en la URL aparece un **botón pequeño** arriba, en el centro, que abre y cierra un **panel HTML** encima del juego, con controles deslizantes para:
  - altura máxima, altura mínima, tiempo al punto más alto, tiempo de caída;
  - velocidad al caminar;
  - *coyote time* y búfer;
  - ápice colgado (encendido o apagado);
  - tamaño y posición de los botones.
- Los cambios se aplican **al instante**, sin recargar. Un botón **"Copiar valores"** copia los valores vigentes como JSON, para pegarlos en el chat y que el agente los guarde como los nuevos valores por defecto.
- Los valores por defecto viven en un archivo de configuración de datos (JSON), no en código. Sin `?depurar` el juego no muestra nada de esto.
- `?depurar` también expone `window.__juego` para los e2e (la base mínima del skill; T-037 completa el resto).
- El panel necesita poder usar sus controles a pesar de `touch-action: none` en `body`, así que lleva su propio `touch-action` y su propia selección.

### 8. La calle de prueba y la regla de plataformas

```
                                          ┌────────┐ techo (≈380, dos saltos)
                                          │        │
                            ┌──────┐      │  casa  │
              ┌─────┐       │pórtico ≈180 │        │
        ┌──┐  │auto │ ≈140  └──────┘      │        │
  ──────┤bote├─┴─────┴─ banqueta ≈40 ───────┴────────┴──────
  ═════════════════ calle (piso) ═══════════════════════════
  ← ─────────── unas 3 pantallas de ancho; la cámara sigue a Mi vo ─────────── →
```

- **Para qué es cada caja:** la banqueta (≈ 40) prueba subir un escalón sin trabarse. El bote (≈ 100) y el auto (≈ 140) prueban la altura variable: el toque corto no alcanza el auto, mantener sí. El pórtico (≈ 180) está cerca del máximo. El techo (≈ 380) no se alcanza de un salto: hay que encadenar pórtico → techo, lo que prueba el control en el aire y el *coyote time*.
- **Bloques sólidos sobre el piso (mi decisión).** Cada caja es un bloque sólido que nace en la calle (el bote, el auto, el pórtico) o encima de otro bloque (el techo sobre la casa), y choca por los cuatro lados. Así es una calle real: si fallas un salto, caes a la calle y vuelves a intentar, sin huecos mortales. Las plataformas flotantes que se atraviesan desde abajo (ramas, balcones) quedan para T-026, si la exploración las pide.
- **Las plataformas se definen en un JSON** (`nombre`, `x`, `ancho`, `alto` sobre lo que tiene abajo), como los vecinos y los disfraces. Agregar un adorno de Halloween (calabazas, lápidas, cercas, ataúdes) es agregar una línea, sin tocar código.
- **Regla de plataformas.** Se calcula a partir de la configuración del salto, así que si el salto cambia, la regla cambia con él:

  | Regla | Inicial | Cómo se calcula |
  |---|---|---|
  | Escalón máximo: subir de un salto desde la calle o desde un bloque vecino | ≤ 220 px | 85 % de la altura máxima |
  | Altura máxima de cualquier bloque sobre la calle | ≤ 400 px | Fija: depende de la pantalla y la cámara, no del salto |
  | Distancia máxima entre bloques para encadenar saltos sin bajar a la calle | ≤ 200 px | 85 % de lo que avanza Mi vo en el aire con un salto máximo |
  | Grosor mínimo de un bloque | ≥ 32 px | Que la física no lo atraviese al caer rápido |

  El 15 % de margen es para que los saltos no tengan que ser perfectos con el dedo.
- **El toque corto clasifica, no restringe.** Con la altura mínima (≈ 60 px con margen), la calle se divide en lo que se sube con un saltito (la banqueta) y lo que pide mantener Saltar (el auto). Es la prueba de la altura variable, no un límite: el auto está hecho para no alcanzarse con un toque corto.
- **Una unitaria vigila la regla:** lee el JSON de plataformas y la configuración por defecto, y falla si algún bloque no se puede alcanzar desde la calle (directo o encadenando bloques) o rompe un límite. Con eso, el CI no deja hacer merge de una calle imposible. La misma regla le sirve después a T-026 (exploración).
- **Cámara:** sigue a Mi vo horizontalmente siempre. Verticalmente, solo cuando sube a algo alto como el techo, con una zona muerta para que no tiemble en cada saltito. Límites de cámara al tamaño de la calle.
- **Ubicación de la calle:** el piso de la calle queda en la parte baja de la pantalla. Los controles se dibujan encima del piso, no encima de las plataformas.

### 9. Cómo se llega a la calle

- `Arranque` ("toca para empezar") pasa a la calle de prueba después del primer toque (que en iOS desbloquea el audio). T-007 meterá después el Menú y el selector de disfraz en medio.
- Los e2e de T-003 que miran el texto "Audio listo" se ajustan para no depender de que `Arranque` siga en pantalla, sin perder lo que verifican.

### 10. Dónde prueba el product owner (mi decisión)

- **Antes del merge, en la red local:** `npm run dev -- --host` (o `preview -- --host`) y la IP de la Mac en el iPhone, en Safari y agregando el ícono a la pantalla de inicio desde esa misma URL, como en T-003. Pages solo publica desde `main`.
- En la red local la página corre en `http`, y ahí Safari no da acceso al portapapeles. Por eso "Copiar valores" tiene un respaldo: si no puede copiar, muestra el JSON en una caja de texto que se puede seleccionar a mano.
- **Después del merge**, una ronda corta en Pages para confirmar que se comporta igual.

### 11. Rendimiento y memoria

Se siguen las reglas del skill `rendimiento-y-memoria`. Las que más pesan aquí:

- La escena hereda de `EscenaBase` y registra sus listeners de `scale`, `game.events` y `window` con `escuchar()` (ESC-01). Los de `document` y `window` (`visibilitychange`, `blur`, `gesture*`) se limpian igual al cerrar la escena, o viven en `src/plataforma/` a nivel juego.
- El estado se reinicia en `init()` (ESC-03).
- Cero asignaciones dentro de `update()` (POO-03).
- Física declarada en la escena (ESC-07).
- Trampas que esta tarea toca y se prueban: duplicar listeners al reiniciar la escena (doble salto, joystick que responde dos veces) y movimiento por frame en lugar de por tiempo.
- Config del juego: solo las líneas que la tarea necesita: `input.activePointers: 3` y `fps: { panicMax: 0 }` (FRA-03). Esta última entra porque, sin ella, al volver del segundo plano el juego corre en cámara lenta unos segundos, y eso se sentiría como "lag" en la prueba manual. El resto de la config de T-038 queda para T-038.

## Contingencia (se decide al cerrar la tarea)

- **Plan A:** joystick + Saltar + Brazos, como en este diseño.
- **Plan A′:** si después de afinar con `?depurar` algo sigue fallando (lag, dedos que se traban o gestos del sistema que roban toques), se prueban otros esquemas táctiles antes de rendirse: zonas de toque en lugar de botones, deslizar para saltar, caminar automático.
- **Plan B:** solo si A′ también falla: web de computadora con teclado. Es un cambio de diseño (plataforma) y se quiere evitar.

La decisión la toma el product owner en su iPhone y se anota en la bitácora de T-004.

**Cómo se trabaja cada camino (decisión del product owner):**

- **PR 1, plan A:** se mergea después de la ronda de prueba en el iPhone, **sea cual sea el veredicto**. La calle de prueba es jugable y es la base de T-007.
- **Si el veredicto es A′:** A′ es parte de T-004, no un ticket nuevo. Va en un **segundo PR** con la rama `T-004-esquemas-alternativos`, que sale de `main` después del merge del PR 1 (no apilado: cuando A′ empieza, el PR 1 ya está en `main`). Cada esquema alternativo es otro "llenador" de la capa de intenciones (decisión 4), así que no toca la escena ni el salto. Los esquemas candidatos: zonas de toque en lugar de botones, deslizar para saltar y caminar automático. El plan detallado de A′ se escribe solo si se llega ahí.
- **T-004 sigue `en-progreso`** hasta el veredicto final (A, A′ o B), y entonces se cierra con la retro.
- **Excepción al proceso:** dos ramas para una tarea rompe la regla de "una rama por tarea" de `docs/README.md`. Se anota en la bitácora. Si se repite en otras tareas, se vuelve regla.

## Riesgos conocidos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Gesto "atrás" del borde izquierdo o de la barra de inicio intercepta los controles | Alta | Márgenes + pantalla de inicio. No se puede bloquear desde la web. |
| Controles pegados tras una interrupción del sistema | Alta | Antídoto por frame + soltar en cancelación, ocultamiento y pérdida de foco |
| El e2e de dos dedos simultáneos no es estándar en el WebKit de Playwright: el truco encontrado (un evento genérico con `changedTouches`) no está probado contra Phaser | Media | Validarlo en el primer paso. Si no funciona: multitouch cubierto con unitarias de `ControlTactil` y prueba manual, y el e2e prueba un dedo a la vez. |
| Zoom con pellizco se cuela en iOS 26 | Media | `touch-action` + `gesture*`; verificar a mano |
| Modo de bajo consumo limita Safari a 30 fps | Media | No se puede evitar: detectar y avisar |
| Las barras de Safari aparecen o desaparecen a mitad del juego y cambian el tamaño | Media | Los controles se reacomodan con `resize` sin soltar el toque; verificar a mano |

## Lo que queda para el plan

- Nombres de archivos, módulos y escenas, y en qué carpetas van.
- El orden de los pasos y cuáles se le dan a qué subagente.
- Las secciones **Pruebas** (unitarias, e2e y la tabla manual del iPhone) y **Modelo y esfuerzo**.
- Detalles de dibujo: colores, cómo se ve el destello de Brazos, el panel de `?depurar`.

## Fuentes

Tres investigaciones en paralelo (subagentes, 2026-10-17): multitouch en Phaser 3.90, sensación de salto en Arcade y gestos de iOS Safari. Los informes completos están en `.local/t004/` (local, sin respaldo).

---

# Implementación

> **Para agentes:** sub-skill requerido: `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans`. Los pasos usan casillas (`- [ ]`). Antes de escribir código de escenas, cargar el skill `rendimiento-y-memoria`.

**Objetivo:** una calle de prueba jugable en el iPhone, donde un rectángulo camina con un joystick táctil, salta con altura variable y responde a Brazos, con dos pulgares a la vez y valores afinables con `?depurar`.

**Arquitectura:** la lógica vive en módulos puros sin Phaser: intenciones, joystick, asignación de dedos, disposición, salto, ajustes, regla de plataformas y vigía de fps. Todos con unitarias. Una escena `CallePrueba` y un objeto `ControlesTactiles` (Phaser) solo traducen toques a intenciones y aplican el resultado al cuerpo Arcade. El panel de `?depurar` es HTML y cambia un objeto de ajustes compartido.

**Stack:** Phaser 3.90.0 (Arcade), TypeScript 7.0.2, Vite 8.3.4, Vitest 5.0.3, Playwright 1.63.0 (WebKit, `iPhone 17 landscape`). Sin dependencias nuevas.

**Diseño:** la primera mitad de este archivo. Quien ejecute lee las dos mitades.

## Restricciones globales

- Phaser 3.90: nunca APIs de Phaser 4. Ante la duda, `node_modules/phaser/src/`.
- Sin dependencias nuevas (`package.json` no cambia).
- Reglas del skill `rendimiento-y-memoria`: ESC-01 (`escuchar()`), ESC-02 (`once(SHUTDOWN)`), ESC-03 (estado en `init()`), ESC-07 (física en la escena), POO-03 (cero asignaciones en `update()`), FRA-04 (todo con `delta`).
- Módulos puros (`src/controles/`, `src/movimiento/`, `src/datos/`) sin `import Phaser`: los prueba Vitest en Node, sin DOM.
- Datos en JSON, validados al cargar, como `src/datos/index.ts`.
- Assets: ninguno nuevo. Todo se dibuja con formas de Phaser.
- Textos, comentarios, nombres y commits en español. Commits `T-004: <imperativo>`, con la línea `Co-Authored-By` de la sesión.
- Cada tarea termina con `npm test` y `npm run build` en verde; desde la tarea 1, también `npm run test:e2e`. Node 24 (`.nvmrc`).

## Foco de revisión

Fallas que la especificación implica y que conviene fijar con una prueba en la tarea que las posee:

1. **Un dedo que empieza en el joystick y se desliza sobre Saltar** no salta: el dedo sigue siendo del joystick. → tarea 3 (unitaria) y tarea 5 (e2e).
2. **Un tercer dedo** que toca mientras hay dos abajo no le roba el control a ninguno. → tarea 3.
3. **Cambio de tamaño con un dedo abajo** (aparecen o se van las barras de Safari): el joystick no se suelta y la disposición se recalcula. → tarea 5 (e2e).
4. **Volver del segundo plano:** los controles se sueltan (`HIDDEN` o `BLUR`) y no hay cámara lenta (`panicMax: 0`). → tarea 1 (config) y tarea 5 (e2e).
5. **Reiniciar la escena N veces** no duplica listeners: un toque en Saltar sigue dando un solo salto. → tarea 5 (e2e).

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/escenas/EscenaBase.ts` (crear) | Base mínima del skill (`escuchar`, limpieza en `SHUTDOWN`). `// mínima; T-037 la completa` |
| `src/escenas/Arranque.ts` (modificar) | Hereda de `EscenaBase`; tras el primer toque, pasa a `CallePrueba` |
| `src/escenas/CallePrueba.ts` (crear) | Escena: calle, Mi vo, cámara, aplica intenciones y salto, aviso de fps, destello de Brazos |
| `src/escenas/ControlesTactiles.ts` (crear) | Dibuja el joystick y los botones; conecta el input de Phaser con `ControlTactil` |
| `src/controles/intenciones.ts` (crear) | Tipo `Intenciones` y utilidades |
| `src/controles/joystick.ts` (crear) | Dirección con zona muerta e histéresis; tope de la perilla |
| `src/controles/disposicion.ts` (crear) | Dónde va cada control según el ancho y los ajustes |
| `src/controles/controlTactil.ts` (crear) | Asigna cada dedo a un control y llena las intenciones |
| `src/movimiento/ajustes.json` (crear) | Valores por defecto (salto, caminar, botones, joystick) |
| `src/movimiento/ajustes.ts` (crear) | Tipo `Ajustes`, validación y física derivada |
| `src/movimiento/salto.ts` (crear) | Máquina del salto: coyote, búfer, corte, gravedad por fase |
| `src/datos/calle-prueba.json` (crear) | Bloques de la calle de prueba |
| `src/datos/plataformas.ts` (crear) | Validación de bloques y regla de alcance |
| `src/plataforma/gestos.ts` (crear) | Cancela `gesturestart/change/end` |
| `src/plataforma/vigiaFps.ts` (crear) | Detecta ~30 fps sostenidos, una sola vez |
| `src/depurar/depurar.ts` (crear) | `?depurar`: `window.__juego` y arranque del panel |
| `src/depurar/panelAjustes.ts` (crear) | Panel HTML con deslizadores y "Copiar valores" |
| `src/main.ts` (modificar) | `activePointers`, `panicMax`, escenas, gestos, ajustes, depurar |
| `index.html` (modificar) | `touch-action: none` en `#game` y `canvas` |
| `e2e/tactil.ts` (crear) | Ayudante para despachar toques sintéticos de varios dedos |
| `e2e/controles.e2e.ts` (crear) | e2e de controles, gestos, reinicios y `?depurar` |
| `docs/diseno/ideas.md`, `docs/diseno/CAMBIOS.md` (modificar) | Agacharse y gestos de Brazos como ideas |

Las unitarias van al lado de cada módulo (`*.test.ts`).

---

### Tarea 1: Base táctil y validación del e2e de varios dedos

Es la primera porque valida el riesgo de las pruebas: si el truco del evento sintético no funciona con Phaser, el plan cambia (ver el paso 6).

**Archivos:** crear `src/escenas/EscenaBase.ts`, `src/plataforma/gestos.ts` (+ test), `src/depurar/depurar.ts`, `e2e/tactil.ts` y `e2e/controles.e2e.ts`; modificar `src/main.ts`, `index.html` y `src/escenas/Arranque.ts`.

**Interfaces:**
- Produce: `abstract class EscenaBase extends Phaser.Scene` con `protected escuchar(em: Phaser.Events.EventEmitter, ev: string | symbol, fn: (...a: any[]) => void): void` (plantilla exacta del skill).
- Produce: `bloquearGestos(doc: Pick<Document, 'addEventListener'>): void`.
- Produce: `esModoDepurar(search: string): boolean` y `exponerJuego(game: Phaser.Game): void` (asigna `window.__juego`). `declare global { interface Window { __juego?: Phaser.Game } }`.
- Produce (e2e): `type Dedo = { id: number; x: number; y: number }` con `x`, `y` en **coordenadas lógicas** del juego, y `tocar(page: Page, tipo: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel', dedos: Dedo[]): Promise<boolean>` (devuelve `defaultPrevented`).

- [x] **Paso 1: unitaria de `bloquearGestos`** en `src/plataforma/gestos.test.ts`, con un `doc` falso que guarda los listeners:
  ```ts
  it('cancela gesturestart, gesturechange y gestureend con listeners no pasivos', () => {
    // doc falso: addEventListener(tipo, fn, opciones) guarda [tipo, fn, opciones]
    bloquearGestos(doc);
    expect(tipos).toEqual(['gesturestart', 'gesturechange', 'gestureend']);
    expect(opciones.every((o) => o.passive === false)).toBe(true);
    const e = { preventDefault: vi.fn() }; fn(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });
  ```
- [x] **Paso 2:** `npm test` → falla (no existe `gestos.ts`). Implementar `bloquearGestos`. `npm test` → pasa.
- [x] **Paso 3: base del juego.**
  - `EscenaBase` con la plantilla del skill.
  - `Arranque` hereda de `EscenaBase`, llama `super.init(data)` y usa `this.escuchar(this.scale, RESIZE, this.centrar)` en lugar de su `on`/`off` manual. Sin más cambios por ahora.
  - `main.ts`: `input: { activePointers: 3 }`, `fps: { panicMax: 0 }`, `bloquearGestos(document)`, y `if (esModoDepurar(location.search)) exponerJuego(game)`.
  - `index.html`: `#game, #game canvas { touch-action: none; }`.
- [x] **Paso 4: ayudante `tocar`** en `e2e/tactil.ts`.
  - Convierte coordenadas lógicas a `clientX/clientY` con el `getBoundingClientRect()` del canvas y `__juego.scale.gameSize`.
  - Despacha sobre el `canvas` un `Event(tipo, { bubbles: true, cancelable: true })` con `changedTouches` y `touches` definidos con `Object.defineProperty`. Cada toque lleva `identifier`, `clientX`, `clientY`, `pageX`, `pageY`, `screenX`, `screenY` y `target: canvas`.
  - `new Touch()` no existe en este WebKit ("Illegal constructor").
- [x] **Paso 5: e2e de validación** en `e2e/controles.e2e.ts` (la página abre con `./?depurar`):
  ```ts
  test('dos dedos sintéticos quedan abajo a la vez en Phaser', async ({ page }) => {
    await tocar(page, 'touchstart', [{ id: 1, x: 300, y: 500 }]);
    await tocar(page, 'touchstart', [{ id: 2, x: 1100, y: 600 }]);
    // pointers[0] es el ratón; los táctiles son 1..3
    expect(await punterosAbajo(page)).toBe(2);
    await tocar(page, 'touchend', [{ id: 1, x: 300, y: 500 }]);
    expect(await punterosAbajo(page)).toBe(1);
  });
  test('arrastrar sobre el canvas no hace scroll ni deja pasar el gesto', async ({ page }) => {
    // touchstart y touchmove regresan defaultPrevented === true; window.scrollY === 0
    // getComputedStyle(canvas).touchAction === 'none' y lo mismo en #game
  });
  test('sin ?depurar no existe window.__juego', async ({ page }) => { /* ... */ });
  ```
- [x] **Paso 6: correr `npm run test:e2e`.**
  - Si "dos dedos" pasa, seguir.
  - **Si no pasa después de dos intentos:** no forzarlo. Anotarlo en la bitácora, borrar ese test y avisar al orquestador. El plan sigue con el multitouch cubierto por las unitarias de `ControlTactil` (tarea 3) y la prueba manual, y los e2e de la tarea 5 usan un solo dedo a la vez.
- [x] **Paso 7:** `npm test`, `npm run build` y `npm run test:e2e` en verde (los e2e de T-003 siguen pasando). Commit: `T-004: agrega la base táctil y valida el e2e de varios dedos`.

---

### Tarea 2: Ajustes y salto (lógica pura)

**Archivos:** crear `src/movimiento/ajustes.json`, `ajustes.ts` (+ test) y `salto.ts` (+ test).

**Interfaces:**
- Produce `Ajustes` (y el JSON con estos valores por defecto; en el tipo, todos son `number` o `boolean`):
  ```ts
  type Ajustes = {
    salto: { alturaMax: 260; alturaMin: 70; tiempoSubida: 0.38; tiempoCaida: 0.27;
             caidaMax: 1500; coyoteMs: 100; bufferMs: 130; apiceColgado: false };
    caminar: { velocidad: 360 };
    joystick: { radio: 75; activa: 0.25; suelta: 0.15; margenBorde: 48 };
    botones: { radioToque: 75; radioDibujo: 60; margenAbajo: 40;
               saltar: { derecha: 140; abajo: 130 }; brazos: { derecha: 310; abajo: 250 } };
  };
  ```
  `derecha` y `abajo` son la distancia del centro del botón al borde derecho y al de abajo de la pantalla.
- Produce `validarAjustes(datos: unknown): Ajustes` (lanza un error que nombra el campo, como `src/datos/index.ts`) y `AJUSTES_POR_DEFECTO: Readonly<Ajustes>`.
- Produce `type Fisica = { gSubida: number; gBajada: number; v0: number; vCorte: number; caidaMax: number; coyoteMs: number; bufferMs: number; apiceColgado: boolean }` y `derivarFisica(salto: Ajustes['salto']): Fisica`, con `gSubida = 2H/tp²`, `v0 = 2H/tp`, `gBajada = 2H/td²` y `vCorte = √(2·gSubida·Hmin)`.
- Produce `type EstadoSalto` (campos internos: `tiempoSinSuelo`, `tiempoBuffer`, `saltoUsado`, `enSueloAntes`), `crearEstadoSalto(): EstadoSalto`, `type SalidaSalto = { vy: number | null; gravedad: number; evento: 'salto' | 'aterrizaje' | null }` y:
  ```ts
  pasoSalto(e: EstadoSalto, enSuelo: boolean, vy: number, presionado: boolean,
            sostenido: boolean, dtMs: number, f: Fisica, salida: SalidaSalto): SalidaSalto
  ```
  Escribe en `salida`, que el que llama reutiliza: cero asignaciones. `vy` negativo es hacia arriba (como en Phaser). `presionado` es el flanco del frame (se tocó Saltar); `sostenido`, que sigue abajo.

Reglas de `pasoSalto`, en orden:
1. `presionado` → `tiempoBuffer = bufferMs`; si no, `tiempoBuffer -= dtMs`.
2. En suelo → `tiempoSinSuelo = 0` y `saltoUsado = false` (más `evento = 'aterrizaje'` si antes no estaba en suelo). En el aire → `tiempoSinSuelo += dtMs`.
3. Puede saltar si `tiempoBuffer > 0` y (`enSuelo` o (`tiempoSinSuelo <= coyoteMs` y `!saltoUsado`)). Al saltar: `vy = -v0`, `saltoUsado = true`, `tiempoBuffer = 0` y `evento = 'salto'`.
4. Si no saltó, `!sostenido` y `vy < -vCorte` → `salida.vy = -vCorte` (corte de la altura variable).
5. Gravedad: `gSubida` si `vy < 0`; `gBajada` si no. Con `apiceColgado`, `sostenido` y `|vy| < 120`, la mitad.

- [x] **Paso 1: unitarias de ajustes** (`ajustes.test.ts`): el JSON pasa la validación; un campo faltante o no numérico lanza un error que lo nombra; `derivarFisica(AJUSTES_POR_DEFECTO.salto)` da `gSubida ≈ 3601`, `v0 ≈ 1368.4`, `gBajada ≈ 7133` y `vCorte ≈ 710` (`toBeCloseTo`, 0 decimales).
- [x] **Paso 2:** que falle → implementar → que pase.
- [x] **Paso 3: unitarias del salto** (`salto.test.ts`). Usan un ayudante de prueba `simular(f, sostenerMs, dtFrameMs)` que llama a `pasoSalto` por frame e integra la posición a 120 pasos fijos por segundo, como Arcade en la escena:
  - `salta desde el suelo con vy = -v0 y emite 'salto'`;
  - `coyote: salta a 100 ms de dejar el suelo, no a 101 ms` (pasos de `dtMs = 1`);
  - `búfer: Saltar 130 ms antes de aterrizar salta al tocar suelo; 131 ms no`;
  - `no hay doble salto: sin suelo, tras un salto, el coyote no aplica`;
  - `toque corto ≈ alturaMin (±10 %) y mantener ≈ alturaMax (±3 %)`;
  - `cae con gBajada > gSubida`;
  - `la altura máxima es la misma con frames de 8.3, 16.7 y 33.3 ms (±2 %)`;
  - `apiceColgado apagado no cambia la gravedad; encendido la reduce a la mitad cerca del ápice`.
- [x] **Paso 4:** que falle → implementar `salto.ts` → que pase.
- [x] **Paso 5:** `npm test`, `npm run build`. Commit: `T-004: agrega los ajustes y la lógica del salto`.

---

### Tarea 3: Intenciones, joystick, disposición y asignación de dedos (lógica pura)

**Archivos:** crear en `src/controles/` `intenciones.ts`, `joystick.ts`, `disposicion.ts` y `controlTactil.ts`, cada uno con su test.

**Interfaces:**
- Consume: `Ajustes` (tarea 2).
- Produce:
  ```ts
  type Intenciones = { direccion: -1 | 0 | 1; saltarSostenido: boolean;
                       saltarPresionado: boolean; brazosPresionado: boolean };
  crearIntenciones(): Intenciones
  limpiarFlancos(i: Intenciones): void      // *Presionado = false; se llama al final de cada update
  direccionJoystick(dx: number, previa: -1 | 0 | 1, radio: number, activa: number, suelta: number): -1 | 0 | 1
  limitarPerilla(dx: number, dy: number, radio: number, salida: { x: number; y: number }): void
  type Circulo = { x: number; y: number; r: number };
  type Disposicion = { zonaJoystick: { x: number; y: number; ancho: number; alto: number };
                       saltar: Circulo; brazos: Circulo };
  calcularDisposicion(ancho: number, alto: number, a: Ajustes, salida: Disposicion): void
  class ControlTactil {
    constructor(intenciones: Intenciones, ajustes: Ajustes);
    readonly joystick: { id: number; origenX: number; origenY: number; dx: number; dy: number }; // id -1 = libre
    abajo(id: number, x: number, y: number, d: Disposicion): void;
    mover(id: number, x: number, y: number): void;
    arriba(id: number): void;
    soltarTodo(): void;
    revisar(estaAbajo: (id: number) => boolean): void;  // antídoto anti-pegado
  }
  ```
- Disposición:
  - zona del joystick: de `x = margenBorde` a `ancho / 2`, de `y = margenAbajo` a `alto - margenAbajo`;
  - `saltar`: `{ x: ancho - 140, y: alto - 130, r: radioToque }`; `brazos`: `{ x: ancho - 310, y: alto - 250, r: radioToque }`.

- [x] **Paso 1: unitarias** (nombres y asserts clave):
  - `direccionJoystick`: `dx = 0.2·radio` desde 0 → 0; `0.26·radio` → 1; ya en 1, `0.16·radio` → 1 y `0.14·radio` → 0; lo mismo hacia −1.
  - `limitarPerilla`: `(300, 0)` con radio 75 → `(75, 0)`; `(30, 40)` queda igual.
  - `calcularDisposicion`: con 1280 y 1872 de ancho, `saltar` y `brazos` no se solapan (distancia entre centros − 2r ≥ 40); ningún círculo baja de `alto - 40`; la zona del joystick empieza en 48.
  - `ControlTactil`:
    - `dedo en el joystick a la derecha → direccion 1; arriba → 0`;
    - `dedo en saltar → saltarPresionado y saltarSostenido; arriba → sostenido false`;
    - `joystick y saltar a la vez con dos ids no se estorban`;
    - **(foco 1)** `dedo que empieza en el joystick y se mueve sobre saltar no salta`;
    - **(foco 2)** `un tercer dedo en la zona del joystick ocupada no le roba el control`;
    - `un toque en la franja de 48 px del borde no activa el joystick`;
    - `brazos da brazosPresionado una vez por toque`;
    - `revisar suelta el joystick si su dedo ya no está abajo`;
    - `soltarTodo deja direccion 0 y nada sostenido`.
- [x] **Paso 2:** que falle → implementar → que pase.
- [x] **Paso 3:** `npm test`, `npm run build`. Commit: `T-004: agrega el joystick y la asignación de dedos`.

---

### Tarea 4: Calle de prueba y regla de plataformas (datos + lógica pura)

**Archivos:** crear `src/datos/calle-prueba.json`, `src/datos/plataformas.ts` y `src/datos/plataformas.test.ts`.

**Interfaces:**
- Consume: `Fisica`, `derivarFisica`, `AJUSTES_POR_DEFECTO` (tarea 2).
- Produce:
  ```ts
  type Bloque = { nombre: string; x: number; ancho: number; alto: number; sobre?: string };
  validarBloques(datos: unknown): Bloque[]                // forma: textos, números > 0, nombres únicos, `sobre` existente
  type Limites = { escalonMax: number; escalonCorto: number; alturaMax: number; distanciaMax: number; grosorMin: number };
  limitesDeSalto(a: Ajustes): Limites                     // alturaMax 400 y grosorMin 32 fijos
  alturaSuperior(b: Bloque, todos: readonly Bloque[]): number      // alto + altura superior del bloque de abajo
  revisarCalle(bloques: readonly Bloque[], l: Limites): string[]   // errores en español; [] si todo bien
  esDeToqueCorto(b: Bloque, todos: readonly Bloque[], l: Limites): boolean
  BLOQUES_CALLE_PRUEBA: readonly Bloque[]
  ```
- Límites:
  - `escalonMax = 0.85 · alturaMax del salto`; `escalonCorto = 0.85 · alturaMin`;
  - `distanciaMax = 0.85 · velocidad · (tiempoSubida + tiempoCaida)`.
- `revisarCalle` reporta:
  - un bloque `sobre` otro que se sale de él en `x`;
  - `alto < grosorMin`;
  - altura superior `> alturaMax`;
  - un bloque **inalcanzable**: alcance como búsqueda en anchura desde la calle (altura 0, todo `x`). Un bloque B se alcanza desde una superficie S alcanzada si `alturaSuperior(B) − altura(S) ≤ escalonMax` y la distancia horizontal entre sus bordes es `≤ distanciaMax` (0 si se tocan o se solapan). Desde la calle, solo cuenta la diferencia de altura.
- Calle de prueba (≈ 4800 px de ancho; los valores exactos los afina quien implemente, siempre que la unitaria pase):
  - banqueta (alto 40, larga);
  - bote (60 sobre la banqueta);
  - auto (140, en la calle);
  - casa (340 sobre la banqueta: techo a 380);
  - pórtico (140 sobre la banqueta, pegado a la casa: 180);
  - dos o tres adornos de Halloween de ejemplo: calabaza, lápida y cerca.

- [x] **Paso 1: unitarias:**
  - `la calle de prueba cumple la regla` (`revisarCalle(BLOQUES_CALLE_PRUEBA, limitesDeSalto(AJUSTES_POR_DEFECTO))` → `[]`);
  - `un bloque de 450 rompe la altura máxima`;
  - `un bloque a 230 sobre la calle sin escalón intermedio es inalcanzable`;
  - `el techo es alcanzable solo encadenando el pórtico` (sin el pórtico, error);
  - `un bloque de 20 de alto rompe el grosor`;
  - `la banqueta es de toque corto y el auto no`;
  - `si el salto crece, los límites crecen` (alturaMax 320 → escalonMax 272);
  - `validarBloques rechaza un sobre inexistente y nombres repetidos`.
- [x] **Paso 2:** que falle → implementar → que pase.
- [x] **Paso 3:** `npm test`, `npm run build`. Commit: `T-004: agrega la calle de prueba y su regla de plataformas`.

---

### Tarea 5: Escena `CallePrueba` y controles en pantalla

**Archivos:** crear `src/escenas/CallePrueba.ts`, `src/escenas/ControlesTactiles.ts` y `src/plataforma/vigiaFps.ts` (+ test); modificar `src/escenas/Arranque.ts`, `src/main.ts` y `e2e/controles.e2e.ts`.

**Interfaces:**
- Consume: todo lo anterior. Los ajustes vigentes se leen de `this.registry.get('ajustes') as Ajustes`; `main.ts` los pone con `game.registry.set('ajustes', structuredClone(AJUSTES_POR_DEFECTO))`.
- Produce `class VigiaFps { constructor(umbralFps = 40, sostenidoMs = 3000); registrar(dtMs: number): boolean }`: `true` una sola vez, cuando el fps (`1000 / dtMs`) se queda bajo el umbral durante `sostenidoMs` seguidos. Un frame bueno reinicia la cuenta.
- Produce `class CallePrueba extends EscenaBase` (key `'CallePrueba'`). Campos públicos de solo lectura para los e2e: `miVo` (rectángulo con cuerpo Arcade), `intenciones`, `controles` y `ultimoEvento` (el último `evento` del salto).
- Produce `class ControlesTactiles` con `constructor(escena: EscenaBase, control: ControlTactil, ajustes: Ajustes)`, `reacomodar(ancho: number, alto: number): void` y `revisar(): void`.
- Evento de cambio de ajustes: `'ajustes-cambiados'` en `game.events` (lo emite el panel de la tarea 6).

Comportamiento:
- **Física:** `super({ key: 'CallePrueba', physics: { default: 'arcade', arcade: { fps: 120, gravity: { x: 0, y: 0 } } } })`.
- **Mundo:**
  - calle con su parte superior en `y = 620`; mundo de `x` 0 a 4800 y de `y` −400 a 720;
  - bloques estáticos desde `BLOQUES_CALLE_PRUEBA` (grises, con su nombre en texto pequeño);
  - Mi vo: rectángulo naranja de 90×200, `setMaxVelocity(velocidad, caidaMax)`, `bounce` 0, colisiona con calle y bloques.
- **`update(t, delta)`:**
  1. `controles.revisar()`;
  2. `vx = direccion · velocidad`;
  3. `pasoSalto(...)` con `body.blocked.down` y `body.velocity.y`; aplica `salida.vy` si no es `null` y `setGravityY(salida.gravedad)`;
  4. si `brazosPresionado`: destello en Mi vo y el texto "¡Brazos!" con un tween corto;
  5. `vigiaFps.registrar(delta)` → aviso de una vez arriba al centro: "Modo de bajo consumo: el juego puede ir a 30 fps";
  6. `limpiarFlancos`.

  Sin asignaciones: `salida`, `disposicion` e `intenciones` son campos que se crean en `create()`.
- **Cámara:**
  - `startFollow(miVo, true, 1, 0.15)`, con `setBounds(0, -400, 4800, 1120)` y zona muerta de `ancho·0.25` × 300;
  - con esa zona muerta, los saltitos no mueven la cámara y el techo sí;
  - quien implemente puede afinar estos valores sin cambiar la idea.
- **Controles:**
  - `this.input.on('pointerdown' | 'pointermove' | 'pointerup', ...)` traduce `pointer.x/y` (de pantalla, no de mundo) a `ControlTactil`;
  - los gráficos van con `setScrollFactor(0)` y una profundidad alta;
  - joystick: una base tenue fija en reposo en la zona del joystick; al tocar, base y perilla aparecen donde cayó el dedo;
  - botones: círculo con su letra, más claro mientras se presiona.
- **Listeners** con `escuchar()`:
  - `scale` `RESIZE` → `calcularDisposicion` + `controles.reacomodar` (sin soltar los dedos);
  - `game.events` `Phaser.Core.Events.HIDDEN` y `BLUR` → `soltarTodo()`;
  - `game.events` `'ajustes-cambiados'` → recalcular la física, `setMaxVelocity` y la disposición;
  - `input` `GAME_OUT` → `soltarTodo()`. Este emisor muere con la escena, así que basta con `this.input.on`.
- **`init()`** reinicia el estado (ESC-03): `crearEstadoSalto()`, intenciones nuevas y vigía nueva.
- **`Arranque`:** después del toque que hace sonar la prueba (o de mostrar el motivo sin sonido), `this.time.delayedCall(800, () => this.scene.start('CallePrueba'))`. En `main.ts`, `scene: [Arranque, CallePrueba]`.

- [x] **Paso 1: unitaria de `VigiaFps`:**
  - `40 frames de 33 ms (≈ 1.3 s) no avisan; 3 s seguidos sí, una sola vez`;
  - `un frame de 16 ms en medio reinicia la cuenta`.
- [x] **Paso 2:** que falle → implementar → que pase.
- [x] **Paso 3: e2e** (en `e2e/controles.e2e.ts`; un ayudante `entrarALaCalle(page)` abre `./?depurar`, toca y espera a que `CallePrueba` esté activa). Si la tarea 1 descartó los dos dedos, los casos de dos dedos se omiten con la nota del paso 6 de esa tarea.
  - `tras el primer toque llega a la calle de prueba`;
  - `joystick a la derecha mueve a Mi vo a la derecha y al soltar frena en el siguiente frame` (`velocity.x` 360 → 0);
  - `joystick a la izquierda mueve a la izquierda`;
  - `Saltar despega (velocity.y < 0) y Mi vo vuelve al suelo` (`blocked.down`);
  - `joystick y Saltar a la vez: avanza y despega`;
  - **(foco 1)** `deslizar del joystick hasta Saltar no salta`;
  - `touchcancel suelta el joystick` (`direccion` 0);
  - **(foco 3)** `con el dedo en el joystick, cambiar el tamaño de la página no lo suelta` (`page.setViewportSize` → `direccion` sigue en 1);
  - **(foco 4)** `HIDDEN suelta todo` (`__juego.events.emit('hidden')` → `direccion` 0);
  - **(foco 5)** `reiniciar la escena 5 veces no duplica listeners`: `listenerCount` de `scale` `'resize'` y de `game.events` `'hidden'`, `'blur'` y `'ajustes-cambiados'` igual que tras el primer arranque. Además, un toque en Saltar sigue dando un solo `'salto'`;
  - `la franja de 48 px del borde izquierdo no activa el joystick`.
- [x] **Paso 4:** que falle → implementar `CallePrueba`, `ControlesTactiles` y los cambios en `Arranque` y `main.ts` → que pase.
- [x] **Paso 5:** revisar a mano con `npm run dev -- --host` desde la Mac (y el iPhone si está a la mano), con el checklist de PR del skill `rendimiento-y-memoria`.
- [x] **Paso 6:** `npm test`, `npm run build`, `npm run test:e2e`. Commit: `T-004: agrega la calle de prueba con controles táctiles`.

---

### Tarea 6: Panel de `?depurar`

**Archivos:** crear `src/depurar/panelAjustes.ts`; modificar `src/depurar/depurar.ts`, `src/main.ts` y `e2e/controles.e2e.ts`.

**Interfaces:**
- Consume: `Ajustes` (el objeto vivo de `game.registry`) y el evento `'ajustes-cambiados'`.
- Produce: `montarPanel(game: Phaser.Game, ajustes: Ajustes, doc: Document = document): void`, que se llama desde `main.ts` solo con `?depurar`.

Comportamiento:
- Botón "⚙︎" fijo arriba al centro (fuera de las franjas de 40 px de arriba y de 48 px de los lados). Abre y cierra un panel HTML encima del juego.
- El panel lleva `touch-action: auto` y `user-select: text`, para que sus controles funcionen a pesar de las reglas de `body`. Mientras está abierto, los toques en él no llegan al juego.
- Deslizadores (`input type="range"`), con su valor a un lado:
  - altura máxima (150–400) y mínima (30–150);
  - tiempo de subida (0.2–0.6) y de caída (0.15–0.5);
  - velocidad (200–600);
  - coyote (0–200) y búfer (0–250);
  - radio de toque (50–110);
  - `derecha` y `abajo` de cada botón (60–500);
  - además, una casilla de "ápice colgado".
- Cada cambio escribe en el objeto `ajustes` y emite `'ajustes-cambiados'`: el efecto es inmediato, sin recargar.
- "Copiar valores": `navigator.clipboard?.writeText(JSON.stringify(ajustes, null, 2))`. Si no existe o falla (página en `http`), muestra el JSON en un `<textarea>` seleccionable con la nota "Cópialo a mano".

- [x] **Paso 1: e2e:**
  - `con ?depurar aparece el botón y abre el panel`;
  - `sin ?depurar no hay panel`;
  - `cambiar la velocidad en el panel cambia la velocidad de Mi vo al instante` (fijar el range a 500 y disparar `input` → joystick a la derecha → `velocity.x` 500);
  - `Copiar valores sin portapapeles muestra el JSON`: borrar `navigator.clipboard` con `addInitScript`; el `textarea` contiene `"alturaMax"`.
- [x] **Paso 2:** que falle → implementar → que pase.
- [x] **Paso 3:** `npm test`, `npm run build`, `npm run test:e2e`. Commit: `T-004: agrega el panel de ajustes de ?depurar`.

---

### Tarea 7: Documentación, verificación y PR

**Archivos:** modificar `docs/diseno/ideas.md`, `docs/diseno/CAMBIOS.md` y `docs/tareas/T-004-prueba-controles.md` (criterios de esta rama y bitácora).

- [x] **Paso 1:** en `ideas.md`, dos ideas:
  - **agacharse** con el joystick hacia abajo;
  - **gestos de Brazos**: toque = golpe, doble toque = patada, mantener = agarrar.

  En `CAMBIOS.md`, una línea con fecha y el porqué. Ninguna cambia el diseño vigente.
- [x] **Paso 2:** bitácora de T-004:
  - el resultado del paso 6 de la tarea 1 (si el e2e de dos dedos funcionó);
  - cualquier desvío del plan.
- [ ] **Paso 3:** verificación final: `npm test`, `npm run test:e2e` y `npm run build` en verde. `superpowers:verification-before-completion`.
- [ ] **Paso 4:** revisión del branch completo con `code-reviewer-opus55`, que lleva el checklist del skill `rendimiento-y-memoria` y el foco de revisión de este plan.
- [ ] **Paso 5:** push y PR con la tabla de prueba manual de abajo. El merge lo hace el product owner, tras su ronda en el iPhone.

## Pruebas

### Unitarias (`npm test`)

| Archivo | Qué cubre |
|---|---|
| `src/plataforma/gestos.test.ts` | Cancela los tres eventos de gesto, sin listeners pasivos |
| `src/movimiento/ajustes.test.ts` | Validación del JSON y física derivada (3601, 1368, 7133, 710) |
| `src/movimiento/salto.test.ts` | Coyote 100/101, búfer 130/131, sin doble salto, toque corto contra mantener, gravedad por fase, independencia del framerate, ápice |
| `src/controles/joystick.test.ts` | Zona muerta con histéresis y tope de la perilla |
| `src/controles/disposicion.test.ts` | Márgenes y sin solapes en 1280 y 1872 |
| `src/controles/controlTactil.test.ts` | Un dedo por control, dedo que se desliza (foco 1), tercer dedo (foco 2), franja del borde, antídoto y `soltarTodo` |
| `src/datos/plataformas.test.ts` | La calle de prueba cumple la regla; alcance encadenado; límites que crecen con el salto; validación |
| `src/plataforma/vigiaFps.test.ts` | Aviso de 30 fps sostenidos, una sola vez |

### e2e (`npm run test:e2e`, `e2e/controles.e2e.ts`)

- Dos dedos sintéticos a la vez en Phaser (valida el truco; si no funciona, ver tarea 1, paso 6).
- Sin scroll ni gestos del navegador: `defaultPrevented`, `scrollY === 0` y `touch-action`.
- Arranque → calle; caminar, frenar, saltar, joystick y Saltar a la vez, deslizar a Saltar sin saltar, `touchcancel`, cambio de tamaño con el dedo abajo, `HIDDEN`, 5 reinicios sin listeners duplicados y la franja del borde.
- `?depurar`: el panel aparece solo con el parámetro, aplica cambios al instante y tiene el respaldo de "Copiar valores".
- Los e2e de T-003 siguen pasando.

### Manual en el iPhone 13 (va en la descripción del PR)

En la red local (`npm run dev -- --host`): primero en Safari y después desde el ícono de la pantalla de inicio agregado desde esa URL. Los casos marcados con ★ se repiten en los dos modos.

| # | Paso | Resultado esperado |
|---|---|---|
| 1 ★ | Mover el joystick a la derecha y luego a la izquierda | Mi vo arranca en ese instante, sin lag |
| 2 ★ | Soltar el joystick mientras camina | Frena en seco, sin resbalar |
| 3 | Un toque corto en Saltar | Saltito: sube a la banqueta, no al auto |
| 4 | Mantener Saltar junto al auto y al pórtico | Sube a los dos |
| 5 | Desde el pórtico, saltar al techo | Llega encadenando saltos; la cámara sube con ella |
| 6 ★ | Caminar y saltar con los dos pulgares a la vez, 2 minutos seguidos | Nunca se traba ni ignora un dedo |
| 7 | Tocar Brazos mientras caminas | Destello y "¡Brazos!", sin frenar |
| 8 ★ | Usar el joystick cerca del borde izquierdo | La página no regresa ni se mueve |
| 9 | Empezar a arrastrar desde el borde mismo de la pantalla | Anotar si Safari va hacia atrás (en Safari se espera que sí; en la pantalla de inicio, no) |
| 10 | Pellizcar, doble toque rápido y mantener un dedo 30 s | Sin zoom, lupa, selección ni menú |
| 11 | Deslizar desde arriba y desde abajo a mitad del juego, y volver | Nada queda pegado |
| 12 | Abrir el Centro de control o recibir una notificación con un dedo abajo | Al volver, joystick y botones están sueltos |
| 13 | Ir a la pantalla de inicio del iPhone y regresar | Sin cámara lenta; controles sueltos |
| 14 | En Safari, hacer que las barras aparezcan o se escondan mientras caminas | Se reacomoda sin soltar el joystick |
| 15 | Activar el modo de bajo consumo y jugar 5 s | Aparece el aviso de 30 fps una vez |
| 16 | Mirar el rectángulo de Mi vo junto a las cajas | Anotar si el tamaño se siente correcto para el personaje |
| 17 | Con `?depurar`, cambiar la altura, los tiempos y la velocidad hasta que se sienta bien; "Copiar valores" | Efecto inmediato; el JSON se copia o aparece para copiarlo a mano |
| 18 | Veredicto | Plan A, A′ o B, con el porqué. Se anota en la bitácora |

Por cada fila que falle, el agente responde si se corrige con ajustes o si es casi imposible en web (ver "Qué es falla").

### Capas que no aplican

Ninguna: las tres aplican.

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Orquestación, decisiones y PR (esta sesión) | Opus | `high` | Referencia por rol |
| Tarea 1 (base táctil y validación del e2e) | Sonnet | `high` | Sigue una receta, pero el truco del evento sintético es un riesgo: necesita razonar si falla |
| Tarea 2 (ajustes y salto) | Opus | `medium` | Es física; un error en coyote o búfer se siente aunque los tests pasen. Las fórmulas ya están dadas, así que no hace falta `high` |
| Tarea 3 (joystick y dedos) | Sonnet | `medium` | Lógica pura con interfaces y casos ya definidos |
| Tarea 4 (calle y regla) | Sonnet | `medium` | Búsqueda en anchura sencilla con los casos ya definidos |
| Tarea 5 (escena y controles) | Opus | `high` | Integra todo: input, física, cámara, listeners y las reglas de memoria. Es donde más fallas sutiles caben |
| Tarea 6 (panel `?depurar`) | Sonnet | `medium` | DOM sencillo con e2e definidos |
| Tarea 7, pasos 1–2 (docs y bitácora) | Haiku | `low` | Mecánico |
| Revisión de cada tarea (spec y calidad) | Sonnet | `medium` | Una puerta barata entre tareas; la revisión fuerte va al final |
| Revisión final del branch | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol |

No se sugiere Fable: el riesgo está en la sensación en el iPhone, no en la complejidad del código. Si la tarea 5 falla dos veces con Opus, se escala según `docs/planes/README.md`.

## Riesgos y dudas del plan

- **El truco del evento sintético** puede no funcionar con Phaser. La tarea 1 lo valida primero y trae la alternativa.
- **El orden entre la física y `update()`:** Arcade avanza en el evento `UPDATE` de la escena, antes de `update()`, así que las intenciones se aplican al paso siguiente (≤ 1 frame). Si en el iPhone se siente lag por eso, se mueven al evento `PRE_UPDATE`. Se anota en la bitácora si pasa.
- **Los valores de cámara y de los botones son estimaciones.** Por eso existe el panel. Afinar no es un desvío del plan.

## Desvíos durante la implementación

La bitácora de [T-004](../tareas/T-004-prueba-controles.md) (2026-10-17) lista los desvíos. Los que cambian lo escrito arriba son estos:

- **Tarea 2, reglas 1, 3 y 4 de `pasoSalto`:** el búfer se compara con `>= 0`, y el corte de altura variable aplica también en el frame del salto.
- **Tarea 3, disposición:** los valores 140/130/310/250 son solo los valores por defecto. La posición se calcula desde `ajustes.botones`.
- **Tarea 4, `validarBloques`:** `sobre` debe apuntar a un bloque anterior en la lista.
- **Tarea 5, suelo para el salto:** `enSuelo = blocked.down && velocity.y >= 0`.
- **Tarea 6:** se agregó `topeVertical` (`max(caidaMax, v0)`) para que el tope de caída no recorte la subida.
- **Revisión final:** el joystick se reancla tras un cambio de tamaño, para que las barras de Safari no muevan su origen, y `touchcancel` suelta todos los controles.

# Ronda 2: correcciones tras la primera prueba en el iPhone

Decisiones del product owner del 2026-10-17 (bitácora de T-004). Entran en el mismo PR #12. Pruebas definidas aquí, antes de programar.

### Tarea 8: escalón de la casa y regla de regreso

**Bug:** después de subir al techo y caer del lado de la cerca, no se puede regresar a la izquierda. El techo de la casa está a 380 y la banqueta de su derecha a 40: un muro de 340, y `escalonMax` es 221. `revisarCalle` no lo vio porque solo revisa *llegar* a cada bloque y trata la calle como alcanzable en todos lados.

**Corrección de datos:** `src/datos/calle-prueba.json` agrega un `barril` sobre la banqueta, pegado a la derecha de la casa: `x 3720, ancho 120, alto 160` (cara de arriba a 200). Escalones: banqueta → barril 160 y barril → techo 180, los dos menores que 221.

**Corrección de la regla** (`src/datos/plataformas.ts`): `revisarCalle` cambia la búsqueda de alcance por un **perfil** de la calle:

1. El perfil es la silueta vista de lado: tramos de x con la altura del bloque más alto que los cubre (o la calle, a 0). Cada tramo lleva el nombre de ese bloque (o `calle`).
2. De un tramo se pasa a otro si sube a lo más `escalonMax` y además: es el vecino, o está a lo más a `distanciaMax` y todo lo que hay en medio es más bajo que los dos (un hoyo angosto se salta). Bajar siempre se puede.
3. Desde el **inicio** (el tramo en x = 0, donde arranca Mi vo) se tiene que llegar a todos los tramos, y desde todos se tiene que poder **regresar** al inicio. Errores: `"<nombre>" (x a a b) es inalcanzable desde el inicio` y `desde "<nombre>" (x a a b) no se puede regresar al inicio`.

Sigue sin Phaser. Las demás revisiones (altura máxima, grosor, se sale) no cambian.

### Tarea 9: casilla de velocidad proporcional en `?depurar`

- `ajustes.json` agrega `caminar.proporcional: false` y `caminar.velocidadMinima: 0.3` (fracción de la velocidad). `validarAjustes` los exige.
- `src/controles/joystick.ts` agrega `fuerzaJoystick(dx, radio, activa)`: 0 en el umbral de activación, 1 en el borde del radio, recortada a 0..1 y simétrica.
- `Intenciones` agrega `fuerza` (0..1). `ControlTactil.mover` la llena y soltar el joystick la pone en 0.
- `src/movimiento/caminar.ts` (nuevo) agrega `velocidadCaminar(direccion, fuerza, caminar)`: con la casilla apagada da `direccion · velocidad`; prendida, `direccion · velocidad · (velocidadMinima + (1 − velocidadMinima) · fuerza)`. La escena la usa en lugar de `direccion · velocidad`. Sin asignaciones en `update()`.
- El panel agrega la casilla "Velocidad proporcional" y el deslizador "Velocidad mínima (%)" (0.1 a 1). "Copiar valores" los incluye solo, porque copia `ajustes`.

**Decisión del orquestador, a confirmar:** la velocidad mínima (30 % al empezar a mover el pulgar) evita que Mi vo arranque casi quieta justo después de la zona muerta. Se afina con el deslizador.

### Pruebas de la ronda 2

**Unitarias:**

| Archivo | Qué cubre |
|---|---|
| `src/datos/plataformas.test.ts` | La calle con el barril cumple la regla. Sin el barril, error de "no se puede regresar" que nombra la banqueta (el bug). Un hoyo entre dos muros altos atrapa (error de regreso), pero el muro del otro lado no queda inalcanzable porque el hoyo angosto se salta. Un hoyo más ancho que `distanciaMax` sí corta el paso. Los casos actuales siguen pasando |
| `src/controles/joystick.test.ts` | `fuerzaJoystick`: 0 en el umbral, 1 en el radio, recorte más allá del radio, simetría con dx negativo |
| `src/movimiento/caminar.test.ts` | Apagada: velocidad completa con cualquier fuerza. Prendida: mínima con fuerza 0, completa con 1, lineal en medio. Dirección 0 da 0 |
| `src/controles/controlTactil.test.ts` | `mover` llena `fuerza`; soltar, `revisar` y `soltarTodo` la ponen en 0 |
| `src/movimiento/ajustes.test.ts` | `proporcional` tiene que ser booleano y `velocidadMinima` número; el JSON trae la casilla apagada |

**e2e** (`e2e/controles.e2e.ts`):

- Con la casilla prendida (clic en el panel), un arrastre corto da `velocity.x` menor que uno largo. Con la casilla apagada, los dos dan la velocidad completa.
- El barril: no hay e2e. Es un cambio de datos que cubren la regla unitaria y la prueba manual; recorrer la calle con toques sintéticos sería lento y frágil.

**Manual en el iPhone** (filas nuevas en la descripción del PR):

| # | Paso | Resultado esperado |
|---|---|---|
| 19 | Subir al techo, bajar del lado de la cerca y regresar a la izquierda | Sube por el barril al techo y vuelve al inicio |
| 20 | En `?depurar`, prender "Velocidad proporcional" y caminar con el pulgar cerca y lejos del origen | Más lento cerca, completo lejos. Comparar con la fija y decidir cuál queda |

### Modelo y esfuerzo de la ronda 2

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Orquestación y PR (esta sesión) | Opus | `high` | Referencia por rol |
| Tarea 8 (perfil y regla de regreso) | Sonnet | `medium` | Lógica pura con el algoritmo y los casos ya definidos |
| Tarea 9 (velocidad proporcional) | Sonnet | `medium` | Funciones puras, un cambio de una línea en la escena y un control más en el panel |
| Revisión final de la ronda | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol |

### Casillas de la ronda 2

- [ ] Tarea 8 con sus pruebas, commit.
- [ ] Tarea 9 con sus pruebas, commit.
- [ ] `npm test`, `npm run test:e2e` y `npm run build` en verde.
- [ ] Revisión con `code-reviewer-opus55`.
- [ ] Push al PR #12 y filas 19 y 20 en su descripción.
