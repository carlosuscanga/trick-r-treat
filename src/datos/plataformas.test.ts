import { describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO, type Ajustes } from '../movimiento/ajustes';
import {
  BLOQUES_CALLE_PRUEBA,
  esDeToqueCorto,
  limitesDeSalto,
  revisarCalle,
  validarBloques,
  type Bloque,
} from './plataformas';

const limites = limitesDeSalto(AJUSTES_POR_DEFECTO);
const bloque = (nombre: string): Bloque => {
  const b = BLOQUES_CALLE_PRUEBA.find((c) => c.nombre === nombre);
  if (!b) throw new Error(`falta ${nombre}`);
  return b;
};

describe('plataformas', () => {
  it('la calle de prueba cumple la regla', () => {
    expect(revisarCalle(BLOQUES_CALLE_PRUEBA, limites)).toEqual([]);
  });

  it('un bloque de 450 rompe la altura máxima', () => {
    const errores = revisarCalle([{ nombre: 'torre', x: 100, ancho: 100, alto: 450 }], limites);
    expect(errores.some((e) => e.includes('torre') && e.includes('altura máxima'))).toBe(true);
  });

  it('un bloque a 230 sobre la calle sin escalón intermedio es inalcanzable', () => {
    const errores = revisarCalle([{ nombre: 'muro', x: 100, ancho: 100, alto: 230 }], limites);
    expect(errores.some((e) => e.includes('muro') && e.includes('inalcanzable'))).toBe(true);
  });

  it('el techo es alcanzable solo encadenando el pórtico', () => {
    const sinPortico = BLOQUES_CALLE_PRUEBA.filter((b) => b.nombre !== 'portico');
    const errores = revisarCalle(sinPortico, limites);
    expect(errores.some((e) => e.includes('casa') && e.includes('inalcanzable'))).toBe(true);
  });

  it('un bloque de 20 de alto rompe el grosor', () => {
    const errores = revisarCalle([{ nombre: 'lamina', x: 100, ancho: 100, alto: 20 }], limites);
    expect(errores.some((e) => e.includes('lamina') && e.includes('grosor'))).toBe(true);
  });

  it('un bloque que se sale de lo que tiene abajo se reporta', () => {
    const bloques: Bloque[] = [
      { nombre: 'base', x: 100, ancho: 100, alto: 50 },
      { nombre: 'saliente', x: 150, ancho: 100, alto: 50, sobre: 'base' },
    ];
    expect(revisarCalle(bloques, limites).some((e) => e.includes('saliente') && e.includes('se sale'))).toBe(true);
  });

  it('un bloque fuera del ancho de la calle se reporta', () => {
    const errores = revisarCalle([{ nombre: 'lejos', x: 4700, ancho: 200, alto: 50 }], limites);
    expect(errores.some((e) => e.includes('lejos') && e.includes('calle'))).toBe(true);
  });

  it('dos bloques separados por más que la distancia máxima no se encadenan', () => {
    const bloques: Bloque[] = [
      { nombre: 'a', x: 100, ancho: 100, alto: 200 },
      { nombre: 'b', x: 500, ancho: 100, alto: 400 },
    ];
    const errores = revisarCalle(bloques, limites);
    expect(errores.some((e) => e.includes('b') && e.includes('inalcanzable'))).toBe(true);
  });

  it('la banqueta es de toque corto y el auto no', () => {
    expect(esDeToqueCorto(bloque('banqueta'), BLOQUES_CALLE_PRUEBA, limites)).toBe(true);
    expect(esDeToqueCorto(bloque('auto'), BLOQUES_CALLE_PRUEBA, limites)).toBe(false);
  });

  it('si el salto crece, los límites crecen', () => {
    const a: Ajustes = { ...AJUSTES_POR_DEFECTO, salto: { ...AJUSTES_POR_DEFECTO.salto, alturaMax: 320 } };
    const l = limitesDeSalto(a);
    expect(l.escalonMax).toBeCloseTo(272);
    expect(l.escalonMax).toBeGreaterThan(limites.escalonMax);
    expect(l.alturaMax).toBe(400);
    expect(l.grosorMin).toBe(32);
  });

  it('los límites por defecto salen de los ajustes', () => {
    expect(limites.escalonMax).toBeCloseTo(221);
    expect(limites.escalonCorto).toBeCloseTo(59.5);
    expect(limites.distanciaMax).toBeCloseTo(198.9, 1);
  });

  it('validarBloques rechaza un sobre inexistente y nombres repetidos', () => {
    expect(() => validarBloques([{ nombre: 'a', x: 0, ancho: 50, alto: 50, sobre: 'nada' }])).toThrow(/sobre/);
    const repetido = { nombre: 'a', x: 0, ancho: 50, alto: 50 };
    expect(() => validarBloques([repetido, repetido])).toThrow(/repetido/);
  });

  it('validarBloques rechaza números no positivos y textos vacíos', () => {
    expect(() => validarBloques([{ nombre: 'a', x: 0, ancho: 0, alto: 50 }])).toThrow(/ancho/);
    expect(() => validarBloques([{ nombre: '', x: 0, ancho: 5, alto: 50 }])).toThrow(/nombre/);
    expect(() => validarBloques({})).toThrow(/lista/);
  });
});
