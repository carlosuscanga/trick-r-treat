import Phaser from 'phaser';
import { DULCES_POR_DIFICULTAD, PUERTAS } from '../datos';
import { gameState } from '../estado/GameState';
import { siguienteTrasResultado } from '../flujo/flujo';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Resultado placeholder: aplica el resultado de la casa a gameState y deja seguir.
export class Resultado extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  private aplicado = false;
  private _gano = false;
  private _dulcesGanados = 0;
  /** Lo que pasó en esta casa (solo lectura, para los e2e). */
  get gano() {
    return this._gano;
  }
  get dulcesGanados() {
    return this._dulcesGanados;
  }
  readonly botones: { seguir?: Boton } = {};

  constructor() {
    super('Resultado');
  }

  init(data: { casa: number; gano: boolean }) {
    super.init(data);
    this.aplicado = false;
    this._gano = data.gano;
    this._dulcesGanados = 0;
    this.botones.seguir = undefined;
    this.aplicar(data.casa, data.gano);
  }

  // Una sola vez por entrada: visitarCasa lanza si la casa ya se visitó.
  private aplicar(casa: number, gano: boolean) {
    if (this.aplicado) return;
    this.aplicado = true;
    gameState.visitarCasa(casa);
    if (gano) {
      const dulces = DULCES_POR_DIFICULTAD[PUERTAS.puertas[casa].dificultad];
      gameState.ganarCasa(dulces);
      this._dulcesGanados = dulces;
    } else {
      gameState.recibirSusto();
    }
  }

  create() {
    this.titulo = crearTitulo(this, this._gano ? `+${this._dulcesGanados} dulces` : '¡Susto!');
    this.botones.seguir = crearBoton(this, 'Seguir', 0xc2570c, () => {
      if (siguienteTrasResultado(gameState) === 'Calle') {
        // La Calle estaba dormida: despierta donde Mi vo se quedó.
        this.scene.stop();
        this.scene.wake('Calle');
      } else {
        this.scene.stop('Calle');
        this.scene.start('FinJuego');
      }
    });
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 240);
    this.botones.seguir?.colocar(cx, 460);
  }
}
