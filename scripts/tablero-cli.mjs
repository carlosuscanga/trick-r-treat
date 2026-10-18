// `npm run tablero`: regenera las tablas de docs/tareas/README.md desde el
// frontmatter de cada tarea. Con `-- --revisar` no escribe nada: solo falla si
// el tablero está desfasado (va antes de un push directo a main). La lógica y
// las validaciones están en tablero.ts, que Node corre directo, sin compilar.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

// Node corre `.ts` sin flags desde la 22.18. Con uno más viejo, el import falla
// con un error críptico, así que se avisa antes de importar.
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 18)) {
  console.error(
    `npm run tablero necesita Node 22.18 o más nuevo, y esta terminal usa ${process.version}. ` +
      'Corre `nvm use` (el proyecto usa Node 24, ver .nvmrc) y vuelve a intentar.',
  );
  process.exit(1);
}
const { generarTablero } = await import('./tablero.ts');

const tareas = new URL('../docs/tareas/', import.meta.url);
const planes = new URL('../docs/planes/', import.meta.url);
const readme = new URL('README.md', tareas);

const archivos = readdirSync(tareas)
  .filter((nombre) => /^T-.*\.md$/.test(nombre)) // igual que el glob `T-*.md` del test; el nombre se valida después
  .map((nombre) => ({ nombre, texto: readFileSync(new URL(nombre, tareas), 'utf8') }));
const rutasDePlanes = readdirSync(planes)
  .filter((nombre) => nombre.endsWith('.md'))
  .map((nombre) => `docs/planes/${nombre}`);

try {
  const antes = readFileSync(readme, 'utf8');
  const despues = generarTablero(antes, archivos, rutasDePlanes);
  if (despues === antes) {
    console.log('El tablero ya estaba al día.');
  } else if (process.argv.includes('--revisar')) {
    console.error('El tablero está desfasado: corre `npm run tablero` y haz commit del README.');
    process.exitCode = 1;
  } else {
    writeFileSync(readme, despues);
    console.log('Tablero actualizado: docs/tareas/README.md');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
