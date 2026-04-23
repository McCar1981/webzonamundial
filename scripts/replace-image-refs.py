"""Replace heavy PNG references with WebP equivalents in src/.

Keeps the original PNG files on disk (do NOT delete — other references may exist).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

# Map original -> replacement
MAPPING = [
    ("rotulemos120x600.png", "rotulemos120x600.webp"),
    ("rotulemos330x250.png", "rotulemos330x250.webp"),
    ("rotulemos320x50.png", "rotulemos320x50.webp"),
    ("coolcat330x250.png", "coolcat330x250.webp"),
    ("ChatGPT Image 8 abr 2026, 04_49_43 p.m..png", "ChatGPT Image 8 abr 2026, 04_49_43 p.m..webp"),
    ("ChatGPT Image 8 abr 2026, 04_53_21 p.m..png", "ChatGPT Image 8 abr 2026, 04_53_21 p.m..webp"),
    ("Background Patterns.png", "Background Patterns.webp"),
    ("Estadio Atmosphere.png", "Estadio Atmosphere.webp"),
    ("IMG-20260302-WA0016-removebg-preview.png", "IMG-20260302-WA0016-removebg-preview.webp"),
    ("4250c5f8-7831-4fcd-bd97-7a82a51df125.png", "4250c5f8-7831-4fcd-bd97-7a82a51df125.webp"),
    ("3ed8e8c7-8e9f-49d0-9a54-518d3f7b4dcb.png", "3ed8e8c7-8e9f-49d0-9a54-518d3f7b4dcb.webp"),
    ("balondefutbol.png", "balondefutbol.webp"),
]

count = 0
for f in SRC.rglob("*"):
    if not f.is_file() or f.suffix not in (".tsx", ".ts", ".jsx", ".js", ".css"):
        continue
    content = f.read_text(encoding="utf-8")
    orig = content
    for old, new in MAPPING:
        if old in content:
            content = content.replace(old, new)
    if content != orig:
        f.write_text(content, encoding="utf-8")
        count += 1
        print(f"Updated: {f.relative_to(ROOT)}")

print(f"\nTotal files updated: {count}")
