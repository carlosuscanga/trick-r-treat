import Phaser from 'phaser';

// Primera escena: pide el primer toque, que en iOS es lo que desbloquea el audio.
// Phaser desbloquea el audio solo con ese toque; aquí solo esperamos a que termine.
export class Arranque extends Phaser.Scene {
  private texto!: Phaser.GameObjects.Text;
  private esperandoDesbloqueo = false;

  constructor() {
    super('Arranque');
  }

  preload() {
    // Ruta relativa (sin "/" inicial) para que funcione con cualquier base de Vite.
    this.load.audio('prueba', 'audio/prueba.m4a');
  }

  create() {
    const { width, height } = this.scale;

    this.texto = this.add
      .text(width / 2, height / 2, 'Toca para empezar', {
        fontSize: '48px',
        color: '#ff9a3c',
      })
      .setOrigin(0.5);

    this.input.on('pointerup', () => this.sonarPrueba());
  }

  private sonarPrueba() {
    // El toque llega a la escena antes de que Phaser termine el desbloqueo.
    if (this.sound.locked) {
      if (!this.esperandoDesbloqueo) {
        this.esperandoDesbloqueo = true;
        this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.esperandoDesbloqueo = false;
          this.sonarPrueba();
        });
      }
      return;
    }

    // Phaser no carga el archivo si el navegador no soporta el formato (AAC).
    if (!this.cache.audio.exists('prueba')) {
      this.texto.setText('Este navegador no puede reproducir el sonido');
      return;
    }

    this.sound.play('prueba');
    this.texto.setText('¡Audio listo! 🎃');
  }
}
