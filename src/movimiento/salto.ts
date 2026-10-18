// Máquina del salto tipo Mario: coyote time, búfer, altura variable y gravedad por
// fase. Sin Phaser y sin asignaciones por frame: el estado vive en un objeto que se
// reutiliza y el resultado se escribe en `salida`. La escena aplica `salida.vy` (si no
// es null) y `salida.gravedad` al cuerpo de Arcade. `vy` negativo es hacia arriba.

import type { Fisica } from './ajustes';

/** Cerca del ápice (|vy| menor que esto, en px/s), `apiceColgado` reduce la gravedad. */
const VY_APICE = 120;

/** Búfer vacío: ningún toque pendiente. */
const SIN_BUFFER = Number.NEGATIVE_INFINITY;

export type EstadoSalto = {
  /** ms desde que dejó el suelo, contando el frame actual. */
  tiempoSinSuelo: number;
  /** ms que le quedan al toque de Saltar pendiente; vigente mientras sea >= 0. */
  tiempoBuffer: number;
  /** Dejó el suelo saltando: el coyote ya no aplica hasta volver al suelo. */
  saltoUsado: boolean;
  enSueloAntes: boolean;
};

export type SalidaSalto = {
  /** Velocidad vertical nueva, o null si no cambia. */
  vy: number | null;
  /** Gravedad para este frame, en px/s². */
  gravedad: number;
  evento: 'salto' | 'aterrizaje' | null;
};

export function crearEstadoSalto(): EstadoSalto {
  return {
    // Infinito: si empieza en el aire, el coyote no aplica.
    tiempoSinSuelo: Number.POSITIVE_INFINITY,
    tiempoBuffer: SIN_BUFFER,
    saltoUsado: false,
    // true: empezar en el suelo no cuenta como aterrizaje.
    enSueloAntes: true,
  };
}

/**
 * Un paso por frame. `presionado`: se tocó Saltar en este frame (flanco);
 * `sostenido`: sigue abajo. Las ventanas son inclusivas: salta con 100 ms sin suelo
 * (no con 101) y con un toque de hace 130 ms (no de hace 131).
 */
export function pasoSalto(
  e: EstadoSalto,
  enSuelo: boolean,
  vy: number,
  presionado: boolean,
  sostenido: boolean,
  dtMs: number,
  f: Fisica,
  salida: SalidaSalto,
): SalidaSalto {
  salida.vy = null;
  salida.evento = null;

  // 1. Búfer: el toque se guarda y se descuenta el tiempo del frame.
  if (presionado) e.tiempoBuffer = f.bufferMs;
  else e.tiempoBuffer -= dtMs;

  // 2. Suelo.
  if (enSuelo) {
    if (!e.enSueloAntes) salida.evento = 'aterrizaje';
    e.tiempoSinSuelo = 0;
    e.saltoUsado = false;
  } else {
    e.tiempoSinSuelo += dtMs;
  }
  e.enSueloAntes = enSuelo;

  // 3. Saltar (desde el suelo o dentro del coyote, si no dejó el suelo saltando).
  let vyFinal = vy;
  if (e.tiempoBuffer >= 0 && (enSuelo || (e.tiempoSinSuelo <= f.coyoteMs && !e.saltoUsado))) {
    vyFinal = -f.v0;
    salida.vy = vyFinal;
    salida.evento = 'salto';
    e.saltoUsado = true;
    e.tiempoBuffer = SIN_BUFFER;
  }

  // 4. Altura variable: sin Saltar abajo, la subida se recorta a vCorte. También en el
  // frame del salto, si el toque ya terminó (más corto que un frame).
  if (!sostenido && vyFinal < -f.vCorte) {
    vyFinal = -f.vCorte;
    salida.vy = vyFinal;
  }

  // 5. Gravedad por fase: más fuerte al caer.
  let gravedad = vyFinal < 0 ? f.gSubida : f.gBajada;
  if (f.apiceColgado && sostenido && Math.abs(vyFinal) < VY_APICE) gravedad /= 2;
  salida.gravedad = gravedad;
  return salida;
}
