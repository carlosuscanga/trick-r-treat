import { describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO } from '../movimiento/ajustes';
import { calcularDisposicion, crearDisposicion } from './disposicion';

const ALTO = 720;

describe.each([1280, 1872])('calcularDisposicion con ancho %i', (ancho) => {
  const d = crearDisposicion();
  calcularDisposicion(ancho, ALTO, AJUSTES_POR_DEFECTO, d);

  it('Saltar y Brazos no se solapan (≥ 40 px entre zonas de toque)', () => {
    const dist = Math.hypot(d.saltar.x - d.brazos.x, d.saltar.y - d.brazos.y);
    expect(dist - d.saltar.r - d.brazos.r).toBeGreaterThanOrEqual(40);
  });

  it('ningún círculo baja de alto - 40', () => {
    expect(d.saltar.y + d.saltar.r).toBeLessThanOrEqual(ALTO - 40);
    expect(d.brazos.y + d.brazos.r).toBeLessThanOrEqual(ALTO - 40);
  });

  it('se anclan al borde derecho real', () => {
    expect(d.saltar).toEqual({ x: ancho - 140, y: ALTO - 130, r: 75 });
    expect(d.brazos).toEqual({ x: ancho - 310, y: ALTO - 250, r: 75 });
  });

  it('la zona del joystick empieza en 48 y llega a la mitad', () => {
    expect(d.zonaJoystick.x).toBe(48);
    expect(d.zonaJoystick.ancho).toBe(ancho / 2 - 48);
    expect(d.zonaJoystick.y).toBe(40);
    expect(d.zonaJoystick.alto).toBe(ALTO - 80);
  });
});

it('sigue los ajustes vivos (el panel mueve los botones)', () => {
  const a = structuredClone(AJUSTES_POR_DEFECTO);
  a.botones.saltar.derecha = 200;
  const d = crearDisposicion();
  calcularDisposicion(1280, ALTO, a, d);
  expect(d.saltar.x).toBe(1080);
});
