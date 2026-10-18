import { describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO, derivarFisica, type Fisica } from './ajustes';
import { crearEstadoSalto, pasoSalto, type EstadoSalto, type SalidaSalto } from './salto';

// Valores fijos: la lógica se prueba sin depender de lo que se afine en el iPhone.
const F = derivarFisica({ ...AJUSTES_POR_DEFECTO.salto, alturaMax: 260, alturaMin: 70, tiempoSubida: 0.38, tiempoCaida: 0.27 });

/** Paso fijo de Arcade en la escena: 120 pasos por segundo. */
const PASO_MS = 1000 / 120;

function nuevaSalida(): SalidaSalto {
  return { vy: null, gravedad: 0, evento: null };
}

type Resultado = { altura: number; subidaMs: number; caidaMs: number; gravedadCayendo: number };

/**
 * Salta desde el suelo y deja caer hasta aterrizar. Llama a `pasoSalto` una vez por
 * frame con el `dt` del frame e integra la posición como Arcade: acumula el `dt` y da
 * pasos fijos de 1/120 s (velocidad primero, luego posición). `y` negativo es arriba.
 * `sostenerMs`: cuánto sigue abajo Saltar desde que se tocó (0 = se soltó en el mismo frame).
 */
function simular(f: Fisica, sostenerMs: number, dtFrameMs: number): Resultado {
  const e = crearEstadoSalto();
  const salida = nuevaSalida();
  const h = PASO_MS / 1000;
  let y = 0;
  let vy = 0;
  let acumulado = 0;
  let t = 0;
  let alturaMax = 0;
  let tApice = 0;
  let gravedadCayendo = 0;
  let despego = false;
  while (t < 3000) {
    const enSuelo = y >= 0 && vy >= 0;
    pasoSalto(e, enSuelo, vy, t === 0, t < sostenerMs, dtFrameMs, f, salida);
    if (salida.vy !== null) vy = salida.vy;
    if (vy > 0) gravedadCayendo = salida.gravedad;
    acumulado += dtFrameMs;
    while (acumulado >= PASO_MS) {
      acumulado -= PASO_MS;
      vy = Math.min(vy + salida.gravedad * h, f.caidaMax);
      y += vy * h;
      if (y < 0) despego = true;
      if (-y > alturaMax) {
        alturaMax = -y;
        tApice = t + dtFrameMs;
      }
      if (y >= 0 && vy > 0) {
        y = 0;
        vy = 0;
      }
    }
    t += dtFrameMs;
    if (despego && y === 0) break;
  }
  return { altura: alturaMax, subidaMs: tApice, caidaMs: t - tApice, gravedadCayendo };
}

/** Deja el estado en el aire con `ms` sin suelo, en pasos de 1 ms, sin tocar Saltar. */
function caerDesdeBorde(e: EstadoSalto, salida: SalidaSalto, ms: number): void {
  for (let i = 0; i < 10; i++) pasoSalto(e, true, 0, false, false, 1, F, salida);
  for (let i = 0; i < ms; i++) pasoSalto(e, false, 10, false, false, 1, F, salida);
}

describe('pasoSalto', () => {
  it("salta desde el suelo con vy = -v0 y emite 'salto'", () => {
    const e = crearEstadoSalto();
    const salida = nuevaSalida();
    pasoSalto(e, true, 0, false, false, 16.7, F, salida);
    expect(salida.vy).toBeNull();
    expect(salida.evento).toBeNull();
    const devuelta = pasoSalto(e, true, 0, true, true, 16.7, F, salida);
    expect(devuelta).toBe(salida);
    expect(salida.vy).toBe(-F.v0);
    expect(salida.evento).toBe('salto');
    expect(salida.gravedad).toBe(F.gSubida);
    // El siguiente frame reinicia la salida.
    pasoSalto(e, false, -F.v0, false, true, 16.7, F, salida);
    expect(salida.vy).toBeNull();
    expect(salida.evento).toBeNull();
  });

  it("emite 'aterrizaje' al volver al suelo, una sola vez", () => {
    const e = crearEstadoSalto();
    const salida = nuevaSalida();
    pasoSalto(e, false, 100, false, false, 16.7, F, salida);
    pasoSalto(e, true, 0, false, false, 16.7, F, salida);
    expect(salida.evento).toBe('aterrizaje');
    pasoSalto(e, true, 0, false, false, 16.7, F, salida);
    expect(salida.evento).toBeNull();
  });

  it('coyote: salta a 100 ms de dejar el suelo, no a 101 ms', () => {
    const salida = nuevaSalida();
    const a = crearEstadoSalto();
    caerDesdeBorde(a, salida, 99);
    pasoSalto(a, false, 10, true, true, 1, F, salida); // ms 100 sin suelo
    expect(salida.evento).toBe('salto');
    expect(salida.vy).toBe(-F.v0);

    const b = crearEstadoSalto();
    caerDesdeBorde(b, salida, 100);
    pasoSalto(b, false, 10, true, true, 1, F, salida); // ms 101 sin suelo
    expect(salida.evento).toBeNull();
    expect(salida.vy).toBeNull();
  });

  it('búfer: Saltar 130 ms antes de aterrizar salta al tocar suelo; 131 ms no', () => {
    const salida = nuevaSalida();
    const probar = (msAntes: number): SalidaSalto['evento'] => {
      const e = crearEstadoSalto();
      caerDesdeBorde(e, salida, 500); // lejos del coyote
      pasoSalto(e, false, 10, true, true, 1, F, salida); // toca Saltar en el aire
      expect(salida.evento).toBeNull();
      // Sigue con el dedo abajo: el salto del búfer sale completo.
      for (let i = 1; i < msAntes; i++) pasoSalto(e, false, 10, false, true, 1, F, salida);
      pasoSalto(e, true, 0, false, true, 1, F, salida); // aterriza msAntes ms después
      return salida.evento;
    };
    expect(probar(130)).toBe('salto');
    expect(salida.vy).toBe(-F.v0);
    expect(probar(131)).toBe('aterrizaje');
    expect(salida.vy).toBeNull();
  });

  it('el búfer se gasta al saltar: un solo toque da un solo salto', () => {
    const e = crearEstadoSalto();
    const salida = nuevaSalida();
    pasoSalto(e, true, 0, true, true, 1, F, salida);
    expect(salida.evento).toBe('salto');
    // Aunque el suelo siga reportándose un frame más, el toque ya se usó.
    pasoSalto(e, true, 0, false, true, 1, F, salida);
    expect(salida.evento).toBeNull();
    expect(salida.vy).toBeNull();
  });

  it('no hay doble salto: sin suelo, tras un salto, el coyote no aplica', () => {
    const e = crearEstadoSalto();
    const salida = nuevaSalida();
    pasoSalto(e, true, 0, true, true, 1, F, salida);
    expect(salida.evento).toBe('salto');
    for (let ms = 1; ms <= 20; ms++) pasoSalto(e, false, -F.v0, false, true, 1, F, salida);
    pasoSalto(e, false, -F.v0, true, true, 1, F, salida); // 21 ms en el aire: dentro del coyote
    expect(salida.evento).toBeNull();
    expect(salida.vy).toBeNull();
  });

  it('al soltar Saltar mientras sube, recorta la velocidad a vCorte', () => {
    const e = crearEstadoSalto();
    const salida = nuevaSalida();
    pasoSalto(e, false, -F.v0, false, false, 16.7, F, salida);
    expect(salida.vy).toBe(-F.vCorte);
    // Ya por debajo de vCorte o cayendo, no lo toca.
    pasoSalto(e, false, -F.vCorte / 2, false, false, 16.7, F, salida);
    expect(salida.vy).toBeNull();
    pasoSalto(e, false, 300, false, false, 16.7, F, salida);
    expect(salida.vy).toBeNull();
  });

  it('toque corto ≈ alturaMin (±10 %) y mantener ≈ alturaMax (±3 %)', () => {
    const corto = simular(F, 0, 1000 / 60);
    const largo = simular(F, Infinity, 1000 / 60);
    expect(Math.abs(corto.altura - 70) / 70).toBeLessThanOrEqual(0.1);
    expect(Math.abs(largo.altura - 260) / 260).toBeLessThanOrEqual(0.03);
  });

  it('cae con gBajada > gSubida', () => {
    const r = simular(F, Infinity, 1000 / 60);
    expect(F.gBajada).toBeGreaterThan(F.gSubida);
    expect(r.gravedadCayendo).toBe(F.gBajada);
    expect(r.caidaMs).toBeLessThan(r.subidaMs);
  });

  it('la altura máxima es la misma con frames de 8.3, 16.7 y 33.3 ms (±2 %)', () => {
    const alturas = [8.3, 16.7, 33.3].map((dt) => simular(F, Infinity, dt).altura);
    const base = alturas[1];
    for (const a of alturas) expect(Math.abs(a - base) / base).toBeLessThanOrEqual(0.02);
    const cortos = [8.3, 16.7, 33.3].map((dt) => simular(F, 0, dt).altura);
    for (const a of cortos) expect(Math.abs(a - cortos[1]) / cortos[1]).toBeLessThanOrEqual(0.02);
  });

  it('apiceColgado apagado no cambia la gravedad; encendido la reduce a la mitad cerca del ápice', () => {
    const colgado: Fisica = { ...F, apiceColgado: true };
    const salida = nuevaSalida();
    const gravedad = (f: Fisica, vy: number, sostenido: boolean): number =>
      pasoSalto(crearEstadoSalto(), false, vy, false, sostenido, 16.7, f, salida).gravedad;

    expect(gravedad(F, -50, true)).toBe(F.gSubida);
    expect(gravedad(F, 50, true)).toBe(F.gBajada);

    expect(gravedad(colgado, -50, true)).toBe(F.gSubida / 2);
    expect(gravedad(colgado, 50, true)).toBe(F.gBajada / 2);
    expect(gravedad(colgado, 0, true)).toBe(F.gBajada / 2);
    // Lejos del ápice o sin mantener, gravedad normal.
    expect(gravedad(colgado, -200, true)).toBe(F.gSubida);
    expect(gravedad(colgado, 200, true)).toBe(F.gBajada);
    expect(gravedad(colgado, 50, false)).toBe(F.gBajada);
  });
});
