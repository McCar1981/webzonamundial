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
    id: "arranque", name: "Arranque Mundial", tagline: "Lo esencial para llenar tu bar en días de partido",
    priceEur: 49, priceUsd: 55,
    features: [
      "1 porra del bar", "1 QR dinámico", "Landing personalizada", "Ranking del bar",
      "Pantalla TV básica", "Premio principal", "Materiales descargables básicos", "Estadísticas básicas",
    ],
    maxQrSources: 1, weeklyPrizes: false, exportParticipants: false, premiumMaterials: false, barVsBar: false,
  },
  completo: {
    id: "completo", name: "Mundial Completo", tagline: "Mantén el ambiente vivo durante todo el torneo",
    priceEur: 99, priceUsd: 109, highlight: true,
    features: [
      "Todo lo de Arranque", "Premios por jornada", "Exportar participantes", "Ranking semanal",
      "Materiales premium", "Soporte prioritario", "Personalización ampliada",
    ],
    maxQrSources: 3, weeklyPrizes: true, exportParticipants: true, premiumMaterials: true, barVsBar: false,
  },
  pro: {
    id: "pro", name: "Bar Pro", tagline: "Para cadenas y bares deportivos que van a por todas",
    priceEur: 179, priceUsd: 199,
    features: [
      "Todo lo de Completo", "QR por zonas (barra, terraza, salón, TV)", "Ranking avanzado",
      "Reto entre bares", "Reporte avanzado", "Pantalla TV premium", "Múltiples premios",
    ],
    maxQrSources: 6, weeklyPrizes: true, exportParticipants: true, premiumMaterials: true, barVsBar: true,
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
