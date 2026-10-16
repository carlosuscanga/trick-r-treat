import Phaser from 'phaser';

// Escena temporal: solo para comprobar que Phaser arranca. La borraremos en el paso 2.
class SmokeTest extends Phaser.Scene {
  constructor() {
    super('SmokeTest');
  }

  create() {
    this.add.text(20, 20, `Phaser ${Phaser.VERSION} funcionando`, {
      fontSize: '32px',
      color: '#ffffff',
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [SmokeTest],
});