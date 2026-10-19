import Phaser from 'phaser';

/** Botón placeholder: una caja de color con texto. Grande, para tocarlo con el pulgar. */
export interface Boton {
  readonly caja: Phaser.GameObjects.Rectangle;
  readonly texto: Phaser.GameObjects.Text;
  /** Ya acepta toques: pasaron `ESPERA_INICIAL_MS` desde que se creó (reloj de la escena). */
  readonly listo: boolean;
  /** Centro del botón en pantalla (px del juego). */
  colocar(x: number, y: number): void;
}

const ANCHO = 360;
const ALTO = 96;
/** Un botón ignora los toques justo después de crearse: un doble toque no atraviesa pantallas. */
export const ESPERA_INICIAL_MS = 250;

/**
 * Crea un botón. Se activa solo si el mismo dedo bajó y subió sobre la caja, y no durante los primeros
 * `ESPERA_INICIAL_MS`. `alTocar` corre una sola vez: un doble toque no lanza dos cambios de escena.
 */
export function crearBoton(
  escena: Phaser.Scene,
  texto: string,
  color: number,
  alTocar: () => void,
  ancho = ANCHO,
): Boton {
  const caja = escena.add.rectangle(0, 0, ancho, ALTO, color).setStrokeStyle(4, 0xffffff).setInteractive();
  const etiqueta = escena.add.text(0, 0, texto, { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);
  const creadoEn = escena.time.now;
  const estaListo = () => escena.time.now - creadoEn >= ESPERA_INICIAL_MS;
  let tocado = false;
  let dedoAbajo = -1;
  caja.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
    dedoAbajo = estaListo() ? p.id : -1;
  });
  caja.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
    const mismoDedo = dedoAbajo === p.id;
    dedoAbajo = -1;
    // Cancelado por el sistema (llamada, gesto): no cuenta como toque.
    if (p.wasCanceled || !mismoDedo || tocado || !estaListo()) return;
    tocado = true;
    alTocar();
  });
  return {
    caja,
    texto: etiqueta,
    get listo() {
      return estaListo();
    },
    colocar(x, y) {
      caja.setPosition(x, y);
      etiqueta.setPosition(x, y);
    },
  };
}

/** Texto centrado de las escenas placeholder. */
export function crearTitulo(escena: Phaser.Scene, texto: string, tamano = 64) {
  return escena.add
    .text(0, 0, texto, { fontSize: `${tamano}px`, color: '#ff9a3c', align: 'center', wordWrap: { width: 1200 } })
    .setOrigin(0.5);
}
