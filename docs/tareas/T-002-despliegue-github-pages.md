---
id: T-002
titulo: Despliegue automático a GitHub Pages
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-001]
plan: docs/planes/T-002-despliegue-github-pages.md
---

## Qué

Publicar `main` en GitHub Pages de forma automática al hacer push (GitHub Actions + `base` de Vite para la ruta del repo).

## Por qué

`main` siempre es jugable y se publica. Con el despliegue listo desde el inicio, cada hito se prueba en el iPhone abriendo un link, sin depender de la red local.

## Criterios de aceptación

- [ ] Un push a `main` publica el build en la URL de GitHub Pages.
- [ ] El juego carga desde esa URL en Safari del iPhone (rutas de assets correctas).
- [x] La URL queda anotada en el `README.md`.
- [x] No se publica nada de `.local/` ni datos personales.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
- 2026-10-16: plan revisado en Plannotator. Carlos aprobó `base` solo en build y preview (opción A), pidió documentar bien esa decisión y cuidar tokens y variables de entorno. Se agregó la decisión 8 del plan (sin secretos, `persist-credentials: false`, `pull_request` y no `pull_request_target`, nada de `${{ }}` con texto de usuarios en `run:`, que importa para T-030).
- 2026-10-16: `vite.config.ts` y `.github/workflows/deploy.yml` listos. Acciones fijadas por SHA. En `setup-node` se eligió v7.0.0 y no v7.1.0, que tenía una semana de publicada. `actionlint` pasa.
- 2026-10-16: verificado en la rama. `npm run dev` sigue en `/`. `npm run build && npm run preview -- --port 5174 --strictPort` sirve en `/trick-r-treat/`: el JS carga (200) y Phaser arranca en el navegador. `dist/` solo tiene `index.html` y `assets/index-*.js`, sin nada de `.local/` ni datos personales; las coincidencias de `.local` en el bundle son código interno de Phaser (`this.localWorld`). Además, el workflow compila desde un checkout de git, donde `.local/` no existe. El único 404 en la consola es `/favicon.ico`: el proyecto no tiene favicon, y no tiene que ver con `base`.
- 2026-10-16: los dos primeros criterios quedan sin marcar a propósito. Pages solo publica desde `main`, y antes del merge hay que activarlo con "Source: GitHub Actions" (hace pública la página, con OK de Carlos). Los verifica y marca el orquestador en `main` después del merge.
- Aviso para T-003, T-006 y siguientes: las rutas de assets en Phaser no deben empezar con `/` (funcionan en dev y se rompen en Pages). Usar rutas relativas o `import.meta.env.BASE_URL`.
