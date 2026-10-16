// Estado de la partida. Solo lo usan las escenas del flujo (SelectorDisfraz,
// Calle, Puerta, Resultado y FinJuego); los minijuegos nunca lo importan.

import type { Disfraz } from '../datos/tipos';

/** Dulces que puede dar una casa: 1, 2 o 3 según su dificultad. */
export type DulcesCasa = 1 | 2 | 3;

export class GameState {
  static readonly META_DULCES = 10;
  static readonly MAX_SUSTOS = 3;
  static readonly CASAS_POR_CALLE = 8;

  // Los dulces se cuentan en medios (enteros) para que nunca haya redondeo:
  // 9½ son 19 medios y no llegan a la meta de 20.
  static readonly #META_MEDIOS = GameState.META_DULCES * 2;

  #disfraz: Readonly<Disfraz> | null = null;
  #medios = 0;
  #sustos = 0;
  #visitadas = new Set<number>();

  /** Deja todo en cero y sin disfraz, para empezar otra partida. */
  nuevaPartida(): void {
    this.#disfraz = null;
    this.#medios = 0;
    this.#sustos = 0;
    this.#visitadas = new Set<number>();
  }

  elegirDisfraz(disfraz: Readonly<Disfraz>): void {
    this.#disfraz = disfraz;
  }

  get disfraz(): Readonly<Disfraz> | null {
    return this.#disfraz;
  }

  /** Mi vo ganó el minijuego de una casa. */
  ganarCasa(dulces: DulcesCasa): void {
    this.#sumarMedios(dulces * 2);
  }

  /** Mi vo encontró un dulce escondido explorando (vale ½). */
  encontrarMedioDulce(): void {
    this.#sumarMedios(1);
  }

  /** Dulces para mostrar, por ejemplo 6.5. Para la lógica, usar `medios`. */
  get dulces(): number {
    return this.#medios / 2;
  }

  /** Dulces en medios, de 0 a 20. */
  get medios(): number {
    return this.#medios;
  }

  recibirSusto(): void {
    this.#sustos = Math.min(this.#sustos + 1, GameState.MAX_SUSTOS);
  }

  get sustos(): number {
    return this.#sustos;
  }

  /** Marca una casa (0 a 7) como visitada. Falla si no existe o ya se visitó. */
  visitarCasa(indice: number): void {
    if (!Number.isInteger(indice) || indice < 0 || indice >= GameState.CASAS_POR_CALLE) {
      throw new Error(`Casa inválida: ${indice}`);
    }
    if (this.#visitadas.has(indice)) {
      throw new Error(`La casa ${indice} ya se visitó`);
    }
    this.#visitadas.add(indice);
  }

  estaVisitada(indice: number): boolean {
    return this.#visitadas.has(indice);
  }

  get casasVisitadas(): number {
    return this.#visitadas.size;
  }

  haGanado(): boolean {
    return this.#medios >= GameState.#META_MEDIOS;
  }

  /** Perdió con 3 sustos, o si visitó todas las casas sin llegar a la meta. */
  haPerdido(): boolean {
    if (this.#sustos >= GameState.MAX_SUSTOS) return true;
    return this.#visitadas.size === GameState.CASAS_POR_CALLE && !this.haGanado();
  }

  // El tope es la meta: con 9 dulces y una casa de 3, quedan 10, no 12.
  #sumarMedios(medios: number): void {
    this.#medios = Math.min(this.#medios + medios, GameState.#META_MEDIOS);
  }
}

/** El estado de la partida en curso. */
export const gameState = new GameState();
