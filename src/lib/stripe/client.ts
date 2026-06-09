// src/lib/stripe/client.ts
// Singleton del cliente Stripe (server-only). Usar SOLO en route handlers.
//
// Las constantes de precios (FOUNDERS_PASS_PRICES, etc.) viven en pricing.ts
// para poder importarse tanto en server como en client.

import Stripe from "stripe";
export {
  FOUNDERS_PASS_PRICES,
  isValidCurrency,
  PRODUCT_NAME,
  PRODUCT_DESCRIPTION,
  PRO_PRICES,
  isValidProInterval,
  PRO_PRODUCT_NAME,
  PRO_PRODUCT_DESCRIPTION,
  type FoundersCurrency,
  type ProBillingInterval,
} from "./pricing";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY no está definido. Añádelo en Vercel → Environment Variables."
    );
  }
  // No pineamos apiVersion: dejamos que el SDK use la versión por defecto
  // de la cuenta. Pinear a una versión específica (p.ej. 2026-04-22.dahlia)
  // rompe si la cuenta no ha aceptado el upgrade en el Dashboard.
  _stripe = new Stripe(key, {
    typescript: true,
    appInfo: {
      name: "ZonaMundial",
      version: "1.0.0",
      url: "https://zonamundial.app",
    },
  });
  return _stripe;
}
