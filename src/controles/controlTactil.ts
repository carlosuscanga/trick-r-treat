// Asigna cada dedo a un control (joystick, Saltar o Brazos) según dónde cayó, y
// ese control solo escucha a ese dedo hasta que se levanta. Llena las intenciones.
// Sin Phaser. Cero asignaciones en abajo/mover/arriba/revisar (se llaman por
// evento y por frame).

import type { Ajustes } from '../movimiento/ajustes';
import type { Circulo, Disposicion } from './disposicion';
import { direccionJoystick, fuerzaJoystick } from './joystick';
import type { Intenciones } from './intenciones';

const LIBRE = -1;

function dentro(c: Circulo, x: number, y: number): boolean {
  const dx = x - c.x;
  const dy = y - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

export class ControlTactil {
  /** `id` -1 = libre. `dx/dy` son relativos al origen donde cayó el dedo. */
  readonly joystick = { id: LIBRE, origenX: 0, origenY: 0, dx: 0, dy: 0 };
  private saltarId = LIBRE;
  private brazosId = LIBRE;
  /** El siguiente `mover` del joystick recoloca el origen (tras un cambio de escala). */
  private reanclar = false;

  constructor(
    private readonly intenciones: Intenciones,
    /** Objeto vivo (no una copia): los cambios del panel aplican sin recrear. */
    private readonly ajustes: Ajustes,
  ) {}

  /** Saltar tiene un dedo encima (para dibujarlo presionado). */
  get saltarAbajo(): boolean {
    return this.saltarId !== LIBRE;
  }

  /** Brazos tiene un dedo encima (para dibujarlo presionado). */
  get brazosAbajo(): boolean {
    return this.brazosId !== LIBRE;
  }

  abajo(id: number, x: number, y: number, d: Disposicion): void {
    if (id === this.joystick.id || id === this.saltarId || id === this.brazosId) return;

    if (this.saltarId === LIBRE && dentro(d.saltar, x, y)) {
      this.saltarId = id;
      this.intenciones.saltarPresionado = true;
      this.intenciones.saltarSostenido = true;
      return;
    }
    if (this.brazosId === LIBRE && dentro(d.brazos, x, y)) {
      this.brazosId = id;
      this.intenciones.brazosPresionado = true;
      return;
    }
    const z = d.zonaJoystick;
    if (
      this.joystick.id === LIBRE &&
      x >= z.x && x <= z.x + z.ancho &&
      y >= z.y && y <= z.y + z.alto
    ) {
      this.joystick.id = id;
      this.reanclar = false;
      this.joystick.origenX = x;
      this.joystick.origenY = y;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
    }
  }

  mover(id: number, x: number, y: number): void {
    if (id !== this.joystick.id) return;
    if (this.reanclar) {
      // Conserva el desplazamiento previo (y la dirección): el dedo no se movió,
      // cambió la escala con la que se mide.
      this.joystick.origenX = x - this.joystick.dx;
      this.joystick.origenY = y - this.joystick.dy;
      this.reanclar = false;
    }
    this.joystick.dx = x - this.joystick.origenX;
    this.joystick.dy = y - this.joystick.origenY;
    const j = this.ajustes.joystick;
    this.intenciones.direccion = direccionJoystick(
      this.joystick.dx,
      this.intenciones.direccion,
      j.radio,
      j.activa,
      j.suelta,
    );
    this.intenciones.fuerza = fuerzaJoystick(this.joystick.dx, j.radio, j.activa);
  }

  /**
   * Tras un cambio de tamaño, `x/y` del mismo dedo quieto se miden con otra escala
   * (barras de Safari en horizontal). El siguiente `mover` recoloca el origen.
   */
  reanclarJoystick(): void {
    if (this.joystick.id !== LIBRE) this.reanclar = true;
  }

  arriba(id: number): void {
    if (id === LIBRE) return;
    if (id === this.joystick.id) this.soltarJoystick();
    else if (id === this.saltarId) this.soltarSaltar();
    else if (id === this.brazosId) this.brazosId = LIBRE;
  }

  soltarTodo(): void {
    this.soltarJoystick();
    this.soltarSaltar();
    this.brazosId = LIBRE;
  }

  /** Antídoto anti-pegado: suelta el control cuyo dedo ya no está abajo. */
  revisar(estaAbajo: (id: number) => boolean): void {
    if (this.joystick.id !== LIBRE && !estaAbajo(this.joystick.id)) this.soltarJoystick();
    if (this.saltarId !== LIBRE && !estaAbajo(this.saltarId)) this.soltarSaltar();
    if (this.brazosId !== LIBRE && !estaAbajo(this.brazosId)) this.brazosId = LIBRE;
  }

  private soltarJoystick(): void {
    this.joystick.id = LIBRE;
    this.reanclar = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.intenciones.direccion = 0;
    this.intenciones.fuerza = 0;
  }

  private soltarSaltar(): void {
    this.saltarId = LIBRE;
    this.intenciones.saltarSostenido = false;
  }
}
