import { expect, test, type Page } from '@playwright/test';
import { esperarFrames, recolectarErrores } from './fugas';
import { tocar } from './tactil';
import {
  DULCES_POR_DIFICULTAD,
  PUERTAS,
  alturaBloqueSobrePuerta,
  colocarJuntoAPuerta,
  colocarSobreBloqueDePuerta,
  dobleToque,
  entrarAPuerta,
  esperarActiva,
  jugarCasa,
  jugarHastaResultado,
  jugarPartidaCompleta,
  leerFinJuego,
  llegarALaCalle,
  puertasDe,
  seguir,
  tocarBoton,
  tocarBrazos,
} from './flujo';

// e2e del flujo entre escenas (T-007): toca los botones reales. Las puertas se leen de
// puertas-prueba.json. Cómo se siente se prueba a mano en el iPhone.

test.describe('flujo', () => {
  test.setTimeout(90_000);
  let errores: string[];

  test.beforeEach(async ({ page }) => {
    errores = recolectarErrores(page);
    await page.goto('./?depurar');
    await llegarALaCalle(page);
  });

  test.afterEach(() => {
    expect(errores).toEqual([]);
  });

  const activas = (page: Page) => page.evaluate(() => window.__juego!.scene.getScenes(true).map((e) => e.scene.key));
  const puertaAlAlcance = (page: Page) =>
    page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).puertaAlAlcance as number | null);
  const xMiVo = (page: Page) => page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).miVo.x as number);

  /** Pierde las primeras 3 casas y espera FinJuego. */
  async function perderTres(page: Page) {
    await jugarCasa(page, 0, false);
    await jugarCasa(page, 1, false);
    await jugarCasa(page, 2, false, 'FinJuego');
  }

  test('recorrido completo: Arranque a Calle, Puerta, minijuego, Resultado y de vuelta a la Calle', async ({ page }) => {
    // beforeEach ya recorrió Arranque → Menú → SelectorDisfraz → Calle.
    expect(await activas(page)).toEqual(['Calle']);
    await entrarAPuerta(page, 0);
    expect(await page.evaluate(() => (window.__juego!.scene.getScene('Puerta') as any).casa)).toBe(0);
    await tocarBoton(page, 'Puerta', 'tocar');
    await esperarActiva(page, 'MinijuegoPrueba');
    await esperarFrames(page);
    await tocarBoton(page, 'MinijuegoPrueba', 'ganar');
    await esperarActiva(page, 'Resultado');
    await esperarFrames(page);
    await seguir(page, 'Calle');
    expect(await activas(page)).toEqual(['Calle']);
  });

  test('ganar: Resultado muestra los dulces de la dificultad y al juntar 10 se llega a FinJuego "ganaste"', async ({ page }) => {
    let total = 0;
    for (let i = 0; total < 10; i++) {
      await entrarAPuerta(page, i);
      const r = await jugarHastaResultado(page, true);
      expect(r.gano).toBe(true);
      const esperados = DULCES_POR_DIFICULTAD[PUERTAS.puertas[i].dificultad];
      expect(r.dulcesGanados).toBe(esperados);
      total += esperados;
      await seguir(page, total >= 10 ? 'FinJuego' : 'Calle');
    }
    expect(await leerFinJuego(page)).toBe(true);
  });

  test('perder: 3 sustos llevan a FinJuego "perdiste"', async ({ page }) => {
    await perderTres(page);
    expect(await leerFinJuego(page)).toBe(false);
  });

  test('sin casas: 9 dulces y 2 sustos en las 8 puertas llevan a FinJuego "perdiste"', async ({ page }) => {
    await jugarPartidaCompleta(page);
    expect(await leerFinJuego(page)).toBe(false);
  });

  test('orden libre: entrar primero a la puerta 6 y luego a la 2 funciona', async ({ page }) => {
    await entrarAPuerta(page, 5);
    expect((await jugarHastaResultado(page, true)).dulcesGanados).toBe(DULCES_POR_DIFICULTAD[PUERTAS.puertas[5].dificultad]);
    await seguir(page, 'Calle');
    await entrarAPuerta(page, 1);
    expect(await page.evaluate(() => (window.__juego!.scene.getScene('Puerta') as any).casa)).toBe(1);
    expect((await jugarHastaResultado(page, true)).dulcesGanados).toBe(DULCES_POR_DIFICULTAD[PUERTAS.puertas[1].dificultad]);
    await seguir(page, 'Calle');
  });

  test('visitada: Brazos junto a una puerta ya visitada no abre la Puerta', async ({ page }) => {
    await jugarCasa(page, 0, true);
    await colocarJuntoAPuerta(page, 0);
    expect(await puertaAlAlcance(page)).toBeNull();
    await tocarBrazos(page);
    await esperarFrames(page, 5);
    expect(await activas(page)).toEqual(['Calle']);
  });

  test('techo: sobre el bloque que queda encima de una puerta no se entra, y en el suelo sí', async ({ page }) => {
    const i = PUERTAS.puertas.findIndex((_, k) => alturaBloqueSobrePuerta(k) > 100);
    expect(i).toBeGreaterThanOrEqual(0);
    const ySuelo = await page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).miVo.y as number);
    await colocarSobreBloqueDePuerta(page, i);
    expect(await puertaAlAlcance(page)).toBeNull();
    await tocarBrazos(page);
    await esperarFrames(page, 5);
    expect(await activas(page)).toEqual(['Calle']);

    await colocarJuntoAPuerta(page, i, ySuelo);
    expect(await puertaAlAlcance(page)).toBe(i);
    await tocarBrazos(page);
    await esperarActiva(page, 'Puerta');
  });

  test('calle dormida: al volver de Resultado, Mi vo sigue en la misma x', async ({ page }) => {
    await colocarJuntoAPuerta(page, 3);
    const antes = await xMiVo(page);
    await tocarBrazos(page);
    await esperarActiva(page, 'Puerta');
    await esperarFrames(page);
    await jugarHastaResultado(page, true);
    await seguir(page, 'Calle');
    expect(await xMiVo(page)).toBe(antes);
  });

  test('jugar otra vez tras perder: va a la Calle con el mismo disfraz y todo en cero', async ({ page }) => {
    const disfraz = await page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).disfrazId as string | null);
    expect(disfraz).not.toBeNull();
    await perderTres(page);

    await tocarBoton(page, 'FinJuego', 'otraVez');
    await esperarActiva(page, 'Calle');
    await esperarFrames(page, 3);
    expect(await activas(page)).toEqual(['Calle']);
    expect(await page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).disfrazId)).toBe(disfraz);

    // Sustos en 0: dos pérdidas no terminan la partida. Puertas abiertas: la 0 se visitó en la anterior.
    await jugarCasa(page, 0, false);
    await jugarCasa(page, 1, false);
    expect(await activas(page)).toEqual(['Calle']);
  });

  test('jugar otra vez tras ganar: los dulces vuelven a 0', async ({ page }) => {
    let total = 0;
    for (let i = 0; total < 10; i++) {
      total += await jugarCasa(page, i, true, total + DULCES_POR_DIFICULTAD[PUERTAS.puertas[i].dificultad] >= 10 ? 'FinJuego' : 'Calle');
    }
    expect(await leerFinJuego(page)).toBe(true);

    await tocarBoton(page, 'FinJuego', 'otraVez');
    await esperarActiva(page, 'Calle');
    await esperarFrames(page, 3);
    // Con los dulces sin reiniciar, ganar una casa terminaría la partida de inmediato.
    await jugarCasa(page, puertasDe('facil')[0], true);
    expect(await activas(page)).toEqual(['Calle']);
  });

  test('ir al menú: FinJuego, Menú y SelectorDisfraz, y se puede elegir otro disfraz', async ({ page }) => {
    const primero = await page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).disfrazId as string);
    await perderTres(page);

    await tocarBoton(page, 'FinJuego', 'menu');
    await esperarActiva(page, 'Menu');
    await esperarFrames(page);
    await tocarBoton(page, 'Menu', 'jugar');
    await esperarActiva(page, 'SelectorDisfraz');
    await esperarFrames(page);
    await tocarBoton(page, 'SelectorDisfraz', '', 1);
    await esperarActiva(page, 'Calle');
    await esperarFrames(page, 3);
    const segundo = await page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).disfrazId as string);
    expect(segundo).not.toBe(primero);
  });

  test('doble toque en Tocar de la Puerta: se queda en el minijuego, no salta a Resultado', async ({ page }) => {
    await entrarAPuerta(page, 0);
    await dobleToque(page, 'Puerta', 'tocar');
    await esperarActiva(page, 'MinijuegoPrueba');
    await esperarFrames(page, 5);
    expect(await activas(page)).toEqual(['MinijuegoPrueba']);
  });

  test('doble toque en Seguir de un Resultado final: queda en FinJuego, no pasa a la Calle ni al Menú', async ({ page }) => {
    await jugarCasa(page, 0, false);
    await jugarCasa(page, 1, false);
    await entrarAPuerta(page, 2);
    await jugarHastaResultado(page, false);
    await dobleToque(page, 'Resultado', 'seguir');
    await esperarActiva(page, 'FinJuego');
    await esperarFrames(page, 5);
    expect(await activas(page)).toEqual(['FinJuego']);
  });

  test('joystick que no se queda pegado: se suelta dentro de la Puerta y la Calle vuelve quieta', async ({ page }) => {
    const joy = await page.evaluate(() => {
      const z = (window.__juego!.scene.getScene('Calle') as any).disposicion.zonaJoystick;
      return { x: z.x + z.ancho / 2, y: z.y + z.alto / 2 };
    });
    const dedoJoy = 1;
    await tocar(page, 'touchstart', [{ id: dedoJoy, ...joy }]);
    await tocar(page, 'touchmove', [{ id: dedoJoy, x: joy.x + 100, y: joy.y }]);
    await esperarFrames(page, 3);
    // Con el joystick sostenido: junto a la puerta, Brazos y a la Puerta.
    await entrarAPuerta(page, 3);
    // El dedo se suelta ya dentro de la Puerta, donde la Calle no lo oye.
    await tocar(page, 'touchend', [{ id: dedoJoy, x: joy.x + 100, y: joy.y }]);
    await jugarHastaResultado(page, true);
    await seguir(page, 'Calle');

    const direccion = () =>
      page.evaluate(() => (window.__juego!.scene.getScene('Calle') as any).intenciones.direccion as number);
    expect(await direccion()).toBe(0);
    const antes = await xMiVo(page);
    await esperarFrames(page, 10);
    expect(await direccion()).toBe(0);
    expect(await xMiVo(page)).toBe(antes);
  });
});
