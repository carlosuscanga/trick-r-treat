import { expect, test } from '@playwright/test';
import { ciclar, esperarEscena, esperarFrames, esperarSinCrecimientos, irA, leerInstantanea, recolectarErrores } from './fugas';
import { esperarActiva, jugarPartidaCompleta, tocarBoton } from './flujo';

// Cicla escenas y exige que ningún contador de fuga crezca (ESC-01 a ESC-03, ROB-01).
// Cada test abre su página nueva. Detalle: docs/planes/T-037-escena-base-depurar-y-fugas.md

const CICLOS = 30;

test.describe('fugas', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('./?depurar');
    await esperarEscena(page, 'Arranque');
  });

  test('imprime el renderer', async ({ page }) => {
    const renderer = await page.evaluate(() => window.__depurar!.metricas().renderer);
    console.log(`renderer: ${renderer}`);
    expect(['webgl', 'canvas']).toContain(renderer);
  });

  test('reiniciar Arranque 30 veces no deja fugas', async ({ page }) => {
    const errores = recolectarErrores(page);
    const paso = (p: typeof page) => irA(p, 'Arranque', 'Arranque');

    await paso(page); // calentamiento: la primera vuelta crea cosas que luego se reusan
    const antes = await leerInstantanea(page);
    console.log('antes (reiniciar Arranque):', JSON.stringify(antes));
    await ciclar(page, paso, CICLOS);
    const despues = await leerInstantanea(page);

    esperarSinCrecimientos(antes, despues);
    expect(errores).toEqual([]);
  });

  test('ir y volver a la calle de prueba 30 veces no deja fugas', async ({ page }) => {
    const errores = recolectarErrores(page);
    const paso = async (p: typeof page) => {
      await irA(p, 'Arranque', 'Calle');
      await irA(p, 'Calle', 'Arranque');
    };

    await paso(page);
    const antes = await leerInstantanea(page);
    console.log('antes (Arranque <-> Calle):', JSON.stringify(antes));
    await ciclar(page, paso, CICLOS);
    const despues = await leerInstantanea(page);

    esperarSinCrecimientos(antes, despues);
    expect(errores).toEqual([]);
  });

  // Una partida de 8 casas (Calle -> Puerta -> MinijuegoPrueba -> Resultado -> Calle) y Jugar otra vez (ESC-01, ESC-05).
  test('8 casas x 3 partidas no dejan fugas', async ({ page }) => {
    test.setTimeout(240_000);
    const errores = recolectarErrores(page);
    await irA(page, 'Arranque', 'Calle');
    const partida = async (p: typeof page) => {
      await jugarPartidaCompleta(p);
      await tocarBoton(p, 'FinJuego', 'otraVez');
      await esperarActiva(p, 'Calle');
      await esperarFrames(p, 3);
    };

    await partida(page); // calentamiento
    const antes = await leerInstantanea(page);
    console.log('antes (8 casas x 3 partidas):', JSON.stringify(antes));
    await ciclar(page, partida, 3);
    const despues = await leerInstantanea(page);

    esperarSinCrecimientos(antes, despues);
    expect(errores).toEqual([]);
  });
});
