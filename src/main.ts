import Phaser from 'phaser';
import { Arranque } from './escenas/Arranque';
import { ALTO, ajustarAnchoAlContenedor, anchoParaPantalla } from './plataforma/escala';
import { pausarEnVertical } from './plataforma/orientacion';

const contenedor = document.getElementById('game')!;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: contenedor,
  backgroundColor: '#1a1a2e',
  // Los assets se piden desde la base de Vite ('/' en dev, '/trick-r-treat/' en Pages),
  // no desde la URL de la página: así no se rompen si la página está en una subruta.
  loader: {
    baseURL: import.meta.env.BASE_URL,
  },
  scale: {
    // FIT escala sin deformar; el ancho base se ajusta a la pantalla (ver plataforma/escala).
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: anchoParaPantalla(contenedor),
    height: ALTO,
  },
  scene: [Arranque],
});

ajustarAnchoAlContenedor(game, contenedor);
pausarEnVertical(game);
