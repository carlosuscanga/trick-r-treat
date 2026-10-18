// `npm run tablero`: regenera las tablas de docs/tareas/README.md desde el
// frontmatter de cada tarea. La lógica y las validaciones están en tablero.ts
// (Node 24 lo corre directo, sin compilar).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { generarTablero } from './tablero.ts';

const tareas = new URL('../docs/tareas/', import.meta.url);
const planes = new URL('../docs/planes/', import.meta.url);
const readme = new URL('README.md', tareas);

const archivos = readdirSync(tareas)
  .filter((nombre) => /^T-\d{3}-.*\.md$/.test(nombre))
  .map((nombre) => ({ nombre, texto: readFileSync(new URL(nombre, tareas), 'utf8') }));
const rutasDePlanes = readdirSync(planes)
  .filter((nombre) => nombre.endsWith('.md'))
  .map((nombre) => `docs/planes/${nombre}`);

try {
  const antes = readFileSync(readme, 'utf8');
  const despues = generarTablero(antes, archivos, rutasDePlanes);
  if (despues === antes) {
    console.log('El tablero ya estaba al día.');
  } else {
    writeFileSync(readme, despues);
    console.log('Tablero actualizado: docs/tareas/README.md');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
