import Phaser from 'phaser';
import { motivoSinAudio } from '../plataforma/audio';
import { EscenaBase } from './EscenaBase';

// Primera escena: pide el primer toque, que en iOS es lo que desbloquea el audio.
// Phaser desbloquea el audio solo con ese toque; aquí solo esperamos a que termine.
export class Arranque extends EscenaBase {
  private texto!: Phaser.GameObjects.Text;
  private esperandoDesbloqueo = false;
  private errorDeCarga: string | null = null;
  private yendoALaCalle = false;

  constructor() {
    super('Arranque');
  }

  init(data?: unknown) {
    super.init(data);
    this.esperandoDesbloqueo = false;
    this.errorDeCarga = null;
    this.yendoALaCalle = false;
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
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.centrar);

    this.input.on('pointerup', () => this.sonarPrueba());
  }

  private centrar(gameSize: Phaser.Structs.Size) {
    this.texto.setPosition(gameSize.width / 2, gameSize.height / 2);
  }

  private sonarPrueba() {
    // Un segundo toque mientras espera la calle no repite el sonido ni el cambio.
    if (this.yendoALaCalle) return;

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
      this.irALaCalle();
      return;
    }

    this.sound.play('prueba');
    this.texto.setText('¡Audio listo! 🎃');
    this.irALaCalle();
  }

  // Deja leer el mensaje un momento y pasa a la calle de prueba (T-007 pondrá el Menú en medio).
  private irALaCalle() {
    this.yendoALaCalle = true;
    this.time.delayedCall(800, () => this.scene.start('CallePrueba'));
  }
}

