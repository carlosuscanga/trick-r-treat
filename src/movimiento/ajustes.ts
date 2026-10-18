// Valores afinables del movimiento (salto, caminar, joystick y botones) y la
// física que se deriva de ellos. El JSON se importa estático y se valida al cargar,
// como en `src/datos/index.ts`. Sin Phaser: lo prueba Vitest en Node.

import ajustesJson from './ajustes.json' with { type: 'json' };

export type Ajustes = {
  salto: {
    /** Altura máxima del salto (manteniendo Saltar), en px. */
    alturaMax: number;
    /** Altura mínima (toque corto), en px. */
    alturaMin: number;
    /** Segundos para llegar a la altura máxima. */
    tiempoSubida: number;
    /** Segundos para caer desde la altura máxima. */
    tiempoCaida: number;
    /** Velocidad de caída máxima, en px/s. */
    caidaMax: number;
    /** Margen para saltar después de dejar el suelo, en ms. */
    coyoteMs: number;
    /** Margen para un Saltar tocado antes de aterrizar, en ms. */
    bufferMs: number;
    /** Gravedad a la mitad cerca del ápice mientras se mantiene Saltar. */
    apiceColgado: boolean;
  };
  caminar: {
    velocidad: number;
    /** La velocidad crece con la distancia del dedo al origen del joystick. */
    proporcional: boolean;
    /** Fracción de `velocidad` al pasar la zona muerta (con `proporcional`). */
    velocidadMinima: number;
  };
  joystick: { radio: number; activa: number; suelta: number; margenBorde: number };
  botones: {
    radioToque: number;
    radioDibujo: number;
    margenAbajo: number;
    /** `derecha` y `abajo`: distancia del centro del botón al borde derecho y al de abajo. */
    saltar: { derecha: number; abajo: number };
    brazos: { derecha: number; abajo: number };
  };
};

/** Física lista para el salto: gravedades en px/s², velocidades en px/s. */
export type Fisica = {
  gSubida: number;
  gBajada: number;
  v0: number;
  vCorte: number;
  caidaMax: number;
  coyoteMs: number;
  bufferMs: number;
  apiceColgado: boolean;
};

type Entrada = Record<string, unknown>;

function objeto(valor: unknown, donde: string): Entrada {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new Error(`${donde}: debe ser un objeto`);
  }
  return valor as Entrada;
}

function numero(entrada: Entrada, campo: string, donde: string): number {
  const valor = entrada[campo];
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new Error(`${donde}.${campo}: debe ser un número`);
  }
  return valor;
}

// Fracción en (0, 1]: con 0 o menos, el pulgar cerca del origen la frenaría o la regresaría.
function fraccion(entrada: Entrada, campo: string, donde: string): number {
  const valor = numero(entrada, campo, donde);
  if (valor <= 0 || valor > 1) throw new Error(`${donde}.${campo}: debe estar entre 0 (sin incluir) y 1`);
  return valor;
}

function booleano(entrada: Entrada, campo: string, donde: string): boolean {
  const valor = entrada[campo];
  if (typeof valor !== 'boolean') throw new Error(`${donde}.${campo}: debe ser true o false`);
  return valor;
}

function posicion(padre: Entrada, campo: string, donde: string): { derecha: number; abajo: number } {
  const lugar = `${donde}.${campo}`;
  const entrada = objeto(padre[campo], lugar);
  return { derecha: numero(entrada, 'derecha', lugar), abajo: numero(entrada, 'abajo', lugar) };
}

export function validarAjustes(datos: unknown): Ajustes {
  const raiz = objeto(datos, 'ajustes');
  const salto = objeto(raiz.salto, 'ajustes.salto');
  const caminar = objeto(raiz.caminar, 'ajustes.caminar');
  const joystick = objeto(raiz.joystick, 'ajustes.joystick');
  const botones = objeto(raiz.botones, 'ajustes.botones');
  return {
    salto: {
      alturaMax: numero(salto, 'alturaMax', 'ajustes.salto'),
      alturaMin: numero(salto, 'alturaMin', 'ajustes.salto'),
      tiempoSubida: numero(salto, 'tiempoSubida', 'ajustes.salto'),
      tiempoCaida: numero(salto, 'tiempoCaida', 'ajustes.salto'),
      caidaMax: numero(salto, 'caidaMax', 'ajustes.salto'),
      coyoteMs: numero(salto, 'coyoteMs', 'ajustes.salto'),
      bufferMs: numero(salto, 'bufferMs', 'ajustes.salto'),
      apiceColgado: booleano(salto, 'apiceColgado', 'ajustes.salto'),
    },
    caminar: {
      velocidad: numero(caminar, 'velocidad', 'ajustes.caminar'),
      proporcional: booleano(caminar, 'proporcional', 'ajustes.caminar'),
      velocidadMinima: fraccion(caminar, 'velocidadMinima', 'ajustes.caminar'),
    },
    joystick: {
      radio: numero(joystick, 'radio', 'ajustes.joystick'),
      activa: numero(joystick, 'activa', 'ajustes.joystick'),
      suelta: numero(joystick, 'suelta', 'ajustes.joystick'),
      margenBorde: numero(joystick, 'margenBorde', 'ajustes.joystick'),
    },
    botones: {
      radioToque: numero(botones, 'radioToque', 'ajustes.botones'),
      radioDibujo: numero(botones, 'radioDibujo', 'ajustes.botones'),
      margenAbajo: numero(botones, 'margenAbajo', 'ajustes.botones'),
      saltar: posicion(botones, 'saltar', 'ajustes.botones'),
      brazos: posicion(botones, 'brazos', 'ajustes.botones'),
    },
  };
}

/** g = 2H/t² y v₀ = 2H/t; vCorte es la velocidad que deja subir justo `alturaMin`. */
export function derivarFisica(salto: Ajustes['salto']): Fisica {
  const H = salto.alturaMax;
  const gSubida = (2 * H) / (salto.tiempoSubida * salto.tiempoSubida);
  return {
    gSubida,
    gBajada: (2 * H) / (salto.tiempoCaida * salto.tiempoCaida),
    v0: (2 * H) / salto.tiempoSubida,
    vCorte: Math.sqrt(2 * gSubida * salto.alturaMin),
    caidaMax: salto.caidaMax,
    coyoteMs: salto.coyoteMs,
    bufferMs: salto.bufferMs,
    apiceColgado: salto.apiceColgado,
  };
}

/**
 * Tope de velocidad vertical para Arcade: `maxVelocity.y` limita las dos direcciones,
 * así que no puede ser menor que `v0` o recortaría la subida del salto.
 */
export function topeVertical(f: Fisica): number {
  return Math.max(f.caidaMax, f.v0);
}

export const AJUSTES_POR_DEFECTO: Readonly<Ajustes> = validarAjustes(ajustesJson);

/** Evento de `game.events`: el panel `?depurar` cambió el objeto de ajustes vivo del registry. */
export const AJUSTES_CAMBIADOS = 'ajustes-cambiados';
