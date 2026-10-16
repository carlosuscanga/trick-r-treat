import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALTO, ANCHO_MAXIMO, ANCHO_SEGURO, ajustarAnchoAlContenedor, calcularAncho } from './escala';

describe('calcularAncho', () => {
  it('16:9 da la zona segura exacta', () => {
    expect(calcularAncho(1280, 720)).toBe(ANCHO_SEGURO);
  });

  it('iPhone en horizontal desde la pantalla de inicio (932×430) ensancha el juego', () => {
    expect(calcularAncho(932, 430)).toBe(1561);
  });

  it('iPhone en Safari con la barra visible (800×310) ensancha más', () => {
    expect(calcularAncho(800, 310)).toBe(1858);
  });

  it('más ancho que 2.6:1 se queda en el tope', () => {
    expect(calcularAncho(3000, 720)).toBe(ANCHO_MAXIMO);
  });

  it('en vertical no baja de la zona segura', () => {
    expect(calcularAncho(430, 932)).toBe(ANCHO_SEGURO);
  });

  it('sin tamaño todavía (0×0) usa la zona segura', () => {
    expect(calcularAncho(0, 0)).toBe(ANCHO_SEGURO);
  });
});

describe('ajustarAnchoAlContenedor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Un ResizeObserver falso que deja disparar el callback a mano.
  function prepararObservador() {
    let callback = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          callback = cb;
        }
        observe() {}
      },
    );
    return () => callback();
  }

  function prepararJuego(anchoActual: number) {
    const setGameSize = vi.fn();
    const game = { scale: { gameSize: { width: anchoActual }, setGameSize } };
    return { game: game as unknown as Parameters<typeof ajustarAnchoAlContenedor>[0], setGameSize };
  }

  function contenedor(width: number, height: number) {
    return { getBoundingClientRect: () => ({ width, height }) } as unknown as Element;
  }

  it('cambia el tamaño del juego cuando el ancho calculado cambia', () => {
    const redimensionar = prepararObservador();
    const { game, setGameSize } = prepararJuego(1280);

    ajustarAnchoAlContenedor(game, contenedor(932, 430));
    redimensionar();

    expect(setGameSize).toHaveBeenCalledWith(1561, ALTO);
  });

  it('no toca el juego si el ancho es el mismo', () => {
    const redimensionar = prepararObservador();
    const { game, setGameSize } = prepararJuego(1561);

    ajustarAnchoAlContenedor(game, contenedor(932, 430));
    redimensionar();

    expect(setGameSize).not.toHaveBeenCalled();
  });
});
