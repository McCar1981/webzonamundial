# Kit de Activación — ASSETS (imágenes base)

Especificación técnica de las **imágenes-plantilla** (fondos diseñados) de cada
material del kit. Tú produces las imágenes; el código coloca encima los datos
dinámicos (logo del bar, premio, QR, URL) en ZONAS controladas.

> **Cómo funciona el render**
> El material se compone sobre un lienzo lógico fijo (px CSS ≈ 96 dpi). La imagen
> base se usa como **fondo a tamaño completo** (`background-size: 100% 100%`, sin
> recortes). Por eso la imagen DEBE tener **exactamente la proporción del lienzo**
> o se deformará. Encima se insertan logo/premio/QR/URL según las ZONAS definidas
> en `src/lib/bars/kit-image-templates.ts`.

## Carpeta y nomenclatura

- Carpeta: `public/assets/bar-kit/`
- Nombre: `porra-digital-template-<formato>.png` (PNG, fondo opaco)
- Ejemplo ya en uso: `porra-digital-template-4x5.png` (piloto, usado por WhatsApp)

## Tabla de formatos

| Material | id | Lienzo lógico (px) | Proporción | Imagen base recomendada (px) | Estado |
|---|---|---|---|---|---|
| WhatsApp | `whatsapp` | 1080 × 1350 | 4:5 | 1080 × 1350 (o 1122 × 1402) | ✅ **Hecho** (reusa 4:5 piloto) |
| Cartel A4 | `a4` | 794 × 1123 | √2 (≈0.707) | 1654 × 2339 (2×) o 2480 × 3508 (300 dpi) | ⏳ falta imagen |
| Cartel A3 | `a3` | 1123 × 1587 | √2 (≈0.707) | 2246 × 3174 (2×) o 3508 × 4961 (300 dpi) | ⏳ falta imagen |
| Tarjeta mesa A6 | `mesa-a6` | 397 × 561 | √2 (≈0.707) | 1240 × 1748 (300 dpi) | ⏳ falta imagen |
| Story IG | `story` | 1080 × 1920 | 9:16 (0.5625) | 1080 × 1920 | ⏳ falta imagen |
| Post IG | `post` | 1080 × 1080 | 1:1 | 1080 × 1080 | ⏳ falta imagen |
| Slide TV | `tv-slide` | 1920 × 1080 | 16:9 (1.777) | 1920 × 1080 | ⏳ falta imagen |

> Nota: A4/A3/mesa comparten proporción √2 → **una misma maqueta** sirve para los
> tres exportando a distintas resoluciones. Recomendado: diseña el A4 a 300 dpi
> (2480 × 3508) y reescala para A3 y A6.

## Requisitos por imagen

- **Formato:** PNG, fondo opaco (no transparente), sRGB.
- **Proporción exacta** del lienzo lógico (ver tabla). Si no, se deforma.
- **Sin texto dinámico quemado**: NO incluyas nombre del bar, premio, QR ni URL
  en la imagen. Esos los pone el código. La imagen aporta: fondo, marco, balón,
  confeti, titulares fijos («Porra del Mundial», «Escanea y juega»), sello, etc.
- **Zonas reservadas (huecos)**: deja espacios vacíos/limpios donde irán el
  logo, el premio, el QR (recuadro blanco) y la URL. Ver coordenadas en
  `STORYBOARD.md` y la zona del QR debe quedar **clara y de alto contraste**
  para que el QR se lea.
- **Márgenes de seguridad:** mantén los elementos clave a ≥ 4% del borde.
- **Peso:** intenta < 2,5 MB por imagen (el piloto pesa ~2 MB).

## Tras entregar cada imagen

1. Copia el PNG a `public/assets/bar-kit/` con el nombre del formato.
2. Avísame: añado la entrada del material en
   `src/lib/bars/kit-image-templates.ts` con sus ZONAS y lo ajustamos con
   `?debug=1` sobre el preview real.
3. Mientras tanto, el material sigue mostrándose con el fondo CSS (no se rompe).

## Validar un preview

- Abre `/b/<slug>/kit/<id>` (p. ej. `/b/tu-bar/kit/whatsapp`).
- Modo debug de zonas: añade `?debug=1` (dibuja los recuadros logo/premio/QR/URL).
- Imprimir / Guardar como PDF: botón de la barra superior (`window.print()`).
