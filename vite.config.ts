import { defineConfig } from 'vite';

// GitHub Pages sirve el juego en https://carlosuscanga.github.io/trick-r-treat/,
// así que el build (y `preview`, que sirve ese build) usa esa ruta como base.
// `npm run dev` se queda en la raíz para no cambiar la URL de desarrollo.
// Detalle de la decisión: docs/planes/T-002-despliegue-github-pages.md
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/trick-r-treat/' : '/',
}));
