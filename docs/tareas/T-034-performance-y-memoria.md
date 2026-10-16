---
id: T-034
titulo: Investigar performance, memoria y caché
tipo: investigacion
hito: H1
estado: en-progreso
prioridad: alta
depende: [T-003]
plan: ../planes/T-034-performance-y-memoria.md
---

## Qué

Investigar cómo escribir el juego eficiente desde el principio en Phaser 3.90 + Vite + Safari en iOS + GitHub Pages: carga inicial y bundle, memoria (texturas, audio, ciclo de vida de escenas, pooling), rendimiento por frame, caché y red, y cómo medir. El piso es el **iPhone 13 con iOS 26.6.x**: los presupuestos se calculan para él.

Además, buscar si ya existen documentación o skills de Anthropic parecidos (por ejemplo, skills públicos de programación eficiente, de juegos o de frontend, y la guía oficial para escribir skills) y reutilizar lo que sirva. También se pueden usar otras fuentes confiables sobre programación de videojuegos web: documentación de Phaser, WebKit, MDN y artículos técnicos con mediciones.

El entregable es una guía en `docs/planes/T-034-performance-y-memoria.md`, escrita para convertirse en un skill del repo (`.claude/skills/`). El skill no se crea en esta tarea: va en su propia tarea y PR, con el OK del product owner. No se modifica `src/` ni se agregan dependencias.

## Por qué

Una partida dura de 10 a 15 minutos entrando y saliendo de escenas, con arte, audio y físicas. Si las primeras tareas de código (T-004 en adelante) nacen sin reglas de memoria y gráficos, las fugas y caídas de fps aparecen tarde, cuando corregirlas cuesta más. Con la guía, cada sesión que programe sabe qué hacer y cómo verificarlo.

## Criterios de aceptación

- [ ] Responde las preguntas A a E del prompt de investigación (carga, memoria, frames, caché y medición), aterrizadas al stack del proyecto.
- [ ] Reglas accionables por tema, cada una con qué hacer, por qué (fuente o medición), ejemplo en Phaser 3.90 y cómo se verifica.
- [ ] Presupuestos con números para el iPhone 13: bundle, assets por escena, memoria de texturas, fps mínimo y tiempo de carga.
- [ ] Checklist para revisar PRs, y qué aplicar ya y qué medir después en el iPhone.
- [ ] Cada afirmación marcada como verificada (fuente, medición o prueba) o como hipótesis por confirmar en el iPhone.
- [ ] Revisión de documentación y skills de Anthropic parecidos y de fuentes confiables de videojuegos web: qué se reutiliza, qué se descarta y por qué.
- [ ] Propuesta del skill (nombre, descripción que lo active y secciones) y de las tareas nuevas, sin crearlas.
- [ ] Pruebas: esta tarea no trae código, así que no aplican unitarias, e2e ni prueba manual; la guía define cómo meter los presupuestos en las tres capas.

## Bitácora

- 2026-10-16: creada antes de T-004, para que el código del juego nazca con reglas de performance. Contexto y prompt en `.local/prompts/investigacion-performance.md`.
