/**
 * Precios y catálogo del Founders Pass.
 *
 * Este archivo es SERVER/CLIENT SAFE: solo contiene constantes estáticas,
 * sin acceso a process.env. Puede importarse tanto en Server Components
 * como en Client Components.
 *
 * El cliente Stripe (que SÍ requiere env vars) vive en client.ts.
 */

/**
 * Precios del Founders Pass por moneda. Se mantienen en código (no en Stripe
 * Dashboard) porque son fijos y queremos evitar dependencias remotas para
 * algo que no cambia.
 *
 * Stripe trabaja en céntimos: 800 = 8.00 EUR.
 */
export const FOUNDERS_PASS_PRICES = {
  eur: {
    amount: 800,
    currency: "eur" as const,
    display: "8 €",
    region: "Europa y resto del mundo",
  },
  usd: {
    amount: 600,
    currency: "usd" as const,
    display: "6 USD",
    region: "LATAM y USA",
  },
} as const;

export type FoundersCurrency = keyof typeof FOUNDERS_PASS_PRICES;

export function isValidCurrency(c: string): c is FoundersCurrency {
  return c in FOUNDERS_PASS_PRICES;
}

export const PRODUCT_NAME = "Founders Pass · ZonaMundial 2026";
export const PRODUCT_DESCRIPTION =
  "Pago único válido para todo el Mundial 2026. Incluye navegación sin publicidad, estadísticas avanzadas, beta access, sticker pack exclusivo e insignia Founders.";
