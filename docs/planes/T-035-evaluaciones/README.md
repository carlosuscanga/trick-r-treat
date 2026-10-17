# Evaluaciones del skill `rendimiento-y-memoria` (T-035)

Miden si el skill y su regla por ruta cambian lo que hace un agente. Cada evaluación se corre **con** y **sin** el skill, en sesiones nuevas de `claude -p`, y la califica a ciegas un subagente. Diseño y decisiones: [`../T-035-skill-rendimiento-y-memoria.md`](../T-035-skill-rendimiento-y-memoria.md).

| Archivo | Qué es |
|---|---|
| `e0-plan-t004.md` … `e4-revisar-diff.md` | Prompt literal y rúbrica de cada evaluación |
| `e4-diff-sembrado.patch` | El diff con errores sembrados que revisa la evaluación 4 |
| `activacion.json` | 20 consultas para la evaluación 5 (10 deben activar el skill y 10 no) |
| `correr.sh` | Corre una celda: `bash correr.sh <e0..e4> <sonnet\|opus> <con\|sin> <destino>` |
| `activacion.py` | Evaluación 5: `python3 -I activacion.py --variante <sin-paths\|con-paths> --modelo <id> --destino <dir>` |
| `calificar.md` | Prompt del calificador a ciegas |
| `verificar.py` | Revisa que el skill cumpla el diseño (evaluación 6, junto con `claude plugin validate`) |

## Cómo se arma cada corrida

1. Se exporta `origin/main` a una carpeta nueva y se borra `docs/planes/T-035-*`, para que la corrida no vea las rúbricas.
2. En el brazo `con` se copian encima el skill, la regla por ruta y el `CLAUDE.md` de la rama. Es la única diferencia entre brazos.
3. `node_modules` va enlazado, el puerto del e2e es único por celda, y hay un `git init` local sin remoto.
4. `claude -p` con ediciones aceptadas y `npm` permitido; `git commit`, `git push`, `gh`, `ssh` y `npm install` bloqueados. Límite de 30 minutos.

Se vuelven a correr cuando cambie el skill. Las salidas crudas no se versionan (van a `.local/t035/`).
