import Phaser from 'phaser';

// Ancho dinámico: la altura lógica es fija y el ancho se ajusta a la pantalla, para que
// FIT no deje franjas a los lados. Lo importante de cada escena va en la zona segura
// central (ANCHO_SEGURO × ALTO); los lados solo muestran más escenario.
export const ALTO = 720;
export const ANCHO_SEGURO = 1280; // 16:9
const ANCHO_MAXIMO = 1872; // 2.6:1, iPhone horizontal con la barra de Safari visible

export function anchoParaPantalla(contenedor: HTMLElement): number {
  const { width, height } = contenedor.getBoundingClientRect();
  if (width === 0 || height === 0) {
    return ANCHO_SEGURO;
  }

  const ancho = Math.round((ALTO * width) / height);
  return Phaser.Math.Clamp(ancho, ANCHO_SEGURO, ANCHO_MAXIMO);
}

// Recalcula el ancho al girar, al mostrar u ocultar barras del navegador, etc.
// Las escenas se reacomodan escuchando el evento 'resize' de this.scale.
export function ajustarAnchoAlContenedor(game: Phaser.Game, contenedor: HTMLElement) {
  new ResizeObserver(() => {
    const ancho = anchoParaPantalla(contenedor);
    if (ancho !== game.scale.gameSize.width) {
      game.scale.setGameSize(ancho, ALTO);
    }
  }).observe(contenedor);
}
