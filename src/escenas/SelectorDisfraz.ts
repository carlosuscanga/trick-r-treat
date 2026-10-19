import Phaser from 'phaser';
import { DISFRACES } from '../datos';
import { gameState } from '../estado/GameState';
import { crearBoton, crearTitulo, type Boton } from './Boton';
import { EscenaBase } from './EscenaBase';

// Selector placeholder: un botón por disfraz.
export class SelectorDisfraz extends EscenaBase {
  private titulo!: Phaser.GameObjects.Text;
  /** Un botón por disfraz, en el orden de DISFRACES (solo lectura, para los e2e). */
  readonly botones: Boton[] = [];

  constructor() {
    super('SelectorDisfraz');
  }

  init(data?: unknown) {
    super.init(data);
    this.botones.length = 0;
  }

  create() {
    this.titulo = crearTitulo(this, 'Elige tu disfraz', 56);
    for (const disfraz of DISFRACES) {
      this.botones.push(
        crearBoton(
          this,
          disfraz.nombre,
          0x5b3a8c,
          () => {
            gameState.elegirDisfraz(disfraz);
            this.scene.start('Calle');
          },
          440,
        ),
      );
    }
    this.reacomodar();
    this.escuchar(this.scale, Phaser.Scale.Events.RESIZE, this.reacomodar);
  }

  // Dos columnas en la zona segura de 1280×720 para que quepan todos.
  private reacomodar() {
    const cx = this.scale.width / 2;
    this.titulo.setPosition(cx, 80);
    this.botones.forEach((boton, i) => {
      const columna = i % 2;
      const fila = Math.floor(i / 2);
      boton.colocar(cx + (columna === 0 ? -240 : 240), 200 + fila * 120);
    });
  }
}
