---
id: T-006
titulo: GameState y datos en JSON
tipo: codigo
hito: H2
estado: hecha
prioridad: alta
depende: [T-001]
plan: docs/planes/T-006-gamestate-y-datos.md
---

## Qué

El módulo `GameState` (disfraz, dulces de 0 a 10 en pasos de ½, sustos de 0 a 3, casas visitadas) y los JSON de disfraces y vecinos con datos placeholder.

## Por qué

Todas las escenas leen y escriben este estado. Ser data-driven permite agregar vecinos y disfraces sin tocar código.

## Criterios de aceptación

- [x] Los dulces suman en pasos de ½ y nunca se redondean (9½ no gana).
- [x] Los sustos van de 0 a 3.
- [x] Disfraces y vecinos se cargan desde JSON.
- [x] El estado se reinicia al empezar otra partida.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Puede adelantarse a H1: solo depende de T-001.
- 2026-10-16: plan aprobado. Decisiones: los dulces se guardan en medios (enteros de 0 a 20) solo dentro del código, y Mi vo sigue viendo `6½/10`; el vecino no lleva dificultad en su JSON porque se sortea en cada partida (T-008); el script de verificación se commitea en `scripts/`; `tsconfig.json` no cambia.
- 2026-10-16: implementada. `src/datos/` (tipos, JSON, carga con validación) y `src/estado/GameState.ts`. Desvío del plan: `DULCES_POR_DIFICULTAD` pasó de `tipos.ts` a `datos/index.ts`, para que `tipos.ts` tenga solo tipos y Node pueda ejecutar el script sin cambiar `tsconfig.json`. El plan quedó actualizado.
- 2026-10-16: verificación. `node scripts/verificar-estado.ts` cubre los 4 criterios y el rechazo de JSON inválidos (todo pasa). `npm run build` pasa después de traer `origin/main` (T-002). Un build aparte con Vite de solo `src/datos/index.ts` confirmó que los JSON se empaquetan. No hay nada que probar en el navegador ni en el celular: el estado todavía no se conecta a ninguna escena (eso es T-007).
- 2026-10-16: pendiente de decidir: el editor marca `node:assert/strict` en el script porque falta `@types/node`. Es solo visual; quitarlo requiere esa dependencia.
- 2026-10-16: cambio de alcance (decisión de Carlos, con el OK del orquestador). El CI solo compilaba y no corría el script, así que entraron tests de verdad: Vitest 5.0.3, `npm test`, `src/estado/GameState.test.ts` y `src/datos/datos.test.ts` (13 tests). El CI corre `npm test` antes del build. Se quitó `scripts/verificar-estado.ts`, y con eso se resuelve lo de `@types/node`. Regla nueva: **todo lleva tests**, escrita en `CLAUDE.md` y en la "Definición de hecho" de `docs/README.md`. El orquestador asignó a T-006 `package.json`, `package-lock.json`, el workflow y esas líneas de los docs. Los tests detectan errores: con la regla rota a propósito (9½ ganaba) falló el test correspondiente.
- 2026-10-16: se trajo `main` con la regla nueva de "Pruebas" (T-031). La sección "Verificación" del plan pasó a llamarse "Pruebas". En el CI, los tests quedaron en un job propio llamado `tests`, con un nombre estable para que T-031 lo marque como check requerido, y `deploy` espera a `tests` y a `build`.
- 2026-10-16: PR #3 mergeado sin squash (`9a0000f`) con el OK de Carlos. Tarea `hecha`.
