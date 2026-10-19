import { expect, test, type Page } from '@playwright/test';
import { esperarFrames, recolectarErrores } from './fugas';
import {
  DULCES_POR_DIFICULTAD,
  PUERTAS,
  colocarJuntoAPuerta,
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
});
