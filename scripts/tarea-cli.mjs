// `npm run tarea -- <revisar|tomar|cerrar> T-NNN`: lleva una tarea del tablero por
// su ciclo (revisar la Definition of Ready, tomarla, cerrarla). La lógica pura está
// en tarea.ts; aquí solo hay lectura de archivos y llamadas a git, gh y npm.
// Nunca hace push: imprime el comando para que la sesión lo corra a la vista.
// Plan: docs/planes/T-048-skill-tarea.md
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Misma guarda de versión que tablero-cli.mjs (Node corre `.ts` desde la 22.18).
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 18)) {
  console.error(
    `npm run tarea necesita Node 22.18 o más nuevo, y esta terminal usa ${process.version}. ` +
      'Corre `nvm use` (el proyecto usa Node 24, ver .nvmrc) y vuelve a intentar.',
  );
  process.exit(1);
}
const { leerTareas, generarTablero } = await import('./tablero.ts');
const { nombreDeRama, rutaDeWorktree, revisarLista, marcarEnProgreso, marcarHecha } = await import('./tarea.ts');

const ATRIBUCION =
  'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n' +
  'Claude-Session: https://claude.ai/code/session_01QTta9DuwVt6pZ2xV7Ptmqg';
const COMANDO_PUSH =
  "GIT_SSH_COMMAND='ssh -i ~/.ssh/trick-r-treat-directo -o IdentitiesOnly=yes' " +
  'git push git@github.com:carlosuscanga/trick-r-treat.git main && git fetch origin';

class Fallo extends Error {}

const raiz = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');

/** Corre un comando sin shell; si falla, lanza `Fallo` con el paso y la salida de error. */
function correr(paso, comando, args, cwd = raiz) {
  try {
    return execFileSync(comando, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const salida = `${error.stderr ?? ''}${error.stdout ?? ''}`.trim() || error.message;
    throw new Fallo(`Falló el paso "${paso}" (${comando} ${args.join(' ')}):\n${salida}`);
  }
}

/** `tomar` y `cerrar` solo corren en el checkout principal, en `main`, limpio y al día. */
function exigirCheckoutPrincipal() {
  const toplevel = correr('ubicar el repo', 'git', ['rev-parse', '--show-toplevel']);
  const gitDir = correr('ubicar el .git', 'git', ['rev-parse', '--git-dir']);
  if (toplevel !== raiz || /(^|\/)worktrees\//.test(gitDir)) {
    throw new Fallo('Esto solo corre en el checkout principal, no en un worktree. Sal del worktree y vuelve a intentar.');
  }
  const rama = correr('leer la rama actual', 'git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (rama !== 'main') throw new Fallo(`Hay que estar en la rama main, y esta es ${rama}. Cambia con \`git switch main\`.`);
  if (correr('revisar cambios', 'git', ['status', '--porcelain']) !== '') {
    throw new Fallo('El checkout tiene cambios sin commit. Haz commit o guárdalos y vuelve a intentar.');
  }
  correr('actualizar main', 'git', ['pull', '--ff-only']);
}

function leer() {
  const carpeta = new URL('../docs/tareas/', import.meta.url);
  const planes = new URL('../docs/planes/', import.meta.url);
  const archivos = readdirSync(carpeta)
    .filter((nombre) => /^T-.*\.md$/.test(nombre))
    .map((nombre) => ({ nombre, texto: readFileSync(new URL(nombre, carpeta), 'utf8') }));
  const rutasDePlanes = readdirSync(planes)
    .filter((nombre) => nombre.endsWith('.md'))
    .map((nombre) => `docs/planes/${nombre}`);
  const readme = new URL('README.md', carpeta);
  return { carpeta, readme, archivos, rutasDePlanes, tareas: leerTareas(archivos, rutasDePlanes) };
}

function textoDe(datos, tarea) {
  return datos.archivos.find((a) => a.nombre === tarea.nombre).texto;
}

/** El tablero que resulta de reemplazar el texto de una tarea, todo en memoria. */
function tableroCon(datos, tarea, textoNuevo) {
  const archivos = datos.archivos.map((a) => (a.nombre === tarea.nombre ? { ...a, texto: textoNuevo } : a));
  return generarTablero(readFileSync(datos.readme, 'utf8'), archivos, datos.rutasDePlanes);
}

function tomar(datos, tarea) {
  exigirCheckoutPrincipal();
  const faltantes = revisarLista(tarea, textoDe(datos, tarea), datos.tareas);
  if (faltantes.length > 0) {
    throw new Fallo(`${tarea.id} no está lista:\n${faltantes.map((f) => `- ${f}`).join('\n')}`);
  }
  const rama = nombreDeRama(tarea.nombre);
  const ruta = rutaDeWorktree(rama);
  // Todo en memoria primero: un estado inválido falla antes de tocar nada.
  const textoNuevo = marcarEnProgreso(textoDe(datos, tarea), rama);
  const tablero = tableroCon(datos, tarea, textoNuevo);

  writeFileSync(new URL(tarea.nombre, datos.carpeta), textoNuevo);
  writeFileSync(datos.readme, tablero);
  correr('agregar los archivos', 'git', ['add', `docs/tareas/${tarea.nombre}`, 'docs/tareas/README.md']);
  correr('hacer el commit', 'git', ['commit', '-m', `${tarea.id}: pasa la tarea a en-progreso\n\n${ATRIBUCION}`]);
  correr('crear el worktree', 'git', ['worktree', 'add', ruta, '-b', rama, '--no-track', 'HEAD']);
  const cwd = `${raiz}/${ruta}`;
  console.log('Worktree creado. Instalando dependencias y construyendo...');
  correr('npm install en el worktree', 'npm', ['install'], cwd);
  correr('npm run build en el worktree', 'npm', ['run', 'build'], cwd);

  console.log(`\n${tarea.id} pasó a en-progreso (rama ${rama}).\n`);
  console.log(`1. Sube el commit a main, a la vista:\n   ${COMANDO_PUSH}\n`);
  console.log(`2. Entra al worktree con EnterWorktree, ruta absoluta:\n   ${cwd}\n`);
  if (tarea.plan === 'requerido') {
    console.log('3. Esta tarea pide plan: el primer paso en la rama es escribirlo, y no se programa hasta que esté aprobado.');
  }
}

function cerrar(datos, tarea) {
  exigirCheckoutPrincipal();
  const rama = nombreDeRama(tarea.nombre);
  const ruta = rutaDeWorktree(rama);

  const prs = JSON.parse(
    correr('buscar el PR mergeado', 'gh', ['pr', 'list', '--head', rama, '--state', 'merged', '--json', 'number']),
  );
  if (prs.length === 0) throw new Fallo(`No hay ningún PR mergeado de la rama ${rama}. Mergéalo antes de cerrar.`);
  const faltan = Number(correr('contar commits sin integrar', 'git', ['rev-list', '--count', `origin/main..${rama}`]));
  if (faltan !== 0) throw new Fallo(`La rama ${rama} tiene ${faltan} commit(s) que no están en origin/main. No se cierra.`);

  // Todo en memoria primero: un estado inválido falla antes de tocar nada.
  const textoNuevo = marcarHecha(textoDe(datos, tarea));
  const tablero = tableroCon(datos, tarea, textoNuevo);

  try {
    correr('quitar el worktree', 'git', ['worktree', 'remove', ruta]);
  } catch (error) {
    throw new Fallo(`No se pudo quitar el worktree ${ruta} (¿tiene cambios sin guardar?). Revisa y vuelve a intentar.\n${error.message}`);
  }
  writeFileSync(new URL(tarea.nombre, datos.carpeta), textoNuevo);
  writeFileSync(datos.readme, tablero);

  console.log(`${tarea.id} quedó hecha (sin commit todavía). Siguen:\n`);
  console.log('1. Escribe el "Estado actual" en docs/tareas/README.md y anota lo hecho arriba de docs/tareas/historial.md.');
  console.log(`2. Un solo commit: ${tarea.id}: cierra la tarea`);
  console.log(`3. Sube a main, a la vista:\n   ${COMANDO_PUSH}`);
  console.log(`4. El product owner borra la rama: git branch -d ${rama}`);
}

try {
  const [subcomando, id] = process.argv.slice(2);
  const comandos = { revisar: null, tomar, cerrar };
  if (!subcomando || !Object.hasOwn(comandos, subcomando)) {
    throw new Fallo(`El subcomando "${subcomando ?? ''}" no existe. Usa: npm run tarea -- <revisar|tomar|cerrar> T-NNN`);
  }
  if (!id || !/^T-\d{3}$/.test(id)) {
    throw new Fallo(`El ID "${id ?? ''}" está mal escrito: debe verse como T-048 (T mayúscula y tres dígitos).`);
  }
  const datos = leer();
  const tarea = datos.tareas.find((t) => t.id === id);
  if (!tarea) throw new Fallo(`La tarea ${id} no existe en docs/tareas/.`);

  if (subcomando === 'revisar') {
    const faltantes = revisarLista(tarea, textoDe(datos, tarea), datos.tareas);
    if (faltantes.length === 0) {
      console.log(`${id} está lista`);
    } else {
      console.log(faltantes.join('\n'));
      process.exitCode = 1;
    }
  } else {
    comandos[subcomando](datos, tarea);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
