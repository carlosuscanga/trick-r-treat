#!/usr/bin/env bash
# Corre una celda de evaluación del skill rendimiento-y-memoria (T-035).
# Uso: bash docs/planes/T-035-evaluaciones/correr.sh <e0..e4> <sonnet|opus> <con|sin> <destino>
# Detalle: docs/planes/T-035-evaluaciones/README.md. No borra nada: cada celda es una carpeta nueva.
set -euo pipefail

EVAL="$1"; MODELO_CORTO="$2"; BRAZO="$3"; DESTINO="$4"
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAMA="$(cd "$AQUI/../../.." && pwd)"
LIMITE_SEG=1800

case "$MODELO_CORTO" in
  sonnet) MODELO=claude-sonnet-5-5 ;;
  opus) MODELO=claude-opus-5-5 ;;
  *) echo "modelo desconocido: $MODELO_CORTO" >&2; exit 2 ;;
esac
case "$BRAZO" in con|sin) ;; *) echo "brazo desconocido: $BRAZO" >&2; exit 2 ;; esac
ARCHIVO_EVAL="$(ls "$AQUI/$EVAL"-*.md)"

CELDA="$DESTINO/$EVAL-$MODELO_CORTO-$BRAZO"
[ -e "$CELDA" ] && CELDA="$CELDA-$(date +%H%M%S)"
REPO="$CELDA/repo"
mkdir -p "$REPO"

# 1. Base: origin/main sin el material de T-035 (la corrida no debe ver rúbricas ni el plan).
git -C "$RAMA" archive origin/main -- . ':(exclude)docs/planes/T-035-*' | tar -x -C "$REPO"
if ls -d "$REPO"/docs/planes/T-035* >/dev/null 2>&1; then
  echo "contaminación: quedó docs/planes/T-035 en la corrida" >&2; exit 3
fi

# 2. Brazo "con": lo único distinto es el skill, la regla por ruta y CLAUDE.md de la rama.
if [ "$BRAZO" = con ]; then
  mkdir -p "$REPO/.claude/skills" "$REPO/.claude/rules"
  cp -R "$RAMA/.claude/skills/rendimiento-y-memoria" "$REPO/.claude/skills/"
  cp "$RAMA/.claude/rules/rendimiento.md" "$REPO/.claude/rules/"
  cp "$RAMA/CLAUDE.md" "$REPO/CLAUDE.md"
fi
[ "$EVAL" = e4 ] && cp "$AQUI/e4-diff-sembrado.patch" "$REPO/revision.patch"

# 3. node_modules enlazado, puerto de e2e único y git local sin remoto.
ln -s "$RAMA/node_modules" "$REPO/node_modules"
PUERTO=$((5200 + RANDOM % 700))
perl -pi -e "s/5193/$PUERTO/g" "$REPO/playwright.config.ts"
git -C "$REPO" init -q
echo node_modules >> "$REPO/.git/info/exclude"
git -C "$REPO" add -A
git -C "$REPO" -c user.name=eval -c user.email=eval@local commit -qm base

PROMPT="$(awk '/^## Prompt/{f=1;next} /^## /{f=0} f' "$ARCHIVO_EVAL" | sed '/^[[:space:]]*$/d')"
echo "$PROMPT" > "$CELDA/prompt.txt"

# 4. La corrida, con límite de tiempo.
export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"
set +e
(
  cd "$REPO" && env -u CLAUDECODE claude -p "$PROMPT" --model "$MODELO" --effort high \
    --permission-mode acceptEdits \
    --allowedTools "Bash(npm test:*)" "Bash(npm run:*)" "Bash(npx vitest:*)" "Bash(npx playwright:*)" \
                   "Bash(npx tsc:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(grep:*)" \
                   "Bash(git status:*)" "Bash(git diff:*)" "Bash(git log:*)" \
    --disallowedTools "Bash(git commit:*)" "Bash(git push:*)" "Bash(gh:*)" "Bash(ssh:*)" \
                      "Bash(npm install:*)" "Bash(npm i:*)" "Bash(npm ci:*)" \
    --append-system-prompt "Modo evaluación: no hagas preguntas ni commits. Si te falta información, decide y anota el supuesto en tu respuesta final." \
    --output-format stream-json --verbose --max-turns 60 --no-session-persistence \
    > "$CELDA/transcript.jsonl" 2> "$CELDA/stderr.txt"
) &
PID=$!
( sleep "$LIMITE_SEG" && kill "$PID" 2>/dev/null && echo cortada > "$CELDA/.cortada" ) &
VIGIA=$!
disown "$VIGIA"
wait "$PID"; SALIDA=$?
kill "$VIGIA" 2>/dev/null
set -e

# 5. Resultados.
git -C "$REPO" add -A
git -C "$REPO" diff --cached > "$CELDA/cambios.patch"
python3 -I - "$CELDA" "$SALIDA" <<'PY'
import json, sys
from pathlib import Path
celda, salida = Path(sys.argv[1]), int(sys.argv[2])
respuesta, activado, termino = "", False, False
for linea in (celda / "transcript.jsonl").read_text(errors="replace").splitlines():
    try:
        ev = json.loads(linea)
    except json.JSONDecodeError:
        continue
    if ev.get("type") == "result":
        termino = True
        respuesta = ev.get("result") or respuesta
    for c in (ev.get("message") or {}).get("content", []) if ev.get("type") == "assistant" else []:
        if c.get("type") != "tool_use":
            continue
        entrada = c.get("input") or {}
        if c.get("name") == "Skill" and "rendimiento-y-memoria" in str(entrada.get("skill", "")):
            activado = True
        if c.get("name") == "Read" and "rendimiento-y-memoria/SKILL.md" in str(entrada.get("file_path", "")):
            activado = True
    if ev.get("type") == "assistant":
        textos = [c.get("text", "") for c in ev["message"].get("content", []) if c.get("type") == "text"]
        if textos and not termino:
            respuesta = "\n".join(textos)
estado = "sin terminar" if (celda / ".cortada").exists() else ("terminó" if termino and salida == 0 else "error")
(celda / "respuesta.md").write_text(respuesta)
(celda / "skill-activado.txt").write_text("si\n" if activado else "no\n")
(celda / "estado.txt").write_text(estado + "\n")
print(f"{celda.name}: {estado}, skill={'si' if activado else 'no'}")
PY
