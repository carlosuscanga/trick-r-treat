#!/usr/bin/env python3
"""Verifica que el skill rendimiento-y-memoria cumpla el diseño de T-035.

Uso (desde la raíz del repo): python3 -I docs/planes/T-035-evaluaciones/verificar.py
Sale con 0 si todo cumple; con 1 y un mensaje por falla si no.
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
SKILL = RAIZ / ".claude/skills/rendimiento-y-memoria"
REGLA = RAIZ / ".claude/rules/rendimiento.md"
GUIA = RAIZ / "docs/planes/T-034-performance-y-memoria.md"

SECCIONES = [
    "Contexto",
    "Reglas no negociables",
    "Bases mínimas",
    "Trampas conocidas",
    "Presupuestos",
    "Plantilla de minijuego",
    "Checklist de PR",
    "Mapa de referencias",
    "Patrones descartados",
]
REFERENCIAS = [
    "escenas-y-fugas.md",
    "texturas-y-gpu.md",
    "audio.md",
    "frames-y-tiempo.md",
    "carga-y-cache.md",
    "robustez.md",
    "medir.md",
    "fuentes.md",
]
IDS_REGLA = ["ESC-01", "ESC-02", "ESC-03", "TEX-07", "AUD-05", "POO-03", "FRA-04", "RED-03", "ROB-01"]

fallas: list[str] = []


def falla(msg: str) -> None:
    fallas.append(msg)


def frontmatter(texto: str) -> tuple[dict[str, str], str]:
    """Devuelve (campos de una línea, cuerpo). Solo lo necesario para este check."""
    if not texto.startswith("---\n"):
        return {}, texto
    fin = texto.index("\n---", 4)
    campos = {}
    for linea in texto[4:fin].splitlines():
        m = re.match(r"^([A-Za-z_-]+):\s*(.*)$", linea)
        if m:
            campos[m.group(1)] = m.group(2).strip()
    return campos, texto[fin + 4 :]


def description_de_la_guia() -> str:
    guia = GUIA.read_text()
    sec = guia[guia.index("## 11."):guia.index("## 12.")]
    bloque = re.search(r"```yaml\n(.*?)\n```", sec, re.S).group(1)
    return bloque.split("description:", 1)[1].strip()


def slug(titulo: str) -> str:
    """Ancla al estilo de GitHub: minúsculas, sin puntuación, espacios → guiones."""
    t = titulo.strip().lower()
    t = re.sub(r"[^\w\- ]", "", t)
    return t.replace(" ", "-")


def anclas(archivo: Path) -> set[str]:
    vistas: dict[str, int] = {}
    res = set()
    for linea in archivo.read_text().splitlines():
        m = re.match(r"^#{1,6}\s+(.*)$", linea)
        if not m:
            continue
        base = slug(m.group(1))
        n = vistas.get(base, 0)
        res.add(base if n == 0 else f"{base}-{n}")
        vistas[base] = n + 1
    return res


def revisar_enlaces(archivo: Path) -> None:
    for destino in re.findall(r"\]\(([^)\s]+)\)", archivo.read_text()):
        if re.match(r"^[a-z]+://", destino) or destino.startswith("mailto:"):
            continue
        ruta, _, ancla = destino.partition("#")
        objetivo = (archivo.parent / ruta).resolve() if ruta else archivo
        if not objetivo.exists():
            falla(f"{archivo.relative_to(RAIZ)}: enlace roto a {destino}")
        elif ancla and objetivo.suffix == ".md" and ancla not in anclas(objetivo):
            falla(f"{archivo.relative_to(RAIZ)}: ancla inexistente {destino}")


def revisar_skill() -> None:
    skill_md = SKILL / "SKILL.md"
    if not skill_md.exists():
        falla(f"no existe {skill_md.relative_to(RAIZ)}")
        return
    texto = skill_md.read_text()
    campos, cuerpo = frontmatter(texto)

    nombre = campos.get("name", "")
    if nombre != SKILL.name or not re.fullmatch(r"[a-z0-9-]+", nombre):
        falla(f"name '{nombre}' no coincide con la carpeta '{SKILL.name}' o no cumple ^[a-z0-9-]+$")
    desc = campos.get("description", "")
    if desc != description_de_la_guia():
        falla("description distinta de la sección 11 de la guía")
    if len(desc) > 1024:
        falla(f"description de {len(desc)} caracteres (máximo 1024)")
    if "<" in desc or ">" in desc:
        falla("description con < o >")
    if "disable-model-invocation" in campos:
        falla("SKILL.md no debe llevar disable-model-invocation")

    lineas = texto.count("\n") + 1
    if lineas > 250:
        falla(f"SKILL.md tiene {lineas} líneas (máximo 250)")
    titulos = re.findall(r"^## (.+)$", cuerpo, re.M)
    pos = -1
    for s in SECCIONES:
        idx = next((i for i, t in enumerate(titulos) if t.startswith(s)), None)
        if idx is None:
            falla(f"SKILL.md: falta la sección '{s}'")
        elif idx < pos:
            falla(f"SKILL.md: la sección '{s}' está fuera de orden")
        else:
            pos = idx
    revisar_enlaces(skill_md)


def revisar_referencias() -> None:
    ref = SKILL / "references"
    if not ref.is_dir():
        falla("no existe references/")
        return
    if any(p.is_dir() for p in ref.iterdir()):
        falla("references/ debe tener un solo nivel (sin subcarpetas)")
    for nombre in REFERENCIAS:
        archivo = ref / nombre
        if not archivo.exists():
            falla(f"falta references/{nombre}")
            continue
        texto = archivo.read_text()
        if texto.count("\n") + 1 > 100 and "## Índice" not in texto:
            falla(f"references/{nombre} pasa de 100 líneas y no tiene '## Índice'")
        revisar_enlaces(archivo)


def revisar_regla() -> None:
    if not REGLA.exists():
        falla(f"no existe {REGLA.relative_to(RAIZ)}")
        return
    texto = REGLA.read_text()
    n = len(texto.rstrip("\n").splitlines())
    if not 10 <= n <= 15:
        falla(f"la regla por ruta tiene {n} líneas (de 10 a 15)")
    if 'paths: ["src/**/*.ts"]' not in texto:
        falla('la regla por ruta no tiene paths: ["src/**/*.ts"]')
    for i in IDS_REGLA:
        if i not in texto:
            falla(f"la regla por ruta no menciona {i}")
    if "rendimiento-y-memoria" not in texto:
        falla("la regla por ruta no nombra el skill")


def revisar_claude_md() -> None:
    lineas = [l for l in (RAIZ / "CLAUDE.md").read_text().splitlines() if "rendimiento-y-memoria" in l]
    if len(lineas) != 1:
        falla(f"CLAUDE.md debe tener exactamente una línea con rendimiento-y-memoria (tiene {len(lineas)})")


def main() -> int:
    revisar_skill()
    revisar_referencias()
    revisar_regla()
    revisar_claude_md()
    for f in fallas:
        print(f"FALLA: {f}")
    if fallas:
        return 1
    print("OK: el skill cumple el diseño de T-035")
    return 0


if __name__ == "__main__":
    sys.exit(main())
