import Phaser from 'phaser';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Minijuego placeholder: Ganar o Perder. El catálogo y el evento `finished` llegan con T-009.
export class MinijuegoPrueba extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  private casa = 0;
  readonly botones: { ganar?: Boton; perder?: Boton } = {};

  constructor() {
    super('MinijuegoPrueba');
  }

  init(data: { casa: number }) {
    super.init(data);
    this.casa = data.casa;
    this.botones.ganar = undefined;
    this.botones.perder = undefined;
  }

  create() {
    this.titulo = crearTitulo(this, 'Minijuego de prueba', 56);
    // Un solo toque entre los dos: el que llegue primero decide.
    let decidido = false;
    const terminar = (gano: boolean) => {
      if (decidido) return;
      decidido = true;
      this.scene.start('Resultado', { casa: this.casa, gano });
    };
    this.botones.ganar = crearBoton(this, 'Ganar', 0x2f7d4f, () => terminar(true));
    this.botones.perder = crearBoton(this, 'Perder', 0x9c2f2f, () => terminar(false));
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 160);
    this.botones.ganar?.colocar(cx - 220, 420);
    this.botones.perder?.colocar(cx + 220, 420);
  }
}
