// Por qué falta un sonido, para diagnosticar en el teléfono sin consola.
// errorDeCarga viene del evento FILE_LOAD_ERROR del loader (null si el archivo cargó).
export function motivoSinAudio(soportaAac: boolean, errorDeCarga: string | null): string {
  if (!soportaAac) {
    return 'el navegador no soporta AAC';
  }
  return errorDeCarga ?? 'el archivo cargó pero no se pudo decodificar';
}
