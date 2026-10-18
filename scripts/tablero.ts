// Genera las tablas del tablero (docs/tareas/README.md) desde el frontmatter de
// cada tarea, que es la única fuente de sus datos. Lógica pura, sin leer
// archivos: la usan el CLI (`npm run tablero`, scripts/tablero-cli.mjs) y los tests.
// Plan: docs/tareas/T-047-tablero-generado.md

export const HITOS = ['H1', 'H2', 'H3', 'H4', 'H5'] as const;
export const ESTADOS = ['pendiente', 'en-progreso', 'bloqueada', 'hecha'] as const;
export const TIPOS = ['diseno', 'codigo', 'arte', 'bug', 'investigacion'] as const;
export const PRIORIDADES = ['alta', 'media', 'baja'] as const;

/** Un archivo de tarea: su nombre (`T-001-algo.md`) y su texto completo. */
export interface ArchivoTarea {
  nombre: string;
  texto: string;
}

export interface Tarea {
  nombre: string;
  id: string;
  titulo: string;
  tipo: string;
  hito: string;
  estado: string;
  prioridad: string;
  depende: string[];
  /** `null`, `'requerido'` o una ruta `docs/planes/….md`. */
  plan: string | null;
}

export type Valor = string | string[] | null;

/** Datos inválidos en las tareas. El mensaje lista todos los problemas. */
export class ErrorTablero extends Error {
  readonly problemas: string[];

  constructor(problemas: string[]) {
    super(`El tablero no se puede generar:\n- ${problemas.join('\n- ')}`);
    this.name = 'ErrorTablero';
    this.problemas = problemas;
  }
}

/**
 * Lee el frontmatter (entre las dos primeras líneas `---`). Solo entiende el
 * subconjunto de YAML que usan las tareas: `clave: valor`, listas `[a, b]`,
 * `null` y textos con o sin comillas.
 */
export function leerFrontmatter(texto: string): Record<string, Valor> {
  const lineas = texto.split(/\r?\n/);
  if (lineas[0] !== '---') throw new Error('no empieza con un frontmatter (`---`)');
  const fin = lineas.indexOf('---', 1);
  if (fin === -1) throw new Error('el frontmatter no se cierra con `---`');

  const datos: Record<string, Valor> = {};
  for (const linea of lineas.slice(1, fin)) {
    if (linea.trim() === '') continue;
    const partes = /^([a-z_]+):\s*(.*)$/.exec(linea);
    if (!partes) throw new Error(`línea del frontmatter que no se entiende: "${linea}"`);
    datos[partes[1]] = leerValor(partes[2].trim());
  }
  return datos;
}

function leerValor(crudo: string): Valor {
  if (crudo === '' || crudo === 'null') return null;
  if (crudo.startsWith('[') && crudo.endsWith(']')) {
    return crudo
      .slice(1, -1)
      .split(',')
      .map((parte) => parte.trim())
      .filter((parte) => parte !== '');
  }
  const comillas = /^(["'])(.*)\1$/.exec(crudo);
  return comillas ? comillas[2] : crudo;
}

/** Lee y valida todas las tareas. `planes` son las rutas `docs/planes/….md` que existen. */
export function leerTareas(archivos: ArchivoTarea[], planes: readonly string[]): Tarea[] {
  const problemas: string[] = [];
  const tareas: Tarea[] = [];

  for (const { nombre, texto } of archivos) {
    const enArchivo = (problema: string) => problemas.push(`${nombre}: ${problema}`);
    let datos: Record<string, Valor>;
    try {
      datos = leerFrontmatter(texto);
    } catch (error) {
      enArchivo((error as Error).message);
      continue;
    }

    const campoTexto = (clave: string): string => {
      const valor = datos[clave];
      if (typeof valor === 'string' && valor !== '') return valor;
      enArchivo(valor === undefined ? `falta \`${clave}\`` : `\`${clave}\` debe ser un texto`);
      return '';
    };
    const deLista = (clave: string, permitidos: readonly string[]): string => {
      const valor = campoTexto(clave);
      if (valor !== '' && !permitidos.includes(valor)) {
        enArchivo(`\`${clave}: ${valor}\` no es válido (usa ${permitidos.join(', ')})`);
      }
      return valor;
    };

    const id = campoTexto('id');
    const prefijo = /^(T-\d{3})-[a-z0-9-]+\.md$/.exec(nombre);
    if (!prefijo) enArchivo('el nombre debe ser `T-NNN-titulo-corto.md`');
    else if (id !== '' && id !== prefijo[1]) enArchivo(`\`id: ${id}\` no coincide con el nombre del archivo`);

    const titulo = campoTexto('titulo');
    if (titulo.includes('|')) enArchivo('`titulo` no puede llevar `|`: rompe la tabla');

    const depende = datos.depende;
    if (!Array.isArray(depende)) enArchivo('`depende` debe ser una lista, por ejemplo `[]` o `[T-001]`');

    const plan = datos.plan ?? null;
    if (datos.plan === undefined) enArchivo('falta `plan` (usa `null` si no tiene)');
    else if (Array.isArray(plan)) enArchivo('`plan` debe ser `null`, `requerido` o una ruta');
    else if (plan !== null && plan !== 'requerido') {
      if (!/^docs\/planes\/[^/]+\.md$/.test(plan)) enArchivo(`\`plan: ${plan}\` debe ser una ruta \`docs/planes/….md\``);
      else if (!planes.includes(plan)) enArchivo(`\`plan: ${plan}\` no existe`);
    }

    tareas.push({
      nombre,
      id,
      titulo,
      tipo: deLista('tipo', TIPOS),
      hito: deLista('hito', HITOS),
      estado: deLista('estado', ESTADOS),
      prioridad: deLista('prioridad', PRIORIDADES),
      depende: Array.isArray(depende) ? depende : [],
      plan: Array.isArray(plan) ? null : plan,
    });
  }

  const ids = new Set<string>();
  for (const tarea of tareas) {
    if (tarea.id === '') continue;
    if (ids.has(tarea.id)) problemas.push(`${tarea.nombre}: el id ${tarea.id} está repetido`);
    ids.add(tarea.id);
  }
  for (const tarea of tareas) {
    for (const dependencia of tarea.depende) {
      if (dependencia === tarea.id) problemas.push(`${tarea.nombre}: depende de sí misma`);
      else if (!ids.has(dependencia)) problemas.push(`${tarea.nombre}: depende de ${dependencia}, que no existe`);
    }
  }

  if (problemas.length > 0) throw new ErrorTablero(problemas);
  return tareas;
}

/** `[T-013, T-014, …, T-019]` → `T-013 … T-019`. Solo abrevia 3 o más IDs seguidos. */
export function abreviarDependencias(ids: string[]): string {
  if (ids.length === 0) return '—';
  const numero = (id: string) => Number(id.slice(2));
  const partes: string[] = [];
  let inicio = 0;
  for (let i = 1; i <= ids.length; i++) {
    const sigue = i < ids.length && numero(ids[i]) === numero(ids[i - 1]) + 1;
    if (sigue) continue;
    const tramo = ids.slice(inicio, i);
    if (tramo.length >= 3) partes.push(`${tramo[0]} … ${tramo[tramo.length - 1]}`);
    else partes.push(...tramo);
    inicio = i;
  }
  return partes.join(', ');
}

function celdaPlan(plan: string | null): string {
  if (plan === null) return '—';
  if (plan === 'requerido') return 'requerido';
  return `[plan](../planes/${plan.slice('docs/planes/'.length)})`;
}

/** La tabla markdown de un hito, con sus tareas ordenadas por ID. */
export function tablaDeHito(tareas: Tarea[], hito: string): string {
  const filas = tareas
    .filter((tarea) => tarea.hito === hito)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) =>
      `| [${t.id}](${t.nombre}) | ${t.titulo} | ${t.tipo} | ${t.estado} | ${t.prioridad} | ` +
      `${abreviarDependencias(t.depende)} | ${celdaPlan(t.plan)} |`,
    );
  return [
    '| ID | Tarea | Tipo | Estado | Prio | Depende | Plan |',
    '|----|-------|------|--------|------|---------|------|',
    ...filas,
  ].join('\n');
}

/**
 * Reemplaza lo que hay entre `<!-- tablero:HN -->` y `<!-- /tablero:HN -->`
 * por la tabla de ese hito. El resto del README no se toca.
 */
export function reemplazarTablas(readme: string, tareas: Tarea[]): string {
  let resultado = readme;
  for (const hito of HITOS) {
    const inicio = `<!-- tablero:${hito} -->`;
    const fin = `<!-- /tablero:${hito} -->`;
    const desde = resultado.indexOf(inicio);
    const hasta = resultado.indexOf(fin);
    if (desde === -1 || hasta === -1 || hasta < desde) {
      throw new ErrorTablero([`el README no tiene las marcas \`${inicio}\` y \`${fin}\`, en ese orden`]);
    }
    if (resultado.indexOf(inicio, desde + 1) !== -1 || resultado.indexOf(fin, hasta + 1) !== -1) {
      throw new ErrorTablero([`las marcas de ${hito} aparecen más de una vez en el README`]);
    }
    resultado =
      resultado.slice(0, desde + inicio.length) +
      `\n\n${tablaDeHito(tareas, hito)}\n\n` +
      resultado.slice(hasta);
  }
  return resultado;
}

/** El README con sus tablas regeneradas. Lanza `ErrorTablero` si hay datos inválidos. */
export function generarTablero(readme: string, archivos: ArchivoTarea[], planes: readonly string[]): string {
  return reemplazarTablas(readme, leerTareas(archivos, planes));
}
