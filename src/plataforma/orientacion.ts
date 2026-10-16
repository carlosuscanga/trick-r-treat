import type Phaser from 'phaser';

type Pausable = Pick<Phaser.Game, 'pause' | 'resume'>;
type ConsultaVertical = Pick<MediaQueryList, 'matches' | 'addEventListener'>;

// El aviso de "gira tu teléfono" es CSS (index.html). Esto solo congela el juego
// mientras está en vertical, para que ningún reloj avance detrás del aviso.
export function pausarEnVertical(
  game: Pausable,
  vertical: ConsultaVertical = window.matchMedia('(orientation: portrait)'),
) {
  const aplicar = () => {
    if (vertical.matches) {
      game.pause();
    } else {
      game.resume();
    }
  };

  vertical.addEventListener('change', aplicar);
  aplicar();
}
