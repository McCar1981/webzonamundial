// src/lib/ligas/predict-markets.ts
//
// Definición y RESOLUCIÓN de los mercados de predicción tipados de Zona de Ligas.
// Un único motor, parametrizado por competición/fixture — sin copiar nada por
// liga. Compartido por el endpoint (validación del pick) y por el cron
// (resolución + reparto). Sin dependencias de React ni de Supabase: solo lógica
// pura sobre el FixtureDetail de api-football que ligas ya consume.
//
// A1: ou_goals, first_goal, btts.
// A2: ou_corners, ou_cards, first_goal_half (córners, tarjetas y "¿cuándo el 1er
//     gol?"). Se resuelven de stats/events del MISMO FixtureDetail — sin nuevas
//     llamadas a api-football ni datos de jugador (eso es A2b: goleador/duelo).

import type { FixtureDetail } from "@/lib/competitions/api";

export type TypedMarket =
  | "ou_goals"
  | "first_goal"
  | "btts"
  | "ou_corners"
  | "ou_cards"
  | "first_goal_half";
export const TYPED_MARKETS: TypedMarket[] = [
  "ou_goals",
  "first_goal",
  "btts",
  "ou_corners",
  "ou_cards",
  "first_goal_half",
];

// Recompensa fija por mercado (Fútcoins), coherente con 1X2=10 / exact=40.
export const MARKET_REWARD: Record<TypedMarket, number> = {
  ou_goals: 15,
  first_goal: 15,
  btts: 12,
  ou_corners: 15,
  ou_cards: 12,
  first_goal_half: 15,
};

// Líneas fijas del over/under por mercado (las más comunes). Se guardan en `data`
// para poder abrir otras líneas en el futuro sin migración.
export const OU_LINE_GOALS = 2.5;
export const OU_LINE_CORNERS = 9.5;
export const OU_LINE_CARDS = 4.5;

// Ola 1 del lanzamiento: los mercados avanzados se exponen SOLO en estas ligas al
// principio (control de coste y foco). Ampliar = añadir slugs aquí.
export const OLA1_SLUGS = new Set(["liga-mx", "ligapro-ecuador", "libertadores", "laliga"]);
export function isOla1(slug: string): boolean {
  return OLA1_SLUGS.has(slug);
}

export type OuData = { line: number; side: "over" | "under" };
export type FirstGoalData = { pick: "home" | "away" | "none" };
export type BttsData = { pick: "yes" | "no" };
export type FirstHalfData = { pick: "first" | "second" | "none" };
export type MarketData = OuData | FirstGoalData | BttsData | FirstHalfData;

export function isTypedMarket(v: unknown): v is TypedMarket {
  return typeof v === "string" && (TYPED_MARKETS as string[]).includes(v);
}

const OU_MARKETS = new Set<TypedMarket>(["ou_goals", "ou_corners", "ou_cards"]);
function ouLineFor(market: TypedMarket): number {
  return market === "ou_corners" ? OU_LINE_CORNERS : market === "ou_cards" ? OU_LINE_CARDS : OU_LINE_GOALS;
}

/** Valida/normaliza el payload del cliente. Devuelve el `data` a guardar o null. */
export function validateMarketData(market: TypedMarket, raw: unknown): MarketData | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (OU_MARKETS.has(market)) {
    return o.side === "over" || o.side === "under" ? { line: ouLineFor(market), side: o.side } : null;
  }
  if (market === "first_goal") {
    return o.pick === "home" || o.pick === "away" || o.pick === "none" ? { pick: o.pick } : null;
  }
  if (market === "btts") {
    return o.pick === "yes" || o.pick === "no" ? { pick: o.pick } : null;
  }
  if (market === "first_goal_half") {
    return o.pick === "first" || o.pick === "second" || o.pick === "none" ? { pick: o.pick } : null;
  }
  return null;
}

/** Etiqueta legible del pick guardado (para UI e historial). */
export function marketPickLabel(market: TypedMarket, data: MarketData, homeName: string, awayName: string): string {
  if (OU_MARKETS.has(market)) {
    const d = data as OuData;
    const unidad = market === "ou_corners" ? "córners" : market === "ou_cards" ? "tarjetas" : "goles";
    return `${d.side === "over" ? "Más" : "Menos"} de ${d.line} ${unidad}`;
  }
  if (market === "first_goal") {
    const p = (data as FirstGoalData).pick;
    return p === "home" ? homeName : p === "away" ? awayName : "Sin goles";
  }
  if (market === "first_goal_half") {
    const p = (data as FirstHalfData).pick;
    return p === "first" ? "1ª mitad" : p === "second" ? "2ª mitad" : "Sin goles";
  }
  return (data as BttsData).pick === "yes" ? "Ambos marcan" : "No marcan ambos";
}

// ── Helpers sobre el FixtureDetail ──────────────────────────────────────────

/** Suma un stat (por su/sus nombre/s api-football) sobre AMBOS equipos. null si
 *  el feed no trae ese stat (→ void, no fallar mal). */
function statTotal(d: FixtureDetail, typesLower: string[]): number | null {
  let total = 0;
  let found = false;
  for (const block of d.stats ?? []) {
    for (const it of block.items ?? []) {
      if (typesLower.includes((it.type || "").toLowerCase())) {
        const v = typeof it.value === "number" ? it.value : parseInt(String(it.value ?? "").replace(/[^0-9-]/g, ""), 10);
        if (Number.isFinite(v)) { total += v; found = true; }
      }
    }
  }
  return found ? total : null;
}

/** Minuto del PRIMER gol (o null si no hay eventos de gol). */
function firstGoalMinute(d: FixtureDetail): number | null {
  const goals = d.events
    .filter((e) => (e.type || "").toLowerCase() === "goal" && e.minute != null)
    .sort((a, b) => (a.minute as number) - (b.minute as number));
  return goals.length ? (goals[0].minute as number) : null;
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

  if (OU_MARKETS.has(market)) {
    const { line, side } = data as OuData;
    let total: number | null;
    if (market === "ou_goals") total = h + a;
    else if (market === "ou_corners") total = statTotal(d, ["corner kicks", "corners"]);
    else total = statTotal(d, ["yellow cards", "red cards"]); // ou_cards: amarillas + rojas
    if (total == null) return null; // stats no disponibles → void
    if (total === line) return null; // imposible con .5, pero por seguridad
    return side === "over" ? total > line : total < line;
  }

  if (market === "btts") {
    const both = h > 0 && a > 0;
    return (data as BttsData).pick === "yes" ? both : !both;
  }

  if (market === "first_goal") {
    const hasGoalEvents = d.events.some((e) => (e.type || "").toLowerCase() === "goal");
    if (!hasGoalEvents && (h > 0 || a > 0)) return null; // sin timeline → void
    return firstGoalSide(d) === (data as FirstGoalData).pick;
  }

  if (market === "first_goal_half") {
    const totalGoals = h + a;
    const min = firstGoalMinute(d);
    if (min == null) {
      // Sin eventos de gol: acierto solo si predijo "sin goles" y el marcador es 0-0.
      return totalGoals === 0 ? (data as FirstHalfData).pick === "none" : null;
    }
    const actual = min <= 45 ? "first" : "second";
    return (data as FirstHalfData).pick === actual;
  }

  return null;
}
