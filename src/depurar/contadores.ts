import Phaser from 'phaser';
import { memoriaTexturasMiB, resumirFrames, type Instantanea, type Metricas } from './metricas';

// Lee los contadores de Phaser 3.90 para ?depurar. Lo puro vive en metricas.ts.

const MUESTRAS = 600; // ≈10 s a 60 Hz

type EmisorConConteo = Pick<Phaser.Events.EventEmitter, 'eventNames' | 'listenerCount'>;

// Suma de listeners de todos los eventos de un emisor.
function listeners(em: EmisorConConteo): number {
  let total = 0;
  for (const nombre of em.eventNames()) total += em.listenerCount(nombre);
  return total;
}

// El renderer solo es emisor en algunas versiones/modos: si no tiene eventNames, cuenta 0.
function listenersRenderer(game: Phaser.Game): number {
  const renderer = game.renderer as unknown as Partial<EmisorConConteo>;
  return typeof renderer.eventNames === 'function' ? listeners(renderer as EmisorConConteo) : 0;
}

/** Contadores de fuga: enteros que deben volver a su base al ciclar escenas. */
export function instantanea(game: Phaser.Game): Instantanea {
  // Systems.shutdown no quita los listeners de usuario de sys.events (es también data.events): se cuentan todos.
  let listenersShutdown = 0;
  let listenersEscenas = 0;
  for (const escena of game.scene.scenes) {
    listenersShutdown += escena.sys.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN);
    listenersEscenas += listeners(escena.sys.events);
  }
  const activas = game.scene.getScenes(true);
  let objetos = 0;
  let tweens = 0;
  for (const escena of activas) {
    objetos += escena.children.length;
    tweens += escena.tweens.getTweens().length;
  }
  return {
    listenersEscala: listeners(game.scale),
    listenersJuego: listeners(game.events),
    listenersRegistro: listeners(game.registry.events),
    listenersSonido: listeners(game.sound),
    listenersTexturas: listeners(game.textures),
    listenersRenderer: listenersRenderer(game),
    listenersEscenas,
    listenersShutdown,
    texturas: game.textures.getTextureKeys().length,
    // El tipo de NoAudio pide `key`, pero en ejecución es opcional (BaseSoundManager.getAll).
    sonidos: (game.sound as Phaser.Sound.BaseSoundManager).getAll().length,
    audioCache: game.cache.audio.getKeys().length,
    // `anims` es protected en los tipos, pero es el mapa real de animaciones globales.
    animaciones: game.anims['anims'].size,
    canvas: Phaser.Display.Canvas.CanvasPool.total(),
    escenasActivas: activas.length,
    objetos,
    tweens,
  };
}

/** Búfer circular preasignado de ms por frame: cero asignaciones por frame (POO-03). */
export class MuestreadorFrames {
  readonly muestras = new Float32Array(MUESTRAS);
  private indice = 0;
  private llenas = 0;

  constructor(private readonly game: Phaser.Game) {
    // Un solo listener fijo, creado una vez; se registra antes de tomar la base de fugas.
    game.events.on(Phaser.Core.Events.POST_STEP, this.muestrear, this);
  }

  /** Muestras válidas (hasta 600). */
  get cuantas(): number {
    return this.llenas;
  }

  private muestrear(): void {
    this.muestras[this.indice] = this.game.loop.rawDelta;
    this.indice = this.indice + 1 === MUESTRAS ? 0 : this.indice + 1;
    if (this.llenas < MUESTRAS) this.llenas++;
  }
}

// MiB estimados de las texturas WebGL vivas; null con Canvas.
function gpuMiB(game: Phaser.Game): number | null {
  const renderer = game.renderer;
  if (renderer.type !== Phaser.WEBGL) return null;
  const envolturas = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).glTextureWrappers;
  return memoriaTexturasMiB(envolturas.map((t) => ({ ancho: t.width, alto: t.height })));
}

/** Lo que se mide (no se compara): fps, p95, tirones, GPU, renderer y recargas. */
export function metricas(game: Phaser.Game, muestreador: MuestreadorFrames, recargas: () => number): Metricas {
  const { p95, max, tirones } = resumirFrames(muestreador.muestras, muestreador.cuantas);
  return {
    fps: game.loop.actualFps,
    p95,
    max,
    tirones,
    gpuMiB: gpuMiB(game),
    renderer: game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas',
    recargas: recargas(),
  };
}
