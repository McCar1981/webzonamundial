#!/usr/bin/env python3
"""
Generador de cromos usando Gemini 3.1 Flash Image.
Parsea PROMPTS_CROMOS_FASE_GRUPOS.md y genera las imagenes via API REST.
Uso:
    python generar-cromos-gemini.py [--start N] [--end N] [--serie partidos|especial|grupos|sedes|all]
"""

import argparse
import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

# ─── Configuracion ───────────────────────────────────────────────────────────
API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    print("Error: define GEMINI_API_KEY en el entorno.", file=sys.stderr)
    sys.exit(1)
MODEL = "gemini-3.1-flash-image"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

MD_FILE = Path(__file__).parent.parent / "PROMPTS_CROMOS_FASE_GRUPOS.md"
OUT_DIR = Path(__file__).parent.parent / "public" / "cromos" / "fase-grupos"

# Subcarpetas de salida
OUTPUT_DIRS = {
    "partidos": OUT_DIR / "partidos",
    "especial": OUT_DIR / "edicion-especial",
    "grupos": OUT_DIR / "grupos",
    "sedes": OUT_DIR / "sedes",
}

# Rate limits (RPM) — Gemini 3.1 Flash Image tiene limites generosos
# Usamos delay conservador para evitar 429
DELAY_SECONDS = 4

# ─── Parseo del Markdown ─────────────────────────────────────────────────────

def parse_cromos(md_path: Path):
    """
    Extrae todos los cromos del archivo MD.
    Retorna lista de dicts: {id, rarity, type, title, prompt, serie}
    """
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    cromos = []
    current = None
    collecting_prompt = False
    prompt_lines = []

    # Regex para headers como: ### 001 · 🔶 Legendario · Partido — Jornada 1
    header_re = re.compile(
        r"^###\s+(\d+)\s+·\s+([🔶🟡⚪])\s+(Legendario|Oro|Plata)\s+·\s+(.*)"
    )
    # Linea de titulo del partido: **Equipo A vs Equipo B** · Estadio · fecha
    title_re = re.compile(r"^\*\*(.+)\*\*\s+·\s+(.+)")

    i = 0
    while i < len(lines):
        line = lines[i]

        m = header_re.match(line)
        if m:
            # Guardar el anterior si habia
            if current and prompt_lines:
                current["prompt"] = " ".join(prompt_lines).strip()
                cromos.append(current)

            cromo_id = m.group(1)
            rarity_emoji = m.group(2)
            rarity = m.group(3)
            ctype = m.group(4).strip()

            rarity_map = {"🔶": "legendario", "🟡": "oro", "⚪": "plata"}
            current = {
                "id": int(cromo_id),
                "rarity_emoji": rarity_emoji,
                "rarity": rarity_map.get(rarity_emoji, rarity.lower()),
                "type": ctype,
                "title": "",
                "prompt": "",
                "serie": infer_serie(int(cromo_id), ctype),
            }
            prompt_lines = []
            collecting_prompt = False
            i += 1
            continue

        # Titulo del cromo (linea siguiente al header generalmente)
        if current and not current["title"] and not collecting_prompt:
            tm = title_re.match(line.strip())
            if tm:
                current["title"] = f"{tm.group(1)} · {tm.group(2)}"
                i += 1
                continue
            elif line.strip().startswith("**"):
                # Formato alternativo
                current["title"] = line.strip().replace("**", "")
                i += 1
                continue

        # Prompt empieza con > Cromo coleccionable...
        if current and line.strip().startswith("> "):
            collecting_prompt = True
            prompt_lines.append(line.strip()[2:])
            i += 1
            continue

        if collecting_prompt:
            if line.strip() == "" or line.startswith("###"):
                # Fin del prompt
                collecting_prompt = False
                if current and prompt_lines:
                    current["prompt"] = " ".join(prompt_lines).strip()
                    cromos.append(current)
                    current = None
                    prompt_lines = []
                if line.startswith("###"):
                    continue  # Reprocesar este header
            else:
                prompt_lines.append(line.strip())
            i += 1
            continue

        i += 1

    # Ultimo cromo
    if current and prompt_lines:
        current["prompt"] = " ".join(prompt_lines).strip()
        cromos.append(current)

    return cromos


def infer_serie(cromo_id: int, ctype: str) -> str:
    """Determina la carpeta destino segun el tipo/ID."""
    if "Partido" in ctype and cromo_id <= 72:
        return "partidos"
    if "Edición Especial" in ctype or "Edicion Especial" in ctype or ("Especial" in ctype and cromo_id > 72):
        return "especial"
    if "Grupo" in ctype:
        return "grupos"
    if "Sede" in ctype or "Estadio" in ctype:
        return "sedes"
    # Fallback por ID
    if 1 <= cromo_id <= 72:
        return "partidos"
    if 73 <= cromo_id <= 122:
        return "especial"
    if 123 <= cromo_id <= 134:
        return "grupos"
    if 135 <= cromo_id <= 150:
        return "sedes"
    return "partidos"


# ─── Generacion de imagenes ──────────────────────────────────────────────────

def generate_image(prompt: str, api_key: str, filename: str) -> bool:
    """
    Llama a la API de Gemini para generar una imagen.
    Retorna True si exito.
    """
    url = f"{BASE_URL}?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["Text", "Image"],
            "temperature": 0.7,
        }
    }

    headers = {"Content-Type": "application/json"}

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        if resp.status_code != 200:
            print(f"  HTTP {resp.status_code}: {resp.text[:200]}")
            return False

        data = resp.json()

        # Buscar la parte de imagen en la respuesta
        candidates = data.get("candidates", [])
        if not candidates:
            print(f"  Sin candidatos en respuesta")
            return False

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])

        image_data = None
        for part in parts:
            if "inlineData" in part:
                image_data = part["inlineData"]["data"]
                break

        if not image_data:
            # Puede que devuelva texto explicando que no puede generar imagenes
            text_parts = [p.get("text", "") for p in parts if "text" in p]
            if text_parts:
                print(f"  Respuesta texto (no imagen): {' '.join(text_parts)[:200]}")
            else:
                print(f"  No se encontro imagen en la respuesta")
            return False

        # Guardar imagen
        img_bytes = base64.b64decode(image_data)
        with open(filename, "wb") as f:
            f.write(img_bytes)

        print(f"  Guardado: {filename} ({len(img_bytes)} bytes)")
        return True

    except Exception as e:
        print(f"  Error: {e}")
        return False


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    # Windows: forzar UTF-8 en stdout
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Genera cromos con Gemini")
    parser.add_argument("--start", type=int, default=1, help="ID inicial (1-150)")
    parser.add_argument("--end", type=int, default=150, help="ID final (1-150)")
    parser.add_argument("--serie", choices=["partidos", "especial", "grupos", "sedes", "all"],
                        default="all", help="Serie a generar")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que generaria")
    parser.add_argument("--force", action="store_true", help="Regenerar aunque exista")
    args = parser.parse_args()

    print(f"Leyendo prompts de: {MD_FILE}")
    if not MD_FILE.exists():
        print(f"ERROR: No se encuentra {MD_FILE}")
        sys.exit(1)

    cromos = parse_cromos(MD_FILE)
    print(f"Total cromos parseados: {len(cromos)}")

    # Filtrar
    filtered = [c for c in cromos
                if args.start <= c["id"] <= args.end
                and (args.serie == "all" or c["serie"] == args.serie)]

    print(f"Cromos a generar: {len(filtered)}")
    print(f"Rango: {args.start}-{args.end} | Serie: {args.serie}")
    print("-" * 60)

    if args.dry_run:
        for c in filtered:
            out_dir = OUTPUT_DIRS.get(c["serie"], OUT_DIR)
            fname = f"cromo_{c['id']:03d}_{c['rarity']}.png"
            fpath = out_dir / fname
            print(f"[{c['id']:03d}] {c['rarity_emoji']} {c['type']}")
            print(f"      -> {fpath}")
            print(f"      Prompt: {c['prompt'][:100]}...")
            print()
        return

    # Generar
    ok_count = 0
    fail_count = 0
    skip_count = 0

    for idx, c in enumerate(filtered, 1):
        out_dir = OUTPUT_DIRS.get(c["serie"], OUT_DIR)
        out_dir.mkdir(parents=True, exist_ok=True)

        fname = f"cromo_{c['id']:03d}_{c['rarity']}.png"
        fpath = out_dir / fname

        print(f"[{idx}/{len(filtered)}] Cromo {c['id']:03d} — {c['rarity_emoji']} {c['type']}")
        print(f"      {c['title'][:80]}")

        if fpath.exists() and not args.force:
            print(f"  YA EXISTE (skip)")
            skip_count += 1
            continue

        success = generate_image(c["prompt"], API_KEY, str(fpath))
        if success:
            ok_count += 1
        else:
            fail_count += 1

        # Rate limit
        if idx < len(filtered):
            time.sleep(DELAY_SECONDS)

    print("-" * 60)
    print(f"Resumen: {ok_count} OK | {fail_count} FALLIDOS | {skip_count} SKIPPED")


if __name__ == "__main__":
    main()
