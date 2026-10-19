import { describe, expect, it } from 'vitest';
import { DISFRACES, DULCES_POR_DIFICULTAD, PUERTAS, VECINOS, validarDisfraces, validarPuertas, validarVecinos } from '.';
import puertasJson from './puertas-prueba.json' with { type: 'json' };
import { ANCHO_CALLE, X_INICIO } from './plataformas';

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

describe('validarPuertas', () => {
  it('acepta el JSON real', () => {
    expect(validarPuertas(puertasJson)).toEqual(PUERTAS);
    expect(PUERTAS.puertas).toHaveLength(8);
  });

  it('deja las puertas dentro de la calle, separadas y con dulces para ganar', () => {
    const xs = PUERTAS.puertas.map((p) => p.x);
    xs.forEach((x) => expect(x).toBeGreaterThan(X_INICIO));
    xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThan(2 * PUERTAS.radio));
    const dulces = PUERTAS.puertas.reduce((suma, p) => suma + DULCES_POR_DIFICULTAD[p.dificultad], 0);
    expect(dulces).toBeGreaterThanOrEqual(10);
  });

  it('rechaza si faltan puertas', () => {
    const datos = { ...puertasJson, puertas: puertasJson.puertas.slice(1) };
    expect(() => validarPuertas(datos)).toThrow(/debe tener 8 puertas y tiene 7/);
  });

  it('rechaza una dificultad inexistente', () => {
    const puertas = puertasJson.puertas.map((p, i) => (i === 0 ? { ...p, dificultad: 'imposible' } : p));
    expect(() => validarPuertas({ ...puertasJson, puertas })).toThrow(/"dificultad" desconocido: "imposible"/);
  });

  it('rechaza una x fuera de la calle', () => {
    const puertas = puertasJson.puertas.map((p, i) => (i === 0 ? { ...p, x: ANCHO_CALLE + 1 } : p));
    expect(() => validarPuertas({ ...puertasJson, puertas })).toThrow(/"x" debe ser un número entre 0 y/);
  });

  it('rechaza un radio que no es positivo', () => {
    expect(() => validarPuertas({ ...puertasJson, radio: 0 })).toThrow(/"radio"/);
  });
});
