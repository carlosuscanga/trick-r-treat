import type { Page } from '@playwright/test';
import { DULCES_POR_DIFICULTAD, PUERTAS } from '../src/datos';
import { esperarFrames } from './fugas';
import { tocar } from './tactil';

// Helpers de los e2e del flujo (T-007). Sin `.e2e.` en el nombre: no es un test.
// Tocan los botones reales de las escenas; las puertas se leen de puertas-prueba.json.

export { DULCES_POR_DIFICULTAD, PUERTAS };

const DEDO = 1;
const DEDO_BRAZOS = 2;

export function esperarActiva(page: Page, escena: string): Promise<unknown> {
  return page.waitForFunction((k) => !!window.__juego!.scene.isActive(k), escena);
}

/** Centro (en px del juego) del botón `nombre` de `escena`. */
function centroDelBoton(page: Page, escena: string, nombre: string): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ escena, nombre }) => {
      const e = window.__juego!.scene.getScene(escena) as any;
      const caja = e.botones[nombre].caja;
      return { x: caja.x as number, y: caja.y as number };
    },
    { escena, nombre },
  );
}

/** Toca un botón real de la escena activa (`botones[nombre].caja`) con un toque sobre el canvas. */
export async function tocarBoton(page: Page, escena: string, nombre: string, indice?: number): Promise<void> {
  const centro =
    indice === undefined
      ? await centroDelBoton(page, escena, nombre)
      : await page.evaluate(
          ({ escena, indice }) => {
            const caja = (window.__juego!.scene.getScene(escena) as any).botones[indice].caja;
            return { x: caja.x as number, y: caja.y as number };
          },
          { escena, indice },
        );
  await tocar(page, 'touchstart', [{ id: DEDO, ...centro }]);
  await tocar(page, 'touchend', [{ id: DEDO, ...centro }]);
}

/** Toca el canvas en el centro (el "toca para empezar"). */
export async function tocarCentro(page: Page): Promise<void> {
  const c = await page.evaluate(() => {
    const { width, height } = window.__juego!.scale.gameSize;
    return { x: width / 2, y: height / 2 };
  });
  await tocar(page, 'touchstart', [{ id: DEDO, ...c }]);
  await tocar(page, 'touchend', [{ id: DEDO, ...c }]);
}

/** Toca el botón Brazos real de la Calle. */
export async function tocarBrazos(page: Page): Promise<void> {
  const brazos = await page.evaluate(() => {
    const b = (window.__juego!.scene.getScene('Calle') as any).disposicion.brazos;
    return { x: b.x as number, y: b.y as number };
  });
  await tocar(page, 'touchstart', [{ id: DEDO_BRAZOS, ...brazos }]);
  await esperarFrames(page);
  await tocar(page, 'touchend', [{ id: DEDO_BRAZOS, ...brazos }]);
}

/** Pone a Mi vo sobre la puerta `i` (x del JSON), sin moverla con el joystick. */
export async function colocarJuntoAPuerta(page: Page, i: number): Promise<void> {
  const x = PUERTAS.puertas[i].x;
  await page.evaluate((x) => {
    const miVo = (window.__juego!.scene.getScene('Calle') as any).miVo;
    miVo.body.reset(x, miVo.y);
  }, x);
  await esperarFrames(page);
}

/** Desde la Calle despierta y activa: se coloca junto a la puerta `i`, Brazos y espera la Puerta. */
export async function entrarAPuerta(page: Page, i: number): Promise<void> {
  await colocarJuntoAPuerta(page, i);
  await tocarBrazos(page);
  await esperarActiva(page, 'Puerta');
  await esperarFrames(page);
}

/** Desde la Puerta: Tocar → minijuego → Ganar o Perder → Resultado. Devuelve lo que muestra Resultado. */
export async function jugarHastaResultado(page: Page, gano: boolean): Promise<{ gano: boolean; dulcesGanados: number }> {
  await tocarBoton(page, 'Puerta', 'tocar');
  await esperarActiva(page, 'MinijuegoPrueba');
  await esperarFrames(page);
  await tocarBoton(page, 'MinijuegoPrueba', gano ? 'ganar' : 'perder');
  await esperarActiva(page, 'Resultado');
  await esperarFrames(page);
  return page.evaluate(() => {
    const r = window.__juego!.scene.getScene('Resultado') as any;
    return { gano: r.gano as boolean, dulcesGanados: r.dulcesGanados as number };
  });
}

/** Desde Resultado: Seguir. Espera a la Calle o a FinJuego según `destino`. */
export async function seguir(page: Page, destino: 'Calle' | 'FinJuego'): Promise<void> {
  await tocarBoton(page, 'Resultado', 'seguir');
  await esperarActiva(page, destino);
  await esperarFrames(page);
}

/** Una casa completa desde la Calle: entra, gana o pierde, sigue. Devuelve los dulces que mostró Resultado. */
export async function jugarCasa(page: Page, i: number, gano: boolean, destino: 'Calle' | 'FinJuego' = 'Calle'): Promise<number> {
  await entrarAPuerta(page, i);
  const r = await jugarHastaResultado(page, gano);
  await seguir(page, destino);
  return r.dulcesGanados;
}

/** Arranque → Menú → SelectorDisfraz → Calle con los toques reales. `disfraz` es el índice del botón. */
export async function llegarALaCalle(page: Page, disfraz = 0): Promise<void> {
  await esperarActiva(page, 'Arranque');
  await tocarCentro(page);
  await esperarActiva(page, 'Menu');
  await esperarFrames(page);
  await tocarBoton(page, 'Menu', 'jugar');
  await esperarActiva(page, 'SelectorDisfraz');
  await esperarFrames(page);
  await tocarBoton(page, 'SelectorDisfraz', '', disfraz);
  await esperarActiva(page, 'Calle');
  await esperarFrames(page, 3);
}

/** Lee FinJuego.gano. */
export function leerFinJuego(page: Page): Promise<boolean> {
  return page.evaluate(() => (window.__juego!.scene.getScene('FinJuego') as any).gano as boolean);
}

/** Índices de las puertas con esa dificultad. */
export function puertasDe(dificultad: 'facil' | 'media' | 'dificil'): number[] {
  return PUERTAS.puertas.flatMap((p, i) => (p.dificultad === dificultad ? [i] : []));
}

/**
 * Una partida de 8 casas desde la Calle: gana las fáciles y medias (9 dulces) y pierde las difíciles (2 sustos),
 * así que termina en FinJuego con `gano === false`. Sirve para el e2e y para el ciclo de fugas.
 */
export async function jugarPartidaCompleta(page: Page): Promise<void> {
  const ordenadas = [...puertasDe('facil'), ...puertasDe('media')].map((i) => [i, true] as const);
  const perdidas = puertasDe('dificil').map((i) => [i, false] as const);
  const casas = [...ordenadas, ...perdidas];
  for (let n = 0; n < casas.length; n++) {
    const [i, gano] = casas[n];
    await jugarCasa(page, i, gano, n === casas.length - 1 ? 'FinJuego' : 'Calle');
  }
}
