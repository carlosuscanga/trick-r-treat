import { describe, expect, it } from 'vitest';
import { velocidadCaminar } from './caminar';

const fija = { velocidad: 360, proporcional: false, velocidadMinima: 0.3, curva: 1 };
const lineal = { ...fija, proporcional: true };
const curva2 = { ...lineal, curva: 2 };

describe('velocidadCaminar', () => {
  it('apagada: velocidad completa con cualquier fuerza', () => {
    expect(velocidadCaminar(1, 0, fija)).toBe(360);
    expect(velocidadCaminar(-1, 0.5, { ...curva2, proporcional: false })).toBe(-360);
  });

  it('curva 1: mínima con fuerza 0, completa con 1, lineal en medio', () => {
    expect(velocidadCaminar(1, 0, lineal)).toBeCloseTo(108);
    expect(velocidadCaminar(1, 1, lineal)).toBe(360);
    expect(velocidadCaminar(-1, 0.5, lineal)).toBeCloseTo(-234);
  });

  it('curva 2: mismos extremos, pero a media distancia va más lento', () => {
    expect(velocidadCaminar(1, 0, curva2)).toBeCloseTo(108);
    expect(velocidadCaminar(1, 1, curva2)).toBe(360);
    // 360 · (0.3 + 0.7 · 0.5²) = 171
    expect(velocidadCaminar(1, 0.5, curva2)).toBeCloseTo(171);
  });

  it('dirección 0 da 0', () => {
    expect(velocidadCaminar(0, 1, curva2)).toBe(0);
    expect(velocidadCaminar(0, 1, fija)).toBe(0);
  });
});
