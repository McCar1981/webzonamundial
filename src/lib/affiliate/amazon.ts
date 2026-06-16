// src/lib/affiliate/amazon.ts
// Programa de Afiliados de Amazon (Amazon España). Tag de seguimiento del sitio.
//
// IMPORTANTE: estos enlaces NO son apuestas y SÍ son compatibles con AdSense.
// Se colocan en páginas públicas indexables (a diferencia del afiliado de
// apuestas, que va geobloqueado y solo en /app). Todo enlace de afiliado debe
// llevar rel="sponsored" y mostrar el aviso de afiliación cerca (lo hace el
// bloque `affiliate` del BlockRenderer).
//
// Localización por país (OneLink casero): España -> Amazon España (.es, tag -21);
// resto del mundo, LATAM incluido -> Amazon US (.com, tag -20), que envía a la
// región. El redirector /go/amazon resuelve el destino por IP del visitante.
// Para añadir México (.com.mx) o Brasil (.com.br) basta con sumar entradas a
// amazonStoreForCountry.

/** Tag de afiliado de Amazon España (Programa de Afiliados de la UE). */
export const AMAZON_TAG = "zonamundial-21";
/** Tag de afiliado de Amazon US (.com), para LATAM y resto del mundo. */
export const AMAZON_TAG_US = "zonamundial-20";

/** Marketplace por defecto (España). */
export const AMAZON_STORE = "https://www.amazon.es";

interface AmazonStore {
  base: string;
  tag: string;
}
const STORE_ES: AmazonStore = { base: "https://www.amazon.es", tag: AMAZON_TAG };
const STORE_US: AmazonStore = { base: "https://www.amazon.com", tag: AMAZON_TAG_US };

/** Resuelve el marketplace de Amazon según el país del visitante (ISO-2 lower).
 * España -> .es; cualquier otro o desconocido -> .com (US, máxima cobertura). */
export function amazonStoreForCountry(country: string | null): AmazonStore {
  return country === "es" ? STORE_ES : STORE_US;
}

/**
 * Construye un enlace de BÚSQUEDA directo a Amazon España con el tag.
 * Para localización por país usa amazonGoUrl + el redirector /go/amazon.
 */
export function amazonSearchUrl(query: string): string {
  return `${AMAZON_STORE}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(
    AMAZON_TAG
  )}`;
}

/** Enlace de búsqueda LOCALIZADO según país (lo usa el redirector /go/amazon). */
export function amazonSearchUrlForCountry(
  query: string,
  country: string | null
): string {
  const store = amazonStoreForCountry(country);
  return `${store.base}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(
    store.tag
  )}`;
}

/** Href interno para los botones: el redirector /go/amazon localiza por IP. */
export function amazonGoUrl(query: string): string {
  return `/go/amazon?q=${encodeURIComponent(query)}`;
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
