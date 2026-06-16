// src/lib/affiliate/amazon.ts
// Programa de Afiliados de Amazon (Amazon España). Tag de seguimiento del sitio.
//
// IMPORTANTE: estos enlaces NO son apuestas y SÍ son compatibles con AdSense.
// Se colocan en páginas públicas indexables (a diferencia del afiliado de
// apuestas, que va geobloqueado y solo en /app). Todo enlace de afiliado debe
// llevar rel="sponsored" y mostrar el aviso de afiliación cerca (lo hace el
// bloque `affiliate` del BlockRenderer).
//
// Audiencia LATAM: hoy apuntamos a amazon.es (cobra en compras de España). Para
// LATAM hará falta el alta en Amazon México (afiliados.amazon.com.mx) o montar
// Amazon OneLink; cuando exista, se añade aquí un mapa de tag por marketplace.

/** Tag de afiliado de Amazon España (Programa de Afiliados de la UE). */
export const AMAZON_TAG = "zonamundial-21";

/** Marketplace por defecto (España). */
export const AMAZON_STORE = "https://www.amazon.es";

/**
 * Construye un enlace de BÚSQUEDA en Amazon con el tag de afiliado.
 * Los enlaces de resultados de búsqueda etiquetados generan comisión y evitan
 * tener que mantener ASINs concretos (que cambian de stock). Útil para productos
 * variables como camisetas por selección.
 */
export function amazonSearchUrl(query: string): string {
  return `${AMAZON_STORE}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(
    AMAZON_TAG
  )}`;
}

/**
 * Construye un enlace a un producto concreto por ASIN con el tag de afiliado.
 * Para cuando tengamos productos fijos (ej. un balón o un libro determinado).
 */
export function amazonProductUrl(asin: string): string {
  return `${AMAZON_STORE}/dp/${asin}?tag=${encodeURIComponent(AMAZON_TAG)}`;
}

/** Aviso de afiliación requerido por el Acuerdo Operativo de Amazon (versión corta). */
export const AMAZON_DISCLOSURE =
  "Enlaces de afiliado. Como Afiliado de Amazon, ZonaMundial obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables. No supone ningún coste adicional para ti.";

/** Aviso de afiliación (versión legal larga, para páginas legales). */
export const AMAZON_DISCLOSURE_LONG =
  "ZonaMundial participa en el Programa de Afiliados de Amazon EU, un programa de publicidad para afiliados diseñado para ofrecer a sitios web un modo de obtener comisiones por publicidad, publicitando e incluyendo enlaces a Amazon.es. Como Afiliado de Amazon, ZonaMundial obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables.";
