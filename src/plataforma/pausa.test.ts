import { describe, expect, it, vi } from 'vitest';
import { crearPausa } from './pausa';

function armar() {
  const game = { pause: vi.fn(), resume: vi.fn() };
  const sonido = { pauseAll: vi.fn(), resumeAll: vi.fn() };
  return { game, sonido, pausa: crearPausa(game, sonido) };
}

describe('crearPausa', () => {
  it('un motivo pausa el juego y el sonido', () => {
    const { game, sonido, pausa } = armar();
    pausa.activar('vertical');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(sonido.pauseAll).toHaveBeenCalledTimes(1);
    expect(pausa.activos()).toEqual(['vertical']);
  });

  it('con dos motivos, quitar uno no reanuda', () => {
    const { game, sonido, pausa } = armar();
    pausa.activar('vertical');
    pausa.activar('contexto');
    pausa.quitar('vertical');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(game.resume).not.toHaveBeenCalled();
    expect(sonido.resumeAll).not.toHaveBeenCalled();
  });

  it('quitar el último motivo reanuda juego y sonido', () => {
    const { game, sonido, pausa } = armar();
    pausa.activar('vertical');
    pausa.activar('contexto');
    pausa.quitar('vertical');
    pausa.quitar('contexto');
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(sonido.resumeAll).toHaveBeenCalledTimes(1);
    expect(pausa.activos()).toEqual([]);
  });

  it('repetir activar o quitar no llama de más', () => {
    const { game, sonido, pausa } = armar();
    pausa.activar('contexto');
    pausa.activar('contexto');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(sonido.pauseAll).toHaveBeenCalledTimes(1);
    pausa.quitar('contexto');
    pausa.quitar('contexto');
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(sonido.resumeAll).toHaveBeenCalledTimes(1);
  });

  it('quitar un motivo que no estaba no truena ni reanuda', () => {
    const { game, sonido, pausa } = armar();
    expect(() => pausa.quitar('vertical')).not.toThrow();
    expect(game.resume).not.toHaveBeenCalled();
    expect(sonido.resumeAll).not.toHaveBeenCalled();
  });
});
