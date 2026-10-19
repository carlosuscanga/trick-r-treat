import Phaser from 'phaser';
import { motivoSinAudio } from '../plataforma/audio';
import { EscenaBase } from './EscenaBase';

// Primera escena: pide el primer toque, que en iOS es lo que desbloquea el audio.
// Phaser desbloquea el audio solo con ese toque; aquí solo esperamos a que termine.
export class Arranque extends EscenaBase {
  private texto!: Phaser.GameObjects.Text;
  private esperandoDesbloqueo = false;
  private errorDeCarga: string | null = null;
  private yendoAlMenu = false;

  constructor() {
    super('Arranque');
  }

  init(data?: unknown) {
    super.init(data);
    this.esperandoDesbloqueo = false;
    this.errorDeCarga = null;
    this.yendoAlMenu = false;
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
    // Un segundo toque mientras espera el menú no repite el sonido ni el cambio.
    if (this.yendoAlMenu) return;

    // El toque llega a la escena antes de que Phaser termine el desbloqueo.
    if (this.sound.locked) {
      if (!this.esperandoDesbloqueo) {
        this.esperandoDesbloqueo = true;
        const alDesbloquear = () => {
          this.esperandoDesbloqueo = false;
          this.sonarPrueba();
        };
        // Por escuchar(): si la escena se apaga antes del desbloqueo, el listener se quita (ESC-06).
        const alDesbloquearUnaVez = () => {
          this.sound.off(Phaser.Sound.Events.UNLOCKED, alDesbloquearUnaVez, this);
          alDesbloquear();
        };
        this.escuchar(this.sound, Phaser.Sound.Events.UNLOCKED, alDesbloquearUnaVez);
      }
      return;
    }

    if (!this.cache.audio.exists('prueba')) {
      const { m4a, aac } = this.sys.game.device.audio;
      this.texto.setText(`Sin sonido: ${motivoSinAudio(m4a || aac, this.errorDeCarga)}`);
      this.irAlMenu();
      return;
    }

    this.sound.play('prueba');
    this.texto.setText('¡Audio listo! 🎃');
    this.irAlMenu();
  }

  // Deja leer el mensaje un momento y pasa al menú.
  private irAlMenu() {
    this.yendoAlMenu = true;
    this.time.delayedCall(800, () => this.scene.start('Menu'));
  }
}

