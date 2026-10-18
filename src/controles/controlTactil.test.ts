import { beforeEach, describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO } from '../movimiento/ajustes';
import { ControlTactil } from './controlTactil';
import { calcularDisposicion, crearDisposicion, type Disposicion } from './disposicion';
import { crearIntenciones, limpiarFlancos, type Intenciones } from './intenciones';

const ANCHO = 1280;
const ALTO = 720;

let i: Intenciones;
let c: ControlTactil;
let d: Disposicion;

beforeEach(() => {
  i = crearIntenciones();
  c = new ControlTactil(i, structuredClone(AJUSTES_POR_DEFECTO));
  d = crearDisposicion();
  calcularDisposicion(ANCHO, ALTO, AJUSTES_POR_DEFECTO, d);
});

describe('joystick', () => {
  it('dedo a la derecha da dirección 1; al levantarlo vuelve a 0', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 200 + 60, 400);
    expect(i.direccion).toBe(1);
    expect(c.joystick.dx).toBe(60);
    c.arriba(1);
    expect(i.direccion).toBe(0);
    expect(c.joystick.id).toBe(-1);
  });

  it('dedo a la izquierda da dirección -1', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 140, 400);
    expect(i.direccion).toBe(-1);
  });

  it('usa la histéresis con la dirección previa', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 200 + 20, 400);
    expect(i.direccion).toBe(1);
    c.mover(1, 200 + 12, 400);
    expect(i.direccion).toBe(1);
    c.mover(1, 200 + 8, 400);
    expect(i.direccion).toBe(0);
  });

  it('un toque en la franja de 48 px del borde no activa el joystick', () => {
    c.abajo(1, 20, 400, d);
    expect(c.joystick.id).toBe(-1);
    c.mover(1, 100, 400);
    expect(i.direccion).toBe(0);
  });

  it('un toque en la mitad derecha fuera de los botones no hace nada', () => {
    c.abajo(1, 900, 100, d);
    expect(c.joystick.id).toBe(-1);
    expect(i.saltarSostenido).toBe(false);
  });
});

describe('botones', () => {
  it('dedo en Saltar: presionado y sostenido; al levantarlo deja de sostenerse', () => {
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    expect(i.saltarPresionado).toBe(true);
    expect(i.saltarSostenido).toBe(true);
    limpiarFlancos(i);
    expect(i.saltarSostenido).toBe(true);
    c.arriba(2);
    expect(i.saltarSostenido).toBe(false);
  });

  it('Brazos da brazosPresionado una vez por toque', () => {
    c.abajo(2, d.brazos.x, d.brazos.y, d);
    expect(i.brazosPresionado).toBe(true);
    limpiarFlancos(i);
    c.mover(2, d.brazos.x + 3, d.brazos.y);
    expect(i.brazosPresionado).toBe(false);
    c.arriba(2);
    expect(i.brazosPresionado).toBe(false);
    c.abajo(3, d.brazos.x, d.brazos.y, d);
    expect(i.brazosPresionado).toBe(true);
  });

  it('saltarAbajo y brazosAbajo dicen si el botón tiene un dedo (para dibujarlo presionado)', () => {
    expect([c.saltarAbajo, c.brazosAbajo]).toEqual([false, false]);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.abajo(3, d.brazos.x, d.brazos.y, d);
    limpiarFlancos(i);
    expect([c.saltarAbajo, c.brazosAbajo]).toEqual([true, true]);
    c.arriba(3);
    expect([c.saltarAbajo, c.brazosAbajo]).toEqual([true, false]);
    c.soltarTodo();
    expect([c.saltarAbajo, c.brazosAbajo]).toEqual([false, false]);
  });

  it('joystick y Saltar a la vez con dos ids no se estorban', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    expect(i.direccion).toBe(1);
    expect(i.saltarSostenido).toBe(true);
    c.arriba(2);
    expect(i.direccion).toBe(1);
    expect(i.saltarSostenido).toBe(false);
    c.arriba(1);
    expect(i.direccion).toBe(0);
  });

  it('el mismo id que vuelve a bajar sin subir no duplica el toque', () => {
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    limpiarFlancos(i);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    expect(i.saltarPresionado).toBe(false);
  });
});

describe('cada dedo se queda con su control', () => {
  it('foco 1: un dedo que empieza en el joystick y se mueve sobre Saltar no salta', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, d.saltar.x, d.saltar.y);
    expect(i.saltarPresionado).toBe(false);
    expect(i.saltarSostenido).toBe(false);
    expect(c.joystick.id).toBe(1);
  });

  it('un dedo de Saltar que se desliza al joystick no lo mueve', () => {
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.mover(2, 200, 400);
    expect(c.joystick.id).toBe(-1);
    expect(i.direccion).toBe(0);
    expect(i.saltarSostenido).toBe(true);
  });

  it('foco 2: un tercer dedo en la zona del joystick ocupada no le roba el control', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.abajo(3, 100, 300, d);
    c.mover(3, 20, 300);
    expect(c.joystick.id).toBe(1);
    expect(c.joystick.origenX).toBe(200);
    expect(i.direccion).toBe(1);
    c.arriba(3);
    expect(c.joystick.id).toBe(1);
    expect(i.direccion).toBe(1);
  });

  it('un dedo que no es de nadie no mueve ni suelta nada', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.mover(9, 0, 0);
    c.arriba(9);
    expect(i.direccion).toBe(1);
  });
});

describe('suelta', () => {
  it('revisar suelta el joystick si su dedo ya no está abajo', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.revisar(() => false);
    expect(i.direccion).toBe(0);
    expect(c.joystick.id).toBe(-1);
  });

  it('revisar suelta Saltar y Brazos pegados', () => {
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.abajo(3, d.brazos.x, d.brazos.y, d);
    c.revisar((id) => id === 3);
    expect(i.saltarSostenido).toBe(false);
    c.revisar(() => false);
    c.abajo(4, d.saltar.x, d.saltar.y, d);
    expect(i.saltarSostenido).toBe(true);
  });

  it('revisar no toca los dedos que siguen abajo', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.revisar(() => true);
    expect(i.direccion).toBe(1);
    expect(i.saltarSostenido).toBe(true);
  });

  it('soltarTodo deja dirección 0 y nada sostenido', () => {
    c.abajo(1, 200, 400, d);
    c.mover(1, 270, 400);
    c.abajo(2, d.saltar.x, d.saltar.y, d);
    c.soltarTodo();
    expect(i.direccion).toBe(0);
    expect(i.saltarSostenido).toBe(false);
    expect(c.joystick.id).toBe(-1);
    expect(c.joystick.dx).toBe(0);
  });
});

it('lee los ajustes vivos: cambiar el radio aplica sin recrear', () => {
  const ajustes = structuredClone(AJUSTES_POR_DEFECTO);
  const c2 = new ControlTactil(i, ajustes);
  c2.abajo(1, 200, 400, d);
  c2.mover(1, 230, 400); // 30 px: 0.4·75 → activa
  expect(i.direccion).toBe(1);
  c2.arriba(1);
  ajustes.joystick.radio = 300;
  c2.abajo(1, 200, 400, d);
  c2.mover(1, 230, 400); // 30 px: 0.1·300 → zona muerta
  expect(i.direccion).toBe(0);
});
