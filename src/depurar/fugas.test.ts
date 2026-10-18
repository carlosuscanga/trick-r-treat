import { describe, expect, it } from 'vitest';
import { crecimientos } from './fugas';

describe('crecimientos', () => {
  it('con los mismos valores no hay crecimientos', () => {
    expect(crecimientos({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual([]);
  });

  it('un contador que sube aparece con antes y despues', () => {
    expect(crecimientos({ a: 1, b: 2 }, { a: 1, b: 5 })).toEqual([
      { clave: 'b', antes: 2, despues: 5 },
    ]);
  });

  it('un contador que baja no es fuga', () => {
    expect(crecimientos({ a: 9 }, { a: 3 })).toEqual([]);
  });

  it('una clave nueva cuenta desde 0', () => {
    expect(crecimientos({}, { nueva: 4 })).toEqual([{ clave: 'nueva', antes: 0, despues: 4 }]);
    expect(crecimientos({}, { nueva: 0 })).toEqual([]);
  });
});
