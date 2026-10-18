import { expect, test, type Page } from '@playwright/test';
import { tocar } from './tactil';

// e2e de T-038: la config que leyó Phaser, la base de GPU y la pausa al perder el contexto WebGL.

const VERTICAL = { width: 393, height: 852 };
const WEBGL = 2; // Phaser.WEBGL
const GPU_MAX_MIB = 32;

async function esperarJuego(page: Page) {
  await page.waitForFunction(() => !!window.__juego?.scene.isActive('Arranque'));
}

const estaPausado = (page: Page) => page.evaluate(() => window.__juego!.isPaused);

// Pide al contexto del renderer que lo pierda o lo restaure (extensión WEBGL_lose_context).
// Con el contexto perdido getExtension devuelve null, así que la extensión se toma una vez
// (la primera vez que se pierde) y se guarda en la página.
function cambiarContexto(page: Page, accion: 'loseContext' | 'restoreContext') {
  return page.evaluate((a) => {
    const w = window as unknown as { __extContexto?: WEBGL_lose_context };
    if (!w.__extContexto) {
      const gl = (window.__juego!.renderer as unknown as { gl: WebGLRenderingContext }).gl;
      const ext = gl.getExtension('WEBGL_lose_context');
      if (!ext) throw new Error('Sin la extensión WEBGL_lose_context');
      w.__extContexto = ext;
    }
    w.__extContexto[a]();
  }, accion);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./?depurar');
  await esperarJuego(page);
});

test('la config que leyó Phaser es la esperada', async ({ page }) => {
  const config = await page.evaluate(() => {
    const juego = window.__juego!;
    return {
      renderer: juego.renderer.type,
      disablePreFX: juego.config.disablePreFX,
      panicMax: juego.loop.panicMax,
      hasFpsLimit: juego.loop.hasFpsLimit,
      fpsLimit: juego.loop.fpsLimit,
      disableWebAudio: !!juego.config.audio?.disableWebAudio,
      fisicaPorDefecto: juego.config.defaultPhysicsSystem,
    };
  });
  expect(config).toEqual({
    renderer: WEBGL,
    disablePreFX: true,
    panicMax: 0,
    hasFpsLimit: false,
    fpsLimit: 0,
    disableWebAudio: false,
    fisicaPorDefecto: false,
  });
});

test('la base de GPU en Arranque cabe en el presupuesto', async ({ page }) => {
  const gpu = await page.evaluate(() => window.__depurar!.metricas().gpuMiB);
  console.log(`GPU en Arranque: ${gpu} MiB`);
  expect(gpu).not.toBeNull();
  expect(gpu!).toBeLessThanOrEqual(GPU_MAX_MIB);
});

test('perder el contexto WebGL pausa el juego y restaurarlo lo reanuda', async ({ page }) => {
  expect(await estaPausado(page)).toBe(false);

  await cambiarContexto(page, 'loseContext');
  await page.waitForFunction(() => window.__juego!.isPaused === true);

  await cambiarContexto(page, 'restoreContext');
  await page.waitForFunction(() => window.__juego!.isPaused === false);
});

test('con el contexto perdido y la pantalla en vertical, restaurar no reanuda hasta girar', async ({ page }) => {
  const horizontal = page.viewportSize()!;

  await cambiarContexto(page, 'loseContext');
  await page.waitForFunction(() => window.__juego!.isPaused === true);

  await page.setViewportSize(VERTICAL);
  await expect(page.getByRole('alert')).toBeVisible();

  await cambiarContexto(page, 'restoreContext');
  // Margen para que llegue RESTORE_WEBGL; debe seguir pausado por el motivo vertical.
  await page.waitForTimeout(500);
  expect(await estaPausado(page)).toBe(true);

  await page.setViewportSize(horizontal);
  await page.waitForFunction(() => window.__juego!.isPaused === false);
});

test('CallePrueba tiene física Arcade aunque la config no define una por defecto', async ({ page }) => {
  await tocar(page, 'touchstart', [{ id: 99, x: 640, y: 360 }]);
  await tocar(page, 'touchend', [{ id: 99, x: 640, y: 360 }]);
  await page.waitForFunction(() => !!window.__juego?.scene.isActive('CallePrueba'));

  const fisica = await page.evaluate(() => {
    const calle = window.__juego!.scene.getScene('CallePrueba');
    return { fisica: !!calle.physics, mundo: !!calle.physics?.world };
  });
  expect(fisica).toEqual({ fisica: true, mundo: true });
});
