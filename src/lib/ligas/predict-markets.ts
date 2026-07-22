// src/lib/ligas/predict-markets.ts
//
// Definición y RESOLUCIÓN de los mercados de predicción tipados de Zona de Ligas.
// Un único motor, parametrizado por competición/fixture — sin copiar nada por
// liga. Compartido por el endpoint (validación del pick) y por el cron
// (resolución + reparto). Sin dependencias de React ni de Supabase.
//
// A1: ou_goals, first_goal, btts.
// A2: ou_corners, ou_cards, first_goal_half (stats + events del FixtureDetail).
// A2b: first_scorer, duel (datos de JUGADOR). first_scorer se resuelve de los
//      eventos (por NOMBRE, con match por apellido: los eventos no traen id);
//      duel necesita getFixturePlayerStats (por ID, fiable) → se resuelve aparte.

import type { FixtureDetail } from "@/lib/competitions/api";
import type { PlayerMatchStats } from "@/lib/ligas/fantasy";

export type TypedMarket =
  | "ou_goals"
  | "first_goal"
  | "btts"
  | "ou_corners"
  | "ou_cards"
  | "first_goal_half"
  | "first_scorer"
  | "duel"
  | "chain";
export const TYPED_MARKETS: TypedMarket[] = [
  "ou_goals",
  "first_goal",
  "btts",
  "ou_corners",
  "ou_cards",
  "first_goal_half",
  "first_scorer",
  "duel",
  "chain",
];

// Recompensa fija por mercado simple. `chain` es dinámica (ver chainReward) —
// aquí 0 como placeholder; el cron la lee de la fila (data.reward).
export const MARKET_REWARD: Record<TypedMarket, number> = {
  ou_goals: 15,
  first_goal: 15,
  btts: 12,
  ou_corners: 15,
  ou_cards: 12,
  first_goal_half: 15,
  first_scorer: 30, // el más difícil
  duel: 20,
  chain: 0,
};

// Mercados que pueden entrar en una COMBINADA: los resolubles del propio
// FixtureDetail (sin datos de jugador). Se excluyen duel (needs player-stats),
// first_scorer (needs selector) y chain (no anidar).
export const CHAIN_ELIGIBLE: TypedMarket[] = ["ou_goals", "first_goal", "btts", "ou_corners", "ou_cards", "first_goal_half"];
export const CHAIN_MIN_LEGS = 2;
export const CHAIN_MAX_LEGS = 3;
const CHAIN_REWARD_CAP = 300;

/** Recompensa de una combinada: suma de premios base × multiplicador por nº de
 *  patas (2→×2, 3→×3). Transparente y acotada. */
export function chainReward(legs: { market: TypedMarket }[]): number {
  const base = legs.reduce((s, l) => s + (MARKET_REWARD[l.market] || 0), 0);
  const mult = legs.length >= 3 ? 3 : 2;
  return Math.min(CHAIN_REWARD_CAP, base * mult);
}

export const OU_LINE_GOALS = 2.5;
export const OU_LINE_CORNERS = 9.5;
export const OU_LINE_CARDS = 4.5;

export const OLA1_SLUGS = new Set(["liga-mx", "ligapro-ecuador", "libertadores", "laliga"]);
export function isOla1(slug: string): boolean {
  return OLA1_SLUGS.has(slug);
}

export type OuData = { line: number; side: "over" | "under" };
export type FirstGoalData = { pick: "home" | "away" | "none" };
export type BttsData = { pick: "yes" | "no" };
export type FirstHalfData = { pick: "first" | "second" | "none" };
/** playerId 0 = "Nadie / sin goleador". */
export type FirstScorerData = { playerId: number; name: string };
export type DuelData = { aId: number; aName: string; bId: number; bName: string; pick: "a" | "b" };
/** Una pata de combinada: un mercado simple + su pick. */
export type ChainLeg = { market: TypedMarket; data: MarketData };
export type ChainData = { legs: ChainLeg[]; reward: number };
export type MarketData =
  | OuData | FirstGoalData | BttsData | FirstHalfData | FirstScorerData | DuelData | ChainData;

export function isTypedMarket(v: unknown): v is TypedMarket {
  return typeof v === "string" && (TYPED_MARKETS as string[]).includes(v);
}

/** ¿El mercado necesita stats por jugador (getFixturePlayerStats) para resolver? */
export function needsPlayerStats(market: TypedMarket): boolean {
  return market === "duel";
}

const OU_MARKETS = new Set<TypedMarket>(["ou_goals", "ou_corners", "ou_cards"]);
function ouLineFor(market: TypedMarket): number {
  return market === "ou_corners" ? OU_LINE_CORNERS : market === "ou_cards" ? OU_LINE_CARDS : OU_LINE_GOALS;
}

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1e9;
}
function isStr(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= 80;
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
  if (market === "first_scorer") {
    // playerId 0 = "sin goleador"; si no, id>0 y nombre.
    if (o.playerId === 0) return { playerId: 0, name: "" };
    return isInt(o.playerId) && isStr(o.name) ? { playerId: o.playerId, name: (o.name as string).trim().slice(0, 80) } : null;
  }
  if (market === "duel") {
    if (!isInt(o.aId) || !isInt(o.bId) || o.aId === o.bId || !isStr(o.aName) || !isStr(o.bName)) return null;
    if (o.pick !== "a" && o.pick !== "b") return null;
    return { aId: o.aId, bId: o.bId, aName: (o.aName as string).trim().slice(0, 80), bName: (o.bName as string).trim().slice(0, 80), pick: o.pick };
  }
  if (market === "chain") {
    const legsRaw = Array.isArray(o.legs) ? o.legs : null;
    if (!legsRaw || legsRaw.length < CHAIN_MIN_LEGS || legsRaw.length > CHAIN_MAX_LEGS) return null;
    const seen = new Set<string>();
    const legs: ChainLeg[] = [];
    for (const lr of legsRaw) {
      const lo = (lr && typeof lr === "object" ? lr : {}) as Record<string, unknown>;
      const lm = lo.market;
      // Solo mercados simples elegibles y NO repetidos (patas distintas).
      if (typeof lm !== "string" || !(CHAIN_ELIGIBLE as string[]).includes(lm) || seen.has(lm)) return null;
      const ld = validateMarketData(lm as TypedMarket, lo.data);
      if (!ld) return null;
      seen.add(lm);
      legs.push({ market: lm as TypedMarket, data: ld });
    }
    return { legs, reward: chainReward(legs) };
  }
  return null;
}

/** Etiqueta legible del pick guardado (para UI e historial). */
export function marketPickLabel(market: TypedMarket, data: MarketData, homeName: string, awayName: string): string {
  if (OU_MARKETS.has(market)) {
    const d = data as OuData;
    const u = market === "ou_corners" ? "córners" : market === "ou_cards" ? "tarjetas" : "goles";
    return `${d.side === "over" ? "Más" : "Menos"} de ${d.line} ${u}`;
  }
  if (market === "first_goal") {
    const p = (data as FirstGoalData).pick;
    return p === "home" ? homeName : p === "away" ? awayName : "Sin goles";
  }
  if (market === "first_goal_half") {
    const p = (data as FirstHalfData).pick;
    return p === "first" ? "1ª mitad" : p === "second" ? "2ª mitad" : "Sin goles";
  }
  if (market === "first_scorer") {
    const d = data as FirstScorerData;
    return d.playerId === 0 ? "Sin goleador" : d.name;
  }
  if (market === "duel") {
    const d = data as DuelData;
    return `Gana ${d.pick === "a" ? d.aName : d.bName}`;
  }
  if (market === "chain") {
    const d = data as ChainData;
    return `Combinada de ${d.legs.length} (+${d.reward})`;
  }
  return (data as BttsData).pick === "yes" ? "Ambos marcan" : "No marcan ambos";
}

// ── Helpers sobre el FixtureDetail ──────────────────────────────────────────

function statTotal(d: FixtureDetail, typesLower: string[]): number | null {
  let total = 0, found = false;
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

function firstGoalMinute(d: FixtureDetail): number | null {
  const goals = d.events
    .filter((e) => (e.type || "").toLowerCase() === "goal" && e.minute != null)
    .sort((a, b) => (a.minute as number) - (b.minute as number));
  return goals.length ? (goals[0].minute as number) : null;
}

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

/** Nombre del PRIMER goleador real (ignora autogoles). null si no hubo gol de
 *  jugada. Los eventos de api-football solo traen NOMBRE, no id. */
function firstScorerName(d: FixtureDetail): string | null {
  const goals = d.events
    .filter((e) => (e.type || "").toLowerCase() === "goal" && (e.detail || "").toLowerCase().indexOf("own") === -1 && e.minute != null && e.player)
    .sort((a, b) => (a.minute as number) - (b.minute as number));
  return goals.length ? (goals[0].player as string) : null;
}

/** Normaliza un nombre a su APELLIDO (última palabra), sin acentos ni iniciales,
 *  para casar "L. Messi" (evento) con "Lionel Messi" (plantilla). */
function lastNameKey(name: string): string {
  const clean = name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z\s.]/g, "").replace(/\b[a-z]\.\s*/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : clean;
}
function nameMatches(a: string, b: string): boolean {
  return !!a && !!b && lastNameKey(a) === lastNameKey(b);
}

/**
 * Resuelve un mercado tipado (EXCEPTO duel, que necesita player-stats → ver
 * resolveDuel). true=acierto, false=fallo, null=indeterminado (void).
 */
export function resolveTypedMarket(market: TypedMarket, data: MarketData, d: FixtureDetail): boolean | null {
  const h = d.fixture.score.home;
  const a = d.fixture.score.away;
  if (h == null || a == null) return null;

  if (market === "chain") {
    // Todas las patas deben acertar. Una pata indeterminada -> combinada void.
    for (const leg of (data as ChainData).legs || []) {
      const v = resolveTypedMarket(leg.market, leg.data, d);
      if (v === null) return null;
      if (!v) return false;
    }
    return true;
  }

  if (OU_MARKETS.has(market)) {
    const { line, side } = data as OuData;
    let total: number | null;
    if (market === "ou_goals") total = h + a;
    else if (market === "ou_corners") total = statTotal(d, ["corner kicks", "corners"]);
    else total = statTotal(d, ["yellow cards", "red cards"]);
    if (total == null) return null;
    if (total === line) return null;
    return side === "over" ? total > line : total < line;
  }

  if (market === "btts") {
    const both = h > 0 && a > 0;
    return (data as BttsData).pick === "yes" ? both : !both;
  }

  if (market === "first_goal") {
    const hasGoalEvents = d.events.some((e) => (e.type || "").toLowerCase() === "goal");
    if (!hasGoalEvents && (h > 0 || a > 0)) return null;
    return firstGoalSide(d) === (data as FirstGoalData).pick;
  }

  if (market === "first_goal_half") {
    const min = firstGoalMinute(d);
    if (min == null) return h + a === 0 ? (data as FirstHalfData).pick === "none" : null;
    return (data as FirstHalfData).pick === (min <= 45 ? "first" : "second");
  }

  if (market === "first_scorer") {
    const scorer = firstScorerName(d);
    const picked = data as FirstScorerData;
    if (picked.playerId === 0) return scorer == null; // "sin goleador"
    if (scorer == null) return false;
    return nameMatches(scorer, picked.name);
  }

  return null; // duel se resuelve aparte
}

/** Resuelve un DUELO con las stats por jugador del partido. Métrica transparente:
 *  goles×4 + asistencias×2, desempate por rating. true/false/null(empate=void). */
export function resolveDuel(data: DuelData, stats: PlayerMatchStats[]): boolean | null {
  const find = (id: number) => stats.find((s) => s.playerId === id) ?? null;
  const a = find(data.aId);
  const b = find(data.bId);
  const score = (p: PlayerMatchStats | null) => (p ? p.goals * 4 + p.assists * 2 : -1);
  const sa = score(a), sb = score(b);
  let winner: "a" | "b";
  if (sa !== sb) winner = sa > sb ? "a" : "b";
  else {
    const ra = a?.rating ?? 0, rb = b?.rating ?? 0;
    if (ra === rb) return null; // empate real → void
    winner = ra > rb ? "a" : "b";
  }
  return data.pick === winner;
}
