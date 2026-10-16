import type Phaser from 'phaser';

// Ancho dinámico: la altura lógica es fija y el ancho se ajusta a la pantalla, para que
// FIT no deje franjas a los lados. Lo importante de cada escena va en la zona segura
// central (ANCHO_SEGURO × ALTO); los lados solo muestran más escenario.
export const ALTO = 720;
export const ANCHO_SEGURO = 1280; // 16:9
export const ANCHO_MAXIMO = 1872; // 2.6:1, iPhone horizontal con la barra de Safari visible

// Ancho lógico del juego para una pantalla de ancho × alto (en cualquier unidad).
export function calcularAncho(ancho: number, alto: number): number {
  if (ancho <= 0 || alto <= 0) {
    return ANCHO_SEGURO;
  }

  const proporcional = Math.round((ALTO * ancho) / alto);
  return Math.min(ANCHO_MAXIMO, Math.max(ANCHO_SEGURO, proporcional));
}

export function anchoParaPantalla(contenedor: Element): number {
  const { width, height } = contenedor.getBoundingClientRect();
  return calcularAncho(width, height);
}

// Recalcula el ancho al girar, al mostrar u ocultar barras del navegador, etc.
// Las escenas se reacomodan escuchando el evento 'resize' de this.scale.
export function ajustarAnchoAlContenedor(game: Phaser.Game, contenedor: Element) {
  new ResizeObserver(() => {
    const ancho = anchoParaPantalla(contenedor);
    if (ancho !== game.scale.gameSize.width) {
      game.scale.setGameSize(ancho, ALTO);
    }
  }).observe(contenedor);
}
