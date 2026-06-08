// src/app/app/modo-carrera/jugar/MatchLive.tsx
//
// PARTIDO INTERACTIVO (la pieza "jugable estilo FIFA" del Modo Carrera). Junta
// los tres pilares de jugabilidad:
//   · Pilar 1 — agencia: el DT elige PLAN TÁCTICO antes del saque y toma una
//     DECISIÓN en el minuto 60 (ambas afectan de verdad la simulación).
//   · Pilar 3 — tensión: el marcador NO se revela de golpe; el reloj corre y los
//     goles van cayendo minuto a minuto.
//   · Pilar 2 — plantel: muestra jugadores REALES (FANTASY_ROSTERS) antes del
//     partido y nombra a la figura del encuentro al final.
//
// Al pitar el final entrega el marcador a onFinish(gf, ga); el contenedor lo pasa
// a resolveMatch() para aplicarlo a la carrera. SVG/flags, sin emojis.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, flagUrl } from "./fx";
import { SELECCIONES } from "@/data/selecciones";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";
import { classicLabel } from "@/lib/modo-carrera/classics";
import { Kit, Confetti, Coach } from "./Visuals";
import LineupEditor from "./LineupEditor";
import { formationById, resolveLineup, xiRating, bestXI, lineupValid } from "@/lib/modo-carrera/lineup";
import {
  TACTICAL_PLANS,
  planById,
  kickoff,
  secondHalf,
  thirdHalf,
  choicesFor,
  rollMatchInjury,
  rollRedCard,
  redCardMult,
  rollSetPiece,
  setPieceChoices,
  resolveSetPiece,
  HALFTIME_TALKS,
  EXTRA_TIME_CHOICES,
  PENALTY_STRATEGIES,
  extraTime,
  shootout,
  type TacticalPlan,
  type InMatchChoice,
  type LiveMatchState,
  type LiveMatchResult,
  type MatchInjury,
  type SubOption,
  type HalftimeTalk,
  type ExtraTimeChoice,
  type PenaltyStrategy,
  type ShootoutResult,
  type RedCard,
  type SetPiece,
  type SetPieceChoice,
} from "@/lib/modo-carrera/match-live";
import type { CareerState, SeasonMatch, Injury } from "@/lib/modo-carrera/types";

type Phase =
  | "plan"
  | "half1"
  | "injury"
  | "charla"
  | "decision"
  | "half2"
  | "decision2"
  | "half3"
  | "setpiece"
  | "prorroga"
  | "et"
  | "penales"
  | "fulltime";

interface GoalEvent {
  minute: number;
  team: "self" | "opp";
  scorer: string;
}

type FeedItem =
  | { kind: "goal"; minute: number; team: "self" | "opp"; scorer: string }
  | { kind: "red"; minute: number; team: "self" | "opp"; player: string };

const sel = (slug: string) => SELECCIONES.find((s) => s.slug === slug);

function Flag({ code, size = 26 }: { code?: string; size?: number }) {
  if (!code) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={flagUrl(code)}
      alt=""
      style={{ width: size, height: size * 0.7, objectFit: "cover", borderRadius: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
    />
  );
}

function MedicalCross({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WhistleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 11h9l5-3v8l-5-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function RedCardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.32} viewBox="0 0 16 21" fill="none" aria-hidden>
      <rect x="1" y="1" width="14" height="19" rx="2.5" fill={RED} stroke="#7f1d1d" strokeWidth="1" />
    </svg>
  );
}

function ManDownBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 900, color: RED, background: "rgba(220,38,38,0.14)", border: `1px solid ${RED}55`, borderRadius: 999, padding: "2px 7px" }}>
      <RedCardIcon size={9} /> 10
    </span>
  );
}

function keyPlayers(slug: string, n = 3): RosterPlayer[] {
  const roster = FANTASY_ROSTERS[slug] ?? [];
  const fwd = roster.filter((p) => p.pos === "FWD");
  const mid = roster.filter((p) => p.pos === "MID");
  return [...fwd, ...mid].slice(0, n);
}

function pickScorer(slug: string): string {
  const roster = FANTASY_ROSTERS[slug] ?? [];
  const att = roster.filter((p) => p.pos === "FWD" || p.pos === "MID");
  const pool = att.length ? att : roster;
  if (!pool.length) return "Gol en propia";
  return pool[Math.floor(Math.random() * pool.length)].name;
}

function goalMinutes(count: number, lo: number, hi: number): number[] {
  const set = new Set<number>();
  let guard = 0;
  while (set.size < count && guard < 300) {
    set.add(lo + Math.floor(Math.random() * (hi - lo + 1)));
    guard++;
  }
  return [...set].sort((a, b) => a - b);
}

function buildEvents(gfSelf: number, gaOpp: number, selfSlug: string, oppSlug: string, lo: number, hi: number): GoalEvent[] {
  const ev: GoalEvent[] = [];
  for (const m of goalMinutes(gfSelf, lo, hi)) ev.push({ minute: m, team: "self", scorer: pickScorer(selfSlug) });
  for (const m of goalMinutes(gaOpp, lo, hi)) ev.push({ minute: m, team: "opp", scorer: pickScorer(oppSlug) });
  return ev.sort((a, b) => a.minute - b.minute);
}

/**
 * Tempo del reloj (ms entre minutos). Corre fluido a media, pero FRENA en los
 * minutos finales de cada mitad para crear tensión (como un partido que se hace
 * eterno cuando aguantas un resultado). Pura sensación: la simulación ya está
 * decidida.
 */
function tickDelay(clock: number, target: number): number {
  const remaining = target - clock;
  if (remaining <= 6) return 260; // últimos minutos: agónicos
  if (remaining <= 14) return 160;
  return 85; // ritmo base: el partido respira, no se resuelve en 4 segundos
}

/** ¿El DT estuvo por detrás en el marcador en algún momento del partido? */
function wasEverBehind(events: GoalEvent[]): boolean {
  let gf = 0;
  let ga = 0;
  for (const e of [...events].sort((a, b) => a.minute - b.minute)) {
    if (e.team === "self") gf++;
    else ga++;
    if (ga > gf) return true;
  }
  return false;
}

export default function MatchLive({
  career,
  match,
  onFinish,
  onCancel,
  onLineupChange,
}: {
  career: CareerState;
  match: SeasonMatch;
  onFinish: (gf: number, ga: number, wasBehind: boolean, injury?: Injury, moraleDelta?: number) => void;
  onCancel: () => void;
  /** Persiste el dibujo + once elegidos en la carrera (para próximos partidos). */
  onLineupChange?: (formation: string, lineup: string[]) => void;
}) {
  const selfSlug = career.identity.nationSlug ?? "";
  const oppSlug = match.opponentSlug;
  const selfNat = sel(selfSlug);
  const oppNat = sel(oppSlug);
  const classic = classicLabel(selfSlug, oppSlug);

  const [phase, setPhase] = useState<Phase>("plan");
  const [planId, setPlanId] = useState<string>(TACTICAL_PLANS[0].id);
  const [clock, setClock] = useState(0);
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [goalFx, setGoalFx] = useState<GoalEvent | null>(null);
  const [decisionLeft, setDecisionLeft] = useState(10);
  const lsRef = useRef<LiveMatchState | null>(null);
  const midRef = useRef<{ gf2: number; ga2: number } | null>(null);
  const resRef = useRef<LiveMatchResult | null>(null);
  const clockRef = useRef(0);
  const celebratingRef = useRef(false);
  const shownCountRef = useRef(0);
  // Lesión en partido (pre-tirada al saque) y su recambio elegido por el DT.
  const injuryRef = useRef<MatchInjury | null>(null);
  const subMultRef = useRef<{ atk: number; def: number }>({ atk: 1, def: 1 });
  const injuredRef = useRef<Injury | null>(null);
  const [injury, setInjury] = useState<MatchInjury | null>(null);
  // Expulsión (pre-tirada al saque): puede caer en tu equipo o en el rival y
  // condiciona el rendimiento de los tramos posteriores a su minuto.
  const redCardRef = useRef<RedCard | null>(null);
  const [redCard, setRedCard] = useState<RedCard | null>(null);
  // Balón parado a favor (pre-tirado al saque): penalti o falta de peligro. Salta
  // como decisión del DT al llegar a su minuto y puede sumar un gol extra.
  const setPieceRef = useRef<SetPiece | null>(null);
  const setPieceGoalRef = useRef(0);
  const setPieceDoneRef = useRef(false);
  const resumePhaseRef = useRef<Phase>("half2");
  const [setPiece, setSetPiece] = useState<SetPiece | null>(null);
  const [setPieceResult, setSetPieceResult] = useState<null | { scored: boolean; choice: SetPieceChoice }>(null);
  // Charla técnica al descanso (solo si vas perdiendo): multiplica el resto del
  // partido y deja un delta de moral que se arrastra a la carrera.
  const talkMultRef = useRef<{ atk: number; def: number }>({ atk: 1, def: 1 });
  const talkMoraleRef = useRef(0);
  // Prórroga + penaltis (solo eliminatorias empatadas a los 90'). En el fútbol
  // real una eliminatoria nunca acaba en empate: hay 30' extra y, si sigue igual,
  // tanda de penaltis. El DT decide el enfoque de ambas.
  const isKnockout = match.stage !== "grupos";
  const [shootoutRes, setShootoutRes] = useState<ShootoutResult | null>(null);
  const shootoutRef = useRef<ShootoutResult | null>(null);
  const etRef = useRef<{ gfEt: number; gaEt: number } | null>(null);

  // Formación + once titular elegidos por el DT (Pilar 1: agencia). Se inicializan
  // del plantel guardado y se aplican a ESTE partido vía liveCareer; el callback
  // los persiste para los siguientes. Editable solo antes del saque (fase plan).
  const [formation, setFormation] = useState<string>(career.squad?.formation ?? "4-4-2");
  const [lineup, setLineup] = useState<string[]>(career.squad?.lineup ?? []);
  const [editingLineup, setEditingLineup] = useState(false);

  // Carrera "en vivo": misma carrera con el dibujo+once actuales inyectados en el
  // plantel, para que kickoff()/matchLambdas() lean la alineación recién elegida.
  const liveCareer: CareerState = useMemo(
    () => ({ ...career, squad: { injuries: [], ...career.squad, formation, lineup } }),
    [career, formation, lineup],
  );

  const selfKey = useMemo(() => keyPlayers(selfSlug), [selfSlug]);
  const oppKey = useMemo(() => keyPlayers(oppSlug), [oppSlug]);

  // Resumen del dibujo + once para la pantalla de plan: valoración media del once
  // efectivo (el guardado si es válido; si no, el mejor once por defecto).
  const xiInfo = useMemo(() => {
    const roster = FANTASY_ROSTERS[selfSlug] ?? [];
    const f = formationById(formation);
    const custom = lineupValid(lineup, roster, f);
    const players = custom ? resolveLineup(lineup, roster) : bestXI(roster, f);
    return { rating: xiRating(players), formationName: f.name, custom };
  }, [selfSlug, formation, lineup]);

  // Reloj con RITMO CINEMATOGRÁFICO: setTimeout recursivo para variar el tempo
  // minuto a minuto (acelera a media, frena en el tramo final) y DETENERSE
  // durante la celebración de un gol — como en FIFA, el juego para para festejar.
  useEffect(() => {
    if (phase !== "half1" && phase !== "half2" && phase !== "half3" && phase !== "et") return;
    const target = phase === "half1" ? 60 : phase === "half2" ? 75 : phase === "half3" ? 90 : 120;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!active) return;
      if (celebratingRef.current) {
        timer = setTimeout(tick, 120); // en pausa por gol: re-chequea pronto
        return;
      }
      const c = clockRef.current;
      if (c >= target) return;
      setClock(c + 1);
      timer = setTimeout(tick, tickDelay(c + 1, target));
    };
    timer = setTimeout(tick, tickDelay(clockRef.current, target));
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phase]);

  // Espejo del reloj para leerlo dentro del tick sin recrear el efecto.
  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  // La expulsión (pre-tirada al saque) se revela cuando el reloj llega a su minuto.
  useEffect(() => {
    const rc = redCardRef.current;
    if (rc && !redCard && clock >= rc.minute) setRedCard(rc);
  }, [clock, redCard]);

  // Balón parado: al llegar a su minuto (durante el juego) se pausa el reloj y
  // salta la decisión. Guardamos el tramo para reanudar tras ejecutar la jugada.
  useEffect(() => {
    if (phase !== "half2" && phase !== "half3") return;
    const sp = setPieceRef.current;
    if (sp && !setPieceDoneRef.current && clock >= sp.minute) {
      resumePhaseRef.current = phase;
      setSetPiece(sp);
      setPhase("setpiece");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, phase]);

  // Encadena las pantallas del descanso (min 60'): primero la sustitución por
  // lesión (si la hubo), luego la charla técnica (solo si vas perdiendo) y por
  // último la decisión táctica. Cada paso llama al siguiente al resolverse.
  const goToCharlaOrDecision = () => {
    setPhase(shown.gf < shown.ga ? "charla" : "decision");
  };

  // Transición de fase al alcanzar el tope del reloj. Al llegar al 60' se intercala
  // la sustitución (si hay lesión) antes de la charla/decisión.
  useEffect(() => {
    if (phase === "half1" && clock >= 60) {
      if (injuryRef.current) {
        setInjury(injuryRef.current);
        setPhase("injury");
      } else {
        goToCharlaOrDecision();
      }
    }
    // Min 75: segunda decisión en vivo (recta final).
    if (phase === "half2" && clock >= 75) setPhase("decision2");
    if (phase === "half3" && clock >= 90) {
      // En el fútbol real una eliminatoria nunca acaba en empate: si están iguales
      // a los 90', hay prórroga. En fase de grupos el empate es válido.
      setPhase(isKnockout && shown.gf === shown.ga ? "prorroga" : "fulltime");
    }
    if (phase === "et" && clock >= 120) {
      // Tras la prórroga: si sigue empate, tanda de penaltis; si no, final.
      setPhase(shown.gf === shown.ga ? "penales" : "fulltime");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, phase]);

  // El DT elige el recambio: el perfil del cambio multiplica el rendimiento del
  // resto del partido y el lesionado se arrastra como baja de la temporada.
  const pickSub = (opt: SubOption) => {
    subMultRef.current = { atk: opt.atkMult, def: opt.defMult };
    injuredRef.current = injuryRef.current?.injured ?? null;
    goToCharlaOrDecision();
  };

  // La charla al descanso modula el resto del partido y deja un delta de moral.
  const pickTalk = (talk: HalftimeTalk) => {
    talkMultRef.current = { atk: talk.atkMult, def: talk.defMult };
    talkMoraleRef.current = talk.moraleDelta;
    setPhase("decision");
  };

  const startMatch = (plan: TacticalPlan) => {
    const ls = kickoff(liveCareer, match, plan);
    lsRef.current = ls;
    setPlanId(plan.id);
    setEvents(buildEvents(ls.gf1, ls.ga1, selfSlug, oppSlug, 3, 58));
    // Pre-tirada de lesión en partido: se decide al saque para que el reloj sea
    // estable, pero la pantalla de sustitución salta al llegar al minuto 60.
    injuryRef.current = rollMatchInjury(career, match);
    redCardRef.current = rollRedCard(career, match);
    setRedCard(null);
    setPieceRef.current = rollSetPiece(career, match);
    setPieceGoalRef.current = 0;
    setPieceDoneRef.current = false;
    setSetPiece(null);
    setSetPieceResult(null);
    subMultRef.current = { atk: 1, def: 1 };
    injuredRef.current = null;
    talkMultRef.current = { atk: 1, def: 1 };
    talkMoraleRef.current = 0;
    etRef.current = null;
    shootoutRef.current = null;
    setShootoutRes(null);
    setInjury(null);
    setClock(0);
    setPhase("half1");
  };

  const pickChoice = (choice: InMatchChoice) => {
    const ls = lsRef.current;
    if (!ls) return;
    // El recambio (lesión), la charla al descanso y una posible expulsión (si ya
    // se produjo antes del cierre de este tramo, min 75) modulan la decisión.
    const sub = subMultRef.current;
    const talk = talkMultRef.current;
    const red = redCardMult(redCardRef.current, 75);
    const combined: InMatchChoice = {
      ...choice,
      atkMult: choice.atkMult * sub.atk * talk.atk * red.atk,
      defMult: choice.defMult * sub.def * talk.def * red.def,
    };
    const mid = secondHalf(ls, combined);
    midRef.current = mid;
    setEvents((prev) => [...prev, ...buildEvents(mid.gf2, mid.ga2, selfSlug, oppSlug, 61, 74)]);
    setPhase("half2");
  };

  // 2ª decisión en vivo (min 75): el DT ajusta la recta final. Arrastra el efecto
  // del recambio/charla igual que la primera, sobre el tramo 75-90'.
  const pickChoice2 = (choice: InMatchChoice) => {
    const ls = lsRef.current;
    const mid = midRef.current;
    if (!ls || !mid) return;
    const sub = subMultRef.current;
    const talk = talkMultRef.current;
    const red = redCardMult(redCardRef.current, 90);
    const combined: InMatchChoice = {
      ...choice,
      atkMult: choice.atkMult * sub.atk * talk.atk * red.atk,
      defMult: choice.defMult * sub.def * talk.def * red.def,
    };
    const res = thirdHalf(ls, mid, combined);
    resRef.current = res;
    setEvents((prev) => [...prev, ...buildEvents(res.gf2, res.ga2, selfSlug, oppSlug, 76, 90)]);
    setPhase("half3");
  };

  // El DT ejecuta el balón parado: si entra, suma un gol extra (evento + agregado)
  // y se muestra el desenlace antes de reanudar el partido en el mismo tramo.
  const pickSetPiece = (choice: SetPieceChoice) => {
    const sp = setPieceRef.current;
    if (!sp) return;
    setPieceDoneRef.current = true;
    const scored = resolveSetPiece(choice);
    if (scored) {
      setPieceGoalRef.current += 1;
      setEvents((prev) => [...prev, { minute: sp.minute, team: "self", scorer: sp.taker }]);
    }
    setSetPieceResult({ scored, choice });
  };

  // Tras ver el desenlace del balón parado, se reanuda el partido en su tramo.
  const resumeFromSetPiece = () => {
    setSetPiece(null);
    setSetPieceResult(null);
    setPhase(resumePhaseRef.current);
  };

  // El DT elige cómo afrontar la prórroga (30' extra). El enfoque modula los goles
  // de la prórroga, que caen entre los minutos 91 y 120.
  const pickET = (choice: ExtraTimeChoice) => {
    const ls = lsRef.current;
    if (!ls) return;
    const { gfEt, gaEt } = extraTime(ls, choice);
    etRef.current = { gfEt, gaEt };
    setEvents((prev) => [...prev, ...buildEvents(gfEt, gaEt, selfSlug, oppSlug, 91, 120)]);
    setPhase("et");
  };

  // El DT elige el enfoque de la tanda. La simulación resuelve los penaltis y
  // suma +1 al ganador para que resolveMatch produzca un resultado decisivo.
  const pickPenalty = (strat: PenaltyStrategy) => {
    const so = shootout(match, strat);
    shootoutRef.current = so;
    setShootoutRes(so);
    setPhase("fulltime");
  };

  // Marcador mostrado: goles cuyo minuto ya pasó el reloj.
  const shown = useMemo(() => {
    const visible = events.filter((e) => e.minute <= clock);
    return {
      gf: visible.filter((e) => e.team === "self").length,
      ga: visible.filter((e) => e.team === "opp").length,
      feed: visible,
    };
  }, [events, clock]);

  // Feed combinado (goles + expulsión) ordenado por minuto. La roja NO cuenta
  // para el marcador ni dispara celebración; solo aparece en el relato.
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = shown.feed.map((e) => ({ kind: "goal", minute: e.minute, team: e.team, scorer: e.scorer }));
    if (redCard && redCard.minute <= clock) {
      items.push({ kind: "red", minute: redCard.minute, team: redCard.team, player: redCard.player });
    }
    return items.sort((a, b) => a.minute - b.minute);
  }, [shown.feed, redCard, clock]);

  // Cuando un gol nuevo entra en pantalla: dispara la CELEBRACIÓN a pantalla
  // completa, pausa el reloj (celebratingRef) y vibra el móvil si es propio.
  useEffect(() => {
    if (shown.feed.length <= shownCountRef.current) {
      shownCountRef.current = shown.feed.length;
      return;
    }
    shownCountRef.current = shown.feed.length;
    const newest = shown.feed[shown.feed.length - 1];
    setGoalFx(newest);
    celebratingRef.current = true;
    if (newest.team === "self" && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([45, 35, 130]);
      } catch {
        /* no soportado: la celebración visual basta */
      }
    }
    const t = setTimeout(() => {
      setGoalFx(null);
      celebratingRef.current = false;
    }, 2000);
    return () => clearTimeout(t);
  }, [shown.feed]);

  // Cuenta atrás de la decisión del 60': el banco te apura. Si llega a 0, el
  // cuerpo técnico mantiene el plan por ti (primera opción = KEEP).
  useEffect(() => {
    if (phase !== "decision" && phase !== "decision2") {
      setDecisionLeft(10);
      return;
    }
    if (decisionLeft <= 0) {
      // Si se agota el tiempo, el cuerpo técnico mantiene el plan (1ª opción = KEEP).
      const keep = choicesFor(shown.gf, shown.ga)[0];
      if (phase === "decision") pickChoice(keep);
      else pickChoice2(keep);
      return;
    }
    const t = setTimeout(() => setDecisionLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, decisionLeft]);

  const res = resRef.current;
  // Marcador agregado tras 90' (+ prórroga si la hubo). Los penaltis NO cambian
  // el marcador mostrado (queda el empate), pero sí deciden el ganador: +1 al
  // vencedor de la tanda para que resolveMatch produzca un resultado decisivo.
  const aggGf = (res ? res.gf : shown.gf) + (etRef.current?.gfEt ?? 0) + setPieceGoalRef.current;
  const aggGa = (res ? res.ga : shown.ga) + (etRef.current?.gaEt ?? 0);
  const finalGf = aggGf + (shootoutRes?.winner === "self" ? 1 : 0);
  const finalGa = aggGa + (shootoutRes?.winner === "opp" ? 1 : 0);
  const outcome = finalGf > finalGa ? "V" : finalGf < finalGa ? "D" : "E";
  const outColor = outcome === "V" ? GREEN : outcome === "E" ? GOLD : RED;

  const motm = useMemo(() => {
    if (phase !== "fulltime") return "";
    const winnerSlug = finalGf >= finalGa ? selfSlug : oppSlug;
    return pickScorer(winnerSlug);
  }, [phase, finalGf, finalGa, selfSlug, oppSlug]);

  const decisionChoices = phase === "decision" || phase === "decision2" ? choicesFor(shown.gf, shown.ga) : [];

  // Lectura emocional del marcador en vivo: verde si vas ganando, rojo si pierdes.
  const liveScoreColor = shown.gf > shown.ga ? GREEN : shown.gf < shown.ga ? RED : "#fff";
  // Tramo final agónico: el cronómetro late en rojo y más rápido.
  const tense = (phase === "half3" && clock >= 85) || (phase === "half1" && clock >= 57) || (phase === "et" && clock >= 116);
  const clockColor = tense ? RED : GREEN;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,11,20,0.92)",
        padding: 16,
        animation: "mcBannerIn .25s ease both",
      }}
    >
      <style>{`
        @keyframes mlGoal { 0% { transform: scale(.6); opacity: 0; } 50% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes mlPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes mlScore { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
        @keyframes mlGolWrap { 0% { opacity: 0; } 7% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes mlGolFlash { 0% { opacity: 0; transform: scale(.3); } 18% { opacity: .9; } 100% { opacity: 0; transform: scale(1.8); } }
        @keyframes mlGolSweep { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(130%) skewX(-18deg); } }
        @keyframes mlGolWord { 0% { transform: scale(.2); opacity: 0; letter-spacing: -14px; filter: blur(10px); } 45% { transform: scale(1.18); opacity: 1; letter-spacing: 10px; filter: blur(0); } 62% { transform: scale(.97); } 100% { transform: scale(1); opacity: 1; letter-spacing: 6px; } }
        @keyframes mlGolKit { 0% { transform: translateY(46px) scale(.4) rotate(-8deg); opacity: 0; } 55% { transform: translateY(-8px) scale(1.12) rotate(2deg); } 100% { transform: translateY(0) scale(1) rotate(0); opacity: 1; } }
        @keyframes mlGolUp { 0% { transform: translateY(26px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes mlWinIn { 0% { transform: scale(.5); opacity: 0; filter: blur(6px); } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        @keyframes mlGlow { 0%,100% { opacity: .45; transform: scale(1); } 50% { opacity: .8; transform: scale(1.08); } }
        @keyframes mlDecHdr { 0% { transform: translateY(-14px) scale(.9); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes mlDecCard { 0% { transform: translateX(-22px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes mlDecBorder { 0%,100% { box-shadow: 0 24px 70px rgba(0,0,0,0.65), 0 0 0 0 ${GOLD}00; } 50% { box-shadow: 0 24px 70px rgba(0,0,0,0.65), 0 0 26px 2px ${GOLD}55; } }
        @keyframes mcCoachIn { 0% { transform: translateY(28px) scale(.94); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: .92; } }
      `}</style>

      {phase === "fulltime" && outcome === "V" && <Confetti pieces={56} />}

      {/* ── CELEBRACIÓN DE GOL a pantalla completa (cinematográfica) ── */}
      {goalFx && (
        <GoalCelebration
          goal={goalFx}
          selfSlug={selfSlug}
          oppSlug={oppSlug}
          selfName={selfNat?.nombre ?? selfSlug}
          oppName={oppNat?.nombre ?? oppSlug}
        />
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          maxHeight: "94vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          padding: 24,
          borderRadius: 20,
          background: BG2,
          border: `1px solid ${phase === "fulltime" ? outColor : GOLD}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
          animation: phase === "decision" ? "mlDecBorder 1.6s ease-in-out infinite" : undefined,
        }}
      >
        {/* Cabecera: etiqueta de fase / clásico */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          {classic && (
            <div style={{ display: "inline-block", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD2, border: `1px solid ${GOLD}66`, background: "rgba(201,168,76,0.12)", borderRadius: 999, padding: "4px 12px", marginBottom: 8 }}>
              Clásico · {classic}
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
            {match.label} · {match.home ? "Local" : "Visitante"}
          </div>
        </div>

        {/* Marcador / banderas (visible salvo en la pantalla de plan) */}
        {phase !== "plan" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "8px 0 16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Flag code={selfNat?.flagCode} size={34} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center" }}>{selfNat?.nombre ?? selfSlug}</span>
              {redCard?.team === "self" && redCard.minute <= clock && <ManDownBadge />}
            </div>
            <div style={{ textAlign: "center", minWidth: 96 }}>
              <div key={`${shown.gf}-${shown.ga}`} style={{ fontSize: 42, fontWeight: 900, color: phase === "fulltime" ? outColor : liveScoreColor, animation: "mlScore .3s ease" }}>
                {shown.gf} - {shown.ga}
              </div>
              {phase !== "fulltime" ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: clockColor }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: clockColor, animation: `mlPulse ${tense ? ".5s" : "1s"} infinite` }} />
                  {clock}&#39;
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: outColor }}>Final</div>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Flag code={oppNat?.flagCode} size={34} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center" }}>{oppNat?.nombre ?? oppSlug}</span>
              {redCard?.team === "opp" && redCard.minute <= clock && <ManDownBadge />}
            </div>
          </div>
        )}

        {/* ── FASE PLAN: jugadores clave + elección táctica ── */}
        {phase === "plan" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "4px 0 18px" }}>
              {[{ nat: selfNat, slug: selfSlug, players: selfKey, mine: true }, { nat: oppNat, slug: oppSlug, players: oppKey, mine: false }].map((side) => (
                <div key={side.slug} style={{ position: "relative", overflow: "hidden", padding: 12, borderRadius: 12, background: BG3, border: `1px solid ${side.mine ? GOLD + "55" : "rgba(255,255,255,0.06)"}` }}>
                  <div style={{ position: "absolute", top: -6, right: -6, zIndex: 0 }}>
                    <Kit slug={side.slug} size={64} faded />
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Kit slug={side.slug} size={26} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#fff" }}>{side.nat?.nombre ?? side.slug}</span>
                  </div>
                  {side.players.length ? (
                    side.players.map((p) => (
                      <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, padding: "3px 0" }}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: DIM }}>{p.pos}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic" }}>Plantel por confirmar</div>
                  )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formación + once titular (impacta el rendimiento real del equipo) */}
            <button
              type="button"
              onClick={() => setEditingLineup(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                textAlign: "left",
                padding: "11px 14px",
                borderRadius: 12,
                cursor: "pointer",
                background: BG3,
                border: `1px solid ${GOLD}55`,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: GOLD2, minWidth: 56 }}>{xiInfo.formationName}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#fff" }}>
                  {xiInfo.custom ? "Tu once titular" : "Once automático (mejor 11)"}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: MID, marginTop: 1 }}>
                  Valoración del once: <b style={{ color: GOLD2 }}>{xiInfo.rating ? xiInfo.rating.toFixed(0) : "--"}</b> · toca para editar
                </span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Coach pose="neutral" size={56} slug={selfSlug} />
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD }}>
                Elige tu plan de partido
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TACTICAL_PLANS.map((p) => {
                const active = p.id === planId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: active ? "rgba(201,168,76,0.14)" : BG3,
                      border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: active ? GOLD2 : "#fff" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{p.description}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
              <button type="button" onClick={() => startMatch(planById(planId))} style={btnGold}>
                Saltar al campo
              </button>
            </div>
          </>
        )}

        {/* ── FEED de goles (durante el partido y al final) ── */}
        {(phase === "half1" || phase === "injury" || phase === "charla" || phase === "decision" || phase === "half2" || phase === "decision2" || phase === "half3" || phase === "setpiece" || phase === "et" || phase === "fulltime") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0 12px", minHeight: 40 }}>
            {feedItems.length === 0 ? (
              <div style={{ textAlign: "center", fontSize: 12, color: DIM, fontStyle: "italic", padding: "8px 0" }}>
                Rueda el balón…
              </div>
            ) : (
              feedItems.map((e, i) =>
                e.kind === "goal" ? (
                  <div
                    key={`g-${e.minute}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 12px",
                      borderRadius: 10,
                      background: BG3,
                      borderLeft: `3px solid ${e.team === "self" ? GREEN : RED}`,
                      animation: "mlGoal .4s ease both",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 900, color: GOLD2, minWidth: 30 }}>{e.minute}&#39;</span>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: e.team === "self" ? GREEN : RED }}>GOL</span>
                    <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 600 }}>{e.scorer}</span>
                    <Flag code={(e.team === "self" ? selfNat : oppNat)?.flagCode} size={16} />
                  </div>
                ) : (
                  <div
                    key={`r-${e.minute}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 12px",
                      borderRadius: 10,
                      background: "rgba(220,38,38,0.10)",
                      borderLeft: `3px solid ${RED}`,
                      animation: "mlGoal .4s ease both",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 900, color: GOLD2, minWidth: 30 }}>{e.minute}&#39;</span>
                    <span style={{ display: "inline-flex" }}><RedCardIcon size={14} /></span>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: RED }}>ROJA</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.player}</span>
                    <Flag code={(e.team === "self" ? selfNat : oppNat)?.flagCode} size={16} />
                  </div>
                ),
              )
            )}
          </div>
        )}

        {/* ── DECISIÓN en vivo (min 60 y min 75): el banquillo te mira ── */}
        {(phase === "decision" || phase === "decision2") && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "6px 0 6px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="instruccion" size={64} slug={selfSlug} />
              {/* Cronómetro circular de presión */}
              <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke={decisionLeft <= 3 ? RED : GOLD}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - decisionLeft / 10)}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
                  />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: decisionLeft <= 3 ? RED : "#fff", animation: decisionLeft <= 3 ? "mlPulse .5s infinite" : "none" }}>
                  {decisionLeft}
                </span>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Minuto {phase === "decision" ? 60 : 75} · tu decisión</div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>{phase === "decision" ? "El banquillo te mira…" : "Recta final. Última orden."}</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 12.5, color: MID, marginBottom: 12 }}>
              {shown.gf > shown.ga ? "Vas ganando. ¿Cómo gestionas la ventaja?" : shown.gf < shown.ga ? "Vas por detrás. ¿Cómo reaccionas?" : "Todo igualado. ¿Qué arriesgas?"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {decisionChoices.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => (phase === "decision" ? pickChoice(ch) : pickChoice2(ch))}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{ch.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── BALÓN PARADO a favor: penalti o falta de peligro ── */}
        {phase === "setpiece" && setPiece && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "6px 0 6px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="instruccion" size={64} slug={selfSlug} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>
                  Minuto {setPiece.minute}&#39; · {setPiece.kind === "penalti" ? "penalti" : "falta peligrosa"}
                </div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>
                  Lanza {setPiece.taker}. ¿Cómo la ejecutas?
                </div>
              </div>
            </div>

            {!setPieceResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {setPieceChoices(setPiece.kind).map((ch, i) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => pickSetPiece(ch)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: BG3,
                      border: "1px solid rgba(255,255,255,0.06)",
                      animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{ch.name}</div>
                    <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{ch.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 14px",
                    borderRadius: 14,
                    background: setPieceResult.scored ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.10)",
                    border: `1px solid ${setPieceResult.scored ? GREEN : RED}55`,
                    margin: "6px 0 12px",
                    animation: "mlWinIn .4s ease both",
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: 900, color: setPieceResult.scored ? GREEN : RED }}>
                    {setPieceResult.scored ? "¡GOL!" : "Sin premio"}
                  </div>
                  <div style={{ fontSize: 12.5, color: MID, marginTop: 4 }}>
                    {setPieceResult.scored
                      ? `${setPiece.taker} la clava. ${setPieceResult.choice.name}.`
                      : `${setPiece.taker} lo intenta con "${setPieceResult.choice.name}", pero no entra.`}
                  </div>
                </div>
                <button type="button" onClick={resumeFromSetPiece} style={btnGold}>
                  Seguir el partido
                </button>
              </>
            )}
          </>
        )}

        {/* ── LESIÓN EN PARTIDO: pantalla de sustitución obligatoria ── */}
        {phase === "injury" && injury && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "6px 0 4px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="instruccion" size={64} slug={selfSlug} />
              <span style={{ display: "inline-flex", color: RED }}>
                <MedicalCross size={22} />
              </span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: RED }}>Minuto {injury.minute}&#39; · lesión</div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>Cae un titular. Te toca decidir el cambio.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "10px 14px", borderRadius: 12, background: BG3, border: `1px solid ${RED}44`, margin: "8px 0 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: RED }}>Se retira lesionado</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 3 }}>
                {injury.injured.player} <span style={{ fontSize: 12, fontWeight: 700, color: DIM }}>· {injury.injured.pos}</span>
              </div>
              <div style={{ fontSize: 11.5, color: MID, marginTop: 3 }}>
                Baja estimada: {injury.injured.matchesOut} {injury.injured.matchesOut === 1 ? "partido" : "partidos"}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD, marginBottom: 10 }}>
              Elige el recambio
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {injury.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickSub(opt)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{opt.player}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD2 }}>{opt.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: DIM, marginTop: 2 }}>{opt.pos}</div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── CHARLA TÉCNICA AL DESCANSO (solo si vas perdiendo) ── */}
        {phase === "charla" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "6px 0 4px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="arenga" size={64} slug={selfSlug} />
              <span style={{ display: "inline-flex", color: GOLD }}>
                <WhistleIcon size={22} />
              </span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Descanso · charla técnica</div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>Vas por detrás. ¿Qué mensaje das al vestuario?</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {HALFTIME_TALKS.map((talk, i) => (
                <button
                  key={talk.id}
                  type="button"
                  onClick={() => pickTalk(talk)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{talk.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: talk.moraleDelta >= 0 ? GREEN : RED }}>
                      {talk.moraleDelta >= 0 ? "+" : ""}{talk.moraleDelta} moral
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{talk.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PRÓRROGA: el DT elige cómo afrontar los 30' extra ── */}
        {phase === "prorroga" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "6px 0 4px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="instruccion" size={64} slug={selfSlug} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>90&#39; · al filo · prórroga</div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>Eliminatoria igualada. No hay empate posible.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 12.5, color: MID, marginBottom: 12 }}>
              30 minutos más. ¿Cómo afrontas la prórroga?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EXTRA_TIME_CHOICES.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => pickET(ch)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{ch.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PRÓRROGA EN JUEGO: banner mientras corre el reloj 90'→120' ── */}
        {phase === "et" && (
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: GOLD2, marginBottom: 10 }}>
            Prórroga en juego
          </div>
        )}

        {/* ── PENALTIS: el DT elige el enfoque de la tanda ── */}
        {phase === "penales" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "6px 0 4px", animation: "mlDecHdr .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
              <Coach pose="instruccion" size={64} slug={selfSlug} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>120&#39; · la lotería · penaltis</div>
                <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginTop: 1 }}>Todo a los once metros. Una última decisión.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 12.5, color: MID, marginBottom: 12 }}>
              ¿Cómo encaras la tanda?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PENALTY_STRATEGIES.map((st, i) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => pickPenalty(st)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `mlDecCard .4s ${0.1 + i * 0.09}s cubic-bezier(.2,.9,.3,1.2) both`,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{st.name}</div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{st.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── FINAL (reacción emocional diferenciada por resultado) ── */}
        {phase === "fulltime" && (
          <div style={{ position: "relative", textAlign: "center" }}>
            {outcome === "V" && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -30,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 320,
                  height: 160,
                  background: `radial-gradient(ellipse at center, ${GOLD}55 0%, transparent 70%)`,
                  filter: "blur(6px)",
                  animation: "mlGlow 2.4s ease-in-out infinite",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <Coach pose={outcome === "V" ? "celebra" : outcome === "D" ? "preocupado" : "neutral"} size={96} slug={selfSlug} />
              </div>
              <div
                style={{
                  fontSize: outcome === "V" ? 30 : 22,
                  fontWeight: 900,
                  letterSpacing: outcome === "V" ? 3 : 1.5,
                  textTransform: "uppercase",
                  color: outColor,
                  marginBottom: 4,
                  animation: "mlWinIn .55s cubic-bezier(.2,.9,.3,1.3) both",
                  textShadow: outcome === "V" ? `0 4px 24px ${GOLD}88` : "none",
                }}
              >
                {outcome === "V" ? "¡Victoria!" : outcome === "E" ? "Empate" : "Derrota"}
              </div>
              <div style={{ fontSize: 12.5, color: MID, marginBottom: 14 }}>
                {outcome === "V"
                  ? wasEverBehind(events)
                    ? "Remontada de bandera. El banquillo ruge contigo."
                    : "El banquillo ruge contigo. Así se dirige."
                  : outcome === "E"
                    ? "Un punto que suma. A seguir construyendo."
                    : "A levantar la cabeza, míster. Esto no acaba aquí."}
              </div>
              {shootoutRes && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: BG3, border: `1px solid ${outColor}55`, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD }}>Tanda de penaltis</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: outColor, marginTop: 3 }}>
                    {shootoutRes.self} - {shootoutRes.opp}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                    {shootoutRes.kicks.map((k, i) => (
                      <span
                        key={i}
                        title={`${k.team === "self" ? (selfNat?.nombre ?? "Tú") : (oppNat?.nombre ?? "Rival")} · ${k.scored ? "gol" : "fallo"}`}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: `2px solid ${k.team === "self" ? GOLD : "rgba(255,255,255,0.4)"}`,
                          background: k.scored ? (k.team === "self" ? GOLD : "rgba(255,255,255,0.7)") : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {motm && (
                <div style={{ padding: "10px 14px", borderRadius: 12, background: BG3, border: `1px solid ${GOLD}44`, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD }}>Figura del partido</div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", marginTop: 3 }}>{motm}</div>
                </div>
              )}
              <button type="button" onClick={() => onFinish(finalGf, finalGa, wasEverBehind(events), injuredRef.current ?? undefined, talkMoraleRef.current)} style={btnGold}>
                Ver resumen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor de formación + once (overlay sobre la pantalla de plan) */}
      {editingLineup && (
        <LineupEditor
          career={liveCareer}
          onClose={() => setEditingLineup(false)}
          onSave={(f, l) => {
            setFormation(f);
            setLineup(l);
            onLineupChange?.(f, l);
            setEditingLineup(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Celebración de gol a PANTALLA COMPLETA (estilo FIFA): destello en el color del
 * equipo, barrido de luz, la palabra "GOL" entrando con fuerza, la camiseta del
 * goleador saltando y el nombre + minuto. Diferencia gol propio (euforia dorada)
 * de gol rival (rojo, más sobrio). Se monta ~2s y se desmonta solo.
 */
function GoalCelebration({
  goal,
  selfSlug,
  oppSlug,
  selfName,
  oppName,
}: {
  goal: GoalEvent;
  selfSlug: string;
  oppSlug: string;
  selfName: string;
  oppName: string;
}) {
  const mine = goal.team === "self";
  const slug = mine ? selfSlug : oppSlug;
  const name = mine ? selfName : oppName;
  const accent = mine ? GOLD2 : RED;
  const word = mine ? "\u00a1GOOOL!" : "GOL";

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(6,11,20,0.55) 0%, rgba(6,11,20,0.9) 80%)",
        animation: "mlGolWrap 2s ease both",
      }}
    >
      {/* Destello en el color del equipo */}
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}aa 0%, transparent 65%)`,
          animation: "mlGolFlash 1.1s ease-out both",
        }}
      />
      {/* Barrido de luz */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "55%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
          animation: "mlGolSweep 1.1s ease-out both",
        }}
      />
      <div style={{ position: "relative", textAlign: "center", padding: 16 }}>
        <div style={{ animation: "mlGolKit .7s cubic-bezier(.2,.8,.3,1.4) both" }}>
          <Kit slug={slug} size={92} />
        </div>
        <div
          style={{
            fontSize: mine ? 56 : 40,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            margin: "6px 0 2px",
            textShadow: `0 6px 30px ${accent}99`,
            animation: "mlGolWord .8s cubic-bezier(.2,.9,.3,1.2) both",
          }}
        >
          {word}
        </div>
        <div style={{ animation: "mlGolUp .5s .25s ease both", opacity: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{goal.scorer}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: MID, marginTop: 2 }}>
            {name} &middot; {goal.minute}&#39;
          </div>
        </div>
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  flex: 1,
  width: "100%",
  padding: "13px 24px",
  borderRadius: 12,
  border: "none",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: BG,
  fontWeight: 900,
  fontSize: 14.5,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(201,168,76,0.3)",
};

const btnGhost: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: MID,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
