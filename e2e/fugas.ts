import { expect, type Page } from '@playwright/test';
import { crecimientos } from '../src/depurar/fugas';
import type { Instantanea } from '../src/depurar/metricas';

// Helpers de los e2e de fugas (T-037). Sin `.e2e.` en el nombre para que Playwright no lo tome como test.
// T-007 los reusa para su ciclo Calle -> Puerta -> minijuego -> Calle.

/** Espera `n` (por defecto 2) frames de la página: `start` y `stop` de escenas se encolan. */
export function esperarFrames(page: Page, n = 2): Promise<void> {
  return page.evaluate(async (cuantos) => {
    for (let i = 0; i < cuantos; i++) await new Promise<void>((listo) => requestAnimationFrame(() => listo()));
  }, n);
}

/** Corre `paso(page)` `n` veces seguidas. Cada paso debe dejar el juego en el mismo punto donde empezó. */
export async function ciclar(page: Page, paso: (page: Page) => Promise<void>, n: number): Promise<void> {
  for (let i = 0; i < n; i++) await paso(page);
}

/** Desde la escena activa `desde` arranca `hacia` (puede ser la misma), espera su `create` y 2 frames. */
export async function irA(page: Page, desde: string, hacia: string): Promise<void> {
  await page.evaluate(
    ({ desde, hacia }) =>
      new Promise<void>((listo) => {
        const juego = window.__juego!;
        juego.scene.getScene(hacia).events.once('create', () => listo());
        juego.scene.getScene(desde).scene.start(hacia);
      }),
    { desde, hacia },
  );
  await esperarFrames(page);
  await page.waitForFunction((k) => window.__juego!.scene.isActive(k), hacia);
}

/** Espera a que `escena` esté activa (el primer arranque del juego). */
export function esperarEscena(page: Page, escena: string): Promise<unknown> {
  return page.waitForFunction((k) => !!window.__juego?.scene.isActive(k), escena);
}

/** Contadores de fuga de ahora (`window.__depurar.instantanea()`). */
export function leerInstantanea(page: Page): Promise<Instantanea> {
  return page.evaluate(() => window.__depurar!.instantanea() as Instantanea);
}

/** Junta `pageerror` y mensajes `console.error`; al final del test, `expect(errores).toEqual([])`. */
export function recolectarErrores(page: Page): string[] {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`console.error: ${m.text()}`);
  });
  return errores;
}

/** Exige que ningún contador haya crecido; si falla, el mensaje trae la lista de crecimientos. */
export function esperarSinCrecimientos(antes: Instantanea, despues: Instantanea): void {
  const lista = crecimientos(antes, despues);
  expect(lista, `crecieron: ${JSON.stringify(lista)}`).toEqual([]);
}
