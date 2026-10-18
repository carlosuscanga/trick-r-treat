import Phaser from 'phaser';

// mínima; T-037 la completa (alLimpiar, this.data.reset, ?depurar)
export abstract class EscenaBase extends Phaser.Scene {
  private limpiezas: Array<() => void> = [];

  init(_data?: unknown) {
    // Las subclases que redefinen init llaman super.init(data).
    this.limpiezas = [];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.limpiezas.splice(0).forEach((f) => f()));
  }

  protected escuchar(em: Phaser.Events.EventEmitter, ev: string | symbol, fn: (...a: any[]) => void) {
    em.on(ev, fn, this);
    this.limpiezas.push(() => em.off(ev, fn, this));
  }
}
