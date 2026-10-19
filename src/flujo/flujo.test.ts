import { describe, expect, it } from 'vitest';
import { GameState } from '../estado/GameState';
import { puertaCercana, siguienteTrasResultado } from './flujo';

describe('siguienteTrasResultado', () => {
  it('va a FinJuego al llegar a la meta de dulces', () => {
    const estado = new GameState();
    estado.ganarCasa(3);
    estado.ganarCasa(3);
    estado.ganarCasa(3);
    estado.ganarCasa(1);
    expect(siguienteTrasResultado(estado)).toBe('FinJuego');
  });

  it('va a FinJuego con 3 sustos', () => {
    const estado = new GameState();
    for (let i = 0; i < GameState.MAX_SUSTOS; i++) estado.recibirSusto();
    expect(siguienteTrasResultado(estado)).toBe('FinJuego');
  });

  it('va a FinJuego al visitar las 8 casas sin llegar a la meta', () => {
    const estado = new GameState();
    for (let i = 0; i < GameState.CASAS_POR_CALLE; i++) estado.visitarCasa(i);
    expect(siguienteTrasResultado(estado)).toBe('FinJuego');
  });

  it('vuelve a la Calle con la partida a medias', () => {
    const estado = new GameState();
    estado.visitarCasa(0);
    estado.ganarCasa(2);
    estado.recibirSusto();
    expect(siguienteTrasResultado(estado)).toBe('Calle');
  });
});

describe('puertaCercana', () => {
  const puertas = [
    { x: 100, dificultad: 'facil' },
    { x: 200, dificultad: 'media' },
    { x: 1000, dificultad: 'dificil' },
  ] as const;
  const ninguna = () => false;

  it('encuentra una puerta dentro del radio', () => {
    expect(puertaCercana(1030, puertas, ninguna, 50)).toBe(2);
  });

  it('devuelve null fuera del radio', () => {
    expect(puertaCercana(600, puertas, ninguna, 50)).toBeNull();
  });

  it('ignora la puerta cercana si ya se visitó', () => {
    expect(puertaCercana(1030, puertas, (i) => i === 2, 50)).toBeNull();
  });

  it('con dos dentro del radio elige la más cercana', () => {
    expect(puertaCercana(170, puertas, ninguna, 100)).toBe(1);
    expect(puertaCercana(130, puertas, ninguna, 100)).toBe(0);
  });
});
