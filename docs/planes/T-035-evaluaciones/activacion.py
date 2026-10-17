#!/usr/bin/env python3
"""Evaluación 5 de T-035: ¿se activa el skill rendimiento-y-memoria cuando debe?

Uso (desde la raíz del repo):
  python3 -I docs/planes/T-035-evaluaciones/activacion.py --variante sin-paths --modelo claude-sonnet-5-5 --destino DIR

A diferencia de run_eval.py de skill-creator (que prueba la description con un comando temporal),
aquí el skill se instala de verdad en una copia de origin/main, así que también se puede probar `paths`.
Cada consulta corre en modo plan (solo lectura). No borra nada.
"""

import argparse
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAMA = AQUI.parents[2]
SKILL = "rendimiento-y-memoria"
PATHS = 'paths: ["src/**", "docs/planes/**"]'


def preparar_base(destino: Path, variante: str) -> Path:
    """Exporta origin/main (sin material de T-035) y copia encima solo el skill."""
    base = destino / f"base-{variante}"
    if base.exists():
        return base
    base.mkdir(parents=True)
    archivo = subprocess.run(
        ["git", "-C", str(RAMA), "archive", "origin/main", "--", ".", ":(exclude)docs/planes/T-035-*"],
        check=True, capture_output=True,
    ).stdout
    subprocess.run(["tar", "-x", "-C", str(base)], input=archivo, check=True)
    if list((base / "docs/planes").glob("T-035*")):
        sys.exit("contaminación: quedó docs/planes/T-035 en la base")
    destino_skill = base / ".claude/skills" / SKILL
    destino_skill.mkdir(parents=True)
    subprocess.run(["cp", "-R", f"{RAMA}/.claude/skills/{SKILL}/.", str(destino_skill)], check=True)
    if variante == "con-paths":
        skill_md = destino_skill / "SKILL.md"
        texto = skill_md.read_text()
        assert "\npaths:" not in texto, "el SKILL.md ya trae paths"
        skill_md.write_text(texto.replace(f"name: {SKILL}\n", f"name: {SKILL}\n{PATHS}\n", 1))
    if variante == "con-config":
        # Lo que entrega el PR: además del skill, la regla por ruta y la línea en CLAUDE.md.
        (base / ".claude/rules").mkdir(parents=True, exist_ok=True)
        subprocess.run(["cp", f"{RAMA}/.claude/rules/rendimiento.md", str(base / ".claude/rules/")], check=True)
        subprocess.run(["cp", f"{RAMA}/CLAUDE.md", str(base / "CLAUDE.md")], check=True)
    return base


def activa(evento: dict) -> bool:
    if evento.get("type") != "assistant":
        return False
    for c in evento.get("message", {}).get("content", []):
        if c.get("type") != "tool_use":
            continue
        entrada = c.get("input") or {}
        if c.get("name") == "Skill" and SKILL in str(entrada.get("skill", "")):
            return True
        if c.get("name") == "Read" and f"{SKILL}/SKILL.md" in str(entrada.get("file_path", "")):
            return True
    return False


def correr_consulta(consulta: str, base: Path, modelo: str, limite: int) -> bool:
    cmd = [
        "claude", "-p", consulta, "--model", modelo, "--permission-mode", "plan",
        "--output-format", "stream-json", "--verbose", "--max-turns", "8", "--no-session-persistence",
    ]
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    proc = subprocess.Popen(cmd, cwd=base, env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    inicio = time.time()
    try:
        for linea in proc.stdout:
            if time.time() - inicio > limite:
                return False
            try:
                evento = json.loads(linea)
            except json.JSONDecodeError:
                continue
            if activa(evento):
                return True
            if evento.get("type") == "result":
                return False
        return False
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--variante", choices=["sin-paths", "con-paths", "con-config"], required=True)
    p.add_argument("--modelo", required=True)
    p.add_argument("--destino", required=True, type=Path)
    p.add_argument("--consultas", type=Path, default=AQUI / "activacion.json")
    p.add_argument("--paralelo", type=int, default=5)
    p.add_argument("--limite", type=int, default=180, help="segundos por consulta")
    a = p.parse_args()

    consultas = json.loads(a.consultas.read_text())
    base = preparar_base(a.destino, a.variante)
    with ThreadPoolExecutor(max_workers=a.paralelo) as ex:
        activadas = list(ex.map(lambda c: correr_consulta(c["query"], base, a.modelo, a.limite), consultas))

    resultados = [
        {"query": c["query"], "should_trigger": c["should_trigger"], "activado": act,
         "pass": act == c["should_trigger"]}
        for c, act in zip(consultas, activadas)
    ]
    resumen = {
        "aciertos": sum(r["activado"] for r in resultados if r["should_trigger"]),
        "deben_activar": sum(r["should_trigger"] for r in resultados),
        "falsos_positivos": sum(r["activado"] for r in resultados if not r["should_trigger"]),
        "no_deben": sum(not r["should_trigger"] for r in resultados),
    }
    salida = a.destino / f"activacion-{a.variante}-{a.modelo}.json"
    salida.write_text(json.dumps({"variante": a.variante, "modelo": a.modelo, "resumen": resumen,
                                  "resultados": resultados}, ensure_ascii=False, indent=2))
    print(f"{salida.name}: {resumen}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
