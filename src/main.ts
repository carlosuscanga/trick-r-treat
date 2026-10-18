import Phaser from 'phaser';
import { Arranque } from './escenas/Arranque';
import { esModoDepurar, exponerJuego } from './depurar/depurar';
import { ALTO, ajustarAnchoAlContenedor, anchoParaPantalla } from './plataforma/escala';
import { bloquearGestos } from './plataforma/gestos';
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
  // Hasta 3 dedos a la vez (joystick + Saltar + Brazos); Phaser trae 1 por defecto.
  input: { activePointers: 3 },
  // Sin tope de delta: al volver del segundo plano no hay cámara lenta (FRA-03).
  fps: { panicMax: 0 },
  scene: [Arranque],
});

ajustarAnchoAlContenedor(game, contenedor);
pausarEnVertical(game);
bloquearGestos(document);
if (esModoDepurar(location.search)) exponerJuego(game);
