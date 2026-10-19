import Phaser from 'phaser';
import { Arranque } from './escenas/Arranque';
import { CallePrueba } from './escenas/CallePrueba';
import { esModoDepurar } from './depurar/depurar';
import { montarDepurar } from './depurar/montar';
import { montarPanel } from './depurar/panelAjustes';
import { AJUSTES_POR_DEFECTO, type Ajustes } from './movimiento/ajustes';
import { ALTO, ajustarAnchoAlContenedor, anchoParaPantalla } from './plataforma/escala';
import { bloquearGestos } from './plataforma/gestos';
import { pausarSinContexto } from './plataforma/contexto';
import { pausarEnVertical } from './plataforma/orientacion';
import { crearPausa } from './plataforma/pausa';

const contenedor = document.getElementById('game')!;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: contenedor,
  backgroundColor: '#1a1a2e',
  // TEX-08: sin los pipelines preFX se ahorran ~61 MiB de GPU. Se renuncia a `.preFX`; quedan postFX y Light2D.
  disablePreFX: true,
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
  scene: [Arranque, CallePrueba],
});

// Ajustes vivos del movimiento: las escenas los leen de aquí y el panel ?depurar los cambia.
const ajustes: Ajustes = structuredClone(AJUSTES_POR_DEFECTO);
game.registry.set('ajustes', ajustes);

ajustarAnchoAlContenedor(game, contenedor);
// Una sola pausa con motivos (vertical, contexto): nadie más llama game.pause()/resume().
const pausa = crearPausa(game, game.sound);
pausarEnVertical(pausa);
if (game.renderer.type === Phaser.WEBGL) {
  pausarSinContexto(game.renderer, pausa, {
    perder: Phaser.Renderer.Events.LOSE_WEBGL,
    restaurar: Phaser.Renderer.Events.RESTORE_WEBGL,
  });
}
bloquearGestos(document);
if (esModoDepurar(location.search)) {
  montarDepurar(game);
  montarPanel(game, ajustes);
}
