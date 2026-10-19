import Phaser from 'phaser';
import { DULCES_POR_DIFICULTAD, PUERTAS } from '../datos';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Puerta placeholder: muestra la casa y sus dulces, y "Tocar" abre el minijuego.
// La Calle queda dormida debajo (la lanza con launch).
export class Puerta extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  private detalle!: Phaser.GameObjects.Text;
  private _casa = 0;
  /** Casa de esta puerta, de 0 a 7 (solo lectura, para los e2e). */
  get casa() {
    return this._casa;
  }
  readonly botones: { tocar?: Boton } = {};

  constructor() {
    super('Puerta');
  }

  init(data: { casa: number }) {
    super.init(data);
    this._casa = data.casa;
    this.botones.tocar = undefined;
  }

  create() {
    const dificultad = PUERTAS.puertas[this._casa].dificultad;
    const dulces = DULCES_POR_DIFICULTAD[dificultad];
    this.titulo = crearTitulo(this, `Casa ${this._casa + 1}`);
    this.detalle = crearTitulo(this, `${dulces} ${dulces === 1 ? 'dulce' : 'dulces'} (${dificultad})`, 40);
    this.botones.tocar = crearBoton(this, 'Tocar', 0x2f7d4f, () => {
      this.scene.start('MinijuegoPrueba', { casa: this._casa });
    });
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 180);
    this.detalle.setPosition(cx, 280);
    this.botones.tocar?.colocar(cx, 460);
  }
}
