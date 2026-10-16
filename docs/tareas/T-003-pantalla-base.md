---
id: T-003
titulo: Pantalla base para iPhone
tipo: codigo
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-001]
plan: ../planes/T-003-pantalla-base.md
---

## Qué

Reemplazar la escena `SmokeTest` por la configuración base del juego:

- Modo de escala `FIT` en horizontal.
- Aviso de "gira tu teléfono" cuando está en vertical.
- El audio se desbloquea con el primer toque (requisito de iOS).

## Por qué

Son restricciones de la plataforma que todo lo demás da por hechas. Si fallan, fallan todas las escenas.

## Criterios de aceptación

- [x] `SmokeTest` ya no existe.
- [x] En el iPhone en horizontal, el juego ocupa la pantalla sin deformarse.
- [x] En vertical aparece el aviso de girar, y al girar desaparece.
- [x] Después del primer toque suena un sonido de prueba en el iPhone.

## Bitácora

- 2026-10-16: creada en la planeación de la v1.
- 2026-10-16: plan revisado por el product owner en Plannotator. Se agregó al aviso de girar la instrucción para quitar el bloqueo de rotación (una página no puede detectarlo ni abrir el Centro de control).
- 2026-10-16: primera versión: `FIT` a 1280×720, overlay CSS de girar, pausa del juego en vertical (`src/plataforma/orientacion.ts`) y escena `Arranque` con "Toca para empezar" y sonido de prueba. Phaser 3.90 desbloquea el audio solo con el primer toque; `Arranque` espera el evento `UNLOCKED` si hace falta.
- 2026-10-16: sonido de prueba `public/audio/prueba.m4a` (6.8 KB, AAC, 0.7 s): "ding" de dos notas (Mi5 → Si5) generado por un script propio de Node, sin licencias de terceros, y convertido con `afconvert -f m4af -d aac -b 64000 prueba.wav prueba.m4a`. Script para regenerarlo (`node genera-prueba.mjs prueba.wav`):

  ```js
  import { writeFileSync } from 'node:fs';
  const rate = 44100, dur = 0.7, n = Math.floor(rate * dur);
  const notas = [[659.25, 0], [987.77, 0.15]]; // [Hz, inicio s]
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / rate; let v = 0;
    for (const [f, ini] of notas) {
      if (t < ini) continue;
      const u = t - ini, env = Math.min(1, u / 0.005) * Math.exp(-u * 6);
      v += env * (Math.sin(2 * Math.PI * f * u) + 0.3 * Math.sin(4 * Math.PI * f * u));
    }
    pcm[i] = Math.max(-1, Math.min(1, v * 0.4)) * 32767;
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(n * 2, 40);
  writeFileSync(process.argv[2], Buffer.concat([h, Buffer.from(pcm.buffer)]));
  ```
- 2026-10-16: el Chromium de las pruebas automáticas (Playwright) no trae códec AAC. La reproducción se verificó ahí con un WAV temporal, que después se borró; en el iPhone se probó el `.m4a` real.
- 2026-10-16: primera prueba en el iPhone: aviso, giro y sonido funcionan, pero quedaban **franjas negras** a los lados y se veía la **barra de Safari**. Decisiones del product owner:
  - **Ancho dinámico** (`src/plataforma/escala.ts`): altura lógica fija de 720, ancho entre 1280 y 1872 según la pantalla. Lo importante va en la zona segura central de 1280×720.
  - **Pantalla de inicio**: Safari en iPhone no deja esconder su barra; se agregaron meta tags para abrir el juego sin barras desde un ícono en la pantalla de inicio.
- 2026-10-16: segunda prueba: seguían franjas a los lados y abajo. Causa: el `padding` de safe areas del plan. Se quitó y el juego ahora llena toda la pantalla, también bajo el notch. Los controles y el HUD deben dejar ≈40 px libres abajo (barra de inicio).
- 2026-10-16: **bug de audio** en el build de producción: "no se pudo decodificar" (`EncodingError`), incluso con WAV. Causa: la ruta relativa del audio se resolvía contra la URL de la página; con la pestaña en una subruta (`/trick-r-treat/trick-r-treat/`) se pedía un archivo inexistente, y `vite preview` respondía con `index.html` (200). Arreglo: `loader.baseURL = import.meta.env.BASE_URL` en `main.ts`. Se encontró con un diagnóstico temporal en pantalla; queda uno permanente y pequeño en `Arranque` que dice por qué no hay sonido.
- 2026-10-16: verificación final. En el navegador: `npm run build` pasa, el ancho dinámico funciona en 2.58:1, 2.17:1 y 16:9, el aviso funciona al girar y los assets cargan con la base `/trick-r-treat/` (`npm run preview`), incluso desde una subruta. En el iPhone (product owner): en Safari, el juego llena la pantalla sin deformarse, aparece el aviso en vertical y desaparece al girar, y el sonido suena tras el primer toque; desde la pantalla de inicio se ve sin barras y suena.
- 2026-10-16: pendientes para el orquestador (fuera del alcance de esta rama):
  - Diseño: el juego se abre desde la pantalla de inicio, no solo desde Safari (`docs/diseno/concepto.md`).
  - Tarea nueva: tutorial de "agrega este juego a tu pantalla de inicio", con ilustraciones propias que marquen dónde tocar en Safari de iOS 26 o superior; solo aparece si el juego no se abrió desde el ícono (`navigator.standalone`). Incluye el ícono y el manifest. El nombre en la pantalla de inicio depende de T-018. (El orquestador la creó como T-032.)
  - Enlazar el plan en el tablero.
- 2026-10-16: **pruebas automáticas**. Con la regla nueva de `CLAUDE.md` (todo plan lleva "Pruebas"), el product owner decidió meter en esta tarea unit tests (Vitest, llega con T-006) y tests end-to-end con Playwright, y esperar a T-006 para abrir el PR. El orquestador aprobó el reparto: cuando T-006 esté en `main`, esta rama toma `package.json` y `package-lock.json` (`@playwright/test` 1.63.0 exacta, script `test:e2e`) y `.github/workflows/deploy.yml` (después, el orquestador pidió un job propio `e2e` en vez de un paso dentro de `build`); `playwright.config.ts`, `e2e/` y el puerto 5193 son de esta rama; `tsconfig.json` no se toca. Se eligió 1.63.0 (del 2026-09-04) y no 1.64.x, que salió hace días. E2e mínimos, uno por criterio; lo demás va a otra tarea. Antes de esperar a T-006 se separó la lógica de `src/plataforma/` en funciones que no cargan Phaser (`calcularAncho`, `pausarEnVertical` con `matchMedia` inyectable, `motivoSinAudio`), para poder probarlas en Node.
- 2026-10-16: el orquestador pidió que las reglas de pantalla y assets para `CLAUDE.md` (zona segura central de 1280×720 con ancho variable; rutas del loader sin `/` inicial, porque la base la pone `loader.baseURL`) se agreguen en esta rama, porque describen su código. Se agregaron junto con el comando `npm run test:e2e`, y el product owner las revisa en Plannotator antes del commit.
- 2026-10-16: **tests hechos**. Se trajo `main` dos veces (T-006 con Vitest; T-031 con el ruleset que exige `tests` y `build` en verde y la rama al día), sin conflictos.
  - Unit tests en `src/plataforma/*.test.ts`: 14 casos de ancho dinámico, reescalado, pausa al girar y motivos de "sin sonido".
  - E2e en `e2e/pantalla.e2e.ts` (WebKit, iPhone 17 en horizontal): 4 tests (llena la pantalla sin deformarse, aviso en vertical, audio desde la base en la raíz y en una subruta). Se llaman `*.e2e.ts` para que Vitest no los tome.
  - CI: job propio `e2e` en `deploy.yml`, también en `needs` de `deploy`; no se agregó al ruleset (decisión pendiente del product owner). `test-results/` va al `.gitignore`.
  - En `playwright.config.ts` se declaró `process` a mano, porque el archivo queda fuera del `tsconfig` y no hay `@types/node`; así no hace falta otra dependencia.
  - Resultado local: Vitest 32/32, Playwright 4/4, build y `actionlint` OK. Se comprobó que los tests fallan al reintroducir los bugs de hoy (ancho fijo y rutas sin `loader.baseURL`).
