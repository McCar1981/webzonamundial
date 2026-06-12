#!/usr/bin/env python3
"""
Generador de sobres/cromos del Mundial usando Gemini 3.1 Flash Image.
Basado en generar-cromos-gemini.py, pero genera imagenes de sobres
fisicos de 7 u 8 cromos en vez de cromos individuales.

Uso:
    python generar-sobres-gemini.py --count 20 [--variant 7|8|random] [--dry-run]
"""

import argparse
import random
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

# Variantes de contenido por sobre
VARIANT_SIZES = [7, 8]
DELAY_SECONDS = 4


def build_prompt(count: int) -> str:
    """
    Construye el prompt para generar un sobre de cromos del Mundial.
    count: 7 u 8 cromos.
    """
    return (
        f"Premium foil sticker pack for the FIFA World Cup 2026, "
        f"official collectible album style, sealed rectangular pack, "
        f"vibrant holographic wrapper in gold, green and navy blue, "
        f"soccer ball, World Cup trophy and stadium motifs, "
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
    parser.add_argument("--count", type=int, default=10, help="Numero de sobres a generar")
    parser.add_argument("--variant", choices=["7", "8", "random"], default="random",
                        help="Cromos por sobre: 7, 8 o aleatorio")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que generaria")
    parser.add_argument("--force", action="store_true", help="Regenerar aunque existan")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not API_KEY and not args.dry_run:
        print("ERROR: Define la variable de entorno GEMINI_API_KEY")
        sys.exit(1)

    variant_pref = None if args.variant == "random" else int(args.variant)

    print(f"Sobres a generar: {args.count}")
    print(f"Variante: {args.variant}")
    print(f"Salida: {OUT_DIR}")
    print("-" * 60)

    ok_count = 0
    fail_count = 0
    skip_count = 0

    for idx in range(1, args.count + 1):
        count = variant_pref if variant_pref else random.choice(VARIANT_SIZES)
        fname = f"sobre_{idx:03d}_{count}cromos.png"
        fpath = OUT_DIR / fname

        print(f"[{idx}/{args.count}] Sobre {idx:03d} — {count} cromos")

        if fpath.exists() and not args.force:
            print(f"  YA EXISTE (skip)")
            skip_count += 1
            continue

        prompt = build_prompt(count)

        if args.dry_run:
            print(f"  -> {fpath}")
            print(f"  Prompt: {prompt[:100]}...")
            continue

        success = generate_image(prompt, API_KEY, str(fpath))
        if success:
            ok_count += 1
        else:
            fail_count += 1

        if idx < args.count:
            time.sleep(DELAY_SECONDS)

    print("-" * 60)
    print(f"Resumen: {ok_count} OK | {fail_count} FALLIDOS | {skip_count} SKIPPED")


if __name__ == "__main__":
    main()
