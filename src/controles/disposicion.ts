// Dónde va cada control. Se ancla a los bordes reales de la pantalla (no a la
// zona segura de 1280×720) y se deriva de los ajustes, para que el panel
// `?depurar` pueda moverlos. Sin Phaser.

import type { Ajustes } from '../movimiento/ajustes';

export type Circulo = { x: number; y: number; r: number };

export type Disposicion = {
  zonaJoystick: { x: number; y: number; ancho: number; alto: number };
  saltar: Circulo;
  brazos: Circulo;
};

export function crearDisposicion(): Disposicion {
  return {
    zonaJoystick: { x: 0, y: 0, ancho: 0, alto: 0 },
    saltar: { x: 0, y: 0, r: 0 },
    brazos: { x: 0, y: 0, r: 0 },
  };
}

/** Recalcula la disposición en `salida` (se llama al arrancar y en cada `resize`). */
export function calcularDisposicion(ancho: number, alto: number, a: Ajustes, salida: Disposicion): void {
  const zona = salida.zonaJoystick;
  zona.x = a.joystick.margenBorde;
  zona.y = a.botones.margenAbajo;
  zona.ancho = ancho / 2 - a.joystick.margenBorde;
  zona.alto = alto - 2 * a.botones.margenAbajo;

  salida.saltar.x = ancho - a.botones.saltar.derecha;
  salida.saltar.y = alto - a.botones.saltar.abajo;
  salida.saltar.r = a.botones.radioToque;

  salida.brazos.x = ancho - a.botones.brazos.derecha;
  salida.brazos.y = alto - a.botones.brazos.abajo;
  salida.brazos.r = a.botones.radioToque;
}
