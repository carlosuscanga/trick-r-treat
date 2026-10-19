// Tipos de los datos del juego. Solo tipos: nada aquí existe en tiempo de ejecución.

/** Tipo de reto de un minijuego. El disfraz da ventaja en un tipo, no en un minijuego. */
export type TipoReto = 'reflejos' | 'memoria' | 'puzzle' | 'plataformas' | 'ritmo' | 'punteria';

/** Dificultad de una casa. Se sortea en cada partida (T-008); no es parte del vecino. */
export type Dificultad = 'facil' | 'media' | 'dificil';

/** Cómo asusta un vecino cuando Mi vo pierde. */
export type TipoSusto = 'salta' | 'tiembla' | 'se-agranda';

/** Una puerta de la calle: dónde está y qué tan difícil es su minijuego. */
export interface Puerta {
  /** Posición en x de la calle, en px de mundo. */
  x: number;
  dificultad: Dificultad;
}

/** Puertas de la calle y qué tan cerca hay que estar para tocar. */
export interface Puertas {
  /** Distancia máxima en x para estar "cerca" de una puerta, en px. */
  radio: number;
  puertas: Puerta[];
}

export interface Disfraz {
  id: string;
  nombre: string;
  tipo: TipoReto;
  /** Descripción para mostrar. La ventaja real la aplica el minijuego de ese tipo. */
  ventaja: string;
}

export interface Vecino {
  id: string;
  nombre: string;
  /** El disfraz que lleva el vecino (texto para mostrar). */
  disfraz: string;
  susto: TipoSusto;
}
