// Presupuesto de bundle (T-036): lee dist/ después de `npm run build` y falla
// si el JS inicial, un archivo que no es JS o todo dist/ se pasan de su límite.
// Corre con `npm run test:presupuestos`, no con `npm test`.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  BASE,
  MAX_ARCHIVO_MB,
  MAX_DIST_MB,
  MAX_JS_INICIAL_KIB,
  excedidos,
  jsInicial,
  type Archivo,
} from './bundle';

const KIB = 1024;
const MB = 1_000_000;

describe('jsInicial', () => {
  const base = '/base/';

  it('encuentra el script de tipo module', () => {
    const html = '<script type="module" crossorigin src="/base/assets/index-a.js"></script>';
    expect(jsInicial(html, base)).toEqual(['assets/index-a.js']);
  });

  it('incluye los modulepreload', () => {
    const html = [
      '<script type="module" src="/base/assets/index-a.js"></script>',
      '<link rel="modulepreload" href="/base/assets/chunk-b.js">',
    ].join('\n');
    expect(jsInicial(html, base)).toEqual(['assets/index-a.js', 'assets/chunk-b.js']);
  });

  it('ignora scripts sin type module, hojas de estilo y URLs fuera de la base', () => {
    const html = [
      '<script src="/base/assets/clasico.js"></script>',
      '<link rel="stylesheet" href="/base/assets/estilo.css">',
      '<script type="module" src="https://cdn.ejemplo.com/otro.js"></script>',
      '<script type="module" src="/otra-base/x.js"></script>',
    ].join('\n');
    expect(jsInicial(html, base)).toEqual([]);
  });

  it('acepta mayúsculas, valores sin comillas y rel con varios tokens', () => {
    const html = [
      '<SCRIPT TYPE="MODULE" SRC="/base/assets/a.js"></SCRIPT>',
      '<script type=module src=/base/assets/b.js></script>',
      '<link rel="modulepreload prefetch" href="/base/assets/c.js">',
    ].join('\n');
    expect(jsInicial(html, base)).toEqual(['assets/a.js', 'assets/b.js', 'assets/c.js']);
  });

  it('no cuenta dos veces el mismo archivo y quita ?query y #hash', () => {
    const html = [
      '<script type="module" src="/base/assets/a.js?v=1"></script>',
      '<link rel="modulepreload" href="/base/assets/a.js#x">',
    ].join('\n');
    expect(jsInicial(html, base)).toEqual(['assets/a.js']);
  });

  it('devuelve [] si no hay nada', () => {
    expect(jsInicial('<html><body></body></html>', base)).toEqual([]);
  });
});

describe('excedidos', () => {
  const archivos: Archivo[] = [
    { ruta: 'a.png', bytes: 10 },
    { ruta: 'b.png', bytes: 100 },
  ];

  it('devuelve [] si todos caben', () => {
    expect(excedidos(archivos, 1000)).toEqual([]);
  });

  it('justo en el límite cabe', () => {
    expect(excedidos(archivos, 100)).toEqual([]);
  });

  it('un byte más se pasa', () => {
    expect(excedidos(archivos, 99)).toEqual([{ ruta: 'b.png', bytes: 100 }]);
  });
});

// --- Gate contra dist/ ---

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const INDICE = join(DIST, 'index.html');
const SIN_BUILD = 'No hay dist/index.html: corre `npm run build` antes.';

/** Todos los archivos de dist/, con ruta relativa a dist/ y "/" como separador. */
function listar(dir: string): Archivo[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const completa = join(dir, e.name);
    if (e.isDirectory()) return listar(completa);
    return [{ ruta: relative(DIST, completa).split('\\').join('/'), bytes: statSync(completa).size }];
  });
}

describe('presupuesto de bundle en dist/', () => {
  it('dist/index.html existe', () => {
    expect(existsSync(INDICE), SIN_BUILD).toBe(true);
  });

  it(`el JS inicial pesa ≤ ${MAX_JS_INICIAL_KIB} KiB en gzip`, () => {
    expect(existsSync(INDICE), SIN_BUILD).toBe(true);
    const rutas = jsInicial(readFileSync(INDICE, 'utf8'), BASE);
    expect(rutas.length, `dist/index.html no referencia ningún JS bajo ${BASE}.`).toBeGreaterThan(0);

    let total = 0;
    for (const ruta of rutas) {
      const archivo = join(DIST, ruta);
      expect(existsSync(archivo), `index.html referencia ${ruta}, pero no existe en dist/.`).toBe(true);
      const buf = readFileSync(archivo);
      expect(buf.length, `${ruta} está vacío.`).toBeGreaterThan(0);
      // Nivel 6: lo que sirve GitHub Pages (decisión 5 del plan).
      total += gzipSync(buf, { level: 6 }).length;
    }

    const kib = total / KIB;
    console.log(`JS inicial (gzip): ${kib.toFixed(1)} KiB de ${MAX_JS_INICIAL_KIB} KiB`);
    expect(
      kib,
      `El JS inicial (gzip) pesa ${kib.toFixed(1)} KiB y el límite es ${MAX_JS_INICIAL_KIB} KiB.`,
    ).toBeLessThanOrEqual(MAX_JS_INICIAL_KIB);
  });

  it(`ningún archivo fuera del JS pasa de ${MAX_ARCHIVO_MB} MB`, () => {
    expect(existsSync(INDICE), SIN_BUILD).toBe(true);
    const otros = listar(DIST).filter((a) => !a.ruta.endsWith('.js'));
    const mayor = otros.reduce<Archivo | undefined>((m, a) => (!m || a.bytes > m.bytes ? a : m), undefined);
    if (mayor) {
      console.log(
        `Archivo más grande fuera del JS: ${(mayor.bytes / MB).toFixed(2)} MB de ${MAX_ARCHIVO_MB} MB (${mayor.ruta})`,
      );
    }
    const pasados = excedidos(otros, MAX_ARCHIVO_MB * MB);
    expect(
      pasados.map((a) => `${a.ruta} (${(a.bytes / MB).toFixed(2)} MB)`),
      `Archivos que pasan de ${MAX_ARCHIVO_MB} MB:`,
    ).toEqual([]);
  });

  it(`todo dist/ pesa ≤ ${MAX_DIST_MB} MB`, () => {
    expect(existsSync(INDICE), SIN_BUILD).toBe(true);
    const mb = listar(DIST).reduce((suma, a) => suma + a.bytes, 0) / MB;
    console.log(`Total de dist/: ${mb.toFixed(2)} MB de ${MAX_DIST_MB} MB`);
    expect(mb, `dist/ pesa ${mb.toFixed(2)} MB y el límite es ${MAX_DIST_MB} MB.`).toBeLessThanOrEqual(
      MAX_DIST_MB,
    );
  });
});
