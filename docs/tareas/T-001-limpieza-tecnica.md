---
id: T-001
titulo: Limpieza técnica del entorno
tipo: codigo
hito: H1
estado: en-progreso
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

- [x] `npm install` y `npm run build` pasan sin errores.
- [x] `package.json` sin `main` ni `test`, y con `description`.
- [x] `.gitignore` solo con lo que aplica al proyecto y sigue ignorando `.local/`.
- [ ] La rama `docs/estructura-trabajo` ya no existe.
- [x] `CLAUDE.md` ya no menciona el inventario en `GameState` ni los ítems en JSON.
- [x] El plugin `typescript-lsp` funciona con el proyecto instalado: marca un error de tipos de Phaser en `src/`.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
- 2026-10-16: se instaló el plugin `typescript-lsp` a nivel proyecto (`.claude/settings.json`). TypeScript 7 (nativo) no trae `tsserver`, así que se instalaron globalmente `typescript-language-server` 5.3.0 y `typescript@6.0.3`. Falta verificar que el LSP use ese `tsserver` global y no el TypeScript 7 de `node_modules`.
- 2026-10-16: primera tarea con el flujo de worktree y PR. Hallazgos y ajustes:
  - **Rama:** la herramienta nativa nombra la rama `worktree-T-001-limpieza-tecnica`. Se renombró a `T-001-limpieza-tecnica` con `git branch -m` y se añadió ese paso a `docs/README.md` (paso 3).
  - **Node:** `npm run build` fallaba en la base limpia con "Cannot find native binding" (`@rolldown/binding-darwin-arm64`). La causa es que Vite 8 y rolldown piden Node `^20.19.0 || >=22.12.0`, el Node por defecto de la máquina era 20.18.1 y npm omite en silencio las dependencias opcionales que no cumplen `engines`. Decisión del product owner: fijar Node 24 con `.nvmrc` y `engines` en `package.json`, usando nvm por proyecto sin cambiar el Node por defecto de la máquina. El lockfile se regeneró con npm 11 (solo quita campos `libc`). Se documentó en `CLAUDE.md` y en el paso 3 de `docs/README.md`.
  - **Borrar ramas:** el hook `dcg` bloquea que el agente borre ramas, incluso con `git branch -d`. El product owner borra `docs/estructura-trabajo` a mano. Se anotó en el paso 6 de `docs/README.md`.
- 2026-10-16: LSP verificado. `typescript-language-server` usa el `tsserver` global de TypeScript 6.0.3, no el TypeScript 7 de `node_modules`. Con un archivo temporal en `src/`, marcó `Type 'string' is not assignable to type 'number'` en `new Phaser.Game({ type: 'AUTO' })` y `Expected 3-4 arguments, but got 2` en `scene.add.sprite(0, 0)`. Ojo: justo después de instalar, el primer hover devolvió `any` mientras el servidor cargaba el proyecto. Al reintentar, ya resolvió los tipos.
