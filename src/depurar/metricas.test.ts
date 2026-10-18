import { describe, expect, it } from 'vitest';
import {
  memoriaTexturasMiB,
  percentil,
  resumirFrames,
  textoOverlay,
  UMBRAL_TIRON_MS,
  type Instantanea,
  type Metricas,
} from './metricas';

const instantanea: Instantanea = {
  listenersEscala: 11,
  listenersJuego: 12,
  listenersRegistro: 13,
  listenersSonido: 14,
  listenersTexturas: 15,
  listenersRenderer: 25,
  listenersEscenas: 26,
  listenersShutdown: 16,
  texturas: 17,
  sonidos: 18,
  audioCache: 19,
  animaciones: 20,
  canvas: 21,
  escenasActivas: 22,
  objetos: 23,
  tweens: 24,
};

const metricas: Metricas = {
  fps: 59.6,
  p95: 17.26,
  max: 40.04,
  tirones: 3,
  gpuMiB: 12.345,
  renderer: 'webgl',
  recargas: 2,
};

describe('percentil', () => {
  it('lista vacia da 0', () => {
    expect(percentil([], 95)).toBe(0);
  });

  it('un valor es todos los percentiles', () => {
    expect(percentil([7], 95)).toBe(7);
    expect(percentil([7], 1)).toBe(7);
  });

  it('p95 de 1..100 es 95', () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentil(v, 95)).toBe(95);
    expect(percentil(v, 100)).toBe(100);
  });

  it('funciona con valores sin ordenar y no muta la entrada', () => {
    const v = [30, 10, 50, 20, 40];
    expect(percentil(v, 50)).toBe(30);
    expect(v).toEqual([30, 10, 50, 20, 40]);
  });

  it('usa solo los primeros "cuantos" valores', () => {
    expect(percentil([1, 2, 3, 999, 999], 100, 3)).toBe(3);
    expect(percentil([5, 5], 95, 0)).toBe(0);
  });
});

describe('resumirFrames', () => {
  it('buffer vacio da todo 0', () => {
    expect(resumirFrames(new Float32Array(8), 0)).toEqual({ p95: 0, max: 0, tirones: 0 });
  });

  it('buffer a medio llenar ignora lo que sobra', () => {
    const b = new Float32Array([16, 20, 18, 0, 0, 0]);
    const r = resumirFrames(b, 3);
    expect(r.max).toBe(20);
    expect(r.p95).toBe(20);
    expect(r.tirones).toBe(0);
  });

  it('buffer que ya dio la vuelta usa todos los valores', () => {
    const r = resumirFrames([50, 16, 16, 60], 4);
    expect(r.max).toBe(60);
    expect(r.tirones).toBe(2);
  });

  it('tirones justo en el umbral: 34 no cuenta, 34.1 si', () => {
    expect(UMBRAL_TIRON_MS).toBe(34);
    expect(resumirFrames([34], 1).tirones).toBe(0);
    expect(resumirFrames([34.1, 34], 2).tirones).toBe(1);
  });
});

describe('memoriaTexturasMiB', () => {
  it('1024x1024 potencia de dos son 4 MiB por 4/3', () => {
    expect(memoriaTexturasMiB([{ ancho: 1024, alto: 1024 }])).toBeCloseTo((4 * 4) / 3, 6);
  });

  it('1000x700 sin potencia de dos no lleva el factor', () => {
    expect(memoriaTexturasMiB([{ ancho: 1000, alto: 700 }])).toBeCloseTo(
      (1000 * 700 * 4) / (1024 * 1024),
      6,
    );
  });

  it('lista vacia es 0 y se suman varias', () => {
    expect(memoriaTexturasMiB([])).toBe(0);
    expect(
      memoriaTexturasMiB([
        { ancho: 1000, alto: 700 },
        { ancho: 1000, alto: 700 },
      ]),
    ).toBeCloseTo((2 * 1000 * 700 * 4) / (1024 * 1024), 6);
  });
});

describe('textoOverlay', () => {
  it('incluye cada contador de la instantanea', () => {
    const t = textoOverlay(instantanea, metricas);
    for (const valor of Object.values(instantanea)) {
      expect(t).toContain(String(valor));
    }
  });

  it('formatea las metricas', () => {
    const t = textoOverlay(instantanea, metricas);
    expect(t).toContain('60');
    expect(t).toContain('17.3');
    expect(t).toContain('40.0');
    expect(t).toContain('12.3');
    expect(t).toContain('webgl');
    expect(t).not.toContain('n/d');
  });

  it('con Canvas muestra GPU: n/d', () => {
    const t = textoOverlay(instantanea, { ...metricas, gpuMiB: null, renderer: 'canvas' });
    expect(t).toContain('GPU: n/d');
    expect(t).toContain('canvas');
  });
});
