import { describe, expect, it, vi } from 'vitest';
import { crearPausa } from './pausa';

function fake() {
  return { pause: vi.fn(), resume: vi.fn() };
}

function armar() {
  const game = { pause: vi.fn(), resume: vi.fn() };
  const suena = fake();
  const yaPausado = fake(); // pausado a propósito: no aparece en getAllPlaying
  const sonido = { getAllPlaying: vi.fn(() => [suena]) };
  return { game, sonido, suena, yaPausado, pausa: crearPausa(game, sonido) };
}

describe('crearPausa', () => {
  it('un motivo pausa el juego y los sonidos que sonaban', () => {
    const { game, suena, pausa } = armar();
    pausa.activar('vertical');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(suena.pause).toHaveBeenCalledTimes(1);
    expect(pausa.activos()).toEqual(['vertical']);
  });

  it('con dos motivos, quitar uno no reanuda', () => {
    const { game, suena, pausa } = armar();
    pausa.activar('vertical');
    pausa.activar('contexto');
    pausa.quitar('vertical');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(game.resume).not.toHaveBeenCalled();
    expect(suena.resume).not.toHaveBeenCalled();
  });

  it('quitar el último motivo reanuda juego y el sonido que sonaba', () => {
    const { game, suena, pausa } = armar();
    pausa.activar('vertical');
    pausa.activar('contexto');
    pausa.quitar('vertical');
    pausa.quitar('contexto');
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(suena.resume).toHaveBeenCalledTimes(1);
    expect(pausa.activos()).toEqual([]);
  });

  it('un sonido que ya estaba pausado no se reanuda', () => {
    const { yaPausado, suena, pausa } = armar();
    pausa.activar('contexto');
    pausa.quitar('contexto');
    expect(yaPausado.pause).not.toHaveBeenCalled();
    expect(yaPausado.resume).not.toHaveBeenCalled();
    expect(suena.resume).toHaveBeenCalledTimes(1);
  });

  it('la lista se vacía: una segunda pausa toma los sonidos de ese momento', () => {
    const { sonido, suena, pausa } = armar();
    pausa.activar('contexto');
    pausa.quitar('contexto');
    sonido.getAllPlaying.mockReturnValue([]);
    pausa.activar('contexto');
    pausa.quitar('contexto');
    expect(suena.pause).toHaveBeenCalledTimes(1);
    expect(suena.resume).toHaveBeenCalledTimes(1);
  });

  it('repetir activar o quitar no llama de más', () => {
    const { game, suena, pausa } = armar();
    pausa.activar('contexto');
    pausa.activar('contexto');
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(suena.pause).toHaveBeenCalledTimes(1);
    pausa.quitar('contexto');
    pausa.quitar('contexto');
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(suena.resume).toHaveBeenCalledTimes(1);
  });

  it('quitar un motivo que no estaba no truena ni reanuda', () => {
    const { game, suena, pausa } = armar();
    expect(() => pausa.quitar('vertical')).not.toThrow();
    expect(game.resume).not.toHaveBeenCalled();
    expect(suena.resume).not.toHaveBeenCalled();
  });
});
