// src/lib/micro/micro.ts
//
// Lógica PURA de las Micro-predicciones (predicciones EN VIVO durante el partido).
// A diferencia de los live-picks (auto-servicio: el usuario abre un menú y elige
// un mercado), las micro-predicciones las EMITE el sistema: detecta un evento real
// o un momento clave del reloj y lanza una ventana corta para que TODOS predigan a
// la vez. Aquí vive solo el dominio: catálogo, ventanas, puntuación, Cadena de
// Fuego y la resolución a partir de los eventos autoritativos del partido. Sin red
// ni base de datos, para poder testearse y razonarse de forma aislada.
//
// Verificado contra el feed real de api-football (plan Ultra) el 2026-06-07:
//   - El penalti se anuncia ANTES del lanzamiento (Var/"Penalty confirmed"),
//     dejando una ventana para "¿gol o fallo?".
//   - Los cambios traen quien sale (player) y quien entra (assist/playerIn).
//   - Goles con autor+asistente; goles anulados con Var/"Goal cancelled".

import type { MatchEvent, MatchEventType, Side } from "@/lib/match-center/types";

// ─── Categorías ──────────────────────────────────────────────────────────────
// reactive  → la dispara un evento real del partido (penalti, roja, gol anulado…)
// temporal  → la dispara el reloj (min 15, 30, 45, 75, 85…)
// ai        → la genera Claude (Fase 2): pregunta contextual y creativa, pero
//             SIEMPRE atada a un predicado resoluble por eventos (gol sí/no, lado
//             del próximo gol, tarjeta sí/no), para que la resolución sea
//             determinista igual que el resto.
export type MicroCategory = "reactive" | "temporal" | "ai";

// ─── Tipos de micro-predicción del catálogo Fase 1 ───────────────────────────
export type MicroKind =
  // Reactivas
  | "penalty_outcome"        // penalti señalado → ¿gol o fallo?
  | "red_card_response"      // roja → ¿marca el equipo en inferioridad antes del final?
  | "var_goal_review"        // gol anulado por VAR → ¿gol válido antes del descanso/poco después?
  | "scorer_sub_impact"      // cambio de un atacante → ¿marca o asiste el sustituto?
  | "next_scorer_side"       // tras un gol → ¿quién marca el próximo (local/visitante/ninguno)?
  // Temporales
  | "goal_before_30"         // min 15 → ¿habrá gol antes del 30'?
  | "halftime_result"        // min 30 → resultado al descanso (local/empate/visitante)
  | "first_second_half"      // descanso → ¿quién marca primero en la 2ª parte?
  | "more_goals_after_60"    // min 60 → ¿habrá más goles?
  | "goal_in_stoppage"       // min 85 → ¿gol en el descuento?
  // IA (Fase 2): predicados resolubles que Claude viste con una pregunta contextual.
  | "ai_goal_yesno"          // ¿habrá gol en la ventana? (sí/no)
  | "ai_goal_side"           // ¿quién marca el próximo en la ventana? (local/visitante/ninguno)
  | "ai_card_yesno";         // ¿habrá tarjeta en la ventana? (sí/no)

export type OptionKey = string;

export interface MicroOption {
  key: OptionKey;
  label: string;
}

export interface MicroKindDef {
  kind: MicroKind;
  category: MicroCategory;
  /** Texto base de la pregunta. Puede llevar marcadores {home}/{away}/{player}. */
  question: string;
  emoji: string;
  /** Opciones FIJAS. Si es null, las opciones se generan en contexto (p.ej. jugadores). */
  options: MicroOption[] | null;
  /** Ventana de respuesta en SEGUNDOS de reloj real. */
  windowSeconds: number;
  /** Puntos base (antes de multiplicadores). */
  basePoints: number;
}

// Opciones reutilizables.
const YES_NO: MicroOption[] = [
  { key: "yes", label: "Sí" },
  { key: "no", label: "No" },
];
const SIDE_OR_NONE: MicroOption[] = [
  { key: "home", label: "Local" },
  { key: "away", label: "Visitante" },
  { key: "none", label: "Ninguno" },
];
const RESULT_3WAY: MicroOption[] = [
  { key: "home", label: "Gana local" },
  { key: "draw", label: "Empate" },
  { key: "away", label: "Gana visitante" },
];

export const MICRO_CATALOG: Record<MicroKind, MicroKindDef> = {
  // ── Reactivas ──
  penalty_outcome: {
    kind: "penalty_outcome",
    category: "reactive",
    question: "¡Penalti! ¿Gol o fallo?",
    emoji: "⚡",
    options: [
      { key: "goal", label: "⚽ Gol" },
      { key: "miss", label: "❌ Fallo" },
    ],
    windowSeconds: 15,
    basePoints: 20,
  },
  red_card_response: {
    kind: "red_card_response",
    category: "reactive",
    question: "Roja: ¿marcará el equipo en inferioridad antes del final?",
    emoji: "🟥",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 25,
  },
  var_goal_review: {
    kind: "var_goal_review",
    category: "reactive",
    question: "Gol anulado por el VAR. ¿Llegará un gol válido en los próximos 15'?",
    emoji: "📺",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 20,
  },
  scorer_sub_impact: {
    kind: "scorer_sub_impact",
    category: "reactive",
    question: "Cambio ofensivo: ¿el sustituto marcará o asistirá antes del final?",
    emoji: "🔄",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 30,
  },
  next_scorer_side: {
    kind: "next_scorer_side",
    category: "reactive",
    question: "¿Quién marca el próximo gol?",
    emoji: "🎯",
    options: SIDE_OR_NONE,
    windowSeconds: 15,
    basePoints: 15,
  },
  // ── Temporales ──
  goal_before_30: {
    kind: "goal_before_30",
    category: "temporal",
    question: "¿Habrá gol antes del minuto 30?",
    emoji: "⏱️",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 15,
  },
  halftime_result: {
    kind: "halftime_result",
    category: "temporal",
    question: "¿Cómo van al descanso?",
    emoji: "🟰",
    options: RESULT_3WAY,
    windowSeconds: 15,
    basePoints: 20,
  },
  first_second_half: {
    kind: "first_second_half",
    category: "temporal",
    question: "¿Quién marca primero en la segunda parte?",
    emoji: "🥅",
    options: SIDE_OR_NONE,
    windowSeconds: 15,
    basePoints: 20,
  },
  more_goals_after_60: {
    kind: "more_goals_after_60",
    category: "temporal",
    question: "¿Habrá más goles a partir de ahora?",
    emoji: "➕",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 12,
  },
  goal_in_stoppage: {
    kind: "goal_in_stoppage",
    category: "temporal",
    question: "¿Habrá gol en el tiempo de descuento?",
    emoji: "🔚",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 25,
  },
  // ── IA (Fase 2) ── La pregunta y los puntos los fija el generador; aquí van
  // los valores por defecto y las opciones canónicas de cada predicado.
  ai_goal_yesno: {
    kind: "ai_goal_yesno",
    category: "ai",
    question: "¿Habrá gol en los próximos minutos?",
    emoji: "🤖",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 20,
  },
  ai_goal_side: {
    kind: "ai_goal_side",
    category: "ai",
    question: "¿Quién marca el próximo gol?",
    emoji: "🤖",
    options: SIDE_OR_NONE,
    windowSeconds: 15,
    basePoints: 20,
  },
  ai_card_yesno: {
    kind: "ai_card_yesno",
    category: "ai",
    question: "¿Habrá tarjeta en los próximos minutos?",
    emoji: "🤖",
    options: YES_NO,
    windowSeconds: 15,
    basePoints: 18,
  },
};

/** Predicados de IA resolubles por eventos. El generador elige uno de estos. */
export const AI_MICRO_KINDS: MicroKind[] = ["ai_goal_yesno", "ai_goal_side", "ai_card_yesno"];
export function isAiMicroKind(k: MicroKind): boolean {
  return AI_MICRO_KINDS.includes(k);
}

export const MICRO_KINDS = Object.keys(MICRO_CATALOG) as MicroKind[];

export function isMicroKind(s: string): s is MicroKind {
  return Object.prototype.hasOwnProperty.call(MICRO_CATALOG, s);
}

// ─── Horizonte de RESOLUCIÓN ──────────────────────────────────────────────────
// IMPORTANTE: la VENTANA DE RESPUESTA (windowSeconds) es cuánto tiempo tiene el
// usuario para contestar (segundos reales). El HORIZONTE DE RESOLUCIÓN es el
// tramo de PARTIDO sobre el que se evalúa el predicado, y es independiente:
// "¿gol antes del 30?" se responde en 60s pero solo se resuelve cuando el partido
// llega al minuto 30. Antes ambos se derivaban de windowSeconds, lo que resolvía
// casi todas las micros en ~1 minuto de juego (incorrecto respecto a la pregunta).
export type ResolveHorizon =
  | { type: "fromOpen"; minutes: number }   // open + N minutos de partido
  | { type: "absolute"; minute: number }    // hasta un minuto fijo del partido
  | { type: "endOfMatch" };                 // hasta el final (resto del partido)

// Cota segura del "final": cubre 90' + prórroga + descuento sin que ningún
// partido la alcance, de modo que eventsInWindow incluya todo lo posterior al
// open y el cron solo liquide cuando finished === true.
export const END_OF_MATCH_MIN = 200;

export const MICRO_RESOLVE_HORIZON: Record<MicroKind, ResolveHorizon> = {
  // Reactivas
  penalty_outcome:     { type: "fromOpen", minutes: 3 },   // nominal: el settle busca el desenlace hasta el final y resuelve en cuanto aparece
  red_card_response:   { type: "endOfMatch" },             // "antes del final"
  var_goal_review:     { type: "fromOpen", minutes: 15 },  // "próximos 15'"
  scorer_sub_impact:   { type: "endOfMatch" },             // "antes del final"
  next_scorer_side:    { type: "endOfMatch" },             // el "próximo" gol, cuando llegue
  // Temporales
  goal_before_30:      { type: "absolute", minute: 30 },
  halftime_result:     { type: "absolute", minute: 45 },   // resuelve al descanso
  first_second_half:   { type: "endOfMatch" },             // primer gol de la 2ª parte
  more_goals_after_60: { type: "endOfMatch" },             // "a partir de ahora"
  goal_in_stoppage:    { type: "endOfMatch" },             // gol en el descuento
  // IA: el horizonte se deriva de su propia windowSeconds (ver resolveMinuteFor).
  ai_goal_yesno:       { type: "fromOpen", minutes: 0 },
  ai_goal_side:        { type: "fromOpen", minutes: 0 },
  ai_card_yesno:       { type: "fromOpen", minutes: 0 },
};

/**
 * Minuto de partido a partir del cual la micro es resoluble (ya se han producido
 * todos los eventos que la pregunta abarca). El cron espera a que el partido lo
 * alcance —o a que termine— antes de liquidar. Para las micros de IA, que fijan
 * su propia ventana de predicción, el horizonte se deriva de windowSeconds.
 */
export function resolveMinuteFor(kind: MicroKind, openMinute: number, windowSeconds: number): number {
  if (isAiMicroKind(kind)) return openMinute + Math.ceil(windowSeconds / 60);
  const h = MICRO_RESOLVE_HORIZON[kind];
  switch (h.type) {
    case "fromOpen":   return openMinute + Math.max(1, h.minutes);
    case "absolute":   return Math.max(openMinute + 1, h.minute);
    case "endOfMatch": return END_OF_MATCH_MIN;
  }
}

// ─── Cadena de Fuego 🔥 ───────────────────────────────────────────────────────
// Aciertos consecutivos en un mismo partido elevan el multiplicador. Un fallo la
// rompe. Tabla del spec (2→×1.5, 3→×2, 4→×3, 5+→×5).
export interface FireTier {
  minChain: number;
  multiplier: number;
  label: string;
  emoji: string;
}
export const FIRE_TIERS: FireTier[] = [
  { minChain: 5, multiplier: 5.0, label: "Infierno", emoji: "🌋" },
  { minChain: 4, multiplier: 3.0, label: "Llamarada", emoji: "🔥🔥" },
  { minChain: 3, multiplier: 2.0, label: "En llamas", emoji: "🔥" },
  { minChain: 2, multiplier: 1.5, label: "Calentando", emoji: "✨" },
  { minChain: 0, multiplier: 1.0, label: "", emoji: "" },
];

/** Multiplicador de Cadena de Fuego para una racha de `chain` aciertos previos. */
export function fireMultiplier(chain: number): number {
  return (FIRE_TIERS.find((t) => chain >= t.minChain) ?? FIRE_TIERS[FIRE_TIERS.length - 1]).multiplier;
}

/** Tier completo (para UI: borde, llamas, etc.). */
export function fireTier(chain: number): FireTier {
  return FIRE_TIERS.find((t) => chain >= t.minChain) ?? FIRE_TIERS[FIRE_TIERS.length - 1];
}

/** Bonus XP plano del spec: 6+ aciertos dan +100 XP por cada acierto extra. */
export function fireBonusXp(chain: number): number {
  return chain >= 6 ? (chain - 5) * 100 : 0;
}

// ─── Puntuación ───────────────────────────────────────────────────────────────
export interface ScoreInput {
  basePoints: number;
  /** Racha ANTES de esta micro (nº de aciertos consecutivos ya logrados). */
  chainBefore: number;
  /** Multiplicador del partido (Modo Underdog/Diamante). */
  matchMultiplier: number;
  /** Modo Fantasma: puntos a ×0.5. */
  ghost: boolean;
}
export interface ScoreResult {
  points: number;
  fireMultiplier: number;
  breakdown: string;
}

/**
 * Puntos de un acierto. Orden: base × Cadena de Fuego × multiplicador de partido
 * (× 0.5 si Fantasma). El fallo siempre vale 0 (no resta) — la penalización es
 * perder la racha, que es lo que duele en este modo.
 */
export function scoreMicro(input: ScoreInput): ScoreResult {
  const fm = fireMultiplier(input.chainBefore);
  const mm = input.matchMultiplier || 1;
  const ghost = input.ghost ? 0.5 : 1;
  const points = Math.round(input.basePoints * fm * mm * ghost);
  const parts = [`${input.basePoints} base`];
  if (fm !== 1) parts.push(`×${fm} 🔥`);
  if (mm !== 1) parts.push(`×${mm} partido`);
  if (input.ghost) parts.push("×0.5 fantasma");
  return { points, fireMultiplier: fm, breakdown: `${parts.join(" ")} = ${points} pts` };
}

// ─── Resolución a partir de eventos del partido ──────────────────────────────
const GOAL_TYPES: MatchEventType[] = ["goal", "own_goal", "penalty_goal"];
const CARD_TYPES: MatchEventType[] = ["yellow", "red", "second_yellow"];

function isGoal(t: MatchEventType): boolean { return GOAL_TYPES.includes(t); }
function isCard(t: MatchEventType): boolean { return CARD_TYPES.includes(t); }

/** Lado al que se ACREDITA un gol (el gol en propia cuenta para el rival). */
export function scoringSide(e: MatchEvent): Side | null {
  if (!isGoal(e.type) || e.side === "neutral") return null;
  if (e.type === "own_goal") return e.side === "home" ? "away" : "home";
  return e.side;
}

/** Eventos en la ventana de minutos (openMin, resolveMin], cronológicos. */
export function eventsInWindow(events: MatchEvent[], openMin: number, resolveMin: number): MatchEvent[] {
  return events
    .filter((e) => e.minute > openMin && e.minute <= resolveMin)
    .sort((a, b) => a.minute - b.minute || a.t - b.t);
}

/**
 * Contexto que el resolutor necesita además de los eventos de la ventana. Por
 * ejemplo, el lado en inferioridad numérica (para red_card_response) o el lado
 * del cambio (scorer_sub_impact), que se fijan al CREAR la micro y se guardan en
 * `trigger_data`.
 */
export interface ResolveContext {
  /** Lado relevante fijado al disparar (equipo de la roja, del cambio…). */
  side?: Side;
  /** Nombre del jugador relevante (sustituto que entró), para sub_impact. */
  playerName?: string;
  /** Marcador al abrir la ventana [home, away] (para halftime_result, etc.). */
  scoreAtOpen?: [number, number];
}

/**
 * Resuelve una micro-predicción: devuelve la opción CORRECTA dada la ventana de
 * eventos y el contexto, o null si AÚN no es resoluble (hoy solo el penalti: sin
 * desenlace en el feed no se adivina). Con null el llamador espera otra pasada
 * y, si el partido termina sin desenlace, ANULA la micro (nadie gana ni pierde).
 */
export function resolveMicro(
  kind: MicroKind,
  windowEvents: MatchEvent[],
  ctx: ResolveContext = {},
): OptionKey | null {
  switch (kind) {
    case "penalty_outcome": {
      // Primer desenlace de penalti tras abrir la ventana. Si el feed aún no lo
      // trae (VAR largo, lanzamiento demorado), NO se resuelve por defecto:
      // devolver "miss" pagaría mal un penalti que sí entró.
      const pen = windowEvents.find(
        (e) => e.type === "penalty_goal" || e.type === "penalty_miss",
      );
      if (!pen) return null;
      return pen.type === "penalty_goal" ? "goal" : "miss";
    }
    case "red_card_response": {
      const side = ctx.side;
      const scored = side ? windowEvents.some((e) => scoringSide(e) === side) : false;
      return scored ? "yes" : "no";
    }
    case "var_goal_review": {
      const validGoal = windowEvents.some((e) => isGoal(e.type));
      return validGoal ? "yes" : "no";
    }
    case "scorer_sub_impact": {
      const name = ctx.playerName;
      const involved = name
        ? windowEvents.some(
            (e) => isGoal(e.type) && (e.player === name || e.assist === name),
          )
        : false;
      return involved ? "yes" : "no";
    }
    case "next_scorer_side": {
      const goal = windowEvents.find((e) => isGoal(e.type));
      const s = goal ? scoringSide(goal) : null;
      return s ?? "none";
    }
    case "goal_before_30": {
      return windowEvents.some((e) => isGoal(e.type)) ? "yes" : "no";
    }
    case "halftime_result": {
      const [h0, a0] = ctx.scoreAtOpen ?? [0, 0];
      let h = h0, a = a0;
      for (const e of windowEvents) {
        const s = scoringSide(e);
        if (s === "home") h++;
        else if (s === "away") a++;
      }
      return h > a ? "home" : a > h ? "away" : "draw";
    }
    case "first_second_half": {
      const goal = windowEvents.find((e) => isGoal(e.type));
      const s = goal ? scoringSide(goal) : null;
      return s ?? "none";
    }
    case "more_goals_after_60": {
      return windowEvents.some((e) => isGoal(e.type)) ? "yes" : "no";
    }
    case "goal_in_stoppage": {
      // Gol con minuto añadido (extra) dentro de la ventana.
      return windowEvents.some((e) => isGoal(e.type) && (e.extra ?? 0) > 0) ? "yes" : "no";
    }
    // ── IA (Fase 2): predicados deterministas ──
    case "ai_goal_yesno": {
      return windowEvents.some((e) => isGoal(e.type)) ? "yes" : "no";
    }
    case "ai_goal_side": {
      const goal = windowEvents.find((e) => isGoal(e.type));
      const s = goal ? scoringSide(goal) : null;
      return s ?? "none";
    }
    case "ai_card_yesno": {
      return windowEvents.some((e) => isCard(e.type)) ? "yes" : "no";
    }
  }
}
