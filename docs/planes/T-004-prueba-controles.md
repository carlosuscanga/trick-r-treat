# Plan T-004: Prueba de controles táctiles

Tarea: [T-004](../tareas/T-004-prueba-controles.md)

> **Estado:** diseño en revisión. Cuando el product owner lo apruebe, se agregan las secciones Archivos, Pasos, Pruebas y Modelo y esfuerzo.

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
- Config del juego: solo las líneas que la tarea necesita (`activePointers`). `panicMax: 0` (al volver del segundo plano no hay cámara lenta) se agrega aquí si el builder confirma que afecta la sensación del salto; si no, queda para T-038.

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
