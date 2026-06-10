// src/lib/modo-carrera/match-live.ts
//
// PARTIDO INTERACTIVO (Pilar 1 de la jugabilidad estilo FIFA). En lugar de un
// único clic que escupe el marcador, el DT:
//   1. Elige un PLAN TÁCTICO antes del saque (afecta el ataque y la solidez).
//   2. Da la charla en el DESCANSO (45') y decide en vivo (min 70 y recta final).
// Todo son MULTIPLICADORES sobre las lambdas de goles esperados, así que las
// decisiones cambian de verdad la probabilidad del resultado.
//
// El partido se resuelve en tres ventanas: 0-45', 45-70' y 70-90'. La lógica es
// pura (Poisson); el marcador final se entrega a resolveMatch() para aplicarlo a
// todos los pilares de la carrera.

import type { CareerState, SeasonMatch, Injury } from "./types";
import { matchLambdas, poisson, capScore } from "./season";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";

// Reparto de goles esperados por ventana. El partido jugable se resuelve en TRES
// tramos. El primero cierra en el DESCANSO real (45'), donde se da la charla; los
// otros dos dan al DT sendos momentos de decisión en vivo (min 70 y recta final):
//   · 0-45'  (W1) con el plan de partido → descanso/charla,
//   · 45-70' (W2) con la 1ª decisión en vivo,
//   · 70-90' (W3) con la 2ª decisión (recta final).
const W1 = 0.62;
const W2 = 0.22;
const W3 = 0.16;

// ─── Plan táctico (pre-partido) ──────────────────────────────────────────────
export interface TacticalPlan {
  id: string;
  name: string;
  description: string;
  /** Multiplicador del ataque (goles a favor esperados). */
  atkMult: number;
  /** Multiplicador de la exposición defensiva (goles en contra esperados). */
  defMult: number;
}

export const TACTICAL_PLANS: TacticalPlan[] = [
  {
    id: "equilibrado",
    name: "Equilibrado",
    description: "Bloque medio, sin riesgos. Rinde parecido en ataque y defensa.",
    atkMult: 1.0,
    defMult: 1.0,
  },
  {
    id: "ofensivo",
    name: "Presión alta",
    description: "Vas a por el rival arriba. Más goles a favor… y más espacios atrás.",
    atkMult: 1.35,
    defMult: 1.3,
  },
  {
    id: "defensivo",
    name: "Muro defensivo",
    description: "Cierras atrás y sufres menos, pero generas poco peligro.",
    atkMult: 0.7,
    defMult: 0.62,
  },
  {
    id: "contragolpe",
    name: "Contragolpe",
    description: "Cedes la pelota y golpeas a la espalda. Defensa sólida, ataque punzante.",
    atkMult: 1.15,
    defMult: 0.85,
  },
];

export function planById(id: string): TacticalPlan {
  return TACTICAL_PLANS.find((p) => p.id === id) ?? TACTICAL_PLANS[0];
}

// ─── Decisión en vivo (minuto 60) ────────────────────────────────────────────
export interface InMatchChoice {
  id: string;
  name: string;
  description: string;
  atkMult: number;
  defMult: number;
}

const KEEP: InMatchChoice = {
  id: "mantener",
  name: "Mantener el plan",
  description: "Sin cambios: el partido sigue su curso.",
  atkMult: 1.0,
  defMult: 1.0,
};

/** Opciones del DT en el min. 60, según cómo va el marcador a esa altura. */
export function choicesFor(gf1: number, ga1: number): InMatchChoice[] {
  if (gf1 > ga1) {
    return [
      KEEP,
      {
        id: "cerrar",
        name: "Cerrar el partido",
        description: "Repliegas y aguantas la ventaja. Apenas generarás, pero te blindas.",
        atkMult: 0.6,
        defMult: 0.6,
      },
      {
        id: "sentenciar",
        name: "Ir a sentenciar",
        description: "Buscas el gol que mata el partido… dejando algún hueco atrás.",
        atkMult: 1.4,
        defMult: 1.35,
      },
    ];
  }
  if (gf1 < ga1) {
    return [
      KEEP,
      {
        id: "ordenar",
        name: "Ordenar y empujar",
        description: "Recompones sin volverte loco. Empujas con cabeza.",
        atkMult: 1.2,
        defMult: 1.0,
      },
      {
        id: "todo-ataque",
        name: "Volcarse al ataque",
        description: "Todo o nada por la remontada: máximo riesgo, máxima recompensa.",
        atkMult: 1.7,
        defMult: 1.55,
      },
    ];
  }
  return [
    KEEP,
    {
      id: "buscar",
      name: "Buscar la victoria",
      description: "Das un paso al frente para romper el empate.",
      atkMult: 1.35,
      defMult: 1.2,
    },
    {
      id: "asegurar",
      name: "Asegurar el punto",
      description: "No regalas nada atrás y te conformas con el empate.",
      atkMult: 0.8,
      defMult: 0.7,
    },
  ];
}

// ─── Charla técnica al descanso (solo si vas perdiendo) ──────────────────────
/**
 * Mini-decisión emocional cuando el DT llega al descanso por detrás en el
 * marcador. A diferencia de la decisión táctica del 60', su efecto principal es
 * sobre la MORAL (que se arrastra a la carrera), con un empujón menor al ataque
 * del resto del partido. No hay opción "mala": hay tonos con más o menos riesgo.
 */
export interface HalftimeTalk {
  id: string;
  name: string;
  description: string;
  atkMult: number;
  defMult: number;
  /** Cambio de moral que se persiste en la carrera (vía resolveMatch). */
  moraleDelta: number;
}

export const HALFTIME_TALKS: HalftimeTalk[] = [
  {
    id: "arenga",
    name: "Arenga al grupo",
    description: "Les recuerdas de qué son capaces. El equipo sale enchufado a por el partido.",
    atkMult: 1.18,
    defMult: 1.0,
    moraleDelta: 3,
  },
  {
    id: "calma",
    name: "Pedir calma y orden",
    description: "Bajas revoluciones: paciencia y cabeza. Sin volverse locos atrás.",
    atkMult: 1.05,
    defMult: 1.08,
    moraleDelta: 1,
  },
  {
    id: "exigir",
    name: "Exigir y señalar",
    description: "Aprietas fuerte al vestuario. Reacción inmediata… pero tensas el ambiente.",
    atkMult: 1.3,
    defMult: 0.95,
    moraleDelta: -2,
  },
];

// ─── Resolución por ventanas ─────────────────────────────────────────────────
export interface LiveMatchState {
  planId: string;
  /** Goles de la primera ventana (0-60'). */
  gf1: number;
  ga1: number;
  /** Lambdas base del partido (sin multiplicadores), para la 2ª ventana. */
  lamFor: number;
  lamAg: number;
}

/** Pita el inicio: simula los primeros 60' con el plan táctico elegido. */
export function kickoff(c: CareerState, match: SeasonMatch, plan: TacticalPlan): LiveMatchState {
  const { lamFor, lamAg } = matchLambdas(c, match);
  return {
    planId: plan.id,
    gf1: poisson(lamFor * W1 * plan.atkMult),
    ga1: poisson(lamAg * W1 * plan.defMult),
    lamFor,
    lamAg,
  };
}

export interface LiveMatchResult {
  /** Marcador final. */
  gf: number;
  ga: number;
  /** Goles de la segunda ventana (60-90'). */
  gf2: number;
  ga2: number;
}

// ─── Lesión EN PARTIDO + sustitución del DT (decisión en vivo) ────────────────
/**
 * Probabilidad de que un titular se retire lesionado durante el partido.
 * Calibrada con INJURY_CHANCE/SUSPENSION_CHANCE (modo rápido) para que el ciclo
 * partido+post-partido no genere bajas casi cada jornada.
 */
const MATCH_INJURY_CHANCE = 0.12;

/** Una opción de recambio que el DT puede meter al lesionarse un jugador. */
export interface SubOption {
  id: string;
  /** Jugador real del banquillo que entra. */
  player: string;
  pos: string;
  /** Etiqueta del perfil del cambio. */
  label: string;
  description: string;
  /** Multiplicadores sobre el resto del partido (se combinan con la decisión 60'). */
  atkMult: number;
  defMult: number;
}

/** Lesión surgida en el partido: el jugador que cae y los recambios posibles. */
export interface MatchInjury {
  /** Jugador lesionado (se persiste como baja de la temporada). */
  injured: Injury;
  /** Minuto en el que se produjo (para el relato). */
  minute: number;
  /** Opciones de sustitución que inciden en el rendimiento del resto del partido. */
  options: SubOption[];
}

/**
 * Tira por una lesión DURANTE el partido. Si ocurre, devuelve el titular que cae
 * y TRES recambios reales del banquillo con perfiles tácticos distintos (igual por
 * igual, refuerzo ofensivo, refuerzo defensivo): la elección del DT cambia de
 * verdad el rendimiento del resto del encuentro. Devuelve null si no hay lesión o
 * el roster es insuficiente. Se pre-tira al saque para que el partido sea estable.
 */
export function rollMatchInjury(c: CareerState, _match: SeasonMatch, onFieldNames: string[] = []): MatchInjury | null {
  if (Math.random() >= MATCH_INJURY_CHANCE) return null;
  const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  if (roster.length < 6) return null;

  // El lesionado es un jugador de campo (no portero) que ESTÁ en el campo: solo se
  // lesiona quien juega, nunca un suplente. Si no se pasó el once, cae cualquiera.
  const onField = new Set(onFieldNames);
  const field = roster.filter(
    (p) => p.pos !== "GK" && (onField.size === 0 || onField.has(p.name)),
  );
  if (field.length === 0) return null;
  const injuredPlayer = field[Math.floor(Math.random() * field.length)];
  const matchesOut = 1 + Math.floor(Math.random() * 3); // 1..3 partidos
  const injured: Injury = { player: injuredPlayer.name, pos: injuredPlayer.pos, matchesOut };

  // Recambios reales del banquillo (excluido el lesionado).
  const bench = roster.filter((p) => p.name !== injuredPlayer.name);
  const pickBy = (pred: (p: RosterPlayer) => boolean): RosterPlayer => {
    const pool = bench.filter(pred);
    return (pool.length ? pool : bench)[Math.floor(Math.random() * (pool.length ? pool.length : bench.length))];
  };
  const likeFor = pickBy((p) => p.pos === injuredPlayer.pos);
  const offensive = pickBy((p) => p.pos === "FWD" || p.pos === "MID");
  const defensive = pickBy((p) => p.pos === "DEF" || p.pos === "MID");

  const options: SubOption[] = [
    {
      id: "iguales",
      player: likeFor.name,
      pos: likeFor.pos,
      label: "Igual por igual",
      description: "Mantienes el dibujo. Sin sobresaltos, ligero bajón natural.",
      atkMult: 0.95,
      defMult: 0.95,
    },
    {
      id: "ofensivo",
      player: offensive.name,
      pos: offensive.pos,
      label: "Refuerzo ofensivo",
      description: "Más pólvora arriba… te expones algo atrás.",
      atkMult: 1.12,
      defMult: 0.85,
    },
    {
      id: "defensivo",
      player: defensive.name,
      pos: defensive.pos,
      label: "Refuerzo defensivo",
      description: "Cierras atrás a costa de mordiente.",
      atkMult: 0.82,
      defMult: 1.12,
    },
  ];

  return { injured, minute: 25 + Math.floor(Math.random() * 20), options };
}

// ─── CAMBIOS EN VIVO: sustitución voluntaria + cambio de sistema ─────────────
// Más allá del recambio FORZADO por lesión, el DT puede MOVER el banquillo cuando
// quiera en los momentos de decisión (min 60 y 75): meter piernas frescas o un
// perfil ofensivo/defensivo, y cambiar el SISTEMA táctico a mitad de partido.
// Como todo en este motor, son multiplicadores que se combinan con la decisión.

/** Nº máximo de cambios (sustituciones) que el DT puede hacer en un partido. */
export const MAX_LIVE_SUBS = 3;

/**
 * Recambios VOLUNTARIOS del banquillo (no por lesión): tres perfiles tácticos con
 * jugadores reales. `usedNames` excluye a quienes ya entraron o cayeron lesionados
 * para no repetir nombres. Devuelve [] si no quedan suplentes suficientes.
 *   · "frescas"  → oxígeno: pequeño plus general (piernas nuevas).
 *   · "ofensivo" → más pólvora arriba a costa de exponerte algo atrás.
 *   · "defensivo"→ cierras atrás a costa de mordiente.
 */
export function voluntarySubOptions(c: CareerState, usedNames: string[]): SubOption[] {
  const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  const used = new Set(usedNames);
  const bench = roster.filter((p) => !used.has(p.name));
  if (bench.length < 3) return [];

  const pickBy = (pred: (p: RosterPlayer) => boolean): RosterPlayer => {
    const pool = bench.filter(pred);
    return (pool.length ? pool : bench)[Math.floor(Math.random() * (pool.length ? pool.length : bench.length))];
  };
  const fresh = pickBy((p) => p.pos === "MID" || p.pos === "FWD");
  const offensive = pickBy((p) => p.pos === "FWD" || p.pos === "MID");
  const defensive = pickBy((p) => p.pos === "DEF" || p.pos === "MID");

  return [
    {
      id: "frescas",
      player: fresh.name,
      pos: fresh.pos,
      label: "Piernas frescas",
      description: "Oxígeno desde el banquillo. Un plus de energía para el tramo final.",
      atkMult: 1.07,
      defMult: 1.05,
    },
    {
      id: "ofensivo",
      player: offensive.name,
      pos: offensive.pos,
      label: "Refuerzo ofensivo",
      description: "Más gente de ataque. Ganas pegada, te expones algo atrás.",
      atkMult: 1.16,
      defMult: 0.9,
    },
    {
      id: "defensivo",
      player: defensive.name,
      pos: defensive.pos,
      label: "Refuerzo defensivo",
      description: "Refuerzas el bloque. Cierras atrás a costa de mordiente.",
      atkMult: 0.88,
      defMult: 1.16,
    },
  ];
}

/** Planes a los que el DT puede CAMBIAR el sistema en vivo (todos menos el actual). */
export function systemChangeOptions(currentPlanId: string): TacticalPlan[] {
  return TACTICAL_PLANS.filter((p) => p.id !== currentPlanId);
}

// ─── VALORACIÓN DEL CAMBIO + REACCIÓN DEL RIVAL (estilo videojuego) ──────────
/** Lectura de un cambio en vivo: multiplicadores efectivos + valoración. */
export interface ChangeVerdict {
  /** Multiplicadores YA ajustados por calidad, idoneidad y reacción rival. */
  atkMult: number;
  defMult: number;
  /** Acierto del cambio (para el color/relato). */
  rating: "acierto" | "correcto" | "dudoso" | "error";
  /** Lectura del cambio + cómo se adapta el rival (texto para el relato). */
  feedback: string;
}

/**
 * Evalúa un cambio EN VIVO (sustitución o cambio de sistema) como en un
 * videojuego: NO es un buff gratis. Pondera tres cosas y ajusta el efecto real:
 *   1. CALIDAD del recambio → ligada a la pegada real del equipo (lamFor): una
 *      selección top mete mejores piezas que una modesta.
 *   2. IDONEIDAD táctica → ¿pega el cambio con el marcador? Atacar perdiendo y
 *      defender ganando se premian; lo contrario se penaliza.
 *   3. REACCIÓN del rival → el otro equipo LEE el cambio y se reajusta: si te
 *      abres, te castiga a la espalda; cuanto más peligroso (lamAg), más duele.
 * Devuelve los multiplicadores efectivos + una valoración para el relato.
 */
export function evaluateLiveChange(
  state: LiveMatchState,
  scoreline: { gf: number; ga: number },
  intent: { atkMult: number; defMult: number; kind: "sub" | "system" },
): ChangeVerdict {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const margin = scoreline.gf - scoreline.ga;
  // >0 el cambio se inclina al ataque; <0 a la defensa.
  const offBias = intent.atkMult - intent.defMult;

  // 1) CALIDAD: la pegada del equipo (lamFor ~1.3 medio) marca cuánto rinde el
  //    recambio. Top (lamFor alto) amplifica; modesto lo atenúa.
  const quality = clamp(0.9 + (state.lamFor - 1.3) * 0.14, 0.85, 1.16);

  // 2) IDONEIDAD respecto al marcador.
  let fit: number;
  if (margin < 0) fit = offBias; // perdiendo → premia atacar
  else if (margin > 0) fit = -offBias; // ganando → premia defender
  else fit = offBias * 0.5; // empate → ligero premio a atacar
  // Eficacia combinada (calidad × idoneidad) sobre la desviación del cambio.
  const eff = clamp(quality * (1 + fit * 0.3), 0.78, 1.22);

  // 3) REACCIÓN del rival: lee el cambio y se reajusta. Cuanto más peligroso
  //    (lamAg) y más te hayas abierto, más te castiga a la espalda.
  const oppDanger = clamp((state.lamAg - 1.0) * 0.45, 0, 0.55);
  const exposure = Math.max(0, offBias);
  const counter = clamp(oppDanger * (0.55 + exposure * 0.8), 0, 0.6);

  // Multiplicadores efectivos: la idoneidad/calidad escalan la desviación del
  // cambio; el rival erosiona tu ataque y eleva lo que concedes.
  const atkMult = (1 + (intent.atkMult - 1) * eff) * (1 - counter * 0.32);
  const defMult = (1 + (intent.defMult - 1) * eff) * (1 + counter * 0.34);

  // Valoración: la idoneidad manda, la calidad suma, la contra del rival resta.
  const score = fit + (quality - 1) * 1.4 - counter * 0.45;
  const rating: ChangeVerdict["rating"] =
    score > 0.2 ? "acierto" : score > 0.04 ? "correcto" : score > -0.16 ? "dudoso" : "error";

  const reaction =
    offBias > 0.05
      ? "el rival se repliega y acecha tu espalda"
      : offBias < -0.05
        ? "el rival adelanta líneas para presionarte"
        : "el rival ajusta su bloque";
  const verdictWord =
    rating === "acierto"
      ? "Lectura acertada"
      : rating === "correcto"
        ? "Cambio razonable"
        : rating === "dudoso"
          ? "Cambio dudoso"
          : "Cambio desacertado";

  return { atkMult, defMult, rating, feedback: `${verdictWord}: ${reaction}.` };
}

/** Goles del tramo 45-70' tras la 1ª decisión en vivo (sin cerrar el marcador). */
export function secondHalf(state: LiveMatchState, choice: InMatchChoice): { gf2: number; ga2: number } {
  return {
    gf2: poisson(state.lamFor * W2 * choice.atkMult),
    ga2: poisson(state.lamAg * W2 * choice.defMult),
  };
}

/**
 * Goles del tramo final 70-90' tras la 2ª decisión, y marcador definitivo de los
 * 90' (con tope de margen creíble para evitar palizas irreales tipo 9-0).
 */
export function thirdHalf(
  state: LiveMatchState,
  mid: { gf2: number; ga2: number },
  choice: InMatchChoice,
): LiveMatchResult {
  const gf3 = poisson(state.lamFor * W3 * choice.atkMult);
  const ga3 = poisson(state.lamAg * W3 * choice.defMult);
  const capped = capScore(state.gf1 + mid.gf2 + gf3, state.ga1 + mid.ga2 + ga3, state.lamFor, state.lamAg);
  return { gf: capped.gf, ga: capped.ga, gf2: gf3, ga2: ga3 };
}

// ─── TARJETA ROJA / EXPULSIÓN (sucede en cualquier partido) ──────────────────
/** Probabilidad de que haya una expulsión en el encuentro. */
const RED_CARD_CHANCE = 0.16;

/** Expulsión surgida en el partido (de tu equipo o del rival). */
export interface RedCard {
  /** A qué equipo se le va un jugador. */
  team: "self" | "opp";
  /** Minuto de la roja (para el relato y para saber qué tramos afecta). */
  minute: number;
  /** Jugador expulsado (real si es tu equipo; genérico si es el rival). */
  player: string;
}

/**
 * Tira por una expulsión durante el partido. Se pre-tira al saque para que el
 * reloj sea estable. La roja recae más a menudo en el rival que en ti (60/40),
 * y siempre en un jugador de campo. Si te quedas con diez, sufres el resto del
 * partido; si es el rival, juegas con superioridad. El efecto real lo aplica
 * redCardMult() sobre los tramos posteriores al minuto de la roja.
 */
export function rollRedCard(c: CareerState, _match: SeasonMatch): RedCard | null {
  if (Math.random() >= RED_CARD_CHANCE) return null;
  const team: "self" | "opp" = Math.random() < 0.6 ? "opp" : "self";
  const minute = 50 + Math.floor(Math.random() * 33); // 50..82
  let player = "Un defensa rival";
  if (team === "self") {
    const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
    const field = roster.filter((p) => p.pos !== "GK");
    if (field.length) player = field[Math.floor(Math.random() * field.length)].name;
    else player = "Un titular";
  }
  return { team, minute, player };
}

/**
 * Multiplicadores (lado propio) que impone una expulsión sobre un tramo que
 * TERMINA en `windowEndMinute`. Si te quedas con diez bajas tu ataque y te
 * exponen más atrás; si el expulsado es del rival, juegas con superioridad. El
 * tramo solo se ve afectado si la roja ya se había producido al cerrar ese tramo.
 */
export function redCardMult(rc: RedCard | null, windowEndMinute: number): { atk: number; def: number } {
  if (!rc || rc.minute > windowEndMinute) return { atk: 1, def: 1 };
  return rc.team === "self" ? { atk: 0.78, def: 1.22 } : { atk: 1.18, def: 0.84 };
}

// ─── BALÓN PARADO (penalti o falta a tu favor: decisión del DT) ──────────────
/** Probabilidad de que tu equipo disponga de un balón parado de peligro. */
const SET_PIECE_CHANCE = 0.28;

/** Una jugada a balón parado a favor: el DT decide cómo ejecutarla. */
export interface SetPiece {
  kind: "penalti" | "falta";
  /** Minuto en el que se produce (entre el 62 y el 87, dentro de los tramos jugables). */
  minute: number;
  /** Jugador que ejecuta (real del plantel). */
  taker: string;
}

/** Opción de ejecución del balón parado, con su probabilidad de gol. */
export interface SetPieceChoice {
  id: string;
  name: string;
  description: string;
  /** Probabilidad de marcar (0..1). */
  scoreProb: number;
}

/**
 * Tira por un balón parado de peligro a favor (~28%). Se pre-tira al saque para
 * que el reloj sea estable; la pantalla de decisión salta al llegar a su minuto.
 * El ejecutante es un atacante real del plantel.
 */
export function rollSetPiece(c: CareerState, _match: SeasonMatch): SetPiece | null {
  if (Math.random() >= SET_PIECE_CHANCE) return null;
  const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  const att = roster.filter((p) => p.pos === "FWD" || p.pos === "MID");
  const pool = att.length ? att : roster;
  const taker = pool.length ? pool[Math.floor(Math.random() * pool.length)].name : "Tu especialista";
  const kind: "penalti" | "falta" = Math.random() < 0.4 ? "penalti" : "falta";
  const minute = 62 + Math.floor(Math.random() * 26); // 62..87
  return { kind, minute, taker };
}

/** Opciones de ejecución según el tipo de balón parado. */
export function setPieceChoices(kind: "penalti" | "falta"): SetPieceChoice[] {
  if (kind === "penalti") {
    return [
      { id: "frio", name: "Especialista a sangre fría", description: "Tu lanzador de confianza, colocado y seguro. La opción más fiable.", scoreProb: 0.83 },
      { id: "potencia", name: "Potencia y centro", description: "A reventar la red por el medio. Mucha pegada, algo más de riesgo.", scoreProb: 0.72 },
      { id: "picada", name: "Picarla (Panenka)", description: "Sutileza y descaro. Si entra, golazo; si la lee el portero, ridículo.", scoreProb: 0.58 },
    ];
  }
  return [
    { id: "directa", name: "Directa a la escuadra", description: "Buscas la portería con una rosca a la cepa del palo. Difícil, espectacular.", scoreProb: 0.2 },
    { id: "centro", name: "Centro al corazón del área", description: "Colgás el balón para tu rematador. La vía más probable de gol.", scoreProb: 0.33 },
    { id: "ensayada", name: "Jugada ensayada", description: "Combinación de pizarra para sorprender a la defensa.", scoreProb: 0.26 },
  ];
}

/** Resuelve el balón parado: true si termina en gol. */
export function resolveSetPiece(choice: SetPieceChoice): boolean {
  return Math.random() < choice.scoreProb;
}

// ─── PRÓRROGA (solo eliminatorias empatadas a los 90') ───────────────────────
/** Peso de los 30' de la prórroga frente a los 90' reglamentarios. */
const W_ET = 0.26;

/**
 * Decisión del DT para afrontar la prórroga. En el fútbol real una eliminatoria
 * NO puede acabar en empate: si los 90' están igualados se juegan 30' extra y, de
 * seguir la igualdad, se va a los penaltis. El enfoque del DT mueve de verdad la
 * probabilidad de marcar/encajar en ese tiempo añadido.
 */
export interface ExtraTimeChoice {
  id: string;
  name: string;
  description: string;
  atkMult: number;
  defMult: number;
}

export const EXTRA_TIME_CHOICES: ExtraTimeChoice[] = [
  {
    id: "oro",
    name: "Ir a por el gol",
    description: "Buscas resolverlo en la prórroga. Arriesgas para no llegar a la lotería de los penaltis.",
    atkMult: 1.45,
    defMult: 1.35,
  },
  {
    id: "equilibrio",
    name: "Con cabeza",
    description: "Mantienes el orden y aprovechas la primera que tengas. Equilibrio entre riesgo y solidez.",
    atkMult: 1.05,
    defMult: 1.0,
  },
  {
    id: "penales",
    name: "Aguantar a penaltis",
    description: "Te blindas atrás y confías tu suerte a la tanda. Apenas generarás, pero casi no concedes.",
    atkMult: 0.55,
    defMult: 0.5,
  },
];

/** Goles marcados en los 30' de prórroga según el enfoque elegido. */
export function extraTime(state: LiveMatchState, choice: ExtraTimeChoice): { gfEt: number; gaEt: number } {
  return {
    gfEt: poisson(state.lamFor * W_ET * choice.atkMult),
    gaEt: poisson(state.lamAg * W_ET * choice.defMult),
  };
}

// ─── TANDA DE PENALTIS (si la prórroga sigue empatada) ───────────────────────
/**
 * Estrategia del DT para la tanda. Los penaltis son una lotería, pero las
 * decisiones del míster (orden de tiradores, leer al rival, jugar con la presión)
 * inclinan ligeramente la balanza: `selfBonus` sube tu conversión y `oppPenalty`
 * baja la del rival.
 */
export interface PenaltyStrategy {
  id: string;
  name: string;
  description: string;
  selfBonus: number;
  oppPenalty: number;
}

export const PENALTY_STRATEGIES: PenaltyStrategy[] = [
  {
    id: "confianza",
    name: "Tiradores de confianza",
    description: "Pones a lanzar a tus jugadores de mayor sangre fría. Más acierto desde los once metros.",
    selfBonus: 0.07,
    oppPenalty: 0,
  },
  {
    id: "estandar",
    name: "Orden habitual",
    description: "Confías en el orden de siempre. Sin sorpresas, a sangre fría.",
    selfBonus: 0,
    oppPenalty: 0,
  },
  {
    id: "portero",
    name: "Estudiar al rival",
    description: "Das instrucciones a tu portero sobre dónde van a tirar. Te juegas algo de tu acierto por restarle al rival.",
    selfBonus: -0.02,
    oppPenalty: 0.1,
  },
];

export interface ShootoutKick {
  team: "self" | "opp";
  scored: boolean;
}

export interface ShootoutResult {
  self: number;
  opp: number;
  winner: "self" | "opp";
  kicks: ShootoutKick[];
}

/**
 * Simula una tanda de penaltis: 5 lanzamientos por lado y, si persiste el empate,
 * muerte súbita. Conversión base ~0.74 ajustada por la estrategia del DT. Sin
 * ventaja de local: las tandas solo ocurren en eliminatorias de Mundial, que se
 * juegan en sede neutral. Se detiene en cuanto la tanda queda matemáticamente
 * decidida (como en la realidad).
 */
export function shootout(_match: SeasonMatch, strat: PenaltyStrategy): ShootoutResult {
  const selfProb = clamp01(0.74 + strat.selfBonus);
  const oppProb = clamp01(0.74 - strat.oppPenalty);
  const kicks: ShootoutKick[] = [];
  let self = 0;
  let opp = 0;

  // ¿Puede el resultado cambiar aún? (tiros restantes de la fase regular de 5).
  const decided = (sShot: number, oShot: number) => {
    const sRem = Math.max(0, 5 - sShot);
    const oRem = Math.max(0, 5 - oShot);
    if (self > opp + oRem) return true;
    if (opp > self + sRem) return true;
    return false;
  };

  let sShot = 0;
  let oShot = 0;
  // Primeros 5 por lado (alternando), con corte anticipado.
  while ((sShot < 5 || oShot < 5) && !decided(sShot, oShot)) {
    if (sShot <= oShot) {
      const ok = Math.random() < selfProb;
      kicks.push({ team: "self", scored: ok });
      if (ok) self++;
      sShot++;
    } else {
      const ok = Math.random() < oppProb;
      kicks.push({ team: "opp", scored: ok });
      if (ok) opp++;
      oShot++;
    }
  }

  // Muerte súbita: pares de lanzamientos hasta que uno falle y el otro anote.
  while (self === opp) {
    const s = Math.random() < selfProb;
    kicks.push({ team: "self", scored: s });
    if (s) self++;
    const o = Math.random() < oppProb;
    kicks.push({ team: "opp", scored: o });
    if (o) opp++;
  }

  return { self, opp, winner: self > opp ? "self" : "opp", kicks };
}

function clamp01(n: number): number {
  return Math.max(0.5, Math.min(0.95, n));
}
