import { describe, expect, it } from 'vitest';
import {
  abreviarDependencias,
  ErrorTablero,
  generarTablero,
  leerFrontmatter,
  leerTareas,
  reemplazarTablas,
  tablaDeHito,
  type ArchivoTarea,
} from './tablero';

function tarea(nombre: string, campos: Record<string, string> = {}): ArchivoTarea {
  const id = nombre.slice(0, 5);
  const datos: Record<string, string> = {
    id,
    titulo: `Título de ${id}`,
    tipo: 'codigo',
    hito: 'H1',
    estado: 'pendiente',
    prioridad: 'alta',
    depende: '[]',
    plan: 'null',
    ...campos,
  };
  const frontmatter = Object.entries(datos).map(([clave, valor]) => `${clave}: ${valor}`);
  return { nombre, texto: ['---', ...frontmatter, '---', '', '## Qué', '', 'Algo.'].join('\n') };
}

function problemasDe(accion: () => unknown): string[] {
  try {
    accion();
  } catch (error) {
    if (error instanceof ErrorTablero) return error.problemas;
    throw error;
  }
  throw new Error('se esperaba un ErrorTablero');
}

const README = [
  '# Tareas',
  '',
  'Texto escrito a mano.',
  '',
  ...['H1', 'H2', 'H3', 'H4', 'H5'].flatMap((hito) => [
    `### ${hito}`,
    '',
    `<!-- tablero:${hito} -->`,
    'tabla vieja',
    `<!-- /tablero:${hito} -->`,
    '',
    `Carriles de ${hito}, a mano.`,
    '',
  ]),
].join('\n');

describe('leerFrontmatter', () => {
  it('lee textos, null, listas y comillas', () => {
    const datos = leerFrontmatter(
      [
        '---',
        'id: T-007',
        'titulo: "`EscenaBase` y algo más"',
        'otro: \'con comillas simples\'',
        'depende: [T-001, T-002]',
        'vacia: []',
        'plan: null',
        'rama:',
        '---',
        'cuerpo: no se lee',
      ].join('\n'),
    );
    expect(datos).toEqual({
      id: 'T-007',
      titulo: '`EscenaBase` y algo más',
      otro: 'con comillas simples',
      depende: ['T-001', 'T-002'],
      vacia: [],
      plan: null,
      rama: null,
    });
  });

  it('acepta finales de línea de Windows', () => {
    expect(leerFrontmatter('---\r\nid: T-001\r\n---\r\n')).toEqual({ id: 'T-001' });
  });

  it('falla sin frontmatter, sin cierre o con una línea rara', () => {
    expect(() => leerFrontmatter('# Hola')).toThrow('no empieza');
    expect(() => leerFrontmatter('---\nid: T-001\n')).toThrow('no se cierra');
    expect(() => leerFrontmatter('---\nesto no es clave\n---')).toThrow('no se entiende');
  });
});

describe('leerTareas', () => {
  it('lee tareas válidas', () => {
    const [primera] = leerTareas(
      [tarea('T-001-algo.md', { depende: '[T-002]', plan: 'docs/planes/T-001-algo.md' }), tarea('T-002-otra.md')],
      ['docs/planes/T-001-algo.md'],
    );
    expect(primera).toEqual({
      nombre: 'T-001-algo.md',
      id: 'T-001',
      titulo: 'Título de T-001',
      tipo: 'codigo',
      hito: 'H1',
      estado: 'pendiente',
      prioridad: 'alta',
      depende: ['T-002'],
      plan: 'docs/planes/T-001-algo.md',
    });
  });

  it('acepta una tarea descartada', () => {
    const [descartada] = leerTareas([tarea('T-001-algo.md', { estado: 'descartada' })], []);
    expect(descartada.estado).toBe('descartada');
  });

  it('rechaza estado, tipo, hito y prioridad desconocidos', () => {
    const problemas = problemasDe(() =>
      leerTareas(
        [tarea('T-001-algo.md', { estado: 'lista', tipo: 'otro', hito: 'H9', prioridad: 'urgente' })],
        [],
      ),
    );
    expect(problemas).toEqual([
      expect.stringContaining('`tipo: otro` no es válido'),
      expect.stringContaining('`hito: H9` no es válido'),
      expect.stringContaining('`estado: lista` no es válido'),
      expect.stringContaining('`prioridad: urgente` no es válido'),
    ]);
  });

  it('rechaza dependencias que no existen y depender de sí misma', () => {
    const problemas = problemasDe(() =>
      leerTareas([tarea('T-001-algo.md', { depende: '[T-001, T-099]' })], []),
    );
    expect(problemas).toEqual([
      'T-001-algo.md: depende de sí misma',
      'T-001-algo.md: depende de T-099, que no existe',
    ]);
  });

  it('rechaza un id que no coincide con el archivo, repetido o un nombre de archivo raro', () => {
    expect(problemasDe(() => leerTareas([tarea('T-001-algo.md', { id: 'T-002' })], []))).toEqual([
      'T-001-algo.md: `id: T-002` no coincide con el nombre del archivo',
    ]);
    expect(
      problemasDe(() => leerTareas([tarea('T-001-algo.md'), tarea('T-001-otra.md')], [])),
    ).toEqual(['T-001-otra.md: el id T-001 está repetido']);
    expect(problemasDe(() => leerTareas([tarea('T-001 algo.md', { id: 'T-001' })], []))).toEqual([
      'T-001 algo.md: el nombre debe ser `T-NNN-titulo-corto.md`',
    ]);
  });

  it('rechaza un plan que no existe o que no es una ruta de docs/planes', () => {
    const problemas = problemasDe(() =>
      leerTareas(
        [
          tarea('T-001-algo.md', { plan: 'docs/planes/T-001-no-esta.md' }),
          tarea('T-002-otra.md', { plan: '../planes/T-002-otra.md' }),
        ],
        ['docs/planes/T-002-otra.md'],
      ),
    );
    expect(problemas).toEqual([
      'T-001-algo.md: `plan: docs/planes/T-001-no-esta.md` no existe',
      'T-002-otra.md: `plan: ../planes/T-002-otra.md` debe ser una ruta `docs/planes/….md`',
    ]);
  });

  it('rechaza campos que faltan, un título con | y depende que no es lista', () => {
    const sinTitulo = tarea('T-001-algo.md');
    sinTitulo.texto = sinTitulo.texto.replace(/^titulo:.*\n/m, '').replace(/^plan:.*\n/m, '');
    expect(problemasDe(() => leerTareas([sinTitulo], []))).toEqual([
      'T-001-algo.md: falta `titulo`',
      'T-001-algo.md: falta `plan` (usa `null` si no tiene)',
    ]);
    expect(
      problemasDe(() => leerTareas([tarea('T-001-algo.md', { titulo: 'a | b', depende: 'T-002' })], [])),
    ).toEqual([
      'T-001-algo.md: `titulo` no puede llevar `|`: rompe la tabla',
      'T-001-algo.md: `depende` debe ser una lista, por ejemplo `[]` o `[T-001]`',
    ]);
  });

  it('junta en un solo error los problemas de todos los archivos', () => {
    const error = (() => {
      try {
        leerTareas([tarea('T-001-algo.md', { estado: 'x' }), tarea('T-002-otra.md', { hito: 'y' })], []);
      } catch (e) {
        return e as Error;
      }
    })();
    expect(error?.message).toContain('T-001-algo.md: `estado: x`');
    expect(error?.message).toContain('T-002-otra.md: `hito: y`');
  });
});

describe('abreviarDependencias', () => {
  it('pone una raya si no hay dependencias', () => {
    expect(abreviarDependencias([])).toBe('—');
  });

  it('abrevia 3 o más IDs seguidos y deja los demás como están', () => {
    expect(abreviarDependencias(['T-013', 'T-014', 'T-015', 'T-016'])).toBe('T-013 … T-016');
    expect(abreviarDependencias(['T-001', 'T-002'])).toBe('T-001, T-002');
    expect(abreviarDependencias(['T-039', 'T-012'])).toBe('T-039, T-012');
    expect(abreviarDependencias(['T-003', 'T-034', 'T-035', 'T-036', 'T-045'])).toBe(
      'T-003, T-034 … T-036, T-045',
    );
  });
});

describe('tablaDeHito', () => {
  it('ordena por ID, enlaza la tarea y su plan, y solo incluye el hito pedido', () => {
    const tareas = leerTareas(
      [
        tarea('T-010-b.md', { plan: 'docs/planes/T-010-b.md', depende: '[T-002]' }),
        tarea('T-002-a.md', { plan: 'requerido', estado: 'hecha' }),
        tarea('T-003-otro-hito.md', { hito: 'H2' }),
      ],
      ['docs/planes/T-010-b.md'],
    );
    expect(tablaDeHito(tareas, 'H1')).toBe(
      [
        '| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |',
        '|----|-------|------|--------|------|---------|------|',
        '| [T-002](T-002-a.md) | Título de T-002 | codigo | hecha | alta | — | requerido |',
        '| [T-010](T-010-b.md) | Título de T-010 | codigo | pendiente | alta | T-002 | [plan](../planes/T-010-b.md) |',
      ].join('\n'),
    );
  });
});

describe('reemplazarTablas', () => {
  const tareas = leerTareas([tarea('T-001-algo.md'), tarea('T-002-otra.md', { hito: 'H3' })], []);

  it('cambia solo lo que está entre las marcas', () => {
    const nuevo = reemplazarTablas(README, tareas);
    expect(nuevo).not.toContain('tabla vieja');
    expect(nuevo).toContain('Texto escrito a mano.');
    expect(nuevo).toContain('Carriles de H5, a mano.');
    expect(nuevo).toContain(`<!-- tablero:H1 -->\n\n${tablaDeHito(tareas, 'H1')}\n\n<!-- /tablero:H1 -->`);
    expect(nuevo).toContain(`<!-- tablero:H3 -->\n\n${tablaDeHito(tareas, 'H3')}\n\n<!-- /tablero:H3 -->`);
  });

  it('da lo mismo si se corre dos veces', () => {
    const una = reemplazarTablas(README, tareas);
    expect(reemplazarTablas(una, tareas)).toBe(una);
  });

  it('falla si falta una marca, están al revés o se repiten', () => {
    expect(() => reemplazarTablas(README.replace('<!-- /tablero:H4 -->', ''), tareas)).toThrow(ErrorTablero);
    const alReves = README.replace('<!-- tablero:H2 -->', '@@').replace('<!-- /tablero:H2 -->', '<!-- tablero:H2 -->').replace('@@', '<!-- /tablero:H2 -->');
    expect(() => reemplazarTablas(alReves, tareas)).toThrow('en ese orden');
    expect(() => reemplazarTablas(`${README}\n<!-- tablero:H1 -->`, tareas)).toThrow('más de una vez');
  });
});

describe('casos raros del frontmatter', () => {
  it('rechaza claves repetidas y comentarios con #', () => {
    expect(() => leerFrontmatter('---\nid: T-001\nid: T-002\n---')).toThrow('aparece dos veces');
    expect(() => leerFrontmatter('---\nplan: null  # o requerido\n---')).toThrow('no admite comentarios');
  });

  it('acepta # dentro de una palabra y quita comillas en las listas', () => {
    expect(leerFrontmatter('---\ntitulo: Paso C#\ndepende: ["T-001", \'T-002\']\n---')).toEqual({
      titulo: 'Paso C#',
      depende: ['T-001', 'T-002'],
    });
  });

  it('rechaza dependencias repetidas', () => {
    expect(
      problemasDe(() =>
        leerTareas([tarea('T-001-algo.md', { depende: '[T-002, T-002]' }), tarea('T-002-otra.md')], []),
      ),
    ).toEqual(['T-001-algo.md: `depende` tiene IDs repetidos']);
  });
});

describe('generarTablero', () => {
  it('no genera nada si hay datos inválidos', () => {
    expect(() => generarTablero(README, [tarea('T-001-algo.md', { estado: 'lista' })], [])).toThrow(ErrorTablero);
  });
});
