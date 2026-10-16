// Verifica GameState y los datos sin dependencias: node scripts/verificar-estado.ts
// (Node 24 ejecuta TypeScript directo). Falla con un error si algo no cumple.

import assert from 'node:assert/strict';
import { GameState } from '../src/estado/GameState.ts';
import { DISFRACES, VECINOS, validarDisfraces, validarVecinos } from '../src/datos/index.ts';

function prueba(nombre: string, fn: () => void): void {
  fn();
  console.log(`ok  ${nombre}`);
}

prueba('los dulces suman en pasos de ½ y 9½ no gana', () => {
  const estado = new GameState();
  for (let i = 0; i < 4; i++) estado.ganarCasa(2); // 8
  estado.encontrarMedioDulce();
  estado.encontrarMedioDulce();
  estado.encontrarMedioDulce(); // 9½
  assert.equal(estado.dulces, 9.5);
  assert.equal(estado.medios, 19);
  assert.equal(estado.haGanado(), false);
  estado.encontrarMedioDulce(); // 10
  assert.equal(estado.dulces, 10);
  assert.equal(estado.haGanado(), true);
});

prueba('los dulces no pasan de 10', () => {
  const estado = new GameState();
  for (let i = 0; i < 3; i++) estado.ganarCasa(3); // 9
  estado.ganarCasa(3);
  assert.equal(estado.dulces, 10);
});

prueba('los sustos van de 0 a 3 y con 3 se pierde', () => {
  const estado = new GameState();
  assert.equal(estado.sustos, 0);
  estado.recibirSusto();
  estado.recibirSusto();
  assert.equal(estado.haPerdido(), false);
  estado.recibirSusto();
  assert.equal(estado.sustos, 3);
  assert.equal(estado.haPerdido(), true);
  estado.recibirSusto();
  assert.equal(estado.sustos, 3);
});

prueba('sin casas y sin 10 dulces se pierde; con 10 no', () => {
  const sinMeta = new GameState();
  for (let i = 0; i < GameState.CASAS_POR_CALLE; i++) sinMeta.visitarCasa(i);
  assert.equal(sinMeta.haPerdido(), true);

  const conMeta = new GameState();
  for (let i = 0; i < 4; i++) conMeta.ganarCasa(3);
  for (let i = 0; i < GameState.CASAS_POR_CALLE; i++) conMeta.visitarCasa(i);
  assert.equal(conMeta.haPerdido(), false);
});

prueba('una casa no se visita dos veces ni fuera de rango', () => {
  const estado = new GameState();
  estado.visitarCasa(3);
  assert.equal(estado.estaVisitada(3), true);
  assert.equal(estado.casasVisitadas, 1);
  assert.throws(() => estado.visitarCasa(3), /ya se visitó/);
  assert.throws(() => estado.visitarCasa(8), /Casa inválida/);
  assert.throws(() => estado.visitarCasa(-1), /Casa inválida/);
  assert.throws(() => estado.visitarCasa(1.5), /Casa inválida/);
});

prueba('disfraces y vecinos se cargan desde JSON', () => {
  assert.equal(DISFRACES.length, 5);
  assert.equal(VECINOS.length, 8);
  assert.deepEqual(
    DISFRACES.map((d) => d.tipo),
    ['reflejos', 'memoria', 'puzzle', 'plataformas', 'ritmo'],
  );
});

prueba('el validador rechaza JSON inválidos', () => {
  const gata = { id: 'gata', nombre: 'Gata', tipo: 'reflejos', ventaja: 'x' };
  assert.throws(() => validarDisfraces({}), /debe ser una lista/);
  assert.throws(() => validarDisfraces([{ ...gata, tipo: 'magia' }]), /"tipo" desconocido: "magia"/);
  assert.throws(() => validarDisfraces([{ ...gata, tipo: 'toString' }]), /"tipo" desconocido/);
  assert.throws(() => validarDisfraces([{ ...gata, nombre: '' }]), /"nombre" debe ser un texto/);
  assert.throws(() => validarDisfraces([gata, gata]), /id repetido "gata"/);
  assert.throws(() => validarVecinos(VECINOS.slice(1)), /debe tener 8 vecinos y tiene 7/);
  assert.throws(
    () => validarVecinos(VECINOS.map((v, i) => (i === 0 ? { ...v, susto: 'grita' } : v))),
    /"susto" desconocido: "grita"/,
  );
});

prueba('nuevaPartida reinicia todo', () => {
  const estado = new GameState();
  estado.elegirDisfraz(DISFRACES[0]);
  estado.ganarCasa(2);
  estado.encontrarMedioDulce();
  estado.recibirSusto();
  estado.visitarCasa(0);
  estado.nuevaPartida();
  assert.equal(estado.disfraz, null);
  assert.equal(estado.medios, 0);
  assert.equal(estado.sustos, 0);
  assert.equal(estado.casasVisitadas, 0);
  assert.equal(estado.estaVisitada(0), false);
});

console.log('Todo bien.');
