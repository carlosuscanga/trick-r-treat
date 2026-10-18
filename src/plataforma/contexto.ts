import type { Pausa } from './pausa';

// Si iOS le quita el contexto WebGL a la página, Phaser restaura las texturas ya
// cargadas, pero la lógica seguiría corriendo con la pantalla negra (ROB-01).
// Por eso se pausa mientras no hay contexto. Se escuchan los eventos del renderer
// (perder y restaurar); no usar CONTEXT_LOST (nunca se emite) ni setContextHandlers.
// Redibujar RenderTexture/DynamicTexture queda para quien las cree.
type Renderer = { on(evento: string, fn: () => void): unknown };

export function pausarSinContexto(
  renderer: Renderer,
  pausa: Pick<Pausa, 'activar' | 'quitar'>,
  eventos: { perder: string; restaurar: string },
) {
  renderer.on(eventos.perder, () => pausa.activar('contexto'));
  renderer.on(eventos.restaurar, () => pausa.quitar('contexto'));
}
