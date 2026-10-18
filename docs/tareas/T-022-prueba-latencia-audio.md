---
id: T-022
titulo: Prueba de latencia de audio en iPhone
tipo: investigacion
hito: H4
estado: pendiente
prioridad: media
depende: [T-003]
plan: null
---

## Qué

Prueba técnica corta (spike): sonar una pista con pulso y medir si los toques en el iPhone se pueden sincronizar con la música.

## Por qué

Es el riesgo conocido de "Baile de esqueletos". Su resultado decide si el tipo Ritmo entra en la v1 (T-023).

## Criterios de aceptación

- [ ] Prueba hecha en el iPhone, con el resultado anotado en la bitácora.
- [ ] Recomendación clara: Ritmo entra, entra con ajustes o pasa a v1.1.

## Bitácora

- 2026-10-16: creada en la planeación de la v1. Puede hacerse en cualquier momento después de T-003.
- 2026-10-18: propuesta del product owner al probar T-004: medir también el sonido como respuesta al control. Usar la calle de prueba (`CallePrueba`) como banco de pruebas: un sonido al saltar y otro al usar Brazos, y repetir las filas 1 a 6 de la prueba manual de T-004 con y sin sonido.
