// src/lib/powerups/catalog.ts
//
// Catálogo de comodines de pago (microtransacciones one-off vía Stripe).
//
// SERVER/CLIENT SAFE: solo constantes estáticas, sin process.env (mismo
// contrato que lib/stripe/pricing.ts). La moneda la asigna el servidor según
// profiles.country, igual que el Founders Pass (anti-arbitraje).

export type PowerupSku = "second_chance" | "double_down" | "trivia_revive";

export interface PowerupPrice {
  amount: number; // céntimos
  display: string;
}

export interface PowerupDef {
  sku: PowerupSku;
  name: string;
  emoji: string;
  description: string;
  prices: { eur: PowerupPrice; usd: PowerupPrice };
}

export const POWERUPS: Record<PowerupSku, PowerupDef> = {
  second_chance: {
    sku: "second_chance",
    name: "Segunda Oportunidad",
    emoji: "⏪",
    description:
      "Cambia tu predicción de Ganador o Marcador exacto aunque ya esté cerrada. Disponible hasta el descanso.",
    prices: {
      eur: { amount: 99, display: "0,99 €" },
      usd: { amount: 99, display: "0.99 USD" },
    },
  },
  double_down: {
    sku: "double_down",
    name: "Partido x2",
    emoji: "⚡",
    description:
      "Duplica los puntos de TODAS tus predicciones acertadas en este partido. Cómpralo antes del cierre de predicciones.",
    prices: {
      eur: { amount: 149, display: "1,49 €" },
      usd: { amount: 149, display: "1.49 USD" },
    },
  },
  trivia_revive: {
    sku: "trivia_revive",
    name: "Salvarracha",
    emoji: "💛",
    description:
      "Revive tu partida de Muerte Súbita y conserva la racha y el multiplicador que llevabas. Una vez por partida.",
    prices: {
      eur: { amount: 99, display: "0,99 €" },
      usd: { amount: 99, display: "0.99 USD" },
    },
  },
};

export type PowerupCurrency = "eur" | "usd";

export function isPowerupSku(s: string): s is PowerupSku {
  return s in POWERUPS;
}

export function powerupPrice(sku: PowerupSku, currency: PowerupCurrency): PowerupPrice {
  return POWERUPS[sku].prices[currency];
}

/** Estados del ciclo de vida de una compra (espejo del CHECK de la tabla). */
export type PowerupStatus = "pending" | "applied" | "consumed" | "failed" | "refunded";
