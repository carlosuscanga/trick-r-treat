import { describe, expect, it } from 'vitest';
import { crearIntenciones, limpiarFlancos } from './intenciones';

describe('intenciones', () => {
  it('nacen en reposo', () => {
    expect(crearIntenciones()).toEqual({
      direccion: 0,
      fuerza: 0,
      saltarSostenido: false,
      saltarPresionado: false,
      brazosPresionado: false,
    });
  });

  it('limpiarFlancos baja los toques pero conserva dirección y sostenido', () => {
    const i = crearIntenciones();
    i.direccion = 1;
    i.saltarSostenido = true;
    i.saltarPresionado = true;
    i.brazosPresionado = true;
    limpiarFlancos(i);
    expect(i.saltarPresionado).toBe(false);
    expect(i.brazosPresionado).toBe(false);
    expect(i.direccion).toBe(1);
    expect(i.saltarSostenido).toBe(true);
  });
});
