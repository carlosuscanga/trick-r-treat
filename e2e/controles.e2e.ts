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
