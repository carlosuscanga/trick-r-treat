import { describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO, type Ajustes } from '../movimiento/ajustes';
import {
  BLOQUES_CALLE_PRUEBA,
  X_INICIO,
  perfilDeCalle,
  alturaToquePulgar,
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

  it('sin el pórtico no se llega al techo (el barril queda del otro lado de la casa)', () => {
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
    expect(errores.some((e) => e.includes('"b"') && e.includes('inalcanzable'))).toBe(true);
  });

  it('sin el barril no se puede regresar del lado de la cerca (el bug)', () => {
    const sinBarril = BLOQUES_CALLE_PRUEBA.filter((b) => b.nombre !== 'barril');
    const errores = revisarCalle(sinBarril, limites);
    expect(errores.some((e) => e.includes('no se puede regresar') && e.includes('"banqueta" (x 3720 a 3900)'))).toBe(true);
  });

  // Dos escalones suben a muros de 250; entre ellos hay un hoyo de la calle.
  // Empieza en x 600, a la derecha de donde aparece Mi vo.
  const conHoyo = (xDer: number, xSalida: number): Bloque[] => [
    { nombre: 's1', x: 600, ancho: 100, alto: 150 },
    { nombre: 'izq', x: 700, ancho: 100, alto: 250 },
    { nombre: 'der', x: xDer, ancho: 100, alto: 250 },
    { nombre: 's2', x: xSalida, ancho: 100, alto: 150 },
  ];

  it('un hoyo angosto entre dos muros altos atrapa, pero el muro del otro lado se alcanza saltándolo', () => {
    const errores = revisarCalle(conHoyo(900, 1000), limites);
    expect(errores.some((e) => e.includes('no se puede regresar') && e.includes('"calle" (x 800 a 900)'))).toBe(true);
    expect(errores.some((e) => e.includes('inalcanzable'))).toBe(false);
  });

  it('un hoyo más ancho que la distancia máxima corta el paso', () => {
    const errores = revisarCalle(conHoyo(1100, 1200), limites);
    expect(errores.some((e) => e.includes('"der"') && e.includes('inalcanzable desde el inicio'))).toBe(true);
  });

  it('el perfil recorta a la calle, fusiona tramos iguales y omite lo que queda fuera', () => {
    const tramos = perfilDeCalle([
      { nombre: 'a', x: 0, ancho: 100, alto: 50 },
      { nombre: 'b', x: 300, ancho: 100, alto: 80 },
      { nombre: 'c', x: 330, ancho: 40, alto: 40, sobre: 'b' },
      { nombre: 'fuera', x: 4800, ancho: 100, alto: 50 },
    ]);
    expect(tramos).toEqual([
      { nombre: 'a', desde: 0, hasta: 100, altura: 50 },
      { nombre: 'calle', desde: 100, hasta: 300, altura: 0 },
      { nombre: 'b', desde: 300, hasta: 330, altura: 80 },
      { nombre: 'c', desde: 330, hasta: 370, altura: 120 },
      { nombre: 'b', desde: 370, hasta: 400, altura: 80 },
      { nombre: 'calle', desde: 400, hasta: 4800, altura: 0 },
    ]);
  });

  it('el inicio es el tramo donde aparece Mi vo, no el de x = 0', () => {
    // Un muro alto pegado al borde izquierdo no atrapa a Mi vo, que aparece a su derecha.
    const errores = revisarCalle([{ nombre: 'muro', x: 0, ancho: X_INICIO - 40, alto: 300 }], limites);
    expect(errores.some((e) => e.includes('no se puede regresar'))).toBe(false);
    expect(errores.some((e) => e.includes('"muro"') && e.includes('inalcanzable'))).toBe(true);
  });

  it('con un toque de pulgar suben la banqueta y el auto, pero no el techo', () => {
    // En el iPhone, un toque normal de pulgar alcanza el auto (T-004, segunda ronda).
    expect(esDeToqueCorto(bloque('banqueta'), BLOQUES_CALLE_PRUEBA, limites)).toBe(true);
    expect(esDeToqueCorto(bloque('auto'), BLOQUES_CALLE_PRUEBA, limites)).toBe(true);
    expect(esDeToqueCorto(bloque('casa'), BLOQUES_CALLE_PRUEBA, limites)).toBe(false);
  });

  it('el toque de pulgar suma lo que sube con el dedo abajo y la altura mínima', () => {
    const salto = { ...AJUSTES_POR_DEFECTO.salto, alturaMax: 260, alturaMin: 70, tiempoSubida: 0.35 };
    // v0 = 1485.7, g = 4244.9: 1485.7 · 0.08 − 4244.9 · 0.08² / 2 + 70 ≈ 175.3
    expect(alturaToquePulgar(salto)).toBeCloseTo(175.3, 1);
    // Con un salto muy lento, al soltar ya va más lento que el corte: llega a la máxima.
    expect(alturaToquePulgar({ ...salto, alturaMin: 255, tiempoSubida: 0.6 })).toBe(260);
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
    expect(limites.escalonCorto).toBeCloseTo(0.85 * 175.3, 0);
    // 0.85 · 561 · (0.35 + 0.19)
    expect(limites.distanciaMax).toBeCloseTo(257.5, 1);
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
