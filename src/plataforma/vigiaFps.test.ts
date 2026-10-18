import { describe, expect, it } from 'vitest';
import { VigiaFps } from './vigiaFps';

// Cuántas veces avisa la vigía en `frames` frames de `dtMs`.
function avisos(vigia: VigiaFps, frames: number, dtMs: number): number {
  let total = 0;
  for (let i = 0; i < frames; i++) if (vigia.registrar(dtMs)) total++;
  return total;
}

describe('VigiaFps', () => {
  it('40 frames de 33 ms (≈ 1.3 s) no avisan; 3 s seguidos sí, una sola vez', () => {
    const vigia = new VigiaFps();
    expect(avisos(vigia, 40, 33)).toBe(0);

    // 1320 ms ya contados; faltan 1680 ms (51 frames) para llegar a 3000.
    expect(avisos(vigia, 50, 33)).toBe(0);
    expect(vigia.registrar(33)).toBe(true);

    // Ya avisó: no vuelve a avisar, ni siquiera tras otros 10 s lentos.
    expect(avisos(vigia, 300, 33)).toBe(0);
  });

  it('un frame de 16 ms en medio reinicia la cuenta', () => {
    const vigia = new VigiaFps();
    expect(avisos(vigia, 80, 33)).toBe(0); // 2640 ms
    expect(vigia.registrar(16)).toBe(false); // ≈ 62 fps: cuenta en 0

    // Otra vez 2640 ms: sin el reinicio ya habría avisado.
    expect(avisos(vigia, 80, 33)).toBe(0);
    expect(avisos(vigia, 11, 33)).toBe(1); // 3003 ms seguidos
  });

  it('a 40 fps justos no avisa (el umbral es "bajo 40")', () => {
    const vigia = new VigiaFps();
    expect(avisos(vigia, 200, 25)).toBe(0);
  });

  it('respeta el umbral y el tiempo que recibe', () => {
    const vigia = new VigiaFps(50, 100);
    expect(avisos(vigia, 3, 25)).toBe(0); // 40 fps (bajo 50) durante 75 ms
    expect(vigia.registrar(25)).toBe(true); // 100 ms
  });
});
