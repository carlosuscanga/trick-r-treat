// Asigna cada dedo a un control (joystick, Saltar o Brazos) según dónde cayó, y
// ese control solo escucha a ese dedo hasta que se levanta. Llena las intenciones.
// Sin Phaser. Cero asignaciones en abajo/mover/arriba/revisar (se llaman por
// evento y por frame).

import type { Ajustes } from '../movimiento/ajustes';
import type { Circulo, Disposicion } from './disposicion';
import { direccionJoystick } from './joystick';
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

  constructor(
    private readonly intenciones: Intenciones,
    /** Objeto vivo (no una copia): los cambios del panel aplican sin recrear. */
    private readonly ajustes: Ajustes,
  ) {}

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
      this.joystick.origenX = x;
      this.joystick.origenY = y;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
    }
  }

  mover(id: number, x: number, y: number): void {
    if (id !== this.joystick.id) return;
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
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.intenciones.direccion = 0;
  }

  private soltarSaltar(): void {
    this.saltarId = LIBRE;
    this.intenciones.saltarSostenido = false;
  }
}
