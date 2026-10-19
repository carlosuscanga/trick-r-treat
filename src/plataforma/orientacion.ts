import type { Pausa } from './pausa';

type Pausable = Pick<Pausa, 'activar' | 'quitar'>;
type ConsultaVertical = Pick<MediaQueryList, 'matches' | 'addEventListener'>;

// El aviso de "gira tu teléfono" es CSS (index.html). Esto solo activa el motivo
// 'vertical' de la pausa mientras está en vertical, para que ningún reloj avance
// detrás del aviso.
export function pausarEnVertical(
  pausa: Pausable,
  vertical: ConsultaVertical = window.matchMedia('(orientation: portrait)'),
) {
  const aplicar = () => {
    if (vertical.matches) {
      pausa.activar('vertical');
    } else {
      pausa.quitar('vertical');
    }
  };

  vertical.addEventListener('change', aplicar);
  aplicar();
}
