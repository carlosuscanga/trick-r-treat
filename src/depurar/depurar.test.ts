import { describe, expect, it } from 'vitest';
import { esModoDepurar } from './depurar';

describe('esModoDepurar', () => {
  it('es verdadero si la URL trae ?depurar', () => {
    expect(esModoDepurar('?depurar')).toBe(true);
    expect(esModoDepurar('?otro=1&depurar')).toBe(true);
    expect(esModoDepurar('?depurar=1')).toBe(true);
  });

  it('es falso sin ?depurar', () => {
    expect(esModoDepurar('')).toBe(false);
    expect(esModoDepurar('?otro=1')).toBe(false);
    expect(esModoDepurar('?depurarmas')).toBe(false);
  });
});
