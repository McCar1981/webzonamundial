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

/**
 * Precios del plan PRO (suscripción). Misma política que el Founders Pass:
 * la moneda la asigna el servidor según profiles.country (anti-arbitraje) y
 * los importes viven en código. A diferencia del pago único, Stripe Checkout
 * en mode:"subscription" acepta price_data inline con `recurring`, así que
 * tampoco necesitamos Price IDs del Dashboard.
 *
 * Céntimos: 300 = 3.00 EUR/mes · 1200 = 12.00 EUR/año.
 */
export const PRO_PRICES = {
  eur: {
    monthly: { amount: 300, display: "3 €/mes" },
    yearly: { amount: 1200, display: "12 €/año" },
    currency: "eur" as const,
    region: "Europa y resto del mundo",
  },
  usd: {
    monthly: { amount: 250, display: "2,50 USD/mes" },
    yearly: { amount: 1000, display: "10 USD/año" },
    currency: "usd" as const,
    region: "LATAM y USA",
  },
} as const;

export type ProBillingInterval = "monthly" | "yearly";

export function isValidProInterval(i: string): i is ProBillingInterval {
  return i === "monthly" || i === "yearly";
}

export const PRO_PRODUCT_NAME = "Plan Pro · ZonaMundial";
export const PRO_PRODUCT_DESCRIPTION =
  "Suscripción Pro: predicciones sin límites, IA Coach ilimitada, fantasy en vivo, temporadas infinitas del Modo Carrera, ligas privadas, sin anuncios y stats avanzadas.";
