// Lo que la escena lee de los controles. Quien llena estas intenciones (táctil,
// teclado) es intercambiable. Sin Phaser: lo prueba Vitest en Node.

export type Intenciones = {
  direccion: -1 | 0 | 1;
  /** Qué tan lejos está el dedo del origen del joystick, de 0 a 1. */
  fuerza: number;
  /** Saltar sigue abajo (para saltar más alto y el ápice colgado). */
  saltarSostenido: boolean;
  /** Saltar se tocó desde el último update; lo baja `limpiarFlancos`. */
  saltarPresionado: boolean;
  /** Brazos se tocó desde el último update; lo baja `limpiarFlancos`. */
  brazosPresionado: boolean;
};

export function crearIntenciones(): Intenciones {
  return { direccion: 0, fuerza: 0, saltarSostenido: false, saltarPresionado: false, brazosPresionado: false };
}

/** Se llama al final de cada update: los toques valen un solo frame. */
export function limpiarFlancos(i: Intenciones): void {
  i.saltarPresionado = false;
  i.brazosPresionado = false;
}
