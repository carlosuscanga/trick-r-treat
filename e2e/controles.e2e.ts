import { expect, test, type Page } from '@playwright/test';
import { tocar } from './tactil';

// e2e de los controles táctiles. Que se sientan bien se prueba a mano en el iPhone.

// game.input es el InputManager. pointers[0] es el ratón; los táctiles son 1..3.
function punterosAbajo(page: Page) {
  return page.evaluate(() => window.__juego!.input.pointers.slice(1).filter((p) => p.isDown).length);
}

async function esperarJuego(page: Page) {
  await page.waitForFunction(() => !!window.__juego?.scene.isActive('Arranque'));
}

test.describe('con ?depurar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./?depurar');
    await esperarJuego(page);
  });

  test('dos dedos sintéticos quedan abajo a la vez en Phaser', async ({ page }) => {
    await tocar(page, 'touchstart', [{ id: 1, x: 300, y: 500 }]);
    await tocar(page, 'touchstart', [{ id: 2, x: 1100, y: 600 }]);
    expect(await punterosAbajo(page)).toBe(2);

    await tocar(page, 'touchend', [{ id: 1, x: 300, y: 500 }]);
    expect(await punterosAbajo(page)).toBe(1);

    await tocar(page, 'touchend', [{ id: 2, x: 1100, y: 600 }]);
    expect(await punterosAbajo(page)).toBe(0);
  });

  test('arrastrar sobre el canvas no hace scroll ni deja pasar el gesto', async ({ page }) => {
    const empezo = await tocar(page, 'touchstart', [{ id: 1, x: 300, y: 500 }]);
    const movio = await tocar(page, 'touchmove', [{ id: 1, x: 300, y: 200 }]);
    await tocar(page, 'touchend', [{ id: 1, x: 300, y: 200 }]);

    expect(empezo).toBe(true);
    expect(movio).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const touchAction = await page.evaluate(() => [
      getComputedStyle(document.querySelector('canvas')!).touchAction,
      getComputedStyle(document.getElementById('game')!).touchAction,
    ]);
    expect(touchAction).toEqual(['none', 'none']);
  });
});

test('sin ?depurar no existe window.__juego', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => window.__juego)).toBeUndefined();
});

test('sin cámara lenta al volver y con 3 dedos táctiles (config de la tarea 1)', async ({ page }) => {
  await page.goto('./?depurar');
  await esperarJuego(page);
  const config = await page.evaluate(() => ({
    panicMax: window.__juego!.loop.panicMax,
    punteros: window.__juego!.input.pointers.length,
  }));
  // pointers[0] es el ratón; 1..3 son los táctiles.
  expect(config).toEqual({ panicMax: 0, punteros: 4 });
});

// --- Calle de prueba ---------------------------------------------------------

// Lo que los e2e leen de la escena CallePrueba (sus campos públicos de solo lectura).
type Circulo = { x: number; y: number; r: number };
type Disposicion = {
  saltar: Circulo;
  brazos: Circulo;
  zonaJoystick: { x: number; y: number; ancho: number; alto: number };
};

const JOY = { x: 300, y: 500 };

// Abre ./?depurar, da el primer toque y espera a que la calle esté activa y Mi vo en el suelo.
async function entrarALaCalle(page: Page) {
  await page.goto('./?depurar');
  await esperarJuego(page);
  await tocar(page, 'touchstart', [{ id: 99, x: 640, y: 360 }]);
  await tocar(page, 'touchend', [{ id: 99, x: 640, y: 360 }]);
  await esperarEnElSuelo(page);
}

async function esperarEnElSuelo(page: Page) {
  await page.waitForFunction(() => {
    const juego = window.__juego!;
    if (!juego.scene.isActive('CallePrueba')) return false;
    const calle = juego.scene.getScene('CallePrueba') as any;
    return !!calle.miVo?.body?.blocked.down;
  });
}

// Espera a que termine el siguiente update() de la escena (POST_UPDATE va justo después).
function siguienteFrame(page: Page) {
  return page.evaluate(
    () =>
      new Promise<void>((listo) => {
        window.__juego!.scene.getScene('CallePrueba').events.once('postupdate', () => listo());
      }),
  );
}

function leerCalle(page: Page) {
  return page.evaluate(() => {
    const calle = window.__juego!.scene.getScene('CallePrueba') as any;
    const body = calle.miVo.body;
    return {
      vx: body.velocity.x as number,
      vy: body.velocity.y as number,
      enSuelo: body.blocked.down as boolean,
      direccion: calle.intenciones.direccion as number,
      joystickId: calle.controles.joystick.id as number,
      ultimoEvento: calle.ultimoEvento as string | null,
    };
  });
}

function disposicion(page: Page): Promise<Disposicion> {
  return page.evaluate(() => {
    const d = (window.__juego!.scene.getScene('CallePrueba') as any).disposicion;
    return JSON.parse(JSON.stringify(d));
  });
}

function esperarAterrizaje(page: Page) {
  return page.waitForFunction(
    () => (window.__juego!.scene.getScene('CallePrueba') as any).ultimoEvento === 'aterrizaje',
  );
}

// Pone un dedo en el joystick y lo lleva `dx` px a la derecha (o a la izquierda si es negativo).
async function joystick(page: Page, id: number, dx: number) {
  await tocar(page, 'touchstart', [{ id, ...JOY }]);
  await tocar(page, 'touchmove', [{ id, x: JOY.x + dx, y: JOY.y }]);
}

test.describe('calle de prueba', () => {
  test.beforeEach(async ({ page }) => {
    await entrarALaCalle(page);
  });

  test('tras el primer toque llega a la calle de prueba', async ({ page }) => {
    const estado = await page.evaluate(() => {
      const juego = window.__juego!;
      const calle = juego.scene.getScene('CallePrueba') as any;
      return {
        arranque: juego.scene.isActive('Arranque'),
        calle: juego.scene.isActive('CallePrueba'),
        // La física es de la escena (ESC-07), a 120 pasos por segundo y sin gravedad de mundo.
        fps: calle.physics.world.fps as number,
        gravedadMundo: calle.physics.world.gravity.y as number,
      };
    });
    expect(estado).toEqual({ arranque: false, calle: true, fps: 120, gravedadMundo: 0 });
  });

  test('joystick a la derecha mueve a Mi vo a la derecha y al soltar frena en el siguiente frame', async ({ page }) => {
    await joystick(page, 1, 100);
    await siguienteFrame(page);
    expect((await leerCalle(page)).vx).toBe(360);

    await tocar(page, 'touchend', [{ id: 1, x: JOY.x + 100, y: JOY.y }]);
    await siguienteFrame(page);
    expect((await leerCalle(page)).vx).toBe(0);
  });

  test('joystick a la izquierda mueve a la izquierda', async ({ page }) => {
    await joystick(page, 1, -100);
    await siguienteFrame(page);
    expect((await leerCalle(page)).vx).toBe(-360);
  });

  test('Saltar despega (velocity.y < 0) y Mi vo vuelve al suelo', async ({ page }) => {
    const { saltar } = await disposicion(page);
    await tocar(page, 'touchstart', [{ id: 2, x: saltar.x, y: saltar.y }]);
    await siguienteFrame(page);
    const enElAire = await leerCalle(page);
    expect(enElAire.vy).toBeLessThan(0);
    expect(enElAire.ultimoEvento).toBe('salto');

    await tocar(page, 'touchend', [{ id: 2, x: saltar.x, y: saltar.y }]);
    await esperarAterrizaje(page);
    expect((await leerCalle(page)).enSuelo).toBe(true);
  });

  test('joystick y Saltar a la vez: avanza y despega', async ({ page }) => {
    const { saltar } = await disposicion(page);
    await joystick(page, 1, 100);
    await tocar(page, 'touchstart', [{ id: 2, x: saltar.x, y: saltar.y }]);
    await siguienteFrame(page);
    const estado = await leerCalle(page);
    expect(estado.vx).toBe(360);
    expect(estado.vy).toBeLessThan(0);
  });

  test('deslizar del joystick hasta Saltar no salta', async ({ page }) => {
    const { saltar, zonaJoystick } = await disposicion(page);
    const inicio = { x: zonaJoystick.x + zonaJoystick.ancho - 20, y: saltar.y };
    await tocar(page, 'touchstart', [{ id: 1, ...inicio }]);
    // Se desliza en pasos hasta quedar encima de Saltar.
    for (let paso = 1; paso <= 4; paso++) {
      const x = inicio.x + ((saltar.x - inicio.x) * paso) / 4;
      await tocar(page, 'touchmove', [{ id: 1, x, y: saltar.y }]);
    }
    await siguienteFrame(page);
    await siguienteFrame(page);
    const estado = await leerCalle(page);
    expect(estado.ultimoEvento).not.toBe('salto');
    expect(estado.enSuelo).toBe(true);
    expect(estado.direccion).toBe(1); // el dedo sigue siendo del joystick
  });

  test('touchcancel suelta el joystick', async ({ page }) => {
    await joystick(page, 1, 100);
    expect((await leerCalle(page)).direccion).toBe(1);
    await tocar(page, 'touchcancel', [{ id: 1, x: JOY.x + 100, y: JOY.y }]);
    expect((await leerCalle(page)).direccion).toBe(0);
  });

  test('con el dedo en el joystick, cambiar el tamaño de la página no lo suelta', async ({ page }) => {
    const anchoAntes = await page.evaluate(() => window.__juego!.scale.gameSize.width);
    await joystick(page, 1, 100);
    expect((await leerCalle(page)).direccion).toBe(1);

    // Como cuando aparecen o se esconden las barras de Safari.
    await page.setViewportSize({ width: 800, height: 310 });
    await page.waitForFunction((antes) => window.__juego!.scale.gameSize.width !== antes, anchoAntes);
    await siguienteFrame(page);
    await siguienteFrame(page);

    const estado = await leerCalle(page);
    expect(estado.direccion).toBe(1);
    expect(estado.joystickId).not.toBe(-1);
    expect(estado.vx).toBe(360);
    // La disposición se recalculó con el ancho nuevo.
    const { ancho, derecha } = await page.evaluate(() => ({
      ancho: window.__juego!.scale.gameSize.width,
      derecha: window.__juego!.registry.get('ajustes').botones.saltar.derecha as number,
    }));
    expect((await disposicion(page)).saltar.x).toBe(ancho - derecha);
  });

  test('HIDDEN suelta todo', async ({ page }) => {
    const { saltar } = await disposicion(page);
    await joystick(page, 1, 100);
    await tocar(page, 'touchstart', [{ id: 2, x: saltar.x, y: saltar.y }]);
    expect((await leerCalle(page)).direccion).toBe(1);

    const despues = await page.evaluate(() => {
      const juego = window.__juego!;
      juego.events.emit('hidden');
      const calle = juego.scene.getScene('CallePrueba') as any;
      return {
        direccion: calle.intenciones.direccion,
        sostenido: calle.intenciones.saltarSostenido,
        joystickId: calle.controles.joystick.id,
      };
    });
    expect(despues).toEqual({ direccion: 0, sostenido: false, joystickId: -1 });
  });

  test('reiniciar la escena 5 veces no duplica listeners', async ({ page }) => {
    const contar = () =>
      page.evaluate(() => {
        const juego = window.__juego!;
        return {
          resize: juego.scale.listenerCount('resize'),
          hidden: juego.events.listenerCount('hidden'),
          blur: juego.events.listenerCount('blur'),
          ajustes: juego.events.listenerCount('ajustes-cambiados'),
          shutdown: juego.scene.getScene('CallePrueba').events.listenerCount('shutdown'),
        };
      });
    const antes = await contar();
    expect(antes.ajustes).toBe(1);

    for (let i = 0; i < 5; i++) {
      const frame = await page.evaluate(() => window.__juego!.loop.frame);
      await page.evaluate(() => window.__juego!.scene.getScene('CallePrueba').scene.restart());
      // stop y start se encolan: esperar un par de frames.
      await page.waitForFunction((f) => window.__juego!.loop.frame >= f + 2, frame);
    }
    await esperarEnElSuelo(page);
    expect(await contar()).toEqual(antes);

    // Un toque en Saltar sigue dando un solo salto: se cuentan los cambios de
    // ultimoEvento frame a frame hasta que vuelve a aterrizar.
    const { saltar } = await disposicion(page);
    await page.evaluate(() => {
      const calle = window.__juego!.scene.getScene('CallePrueba') as any;
      const w = window as any;
      w.__cuenta = { salto: 0, aterrizaje: 0 };
      let previo = calle.ultimoEvento;
      calle.events.on('postupdate', () => {
        const ahora = calle.ultimoEvento;
        if (ahora !== previo && ahora !== null) w.__cuenta[ahora]++;
        previo = ahora;
      });
    });
    await tocar(page, 'touchstart', [{ id: 2, x: saltar.x, y: saltar.y }]);
    await tocar(page, 'touchend', [{ id: 2, x: saltar.x, y: saltar.y }]);
    await page.waitForFunction(() => (window as any).__cuenta.aterrizaje >= 1);
    expect(await page.evaluate(() => (window as any).__cuenta)).toEqual({ salto: 1, aterrizaje: 1 });
  });

  test('la franja de 48 px del borde izquierdo no activa el joystick', async ({ page }) => {
    await tocar(page, 'touchstart', [{ id: 1, x: 20, y: JOY.y }]);
    await tocar(page, 'touchmove', [{ id: 1, x: 140, y: JOY.y }]);
    await siguienteFrame(page);
    const estado = await leerCalle(page);
    expect(estado.joystickId).toBe(-1);
    expect(estado.direccion).toBe(0);
    expect(estado.vx).toBe(0);
  });

  test('Brazos muestra el destello sin frenar', async ({ page }) => {
    const { brazos } = await disposicion(page);
    await joystick(page, 1, 100);
    await tocar(page, 'touchstart', [{ id: 2, x: brazos.x, y: brazos.y }]);
    await siguienteFrame(page);
    await siguienteFrame(page);
    const estado = await page.evaluate(() => {
      const calle = window.__juego!.scene.getScene('CallePrueba') as any;
      return { texto: calle.textoBrazos.alpha as number, vx: calle.miVo.body.velocity.x as number };
    });
    expect(estado.texto).toBeGreaterThan(0);
    expect(estado.vx).toBe(360);
  });
});

// --- Panel ?depurar ----------------------------------------------------------

// Fija el valor de un deslizador del panel y dispara `input`, como al arrastrarlo.
function fijarAjuste(page: Page, ruta: string, valor: number) {
  return page.evaluate(
    ({ ruta, valor }) => {
      const rango = document.querySelector<HTMLInputElement>(`input[data-ajuste="${ruta}"]`)!;
      rango.value = String(valor);
      rango.dispatchEvent(new Event('input', { bubbles: true }));
    },
    { ruta, valor },
  );
}

// Abre el panel con un clic. El ratón sale del canvas y Phaser lo procesa en el siguiente
// frame (GAME_OUT suelta los controles): se espera a que pase para no soltar el primer toque.
async function abrirPanel(page: Page) {
  await page.locator('#depurar-boton').click();
  await siguienteFrame(page);
  await siguienteFrame(page);
}

test.describe('panel ?depurar', () => {
  test('con ?depurar aparece el botón y abre el panel', async ({ page }) => {
    await page.goto('./?depurar');
    await esperarJuego(page);
    const boton = page.locator('#depurar-boton');
    const panel = page.locator('#depurar-panel');
    await expect(boton).toBeVisible();
    await expect(panel).toBeHidden();

    await boton.click();
    await expect(panel).toBeVisible();
    // Sus controles funcionan a pesar de las reglas de body, y el panel recibe los toques.
    const estilo = await panel.evaluate((el) => {
      const c = getComputedStyle(el);
      return [c.touchAction, c.userSelect, c.pointerEvents];
    });
    expect(estilo).toEqual(['auto', 'text', 'auto']);

    await boton.click();
    await expect(panel).toBeHidden();
  });

  test('sin ?depurar no hay panel', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('#depurar-boton')).toHaveCount(0);
    await expect(page.locator('#depurar-panel')).toHaveCount(0);
  });

  test('cambiar la velocidad en el panel cambia la velocidad de Mi vo al instante', async ({ page }) => {
    await entrarALaCalle(page);
    await abrirPanel(page);
    await fijarAjuste(page, 'caminar.velocidad', 500);
    await abrirPanel(page); // el segundo clic lo cierra y deja libre el joystick

    await joystick(page, 1, 100);
    await siguienteFrame(page);
    expect((await leerCalle(page)).vx).toBe(500);
  });

  test('con el panel abierto, los toques que caen sobre él no llegan al juego', async ({ page }) => {
    await entrarALaCalle(page);
    await abrirPanel(page);

    // El joystick queda debajo del panel: Phaser ve que el dedo no está sobre el canvas.
    await joystick(page, 1, 100);
    await siguienteFrame(page);
    const estado = await leerCalle(page);
    expect(estado.joystickId).toBe(-1);
    expect(estado.vx).toBe(0);
  });

  test('el panel cambia el objeto vivo y la disposición de los botones', async ({ page }) => {
    await entrarALaCalle(page);
    await abrirPanel(page);
    await fijarAjuste(page, 'botones.saltar.derecha', 300);
    const { ancho, derecha } = await page.evaluate(() => ({
      ancho: window.__juego!.scale.gameSize.width,
      derecha: window.__juego!.registry.get('ajustes').botones.saltar.derecha as number,
    }));
    expect(derecha).toBe(300);
    expect((await disposicion(page)).saltar.x).toBe(ancho - 300);
  });

  test('con altura 400 y subida 0.2 el salto no se recorta por el tope de caída', async ({ page }) => {
    await entrarALaCalle(page);
    await abrirPanel(page);
    await fijarAjuste(page, 'salto.alturaMax', 400);
    await fijarAjuste(page, 'salto.tiempoSubida', 0.2);
    await abrirPanel(page); // lo cierra

    const { saltar } = await disposicion(page);
    await tocar(page, 'touchstart', [{ id: 2, x: saltar.x, y: saltar.y }]);
    // El primer frame deja v0 sin pasar por la física; se mide desde el segundo, ya con el tope aplicado.
    await siguienteFrame(page);
    let vyMin = 0;
    for (let i = 0; i < 6; i++) {
      await siguienteFrame(page);
      vyMin = Math.min(vyMin, (await leerCalle(page)).vy);
    }
    await tocar(page, 'touchend', [{ id: 2, x: saltar.x, y: saltar.y }]);
    // v0 = 4000 px/s; el tope viejo (1500) la habría recortado.
    expect(vyMin).toBeLessThan(-1500);
  });

  test('Copiar valores sin portapapeles muestra el JSON', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.goto('./?depurar');
    await esperarJuego(page);
    await page.locator('#depurar-boton').click();
    await page.locator('#depurar-copiar').click();
    const caja = page.locator('#depurar-json');
    await expect(caja).toBeVisible();
    await expect(caja).toHaveValue(/"alturaMax"/);
    await expect(page.locator('#depurar-panel')).toContainText('Cópialo a mano');
  });
});
