import Phaser from 'phaser';
import { gameState } from '../estado/GameState';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Menú placeholder: título y "Jugar", que empieza una partida nueva.
export class Menu extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  /** Botones para los e2e (solo lectura). */
  readonly botones: { jugar?: Boton } = {};

  constructor() {
    super('Menu');
  }

  init(data?: unknown) {
    super.init(data);
    this.botones.jugar = undefined;
  }

  create() {
    this.titulo = crearTitulo(this, '🎃 Trick-r-Treat');
    this.botones.jugar = crearBoton(this, 'Jugar', 0xc2570c, () => {
      gameState.nuevaPartida();
      this.scene.start('SelectorDisfraz');
    });
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  // Todo en la zona segura central: el centro del ancho variable.
  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 200);
    this.botones.jugar?.colocar(cx, 440);
  }
}
