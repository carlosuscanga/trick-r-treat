import { expect, test } from '@playwright/test';
import { esperarEscena, esperarFrames, irA, leerInstantanea, recolectarErrores } from './fugas';

// e2e de ?depurar (T-037): lo expuesto en window, el overlay, la limpieza de EscenaBase y el conteo de recargas.

const CLAVES_INSTANTANEA = [
  'listenersResize',
  'listenersJuego',
  'listenersRegistro',
  'listenersSonido',
  'listenersTexturas',
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

  test('__depurar.instantanea() trae las 14 claves numéricas', async ({ page }) => {
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
  }));
  expect(estado).toEqual({ depurar: 'undefined', overlay: false, marca: null });
  expect(errores).toEqual([]);
});
