// src/lib/bars/plans.ts
//
// Catálogo de planes comerciales para bares (en código, estático). El cobro real
// (FASE 2) se hará con el Stripe ya integrado en el proyecto; aquí solo vive la
// definición de qué incluye cada plan y sus features, para gating y la landing.

export type BarPlanId = "arranque" | "completo" | "pro";

export interface BarPlan {
  id: BarPlanId;
  name: string;
  tagline: string;
  idealFor: string; // a quién va dirigido (microcopy comercial de la landing)
  priceEur: number; // tarifa Europa y resto del mundo (en euros)
  priceUsd: number; // tarifa LATAM y USA (en dólares)
  features: string[];
  highlight?: boolean;      // plan recomendado (UI)
  // Límites/flags que el código consulta para activar capacidades.
  maxQrSources: number;     // nº de fuentes QR por zona
  weeklyPrizes: boolean;    // premios por jornada / semanales
  exportParticipants: boolean;
  premiumMaterials: boolean;
  barVsBar: boolean;        // reto entre bares (FASE 3)
}

export const BAR_PLANS: Record<BarPlanId, BarPlan> = {
  arranque: {
    id: "arranque", name: "Arranque Mundial", tagline: "Lo esencial para lanzar la porra de tu bar",
    idealFor: "Bares pequeños, peñas o locales que quieren una porra simple",
    priceEur: 49, priceUsd: 55,
    features: [
      "1 peña del bar", "1 QR dinámico", "Landing personalizada", "Ranking del bar",
      "Pantalla TV básica", "Incentivo principal", "Materiales descargables básicos", "Estadísticas básicas",
    ],
    maxQrSources: 1, weeklyPrizes: false, exportParticipants: false, premiumMaterials: false, barVsBar: false,
  },
  completo: {
    id: "completo", name: "Mundial Completo", tagline: "Mantén la competición de tu bar activa durante todo el torneo",
    idealFor: "Bares que quieren usar la porra durante todo el Mundial",
    priceEur: 99, priceUsd: 109, highlight: true,
    features: [
      "Todo lo de Arranque", "Hasta 3 QR por zonas", "Exportar clasificación (CSV)",
      "Materiales premium (cartel A4)", "Soporte prioritario", "Personalización ampliada",
    ],
    maxQrSources: 3, weeklyPrizes: false, exportParticipants: true, premiumMaterials: true, barVsBar: false,
  },
  pro: {
    id: "pro", name: "Bar Pro", tagline: "Para cadenas y bares deportivos que van a por todas",
    idealFor: "Bares grandes, terrazas, salones o cadenas pequeñas",
    priceEur: 179, priceUsd: 199,
    features: [
      "Todo lo de Completo", "Hasta 6 QR por zonas (barra, terraza, salón, TV)",
      "Pantalla TV a pantalla completa", "Materiales premium", "Soporte prioritario",
    ],
    maxQrSources: 6, weeklyPrizes: false, exportParticipants: true, premiumMaterials: true, barVsBar: false,
  },
};

export const DEFAULT_PLAN_ID: BarPlanId = "arranque";

export function getPlan(id: string | null | undefined): BarPlan {
  return (id && BAR_PLANS[id as BarPlanId]) || BAR_PLANS[DEFAULT_PLAN_ID];
}

export function isBarPlanId(id: string | null | undefined): id is BarPlanId {
  return !!id && id in BAR_PLANS;
}

export function planList(): BarPlan[] {
  return [BAR_PLANS.arranque, BAR_PLANS.completo, BAR_PLANS.pro];
}

// ─── Precios para Stripe ───────────────────────────────────────────────────────
// La moneda se decide por país del usuario (currencyForCountry), igual que el
// Founders Pass: EUR para Europa/resto del mundo, USD para LATAM y USA. Stripe
// trabaja en céntimos. El backend valida estos importes; el cliente NO los elige.
export type BarPlanCurrency = "eur" | "usd";

/** Importe del plan en céntimos para la moneda dada. */
export function barPlanAmountCents(plan: BarPlan, currency: BarPlanCurrency): number {
  return (currency === "usd" ? plan.priceUsd : plan.priceEur) * 100;
}

/** Texto de precio para la UI, p.ej. "99 €" o "109 USD". */
export function barPlanDisplay(plan: BarPlan, currency: BarPlanCurrency): string {
  return currency === "usd" ? `${plan.priceUsd} USD` : `${plan.priceEur} €`;
}
