import { describe, expect, it, vi } from 'vitest';
import { bloquearGestos } from './gestos';

type Registro = { tipo: string; fn: (e: { preventDefault: () => void }) => void; opciones: AddEventListenerOptions };

// Un document falso que guarda cada listener que le registran.
function documentoFalso() {
  const registros: Registro[] = [];
  const doc = {
    addEventListener: (tipo: string, fn: Registro['fn'], opciones: AddEventListenerOptions) => {
      registros.push({ tipo, fn, opciones });
    },
  };
  return { doc: doc as unknown as Pick<Document, 'addEventListener'>, registros };
}

describe('bloquearGestos', () => {
  it('cancela gesturestart, gesturechange y gestureend con listeners no pasivos', () => {
    const { doc, registros } = documentoFalso();
    bloquearGestos(doc);

    expect(registros.map((r) => r.tipo)).toEqual(['gesturestart', 'gesturechange', 'gestureend']);
    expect(registros.every((r) => r.opciones.passive === false)).toBe(true);
  });

  it('cada listener llama a preventDefault del evento', () => {
    const { doc, registros } = documentoFalso();
    bloquearGestos(doc);

    for (const { fn } of registros) {
      const e = { preventDefault: vi.fn() };
      fn(e);
      expect(e.preventDefault).toHaveBeenCalledTimes(1);
    }
  });
});
