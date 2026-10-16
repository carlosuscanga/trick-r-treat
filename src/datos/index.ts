// Carga y valida los datos del juego. Los JSON se importan estáticos: Vite los
// mete en el build y existen antes de que arranque cualquier escena.

import disfracesJson from './disfraces.json' with { type: 'json' };
import vecinosJson from './vecinos.json' with { type: 'json' };
import type { Dificultad, Disfraz, TipoReto, TipoSusto, Vecino } from './tipos';

export type { Dificultad, Disfraz, TipoReto, TipoSusto, Vecino } from './tipos';

/** Dulces que da una casa según su dificultad. */
export const DULCES_POR_DIFICULTAD = {
  facil: 1,
  media: 2,
  dificil: 3,
} as const satisfies Record<Dificultad, 1 | 2 | 3>;

/** Una casa por vecino. */
const VECINOS_POR_CALLE = 8;

// Records con todas las claves del tipo: si se agrega un tipo y no se agrega aquí, tsc falla.
const TIPOS_RETO: Record<TipoReto, true> = {
  reflejos: true,
  memoria: true,
  puzzle: true,
  plataformas: true,
  ritmo: true,
  punteria: true,
};
const TIPOS_SUSTO: Record<TipoSusto, true> = {
  salta: true,
  tiembla: true,
  'se-agranda': true,
};

type Entrada = Record<string, unknown>;

function lista(datos: unknown, archivo: string): Entrada[] {
  if (!Array.isArray(datos)) throw new Error(`${archivo}: debe ser una lista`);
  datos.forEach((entrada, i) => {
    if (typeof entrada !== 'object' || entrada === null || Array.isArray(entrada)) {
      throw new Error(`${archivo}, entrada ${i}: debe ser un objeto`);
    }
  });
  return datos as Entrada[];
}

function texto(entrada: Entrada, campo: string, donde: string): string {
  const valor = entrada[campo];
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new Error(`${donde}: "${campo}" debe ser un texto no vacío`);
  }
  return valor;
}

function unoDe<T extends string>(permitidos: Record<T, true>, valor: string, campo: string, donde: string): T {
  if (!Object.prototype.hasOwnProperty.call(permitidos, valor)) {
    throw new Error(`${donde}: "${campo}" desconocido: "${valor}"`);
  }
  return valor as T;
}

function idsUnicos(entradas: { id: string }[], archivo: string): void {
  const vistos = new Set<string>();
  for (const { id } of entradas) {
    if (vistos.has(id)) throw new Error(`${archivo}: id repetido "${id}"`);
    vistos.add(id);
  }
}

export function validarDisfraces(datos: unknown): Disfraz[] {
  const archivo = 'disfraces.json';
  const disfraces = lista(datos, archivo).map((entrada, i) => {
    const donde = `${archivo}, entrada ${i}`;
    return {
      id: texto(entrada, 'id', donde),
      nombre: texto(entrada, 'nombre', donde),
      tipo: unoDe(TIPOS_RETO, texto(entrada, 'tipo', donde), 'tipo', donde),
      ventaja: texto(entrada, 'ventaja', donde),
    };
  });
  idsUnicos(disfraces, archivo);
  return disfraces;
}

export function validarVecinos(datos: unknown): Vecino[] {
  const archivo = 'vecinos.json';
  const vecinos = lista(datos, archivo).map((entrada, i) => {
    const donde = `${archivo}, entrada ${i}`;
    return {
      id: texto(entrada, 'id', donde),
      nombre: texto(entrada, 'nombre', donde),
      disfraz: texto(entrada, 'disfraz', donde),
      susto: unoDe(TIPOS_SUSTO, texto(entrada, 'susto', donde), 'susto', donde),
    };
  });
  if (vecinos.length !== VECINOS_POR_CALLE) {
    throw new Error(`${archivo}: debe tener ${VECINOS_POR_CALLE} vecinos y tiene ${vecinos.length}`);
  }
  idsUnicos(vecinos, archivo);
  return vecinos;
}

export const DISFRACES: readonly Disfraz[] = validarDisfraces(disfracesJson);
export const VECINOS: readonly Vecino[] = validarVecinos(vecinosJson);
