// Estadísticas y texto del overlay de depuración. Sin Phaser.

/** Contadores de fuga: deben volver a su base al reiniciar escenas. */
export type Instantanea = {
  listenersResize: number;
  listenersJuego: number;
  listenersRegistro: number;
  listenersSonido: number;
  listenersTexturas: number;
  listenersShutdown: number;
  texturas: number;
  sonidos: number;
  audioCache: number;
  animaciones: number;
  canvas: number;
  escenasActivas: number;
  objetos: number;
  tweens: number;
};

/** Se miden, no se comparan. */
export interface Metricas {
  fps: number;
  p95: number;
  max: number;
  tirones: number;
  gpuMiB: number | null;
  renderer: 'webgl' | 'canvas';
  recargas: number;
}

/** Un tirón es un frame que tarda más que esto (ms). */
export const UMBRAL_TIRON_MS = 34;

/** Percentil por rango más cercano sobre los primeros `cuantos` valores. No muta la entrada. */
export function percentil(valores: ArrayLike<number>, p: number, cuantos = valores.length): number {
  const n = Math.min(cuantos, valores.length);
  if (n <= 0) return 0;
  const orden = Array.from({ length: n }, (_, i) => valores[i]).sort((a, b) => a - b);
  const rango = Math.min(n, Math.max(1, Math.ceil((p / 100) * n)));
  return orden[rango - 1];
}

export interface ResumenFrames {
  p95: number;
  max: number;
  tirones: number;
}

/** Resume los primeros `cuantas` muestras (ms por frame); el orden no importa. */
export function resumirFrames(muestras: ArrayLike<number>, cuantas: number): ResumenFrames {
  const n = Math.min(cuantas, muestras.length);
  if (n <= 0) return { p95: 0, max: 0, tirones: 0 };
  let max = 0;
  let tirones = 0;
  for (let i = 0; i < n; i++) {
    if (muestras[i] > max) max = muestras[i];
    if (muestras[i] > UMBRAL_TIRON_MS) tirones++;
  }
  return { p95: percentil(muestras, 95, n), max, tirones };
}

const esPotenciaDeDos = (x: number) => x > 0 && (x & (x - 1)) === 0;

/** Memoria estimada de texturas en MiB: RGBA (4 bytes/px); ×4/3 por mipmaps si es potencia de dos. */
export function memoriaTexturasMiB(texturas: ReadonlyArray<{ ancho: number; alto: number }>): number {
  let bytes = 0;
  for (const t of texturas) {
    const base = t.ancho * t.alto * 4;
    bytes += esPotenciaDeDos(t.ancho) && esPotenciaDeDos(t.alto) ? (base * 4) / 3 : base;
  }
  return bytes / (1024 * 1024);
}

/** Texto compacto para el `<pre>` del overlay. */
export function textoOverlay(i: Instantanea, m: Metricas): string {
  const gpu = m.gpuMiB === null ? 'GPU: n/d' : `GPU: ${m.gpuMiB.toFixed(1)} MiB`;
  return [
    `fps ${m.fps.toFixed(0)}  p95 ${m.p95.toFixed(1)} ms  max ${m.max.toFixed(1)} ms`,
    `tirones ${m.tirones}  ${gpu}`,
    `${m.renderer}  recargas ${m.recargas}`,
    `resize ${i.listenersResize}  juego ${i.listenersJuego}  registro ${i.listenersRegistro}`,
    `sonido ${i.listenersSonido}  tex-ev ${i.listenersTexturas}  shutdown ${i.listenersShutdown}`,
    `texturas ${i.texturas}  sonidos ${i.sonidos}  audio ${i.audioCache}`,
    `anims ${i.animaciones}  canvas ${i.canvas}  escenas ${i.escenasActivas}`,
    `objetos ${i.objetos}  tweens ${i.tweens}`,
  ].join('\n');
}
