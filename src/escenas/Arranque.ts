import Phaser from 'phaser';

// Primera escena: pide el primer toque, que en iOS es lo que desbloquea el audio.
export class Arranque extends Phaser.Scene {
  constructor() {
    super('Arranque');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'Toca para empezar', {
        fontSize: '48px',
        color: '#ff9a3c',
      })
      .setOrigin(0.5);
  }
}
