import Phaser from 'phaser';
import { gameState } from '../estado/GameState';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Fin de la partida placeholder: ganó o perdió, y dos salidas.
export class FinJuego extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  private _gano = false;
  /** Si Mi vo ganó (solo lectura, para los e2e). */
  get gano() {
    return this._gano;
  }
  readonly botones: { otraVez?: Boton; menu?: Boton } = {};

  constructor() {
    super('FinJuego');
  }

  init(data?: unknown) {
    super.init(data);
    this._gano = gameState.haGanado();
    this.botones.otraVez = undefined;
    this.botones.menu = undefined;
  }

  create() {
    this.titulo = crearTitulo(this, this._gano ? '¡Ganaste!' : 'Perdiste');
    this.botones.otraVez = crearBoton(
      this,
      'Jugar otra vez',
      0x2f7d4f,
      () => {
        // nuevaPartida borra el disfraz: se guarda y se vuelve a elegir.
        const disfraz = gameState.disfraz;
        gameState.nuevaPartida();
        if (disfraz) gameState.elegirDisfraz(disfraz);
        this.scene.start('Calle');
      },
      440,
    );
    this.botones.menu = crearBoton(this, 'Ir al menú', 0x5b3a8c, () => this.scene.start('Menu'), 440);
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 200);
    this.botones.otraVez?.colocar(cx - 250, 460);
    this.botones.menu?.colocar(cx + 250, 460);
  }
}
