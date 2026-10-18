import { describe, expect, it } from 'vitest';
import { velocidadCaminar } from './caminar';

const fija = { velocidad: 360, proporcional: false, velocidadMinima: 0.3 };
const prop = { ...fija, proporcional: true };

describe('velocidadCaminar', () => {
  it('apagada: velocidad completa con cualquier fuerza', () => {
    expect(velocidadCaminar(1, 0, fija)).toBe(360);
    expect(velocidadCaminar(-1, 0.5, fija)).toBe(-360);
  });

  it('prendida: mínima con fuerza 0, completa con 1, lineal en medio', () => {
    expect(velocidadCaminar(1, 0, prop)).toBeCloseTo(108);
    expect(velocidadCaminar(1, 1, prop)).toBe(360);
    expect(velocidadCaminar(-1, 0.5, prop)).toBeCloseTo(-234);
  });

  it('dirección 0 da 0', () => {
    expect(velocidadCaminar(0, 1, prop)).toBe(0);
    expect(velocidadCaminar(0, 1, fija)).toBe(0);
  });
});
