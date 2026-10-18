// Velocidad horizontal al caminar. Sin Phaser: lo prueba Vitest en Node.

import type { Ajustes } from './ajustes';

/**
 * Con `proporcional` apagado: `direccion · velocidad`. Prendido, la velocidad va de
 * `velocidadMinima` (fuerza 0) a la completa (fuerza 1), lineal en medio.
 */
export function velocidadCaminar(direccion: number, fuerza: number, caminar: Ajustes['caminar']): number {
  if (!caminar.proporcional) return direccion * caminar.velocidad;
  const minima = caminar.velocidadMinima;
  return direccion * caminar.velocidad * (minima + (1 - minima) * fuerza);
}
