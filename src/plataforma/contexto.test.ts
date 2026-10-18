import { describe, expect, it, vi } from 'vitest';
import { pausarSinContexto } from './contexto';
import { crearPausa } from './pausa';

const eventos = { perder: 'perdido', restaurar: 'restaurado' };

// Un renderer falso: `emitir` dispara el evento como lo haría Phaser.
function armar() {
  const oyentes = new Map<string, () => void>();
  const renderer = { on: (ev: string, fn: () => void) => void oyentes.set(ev, fn) };
  const game = { pause: vi.fn(), resume: vi.fn() };
  const sonido = { pauseAll: vi.fn(), resumeAll: vi.fn() };
  const pausa = crearPausa(game, sonido);
  pausarSinContexto(renderer, pausa, eventos);
  return { game, pausa, emitir: (ev: string) => oyentes.get(ev)!() };
}

describe('pausarSinContexto', () => {
  it('al perder el contexto activa la pausa y al restaurarlo la quita', () => {
    const { game, pausa, emitir } = armar();
    emitir(eventos.perder);
    expect(pausa.activos()).toEqual(['contexto']);
    expect(game.pause).toHaveBeenCalledTimes(1);

    emitir(eventos.restaurar);
    expect(pausa.activos()).toEqual([]);
    expect(game.resume).toHaveBeenCalledTimes(1);
  });

  it('con vertical activo, restaurar el contexto no reanuda', () => {
    const { game, pausa, emitir } = armar();
    pausa.activar('vertical');
    emitir(eventos.perder);
    emitir(eventos.restaurar);
    expect(pausa.activos()).toEqual(['vertical']);
    expect(game.resume).not.toHaveBeenCalled();
  });
});
