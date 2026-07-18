// src/lib/ligas/predict-markets.ts
//
// Definición y RESOLUCIÓN de los mercados de predicción tipados de Zona de Ligas
// (Fase A1). Un único motor, parametrizado por competición/fixture — sin copiar
// nada por liga. Compartido por el endpoint (validación del pick) y por el cron
// (resolución + reparto). Sin dependencias de React ni de Supabase: solo lógica
// pura sobre el FixtureDetail de api-football que ligas ya consume.

import type { FixtureDetail } from "@/lib/competitions/api";

export type TypedMarket = "ou_goals" | "first_goal" | "btts";
export const TYPED_MARKETS: TypedMarket[] = ["ou_goals", "first_goal", "btts"];

// Recompensa fija por mercado (Fútcoins), coherente con 1X2=10 / exact=40.
export const MARKET_REWARD: Record<TypedMarket, number> = {
  ou_goals: 15,
  first_goal: 15,
  btts: 12,
};

// Línea fija del over/under en A1 (la más común). Se guarda en `data` para poder
// abrir otras líneas en el futuro sin migración.
export const OU_LINE = 2.5;

// Ola 1 del lanzamiento: los mercados avanzados se exponen SOLO en estas ligas al
// principio (control de coste y foco). Ampliar = añadir slugs aquí.
export const OLA1_SLUGS = new Set(["liga-mx", "ligapro-ecuador", "libertadores", "laliga"]);
export function isOla1(slug: string): boolean {
  return OLA1_SLUGS.has(slug);
}

export type OuData = { line: number; side: "over" | "under" };
export type FirstGoalData = { pick: "home" | "away" | "none" };
export type BttsData = { pick: "yes" | "no" };
export type MarketData = OuData | FirstGoalData | BttsData;

export function isTypedMarket(v: unknown): v is TypedMarket {
  return v === "ou_goals" || v === "first_goal" || v === "btts";
}

/** Valida/normaliza el payload del cliente. Devuelve el `data` a guardar o null. */
export function validateMarketData(market: TypedMarket, raw: unknown): MarketData | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (market === "ou_goals") {
    return o.side === "over" || o.side === "under" ? { line: OU_LINE, side: o.side } : null;
  }
  if (market === "first_goal") {
    return o.pick === "home" || o.pick === "away" || o.pick === "none" ? { pick: o.pick } : null;
  }
  if (market === "btts") {
    return o.pick === "yes" || o.pick === "no" ? { pick: o.pick } : null;
  }
  return null;
}

/** Etiqueta legible del pick guardado (para UI e historial). */
export function marketPickLabel(market: TypedMarket, data: MarketData, homeName: string, awayName: string): string {
  if (market === "ou_goals") {
    const d = data as OuData;
    return `${d.side === "over" ? "Más" : "Menos"} de ${d.line} goles`;
  }
  if (market === "first_goal") {
    const p = (data as FirstGoalData).pick;
    return p === "home" ? homeName : p === "away" ? awayName : "Sin goles";
  }
  return (data as BttsData).pick === "yes" ? "Ambos marcan" : "No marcan ambos";
}

// ¿Quién marcó primero? Maneja el AUTOGOL: en api-football el evento de autogol
// va bajo el equipo del jugador que lo encaja (detail "Own Goal"), así que el gol
// cuenta para el rival.
function firstGoalSide(d: FixtureDetail): "home" | "away" | "none" {
  const homeId = d.fixture.home.id;
  const goals = d.events
    .filter((e) => (e.type || "").toLowerCase() === "goal" && e.minute != null)
    .sort((a, b) => (a.minute as number) - (b.minute as number));
  if (goals.length === 0) return "none";
  const g = goals[0];
  const own = (g.detail || "").toLowerCase().includes("own");
  const scoredByHome = g.teamId === homeId;
  return own ? (scoredByHome ? "away" : "home") : scoredByHome ? "home" : "away";
}

/**
 * Resuelve un mercado tipado sobre un partido TERMINADO.
 * Devuelve true=acierto, false=fallo, null=indeterminado (void: no pagar, no
 * fallar mal). El cron solo llama con partidos ya finalizados.
 */
export function resolveTypedMarket(market: TypedMarket, data: MarketData, d: FixtureDetail): boolean | null {
  const h = d.fixture.score.home;
  const a = d.fixture.score.away;
  if (h == null || a == null) return null;

  if (market === "ou_goals") {
    const { line, side } = data as OuData;
    const total = h + a;
    if (total === line) return null; // imposible con .5, pero por seguridad
    return side === "over" ? total > line : total < line;
  }

  if (market === "btts") {
    const both = h > 0 && a > 0;
    return (data as BttsData).pick === "yes" ? both : !both;
  }

  if (market === "first_goal") {
    const hasGoalEvents = d.events.some((e) => (e.type || "").toLowerCase() === "goal");
    // Hubo goles pero el timeline no los trae: no se puede ordenar → void.
    if (!hasGoalEvents && (h > 0 || a > 0)) return null;
    return firstGoalSide(d) === (data as FirstGoalData).pick;
  }

  return null;
}
