import Phaser from 'phaser';
import type { ControlTactil } from '../controles/controlTactil';
import { calcularDisposicion, crearDisposicion, type Disposicion } from '../controles/disposicion';
import { limitarPerilla } from '../controles/joystick';
import type { Ajustes } from '../movimiento/ajustes';
import type { EscenaBase } from './EscenaBase';

// Dibuja el joystick y los botones y conecta el input de Phaser con `ControlTactil`.
// Los manejadores de toque solo guardan el estado; la escena lo aplica en update().
// El id de cada dedo es `pointer.id` (el lugar del puntero en `input.manager.pointers`:
// 0 es el ratón, 1..3 los dedos), así `revisar` lo encuentra sin buscar.

const PROFUNDIDAD = 1000;
const BLANCO = 0xffffff;
const ALFA_BASE_REPOSO = 0.12;
const ALFA_BASE_ACTIVA = 0.25;
const ALFA_PERILLA = 0.55;
const ALFA_BOTON = 0.25;
const ALFA_BOTON_ABAJO = 0.6;
/** La perilla mide esta fracción del radio del joystick. */
const PERILLA = 0.45;
/** Distancia de la base en reposo al borde izquierdo, sumada al margen y al radio. */
const REPOSO_X = 80;
const LIBRE = -1;

export class ControlesTactiles {
  /** Dónde va cada control; se recalcula en `reacomodar`. */
  readonly disposicion: Disposicion = crearDisposicion();

  private readonly base: Phaser.GameObjects.Arc;
  private readonly perilla: Phaser.GameObjects.Arc;
  private readonly saltar: Phaser.GameObjects.Arc;
  private readonly brazos: Phaser.GameObjects.Arc;
  private readonly letraSaltar: Phaser.GameObjects.Text;
  private readonly letraBrazos: Phaser.GameObjects.Text;
  private readonly punteros: Phaser.Input.Pointer[];
  private readonly escala: Phaser.Scale.ScaleManager;
  /** Desplazamiento de la perilla ya recortado al radio (reutilizado). */
  private readonly tope = { x: 0, y: 0 };
  private reposoX = 0;
  private reposoY = 0;
  private joystickDibujado = false;
  private saltarDibujado = false;
  private brazosDibujado = false;

  /** Se crea una vez: `revisar` corre cada frame y no debe crear closures. */
  private readonly estaAbajo = (id: number): boolean => this.punteros[id]?.isDown === true;

  constructor(
    escena: EscenaBase,
    private readonly control: ControlTactil,
    private readonly ajustes: Ajustes,
  ) {
    this.punteros = escena.input.manager.pointers;
    this.escala = escena.scale;

    const add = escena.add;
    const letra = { fontSize: '44px', color: '#ffffff', fontStyle: 'bold' };
    this.base = add.circle(0, 0, 1, BLANCO, ALFA_BASE_REPOSO);
    this.perilla = add.circle(0, 0, 1, BLANCO, ALFA_PERILLA).setVisible(false);
    this.saltar = add.circle(0, 0, 1, BLANCO, ALFA_BOTON);
    this.brazos = add.circle(0, 0, 1, BLANCO, ALFA_BOTON);
    this.letraSaltar = add.text(0, 0, 'S', letra).setOrigin(0.5);
    this.letraBrazos = add.text(0, 0, 'B', letra).setOrigin(0.5);
    for (const g of [this.base, this.perilla, this.saltar, this.brazos, this.letraSaltar, this.letraBrazos]) {
      g.setScrollFactor(0).setDepth(PROFUNDIDAD);
    }

    // El input de la escena muere con ella (InputPlugin quita sus listeners en SHUTDOWN).
    const input = escena.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.alBajar, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.alMover, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.alSubir, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.alSubir, this);
    input.on(Phaser.Input.Events.GAME_OUT, this.soltarTodo, this);

    this.reacomodar(escena.scale.width, escena.scale.height);
  }

  /** Recalcula la disposición y mueve los dibujos. No suelta los dedos que estén abajo. */
  reacomodar(ancho: number, alto: number): void {
    const d = this.disposicion;
    calcularDisposicion(ancho, alto, this.ajustes, d);

    const radio = this.ajustes.joystick.radio;
    this.base.setRadius(radio);
    this.perilla.setRadius(radio * PERILLA);
    this.reposoX = d.zonaJoystick.x + radio + REPOSO_X;
    this.reposoY = d.saltar.y;
    if (!this.joystickDibujado) this.base.setPosition(this.reposoX, this.reposoY);

    const r = this.ajustes.botones.radioDibujo;
    this.saltar.setRadius(r).setPosition(d.saltar.x, d.saltar.y);
    this.brazos.setRadius(r).setPosition(d.brazos.x, d.brazos.y);
    this.letraSaltar.setPosition(d.saltar.x, d.saltar.y);
    this.letraBrazos.setPosition(d.brazos.x, d.brazos.y);
  }

  /**
   * En cada RESIZE: con el modo FIT la escala cambia (barras de Safari) y el mismo
   * dedo quieto se mide en otro x/y lógico. Reancla el joystick y, si se sabe dónde
   * está el dedo, lo mide ya con la escala nueva para que la base y la perilla queden
   * bajo el pulgar sin esperar al siguiente touchmove.
   */
  reanclar(): void {
    const j = this.control.joystick;
    if (j.id === LIBRE) return;
    this.control.reanclarJoystick();
    const p = this.punteros[j.id];
    const toques = (p?.event as TouchEvent | undefined)?.changedTouches;
    if (!toques) return;
    for (let k = 0; k < toques.length; k++) {
      const t = toques[k];
      if (t.identifier === p.identifier) {
        // canvasBounds y displayScale ya se actualizaron antes de emitir RESIZE.
        this.control.mover(j.id, this.escala.transformX(t.pageX), this.escala.transformY(t.pageY));
        return;
      }
    }
  }

  /** Cada frame: antídoto anti-pegado y dibujo del estado. Sin asignaciones. */
  revisar(): void {
    this.control.revisar(this.estaAbajo);

    const j = this.control.joystick;
    if (j.id !== LIBRE) {
      limitarPerilla(j.dx, j.dy, this.ajustes.joystick.radio, this.tope);
      this.base.setPosition(j.origenX, j.origenY);
      this.perilla.setPosition(j.origenX + this.tope.x, j.origenY + this.tope.y);
      if (!this.joystickDibujado) {
        this.joystickDibujado = true;
        this.base.setFillStyle(BLANCO, ALFA_BASE_ACTIVA);
        this.perilla.setVisible(true);
      }
    } else if (this.joystickDibujado) {
      this.joystickDibujado = false;
      this.base.setPosition(this.reposoX, this.reposoY).setFillStyle(BLANCO, ALFA_BASE_REPOSO);
      this.perilla.setVisible(false);
    }

    if (this.control.saltarAbajo !== this.saltarDibujado) {
      this.saltarDibujado = this.control.saltarAbajo;
      this.saltar.setFillStyle(BLANCO, this.saltarDibujado ? ALFA_BOTON_ABAJO : ALFA_BOTON);
    }
    if (this.control.brazosAbajo !== this.brazosDibujado) {
      this.brazosDibujado = this.control.brazosAbajo;
      this.brazos.setFillStyle(BLANCO, this.brazosDibujado ? ALFA_BOTON_ABAJO : ALFA_BOTON);
    }
  }

  // pointer.x/y están en coordenadas del juego (de pantalla), no del mundo: los
  // controles no se mueven con la cámara.
  private alBajar(p: Phaser.Input.Pointer): void {
    this.control.abajo(p.id, p.x, p.y, this.disposicion);
  }

  private alMover(p: Phaser.Input.Pointer): void {
    this.control.mover(p.id, p.x, p.y);
  }

  private alSubir(p: Phaser.Input.Pointer): void {
    this.control.arriba(p.id);
  }

  private soltarTodo(): void {
    this.control.soltarTodo();
  }
}
