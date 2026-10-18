import type Phaser from 'phaser';
import type { Instantanea, Metricas } from './metricas';

declare global {
  interface Window {
    __juego?: Phaser.Game;
    // Solo con `?depurar`. Ningún código del juego lo usa: es para la consola y los e2e.
    __depurar?: { instantanea(): Instantanea; metricas(): Metricas };
  }
}

// Solo con `?depurar` en la URL.
export function esModoDepurar(search: string): boolean {
  return new URLSearchParams(search).has('depurar');
}

// Deja el juego a la mano de la consola y de los e2e.
export function exponerJuego(game: Phaser.Game): void {
  window.__juego = game;
}
