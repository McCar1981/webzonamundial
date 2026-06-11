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
 * la región/moneda la asigna el servidor según profiles.country
 * (anti-arbitraje) y los importes viven en código. Stripe Checkout en
 * mode:"subscription" acepta price_data inline con `recurring`, así que no
 * necesitamos Price IDs del Dashboard.
 *
 * TRES regiones de precio (no dos): EEUU paga distinto que LATAM aunque ambos
 * sean USD. El MENSUAL ("pase del Mundial") difiere por región; el ANUAL
 * ("todas las ligas", post-Mundial) es 12 € en Europa y 10 USD en América.
 *
 * Céntimos: 800 = 8.00 EUR · 600 = 6.00 USD · 1000 = 10.00 USD · 1200 = 12.00 EUR.
 */
export const PRO_PRICES = {
  eu: {
    currency: "eur" as const,
    region: "Europa y resto del mundo",
    monthly: { amount: 800, display: "8 €/mes" },
    yearly: { amount: 1200, display: "12 €/año" },
  },
  latam: {
    currency: "usd" as const,
    region: "Latinoamérica",
    monthly: { amount: 600, display: "6 USD/mes" },
    yearly: { amount: 1000, display: "10 USD/año" },
  },
  us: {
    currency: "usd" as const,
    region: "Estados Unidos",
    monthly: { amount: 1000, display: "10 USD/mes" },
    yearly: { amount: 1000, display: "10 USD/año" },
  },
} as const;

export type ProRegion = keyof typeof PRO_PRICES;

export function isValidProRegion(r: string): r is ProRegion {
  return r === "eu" || r === "latam" || r === "us";
}

export type ProBillingInterval = "monthly" | "yearly";

export function isValidProInterval(i: string): i is ProBillingInterval {
  return i === "monthly" || i === "yearly";
}

export const PRO_PRODUCT_NAME = "Plan Pro · ZonaMundial";
export const PRO_PRODUCT_DESCRIPTION =
  "Suscripción Pro: predicciones sin límites, IA Coach ilimitada, fantasy en vivo, temporadas infinitas del Modo Carrera, ligas privadas, sin anuncios y stats avanzadas.";
