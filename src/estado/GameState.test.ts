import { describe, expect, it } from 'vitest';
import { DISFRACES } from '../datos';
import { GameState } from './GameState';

describe('dulces', () => {
  it('suman en pasos de ½ y 9½ no gana', () => {
    const estado = new GameState();
    for (let i = 0; i < 4; i++) estado.ganarCasa(2); // 8
    for (let i = 0; i < 3; i++) estado.encontrarMedioDulce(); // 9½
    expect(estado.dulces).toBe(9.5);
    expect(estado.medios).toBe(19);
    expect(estado.haGanado()).toBe(false);

    estado.encontrarMedioDulce(); // 10
    expect(estado.dulces).toBe(10);
    expect(estado.haGanado()).toBe(true);
  });

  it('no pasan de 10', () => {
    const estado = new GameState();
    for (let i = 0; i < 4; i++) estado.ganarCasa(3); // 9 + 3
    expect(estado.dulces).toBe(10);
  });
});

describe('sustos', () => {
  it('van de 0 a 3 y con 3 se pierde', () => {
    const estado = new GameState();
    expect(estado.sustos).toBe(0);
    estado.recibirSusto();
    estado.recibirSusto();
    expect(estado.haPerdido()).toBe(false);

    estado.recibirSusto();
    expect(estado.sustos).toBe(3);
    expect(estado.haPerdido()).toBe(true);

    estado.recibirSusto();
    expect(estado.sustos).toBe(3);
  });
});

describe('casas', () => {
  it('sin casas y sin 10 dulces se pierde; con 10 no', () => {
    const sinMeta = new GameState();
    for (let i = 0; i < GameState.CASAS_POR_CALLE; i++) sinMeta.visitarCasa(i);
    expect(sinMeta.haPerdido()).toBe(true);

    const conMeta = new GameState();
    for (let i = 0; i < 4; i++) conMeta.ganarCasa(3);
    for (let i = 0; i < GameState.CASAS_POR_CALLE; i++) conMeta.visitarCasa(i);
    expect(conMeta.haPerdido()).toBe(false);
  });

  it('una casa no se visita dos veces ni fuera de rango', () => {
    const estado = new GameState();
    estado.visitarCasa(3);
    expect(estado.estaVisitada(3)).toBe(true);
    expect(estado.casasVisitadas).toBe(1);
    expect(() => estado.visitarCasa(3)).toThrow(/ya se visitó/);
    expect(() => estado.visitarCasa(8)).toThrow(/Casa inválida/);
    expect(() => estado.visitarCasa(-1)).toThrow(/Casa inválida/);
    expect(() => estado.visitarCasa(1.5)).toThrow(/Casa inválida/);
  });
});

describe('nuevaPartida', () => {
  it('reinicia todo', () => {
    const estado = new GameState();
    estado.elegirDisfraz(DISFRACES[0]);
    estado.ganarCasa(2);
    estado.encontrarMedioDulce();
    estado.recibirSusto();
    estado.visitarCasa(0);

    estado.nuevaPartida();

    expect(estado.disfraz).toBeNull();
    expect(estado.medios).toBe(0);
    expect(estado.sustos).toBe(0);
    expect(estado.casasVisitadas).toBe(0);
    expect(estado.estaVisitada(0)).toBe(false);
  });
});
