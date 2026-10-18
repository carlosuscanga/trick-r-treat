// Revisa que el tablero de verdad (docs/tareas/README.md) coincida con el
// frontmatter de las tareas. Si falla en el CI: corre `npm run tablero` y
// sube el README que genera.
import { expect, it } from 'vitest';
import readme from '../docs/tareas/README.md?raw';
import { generarTablero } from './tablero';

const textos = import.meta.glob<string>('../docs/tareas/T-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const archivos = Object.entries(textos).map(([ruta, texto]) => ({
  nombre: ruta.slice(ruta.lastIndexOf('/') + 1),
  texto,
}));
const planes = Object.keys(import.meta.glob('../docs/planes/*.md')).map((ruta) =>
  ruta.replace(/^\.\.\//, ''),
);

it('el tablero está al día con el frontmatter de las tareas (si falla: npm run tablero)', () => {
  expect(archivos.length).toBeGreaterThan(40);
  expect(generarTablero(readme, archivos, planes), 'Corre `npm run tablero`').toBe(readme);
});
