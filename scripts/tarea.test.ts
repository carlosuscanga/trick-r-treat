import { describe, expect, it } from 'vitest';
import { leerTareas, type Tarea } from './tablero';
import { marcarEnProgreso, marcarHecha, nombreDeRama, revisarLista, rutaDeWorktree } from './tarea';

const CRITERIO_PRUEBAS = '- [ ] Pruebas en las tres capas (unitarias, e2e y manual).';

// Texto de una tarea completa; `cuerpo` reemplaza todo lo que va tras el frontmatter.
function texto(campos: Record<string, string> = {}, cuerpo?: string): string {
  const datos: Record<string, string> = {
    id: 'T-050',
    titulo: 'Tarea de prueba',
    tipo: 'codigo',
    hito: 'H2',
    estado: 'pendiente',
    prioridad: 'alta',
    depende: '[]',
    plan: 'null',
    ...campos,
  };
  const frontmatter = Object.entries(datos).map(([clave, valor]) => `${clave}: ${valor}`);
  const completo = [
    '## Qué',
    '',
    'Algo que cambia.',
    '',
    '## Criterios de aceptación',
    '',
    '- [ ] Se ve algo.',
    CRITERIO_PRUEBAS,
    '',
  ].join('\n');
  return ['---', ...frontmatter, '---', '', cuerpo ?? completo].join('\n');
}

function tareaDe(t: string): Tarea {
  return leerTareas([{ nombre: 'T-050-prueba.md', texto: t }], [])[0];
}

// Revisa la tarea T-050 con T-001 como dependencia en el estado dado.
function revisar(t: string, estadoDependencia = 'hecha'): string[] {
  const base = { nombre: 'T-001-base.md', texto: texto({ id: 'T-001', estado: estadoDependencia }) };
  const todas = leerTareas([base, { nombre: 'T-050-prueba.md', texto: t }], []);
  return revisarLista(todas[1], t, todas);
}

describe('nombreDeRama y rutaDeWorktree', () => {
  it('quita la extensión .md', () => {
    expect(nombreDeRama('T-048-skill-tarea.md')).toBe('T-048-skill-tarea');
  });

  it('arma la ruta del worktree', () => {
    expect(rutaDeWorktree('T-048-skill-tarea')).toBe('.claude/worktrees/T-048-skill-tarea');
  });
});

describe('revisarLista', () => {
  it('una tarea completa no tiene faltantes', () => {
    expect(revisar(texto({ depende: '[T-001]' }))).toEqual([]);
  });

  it('señala la dependencia que no está hecha', () => {
    expect(revisar(texto({ depende: '[T-001]' }), 'pendiente')).toEqual(['T-001 no está hecha (pendiente)']);
  });

  it('pide la casilla de las tres capas', () => {
    const cuerpo = '## Qué\n\nAlgo.\n\n## Criterios de aceptación\n\n- [ ] Se ve algo.\n';
    const faltantes = revisar(texto({}, cuerpo));
    expect(faltantes).toHaveLength(1);
    expect(faltantes[0]).toMatch(/tres capas/);
  });

  it('pide al menos una casilla en los criterios', () => {
    const cuerpo = '## Qué\n\nAlgo.\n\n## Criterios de aceptación\n\nSin casillas, tres capas.\n';
    expect(revisar(texto({}, cuerpo)).length).toBeGreaterThan(0);
  });

  it('pide que el Qué no esté vacío', () => {
    const cuerpo = `## Qué\n\n## Criterios de aceptación\n\n${CRITERIO_PRUEBAS}\n`;
    const faltantes = revisar(texto({}, cuerpo));
    expect(faltantes).toHaveLength(1);
    expect(faltantes[0]).toMatch(/Qué/);
  });

  it('una tarea bloqueada manda a revisar la bitácora', () => {
    const faltantes = revisar(texto({ estado: 'bloqueada' }));
    expect(faltantes[0]).toMatch(/bloqueada/);
    expect(faltantes[0]).toMatch(/bitácora/);
  });

  it('una tarea en progreso ya arrancó', () => {
    expect(revisar(texto({ estado: 'en-progreso' }))[0]).toMatch(/ya arrancó/);
  });

  it('una tarea hecha ya está hecha', () => {
    expect(revisar(texto({ estado: 'hecha' }))[0]).toMatch(/ya está hecha/);
  });

  it('una tarea descartada no se toma', () => {
    expect(revisar(texto({ estado: 'descartada' }))).toEqual(['la tarea está descartada']);
  });
});

describe('marcarEnProgreso', () => {
  it('cambia estado, rama y worktree, y deja el resto igual', () => {
    const antes = texto({ rama: 'null', worktree: 'null' });
    const despues = marcarEnProgreso(antes, 'T-050-prueba');
    const lineasAntes = antes.split('\n');
    const lineasDespues = despues.split('\n');
    expect(lineasDespues).toHaveLength(lineasAntes.length);
    expect(lineasDespues.filter((linea, i) => linea !== lineasAntes[i])).toEqual([
      'estado: en-progreso',
      'rama: T-050-prueba',
      'worktree: .claude/worktrees/T-050-prueba',
    ]);
  });

  it('inserta rama y worktree después de plan si faltan', () => {
    const despues = marcarEnProgreso(texto(), 'T-050-prueba');
    expect(despues).toContain('plan: null\nrama: T-050-prueba\nworktree: .claude/worktrees/T-050-prueba\n---');
    expect(tareaDe(despues).estado).toBe('en-progreso');
  });

  it('lanza si la tarea no está pendiente', () => {
    expect(() => marcarEnProgreso(texto({ estado: 'hecha' }), 'T-050-prueba')).toThrow(/pendiente/);
    expect(() => marcarEnProgreso(texto({ estado: 'en-progreso' }), 'T-050-prueba')).toThrow(/pendiente/);
  });
});

describe('marcarHecha', () => {
  it('pasa a hecha con rama y worktree en null', () => {
    const antes = texto({
      estado: 'en-progreso',
      rama: 'T-050-prueba',
      worktree: '.claude/worktrees/T-050-prueba',
    });
    const despues = marcarHecha(antes);
    const lineasAntes = antes.split('\n');
    expect(despues.split('\n').filter((linea, i) => linea !== lineasAntes[i])).toEqual([
      'estado: hecha',
      'rama: null',
      'worktree: null',
    ]);
  });

  it('inserta rama y worktree en null si faltan', () => {
    const despues = marcarHecha(texto({ estado: 'en-progreso' }));
    expect(despues).toContain('plan: null\nrama: null\nworktree: null\n---');
  });

  it('lanza si la tarea no está en progreso', () => {
    expect(() => marcarHecha(texto({ estado: 'pendiente' }))).toThrow(/en-progreso/);
  });
});
