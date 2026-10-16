import { describe, expect, it } from 'vitest';
import { motivoSinAudio } from './audio';

describe('motivoSinAudio', () => {
  it('sin soporte de AAC lo dice primero, aunque también haya error de carga', () => {
    expect(motivoSinAudio(false, 'no cargó audio/prueba.m4a (HTTP 404)')).toBe(
      'el navegador no soporta AAC',
    );
  });

  it('si el archivo no cargó, muestra el error de carga', () => {
    expect(motivoSinAudio(true, 'no cargó audio/prueba.m4a (HTTP 404)')).toBe(
      'no cargó audio/prueba.m4a (HTTP 404)',
    );
  });

  it('si cargó pero no hay audio, fue la decodificación', () => {
    expect(motivoSinAudio(true, null)).toBe('el archivo cargó pero no se pudo decodificar');
  });
});
