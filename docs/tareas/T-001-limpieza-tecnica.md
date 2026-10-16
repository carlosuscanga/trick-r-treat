---
id: T-001
titulo: Limpieza técnica del entorno
tipo: codigo
hito: H1
estado: pendiente
prioridad: alta
depende: []
plan: null
---

## Qué

Dejar el entorno local limpio antes de la primera tarea de código:

- `npm install` y comprobar que `npm run build` pasa.
- `package.json`: quitar `"main": "index.js"` y el script `test` que falla, y llenar `description`.
- Recortar `.gitignore` a lo que usa el proyecto (Node, Vite, `dist/`, `.local/`, `.env`).
- Borrar la rama local `docs/estructura-trabajo`, que ya está mergeada en `main`.
- Alinear `CLAUDE.md` con el diseño: el inventario y los ítems son una idea futura (`ideas.md`), no van en `GameState` de la v1.

## Por qué

Es deuda anotada desde el diseño v0.2. Conviene arrancar el código sobre una base que compila y sin restos de plantillas.

## Criterios de aceptación

- [ ] `npm install` y `npm run build` pasan sin errores.
- [ ] `package.json` sin `main` ni `test`, y con `description`.
- [ ] `.gitignore` solo con lo que aplica al proyecto y sigue ignorando `.local/`.
- [ ] La rama `docs/estructura-trabajo` ya no existe.
- [ ] `CLAUDE.md` ya no menciona el inventario en `GameState` ni los ítems en JSON.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
