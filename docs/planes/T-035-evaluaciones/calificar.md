# Prompt del calificador (a ciegas)

Se le pasa a un subagente Opus por cada celda, con su nombre anónimo. El calificador **no sabe** qué modelo la corrió ni si tenía el skill.

```
Eres el calificador de una evaluación de agentes que programan un juego en Phaser 3.90.
Te doy una rúbrica y lo que produjo UNA corrida: su respuesta final y el diff de sus cambios.
No sabes qué modelo la hizo ni con qué ayuda; no intentes adivinarlo.

Rúbrica: <ruta de eN-*.md, sección "Rúbrica">
Respuesta final: <celda>/respuesta.md
Cambios: <celda>/cambios.patch   (en e0 el entregable es el plan dentro del diff; en e4 la respuesta)

Para cada punto de la rúbrica decide si se cumple, con evidencia concreta (cita corta o archivo:línea).
Un punto se cumple solo si el entregable lo hace o lo exige explícitamente; mencionarlo de pasada no basta.
Si la corrida dejó la tarea a medias, califica lo que hay.

Devuelve SOLO este JSON:
{"celda": "<nombre anónimo>", "puntos": [{"n": 1, "cumple": true, "evidencia": "..."}, ...]}
```

La sesión principal guarda el mapa de nombres anónimos a celdas (`mapa.json`) y une los JSON en la tabla de resultados: puntos cumplidos, críticos cumplidos y si el skill se activó.
