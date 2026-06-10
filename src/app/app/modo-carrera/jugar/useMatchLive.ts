// src/app/app/modo-carrera/jugar/useMatchLive.ts
//
// MÁQUINA DE ESTADOS del partido interactivo (Modo Carrera). Extraída de
// MatchLive.tsx para separar la lógica de juego del render: aquí viven el reloj
// cinematográfico, las fases (plan → mitades → decisiones → balón parado →
// prórroga → penaltis → final), los eventos de gol, los cambios en vivo y el
// marcador definitivo. MatchLive.tsx consume este hook y solo pinta.
//
// El código se movió VERBATIM desde el componente: cualquier ajuste de reglas
// del partido se hace aquí; cualquier ajuste visual, en el .tsx.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GOLD, GREEN, RED } from "./fx";
import { SELECCIONES } from "@/data/selecciones";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";
import { classicLabel } from "@/lib/modo-carrera/classics";
import { formationById, resolveLineup, xiRating, bestXI, lineupValid, availableRoster, unavailableNames } from "@/lib/modo-carrera/lineup";
import {
  TACTICAL_PLANS,
  kickoff,
  secondHalf,
  thirdHalf,
  choicesFor,
  rollMatchInjury,
  rollRedCard,
  redCardMult,
  rollSetPiece,
  resolveSetPiece,
  voluntarySubOptions,
  evaluateLiveChange,
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
  type ChangeVerdict,
} from "@/lib/modo-carrera/match-live";
import type { CareerState, SeasonMatch, Injury } from "@/lib/modo-carrera/types";

export type Phase =
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

export interface GoalEvent {
  minute: number;
  team: "self" | "opp";
  scorer: string;
}

type FeedItemContent =
  | { kind: "goal"; minute: number; team: "self" | "opp"; scorer: string }
  | { kind: "red"; minute: number; team: "self" | "opp"; player: string };

/**
 * `key`: clave React ESTABLE derivada del contenido (no del índice): el feed se
 * ordena por minuto y una roja/gol tardío puede insertarse en medio; con key={i}
 * las filas posteriores se re-montaban y re-disparaban su animación de entrada.
 */
export type FeedItem = FeedItemContent & { key: string };

const sel = (slug: string) => SELECCIONES.find((s) => s.slug === slug);

function keyPlayers(slug: string, n = 3, blocked?: Set<string>): RosterPlayer[] {
  const roster = (FANTASY_ROSTERS[slug] ?? []).filter((p) => !blocked?.has(p.name));
  const fwd = roster.filter((p) => p.pos === "FWD");
  const mid = roster.filter((p) => p.pos === "MID");
  return [...fwd, ...mid].slice(0, n);
}

function pickScorer(slug: string, blocked?: Set<string>): string {
  const roster = (FANTASY_ROSTERS[slug] ?? []).filter((p) => !blocked?.has(p.name));
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

function buildEvents(gfSelf: number, gaOpp: number, selfSlug: string, oppSlug: string, lo: number, hi: number, selfBlocked?: Set<string>): GoalEvent[] {
  const ev: GoalEvent[] = [];
  for (const m of goalMinutes(gfSelf, lo, hi)) ev.push({ minute: m, team: "self", scorer: pickScorer(selfSlug, selfBlocked) });
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
export function wasEverBehind(events: GoalEvent[]): boolean {
  let gf = 0;
  let ga = 0;
  for (const e of [...events].sort((a, b) => a.minute - b.minute)) {
    if (e.team === "self") gf++;
    else ga++;
    if (ga > gf) return true;
  }
  return false;
}

export function useMatchLive(career: CareerState, match: SeasonMatch) {
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
  // CAMBIOS EN VIVO (decisión del DT en min 60 y 75): sustituciones voluntarias y
  // cambio de sistema. Acumulan multiplicadores que se combinan con la decisión.
  const volSubMultRef = useRef<{ atk: number; def: number }>({ atk: 1, def: 1 });
  const systemMultRef = useRef<{ atk: number; def: number }>({ atk: 1, def: 1 });
  // Nombres ya usados (lesionado + recambios) para no repetir en el banquillo.
  const usedSubNamesRef = useRef<string[]>([]);
  const [subsUsed, setSubsUsed] = useState(0);
  const [currentPlanName, setCurrentPlanName] = useState<string>(TACTICAL_PLANS[0].name);
  // Sub-panel del momento de decisión: la orden táctica, o el banquillo/pizarra.
  const [decisionPanel, setDecisionPanel] = useState<"main" | "sub" | "sistema">("main");
  // Recambios ofrecidos al abrir el banquillo (se fijan una vez para no re-rotar
  // los nombres en cada render, ya que voluntarySubOptions usa aleatoriedad).
  const [subOffer, setSubOffer] = useState<SubOption[]>([]);
  // Registro de cambios en vivo (para mostrarlos como "movimientos del banco").
  const [liveChanges, setLiveChanges] = useState<{ text: string; rating: ChangeVerdict["rating"] }[]>([]);
  // Prórroga + penaltis (solo eliminatorias empatadas a los 90'). En el fútbol
  // real una eliminatoria nunca acaba en empate: hay 30' extra y, si sigue igual,
  // tanda de penaltis. El DT decide el enfoque de ambas.
  const isKnockout = ["octavos", "cuartos", "semifinal", "final"].includes(match.stage);
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

  // Bajas de la selección (lesionados + sancionados con partidos pendientes): NO
  // pueden jugar este partido, ni aparecer en el once, ni marcar, ni entrar de
  // suplentes. Es el detalle que faltaba: un jugador con reposo pendiente seguía
  // saliendo en el campo.
  const selfBlocked = useMemo(() => unavailableNames(career), [career]);
  const selfAvail = useMemo(() => availableRoster(career), [career]);

  const selfKey = useMemo(() => keyPlayers(selfSlug, 3, selfBlocked), [selfSlug, selfBlocked]);
  const oppKey = useMemo(() => keyPlayers(oppSlug), [oppSlug]);

  // Resumen del dibujo + once para la pantalla de plan: valoración media del once
  // efectivo (el guardado si es válido; si no, el mejor once por defecto). Se
  // construye SOLO con jugadores disponibles (sin lesionados/sancionados).
  const xiInfo = useMemo(() => {
    const roster = selfAvail;
    const f = formationById(formation);
    const custom = lineupValid(lineup, roster, f);
    const players = custom ? resolveLineup(lineup, roster) : bestXI(roster, f);
    return { rating: xiRating(players), formationName: f.name, custom, players };
  }, [selfAvail, formation, lineup]);

  // Candidatos a lanzar el balón parado: SOLO jugadores del once en el campo (se
  // respeta tu alineación). El capitán va primero (lanzador de confianza), luego
  // delanteros y centrocampistas; cierran el resto. El DT elige a mano (lo pidió
  // el usuario) antes de decidir cómo se ejecuta la jugada.
  const captainName = career.squad?.captain ?? null;
  // Jugadores que YA NO están en el campo (lesionados que cayeron + sustituidos) y
  // los que ENTRARON desde el banquillo. El balón parado debe reflejar el once REAL
  // en ese instante: si un cambio te quitó a tu lanzador, deja de ofrecerlo.
  const [leftPitch, setLeftPitch] = useState<string[]>([]);
  const [enteredPitch, setEnteredPitch] = useState<RosterPlayer[]>([]);
  const setPieceTakers = useMemo(() => {
    const out = new Set(leftPitch);
    const onField: RosterPlayer[] = [
      ...xiInfo.players.filter((p) => !out.has(p.name)),
      ...enteredPitch,
    ];
    const rank = (p: RosterPlayer) =>
      (p.name === captainName ? 0 : 4) + (p.pos === "FWD" ? 1 : p.pos === "MID" ? 2 : 3);
    return [...onField].sort((a, b) => rank(a) - rank(b)).slice(0, 6);
  }, [xiInfo, captainName, leftPitch, enteredPitch]);
  // Lanzador elegido para el balón parado en curso (null = aún sin elegir).
  const [spTaker, setSpTaker] = useState<RosterPlayer | null>(null);

  // Reloj con RITMO CINEMATOGRÁFICO: setTimeout recursivo para variar el tempo
  // minuto a minuto (acelera a media, frena en el tramo final) y DETENERSE
  // durante la celebración de un gol — como en FIFA, el juego para para festejar.
  useEffect(() => {
    if (phase !== "half1" && phase !== "half2" && phase !== "half3" && phase !== "et") return;
    const target = phase === "half1" ? 45 : phase === "half2" ? 70 : phase === "half3" ? 90 : 120;
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
      setSpTaker(null); // primero el DT elige al lanzador, luego cómo se ejecuta
      setSetPiece(sp);
      setPhase("setpiece");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, phase]);

  // Encadena las pantallas del descanso (45', medio tiempo): primero la sustitución
  // por lesión (si la hubo), luego la charla técnica (solo si vas perdiendo) y por
  // último la decisión táctica. Cada paso llama al siguiente al resolverse.
  const goToCharlaOrDecision = () => {
    setPhase(shown.gf < shown.ga ? "charla" : "decision");
  };

  // Transición de fase al alcanzar el tope del reloj. Al llegar al 60' se intercala
  // la sustitución (si hay lesión) antes de la charla/decisión, en el descanso (45').
  useEffect(() => {
    if (phase === "half1" && clock >= 45) {
      if (injuryRef.current) {
        setInjury(injuryRef.current);
        setPhase("injury");
      } else {
        goToCharlaOrDecision();
      }
    }
    // Min 70: segunda decisión en vivo (recta final).
    if (phase === "half2" && clock >= 70) setPhase("decision2");
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
    // El lesionado sale del campo y el recambio entra: el balón parado pasa a
    // ofrecer al que entró, no al que ya no está.
    const outName = injuryRef.current?.injured.player;
    if (outName) setLeftPitch((prev) => [...prev, outName]);
    setEnteredPitch((prev) => [...prev, { name: opt.player, pos: opt.pos as RosterPlayer["pos"], club: "" }]);
    goToCharlaOrDecision();
  };

  // La charla al descanso modula el resto del partido y deja un delta de moral.
  const pickTalk = (talk: HalftimeTalk) => {
    talkMultRef.current = { atk: talk.atkMult, def: talk.defMult };
    talkMoraleRef.current = talk.moraleDelta;
    setPhase("decision");
  };

  // CAMBIO VOLUNTARIO: el DT mete a un suplente desde el banquillo. El efecto NO
  // es el nominal del perfil: pasa por evaluateLiveChange, que pondera la calidad
  // real del equipo, lo idóneo del cambio para el marcador y la REACCIÓN del rival
  // (se adapta y castiga tu apertura). El resultado acumula sobre el resto del
  // partido. Tope de MAX_LIVE_SUBS cambios por encuentro (como en el fútbol real).
  const pickVolSub = (opt: SubOption) => {
    const ls = lsRef.current;
    const v: ChangeVerdict = ls
      ? evaluateLiveChange(ls, { gf: shown.gf, ga: shown.ga }, { atkMult: opt.atkMult, defMult: opt.defMult, kind: "sub" })
      : { atkMult: opt.atkMult, defMult: opt.defMult, rating: "correcto", feedback: "" };
    volSubMultRef.current = {
      atk: volSubMultRef.current.atk * v.atkMult,
      def: volSubMultRef.current.def * v.defMult,
    };
    usedSubNamesRef.current = [...usedSubNamesRef.current, opt.player];
    setEnteredPitch((prev) => [...prev, { name: opt.player, pos: opt.pos as RosterPlayer["pos"], club: "" }]);
    setSubsUsed((n) => n + 1);
    setLiveChanges((prev) => [
      ...prev,
      { text: `Entra ${opt.player} · ${opt.label.toLowerCase()}${v.feedback ? ` — ${v.feedback}` : ""}`, rating: v.rating },
    ]);
    setDecisionPanel("main");
  };

  // CAMBIO DE SISTEMA: el DT reordena el dibujo a mitad de partido. También pasa
  // por evaluateLiveChange (calidad + idoneidad + reacción rival) y REEMPLAZA el
  // multiplicador de sistema por el efectivo (no se acumula con cambios previos de
  // sistema), actualizando el plan vigente para próximas decisiones.
  const pickSystem = (plan: TacticalPlan) => {
    const ls = lsRef.current;
    const v: ChangeVerdict = ls
      ? evaluateLiveChange(ls, { gf: shown.gf, ga: shown.ga }, { atkMult: plan.atkMult, defMult: plan.defMult, kind: "system" })
      : { atkMult: plan.atkMult, defMult: plan.defMult, rating: "correcto", feedback: "" };
    systemMultRef.current = { atk: v.atkMult, def: v.defMult };
    setPlanId(plan.id);
    setCurrentPlanName(plan.name);
    setLiveChanges((prev) => [
      ...prev,
      { text: `Sistema: ${plan.name}${v.feedback ? ` — ${v.feedback}` : ""}`, rating: v.rating },
    ]);
    setDecisionPanel("main");
  };

  // Abre el banquillo: fija los recambios disponibles (3 perfiles reales) una sola
  // vez. Si no quedan suplentes suficientes, no abre el panel.
  const openSubPanel = () => {
    const opts = voluntarySubOptions(career, usedSubNamesRef.current);
    if (opts.length === 0) return;
    setSubOffer(opts);
    setDecisionPanel("sub");
  };

  const startMatch = (plan: TacticalPlan) => {
    const ls = kickoff(liveCareer, match, plan);
    lsRef.current = ls;
    setPlanId(plan.id);
    setEvents(buildEvents(ls.gf1, ls.ga1, selfSlug, oppSlug, 3, 44, selfBlocked));
    // Pre-tirada de lesión en partido: se decide al saque para que el reloj sea
    // estable, pero la pantalla de sustitución salta al llegar al descanso (45').
    injuryRef.current = rollMatchInjury(career, match, xiInfo.players.map((p) => p.name));
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
    // Reinicio de los cambios en vivo: el lesionado pre-tirado (si lo hay) ya
    // queda marcado como "usado" para que no se ofrezca como recambio voluntario.
    volSubMultRef.current = { atk: 1, def: 1 };
    systemMultRef.current = { atk: 1, def: 1 };
    // Las bajas (lesionados/sancionados de la temporada) NO están disponibles en el
    // banquillo: se marcan como "usadas" para que no se ofrezcan como recambio.
    usedSubNamesRef.current = [
      ...selfBlocked,
      ...(injuryRef.current ? [injuryRef.current.injured.player] : []),
    ];
    setSubsUsed(0);
    setLeftPitch([]);
    setEnteredPitch([]);
    setCurrentPlanName(plan.name);
    setDecisionPanel("main");
    setLiveChanges([]);
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
    const vol = volSubMultRef.current;
    const sys = systemMultRef.current;
    const red = redCardMult(redCardRef.current, 70);
    const combined: InMatchChoice = {
      ...choice,
      atkMult: choice.atkMult * sub.atk * talk.atk * vol.atk * sys.atk * red.atk,
      defMult: choice.defMult * sub.def * talk.def * vol.def * sys.def * red.def,
    };
    const mid = secondHalf(ls, combined);
    midRef.current = mid;
    setEvents((prev) => [...prev, ...buildEvents(mid.gf2, mid.ga2, selfSlug, oppSlug, 46, 69, selfBlocked)]);
    setDecisionPanel("main");
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
    const vol = volSubMultRef.current;
    const sys = systemMultRef.current;
    const red = redCardMult(redCardRef.current, 90);
    const combined: InMatchChoice = {
      ...choice,
      atkMult: choice.atkMult * sub.atk * talk.atk * vol.atk * sys.atk * red.atk,
      defMult: choice.defMult * sub.def * talk.def * vol.def * sys.def * red.def,
    };
    const res = thirdHalf(ls, mid, combined);
    resRef.current = res;
    setEvents((prev) => [...prev, ...buildEvents(res.gf2, res.ga2, selfSlug, oppSlug, 71, 90, selfBlocked)]);
    setDecisionPanel("main");
    setPhase("half3");
  };

  // El DT ejecuta el balón parado: si entra, suma un gol extra (evento + agregado)
  // y se muestra el desenlace antes de reanudar el partido en el mismo tramo. El
  // LANZADOR elegido por el DT modula la probabilidad: el capitán (lanzador de
  // confianza) y los delanteros la suben; un perfil menos fino la baja.
  const pickSetPiece = (choice: SetPieceChoice) => {
    const sp = setPieceRef.current;
    if (!sp) return;
    setPieceDoneRef.current = true;
    const takerName = spTaker?.name ?? sp.taker;
    const takerBonus =
      spTaker?.name === captainName ? 0.07 : spTaker?.pos === "FWD" ? 0.04 : spTaker?.pos === "MID" ? 0 : -0.08;
    const eff: SetPieceChoice = { ...choice, scoreProb: Math.max(0.05, Math.min(0.95, choice.scoreProb + takerBonus)) };
    const scored = resolveSetPiece(eff);
    if (scored) {
      setPieceGoalRef.current += 1;
      setEvents((prev) => [...prev, { minute: sp.minute, team: "self", scorer: takerName }]);
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
    setEvents((prev) => [...prev, ...buildEvents(gfEt, gaEt, selfSlug, oppSlug, 91, 120, selfBlocked)]);
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
    // La numeración de duplicados sigue el orden de inserción (append-only), así
    // que la clave de cada fila no cambia aunque el sort la recoloque.
    const seen = new Map<string, number>();
    const withKey = (it: FeedItemContent): FeedItem => {
      const base =
        it.kind === "goal"
          ? `g-${it.minute}-${it.team}-${it.scorer}`
          : `r-${it.minute}-${it.team}-${it.player}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { ...it, key: n > 1 ? `${base}-${n}` : base };
    };
    const items: FeedItem[] = shown.feed.map((e) =>
      withKey({ kind: "goal", minute: e.minute, team: e.team, scorer: e.scorer }),
    );
    if (redCard && redCard.minute <= clock) {
      items.push(withKey({ kind: "red", minute: redCard.minute, team: redCard.team, player: redCard.player }));
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
    // Mientras el DT consulta el banquillo o la pizarra, el reloj de la orden se
    // congela: no se le agota el tiempo por gestionar un cambio.
    if (decisionPanel !== "main") return;
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
  }, [phase, decisionLeft, decisionPanel]);

  // El marcador definitivo es EXACTAMENTE el de los goles que el DT vio caer: cada
  // gol (tramos, balón parado y prórroga) es un evento de `events`, así que se
  // cuentan directamente. Antes el agregado recomputaba con `capScore` (tope de
  // palizas) y re-sumaba balón parado/prórroga por fuera, lo que desincronizaba lo
  // mostrado de lo registrado (un 7-0 en pantalla se guardaba 5-0) y dejaba el gol
  // de balón parado fuera del tope. El tope sigue vigente en la simulación
  // AI-vs-AI de la temporada; el partido que el DT juega registra lo que se vio.
  // Es independiente del reloj: el resultado es correcto aunque el crono no haya
  // llegado al minuto final. Los penaltis NO cambian el marcador en juego (queda
  // el empate), pero suman +1 al ganador para que resolveMatch sea decisivo.
  const aggGf = events.filter((e) => e.team === "self").length;
  const aggGa = events.filter((e) => e.team === "opp").length;
  const finalGf = aggGf + (shootoutRes?.winner === "self" ? 1 : 0);
  const finalGa = aggGa + (shootoutRes?.winner === "opp" ? 1 : 0);
  const outcome = finalGf > finalGa ? "V" : finalGf < finalGa ? "D" : "E";
  const outColor = outcome === "V" ? GREEN : outcome === "E" ? GOLD : RED;

  const motm = useMemo(() => {
    if (phase !== "fulltime") return "";
    const winnerIsSelf = finalGf >= finalGa;
    const winnerSlug = winnerIsSelf ? selfSlug : oppSlug;
    return pickScorer(winnerSlug, winnerIsSelf ? selfBlocked : undefined);
  }, [phase, finalGf, finalGa, selfSlug, oppSlug, selfBlocked]);

  const decisionChoices = phase === "decision" || phase === "decision2" ? choicesFor(shown.gf, shown.ga) : [];

  // Lectura emocional del marcador en vivo: verde si vas ganando, rojo si pierdes.
  const liveScoreColor = shown.gf > shown.ga ? GREEN : shown.gf < shown.ga ? RED : "#fff";
  // Tramo final agónico: el cronómetro late en rojo y más rápido.
  const tense = (phase === "half3" && clock >= 85) || (phase === "half1" && clock >= 57) || (phase === "et" && clock >= 116);
  const clockColor = tense ? RED : GREEN;

  return {
    // Identidad del cruce
    selfSlug,
    oppSlug,
    selfNat,
    oppNat,
    classic,
    isKnockout,
    captainName,
    // Fase y reloj
    phase,
    clock,
    clockColor,
    tense,
    // Plan táctico
    planId,
    setPlanId,
    currentPlanName,
    // Eventos y marcador
    events,
    shown,
    feedItems,
    goalFx,
    liveScoreColor,
    finalGf,
    finalGa,
    outcome,
    outColor,
    motm,
    // Decisiones en vivo
    decisionLeft,
    decisionChoices,
    decisionPanel,
    setDecisionPanel,
    subOffer,
    subsUsed,
    liveChanges,
    // Incidencias
    injury,
    redCard,
    setPiece,
    setPieceResult,
    setPieceTakers,
    spTaker,
    setSpTaker,
    shootoutRes,
    // Alineación
    formation,
    setFormation,
    lineup,
    setLineup,
    editingLineup,
    setEditingLineup,
    liveCareer,
    selfBlocked,
    selfAvail,
    xiInfo,
    selfKey,
    oppKey,
    // Resultado que se entrega a la carrera (botón de final de partido)
    injuredRef,
    talkMoraleRef,
    // Acciones del DT
    startMatch,
    pickChoice,
    pickChoice2,
    pickSub,
    pickTalk,
    pickVolSub,
    pickSystem,
    openSubPanel,
    pickSetPiece,
    resumeFromSetPiece,
    pickET,
    pickPenalty,
  };
}
