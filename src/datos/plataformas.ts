// Bloques de la calle y la regla que la vigila: si el salto cambia, los límites
// cambian con él, y una calle imposible no pasa el CI. Sin Phaser: lo prueba Vitest.
//
// Convención: `x` es el borde izquierdo del bloque en px de mundo. `alto` es su
// grosor propio sobre la superficie que tiene abajo (`sobre`, o la calle si no tiene).

import type { Ajustes } from '../movimiento/ajustes';
import calleJson from './calle-prueba.json' with { type: 'json' };

export type Bloque = { nombre: string; x: number; ancho: number; alto: number; sobre?: string };

export type Limites = {
  /** Lo más alto que se sube de un salto máximo (desde la calle o desde un bloque vecino). */
  escalonMax: number;
  /** Lo más alto que se sube con un toque corto. */
  escalonCorto: number;
  /** Altura máxima de cualquier bloque sobre la calle. */
  alturaMax: number;
  /** Distancia horizontal máxima entre bordes para encadenar saltos. */
  distanciaMax: number;
  /** Grosor mínimo de un bloque. */
  grosorMin: number;
};

/** Ancho del mundo de la calle de prueba, en px. */
export const ANCHO_CALLE = 4800;

const MARGEN = 0.85;
const ALTURA_MAX_FIJA = 400;
const GROSOR_MIN_FIJO = 32;

export function limitesDeSalto(a: Ajustes): Limites {
  return {
    escalonMax: MARGEN * a.salto.alturaMax,
    escalonCorto: MARGEN * a.salto.alturaMin,
    alturaMax: ALTURA_MAX_FIJA,
    distanciaMax: MARGEN * a.caminar.velocidad * (a.salto.tiempoSubida + a.salto.tiempoCaida),
    grosorMin: GROSOR_MIN_FIJO,
  };
}

type Entrada = Record<string, unknown>;

function texto(entrada: Entrada, campo: string, donde: string): string {
  const valor = entrada[campo];
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new Error(`${donde}: "${campo}" debe ser un texto no vacío`);
  }
  return valor;
}

function numero(entrada: Entrada, campo: string, donde: string, minimo: 'cero' | 'positivo'): number {
  const valor = entrada[campo];
  const bien = typeof valor === 'number' && Number.isFinite(valor) && (minimo === 'cero' ? valor >= 0 : valor > 0);
  if (!bien) throw new Error(`${donde}: "${campo}" debe ser un número ${minimo === 'cero' ? '>= 0' : '> 0'}`);
  return valor as number;
}

export function validarBloques(datos: unknown): Bloque[] {
  const archivo = 'calle-prueba.json';
  if (!Array.isArray(datos)) throw new Error(`${archivo}: debe ser una lista`);
  const vistos = new Set<string>();
  return datos.map((crudo: unknown, i) => {
    const donde = `${archivo}, entrada ${i}`;
    if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
      throw new Error(`${donde}: debe ser un objeto`);
    }
    const entrada = crudo as Entrada;
    const nombre = texto(entrada, 'nombre', donde);
    if (vistos.has(nombre)) throw new Error(`${archivo}: nombre repetido "${nombre}"`);
    const bloque: Bloque = {
      nombre,
      x: numero(entrada, 'x', donde, 'cero'),
      ancho: numero(entrada, 'ancho', donde, 'positivo'),
      alto: numero(entrada, 'alto', donde, 'positivo'),
    };
    if (entrada.sobre !== undefined) {
      const sobre = texto(entrada, 'sobre', donde);
      // Debe estar antes en la lista: así `sobre` no puede formar ciclos.
      if (!vistos.has(sobre)) throw new Error(`${donde}: "sobre" debe ser un bloque anterior, y "${sobre}" no lo es`);
      bloque.sobre = sobre;
    }
    vistos.add(nombre);
    return bloque;
  });
}

function buscar(nombre: string | undefined, todos: readonly Bloque[]): Bloque | undefined {
  return nombre === undefined ? undefined : todos.find((b) => b.nombre === nombre);
}

/** Altura de la cara de arriba del bloque sobre la calle: su alto más la del bloque de abajo. */
export function alturaSuperior(b: Bloque, todos: readonly Bloque[]): number {
  let total = b.alto;
  let abajo = buscar(b.sobre, todos);
  // El tope de pasos evita un bucle infinito si unos datos sin validar tienen un ciclo.
  for (let pasos = 0; abajo !== undefined && pasos <= todos.length; pasos++) {
    total += abajo.alto;
    abajo = buscar(abajo.sobre, todos);
  }
  return total;
}

/** Sube con un toque corto: su escalón sobre lo que tiene abajo cabe en la altura mínima. */
export function esDeToqueCorto(b: Bloque, todos: readonly Bloque[], l: Limites): boolean {
  const abajo = buscar(b.sobre, todos);
  const escalon = alturaSuperior(b, todos) - (abajo ? alturaSuperior(abajo, todos) : 0);
  return escalon <= l.escalonCorto;
}

function distanciaHorizontal(a: Bloque, b: Bloque): number {
  return Math.max(0, b.x - (a.x + a.ancho), a.x - (b.x + b.ancho));
}

export function revisarCalle(bloques: readonly Bloque[], l: Limites): string[] {
  const errores: string[] = [];
  const alturas = new Map<string, number>();

  for (const b of bloques) {
    const altura = alturaSuperior(b, bloques);
    alturas.set(b.nombre, altura);
    const abajo = buscar(b.sobre, bloques);
    if (abajo && (b.x < abajo.x || b.x + b.ancho > abajo.x + abajo.ancho)) {
      errores.push(`"${b.nombre}" se sale de "${abajo.nombre}" en x`);
    }
    if (b.x < 0 || b.x + b.ancho > ANCHO_CALLE) {
      errores.push(`"${b.nombre}" se sale de la calle (0 a ${ANCHO_CALLE} px)`);
    }
    if (b.alto < l.grosorMin) {
      errores.push(`"${b.nombre}" mide ${b.alto} de alto y el grosor mínimo es ${l.grosorMin}`);
    }
    if (altura > l.alturaMax) {
      errores.push(`"${b.nombre}" llega a ${altura} y la altura máxima es ${l.alturaMax}`);
    }
  }

  // Alcance en anchura: desde la calle solo cuenta la altura; entre bloques, también la distancia.
  const alcanzados = new Set<string>();
  const pendientes: Bloque[] = [];
  for (const b of bloques) {
    if ((alturas.get(b.nombre) ?? 0) <= l.escalonMax) {
      alcanzados.add(b.nombre);
      pendientes.push(b);
    }
  }
  for (let i = 0; i < pendientes.length; i++) {
    const desde = pendientes[i];
    const alturaDesde = alturas.get(desde.nombre) ?? 0;
    for (const b of bloques) {
      if (alcanzados.has(b.nombre)) continue;
      const sube = (alturas.get(b.nombre) ?? 0) - alturaDesde;
      if (sube <= l.escalonMax && distanciaHorizontal(desde, b) <= l.distanciaMax) {
        alcanzados.add(b.nombre);
        pendientes.push(b);
      }
    }
  }
  for (const b of bloques) {
    if (!alcanzados.has(b.nombre)) errores.push(`"${b.nombre}" es inalcanzable desde la calle`);
  }
  return errores;
}

export const BLOQUES_CALLE_PRUEBA: readonly Bloque[] = validarBloques(calleJson);
