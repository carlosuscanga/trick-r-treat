---
id: T-033
titulo: e2e obligatorio antes del merge
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-003, T-031]
plan: null
---

## Qué

Hacer obligatorio el check `e2e` (Playwright, de T-003) en el ruleset de `main`, igual que `tests` y `build`. Corregir también el comentario del job `e2e` en `.github/workflows/deploy.yml`, que hoy dice que ya es obligatorio.

## Por qué

Los e2e protegen justo lo frágil del iPhone: el ancho variable, el aviso de girar y las rutas del audio con la base de Pages. Si el check no es obligatorio, un PR con los e2e en rojo se puede mergear igual. El product owner lo decidió al mergear T-003.

## Criterios de aceptación

- [ ] `.github/rulesets/main.json` exige `tests`, `build` y `e2e`, y `src/ci/checks.test.ts` pasa.
- [ ] El comentario del job `e2e` en `deploy.yml` dice la verdad.
- [ ] Después del merge, el product owner aplica el ruleset con su cuenta (el token de las sesiones no puede), y la API muestra los 3 checks.
- [ ] Un PR con `e2e` en rojo queda bloqueado.

## Bitácora

- 2026-10-16: creada al mergear T-003 (PR #6), por decisión del product owner. Es pequeña, así que no necesita plan. `e2e` ya corre en `main` desde el merge de T-003, así que exigirlo no bloquea los PRs esperando un check que no existe (ver "Cambiar el ruleset" en `docs/README.md`).
