import { describe, expect, it } from 'vitest';
import ajustesJson from './ajustes.json' with { type: 'json' };
import { AJUSTES_POR_DEFECTO, derivarFisica, topeVertical, validarAjustes } from './ajustes';

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

  it('proporcional tiene que ser booleano y velocidadMinima un número', () => {
    const a = copia();
    a.caminar.proporcional = 1;
    expect(() => validarAjustes(a)).toThrow('ajustes.caminar.proporcional');
    const b = copia();
    b.caminar.velocidadMinima = '0.3';
    expect(() => validarAjustes(b)).toThrow('ajustes.caminar.velocidadMinima');
  });

  it('velocidadMinima tiene que estar en (0, 1]', () => {
    for (const malo of [0, -0.5, 1.2]) {
      const a = copia();
      a.caminar.velocidadMinima = malo;
      expect(() => validarAjustes(a)).toThrow('ajustes.caminar.velocidadMinima');
    }
  });

  it('el JSON trae la velocidad proporcional apagada', () => {
    expect(AJUSTES_POR_DEFECTO.caminar.proporcional).toBe(false);
    expect(AJUSTES_POR_DEFECTO.caminar.velocidadMinima).toBe(0.3);
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

describe('topeVertical', () => {
  it('con los valores por defecto manda la caída máxima', () => {
    expect(topeVertical(derivarFisica(AJUSTES_POR_DEFECTO.salto))).toBe(1500);
  });

  it('si el salto despega más rápido que la caída máxima, manda v0', () => {
    const f = derivarFisica({ ...AJUSTES_POR_DEFECTO.salto, alturaMax: 400, tiempoSubida: 0.2 });
    expect(f.v0).toBeCloseTo(4000, 0);
    expect(topeVertical(f)).toBe(f.v0);
  });
});
