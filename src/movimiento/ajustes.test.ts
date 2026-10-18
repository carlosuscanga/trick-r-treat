import { describe, expect, it } from 'vitest';
import ajustesJson from './ajustes.json' with { type: 'json' };
import { AJUSTES_POR_DEFECTO, derivarFisica, validarAjustes } from './ajustes';

/** Copia profunda del JSON para romperla en cada prueba sin tocar el original (`any` a propósito). */
function copia(): any {
  return JSON.parse(JSON.stringify(ajustesJson));
}

describe('validarAjustes', () => {
  it('el JSON por defecto pasa la validación', () => {
    expect(validarAjustes(ajustesJson)).toEqual(ajustesJson);
    expect(AJUSTES_POR_DEFECTO).toEqual(ajustesJson);
  });

  it('un campo faltante lanza un error que lo nombra', () => {
    const datos = copia();
    delete datos.salto.alturaMax;
    expect(() => validarAjustes(datos)).toThrow('ajustes.salto.alturaMax');
  });

  it('un campo no numérico lanza un error que lo nombra', () => {
    const datos = copia();
    datos.botones.saltar.derecha = '140';
    expect(() => validarAjustes(datos)).toThrow('ajustes.botones.saltar.derecha');
  });

  it('un número no finito también falla', () => {
    const datos = copia();
    datos.caminar.velocidad = Number.NaN;
    expect(() => validarAjustes(datos)).toThrow('ajustes.caminar.velocidad');
  });

  it('apiceColgado tiene que ser booleano', () => {
    const datos = copia();
    datos.salto.apiceColgado = 'no';
    expect(() => validarAjustes(datos)).toThrow('ajustes.salto.apiceColgado');
  });

  it('una sección faltante lanza un error que la nombra', () => {
    const datos = copia();
    delete datos.botones.brazos;
    expect(() => validarAjustes(datos)).toThrow('ajustes.botones.brazos');
    delete datos.joystick;
    expect(() => validarAjustes(datos)).toThrow('ajustes.joystick');
  });

  it('la raíz tiene que ser un objeto', () => {
    expect(() => validarAjustes(null)).toThrow('ajustes');
    expect(() => validarAjustes([])).toThrow('ajustes');
  });
});

describe('derivarFisica', () => {
  it('deriva gravedades y velocidades de la altura y los tiempos', () => {
    const f = derivarFisica(AJUSTES_POR_DEFECTO.salto);
    expect(f.gSubida).toBeCloseTo(3601, 0);
    expect(f.v0).toBeCloseTo(1368.4, 0);
    expect(f.gBajada).toBeCloseTo(7133, 0);
    expect(f.vCorte).toBeCloseTo(710, 0);
  });

  it('copia tal cual los valores que no se derivan', () => {
    const f = derivarFisica(AJUSTES_POR_DEFECTO.salto);
    expect(f.caidaMax).toBe(1500);
    expect(f.coyoteMs).toBe(100);
    expect(f.bufferMs).toBe(130);
    expect(f.apiceColgado).toBe(false);
  });
});
