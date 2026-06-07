# Kit de Activación — STORYBOARD (composición por formato)

Guía visual de qué lleva cada material y **dónde van las zonas dinámicas**
(logo, premio, QR, URL). Las zonas se definen en
`src/lib/bars/kit-image-templates.ts` sobre el lienzo lógico de cada material.

Bloques comunes (todos los formatos):
- **Logo / nombre del bar** (arriba). Si no hay logo, cae al nombre del bar.
- **Titular fijo** «Porra del Mundial 2026» / «Juega gratis. Gana premios.» → va
  EN LA IMAGEN base (texto quemado), no es dinámico.
- **Premio principal** (dinámico): título del premio configurado en el panel.
- **QR** (dinámico): recuadro blanco, alto contraste, escaneable.
- **URL corta** (dinámica): barra blanca con el enlace `zonamundial.app/r/XXXX`.
- **Sello legal**: «Powered by ZonaMundial. Dinámica gratuita…» → en la imagen.

---

## WhatsApp — 1080 × 1350 (4:5) ✅ implementado

Reusa la imagen piloto `porra-digital-template-4x5.png`. Zonas (sobre 1080×1350):

| Zona | x | y | w | h |
|---|---|---|---|---|
| logo | 106 | 53 | 868 | 236 |
| prize | 87 | 857 | 452 | 255 |
| qr | 650 | 915 | 260 | 260 |
| url | 592 | 1252 | 395 | 46 |

Es el patrón de referencia: **logo arriba centrado, premio abajo-izquierda,
QR abajo-derecha con recuadro blanco, URL en barra blanca al pie**.

---

## Story IG — 1080 × 1920 (9:16) ⏳

Vertical muy alto. Distribución sugerida (tercios):
- Tercio superior: logo + titular «Porra del Mundial».
- Tercio central: claim grande + premio.
- Tercio inferior: QR grande centrado + URL debajo + sello.
- Deja **mucho aire** arriba/abajo (zonas seguras de Stories, los iconos de IG
  tapan ~250 px arriba y ~250 px abajo): no pongas nada crítico ahí.

## Post IG — 1080 × 1080 (1:1) ⏳

Cuadrado compacto:
- Arriba: logo + nombre.
- Centro: QR a la izquierda + (premio/URL) a la derecha, o QR central.
- Abajo: URL + sello.

## Slide TV — 1920 × 1080 (16:9) ⏳

Horizontal, lectura a distancia (legibilidad alta):
- Izquierda (≈60%): logo, claim «Juega gratis. Gana premios.», premio, CTA.
- Derecha (≈40%): QR grande + «Escanea con la cámara» + URL.
- Sello al pie.

## Cartel A4 / A3 / Mesa A6 — proporción √2 ⏳

Misma maqueta vertical a tres tamaños (impresión):
- Cabecera: logo + nombre + «Porra del Mundial 2026».
- Cuerpo: claim + premio principal destacado.
- Pie: QR grande + URL + sello legal.
- A6 (mesa) es pequeño: prioriza **QR grande + URL + premio en una línea**.

---

## Flujo de trabajo

1. Produce la imagen base del formato (ver `ASSETS.md` para px/proporción).
2. Cópiala a `public/assets/bar-kit/` con su nombre.
3. Se añade la entrada en `kit-image-templates.ts` con ZONAS provisionales.
4. Ajuste fino con `?debug=1` en `/b/<slug>/kit/<id>` (recuadros de zonas).
5. Validado → queda como material real; sustituye al fondo CSS de ese formato.
