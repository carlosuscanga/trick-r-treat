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

- [x] `.github/rulesets/main.json` exige `tests`, `build` y `e2e`, y `src/ci/checks.test.ts` pasa.
- [x] El comentario del job `e2e` en `deploy.yml` dice la verdad.
- [ ] Después del merge, el product owner aplica el ruleset con su cuenta (el token de las sesiones no puede), y la API muestra los 3 checks.
- [ ] Un PR con `e2e` en rojo queda bloqueado.

## Bitácora

- 2026-10-16: creada al mergear T-003 (PR #6), por decisión del product owner. Es pequeña, así que no necesita plan. `e2e` ya corre en `main` desde el merge de T-003, así que exigirlo no bloquea los PRs esperando un check que no existe (ver "Cambiar el ruleset" en `docs/README.md`).
- 2026-10-16: `e2e` agregado a `required_status_checks` en `.github/rulesets/main.json`, con `integration_id` 15368 (GitHub Actions), igual que `tests` y `build`. Primero se cambió `src/ci/checks.test.ts`: compara la lista exacta de checks, así que ahora espera `['tests', 'build', 'e2e']`. Falló con el ruleset viejo ("falta e2e") y pasó con el nuevo. El test "cada check exigido existe como job" ahora también cubre `e2e`.
- 2026-10-16: el comentario del job `e2e` en `deploy.yml` decía que T-031 lo marcaba como requerido. Ahora dice que es requerido desde T-033 vía `.github/rulesets/main.json`.
- 2026-10-16: desvío pequeño: `docs/README.md` decía en dos lugares ("Checks obligatorios en `main`" y el paso 6) que solo se exigen `tests` y `build`. Se actualizó a `tests`, `build` y `e2e` para que no quede desfasado.
- 2026-10-16: verificación: `npm test` (32/32), `npm run build` y `actionlint` pasan. Los criterios 3 y 4 son después del merge: el product owner aplica el ruleset con su cuenta, y luego un PR de prueba con un e2e roto debe quedar bloqueado. Los marca el orquestador en `main`.
