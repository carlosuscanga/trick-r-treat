import Phaser from 'phaser';
import { motivoSinAudio } from '../plataforma/audio';

// Primera escena: pide el primer toque, que en iOS es lo que desbloquea el audio.
// Phaser desbloquea el audio solo con ese toque; aquí solo esperamos a que termine.
export class Arranque extends Phaser.Scene {
  private texto!: Phaser.GameObjects.Text;
  private esperandoDesbloqueo = false;
  private errorDeCarga: string | null = null;

  constructor() {
    super('Arranque');
  }

  preload() {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.errorDeCarga = `no cargó ${file.src} (HTTP ${file.xhrLoader?.status})`;
    });

    // Sin "/" inicial: Phaser le antepone loader.baseURL (ver main.ts).
    this.load.audio('prueba', 'audio/prueba.m4a');
  }

  create() {
    const { width, height } = this.scale;

    this.texto = this.add
      .text(width / 2, height / 2, 'Toca para empezar', {
        fontSize: '48px',
        color: '#ff9a3c',
        align: 'center',
        wordWrap: { width: 1200 },
      })
      .setOrigin(0.5);

    // El ancho del juego cambia con la pantalla: recentrar al cambiar.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.centrar, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.centrar, this);
    });

    this.input.on('pointerup', () => this.sonarPrueba());
  }

  private centrar(gameSize: Phaser.Structs.Size) {
    this.texto.setPosition(gameSize.width / 2, gameSize.height / 2);
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

    if (!this.cache.audio.exists('prueba')) {
      const { m4a, aac } = this.sys.game.device.audio;
      this.texto.setText(`Sin sonido: ${motivoSinAudio(m4a || aac, this.errorDeCarga)}`);
      return;
    }

    this.sound.play('prueba');
    this.texto.setText('¡Audio listo! 🎃');
  }
}

