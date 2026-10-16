import { describe, expect, it, vi } from 'vitest';
import { pausarEnVertical } from './orientacion';

// Un matchMedia falso: `girar` cambia la orientación y avisa como lo haría el navegador.
function consultaFalsa(enVertical: boolean) {
  let alCambiar = () => {};
  const consulta = {
    matches: enVertical,
    addEventListener: (_tipo: string, cb: () => void) => {
      alCambiar = cb;
    },
  };
  const girar = (aVertical: boolean) => {
    consulta.matches = aVertical;
    alCambiar();
  };
  return { consulta: consulta as unknown as MediaQueryList, girar };
}

function juegoFalso() {
  return { pause: vi.fn(), resume: vi.fn() };
}

describe('pausarEnVertical', () => {
  it('si arranca en vertical, el juego empieza en pausa', () => {
    const game = juegoFalso();
    pausarEnVertical(game, consultaFalsa(true).consulta);
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(game.resume).not.toHaveBeenCalled();
  });

  it('si arranca en horizontal, el juego corre', () => {
    const game = juegoFalso();
    pausarEnVertical(game, consultaFalsa(false).consulta);
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('al girar a horizontal se reanuda y al volver a vertical se pausa', () => {
    const game = juegoFalso();
    const { consulta, girar } = consultaFalsa(true);
    pausarEnVertical(game, consulta);

    girar(false);
    expect(game.resume).toHaveBeenCalledTimes(1);

    girar(true);
    expect(game.pause).toHaveBeenCalledTimes(2);
  });
});
