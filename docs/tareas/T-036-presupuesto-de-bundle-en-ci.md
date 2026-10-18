---
id: T-036
titulo: Presupuesto de bundle en CI
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-034]
plan: null
rama: T-036-presupuesto-de-bundle-en-ci
worktree: .claude/worktrees/T-036-presupuesto-de-bundle-en-ci
---

## Qué

Agregar el *gate* de bytes del build: `presupuestos/bundle.test.ts` (fuera de `src/`) y el script `npm run test:presupuestos`, que corre en el job `build` del CI después de `npm run build`. El prototipo ya se probó en T-034 (secciones 5 y 6.1 de la guía).

## Por qué

Es el presupuesto más barato y determinista: si el JS inicial crece sin querer, el PR se pone en rojo en lugar de descubrirlo en el iPhone. Va fuera de `src/` porque usa `node:fs`/`node:zlib` y el `tsconfig` no tiene `@types/node`.

## Criterios de aceptación

- [ ] `presupuestos/bundle.test.ts` mide en gzip (como sirve Pages, CAR-04) el JS inicial que referencia `index.html` y exige ≤ 340 KiB. Imprime el total en el log del CI.
- [ ] También exige que ningún archivo de `dist/` fuera del JS pase de 1 MB y que todo `dist/` quede en ≤ 12 MB (sección 5).
- [ ] Si no hay `dist/`, el test falla (no se salta: sería un falso verde).
- [ ] `package.json`: `"test": "vitest run --dir src"` y `"test:presupuestos": "vitest run --dir presupuestos"`. Los tests actuales siguen corriendo con `npm test`.
- [ ] `deploy.yml`, job `build`: `npm run test:presupuestos` después de `npm run build`. Sin job nuevo y sin tocar el ruleset.
- [ ] Probado que el gate funciona: con un presupuesto artificialmente bajo, el test falla (anotado en la bitácora).
- [ ] `CLAUDE.md` y `docs/README.md` mencionan `npm run test:presupuestos` donde se listan los comandos de verificación.
- [ ] Pruebas: la unitaria es el propio test de presupuesto. No aplican e2e ni prueba manual en el iPhone, porque no cambia nada visible.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034. Puede ir en paralelo con T-035.
