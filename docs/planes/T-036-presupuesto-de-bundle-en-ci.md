# Plan T-036: Presupuesto de bundle en CI

Tarea: [T-036](../tareas/T-036-presupuesto-de-bundle-en-ci.md) · Guía: [T-034](T-034-performance-y-memoria.md), secciones 4.1 (CAR-04), 5 y 6.1.

## Enfoque

Un test de Vitest que lee `dist/` después del build y pone el CI en rojo si el JS inicial (en gzip) pasa de 340 KiB, si un archivo que no es JS pasa de 1 MB o si todo `dist/` pasa de 12 MB. Corre en el job `build`, justo después de `npm run build`, así que si falla en `main` no se publica. Es la analogía de un *quality gate* de tamaño de artefacto en un pipeline de backend.

Hoy (2026-10-18) el JS inicial pesa **317.6 KiB** en gzip nivel 6: T-004 sumó ≈ 7.6 KiB sobre los 310 que midió T-034. Quedan ≈ 22 KiB de margen.

### Decisiones

1. **Fuera de `src/`, en `presupuestos/`.** Usa `node:fs` y `node:zlib`, y el `tsconfig` solo tiene tipos del navegador (`vite/client`). En `src/` rompería `tsc --noEmit`. Además, el job `tests` no tiene `dist/`.
2. **La lógica pura va aparte** (`presupuestos/bundle.ts`): qué JS referencia `index.html` y qué archivos se pasan de un límite. Así se prueba con HTML de ejemplo, sin depender del build, igual que el resto del proyecto (lógica en módulos chicos y probados).
3. **"JS inicial"** = los `<script type="module" src>` más los `<link rel="modulepreload" href>` de `dist/index.html`. Hoy es un solo archivo. Si algún día se divide en chunks (CAR-02), los que se cargan después no cuentan aquí.
4. **Unidades:** el JS va en **KiB** (1024 B), como en la guía: 340 KiB = 348 160 B. Los límites de archivos van en **MB decimales**, como el cálculo de la guía (2 min de AAC a 64 kbps = 960 KB): 1 MB = 1 000 000 B y 12 MB = 12 000 000 B.
5. **gzip nivel 6** con `zlib.gzipSync`, porque es lo que Pages sirve (CAR-04: 317 412 B local contra 317 742 B reales).
6. **Sin `dist/` el test falla, no se salta.** Si se saltara, daría un falso verde. El mensaje dice "corre `npm run build` antes". También falla si `index.html` no referencia ningún JS, o si referencia uno que no existe (por ejemplo, si cambia la base de Pages).
7. **La base `/trick-r-treat/`** se repite como constante, con un comentario que apunta a `vite.config.ts`. Si las dos se desalinean, el archivo no aparece y el test falla con el nombre del archivo que falta.
8. **Sin revisión de tipos en `presupuestos/`** (aprobado por el product owner el 2026-10-18). Vitest ejecuta el TypeScript sin revisar tipos, y `tsc` solo mira `src/`. Revisarlos pediría agregar `@types/node` (dependencia nueva) y un `tsconfig` propio. No se hace por ahora: son ≈ 60 líneas y sus propios tests las cubren. Efecto secundario: el editor puede marcar `node:fs` en rojo en esa carpeta.
9. **`npm test` pasa a `vitest run --dir src`.** Además de dejar fuera `presupuestos/`, evita que `npm test` en el checkout principal corra los tests de los worktrees (`.claude/worktrees/*/src`), algo que hoy sí pasa.

## Archivos

- Crear: `presupuestos/bundle.ts` (lógica pura: `jsInicial`, `excedidos`).
- Crear: `presupuestos/bundle.test.ts` (tests de la lógica con HTML de ejemplo y el *gate* contra `dist/`).
- Modificar: `package.json` (scripts `test` y `test:presupuestos`).
- Modificar: `.github/workflows/deploy.yml` (job `build`: un paso nuevo después de `npm run build`).
- Modificar: `CLAUDE.md` ("Comandos" y "Verificar siempre con…").
- Modificar: `docs/README.md` ("Definición de hecho", punto 2).
- Modificar: `.claude/skills/rendimiento-y-memoria/SKILL.md` y `references/carga-y-cache.md`: "hoy 310" → "hoy 317.6", y `npm run test:presupuestos` en el checklist de PR. No se toca la `description`, así que no cambia la activación del skill (T-035).
- Modificar: `docs/tareas/T-036-presupuesto-de-bundle-en-ci.md` (`plan:`, criterios y bitácora).

## Pasos

1. **Lógica pura** en `presupuestos/bundle.ts`:
   - `jsInicial(html, base)`: devuelve las rutas relativas a `dist/` de los `<script type="module" src>` y los `<link rel="modulepreload" href>` que empiezan con `base`.
   - `excedidos(archivos, maxBytes)`: de una lista `{ ruta, bytes }`, devuelve los que pasan del límite.
   - Constantes: `BASE = '/trick-r-treat/'`, `MAX_JS_INICIAL_KIB = 340`, `MAX_ARCHIVO_MB = 1`, `MAX_DIST_MB = 12`.
   - Verificar: los tests del paso 2 pasan con `npm run test:presupuestos`.
2. **Tests** en `presupuestos/bundle.test.ts`:
   - Lógica: los casos de "Pruebas" de abajo.
   - *Gate*: existe `dist/index.html`; el JS inicial existe, no está vacío y su gzip pesa ≤ 340 KiB; ningún archivo de `dist/` que no termine en `.js` pasa de 1 MB; la suma de `dist/` es ≤ 12 MB. Imprime con `console.log` una línea por presupuesto (`JS inicial (gzip): 317.6 KiB de 340`, etc.) para ver la tendencia en el log del CI.
   - Verificar: `npm run build && npm run test:presupuestos` pasa en verde y muestra los totales.
3. **Scripts** en `package.json`: `"test": "vitest run --dir src"` y `"test:presupuestos": "vitest run --dir presupuestos --silent=false"`.
   - Desvío: `--silent=false` no venía en la guía. Sin él, Vitest 5 oculta los `console.log` de los tests que pasan (probado con `CI=true`), y los totales no saldrían en el log del CI.
   - Verificar: `npm test` corre los mismos 17 archivos de hoy, y ninguno de `presupuestos/`.
4. **Probar que el *gate* detecta lo que debe** (sin commit; se anota en la bitácora):
   - Con `MAX_JS_INICIAL_KIB = 300`, el test falla y dice cuánto pesa y cuál es el límite.
   - Con `MAX_ARCHIVO_MB` en 0.001, falla y nombra `audio/prueba.m4a`.
   - Sin `dist/` (`rm -rf dist`), falla con el mensaje de "corre npm run build".
   - Se revierte todo y vuelve a verde.
5. **CI:** en `deploy.yml`, job `build`, agregar `- run: npm run test:presupuestos` después de `- run: npm run build` y antes de subir el artifact. Sin job nuevo y sin tocar el ruleset.
   - Verificar: `npm test` (incluye `src/ci/checks.test.ts`, que lee `deploy.yml`). En el PR, el log del job `build` muestra los totales.
6. **Documentación:** `CLAUDE.md`, `docs/README.md` y el skill, según "Archivos".
   - Verificar: `grep -rn "test:presupuestos"` los encuentra todos.
7. **Cierre de la rama:** criterios marcados y bitácora en la tarea; `npm test`, `npm run test:e2e`, `npm run build` y `npm run test:presupuestos` en verde; revisión de código; PR.

## Pruebas

- **Unitarias** (`npm run test:presupuestos`, `presupuestos/bundle.test.ts`):
  - `jsInicial`: encuentra el `<script type="module" src>`; incluye los `modulepreload`; ignora los scripts sin `type="module"`, los `<link rel="stylesheet">` y las URLs fuera de la base; devuelve `[]` si no hay ninguno.
  - `excedidos`: vacío si todos caben; justo en el límite cabe; un byte más se pasa.
  - El *gate* contra `dist/` (paso 2), que es la prueba principal.
  - Los límites se prueban con valores propios del test, no con los presupuestos reales, para que cambiar un presupuesto no rompa los tests de la lógica.
- **e2e:** no aplica. No cambia nada que se vea o se toque en el navegador.
- **Manual en el iPhone:** no aplica, por la misma razón. Lo que sí se revisa a mano, en la PC: el log del job `build` del PR muestra los totales, y después del merge el de `main` también.

## Modelo y esfuerzo

| Paso o subagente | Modelo | Esfuerzo | Por qué |
|---|---|---|---|
| Pasos 1–5 (subagente que programa) | Sonnet | `medium` | Código chico y bien especificado, con el prototipo de T-034 como guía. |
| Paso 6 (docs y skill) | Haiku | `low` | Ediciones mecánicas de pocas líneas. |
| Verificación, bitácora y PR (sesión principal) | Opus | `high` | Referencia por rol: orquesta y confirma con evidencia. |
| Revisión del PR | Opus (`code-reviewer-opus55`) | `high` | Referencia por rol. |

## Riesgos y dudas

- **Margen chico:** 22 KiB. T-037 (`?depurar` con overlay) y T-007 (escenas) suman código, aunque cada escena compila a ≈ 0.6 KB. Si un PR se pasa, la regla es no subir el número sin decidirlo: se anota en la bitácora de esa tarea y lo decide el product owner. La salida más barata ya está en la guía: el alias `phaser-arcade-physics` (−32 KiB, CAR-01), descartado por ahora.
- **Ruido del editor:** sin `@types/node`, VS Code puede marcar errores en `presupuestos/*.ts` aunque los tests pasen.
