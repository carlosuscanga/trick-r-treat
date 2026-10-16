import Phaser from 'phaser';
import { Arranque } from './escenas/Arranque';
import { pausarEnVertical } from './plataforma/orientacion';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scale: {
    // Resolución lógica fija: Phaser la escala sin deformar y centra el canvas.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [Arranque],
});

pausarEnVertical(game);
