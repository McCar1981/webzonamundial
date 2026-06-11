// src/lib/bars/kit-image-templates.ts
//
// Registro de materiales del kit que usan IMAGEN-PLANTILLA (un fondo diseñado)
// en lugar del fondo generado por CSS (PremiumMundialMaterial). Cada entrada
// define la imagen base y las ZONAS (logo, premio, QR, URL) sobre el lienzo
// lógico de ESE material. Si un material no está aquí, cae al render CSS.
//
// Solo datos (sin dependencias de servidor): lo importan la ruta del material
// y, en el futuro, cualquier preview/validación.

import type { KitMaterialId } from "./kit";
import type { PosterZones } from "@/components/bars/kit/BarKitPosterTemplate";

export interface KitImageTemplate {
  templateUrl: string;   // imagen base (en /public), a la MISMA proporción del material
  zones: PosterZones;    // zonas en px sobre el lienzo lógico (width × height del material)
}

// IMPORTANTE: las zonas se definen sobre el tamaño del material en kit.ts.
// WhatsApp es 1080×1350 (4:5), idéntica proporción al piloto 1122×1402, por eso
// reutiliza la imagen validada. Las zonas son las del piloto escaladas a 1080×1350.
// Imagen base del cartel por tipo de porra. Misma proporción 4:5 y MISMAS zonas;
// solo cambia el diseño de fondo ("EN TU BAR" vs "EN TU EMPRESA").
export const POSTER_TEMPLATE_BAR = "/assets/bar-kit/porra-digital-template-4x5.webp";
export const POSTER_TEMPLATE_EMPRESA = "/assets/empresas-kit/porra-digital-template-empresa-4x5.png";

/** URL del cartel base según el tipo de porra (bar | empresa). */
export function kitTemplateUrlForKind(kind: string | null | undefined): string {
  return kind === "empresa" ? POSTER_TEMPLATE_EMPRESA : POSTER_TEMPLATE_BAR;
}

export const KIT_IMAGE_TEMPLATES: Partial<Record<KitMaterialId, KitImageTemplate>> = {
  whatsapp: {
    templateUrl: POSTER_TEMPLATE_BAR,
    zones: {
      logo:  { x: 106, y: 53,   w: 868, h: 236 },
      prize: { x: 87,  y: 857,  w: 452, h: 255 },
      qr:    { x: 650, y: 915,  w: 260, h: 260 },
      url:   { x: 592, y: 1252, w: 395, h: 46  },
    },
  },
};

// `kind` elige el cartel base (bar/empresa); las zonas son idénticas.
export function getKitImageTemplate(
  id: KitMaterialId,
  kind: string | null | undefined = "bar",
): KitImageTemplate | null {
  const tpl = KIT_IMAGE_TEMPLATES[id];
  if (!tpl) return null;
  return { ...tpl, templateUrl: kitTemplateUrlForKind(kind) };
}
