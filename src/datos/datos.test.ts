import { describe, expect, it } from 'vitest';
import { DISFRACES, VECINOS, validarDisfraces, validarVecinos } from '.';

describe('datos desde JSON', () => {
  it('carga los disfraces y los vecinos', () => {
    expect(DISFRACES).toHaveLength(5);
    expect(VECINOS).toHaveLength(8);
    expect(DISFRACES.map((d) => d.tipo)).toEqual(['reflejos', 'memoria', 'puzzle', 'plataformas', 'ritmo']);
  });
});

describe('validarDisfraces', () => {
  const gata = { id: 'gata', nombre: 'Gata', tipo: 'reflejos', ventaja: 'x' };

  it('rechaza lo que no es lista', () => {
    expect(() => validarDisfraces({})).toThrow(/debe ser una lista/);
  });

  it('rechaza un tipo de reto desconocido', () => {
    expect(() => validarDisfraces([{ ...gata, tipo: 'magia' }])).toThrow(/"tipo" desconocido: "magia"/);
    // Nombres heredados de Object no cuentan como tipos válidos.
    expect(() => validarDisfraces([{ ...gata, tipo: 'toString' }])).toThrow(/"tipo" desconocido/);
  });

  it('rechaza textos vacíos', () => {
    expect(() => validarDisfraces([{ ...gata, nombre: '' }])).toThrow(/"nombre" debe ser un texto/);
  });

  it('rechaza ids repetidos', () => {
    expect(() => validarDisfraces([gata, gata])).toThrow(/id repetido "gata"/);
  });
});

describe('validarVecinos', () => {
  it('pide exactamente 8 vecinos', () => {
    expect(() => validarVecinos(VECINOS.slice(1))).toThrow(/debe tener 8 vecinos y tiene 7/);
  });

  it('rechaza un susto desconocido', () => {
    const conSustoMalo = VECINOS.map((v, i) => (i === 0 ? { ...v, susto: 'grita' } : v));
    expect(() => validarVecinos(conSustoMalo)).toThrow(/"susto" desconocido: "grita"/);
  });
});
