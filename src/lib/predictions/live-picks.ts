// src/lib/predictions/live-picks.ts
//
// Lógica PURA de los micro-picks en vivo: definición de mercados, ventanas de
// resolución, recompensas y la resolución de un pick a partir de los eventos
// autoritativos del partido. Sin dependencias de red ni de base de datos para
// poder testearse y razonarse de forma aislada.

import type { MatchEvent, MatchEventType, Side } from "@/lib/match-center/types";

export type LiveMarket = "next_goal" | "next_event" | "next_team";

export interface LiveMarketDef {
  market: LiveMarket;
  title: string;
  /** Minutos de juego que abarca la ventana desde la creación del pick. */
  windowMin: number;
  rewardCoins: number;
  rewardXp: number;
  options: { key: string; label: string }[];
}

export const LIVE_MARKETS: Record<LiveMarket, LiveMarketDef> = {
  next_goal: {
    market: "next_goal",
    title: "¿Gol en los próximos 10 minutos?",
    windowMin: 10,
    rewardCoins: 15,
    rewardXp: 12,
    options: [
      { key: "yes", label: "Sí, habrá gol" },
      { key: "no", label: "No habrá gol" },
    ],
  },
  next_event: {
    market: "next_event",
    title: "Próxima jugada destacada (5 min)",
    windowMin: 5,
    rewardCoins: 20,
    rewardXp: 15,
    options: [
      { key: "goal", label: "Gol" },
      { key: "card", label: "Tarjeta" },
      { key: "corner", label: "Córner" },
      { key: "none", label: "Nada" },
    ],
  },
  next_team: {
    market: "next_team",
    title: "¿Quién marca primero? (10 min)",
    windowMin: 10,
    rewardCoins: 18,
    rewardXp: 14,
    options: [
      { key: "home", label: "Local" },
      { key: "away", label: "Visitante" },
      { key: "none", label: "Ninguno" },
    ],
  },
};

export const LIVE_MARKET_KEYS = Object.keys(LIVE_MARKETS) as LiveMarket[];

/** No se ofrecen ni crean micro-picks pasado este minuto de juego. */
export const LIVE_MAX_MINUTE = 90;

export function isLiveMarket(s: string): s is LiveMarket {
  return Object.prototype.hasOwnProperty.call(LIVE_MARKETS, s);
}

const GOAL_TYPES: MatchEventType[] = ["goal", "own_goal", "penalty_goal"];
const CARD_TYPES: MatchEventType[] = ["yellow", "red", "second_yellow"];

function isGoal(t: MatchEventType): boolean { return GOAL_TYPES.includes(t); }
function isCard(t: MatchEventType): boolean { return CARD_TYPES.includes(t); }

/** Lado al que se le acredita un gol. api-football ya acredita el autogol al
 *  lado que MARCA (e.side = beneficiado; el jugador es del rival), así que
 *  coincide SIEMPRE con e.side: no se invierte. */
function scoringSide(e: MatchEvent): Side | null {
  if (!isGoal(e.type) || e.side === "neutral") return null;
  return e.side;
}

/** Eventos dentro de la ventana (openMin, resolveMin], en orden cronológico. */
export function eventsInWindow(events: MatchEvent[], openMin: number, resolveMin: number): MatchEvent[] {
  return events
    .filter((e) => e.minute > openMin && e.minute <= resolveMin)
    .sort((a, b) => a.minute - b.minute || a.t - b.t);
}

/** Resuelve un pick (true = acertado) a partir de los eventos de su ventana. */
export function resolveLivePick(market: LiveMarket, choice: string, windowEvents: MatchEvent[]): boolean {
  switch (market) {
    case "next_goal": {
      const goal = windowEvents.some((e) => isGoal(e.type));
      return choice === "yes" ? goal : !goal;
    }
    case "next_event": {
      const first = windowEvents.find((e) => isGoal(e.type) || isCard(e.type) || e.type === "corner");
      const kind = !first ? "none" : isGoal(first.type) ? "goal" : isCard(first.type) ? "card" : "corner";
      return choice === kind;
    }
    case "next_team": {
      const firstGoal = windowEvents.find((e) => isGoal(e.type));
      const side = firstGoal ? scoringSide(firstGoal) : null;
      return choice === (side ?? "none");
    }
  }
}
