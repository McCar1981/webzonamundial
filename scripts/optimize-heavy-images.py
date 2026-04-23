"""Optimize heavy images (>300KB) to WebP, preserving transparency where needed.

Generates .webp alongside each .png/.jpg — does NOT delete originals so existing
references keep working, but we also update the code to point to the WebP.

Run: python scripts/optimize-heavy-images.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Target images to optimize. Each tuple: (path_relative_to_public, target_width, quality, has_transparency)
# target_width=None means keep original width.
TARGETS = [
    # Ad banners (laterales + intersticiales)
    ("img/imagenessilviu/rotulemos120x600.png", 240, 80, True),        # 240 retina para 120px slot
    ("img/imagenessilviu/rotulemos330x250.png", 660, 82, True),
    ("img/imagenessilviu/rotulemos320x50.png", 640, 82, True),
    ("img/imagenessilviu/coolcat330x250.png", 660, 82, True),
    ("img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_49_43 p.m..png", 400, 80, True),
    ("img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png", 800, 82, True),
    ("img/imagenessilviu/Background Patterns.png", 1200, 70, True),
    ("img/imagenessilviu/Estadio Atmosphere.png", 1920, 75, False),
    # Logo principal (se usa como icono + hero en registro)
    ("img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.png", 512, 90, True),
    # Home screenshots
    ("img/zonamundial-images/4250c5f8-7831-4fcd-bd97-7a82a51df125.png", 1200, 80, False),
    ("img/zonamundial-images/3ed8e8c7-8e9f-49d0-9a54-518d3f7b4dcb.png", 1200, 80, False),
    # Ball decorative (puede bajarse mucho, es decoración)
    ("img/imagenessilviu/balondefutbol.png", 600, 82, True),
]


def optimize(path_rel, target_width, quality, has_transparency):
    src = PUBLIC / path_rel
    if not src.exists():
        return None
    orig_size = src.stat().st_size
    img = Image.open(src)
    # Resize if needed
    if target_width and img.width > target_width:
        ratio = target_width / img.width
        new_size = (target_width, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    # Output webp next to original
    webp_dest = src.with_suffix(".webp")
    save_kwargs = {"quality": quality, "method": 6}
    if has_transparency and img.mode not in ("RGBA", "LA"):
        img = img.convert("RGBA")
    elif not has_transparency and img.mode != "RGB":
        img = img.convert("RGB")
    img.save(webp_dest, "WEBP", **save_kwargs)
    new_size = webp_dest.stat().st_size

    saving_pct = (1 - new_size / orig_size) * 100
    return {
        "name": path_rel,
        "orig_kb": orig_size / 1024,
        "new_kb": new_size / 1024,
        "saving_pct": saving_pct,
        "new_path": f"/{path_rel.rsplit('/', 1)[0]}/{webp_dest.name}",
    }


if __name__ == "__main__":
    results = []
    total_orig = 0
    total_new = 0
    for path_rel, w, q, has_trans in TARGETS:
        r = optimize(path_rel, w, q, has_trans)
        if r:
            results.append(r)
            total_orig += r["orig_kb"]
            total_new += r["new_kb"]

    print(f"\n{'File':<65} {'Orig KB':>10} {'New KB':>10} {'Saving':>8}")
    print("-" * 95)
    for r in results:
        print(f"{r['name'][-65:]:<65} {r['orig_kb']:>10.0f} {r['new_kb']:>10.0f} {r['saving_pct']:>7.1f}%")
    print("-" * 95)
    total_saving = (1 - total_new / total_orig) * 100 if total_orig else 0
    print(f"{'TOTAL':<65} {total_orig:>10.0f} {total_new:>10.0f} {total_saving:>7.1f}%")
    print(f"\nSaving: {(total_orig - total_new)/1024:.1f} MB")
