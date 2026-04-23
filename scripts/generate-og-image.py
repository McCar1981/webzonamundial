"""Generate og-image.jpg (1200x630) placeholder for ZonaMundial.

Run: python scripts/generate-og-image.py
Output: public/og-image.jpg
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG_TOP = (11, 11, 15)        # #0b0b0f
BG_BOTTOM = (15, 24, 37)     # #0f1825
GOLD = (201, 168, 76)        # #C9A84C
GOLD_LIGHT = (232, 212, 139) # #E8D48B
ORANGE = (255, 107, 53)      # #ff6b35
WHITE = (255, 255, 255)
GRAY = (138, 148, 176)       # #8a94b0

img = Image.new("RGB", (W, H), BG_TOP)
draw = ImageDraw.Draw(img)

# Vertical gradient background
for y in range(H):
    t = y / H
    r = int(BG_TOP[0] * (1 - t) + BG_BOTTOM[0] * t)
    g = int(BG_TOP[1] * (1 - t) + BG_BOTTOM[1] * t)
    b = int(BG_TOP[2] * (1 - t) + BG_BOTTOM[2] * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Decorative gold circles (subtle)
for cx, cy, r, alpha in [(150, 100, 200, 30), (1050, 530, 280, 25), (980, 80, 120, 40)]:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*GOLD, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

# Try multiple font fallbacks
def get_font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for fp in candidates:
        try:
            return ImageFont.truetype(fp, size)
        except Exception:
            continue
    return ImageFont.load_default()

f_badge = get_font(24, bold=True)
f_title = get_font(82, bold=True)
f_subtitle = get_font(36)
f_footer = get_font(28, bold=True)

# Badge top-left
badge_text = "MUNDIAL 2026"
bx, by = 80, 80
bw = 240
bh = 50
draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=25, outline=GOLD, width=2)
draw.text((bx + 30, by + 12), badge_text, fill=GOLD, font=f_badge)

# Main title
title_lines = ["ZonaMundial"]
y = 200
for line in title_lines:
    bbox = draw.textbbox((0, 0), line, font=f_title)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), line, fill=WHITE, font=f_title)
    y += 100

# Subtitle
subtitle = "Predicciones · Fantasy · IA Coach · Trivia"
bbox = draw.textbbox((0, 0), subtitle, font=f_subtitle)
tw = bbox[2] - bbox[0]
x = (W - tw) // 2
draw.text((x, y + 20), subtitle, fill=GOLD_LIGHT, font=f_subtitle)

# Footer line
footer = "48 selecciones · 16 sedes · 104 partidos"
bbox = draw.textbbox((0, 0), footer, font=f_footer)
tw = bbox[2] - bbox[0]
x = (W - tw) // 2
draw.text((x, H - 80), footer, fill=GRAY, font=f_footer)

# CTA bar bottom-right
cta = "zonamundial.app"
bbox = draw.textbbox((0, 0), cta, font=f_footer)
tw = bbox[2] - bbox[0]
draw.text((W - tw - 80, 80), cta, fill=ORANGE, font=f_footer)

out = Path(__file__).resolve().parent.parent / "public" / "og-image.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, "JPEG", quality=88, optimize=True)
print(f"OK: {out}")
