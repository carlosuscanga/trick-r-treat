import { describe, expect, it } from 'vitest';
import { direccionJoystick, limitarPerilla } from './joystick';

const R = 75;
const ACTIVA = 0.25;
const SUELTA = 0.15;

describe('direccionJoystick', () => {
  it('dentro de la zona muerta desde 0 sigue en 0', () => {
    expect(direccionJoystick(0.2 * R, 0, R, ACTIVA, SUELTA)).toBe(0);
    expect(direccionJoystick(-0.2 * R, 0, R, ACTIVA, SUELTA)).toBe(0);
  });

  it('pasar el umbral de activación da la dirección', () => {
    expect(direccionJoystick(0.26 * R, 0, R, ACTIVA, SUELTA)).toBe(1);
    expect(direccionJoystick(-0.26 * R, 0, R, ACTIVA, SUELTA)).toBe(-1);
  });

  it('histéresis: ya en 1 se mantiene hasta bajar del umbral de suelta', () => {
    expect(direccionJoystick(0.16 * R, 1, R, ACTIVA, SUELTA)).toBe(1);
    expect(direccionJoystick(0.14 * R, 1, R, ACTIVA, SUELTA)).toBe(0);
  });

  it('histéresis hacia -1', () => {
    expect(direccionJoystick(-0.16 * R, -1, R, ACTIVA, SUELTA)).toBe(-1);
    expect(direccionJoystick(-0.14 * R, -1, R, ACTIVA, SUELTA)).toBe(0);
  });

  it('cruzar de un lado al otro cambia de dirección', () => {
    expect(direccionJoystick(-0.5 * R, 1, R, ACTIVA, SUELTA)).toBe(-1);
    expect(direccionJoystick(0.5 * R, -1, R, ACTIVA, SUELTA)).toBe(1);
  });
});

describe('limitarPerilla', () => {
  it('recorta al radio', () => {
    const s = { x: 0, y: 0 };
    limitarPerilla(300, 0, 75, s);
    expect(s.x).toBeCloseTo(75);
    expect(s.y).toBeCloseTo(0);
  });

  it('recorta en diagonal conservando el ángulo', () => {
    const s = { x: 0, y: 0 };
    limitarPerilla(300, 400, 75, s);
    expect(s.x).toBeCloseTo(45);
    expect(s.y).toBeCloseTo(60);
  });

  it('dentro del radio queda igual', () => {
    const s = { x: 0, y: 0 };
    limitarPerilla(30, 40, 75, s);
    expect(s).toEqual({ x: 30, y: 40 });
  });
});
