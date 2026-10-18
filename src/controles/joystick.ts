// Matemática del joystick flotante: zona muerta con histéresis y tope de la
// perilla. Sin Phaser.

/**
 * Dirección horizontal según el desplazamiento `dx` del dedo. Se activa al pasar
 * `activa·radio` y se suelta hasta bajar de `suelta·radio` (histéresis, `suelta < activa`),
 * para que el dedo temblando en el borde no parpadee entre 0 y ±1.
 */
export function direccionJoystick(
  dx: number,
  previa: -1 | 0 | 1,
  radio: number,
  activa: number,
  suelta: number,
): -1 | 0 | 1 {
  const umbralActiva = activa * radio;
  if (dx > umbralActiva) return 1;
  if (dx < -umbralActiva) return -1;
  const umbralSuelta = suelta * radio;
  if (previa === 1 && dx > umbralSuelta) return 1;
  if (previa === -1 && dx < -umbralSuelta) return -1;
  return 0;
}

/** Recorta (dx, dy) a un círculo de `radio` y lo escribe en `salida`. */
export function limitarPerilla(dx: number, dy: number, radio: number, salida: { x: number; y: number }): void {
  const largo = Math.hypot(dx, dy);
  if (largo <= radio) {
    salida.x = dx;
    salida.y = dy;
    return;
  }
  const escala = radio / largo;
  salida.x = dx * escala;
  salida.y = dy * escala;
}
