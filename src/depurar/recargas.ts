// Cuenta recargas inesperadas de la pestaña (ROB-04). Sin Phaser.
// Idea: la marca se quita en pagehide; si al arrancar sigue puesta, la sesión anterior murió sin avisar.

export const CLAVE_EN_PARTIDA = 'trt:en-partida';
export const CLAVE_RECARGAS = 'trt:recargas';

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** sessionStorage, o null si el navegador lo bloquea (el getter puede lanzar). */
export function obtenerSesion(): Almacen | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** Al arrancar: si la marca ya estaba, la sesión anterior murió sin pagehide → suma 1. Pone la marca. Devuelve el total de recargas. */
export function registrarArranque(s: Almacen | null): number {
  if (!s) return 0;
  try {
    let total = leerRecargas(s);
    if (s.getItem(CLAVE_EN_PARTIDA) !== null) {
      total += 1;
      s.setItem(CLAVE_RECARGAS, String(total));
    }
    s.setItem(CLAVE_EN_PARTIDA, '1');
    return total;
  } catch {
    return 0;
  }
}

/** En pagehide: quita la marca. */
export function marcarSalida(s: Almacen | null): void {
  try {
    s?.removeItem(CLAVE_EN_PARTIDA);
  } catch {
    // almacén bloqueado: no pasa nada
  }
}

/** En pageshow con persisted (vuelve del bfcache): vuelve a poner la marca sin contar. */
export function marcarEntrada(s: Almacen | null): void {
  try {
    s?.setItem(CLAVE_EN_PARTIDA, '1');
  } catch {
    // almacén bloqueado: no pasa nada
  }
}

export function leerRecargas(s: Almacen | null): number {
  try {
    const n = Number(s?.getItem(CLAVE_RECARGAS));
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
