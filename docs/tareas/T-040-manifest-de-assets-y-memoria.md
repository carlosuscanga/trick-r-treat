---
id: T-040
titulo: Manifest de assets y memoria estimada por escena
tipo: codigo
hito: H3
estado: pendiente
prioridad: media
depende: [T-039, T-012]
plan: null
---

## Qué

Un manifest de assets (`src/datos/assets.json`, data-driven) del que cargan las escenas, y tests que estiman con él la memoria de texturas y audio por escena y la comparan con los presupuestos de la guía de T-034 (secciones 5 y 6.1).

## Por qué

Lo que más memoria gasta en el iPhone es la GPU: una textura ocupa `ancho × alto × 4 B` aunque el PNG pese poco. Con el manifest, pasarse del presupuesto de memoria se detecta en el CI y no en el iPhone, antes de que llegue el arte pesado.

## Criterios de aceptación

- [ ] Las escenas cargan sus assets desde `src/datos/assets.json`, y cada escena carga lo suyo en su `preload()` (CAR-03).
- [ ] Vitest: cada ruta del manifest existe en `src/assets/`, ningún lado pasa de 2048 px (TEX-03) y vecinos y disfraces solo usan claves que existen.
- [ ] Vitest: memoria de texturas por escena (×4/3 si es POT, TEX-02) dentro del presupuesto: Calle + Mi vo + HUD ≤ 44 MiB, minijuego activo ≤ 16 MiB, total ≤ 64 MiB.
- [ ] Vitest: PCM de audio (duración × canales) dentro del presupuesto: música ≤ 17.3 MB, sprite global ≤ 4 MB y sprite de minijuego ≤ 4 MB (AUD-02, AUD-03).
- [ ] Vitest: bytes de la Calle ≤ 2.5 MB y de cada minijuego ≤ 1 MB.
- [ ] Un test en `presupuestos/` compara las dimensiones declaradas con el encabezado real del PNG/WebP.
- [ ] Pruebas: las unitarias anteriores; e2e de "nada se pide dos veces" al volver a entrar, de que las texturas y el audio del minijuego se liberan al salir (TEX-07, AUD-05) y del contador de *draw calls* en la Calle (≤ 25, si el CI tiene WebGL); manual en el iPhone con M6 a M9 de la guía (`tex` del overlay vuelve al mismo valor al regresar a la Calle).

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034.
