# Prompts para generar sobres del album ZonaMundial

Este archivo contiene los prompts para generar las imagenes de los sobres sellados
del album de cromos del Mundial 2026. Cada sobre tiene una variante visual propia
y un numero fijo de cromos.

Los prompts estan preparados para que el sobre aparezca **aislado sobre fondo
blanco o transparente**, sin sombras de entorno, listo para usar directamente en
la web.

Generar con Gemini 3.1 Flash Image (o cualquier generador de imagenes):

```bash
# Ejemplo con el script del repo
python scripts/generar-sobres-gemini.py --variants 5 --force
```

---

## 001 · Bronce · 3 cromos

**Tema:** Sobre bronce metalico, tonos cobrizos y tierra.

```text
Premium sealed sticker pack for FIFA World Cup 2026, official collectible album, vertical rectangular foil pack isolated on pure white background, bronze copper metallic foil with earthy brown tones, ornate geometric patterns, centered, front text "2026" at the top, "FIFA WORLD CUP" below it, large bold "3 CROMOS" in the center, small "COLECCION OFICIAL" at the bottom, soccer ball icon, World Cup trophy motif, product photography, soft studio lighting, no shadows on background, no extra text, clean edges, ultra detailed, realistic, ready for web use.
```

---

## 002 · Plata · 5 cromos

**Tema:** Sobre plateado cromado, tonos grises helados.

```text
Premium sealed sticker pack for FIFA World Cup 2026, official collectible album, vertical rectangular foil pack isolated on pure white background, silver chrome metallic foil with icy grey tones, elegant geometric patterns, centered, front text "2026" at the top, "FIFA WORLD CUP" below it, large bold "5 CROMOS" in the center, small "COLECCION OFICIAL" at the bottom, soccer ball icon, World Cup trophy motif, product photography, soft studio lighting, no shadows on background, no extra text, clean edges, ultra detailed, realistic, ready for web use.
```

---

## 003 · Oro · 7 cromos

**Tema:** Sobre holografico dorado, tonos ambar calidos.

```text
Premium sealed sticker pack for FIFA World Cup 2026, official collectible album, vertical rectangular foil pack isolated on pure white background, gold holographic metallic foil with warm amber tones, rich geometric patterns, centered, front text "2026" at the top, "FIFA WORLD CUP" below it, large bold "7 CROMOS" in the center, small "COLECCION OFICIAL" at the bottom, soccer ball icon, World Cup trophy motif, product photography, soft studio lighting, no shadows on background, no extra text, clean edges, ultra detailed, realistic, ready for web use.
```

---

## 004 · Esmeralda · 10 cromos

**Tema:** Sobre verde esmeralda, tonos tropicales.

```text
Premium sealed sticker pack for FIFA World Cup 2026, official collectible album, vertical rectangular foil pack isolated on pure white background, emerald green metallic foil with tropical green tones, geometric patterns, centered, front text "2026" at the top, "FIFA WORLD CUP" below it, large bold "10 CROMOS" in the center, small "COLECCION OFICIAL" at the bottom, soccer ball icon, World Cup trophy motif, product photography, soft studio lighting, no shadows on background, no extra text, clean edges, ultra detailed, realistic, ready for web use.
```

---

## 005 · Legendario · 15 cromos

**Tema:** Sobre legendario negro y oro, detalles ornamentales.

```text
Premium sealed sticker pack for FIFA World Cup 2026, official collectible album, vertical rectangular foil pack isolated on pure white background, black and gold legendary metallic foil, obsidian with ornate gold details and intricate patterns, centered, front text "2026" at the top, "FIFA WORLD CUP" below it, large bold "15 CROMOS" in the center, small "COLECCION OFICIAL" at the bottom, soccer ball icon, World Cup trophy motif, product photography, soft studio lighting, no shadows on background, no extra text, clean edges, ultra detailed, realistic, ready for web use.
```

---

## Notas

- Resolucion sugerida: 1024x1536 (vertical 2:3) para que encajen como cards.
- Fondo: blanco puro o transparente para recortar facilmente.
- Si el generador inventa texto extra, anadir al prompt: `no extra text beyond the specified labels`.
- Formato de salida: PNG; luego comprimir a WebP para la web.
- Si la IA no respeta el numero exacto, reforzar: `large bold "3 CROMOS" text must be clearly visible`.
