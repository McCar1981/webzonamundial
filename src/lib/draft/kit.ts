// src/lib/draft/kit.ts
// Camisetas 2026 para las selecciones históricas del Draft
// Italia y Hungría no clasificaron para 2026 — usan fallback de color.

const KIT_BY_SELECCION: Record<string, string | null> = {
  Brasil:    "brasil",
  Argentina: "argentina",
  Alemania:  "alemania",
  Holanda:   "paises-bajos",   // slug del kit difiere del nombre en el Draft
  Francia:   "francia",
  España:    "espana",
  Uruguay:   "uruguay",
  Italia:    null,             // no clasificó 2026
  Hungría:   null,             // no clasificó 2026
  Inglaterra:"inglaterra",
  Portugal:  "portugal",
  Croacia:   "croacia",
  Marruecos: "marruecos",
};

export const KIT_FALLBACK: Record<string, { bg: string; text: string }> = {
  Italia:  { bg: "#003399", text: "#ffffff" },
  Hungría: { bg: "#ce2939", text: "#ffffff" },
};

export function draftKitUrl(seleccion: string): string | null {
  const slug = KIT_BY_SELECCION[seleccion];
  if (!slug) return null;
  return `/img/kits/2026/home/${slug}.png`;
}
