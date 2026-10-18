import type Phaser from 'phaser';

declare global {
  interface Window {
    __juego?: Phaser.Game;
  }
}

// mínima; T-037 la completa (overlay, contadores). Solo con `?depurar` en la URL.
export function esModoDepurar(search: string): boolean {
  return new URLSearchParams(search).has('depurar');
}

// Deja el juego a la mano de la consola y de los e2e.
export function exponerJuego(game: Phaser.Game): void {
  window.__juego = game;
}
