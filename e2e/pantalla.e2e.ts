import { expect, test, type Page } from '@playwright/test';

// Un e2e por criterio de T-003. Que el sonido *suene* no se puede comprobar aquí:
// eso se prueba a mano en el iPhone.

const HORIZONTAL_CON_BARRA = { width: 800, height: 310 };
const VERTICAL = { width: 393, height: 852 };

// Dónde se dibuja el canvas y con qué tamaño interno.
async function medirCanvas(page: Page) {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  return canvas.evaluate((c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, ancho: r.width, alto: r.height, internoAncho: c.width, internoAlto: c.height };
  });
}

async function esperarQueLleneLaPantalla(page: Page) {
  const viewport = page.viewportSize()!;
  await expect
    .poll(async () => {
      const c = await medirCanvas(page);
      return [Math.round(c.x), Math.round(c.y), Math.round(c.ancho), Math.round(c.alto)];
    })
    .toEqual([0, 0, viewport.width, viewport.height]);
}

async function esperarSinDeformar(page: Page) {
  const c = await medirCanvas(page);
  // La proporción con la que se ve es la misma con la que se dibuja.
  expect(c.ancho / c.alto).toBeCloseTo(c.internoAncho / c.internoAlto, 2);
}

test('en horizontal el juego llena la pantalla sin deformarse', async ({ page }) => {
  await page.goto('./');
  await esperarQueLleneLaPantalla(page);
  await esperarSinDeformar(page);

  // Más ancho todavía: Safari con su barra visible.
  await page.setViewportSize(HORIZONTAL_CON_BARRA);
  await esperarQueLleneLaPantalla(page);
  await esperarSinDeformar(page);
});

test('en vertical aparece el aviso de girar y al girar desaparece', async ({ page }) => {
  const horizontal = page.viewportSize()!;
  await page.goto('./');
  const aviso = page.getByRole('alert');

  await expect(aviso).toBeHidden();

  await page.setViewportSize(VERTICAL);
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText('Gira tu teléfono');

  await page.setViewportSize(horizontal);
  await expect(aviso).toBeHidden();
  await esperarQueLleneLaPantalla(page);
  await esperarSinDeformar(page);
});

// Con la página en una subruta, el bug de la bitácora pedía el audio en una ruta
// inexistente y el servidor respondía index.html (200). Un test por ruta, cada uno
// con navegador limpio, para que la caché no conteste por el servidor (304).
for (const ruta of ['./', './una/subruta/']) {
  test(`el sonido de prueba se pide desde la base (página en ${ruta})`, async ({ page }) => {
    // Phaser solo pide el .m4a si el navegador dice soportar AAC; el WebKit de Linux
    // puede no traerlo. Lo forzamos: aquí se prueba la ruta, no el códec.
    await page.addInitScript(() => {
      const original = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function (tipo: string) {
        return /m4a|aac|mp4/.test(tipo) ? 'probably' : original.call(this, tipo);
      };
    });

    const respuesta = page.waitForResponse((r) => r.url().includes('prueba.m4a'));
    await page.goto(ruta);
    const audio = await respuesta;

    expect(new URL(audio.url()).pathname).toBe('/trick-r-treat/audio/prueba.m4a');
    expect(audio.status()).toBe(200);
    expect(audio.headers()['content-type']).toContain('audio');
  });
}
