---
id: T-050
titulo: Panel de ajustes que recuerda valores y explica cada ajuste
tipo: codigo
hito: H2
estado: pendiente
prioridad: media
depende: [T-004]
plan: null
---

## Qué

Dos mejoras al panel de ajustes de `?depurar` (`src/depurar/panelAjustes.ts`), pedidas por el product owner tras T-004 para afinar en Pages, de forma casual, desde el iPhone:

1. **Recordar los valores** entre visitas, en el navegador (`localStorage`), con un botón "volver a los valores por defecto".
2. **Ayuda (?) en cada ajuste**, con dos partes obligatorias: **qué es**, en palabras simples, y **cómo se prueba**: los pasos en la calle de prueba y qué se debería notar al subir o bajar el valor. Ejemplo: "Curva de velocidad. Qué es: cuánto recorrido del pulgar se queda en velocidades bajas. Cómo probarla: camina con el pulgar cerca del centro del joystick; con más curva es más fácil ir lento, con menos acelera antes." Hoy hay ajustes que no se entienden solo con el nombre (por ejemplo, ápice colgado).

## Por qué

Sin recordar los valores, lo afinado se pierde al recargar. Sin la ayuda, el product owner no sabe qué mueve cada deslizador ni cómo notarlo en el juego.

## Criterios de aceptación

- [ ] Por definir al tomarla (refinar con el product owner).
- [ ] Las pruebas no dependen de lo guardado en `localStorage` (ver `docs/planes/README.md`, "Pruebas").
- [ ] Pruebas en las tres capas (unitarias, e2e y manual).

## Bitácora

- 2026-10-18: creada al refinar T-037, con los dos pedidos que estaban en su bitácora. Se separó para no agrandar la ruta crítica; puede ir en paralelo a T-037 (las dos tocan `src/depurar/`, en archivos distintos).
