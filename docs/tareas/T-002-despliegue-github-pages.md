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
- [ ] La URL queda anotada en el `README.md`.
- [ ] No se publica nada de `.local/` ni datos personales.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
