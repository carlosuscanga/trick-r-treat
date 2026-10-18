// Bloques de la calle y la regla que la vigila: si el salto cambia, los límites
// cambian con él, y una calle imposible no pasa el CI. Sin Phaser: lo prueba Vitest.
//
// Convención: `x` es el borde izquierdo del bloque en px de mundo. `alto` es su
// grosor propio sobre la superficie que tiene abajo (`sobre`, o la calle si no tiene).

import { derivarFisica, type Ajustes } from '../movimiento/ajustes';
import calleJson from './calle-prueba.json' with { type: 'json' };

export type Bloque = { nombre: string; x: number; ancho: number; alto: number; sobre?: string };

export type Limites = {
  /** Lo más alto que se sube de un salto máximo (desde la calle o desde un bloque vecino). */
  escalonMax: number;
  /** Lo más alto que se sube con un toque de pulgar (`TOQUE_PULGAR_S`), no con uno teórico. */
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

/** x donde aparece Mi vo: la regla de regreso se mide desde el tramo que la contiene. */
export const X_INICIO = 340;

const MARGEN = 0.85;
const ALTURA_MAX_FIJA = 400;
const GROSOR_MIN_FIJO = 32;
/** Duración de un toque normal con el pulgar, medida a ojo en el iPhone (T-004). */
export const TOQUE_PULGAR_S = 0.08;

/**
 * Altura de un toque de pulgar: lo que sube mientras el dedo sigue abajo, más
 * `alturaMin` tras el corte al soltar. Si al soltar ya va más lento que el corte,
 * no hay corte y llega a la altura máxima.
 */
export function alturaToquePulgar(salto: Ajustes['salto']): number {
  const f = derivarFisica(salto);
  const t = TOQUE_PULGAR_S;
  const vSoltar = f.v0 - f.gSubida * t;
  if (vSoltar <= f.vCorte) return salto.alturaMax;
  return f.v0 * t - (f.gSubida * t * t) / 2 + salto.alturaMin;
}

export function limitesDeSalto(a: Ajustes): Limites {
  return {
    escalonMax: MARGEN * a.salto.alturaMax,
    escalonCorto: MARGEN * alturaToquePulgar(a.salto),
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

/** Un tramo de la silueta de la calle vista de lado: de `desde` a `hasta` en x, a `altura`. */
export type Tramo = { nombre: string; desde: number; hasta: number; altura: number };

/** Silueta de la calle: tramos con la altura del bloque más alto que los cubre (o la calle, a 0). */
export function perfilDeCalle(bloques: readonly Bloque[]): Tramo[] {
  const cortes = new Set<number>([0, ANCHO_CALLE]);
  for (const b of bloques) {
    for (const x of [b.x, b.x + b.ancho]) cortes.add(Math.min(Math.max(x, 0), ANCHO_CALLE));
  }
  const xs = [...cortes].sort((p, q) => p - q);
  const tramos: Tramo[] = [];
  for (let k = 0; k + 1 < xs.length; k++) {
    const medio = (xs[k] + xs[k + 1]) / 2;
    let nombre = 'calle';
    let altura = 0;
    for (const b of bloques) {
      const h = alturaSuperior(b, bloques);
      if (b.x <= medio && medio < b.x + b.ancho && h > altura) {
        nombre = b.nombre;
        altura = h;
      }
    }
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.nombre === nombre && ultimo.altura === altura) ultimo.hasta = xs[k + 1];
    else tramos.push({ nombre, desde: xs[k], hasta: xs[k + 1], altura });
  }
  return tramos;
}

/** Se pasa de i a j si sube a lo más escalonMax y es su vecino, o se salta un hueco más bajo y angosto. */
function hayPaso(tramos: readonly Tramo[], i: number, j: number, l: Limites): boolean {
  if (tramos[j].altura - tramos[i].altura > l.escalonMax) return false;
  if (Math.abs(i - j) === 1) return true;
  const [a, b] = i < j ? [i, j] : [j, i];
  if (tramos[b].desde - tramos[a].hasta > l.distanciaMax) return false;
  const techo = Math.min(tramos[i].altura, tramos[j].altura);
  for (let k = a + 1; k < b; k++) if (tramos[k].altura >= techo) return false;
  return true;
}

function alcanzables(inicio: number, aristas: readonly number[][]): Set<number> {
  const vistos = new Set<number>([inicio]);
  const cola = [inicio];
  for (let k = 0; k < cola.length; k++) {
    for (const v of aristas[cola[k]]) {
      if (!vistos.has(v)) {
        vistos.add(v);
        cola.push(v);
      }
    }
  }
  return vistos;
}

export function revisarCalle(bloques: readonly Bloque[], l: Limites): string[] {
  const errores: string[] = [];

  for (const b of bloques) {
    const altura = alturaSuperior(b, bloques);
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

  // Perfil de la calle: desde el inicio se llega a todo y desde todo se regresa al inicio.
  const tramos = perfilDeCalle(bloques);
  const n = tramos.length;
  const sale: number[][] = tramos.map(() => []);
  const entra: number[][] = tramos.map(() => []);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && hayPaso(tramos, i, j, l)) {
        sale[i].push(j);
        entra[j].push(i);
      }
    }
  }
  const inicio = Math.max(0, tramos.findIndex((t) => t.desde <= X_INICIO && X_INICIO < t.hasta));
  const desdeInicio = alcanzables(inicio, sale);
  const haciaInicio = alcanzables(inicio, entra);
  tramos.forEach((t, i) => {
    const donde = `"${t.nombre}" (x ${t.desde} a ${t.hasta})`;
    if (!desdeInicio.has(i)) errores.push(`${donde} es inalcanzable desde el inicio`);
    if (!haciaInicio.has(i)) errores.push(`desde ${donde} no se puede regresar al inicio`);
  });
  return errores;
}

export const BLOQUES_CALLE_PRUEBA: readonly Bloque[] = validarBloques(calleJson);
