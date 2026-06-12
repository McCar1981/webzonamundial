#!/usr/bin/env python3
"""
Generador de sobres/cromos del Mundial usando Gemini 3.1 Flash Image.
Basado en generar-cromos-gemini.py, pero genera N variantes de sobres
sellados. Cada variante tiene un numero distinto de cromos y un tema
visual propio (bronce, plata, oro, esmeralda, zafiro, rubi, diamante...).

Uso:
    python generar-sobres-gemini.py --variants 8 [--copies 1] [--dry-run]
"""

import argparse
import os
import sys
import time
from pathlib import Path

import requests
import base64

# ─── Configuracion ───────────────────────────────────────────────────────────
# Clave de API de Gemini. No hardcodear: usa variable de entorno GEMINI_API_KEY.
API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-3.1-flash-image"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

OUT_DIR = Path(__file__).parent.parent / "public" / "sobres"

DELAY_SECONDS = 4

# Variantes de sobres: nombre, cantidad de cromos, tema visual
# Se pueden generar 7 o 8 variantes; se trunca/ajusta segun --variants.
SOBRE_VARIANTS = [
    {"name": "Bronce",     "cromos": 3,  "theme": "bronze copper foil, earthy tones"},
    {"name": "Plata",      "cromos": 5,  "theme": "silver chrome foil, icy grey tones"},
    {"name": "Oro",        "cromos": 7,  "theme": "gold holographic foil, warm amber tones"},
    {"name": "Esmeralda",  "cromos": 10, "theme": "emerald green foil, tropical green tones"},
    {"name": "Zafiro",     "cromos": 15, "theme": "sapphire blue foil, deep ocean blue tones"},
    {"name": "Rubi",       "cromos": 20, "theme": "ruby red foil, intense crimson tones"},
    {"name": "Diamante",   "cromos": 25, "theme": "diamond platinum foil, prismatic white and cyan tones"},
    {"name": "Legendario", "cromos": 30, "theme": "black gold legendary foil, obsidian and gold ornate details"},
]


def build_prompt(variant: dict) -> str:
    """
    Construye el prompt para generar un sobre de cromos del Mundial.
    variant: dict con name, cromos, theme.
    """
    count = variant["cromos"]
    theme = variant["theme"]
    return (
        f"Premium sealed sticker pack for the FIFA World Cup 2026, "
        f"official collectible album style, rectangular sealed foil pack, "
        f"{theme}, soccer ball and World Cup trophy motifs, "
        f"front text '{count} CROMOS' in bold uppercase typography, "
        f"product photography, soft studio lighting, centered, "
        f"clean background, ultra detailed, realistic."
    )


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
            text_parts = [p.get("text", "") for p in parts if "text" in p]
            if text_parts:
                print(f"  Respuesta texto (no imagen): {' '.join(text_parts)[:200]}")
            else:
                print(f"  No se encontro imagen en la respuesta")
            return False

        img_bytes = base64.b64decode(image_data)
        with open(filename, "wb") as f:
            f.write(img_bytes)

        print(f"  Guardado: {filename} ({len(img_bytes)} bytes)")
        return True

    except Exception as e:
        print(f"  Error: {e}")
        return False


def main():
    # Windows: forzar UTF-8 en stdout
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Genera sobres de cromos con Gemini")
    parser.add_argument("--variants", type=int, choices=[5, 7, 8], default=5,
                        help="Numero de variantes de sobres (5, 7 u 8)")
    parser.add_argument("--copies", type=int, default=1,
                        help="Copias a generar de cada variante")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que generaria")
    parser.add_argument("--force", action="store_true", help="Regenerar aunque existan")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not API_KEY and not args.dry_run:
        print("ERROR: Define la variable de entorno GEMINI_API_KEY")
        sys.exit(1)

    # Para 5 variantes se usan las mas iconicas: Bronce, Plata, Oro, Esmeralda, Legendario.
    variant_indices = {
        5: [0, 1, 2, 3, 7],
        7: [0, 1, 2, 3, 4, 5, 6],
        8: list(range(8)),
    }
    variants = [SOBRE_VARIANTS[i] for i in variant_indices[args.variants]]
    total = len(variants) * args.copies

    print(f"Variantes a generar: {len(variants)}")
    for v in variants:
        print(f"  - {v['name']}: {v['cromos']} cromos")
    print(f"Copias por variante: {args.copies}")
    print(f"Total de imagenes: {total}")
    print(f"Salida: {OUT_DIR}")
    print("-" * 60)

    ok_count = 0
    fail_count = 0
    skip_count = 0
    idx = 0

    for variant in variants:
        for copy in range(1, args.copies + 1):
            idx += 1
            count = variant["cromos"]
            suffix = f"_copy{copy}" if args.copies > 1 else ""
            fname = f"sobre_{variant['name'].lower()}{suffix}_{count}cromos.png"
            fpath = OUT_DIR / fname

            print(f"[{idx}/{total}] {variant['name']} ({copy}/{args.copies}) — {count} cromos")

            if fpath.exists() and not args.force:
                print(f"  YA EXISTE (skip)")
                skip_count += 1
                continue

            prompt = build_prompt(variant)

            if args.dry_run:
                print(f"  -> {fpath}")
                print(f"  Prompt: {prompt[:100]}...")
                continue

            success = generate_image(prompt, API_KEY, str(fpath))
            if success:
                ok_count += 1
            else:
                fail_count += 1

            if idx < total:
                time.sleep(DELAY_SECONDS)

    print("-" * 60)
    print(f"Resumen: {ok_count} OK | {fail_count} FALLIDOS | {skip_count} SKIPPED")


if __name__ == "__main__":
    main()
