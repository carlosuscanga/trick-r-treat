// Lógica pura del skill `tarea` (tomar y cerrar una tarea del tablero): nombres de
// rama, revisión mecánica de la Definition of Ready y cambios al frontmatter.
// Sin leer archivos ni correr git: lo hace el CLI (scripts/tarea-cli.mjs).
// Plan: docs/planes/T-048-skill-tarea.md
// `import type` se borra al correr con Node, así que no hace falta la extensión `.ts`.
import type { Tarea } from './tablero';

/** `T-048-skill-tarea.md` → `T-048-skill-tarea` (también es el nombre de la rama). */
export function nombreDeRama(nombreArchivo: string): string {
  return nombreArchivo.replace(/\.md$/, '');
}

export function rutaDeWorktree(rama: string): string {
  return `.claude/worktrees/${rama}`;
}

/** El contenido de una sección `## Título`, hasta la siguiente `## `. `null` si no existe. */
function seccion(texto: string, titulo: string): string | null {
  const lineas = texto.split(/\r?\n/);
  const inicio = lineas.findIndex((linea) => linea.trim() === `## ${titulo}`);
  if (inicio === -1) return null;
  const resto = lineas.slice(inicio + 1);
  const fin = resto.findIndex((linea) => linea.startsWith('## '));
  return (fin === -1 ? resto : resto.slice(0, fin)).join('\n');
}

/**
 * Lo mecánico de la Definition of Ready. Devuelve lo que falta; `[]` es que la
 * tarea está lista. Lo que pide criterio (decisiones abiertas, plan aprobado) lo
 * revisa Claude con el product owner.
 */
export function revisarLista(tarea: Tarea, texto: string, todas: Tarea[]): string[] {
  if (tarea.estado === 'bloqueada') return ['la tarea está bloqueada: revisa su bitácora'];
  if (tarea.estado === 'en-progreso') return ['la tarea ya arrancó (en-progreso): usa "retoma"'];
  if (tarea.estado === 'hecha') return ['la tarea ya está hecha'];

  const faltantes: string[] = [];
  for (const id of tarea.depende) {
    const dependencia = todas.find((otra) => otra.id === id);
    if (!dependencia || dependencia.estado !== 'hecha') {
      faltantes.push(`${id} no está hecha (${dependencia?.estado ?? 'no existe'})`);
    }
  }

  if ((seccion(texto, 'Qué') ?? '').trim() === '') faltantes.push('la sección `## Qué` está vacía');

  const criterios = seccion(texto, 'Criterios de aceptación') ?? '';
  const casillas = criterios.split('\n').filter((linea) => /^\s*- \[[ x]\]/.test(linea));
  if (casillas.length === 0) {
    faltantes.push('`## Criterios de aceptación` no tiene casillas (`- [ ]`)');
  } else if (!casillas.some((casilla) => /tres capas/i.test(casilla))) {
    faltantes.push('ningún criterio de aceptación menciona las tres capas de pruebas');
  }
  return faltantes;
}

/**
 * Cambia `estado`, `rama` y `worktree` del frontmatter y nada más. Si `rama` o
 * `worktree` no existen, los inserta después de `plan:`.
 */
function cambiarFrontmatter(texto: string, valores: Record<string, string>): string {
  const lineas = texto.split('\n');
  const fin = lineas.indexOf('---', 1);
  if (lineas[0] !== '---' || fin === -1) throw new Error('la tarea no tiene un frontmatter válido');

  const faltantes: string[] = [];
  for (const [clave, valor] of Object.entries(valores)) {
    const i = lineas.findIndex((linea, n) => n > 0 && n < fin && linea.startsWith(`${clave}:`));
    if (i === -1) faltantes.push(clave);
    else lineas[i] = `${clave}: ${valor}` + (lineas[i].endsWith('\r') ? '\r' : '');
  }
  if (faltantes.length > 0) {
    const plan = lineas.findIndex((linea, n) => n > 0 && n < fin && linea.startsWith('plan:'));
    if (plan === -1) throw new Error('la tarea no tiene `plan:` en el frontmatter');
    lineas.splice(plan + 1, 0, ...faltantes.map((clave) => `${clave}: ${valores[clave]}`));
  }
  return lineas.join('\n');
}

function estadoDe(texto: string): string {
  return /^estado:\s*(\S+)/m.exec(texto)?.[1] ?? '(sin estado)';
}

/** `pendiente` → `en-progreso`, con su rama y su worktree. */
export function marcarEnProgreso(texto: string, rama: string): string {
  const estado = estadoDe(texto);
  if (estado !== 'pendiente') throw new Error(`la tarea debe estar pendiente, y está ${estado}`);
  return cambiarFrontmatter(texto, {
    estado: 'en-progreso',
    rama,
    worktree: rutaDeWorktree(rama),
  });
}

/** `en-progreso` → `hecha`, con `rama` y `worktree` en `null`. */
export function marcarHecha(texto: string): string {
  const estado = estadoDe(texto);
  if (estado !== 'en-progreso') throw new Error(`la tarea debe estar en-progreso, y está ${estado}`);
  return cambiarFrontmatter(texto, { estado: 'hecha', rama: 'null', worktree: 'null' });
}
