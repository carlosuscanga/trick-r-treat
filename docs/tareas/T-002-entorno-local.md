---
id: T-002
titulo: Entorno local y limpieza de package.json
estado: pendiente
prioridad: alta
depende: [T-001]
plan: null
---

## Qué

Dejar el proyecto funcionando en la Mac con `npm install`, y limpiar los restos de `npm init` en `package.json`.

## Por qué

Ahora el desarrollo es local con Claude Code. Sin `node_modules`, `npm run build` falla con `tsc: command not found`.

## Criterios de aceptación

- [ ] `npm install` corre sin errores.
- [ ] `npm run build` pasa (revisión de tipos y build de Vite).
- [ ] `npm run dev` muestra la escena de prueba en el navegador.
- [ ] En `package.json`: quitar `"main": "index.js"` y el script `test` que falla, y llenar `description`.

## Bitácora

- 2026-10-15: TypeScript 7.0.2 es el compilador nativo nuevo. Confirmar que expone el binario `tsc`; si no, ajustar el script `build`.
