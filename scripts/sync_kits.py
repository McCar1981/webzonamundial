#!/usr/bin/env python3
"""
Sync kits — copy and rename the 48 first-equipment shirts from
`assets/camiseta frontal-1ERA EQUIPACION/` to `public/img/kits/2026/home/<slug>.png`.

Map asset filenames (uppercase + accents + typos) to repo slugs.

Run from repo root:
    py -3.14 scripts/sync_kits.py
"""
import json
import shutil
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO.parent / "assets" / "camiseta frontal-1ERA EQUIPACION"
DEST = REPO / "public" / "img" / "kits" / "2026" / "home"

# Explicit mapping for asset filename -> slug. Includes typos and accents.
NAME_TO_SLUG = {
    "ALEMANIA": "alemania",
    "ARABIA SAUDITA": "arabia-saudi",
    "AUSTRALIA": "australia",
    "AUSTRIA": "austria",
    "BOSNIA": "bosnia",
    "CABO VERDE": "cabo-verde",
    "CANADA": "canada",
    "CONGO": "rd-congo",
    "COREA DEL SUR": "corea-del-sur",
    "CROACIA": "croacia",
    "CURACAO": "curazao",
    "ECUADOR": "ecuador",
    "ESCOCIA": "escocia",
    "ESPAÑA": "espana",
    "ESTADOS UNIDOS": "estados-unidos",
    "FRANCIA": "francia",
    "GHANA": "ghana",
    "HAITI": "haiti",
    "INGLATERRA": "inglaterra",
    "JAPON": "japon",
    "JORDANIA": "jordania",
    "MARRUECOS": "marruecos",
    "MEXICO": "mexico",
    "NOUIEGA": "noruega",  # typo in source filename
    "NUEVA ZELANDA": "nueva-zelanda",
    "PAISES BAJOS": "paises-bajos",
    "QATAR": "qatar",
    "SENEGAL": "senegal",
    "SUDAFRICA": "sudafrica",
    "SUIZA": "suiza",
    "Uzbekistán": "uzbekistan",
    "argelia": "argelia",
    "argentina": "argentina",
    "belgica": "belgica",
    "brasil": "brasil",
    "colombia": "colombia",
    "costa de marfil": "costa-de-marfil",
    "egipto": "egipto",
    "irak": "irak",
    "iran": "iran",
    "panama": "panama",
    "paraguay": "paraguay",
    "portugal": "portugal",
    "r.checa": "republica-checa",
    "suecia": "suecia",
    "tunez": "tunez",
    "turquia": "turquia",
    "uruguay": "uruguay",
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)

    if not SOURCE.exists():
        print(f"ERROR: Source folder not found: {SOURCE}")
        return

    print(f"Source: {SOURCE}")
    print(f"Dest:   {DEST}")
    print()

    copied = []
    missing_source = []
    extra_source = []

    # Track which mapping entries we successfully process
    processed_keys = set()

    for asset_file in sorted(SOURCE.iterdir()):
        if not asset_file.is_file() or asset_file.suffix.lower() != ".png":
            continue
        stem = asset_file.stem
        slug = NAME_TO_SLUG.get(stem)
        if not slug:
            extra_source.append(stem)
            continue
        target = DEST / f"{slug}.png"
        shutil.copy2(asset_file, target)
        copied.append((stem, slug))
        processed_keys.add(stem)

    # Check the mapping for any entry whose source asset is missing
    for source_name in NAME_TO_SLUG:
        if source_name not in processed_keys:
            missing_source.append(source_name)

    print(f"Copied: {len(copied)}")
    for src, slug in copied:
        print(f"  {src + '.png':<35} -> {slug}.png")

    if missing_source:
        print(f"\n[WARN] Mapping entries with missing source file ({len(missing_source)}):")
        for s in missing_source:
            print(f"  - {s}")

    if extra_source:
        print(f"\n[WARN] Source files without mapping ({len(extra_source)}):")
        for s in extra_source:
            print(f"  - {s}")

    # Verify all 48 slugs in repo have a kit
    print()
    print("=== Final coverage check ===")
    teams_dir = REPO / "data" / "teams"
    repo_slugs = sorted(
        f.stem for f in teams_dir.glob("*.json") if not f.name.startswith("_")
    )
    have_kit = []
    no_kit = []
    for slug in repo_slugs:
        if (DEST / f"{slug}.png").exists():
            have_kit.append(slug)
        else:
            no_kit.append(slug)
    print(f"  Slugs with kit: {len(have_kit)}/{len(repo_slugs)}")
    if no_kit:
        print(f"  Slugs WITHOUT kit ({len(no_kit)}):")
        for s in no_kit:
            print(f"    - {s}")


if __name__ == "__main__":
    main()
