import { expect, test } from '@playwright/test';
import { esperarEscena, esperarFrames, irA, leerInstantanea, recolectarErrores } from './fugas';

// e2e de ?depurar (T-037): lo expuesto en window, el overlay, la limpieza de EscenaBase y el conteo de recargas.

const CLAVES_INSTANTANEA = [
  'listenersEscala',
  'listenersJuego',
  'listenersRegistro',
  'listenersSonido',
  'listenersTexturas',
  'listenersRenderer',
  'listenersEscenas',
  'listenersShutdown',
  'texturas',
  'sonidos',
  'audioCache',
  'animaciones',
  'canvas',
  'escenasActivas',
  'objetos',
  'tweens',
];

test.describe('con ?depurar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./?depurar');
    await esperarEscena(page, 'Arranque');
  });

  test('__depurar.instantanea() trae las 16 claves numéricas', async ({ page }) => {
    const errores = recolectarErrores(page);
    const inst = (await leerInstantanea(page)) as unknown as Record<string, unknown>;
    expect(Object.keys(inst).sort()).toEqual([...CLAVES_INSTANTANEA].sort());
    for (const clave of CLAVES_INSTANTANEA) {
      expect(typeof inst[clave], clave).toBe('number');
      expect(Number.isFinite(inst[clave]), clave).toBe(true);
    }
    expect(errores).toEqual([]);
  });

  test('el overlay se ve, se actualiza y no recibe toques', async ({ page }) => {
    const errores = recolectarErrores(page);
    const overlay = page.locator('#depurar-overlay');
    await expect(overlay).toBeVisible();

    const inicial = await overlay.textContent();
    await expect.poll(() => overlay.textContent(), { timeout: 1500 }).not.toBe(inicial);

    const alCentro = await page.evaluate(() => {
      const caja = document.getElementById('depurar-overlay')!.getBoundingClientRect();
      const el = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2);
      return el?.tagName;
    });
    expect(alCentro).toBe('CANVAS');
    expect(errores).toEqual([]);
  });

  test('EscenaBase: reiniciar vacía data y no acumula listeners de shutdown (ESC-02, ESC-03)', async ({ page }) => {
    const errores = recolectarErrores(page);
    await page.evaluate(() => window.__juego!.scene.getScene('Arranque').data.set('x', 1));
    expect(await page.evaluate(() => window.__juego!.scene.getScene('Arranque').data.get('x'))).toBe(1);

    const antes = await leerInstantanea(page);
    await irA(page, 'Arranque', 'Arranque');
    await esperarFrames(page);
    const despues = await leerInstantanea(page);

    expect(await page.evaluate(() => window.__juego!.scene.getScene('Arranque').data.get('x'))).toBeUndefined();
    expect(despues.listenersShutdown).toBeLessThanOrEqual(antes.listenersShutdown);
    expect(errores).toEqual([]);
  });

  test('una recarga normal no cuenta como recarga inesperada', async ({ page }) => {
    const errores = recolectarErrores(page);
    await page.reload();
    await esperarEscena(page, 'Arranque');
    expect(await page.evaluate(() => window.__depurar!.metricas().recargas)).toBe(0);
    // La marca de "en partida" se vuelve a poner al arrancar de nuevo.
    expect(await page.evaluate(() => sessionStorage.getItem('trt:en-partida'))).toBe('1');
    expect(errores).toEqual([]);
  });

  test('una recarga sin pagehide limpio (jetsam) cuenta como recarga inesperada', async ({ page }) => {
    const errores = recolectarErrores(page);
    // Corre después del pagehide de montarDepurar: vuelve a poner la marca, como si la pestaña hubiera muerto sin avisar.
    await page.evaluate(() => addEventListener('pagehide', () => sessionStorage.setItem('trt:en-partida', '1')));
    await page.reload();
    await esperarEscena(page, 'Arranque');
    expect(await page.evaluate(() => window.__depurar!.metricas().recargas)).toBe(1);
    expect(errores).toEqual([]);
  });

  test('scene.remove limpia los listeners de larga vida y un resize posterior no falla (DESTROY)', async ({ page }) => {
    const errores = recolectarErrores(page);
    const antes = await leerInstantanea(page);

    await irA(page, 'Arranque', 'CallePrueba');
    await page.evaluate(() => window.__juego!.scene.remove('CallePrueba'));
    await esperarFrames(page);

    // Vuelve a Arranque desde el SceneManager (CallePrueba ya no existe) y espera su create.
    await page.evaluate(
      () =>
        new Promise<void>((listo) => {
          const juego = window.__juego!;
          juego.scene.getScene('Arranque').events.once('create', () => listo());
          juego.scene.start('Arranque');
        }),
    );
    await esperarFrames(page);
    await esperarEscena(page, 'Arranque');

    const despues = await leerInstantanea(page);
    expect(despues.listenersEscala).toBeLessThanOrEqual(antes.listenersEscala);
    expect(despues.listenersJuego).toBeLessThanOrEqual(antes.listenersJuego);
    expect(despues.listenersRegistro).toBeLessThanOrEqual(antes.listenersRegistro);

    // Un resize no debe tocar listeners de una escena destruida.
    await page.evaluate(() => {
      const escala = window.__juego!.scale;
      escala.emit('resize', escala.gameSize, escala.displaySize, escala.gameSize.width, escala.gameSize.height);
    });
    await esperarFrames(page);
    expect(errores).toEqual([]);
  });
});

test('sin ?depurar no hay __depurar, ni overlay, ni marca de recargas', async ({ page }) => {
  const errores = recolectarErrores(page);
  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  const estado = await page.evaluate(() => ({
    depurar: typeof window.__depurar,
    overlay: document.getElementById('depurar-overlay') !== null,
    marca: sessionStorage.getItem('trt:en-partida'),
    juego: typeof window.__juego,
  }));
  expect(estado).toEqual({ depurar: 'undefined', overlay: false, marca: null, juego: 'undefined' });
  expect(errores).toEqual([]);
});
