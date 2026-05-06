// src/lib/stripe/client.ts
// Singleton del cliente Stripe (server-only). Usar SOLO en route handlers.

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY no está definido. Añádelo en Vercel → Environment Variables."
    );
  }
  _stripe = new Stripe(key, {
    // Pin a una API version para evitar sorpresas con cambios de Stripe.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: {
      name: "ZonaMundial",
      version: "1.0.0",
      url: "https://zonamundial.app",
    },
  });
  return _stripe;
}

/* ============ Founders Pass · pricing ============ */

/**
 * Precios del Founders Pass por moneda. Se mantienen en código (no en Stripe
 * Dashboard) porque son fijos y queremos evitar dependencias remotas para
 * algo que no cambia.
 *
 * Stripe trabaja en céntimos: 800 = 8.00 EUR.
 */
export const FOUNDERS_PASS_PRICES = {
  eur: { amount: 800, currency: "eur", display: "8 €", region: "Europa y resto del mundo" },
  usd: { amount: 600, currency: "usd", display: "6 USD", region: "LATAM y USA" },
} as const;

export type FoundersCurrency = keyof typeof FOUNDERS_PASS_PRICES;

export function isValidCurrency(c: string): c is FoundersCurrency {
  return c in FOUNDERS_PASS_PRICES;
}

export const PRODUCT_NAME = "Founders Pass · ZonaMundial 2026";
export const PRODUCT_DESCRIPTION =
  "Pago único válido para todo el Mundial 2026. Incluye navegación sin publicidad, estadísticas avanzadas, beta access, sticker pack exclusivo e insignia Founders.";
