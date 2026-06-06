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
  priceEur: number; // referencia; el precio real se confirma en Stripe (FASE 2)
  features: string[];
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
    priceEur: 49,
    features: [
      "1 porra del bar", "1 QR dinámico", "Landing personalizada", "Ranking del bar",
      "Pantalla TV básica", "Premio principal", "Materiales descargables básicos", "Estadísticas básicas",
    ],
    maxQrSources: 1, weeklyPrizes: false, exportParticipants: false, premiumMaterials: false, barVsBar: false,
  },
  completo: {
    id: "completo", name: "Mundial Completo", tagline: "Mantén el ambiente vivo durante todo el torneo",
    priceEur: 99,
    features: [
      "Todo lo de Arranque", "Premios por jornada", "Exportar participantes", "Ranking semanal",
      "Materiales premium", "Soporte prioritario", "Personalización ampliada",
    ],
    maxQrSources: 3, weeklyPrizes: true, exportParticipants: true, premiumMaterials: true, barVsBar: false,
  },
  pro: {
    id: "pro", name: "Bar Pro", tagline: "Para cadenas y bares deportivos que van a por todas",
    priceEur: 179,
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

export function planList(): BarPlan[] {
  return [BAR_PLANS.arranque, BAR_PLANS.completo, BAR_PLANS.pro];
}
