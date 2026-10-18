// Lógica pura del presupuesto de bundle (T-036): qué JS carga index.html y qué
// archivos se pasan de un límite. Sin node:*, para probarla con HTML de ejemplo.
// El gate que lee dist/ está en bundle.test.ts.

/** Base de Pages. Debe coincidir con `base` en vite.config.ts. */
export const BASE = '/trick-r-treat/';

/** JS inicial en gzip, en KiB (1 KiB = 1024 B). */
export const MAX_JS_INICIAL_KIB = 340;
/** Archivo más grande que no es JS, en MB decimales (1 MB = 1 000 000 B). */
export const MAX_ARCHIVO_MB = 1;
/** Suma de todo dist/, en MB decimales. */
export const MAX_DIST_MB = 12;

export interface Archivo {
  ruta: string;
  bytes: number;
}

/** Valor de un atributo dentro de una etiqueta, o undefined. */
function atributo(etiqueta: string, nombre: string): string | undefined {
  return etiqueta.match(new RegExp(`\\s${nombre}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
}

/**
 * Rutas (relativas a dist/) del JS que index.html carga al inicio:
 * `<script type="module" src>` y `<link rel="modulepreload" href>` bajo `base`.
 */
export function jsInicial(html: string, base: string): string[] {
  const rutas: string[] = [];
  for (const [etiqueta] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const esScript = /^<script/i.test(etiqueta);
    const url = esScript
      ? atributo(etiqueta, 'type') === 'module'
        ? atributo(etiqueta, 'src')
        : undefined
      : atributo(etiqueta, 'rel') === 'modulepreload'
        ? atributo(etiqueta, 'href')
        : undefined;
    if (url?.startsWith(base)) rutas.push(url.slice(base.length));
  }
  return rutas;
}

/** Los archivos que pesan más de `maxBytes` (justo en el límite todavía cabe). */
export function excedidos(archivos: Archivo[], maxBytes: number): Archivo[] {
  return archivos.filter((a) => a.bytes > maxBytes);
}
