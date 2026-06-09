// src/lib/adsense.ts
// Constantes y helpers centralizados para Google AdSense.
//
// IMPORTANTE: Los data-ad-slot IDs deben crearse en la consola de AdSense
// (https://www.google.com/adsense/) y reemplazar los placeholders aquí.
// Sin slots reales, AdSense no servirá anuncios.
//
// Pasos para activar:
//  1. Ve a AdSense → Anuncios → Por unidad de anuncio → Crear nueva unidad
//  2. Crea unidades para cada formato (in-article, sidebar, banner, display)
//  3. Copia el data-ad-slot de cada una y sustitúyelo aquí
//  4. Despliega y espera la aprobación de Google (puede tardar 1-3 días)

/**
 * Flag maestro de activación. Por defecto está APAGADO para evitar que Google
 * vea anuncios durante la revisión de aprobación. Cuando AdSense apruebe el
 * sitio, activa esta variable de entorno para mostrar anuncios.
 */
export const isAdSenseEnabled =
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

/** Publisher ID de AdSense (público, aparece en ads.txt). */
export const ADSENSE_ID =
  process.env.NEXT_PUBLIC_ADSENSE_ID ?? "ca-pub-1977548438117778";

/**
 * Slots de anuncio. Cada key mapea a un data-ad-slot de la consola de AdSense.
 * Los valores actuales son PLACEHOLDERS — deben reemplazarse con los slots reales.
 *
 * Para obtener un slot real:
 *   1. AdSense → Anuncios → Por unidad de anuncio
 *   2. Crear unidad de anuncio → Selecciona el formato
 *   3. Guarda y copia el número de slot (ej: "1234567890")
 *   4. Reemplázalo aquí y redeploya.
 */
export const AD_SLOTS: Record<string, string> = {
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │  PLACEHOLDERS — REEMPLAZAR CON SLOTS REALES DE LA CONSOLA ADSENSE   │
  // └─────────────────────────────────────────────────────────────────────┘
  /** In-article: entre párrafos de noticias y blog (formato fluid o rectangle). */
  inArticle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE ?? "",
  /** Sidebar: columnas laterales en listados (formato display o skyscraper). */
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "",
  /** Banner horizontal: top/bottom de páginas (formato leaderboard o banner). */
  banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "",
  /** Display responsivo: bloques cuadrados/rectangulares en grids. */
  display: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY ?? "",
  /** Anuncio nativo: integrado visualmente con el contenido. */
  native: process.env.NEXT_PUBLIC_ADSENSE_SLOT_NATIVE ?? "",
};

/** Devuelve true si el slot está configurado (tiene valor real). */
export function hasSlot(key: keyof typeof AD_SLOTS): boolean {
  return !!AD_SLOTS[key] && !AD_SLOTS[key].includes("PLACEHOLDER");
}

/** Devuelve true si AdSense está configurado con al menos un slot real. */
export function isAdSenseReady(): boolean {
  return Object.values(AD_SLOTS).some((s) => !!s && !s.includes("PLACEHOLDER"));
}

/** Formatos AdSense estándar. */
export type AdFormat =
  | "auto"
  | "rectangle"
  | "vertical"
  | "horizontal"
  | "fluid"
  | "autorelaxed";

/** Estilos predefinidos por formato para minimizar CLS. */
export const AD_FORMAT_STYLES: Record<AdFormat, React.CSSProperties> = {
  auto: { minHeight: 100, display: "block" },
  rectangle: { minHeight: 250, display: "block" }, // 300x250
  vertical: { minHeight: 600, display: "block" }, // 300x600 o 160x600
  horizontal: { minHeight: 90, display: "block" }, // 728x90 o 320x50
  fluid: { minHeight: 100, display: "block" },
  autorelaxed: { minHeight: 200, display: "block" },
};
