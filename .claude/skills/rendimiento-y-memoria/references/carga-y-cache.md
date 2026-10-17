# Carga, bundle, caché y red

Reglas CAR-01 a CAR-04 y RED-01 a RED-06, más los presupuestos de bytes. Solo Phaser 3.90.

## Índice

- [Carga y bundle (CAR)](#carga-y-bundle-car)
- [Caché y red (RED)](#caché-y-red-red)
- [Presupuestos de bytes](#presupuestos-de-bytes)

## Carga y bundle (CAR)

### CAR-01 · No hacer un build a medida de Phaser
- **Hacer:** dejar `import Phaser from 'phaser'`. Si se quiere un ahorro gratis: alias a `dist/phaser-arcade-physics.js` (−32 KiB gzip, build oficial sin Matter).
- **Verifica:** revisión de código (`vite.config.ts` sin alias). Si se adopta el alias: e2e de humo con cada API de Phaser que se use.
- **Por qué:** un build propio ahorra poco y una API olvidada revienta en runtime, no en `tsc`. [Guía 4.1](../../../../docs/planes/T-034-performance-y-memoria.md#41-carga-y-bundle-car)

### CAR-02 · No dividir el código en chunks (`import()`)
- **Hacer:** no usar `import()` mientras Phaser sea más del 99 % del JS. Si algún día se divide: manejar `vite:preloadError` (RED-04) y respetar el presupuesto de chunk.
- **Verifica:** revisión de código (ningún `import()` sin manejo de error) y el gate de JS inicial.
- **Por qué:** un minijuego compila a ~0.6 KB y un deploy borra los chunks viejos, así que `import()` puede fallar con el juego abierto. [Guía 4.1](../../../../docs/planes/T-034-performance-y-memoria.md#41-carga-y-bundle-car)

### CAR-03 · Cada escena carga lo suyo en `preload()`
- **Hacer:** Arranque y Menú cargan lo mínimo; la Calle, su escenografía, Mi vo con el disfraz y el HUD; cada minijuego, su atlas y su audio sprite. Lo compartido se carga una vez (el loader no repite una clave existente).
  ```ts
  preload() { this.load.atlas('lluvia', paraLoader(png), paraLoader(json)); }
  ```
- **Si todavía no existe:** si `paraLoader` no existe y la tarea carga un asset, crea la función mínima en `src/plataforma/assets.ts` (los assets van en `src/assets/`) con el comentario "mínima; T-039 la completa"; si existe, úsala. No la refines.
- **Verifica:** e2e "nada se pide dos veces" (contar requests por URL al volver a entrar a una escena).
- **Por qué:** texturas y caché son globales del `Game`; el motivo principal es la memoria, no la red. [Guía 4.1](../../../../docs/planes/T-034-performance-y-memoria.md#41-carga-y-bundle-car)

### CAR-04 · Medir el presupuesto de JS en gzip
- **Hacer:** medir el JS como lo sirve Pages (gzip, no brotli); `zlib.gzipSync` nivel 6 da casi lo mismo.
- **Si todavía no existe:** `presupuestos/bundle.test.ts` y `test:presupuestos` son de T-036: no los construyas; mientras, revisa el tamaño en la salida de `npm run build`. Si existen, úsalos.
- **Verifica:** unitaria `presupuestos/bundle.test.ts` en el job `build`.
- **Por qué:** Pages manda gzip y la medición local coincide con la real. [Guía 4.1](../../../../docs/planes/T-034-performance-y-memoria.md#41-carga-y-bundle-car)

## Caché y red (RED)

### RED-01 · Asumir `max-age=600` y ETag nuevo en cada deploy
- **Hacer:** diseñar sabiendo que Pages sirve todo con `Cache-Control: max-age=600` y que tras cada deploy el navegador baja todo otra vez pasados 10 min, aunque el nombre con hash no cambie. No separar Phaser en un chunk *vendor* esperando ahorro: sin service worker no sirve.
- **Verifica:** manual en el iPhone (Web Inspector › Network), porque cómo lo hace Safari exactamente es hipótesis.
- **Por qué:** Pages no permite headers propios y el ETag depende del deploy. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

### RED-02 · No hacer deploys mientras Mi vo juega
- **Hacer:** es regla de operación: no mergear a `main` mientras Mi vo tenga el juego abierto.
- **Verifica:** manual (revisar con ella antes de publicar).
- **Por qué:** un deploy borra los archivos viejos y dan 404. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

### RED-03 · Assets en `src/assets/` con hash; `public/` solo para nombres fijos
- **Hacer:** importar los assets desde `src/assets/` y pasarlos por `paraLoader`, que quita la base para que Phaser no la repita. `public/` solo para manifest, íconos y `sw.js`.
  ```ts
  // src/plataforma/assets.ts
  export const paraLoader = (url: string) =>
    url.startsWith(import.meta.env.BASE_URL) ? url.slice(import.meta.env.BASE_URL.length) : url;
  this.load.atlas('lluvia', paraLoader(png), paraLoader(json));
  ```
- **Si todavía no existe:** si no existe `paraLoader`, crea solo la función de arriba en `src/plataforma/assets.ts` con el comentario "mínima; T-039 la completa" y pon el asset en `src/assets/`; el aviso de versión nueva y la lista blanca de `public/` son de T-039. Si existe, úsala.
- **Verifica:** unitaria (`paraLoader` con base `/trick-r-treat/`, con `/` y con `data:`; lista blanca de `public/`) y e2e (ninguna respuesta ≥ 400 al recorrer las escenas).
- **Por qué:** un par atlas `.png` + `.json` en `public/` puede mezclar versiones tras un deploy, y sin `paraLoader` la base se duplica y da 404. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

### RED-04 · Un 404 de asset o chunk significa "hay versión nueva"
- **Hacer:** avisar y recargar, no colgarse.
  ```ts
  window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); avisarVersionNueva(); });
  this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: Phaser.Loader.File) => { if (f.xhrLoader?.status === 404) avisarVersionNueva(); });
  ```
- **Si todavía no existe:** el aviso de versión nueva no se hace en la tarea actual; lo completa T-039. No lo crees.
- **Verifica:** e2e con `page.route('**/assets/*lluvia*', r => r.fulfill({ status: 404 }))`; manual (con el juego abierto, mergear algo trivial y entrar a un minijuego).
- **Por qué:** sin `preventDefault` queda un rechazo sin manejar y el minijuego no arranca. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

### RED-05 · Sin service worker por ahora
- **Hacer:** no agregar uno. Después, uno escrito a mano: HTML *network-first* con *fallback*, `/assets/*` *cache-first*, activación en el siguiente arranque (sin `skipWaiting` automático) y caché por id de build.
- **Si todavía no existe:** el service worker es de T-043; no lo crees en otra tarea.
- **Verifica:** unitaria de la función pura `estrategia(url)`; manual en el iPhone.
- **Por qué:** el riesgo clásico es servir una versión vieja para siempre. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

### RED-06 · Pantalla de inicio y Safari tienen almacenamientos separados
- **Hacer:** no asumir que la partida guardada en Safari se ve en el ícono de pantalla de inicio, ni al revés; seguir la decisión 5 de la guía.
- **Verifica:** manual en el iPhone (guardar en uno, abrir en el otro).
- **Por qué:** las apps de pantalla de inicio no comparten estado con el navegador. [Guía 4.7](../../../../docs/planes/T-034-performance-y-memoria.md#47-caché-y-red-red)

## Presupuestos de bytes

Los de bytes son gates de CI (varios son hipótesis por calibrar en el iPhone). Detalle y el resto en la [sección 5](../../../../docs/planes/T-034-performance-y-memoria.md#5-presupuestos-para-el-iphone-13). Los tests viven en `presupuestos/` (T-036).

| Qué | Valor | Cómo se mide |
|---|---|---|
| JS inicial (gzip) | ≤ 340 KiB (hoy 310.0) | `presupuestos/bundle.test.ts` |
| Chunk de minijuego (solo si se divide) | ≤ 25 KiB gzip c/u; JS total ≤ 420 KiB | igual |
| Assets hasta "toca para empezar" | ≤ 300 KB | e2e: bytes antes de `trt:listo-para-tocar` |
| Assets de la Calle (escenografía + Mi vo + HUD) | tope 2.5 MB, meta 1.5 MB | Vitest: manifest + tamaños en `dist/` |
| Assets por minijuego | tope 1 MB, meta 500 KB | igual |
| Ningún archivo de `dist/` (fuera del JS) | ≤ 1 MB | Vitest |
| Todo `dist/` | ≤ 12 MB | Vitest |
