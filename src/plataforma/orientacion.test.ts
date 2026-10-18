import { describe, expect, it, vi } from 'vitest';
import { pausarEnVertical } from './orientacion';

// Un matchMedia falso: `girar` cambia la orientación y avisa como lo haría el navegador.
function consultaFalsa(enVertical: boolean) {
  let alCambiar = () => {};
  const consulta = {
    matches: enVertical,
    addEventListener: (_tipo: string, cb: () => void) => {
      alCambiar = cb;
    },
  };
  const girar = (aVertical: boolean) => {
    consulta.matches = aVertical;
    alCambiar();
  };
  return { consulta: consulta as unknown as MediaQueryList, girar };
}

function pausaFalsa() {
  return { activar: vi.fn(), quitar: vi.fn() };
}

describe('pausarEnVertical', () => {
  it('si arranca en vertical, activa el motivo vertical', () => {
    const pausa = pausaFalsa();
    pausarEnVertical(pausa, consultaFalsa(true).consulta);
    expect(pausa.activar).toHaveBeenCalledTimes(1);
    expect(pausa.activar).toHaveBeenCalledWith('vertical');
    expect(pausa.quitar).not.toHaveBeenCalled();
  });

  it('si arranca en horizontal, no pausa (solo quita un motivo que no estaba)', () => {
    const pausa = pausaFalsa();
    pausarEnVertical(pausa, consultaFalsa(false).consulta);
    expect(pausa.activar).not.toHaveBeenCalled();
    expect(pausa.quitar).toHaveBeenCalledWith('vertical');
  });

  it('al girar a horizontal quita el motivo y al volver a vertical lo activa', () => {
    const pausa = pausaFalsa();
    const { consulta, girar } = consultaFalsa(true);
    pausarEnVertical(pausa, consulta);

    girar(false);
    expect(pausa.quitar).toHaveBeenCalledTimes(1);

    girar(true);
    expect(pausa.activar).toHaveBeenCalledTimes(2);
  });
});
