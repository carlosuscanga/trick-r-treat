import { describe, expect, it } from 'vitest';
import {
  CLAVE_EN_PARTIDA,
  CLAVE_RECARGAS,
  leerRecargas,
  marcarEntrada,
  marcarSalida,
  registrarArranque,
} from './recargas';

function almacenFalso() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
}

const almacenQueLanza = {
  getItem: (): string | null => {
    throw new Error('bloqueado');
  },
  setItem: (): void => {
    throw new Error('bloqueado');
  },
  removeItem: (): void => {
    throw new Error('bloqueado');
  },
};

describe('recargas', () => {
  it('el primer arranque cuenta 0 y pone la marca', () => {
    const s = almacenFalso();
    expect(registrarArranque(s)).toBe(0);
    expect(s.datos.get(CLAVE_EN_PARTIDA)).toBe('1');
    expect(leerRecargas(s)).toBe(0);
  });

  it('arrancar con la marca puesta suma 1 y se acumula', () => {
    const s = almacenFalso();
    registrarArranque(s);
    expect(registrarArranque(s)).toBe(1);
    expect(registrarArranque(s)).toBe(2);
    expect(s.datos.get(CLAVE_RECARGAS)).toBe('2');
    expect(leerRecargas(s)).toBe(2);
  });

  it('marcarSalida y luego arrancar no cuenta', () => {
    const s = almacenFalso();
    registrarArranque(s);
    marcarSalida(s);
    expect(s.datos.has(CLAVE_EN_PARTIDA)).toBe(false);
    expect(registrarArranque(s)).toBe(0);
  });

  it('marcarEntrada vuelve a poner la marca sin contar', () => {
    const s = almacenFalso();
    registrarArranque(s);
    marcarSalida(s);
    marcarEntrada(s);
    expect(s.datos.get(CLAVE_EN_PARTIDA)).toBe('1');
    expect(leerRecargas(s)).toBe(0);
  });

  it('un contador guardado corrupto cuenta como 0', () => {
    const s = almacenFalso();
    s.datos.set(CLAVE_RECARGAS, 'basura');
    expect(leerRecargas(s)).toBe(0);
  });

  it('un almacen que lanza o es null no truena y cuenta 0', () => {
    for (const s of [almacenQueLanza, null]) {
      expect(registrarArranque(s)).toBe(0);
      expect(() => marcarSalida(s)).not.toThrow();
      expect(() => marcarEntrada(s)).not.toThrow();
      expect(leerRecargas(s)).toBe(0);
    }
  });
});
