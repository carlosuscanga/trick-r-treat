import Phaser from 'phaser';

// Base de todas las escenas: limpia sola lo que Phaser no limpia (ESC-01 a ESC-03).
export abstract class EscenaBase extends Phaser.Scene {
  private limpiezas: Array<() => void> = [];

  init(_data?: unknown) {
    // Las subclases que redefinen init llaman super.init(data).
    this.limpiezas = [];
    this.data.reset(); // this.data no se vacía solo (ESC-03)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.limpiezas.splice(0).forEach((f) => f()));
  }

  /** Listener a un emisor que vive más que la escena (scale, game.events, sound...): se quita al apagarla. */
  protected escuchar(em: Phaser.Events.EventEmitter, ev: string | symbol, fn: (...a: any[]) => void) {
    em.on(ev, fn, this);
    this.limpiezas.push(() => em.off(ev, fn, this));
  }

  /** Limpieza propia (window, document, ResizeObserver...): corre al apagar la escena. */
  protected alLimpiar(fn: () => void) {
    this.limpiezas.push(fn);
  }
}
