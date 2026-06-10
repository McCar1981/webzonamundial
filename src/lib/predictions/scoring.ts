// src/lib/predictions/scoring.ts
//
// Motor de puntuación determinista de las Predicciones. Dos fases:
//   1) scoreBase()  → puntos base según el tipo (incluye confianza y contrarian,
//                     que son intrínsecos a su tipo).
//   2) applyBonuses() → multiplicadores personales (racha, early bird) y de
//                     partido (Modo Underdog/Diamante).
//
// points_earned = round( base × racha(×1.5) × earlyBird(×1.2) × match_multiplier )

import type {
  ChainData,
  DuelData,
  ExactScoreData,
  FirstScorerData,
  MatchResultReal,
  MinuteDramaData,
  OverUnderData,
  PredictionData,
  PredictionType,
  ResolutionContext,
  SocialData,
  WinnerData,
  WinnerResult,
} from "./types";
import { MINUTE_RANGES, type MinuteRange } from "./types";

export interface BaseScore {
  correct: boolean;
  points: number;
  detail: string; // texto del desglose ("Resultado exacto", "Ganador con marcador erróneo", ...)
  // FIX 9: si el feed del partido llega INCOMPLETO para este tipo, la predicción
  // se "anula" (void) en vez de puntuar 0: 0 pts pero NO cuenta como fallo en
  // stats/racha (es neutra). resolveMatch lee este flag.
  voided?: boolean;
}

const STREAK_MULT = 1.5;
const EARLY_BIRD_MULT = 1.2;

// ─── Utilidades de resultado ─────────────────────────────────────────────────
function winnerOf(home: number, away: number): WinnerResult {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

function firstGoal(result: MatchResultReal) {
  return result.events
    .filter((e) => e.type === "goal")
    .sort((a, b) => a.minute - b.minute)[0];
}
function firstCard(result: MatchResultReal) {
  return result.events
    .filter((e) => e.type === "card")
    .sort((a, b) => a.minute - b.minute)[0];
}
function lastGoal(result: MatchResultReal) {
  const goals = result.events.filter((e) => e.type === "goal").sort((a, b) => a.minute - b.minute);
  return goals[goals.length - 1];
}
function rangeOfMinute(minute: number): MinuteRange {
  if (minute <= 10) return "0-10";
  if (minute <= 20) return "11-20";
  if (minute <= 30) return "21-30";
  if (minute <= 45) return "31-45";
  if (minute <= 55) return "46-55";
  if (minute <= 65) return "56-65";
  if (minute <= 75) return "66-75";
  if (minute <= 90) return "76-90";
  return "90+";
}
function adjacentRange(a: MinuteRange, b: MinuteRange): boolean {
  const ia = MINUTE_RANGES.indexOf(a);
  const ib = MINUTE_RANGES.indexOf(b);
  return Math.abs(ia - ib) === 1;
}

// ─── Scoring por tipo ────────────────────────────────────────────────────────
function scoreExactScore(d: ExactScoreData, r: MatchResultReal): BaseScore {
  const eh = r.score.home, ea = r.score.away;
  if (d.home_goals === eh && d.away_goals === ea) {
    return { correct: true, points: 25, detail: "Resultado exacto" };
  }
  const diff = Math.abs(d.home_goals - eh) + Math.abs(d.away_goals - ea);
  const sameWinner = winnerOf(d.home_goals, d.away_goals) === winnerOf(eh, ea);
  if (diff === 1) return { correct: true, points: 10, detail: "Cerca: fallo por 1 gol" };
  if (sameWinner) return { correct: true, points: 5, detail: "Ganador correcto, marcador erróneo" };
  return { correct: false, points: 0, detail: "Marcador y ganador fallados" };
}

function scoreWinner(d: WinnerData, mult: number, r: MatchResultReal): BaseScore {
  const real = winnerOf(r.score.home, r.score.away);
  const m = Math.max(1, Math.min(3, mult || 1));
  if (d.result === real) return { correct: true, points: 10 * m, detail: `Ganador acertado ×${m}` };
  return { correct: false, points: -5 * m, detail: `Ganador fallado ×${m}` };
}

function scoreFirstScorer(d: FirstScorerData, r: MatchResultReal): BaseScore {
  const totalGoals = r.score.home + r.score.away;
  if (d.no_goals) {
    return totalGoals === 0
      ? { correct: true, points: 20, detail: "Acertaste el 0-0" }
      : { correct: false, points: 0, detail: "Sí hubo goles" };
  }
  if (totalGoals === 0) return { correct: false, points: 0, detail: "No hubo goles" };
  const fg = firstGoal(r);
  if (fg && fg.player_id === d.player_id) {
    return { correct: true, points: 30, detail: "Primer goleador exacto" };
  }
  const scoredAnytime = r.events.some((e) => e.type === "goal" && e.player_id === d.player_id);
  if (scoredAnytime) return { correct: true, points: 10, detail: "Marcó, pero no fue el primero" };
  return { correct: false, points: 0, detail: "Tu goleador no marcó" };
}

// Cuántos eslabones, EN ORDEN desde el primero, son correctos.
export interface ChainStepResult { step: number; correct: boolean }
export function evalChain(d: ChainData, r: MatchResultReal): { results: ChainStepResult[]; inOrder: number } {
  const goals = r.events.filter((e) => e.type === "goal").sort((a, b) => a.minute - b.minute);
  // FIX 4: tarjetas ordenadas por minuto + cursor de minuto consumido. Igual
  // que los goles, cada eslabón "card" debe consumir una tarjeta DISTINTA del
  // equipo indicado con minuto estrictamente creciente respecto a la anterior
  // consumida. Así una cadena trivial repetida [card,card,card] ya no acierta.
  const cards = r.events.filter((e) => e.type === "card").sort((a, b) => a.minute - b.minute);
  let goalCursor = 0;
  let cardLastMinute = -Infinity; // minuto de la última tarjeta consumida
  const cardUsed = new Set<number>(); // índices de tarjetas ya consumidas
  const results: ChainStepResult[] = [];
  for (const step of d.chain) {
    let ok = false;
    switch (step.event_type) {
      case "goal": {
        const g = goals[goalCursor];
        if (g && g.team === step.event_data.team) ok = true;
        goalCursor++;
        break;
      }
      case "halftime_score": {
        // Marcador al descanso = goles con minuto <= 45.
        const ht = goals.filter((g) => g.minute <= 45);
        const h = ht.filter((g) => g.team === "home").length;
        const a = ht.filter((g) => g.team === "away").length;
        ok = h === (step.event_data.home ?? -1) && a === (step.event_data.away ?? -1);
        break;
      }
      case "winner": {
        ok = winnerOf(r.score.home, r.score.away) === step.event_data.result;
        break;
      }
      case "card": {
        // Busca la primera tarjeta no consumida, del equipo indicado, con minuto
        // estrictamente mayor al de la última consumida; la consume si existe.
        const idx = cards.findIndex(
          (c, i) => !cardUsed.has(i) && c.team === step.event_data.team && c.minute > cardLastMinute,
        );
        if (idx !== -1) {
          ok = true;
          cardUsed.add(idx);
          cardLastMinute = cards[idx].minute;
        }
        break;
      }
    }
    results.push({ step: step.step, correct: ok });
  }
  // inOrder = aciertos consecutivos desde el primero.
  let inOrder = 0;
  for (const res of results) {
    if (res.correct) inOrder++;
    else break;
  }
  return { results, inOrder };
}

function scoreChain(d: ChainData, r: MatchResultReal): BaseScore {
  const { inOrder } = evalChain(d, r);
  const total = d.chain.length;
  if (inOrder >= total && total >= 5) return { correct: true, points: 100, detail: "Cadena completa — JACKPOT" };
  if (inOrder >= total && total > 0) return { correct: true, points: 100, detail: `Cadena completa (${total}/${total})` };
  // Escala por aciertos en orden.
  const table: Record<number, number> = { 4: 50, 3: 25, 2: 10, 1: 3 };
  const pts = table[inOrder] ?? 0;
  return { correct: inOrder >= total && total > 0, points: pts, detail: `${inOrder}/${total} eslabones en orden` };
}

function scoreDuel(d: DuelData, r: MatchResultReal): BaseScore {
  // El ganador del duelo es el jugador con mejor rating en player_ratings.
  // duel_id codifica "playerA__playerB" para no depender de un store.
  const [pa, pb] = d.duel_id.split("__");
  if (!pa || !pb) return { correct: false, points: 0, detail: "Duelo inválido" };
  // FIX 9: si el feed no trae rating para AMBOS jugadores del duelo, anular
  // (no penalizar al usuario por datos incompletos).
  const ratings: Record<string, number> = r.player_ratings ?? {};
  if (ratings[pa] == null || ratings[pb] == null) {
    return { correct: false, points: 0, detail: "Anulado: sin ratings", voided: true };
  }
  const ra = ratings[pa];
  const rb = ratings[pb];
  const winner = ra === rb ? null : ra > rb ? pa : pb;
  if (winner && winner === d.winner_player_id) {
    return { correct: true, points: 15, detail: "Duelo acertado" };
  }
  return { correct: false, points: 0, detail: "Duelo fallado" };
}

function scoreOverUnder(d: OverUnderData, r: MatchResultReal): BaseScore {
  // FIX 9: las categorías de estadística (no goles) dependen de r.stats. Si el
  // feed no trae esa categoría, anular en vez de puntuar 0 injusto.
  const stats = r.stats as MatchResultReal["stats"] | undefined;
  let actual = 0;
  switch (d.category) {
    case "goals": actual = r.score.home + r.score.away; break;
    case "corners":
      if (!stats?.corners) return { correct: false, points: 0, detail: "Anulado: sin datos de córners", voided: true };
      actual = stats.corners.home + stats.corners.away; break;
    case "cards":
      if (!stats?.cards) return { correct: false, points: 0, detail: "Anulado: sin datos de tarjetas", voided: true };
      actual = stats.cards.home + stats.cards.away; break;
    case "shots_on_target":
      if (!stats?.shots_on_target) return { correct: false, points: 0, detail: "Anulado: sin datos de tiros a puerta", voided: true };
      actual = stats.shots_on_target.home + stats.shots_on_target.away; break;
  }
  const isOver = actual > d.line;
  const hit = (d.choice === "over" && isOver) || (d.choice === "under" && !isOver);
  const pts = d.difficulty === "hard" ? 20 : d.difficulty === "medium" ? 12 : 8;
  return hit
    ? { correct: true, points: pts, detail: `Over/Under acertado (${d.difficulty})` }
    : { correct: false, points: 0, detail: "Over/Under fallado" };
}

function scoreMinuteDrama(d: MinuteDramaData, r: MatchResultReal): BaseScore {
  // Caso "no habrá goles".
  if (d.no_event) {
    const noGoals = r.score.home + r.score.away === 0;
    return noGoals
      ? { correct: true, points: 25, detail: "Acertaste el 0-0" }
      : { correct: false, points: 0, detail: "Sí hubo evento" };
  }
  // FIX 9: first_sub depende de r.first_sub_minute; si el feed no lo trae,
  // anular (no es lo mismo "no hubo dato" que "el evento no ocurrió").
  if (d.event === "first_sub" && r.first_sub_minute == null) {
    return { correct: false, points: 0, detail: "Anulado: sin minuto del primer cambio", voided: true };
  }
  let evMinute: number | undefined;
  switch (d.event) {
    case "first_goal": evMinute = firstGoal(r)?.minute; break;
    case "first_card": evMinute = firstCard(r)?.minute; break;
    case "last_goal": evMinute = lastGoal(r)?.minute; break;
    case "first_sub": evMinute = r.first_sub_minute; break;
  }
  if (evMinute == null) return { correct: false, points: 0, detail: "El evento no ocurrió" };
  const real = rangeOfMinute(evMinute);
  if (d.minute_range === real) return { correct: true, points: 20, detail: `Franja exacta (min ${evMinute})` };
  if (d.minute_range && adjacentRange(d.minute_range, real)) {
    return { correct: true, points: 8, detail: `Franja adyacente (min ${evMinute})` };
  }
  return { correct: false, points: 0, detail: `Franja fallada (min ${evMinute})` };
}

// Tipo 8: la resolución del acierto depende de la sub-pregunta (winner por defecto).
function scoreSocial(d: SocialData, r: MatchResultReal): BaseScore {
  let hit = false;
  if (d.question_key === "winner") {
    hit = d.choice === winnerOf(r.score.home, r.score.away);
  } else if (d.question_key === "exact_score") {
    hit = d.choice === `${r.score.home}-${r.score.away}`;
  } else if (d.question_key === "first_scorer") {
    hit = firstGoal(r)?.player_id === d.choice;
  }
  if (!hit) return { correct: false, points: 0, detail: "Manada fallada" };
  const pct = d.community_pct_at_time;
  // Ir CONTRA la mayoría (tu opción era minoritaria) multiplica.
  let mult = 1, tag = "con la mayoría";
  if (pct < 20) { mult = 3; tag = "ultra-contrarian"; }
  else if (pct < 50) { mult = 2; tag = "contrarian"; }
  return { correct: true, points: 10 * mult, detail: `Acierto ${tag} (×${mult})` };
}

// ─── API pública ─────────────────────────────────────────────────────────────
export function scoreBase(
  type: PredictionType,
  data: PredictionData,
  confidence: number,
  result: MatchResultReal,
): BaseScore {
  switch (type) {
    case "exact_score": return scoreExactScore(data as ExactScoreData, result);
    case "winner": return scoreWinner(data as WinnerData, confidence, result);
    case "first_scorer": return scoreFirstScorer(data as FirstScorerData, result);
    case "chain": return scoreChain(data as ChainData, result);
    case "duel": return scoreDuel(data as DuelData, result);
    case "over_under": return scoreOverUnder(data as OverUnderData, result);
    case "minute_drama": return scoreMinuteDrama(data as MinuteDramaData, result);
    case "social": return scoreSocial(data as SocialData, result);
  }
}

export interface FinalScore {
  points: number;
  pointsBeforeMatchMultiplier: number;
  breakdown: string;
  correct: boolean;
  // FIX 9: propaga la anulación hasta resolveMatch (0 pts, neutra en racha/stats).
  voided?: boolean;
}

/**
 * Aplica los multiplicadores personales y de partido al puntaje base.
 * Los puntos negativos (confianza fallada) NO se reducen por bonus personales,
 * pero sí se amplifican por el match_multiplier (más riesgo en Diamante).
 */
export function applyBonuses(base: BaseScore, ctx: ResolutionContext): FinalScore {
  // FIX 9: una predicción anulada no se multiplica ni suma; sale 0 pts y neutra.
  if (base.voided) {
    return {
      points: 0,
      pointsBeforeMatchMultiplier: 0,
      breakdown: `${base.detail} (anulada: feed incompleto) = 0 pts`,
      correct: false,
      voided: true,
    };
  }
  let pts = base.points;
  const parts: string[] = [base.detail + `: ${base.points} pts`];

  if (base.points > 0) {
    if (ctx.streakActive) { pts *= STREAK_MULT; parts.push("racha ×1.5"); }
    if (ctx.isEarlyBird) { pts *= EARLY_BIRD_MULT; parts.push("early bird ×1.2"); }
  }
  const beforeMatch = Math.round(pts);

  if (ctx.matchMultiplier && ctx.matchMultiplier !== 1) {
    pts *= ctx.matchMultiplier;
    parts.push(`💎 partido ×${ctx.matchMultiplier}`);
  }
  const final = Math.round(pts);
  return {
    points: final,
    pointsBeforeMatchMultiplier: beforeMatch,
    breakdown: `${parts.join(" · ")} = ${final} pts`,
    correct: base.correct,
  };
}

/** Rango de puntos potenciales (min/max) de un tipo, ya con match_multiplier. */
export function potentialPoints(min: number, max: number, matchMultiplier: number) {
  return {
    min,
    max,
    with_match_multiplier: Math.round(max * matchMultiplier),
  };
}

export const PERFECT_MATCH_BONUS = 500;
