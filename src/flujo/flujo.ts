// Reglas del flujo entre escenas. Sin Phaser: lo prueba Vitest.

import type { Puerta } from '../datos/tipos';
import type { GameState } from '../estado/GameState';

/**
 * Índice de la puerta no visitada más cercana a `x` dentro de `radio`, o `null`.
 * `visitadas` dice si una casa ya se visitó (por ejemplo `gameState.estaVisitada`).
 * Solo se entra desde el suelo: `apoyada` (pisa algo) y con los pies a `alturaPies` o menos
 * de `alturaSueloMax` sobre la calle. Sobre un bloque alto o en el aire siempre es `null`.
 */
export function puertaCercana(
  x: number,
  apoyada: boolean,
  alturaPies: number,
  alturaSueloMax: number,
  puertas: readonly Puerta[],
  visitadas: (indice: number) => boolean,
  radio: number,
): number | null {
  if (!apoyada || alturaPies > alturaSueloMax) return null;
  let mejor: number | null = null;
  let distanciaMejor = Infinity;
  for (let i = 0; i < puertas.length; i++) {
    if (visitadas(i)) continue;
    const distancia = Math.abs(puertas[i].x - x);
    if (distancia <= radio && distancia < distanciaMejor) {
      mejor = i;
      distanciaMejor = distancia;
    }
  }
  return mejor;
}

/** A dónde va el juego después de un resultado: al final si ya ganó o perdió, si no a la calle. */
export function siguienteTrasResultado(estado: Pick<GameState, 'haGanado' | 'haPerdido'>): 'Calle' | 'FinJuego' {
  return estado.haGanado() || estado.haPerdido() ? 'FinJuego' : 'Calle';
}
