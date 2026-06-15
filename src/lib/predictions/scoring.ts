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
// FIX (auditoría calificación): un evento del añadido del 2º tiempo (90+X) cae en
// la franja "90+", no en "76-90"; el del 1er tiempo (45+X) se queda en "31-45".
// api-football entrega minute=90/45 + extra; sin esto, "90+" era inalcanzable y
// el gol del 90+4 se pagaba como "76-90" (8 pts en vez de 20).
function effectiveRange(minute: number, extra?: number): MinuteRange {
  if (extra && extra > 0 && minute >= 90) return "90+";
  return rangeOfMinute(minute);
}

// ─── Scoring por tipo ────────────────────────────────────────────────────────
function scoreExactScore(d: ExactScoreData, r: MatchResultReal): BaseScore {
  const eh = r.score.home, ea = r.score.away;
  if (d.home_goals === eh && d.away_goals === ea) {
    return { correct: true, points: 25, detail: "Resultado exacto" };
  }
  const diff = Math.abs(d.home_goals - eh) + Math.abs(d.away_goals - ea);
  const sameWinner = winnerOf(d.home_goals, d.away_goals) === winnerOf(eh, ea);
  // FIX (auditoría calificación): el "fallo por 1 gol" solo cuenta como acierto y
  // paga 10 si ADEMÁS acertó el ganador; si el signo del partido fue otro (p.ej.
  // predijo 2-1 y fue 1-1), no debe marcar is_correct=true ni pagar más que un
  // ganador acertado — solo una pequeña consolación neutra.
  if (diff === 1 && sameWinner) return { correct: true, points: 10, detail: "Cerca: fallo por 1 gol (ganador correcto)" };
  if (sameWinner) return { correct: true, points: 5, detail: "Ganador correcto, marcador erróneo" };
  if (diff === 1) return { correct: false, points: 3, detail: "Cerca por 1 gol, pero ganador errado" };
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
  const goalEvents = r.events.filter((e) => e.type === "goal");
  const fg = firstGoal(r);
  // FIX (auditoría calificación): el goleador del feed puede no mapearse al pool
  // (transliteración / orden de nombre / homónimos: Son, los 3 Martínez…),
  // dejando goles SIN player_id. Antes eso marcaba como FALLO (0 pts + racha rota)
  // al que SÍ había acertado. Ahora distinguimos "no identificado" de "no marcó":
  //   • acierto exacto solo si el PRIMER gol está identificado y coincide;
  //   • "marcó (no el primero)" si el pick está entre los goles identificados;
  //   • FALLO real solo si TODOS los goles están identificados y el pick no está;
  //   • si hay algún gol sin identificar (incl. el primero) y no casó → ANULAR
  //     (neutro, FIX 9) en vez de castigar un posible acierto que el feed no etiquetó.
  if (fg && fg.player_id != null && fg.player_id === d.player_id) {
    return { correct: true, points: 30, detail: "Primer goleador exacto" };
  }
  const scoredAnytime = goalEvents.some((e) => e.player_id === d.player_id);
  if (scoredAnytime) return { correct: true, points: 10, detail: "Marcó, pero no fue el primero" };
  const allIdentified = goalEvents.length > 0 && goalEvents.every((e) => e.player_id != null);
  if (allIdentified) return { correct: false, points: 0, detail: "Tu goleador no marcó" };
  return { correct: false, points: 0, detail: "Anulado: el feed no identificó al goleador", voided: true };
}

// Cuántos eslabones, EN ORDEN desde el primero, son correctos.
export interface ChainStepResult { step: number; correct: boolean }
export function evalChain(d: ChainData, r: MatchResultReal): { results: ChainStepResult[]; inOrder: number } {
  const goals = r.events.filter((e) => e.type === "goal");
  // FIX (auditoría calificación): UN solo cursor cronológico sobre la línea de
  // tiempo combinada de goles Y tarjetas. Antes goles y tarjetas tenían cursores
  // independientes, así que una cadena que mezclaba gol y tarjeta se validaba como
  // dos secuencias separadas y podía pagar el jackpot por un orden que NO ocurrió
  // (p.ej. "tarjeta ANTES del gol" cuando fue al revés). Ahora un eslabón goal/card
  // debe ser un evento POSTERIOR en la línea de tiempo al último eslabón consumido.
  // winner/halftime_score son predicados del estado final (por diseño, no consumen
  // del cursor — son checkpoints, no eventos cronológicos).
  const timeline = r.events
    .filter((e) => e.type === "goal" || e.type === "card")
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.minute - b.e.minute || a.i - b.i);
  let cursor = -1; // índice en `timeline` del último evento cronológico consumido
  const results: ChainStepResult[] = [];
  for (const step of d.chain) {
    let ok = false;
    switch (step.event_type) {
      case "goal":
      case "card": {
        for (let k = cursor + 1; k < timeline.length; k++) {
          const t = timeline[k].e;
          if (t.type === step.event_type && t.team === step.event_data.team) {
            ok = true;
            cursor = k;
            break;
          }
        }
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
  // FIX (auditoría calificación): empate de rendimiento (mismo rating) → no hay
  // ganador objetivo del duelo. Anular (neutro) en vez de marcar fallo, que
  // rompería racha y precisión injustamente.
  if (ra === rb) return { correct: false, points: 0, detail: "Anulado: empate de rendimiento", voided: true };
  const winner = ra > rb ? pa : pb;
  if (winner === d.winner_player_id) {
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
  // Tomamos el EVENTO (no solo el minuto) para considerar el añadido. first_sub
  // solo guarda minuto; goles/tarjetas pueden ser 90+X.
  let evMinute: number | undefined;
  let real: MinuteRange;
  if (d.event === "first_sub") {
    evMinute = r.first_sub_minute;
    if (evMinute == null) return { correct: false, points: 0, detail: "El evento no ocurrió" };
    real = rangeOfMinute(evMinute);
  } else {
    const ev = d.event === "first_goal" ? firstGoal(r)
      : d.event === "first_card" ? firstCard(r)
      : lastGoal(r);
    if (!ev) return { correct: false, points: 0, detail: "El evento no ocurrió" };
    evMinute = ev.minute;
    real = effectiveRange(ev.minute, ev.extra);
  }
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
