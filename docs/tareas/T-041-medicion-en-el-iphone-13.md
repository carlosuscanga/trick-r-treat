---
id: T-041
titulo: Medición en el iPhone 13 y calibración de presupuestos
tipo: investigacion
hito: H2
estado: pendiente
prioridad: alta
depende: [T-037]
plan: null
---

## Qué

Medir en el iPhone 13 (iOS 26.6) lo que la guía de T-034 dejó como hipótesis (🔬): el techo real de memoria, la huella de la pestaña, fps y tiempos de carga, y calibrar con eso los presupuestos de la sección 5. Usa el overlay `?depurar` de T-037, Web Inspector y `xctrace`. Se hace en H2 con placeholders y **se repite en H3** con el primer arte real.

## Por qué

Los presupuestos de tiempo y memoria son SLOs calculados, no medidos en el teléfono. iOS no publica un límite de memoria por pestaña: si el juego se pasa, Safari recarga la página sin avisar (ROB-02). Medir convierte los 🔬 en ✅ antes de multiplicar el arte y los minijuegos.

## Criterios de aceptación

- [ ] Web Inspector conectado al iPhone, también para la web app de la pantalla de inicio (M1, M4).
- [ ] Techo real de memoria con una prueba de estrés, en Safari y en la pantalla de inicio (el modo oficial, decisión 5), y huella de WebContent + GPU con `xctrace` (sección 7).
- [ ] Medidos `getMaxTextureSize()`, `sampleRate`, `baseLatency` y `outputLatency` (bocina y Bluetooth), Modo de bajo consumo y ProMotion (M11, M12) y calor en 15 min (M15).
- [ ] Tabla manual M2 a M15 de la guía con los números reales.
- [ ] Los presupuestos 🔬 de la sección 5 quedan confirmados o corregidos en la guía y en el skill de T-035, con la fecha y el modelo medido.
- [ ] Segunda ronda en H3 con el primer arte real, anotada en la bitácora (o como subtarea).
- [ ] Pruebas: es una investigación sin código, así que no aplican unitarias ni e2e; la prueba manual en el iPhone es la tarea misma.

## Bitácora

- 2026-10-16: creada a partir de la guía de T-034 (sección 9, "Medir después en el iPhone 13").
