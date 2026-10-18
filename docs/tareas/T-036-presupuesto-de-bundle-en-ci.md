---
id: T-036
titulo: Presupuesto de bundle en CI
tipo: codigo
hito: H1
estado: hecha
prioridad: alta
depende: [T-034]
plan: docs/planes/T-036-presupuesto-de-bundle-en-ci.md
rama: null
worktree: null
---

## Qué

Agregar el *gate* de bytes del build: `presupuestos/bundle.test.ts` (fuera de `src/`) y el script `npm run test:presupuestos`, que corre en el job `build` del CI después de `npm run build`. El prototipo ya se probó en T-034 (secciones 5 y 6.1 de la guía).

## Por qué

Es el presupuesto más barato y determinista: si el JS inicial crece sin querer, el PR se pone en rojo en lugar de descubrirlo en el iPhone. Va fuera de `src/` porque usa `node:fs`/`node:zlib` y el `tsconfig` no tiene `@types/node`.

## Criterios de aceptación

- [x] `presupuestos/bundle.test.ts` mide en gzip (como sirve Pages, CAR-04) el JS inicial que referencia `index.html` y exige ≤ 340 KiB. Imprime el total en el log del CI.
- [x] También exige que ningún archivo de `dist/` fuera del JS pase de 1 MB y que todo `dist/` quede en ≤ 12 MB (sección 5).
- [x] Si no hay `dist/`, el test falla (no se salta: sería un falso verde).
- [x] `package.json`: `"test": "vitest run --dir src"` y `"test:presupuestos": "vitest run --dir presupuestos --silent=false"` (desvío del plan: sin `--silent=false` no salen los totales). Los tests actuales siguen corriendo con `npm test`.
- [x] `deploy.yml`, job `build`: `npm run test:presupuestos` después de `npm run build`. Sin job nuevo y sin tocar el ruleset.
- [x] Probado que el gate funciona: con un presupuesto artificialmente bajo, el test falla (anotado en la bitácora).
- [x] `CLAUDE.md` y `docs/README.md` mencionan `npm run test:presupuestos` donde se listan los comandos de verificación.
- [x] Pruebas: la unitaria es el propio test de presupuesto. No aplican e2e ni prueba manual en el iPhone, porque no cambia nada visible.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Puede ir en paralelo con T-035.
- 2026-10-18: arranca en su worktree. El product owner aprobó el plan en Plannotator. Decisión 8: sin `@types/node`, así que `presupuestos/` no tiene revisión de tipos. Base medida: el JS inicial pesa 317.6 KiB en gzip (T-004 sumó ≈ 7.6 KiB a los 310 de T-034).
- 2026-10-18: implementado (Sonnet `medium` para el código, Haiku `low` para docs y skill, como en el plan). Prueba de que el gate detecta lo que debe (cambios temporales, revertidos y sin commit):
  - Con `MAX_JS_INICIAL_KIB = 300` falla: "El JS inicial (gzip) pesa 317.6 KiB y el límite es 300 KiB."
  - Con `MAX_ARCHIVO_MB = 0.001` falla y nombra `audio/prueba.m4a` (y `index.html`).
  - Sin `dist/` fallan los 4 tests del gate: "No hay dist/index.html: corre `npm run build` antes."
- 2026-10-18: desvío del plan. Vitest 5 oculta los `console.log` de los tests que pasan (probado con `CI=true`), así que `test:presupuestos` lleva `--silent=false` para que los totales salgan en el log del CI.
- 2026-10-18: revisión de código (Opus `high`) sin defectos graves. Se corrigieron tres casos borde al leer `index.html`, aunque Vite hoy no genera ninguno: (1) `type`/`rel` en mayúsculas, sin comillas o con varios tokens; perder un `modulepreload` daba un falso verde. (2) La misma ruta como `script` y como `modulepreload` se contaba dos veces. (3) Una ruta con `?query` o `#hash` no se encontraba en `dist/`. Los tres casos tienen test.
- 2026-10-18: verificación local en verde: `npm test` (17 archivos, 136 tests), `npm run build`, `npm run test:presupuestos` (13 tests; hoy 317.6 KiB, 0.01 MB y 1.23 MB) y `npm run test:e2e` (31 tests). Falta confirmar en el PR que los totales salgan en el log del job `build`.
- 2026-10-18: PR #14 mergeado. Confirmado en el log del job `build` del PR que salen los totales (317.6 KiB, 0.01 MB y 1.23 MB). Tarea `hecha`; con ella cierra H1 (tag `hito-h1`).
