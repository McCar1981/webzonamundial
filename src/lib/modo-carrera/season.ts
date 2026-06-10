// src/lib/modo-carrera/season.ts
//
// Motor de TEMPORADA del Modo Carrera (lógica pura, sin React ni servidor). Es el
// bucle de juego que conecta todos los pilares: genera el calendario de un Mundial
// para la selección del DT, simula cada partido y aplica el resultado a:
//   · Legado (récords, trofeos),
//   · Progresión (XP → nivel, moral),
//   · Misiones (avanza victoria/portería a cero/racha de torneo),
//   · Reputación (rivalidades, títulos),
//   · Narrativa (titular automático en partidos clave).
//
// Todas las funciones son inmutables: devuelven un CareerState NUEVO.

import type {
  CareerState,
  SeasonState,
  SeasonMatch,
  TournamentStage,
  MatchOutcome,
  Mission,
  NarrativeEntry,
  Trophy,
  BoardVerdict,
  Injury,
} from "./types";
import { grantXp, sumReputation } from "./engine";
import { missionKey } from "./missions";
import { buildBoardObjective, evaluateSeason } from "./board";
import { injuryPenalty, tickInjuries, rollInjury, activeInjuries } from "./injuries";
import { suspensionPenalty, tickSuspensions, rollSuspension, activeSuspensions } from "./suspensions";
import { buildPressConference } from "./press";
import { buildDressingRoomEvent } from "./vestuario";
import { squadBonus } from "./lineup";
import { concentracionBonus, frescuraAfterMatch, prepMorale, FRESCURA_START } from "./concentracion";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";

const now = () => new Date().toISOString();
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Tope de entradas de narrativa conservadas (las más recientes van primero) para
// que el JSON de la partida no crezca sin límite con el paso de las temporadas.
const MAX_NARRATIVE = 50;

// ─── Etiquetas de fase ───────────────────────────────────────────────────────
export const STAGE_LABEL: Record<TournamentStage, string> = {
  amistoso: "Amistosos de preparación",
  clasificacion: "Fase de clasificación",
  grupos: "Fase de grupos",
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semifinal: "Semifinal",
  final: "Final",
  campeon: "Campeón del Mundo",
  eliminado: "Eliminado",
};

const KO_ORDER: TournamentStage[] = ["octavos", "cuartos", "semifinal", "final"];

/** ¿Es una fase eliminatoria (sin empates: prórroga + penaltis)? */
export function isKnockoutStage(stage: TournamentStage): boolean {
  return KO_ORDER.includes(stage);
}

/** Nº de partidos de clasificación que se deben puntuar para ir al Mundial. */
const QUALIFIERS = 4;
/** Nº de amistosos de preparación antes del torneo. */
const FRIENDLIES = 2;

function nextKnockout(stage: TournamentStage): TournamentStage {
  const i = KO_ORDER.indexOf(stage);
  return i >= 0 && i < KO_ORDER.length - 1 ? KO_ORDER[i + 1] : "campeon";
}

function seleccion(slug: string | null | undefined): Seleccion | undefined {
  return SELECCIONES.find((s) => s.slug === slug);
}

// ─── Fuerzas (equipo del DT vs rival) ────────────────────────────────────────
/**
 * Fuerza por ranking FIFA de una selección (menor ranking → más fuerte). Es la
 * CALIDAD REAL de la plantilla: Argentina (rank 1) ≈ 92; un debutante ≈ 48.
 */
function rankStrength(slug: string | null | undefined): number {
  const rank = seleccion(slug)?.rankingFIFA ?? 60;
  return clamp(92 - (rank - 1) * 0.42, 48, 94);
}

/** Fuerza del rival (alias semántico de rankStrength). */
function opponentStrength(slug: string): number {
  return rankStrength(slug);
}

/**
 * Aporte del DT POR ENCIMA de la plantilla: el overall del míster, sus habilidades
 * generales (mental/gestión, que ayudan a todo) y la moral del vestuario. Un DT
 * novato (overall 50) no resta calidad a la selección; uno consolidado la mejora.
 */
function dtBonus(c: CareerState): number {
  const s = c.skills.levels;
  const general = (s.mental + s.gestion) * 0.8; // 0..8
  const overallAdj = (c.progression.overall - 50) * 0.18; // 0..~8.8
  const moraleAdj = (c.progression.morale - 70) * 0.1; // -7..+3
  // Capitán designado: plus de liderazgo LIGADO a la moral del grupo. Un brazalete
  // no rinde solo (antes era +1.5 plano, un buff gratis que siempre convenía):
  // con el vestuario entregado llega a +1.5, con el grupo roto apenas +0.3.
  const captain = c.squad?.captain ? clamp(0.5 + (c.progression.morale - 50) * 0.02, 0.3, 1.5) : 0;
  // Un gran DT mejora al equipo, pero no lo sube de categoría: el bonus se acota
  // para que la diferencia de fuerza no degenere en palizas irreales (9-0).
  return clamp(overallAdj + general + moraleAdj + captain, -8, 15);
}

/**
 * Fuerza total del equipo = CALIDAD REAL de la selección (ranking FIFA) + aporte
 * del DT. Así dirigir a Argentina con un novato sigue siendo dirigir a Argentina,
 * no a un equipo de fuerza 50. (Antes solo contaba el overall del DT, de ahí los
 * marcadores absurdos tipo Argentina 0-4 Argelia con un DT recién creado.)
 */
function dtStrength(c: CareerState): number {
  return rankStrength(c.identity.nationSlug) + dtBonus(c);
}

/**
 * Potencial ofensivo/defensivo: base común del equipo + especialización por rama
 * (ataque SOLO refuerza el ataque; defensa SOLO la defensa, sin doble cómputo) y
 * el sesgo de la filosofía.
 */
function attackDefense(c: CareerState): { atk: number; def: number } {
  const base = dtStrength(c);
  const s = c.skills.levels;
  let atk = base + s.ataque * 2.0;
  let def = base + s.defensa * 2.0;
  // Lesiones y sanciones: cada baja resta fuerza en su zona (FWD/MID → ataque;
  // DEF/GK → defensa). Un sancionado pesa igual que un lesionado: no juega.
  const pen = injuryPenalty(c);
  const susp = suspensionPenalty(c);
  atk -= pen.atk + susp.atk;
  def -= pen.def + susp.def;
  switch (c.identity.philosophy) {
    case "ofensiva":
      atk += 6;
      def -= 3;
      break;
    case "contragolpe":
      atk += 4;
      def += 1;
      break;
    case "defensiva":
      def += 6;
      atk -= 3;
      break;
    case "posesion":
      atk += 2;
      def += 2;
      break;
    default:
      break;
  }
  // Dibujo + once titular elegidos por el DT: la formación aporta su sesgo y el
  // once, un delta de calidad (alinear a tus mejores ≈ techo; sentarlos resta).
  const sq = squadBonus(c);
  atk += sq.atk;
  def += sq.def;
  // Concentración: la semana de entrenamiento y la frescura del grupo afinan (o
  // lastran) cómo llega el equipo a ESTE partido.
  const prep = concentracionBonus(c);
  atk += prep.atk;
  def += prep.def;
  return { atk, def };
}

/**
 * Momentum (forma) a partir de los últimos resultados de la temporada en curso.
 * Crea rachas dinámicas: ganar encadena empuje (+), perder lastra (-). Rango ~ -3..+3.
 */
export function formMomentum(c: CareerState): number {
  const played = (c.season?.fixtures ?? []).filter((m) => m.played).slice(-3);
  let m = 0;
  for (const p of played) m += p.outcome === "V" ? 1 : p.outcome === "D" ? -1 : 0;
  return m;
}

// ─── Simulación de un partido ────────────────────────────────────────────────
/**
 * Ventaja de campo REALISTA para fútbol de selecciones: solo existe en amistosos
 * y clasificación (ida/vuelta de verdad). Las fases del Mundial se juegan en sede
 * única y neutral, así que el flag `home` ahí es solo "equipo designado local"
 * (camiseta), sin efecto en el rendimiento. Antes pesaba 2.0-2.5 en TODAS las
 * fases y decidía eliminatorias por un sorteo de localía que el DT no controla.
 */
function homeBonus(match: SeasonMatch, weight: number): number {
  if (!match.home) return 0;
  return match.stage === "amistoso" || match.stage === "clasificacion" ? weight : 0;
}

/** Muestreo de Poisson (algoritmo de Knuth) para los goles. */
export function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/**
 * Goles esperados (lambda) del partido para cada lado, ANTES de resolver empates.
 * Es la base estadística compartida por el modo rápido y el partido jugable
 * (match-live.ts), que sobre estas medias aplica plan táctico y decisiones.
 */
export function matchLambdas(c: CareerState, match: SeasonMatch): { lamFor: number; lamAg: number } {
  const { atk, def } = attackDefense(c);
  const oStr = opponentStrength(match.opponentSlug);
  const home = homeBonus(match, 1.2);
  const mom = formMomentum(c); // -3..+3

  // Compresión de élite: un duelo entre dos potencias es más cerrado y con menos
  // goles (igual que en la realidad). Se mide por la calidad del MÁS DÉBIL de los
  // dos (ranking FIFA): si el peor de los dos ya es muy bueno, el partido se aprieta.
  const minQ = Math.min(rankStrength(c.identity.nationSlug), oStr);
  const elite = clamp(1 - (minQ - 78) * 0.016, 0.66, 1);

  // Medias SATURADAS con tanh: por mucho que crezca la diferencia de fuerza, los
  // goles esperados NO se disparan (antes la media a favor llegaba a 4.6 y la cola
  // de Poisson hacía el resto, de ahí los 9-0). Momentum simétrico en ambos lados.
  const lamFor = clamp((1.35 + 1.45 * Math.tanh((atk + home - oStr) / 18) + mom * 0.1) * elite, 0.28, 3.0);
  const lamAg = clamp((1.35 + 1.45 * Math.tanh((oStr - def) / 18) - mom * 0.1) * elite, 0.3, 2.9);
  return { lamFor, lamAg };
}

/**
 * Acota la diferencia de goles a un margen CREÍBLE. El fútbol real no produce
 * palizas de +6 ni entre una potencia y un debutante, y entre equipos parejos
 * rara vez se pasa de +3. El margen máximo escala con la brecha de medias
 * (lamFor vs lamAg): partido igualado → tope ~2-3; favoritísimo claro → hasta 5.
 */
export function capScore(gf: number, ga: number, lamFor: number, lamAg: number): { gf: number; ga: number } {
  const maxMargin = Math.round(clamp(2 + Math.abs(lamFor - lamAg) * 1.6, 2, 5));
  if (gf - ga > maxMargin) return { gf: ga + maxMargin, ga };
  if (ga - gf > maxMargin) return { gf, ga: gf + maxMargin };
  return { gf, ga };
}

/**
 * Resuelve quién gana una eliminatoria igualada (prórroga/penaltis): la fuerza
 * del equipo (con ventaja de local) más un componente de azar.
 */
export function decisiveWinner(c: CareerState, match: SeasonMatch): "self" | "opp" {
  const { atk } = attackDefense(c);
  const oStr = opponentStrength(match.opponentSlug);
  const home = homeBonus(match, 1.5);
  const mine = atk + home + Math.random() * 10;
  const theirs = oStr + Math.random() * 10;
  return mine >= theirs ? "self" : "opp";
}

/**
 * Simula el marcador del partido (modo rápido). En eliminatoria (`decisive`) no
 * hay empates: si el reglamentario acaba igualado, lo resuelve `decisiveWinner`.
 */
function simulate(c: CareerState, match: SeasonMatch, decisive: boolean): { gf: number; ga: number } {
  const { lamFor, lamAg } = matchLambdas(c, match);
  const capped = capScore(poisson(lamFor), poisson(lamAg), lamFor, lamAg);
  let { gf, ga } = capped;
  if (decisive && gf === ga) {
    if (decisiveWinner(c, match) === "self") gf++;
    else ga++;
  }
  return { gf, ga };
}

// ─── Construcción del calendario ─────────────────────────────────────────────
/**
 * Crea el calendario del Mundial para la selección del DT: 3 partidos de grupo
 * (rivales reales del grupo) y la fase eliminatoria (octavos → final) con rivales
 * de dificultad creciente tomados del top del ranking.
 */
export function buildSeason(c: CareerState): SeasonState {
  const self = c.identity.nationSlug;
  const season = c.progression.season;
  const all = SELECCIONES.filter((s) => s.slug !== self);
  const myGroup = seleccion(self)?.grupo;
  const used = new Set<string>(self ? [self] : []);

  // Ranking ascendente (mejor primero): base para los bombos del sorteo y para
  // la dificultad creciente de las eliminatorias.
  const ranked = [...all].sort((a, b) => (a.rankingFIFA ?? 99) - (b.rankingFIFA ?? 99));

  // Rivales de grupo. En la PRIMERA temporada se usa el grupo REAL del Mundial
  // 2026 (ancla con el sorteo oficial). A partir de la 2ª, cada Mundial tiene un
  // SORTEO NUEVO: un rival de cada bombo (alto/medio/bajo del ranking) para que
  // el grupo varíe de torneo en torneo y tenga un reparto realista de nivel.
  const grp: string[] = [];
  const drawFromBand = (lo: number, hi: number) => {
    const band = ranked.slice(lo, hi).filter((s) => !used.has(s.slug));
    const pool = band.length ? band : ranked.filter((s) => !used.has(s.slug));
    if (!pool.length) return;
    const r = pool[Math.floor(Math.random() * pool.length)];
    grp.push(r.slug);
    used.add(r.slug);
  };
  if (season <= 1) {
    for (const s of SELECCIONES) {
      if (grp.length >= 3) break;
      if (s.slug !== self && s.grupo === myGroup && !used.has(s.slug)) {
        grp.push(s.slug);
        used.add(s.slug);
      }
    }
  } else {
    // Sorteo por bombos: uno del tercio alto, uno del medio y uno del bajo.
    const third = Math.ceil(ranked.length / 3);
    drawFromBand(0, third);
    drawFromBand(third, third * 2);
    drawFromBand(third * 2, ranked.length);
  }
  while (grp.length < 3 && all.length) {
    const r = all[Math.floor(Math.random() * all.length)];
    if (!used.has(r.slug)) {
      grp.push(r.slug);
      used.add(r.slug);
    }
  }
  const pickFrom = (pool: Seleccion[]): string => {
    const cand = pool.filter((s) => !used.has(s.slug));
    const arr = cand.length ? cand : pool;
    const r = arr[Math.floor(Math.random() * arr.length)];
    used.add(r.slug);
    return r.slug;
  };

  const mk = (stage: TournamentStage, label: string, opp: string, home: boolean): SeasonMatch => ({
    id: `s${season}-${stage}-${opp}`,
    stage,
    label,
    opponentSlug: opp,
    home,
    played: false,
    gf: null,
    ga: null,
    outcome: null,
  });

  const fixtures: SeasonMatch[] = [];

  // 1) Amistosos de preparación: rivales variados de nivel medio. No eliminan;
  //    sirven para rodar el once, sumar XP y forma antes de la competición.
  const midPool = ranked.slice(20, 70);
  for (let i = 0; i < FRIENDLIES; i++) {
    const pool = midPool.length ? midPool : ranked;
    fixtures.push(mk("amistoso", `Amistoso de preparación · ${i + 1}`, pickFrom(pool), i % 2 === 0));
  }

  // 2) Fase de clasificación: varios partidos previos al Mundial. Hay que sumar
  //    al menos QUALIFIERS puntos (≈1 por partido) para clasificar; si no, la
  //    temporada termina sin Mundial (como en el fútbol real de selecciones).
  for (let i = 0; i < QUALIFIERS; i++) {
    fixtures.push(mk("clasificacion", `Clasificación · J${i + 1}`, pickFrom(ranked.slice(0, 60)), i % 2 === 1));
  }

  // 3) Fase de grupos del Mundial (rivales reales del grupo).
  grp.forEach((o, i) => fixtures.push(mk("grupos", `Fase de grupos · J${i + 1}`, o, i !== 1)));

  // 4) Eliminatorias: dificultad creciente desde el top del ranking.
  fixtures.push(mk("octavos", "Octavos de final", pickFrom(ranked.slice(0, 40)), true));
  fixtures.push(mk("cuartos", "Cuartos de final", pickFrom(ranked.slice(0, 24)), false));
  fixtures.push(mk("semifinal", "Semifinal", pickFrom(ranked.slice(0, 12)), true));
  fixtures.push(mk("final", "Final", pickFrom(ranked.slice(0, 6)), false));

  return { season, fixtures, cursor: 0, stage: "amistoso", finished: false };
}

/**
 * Arranca el torneo de la temporada actual: genera el calendario y fija el
 * objetivo (adaptativo) de la federación, dejando el veredicto en "pendiente".
 * La confianza acumulada se conserva entre temporadas.
 */
export function beginSeason(c: CareerState): CareerState {
  return {
    ...c,
    board: { ...c.board, objective: buildBoardObjective(c), lastVerdict: "pendiente" },
    // Las misiones de torneo (p. ej. racha) son por Mundial: se descartan al
    // iniciar uno nuevo para que ensureMissions las resiembre desde cero.
    missions: c.missions.filter((m) => m.kind !== "torneo"),
    // Plantel: una campaña nueva empieza con el grupo SANO y descansado. Se
    // limpian bajas, sanciones y la concentración pendiente, y se restablece la
    // frescura; se conservan las decisiones del DT (capitán, dibujo, once). Antes
    // las lesiones/sanciones de la final anterior se arrastraban al Mundial nuevo.
    squad: { ...c.squad, injuries: [], suspensions: [], frescura: FRESCURA_START, prep: null },
    season: buildSeason(c),
    updatedAt: now(),
  };
}

/** Arranca la siguiente temporada: sube el contador y genera un torneo nuevo. */
export function startNextSeason(c: CareerState): CareerState {
  const season = c.progression.season + 1;
  const withSeason: CareerState = { ...c, progression: { ...c.progression, season } };
  return beginSeason(withSeason);
}

// ─── Disputar el próximo partido ─────────────────────────────────────────────
export interface PlayResult {
  career: CareerState;
  /** Partido disputado (con resultado) o null si no procedía. */
  match: SeasonMatch | null;
  leveledUp: boolean;
  levelsGained: number;
  newTrophy: Trophy | null;
  /** Ids de títulos desbloqueados en este partido. */
  newTitles: string[];
  eliminated: boolean;
  champion: boolean;
  /** Veredicto de la federación al cerrar la temporada (null si no terminó). */
  boardVerdict: BoardVerdict | null;
  /** Confianza de la federación tras la evaluación (null si no terminó). */
  boardConfidence: number | null;
  /** Rueda de prensa post-partido pendiente de decisión (null si no saltó). */
  press: NarrativeEntry | null;
}

function advanceMissionInline(m: Mission): Mission {
  const progress = Math.min(m.target, m.progress + 1);
  return { ...m, progress, status: progress >= m.target ? "completada" : m.status };
}

// ─── Clasificación de grupo (tabla real, top 2) ──────────────────────────────
/**
 * Resultado DETERMINISTA de un partido neutral entre dos rivales según su fuerza
 * (sin DT, sin azar): los goles esperados se redondean. Antes usaba Poisson, así
 * que la misma tabla de grupo podía clasificar o eliminar al DT por pura suerte
 * en partidos que él ni juega. Ahora la tabla es reproducible y justa.
 */
function simNeutral(aSlug: string, bSlug: string): { ga: number; gb: number } {
  const sa = opponentStrength(aSlug);
  const sb = opponentStrength(bSlug);
  // Divisor 8 (antes 12): la brecha de calidad se nota también en la DIFERENCIA
  // de goles, no solo en el ganador. Con /12 un rival 6-9 puntos mejor solo
  // ganaba 2-1 y los desempates del grupo quedaban aplanados; con /8 ese mismo
  // partido da 2-0/3-0 y la tabla refleja el nivel real (sigue determinista).
  const ga = Math.max(0, Math.round(clamp(1.1 + (sa - sb) / 8, 0.22, 4.2)));
  const gb = Math.max(0, Math.round(clamp(1.1 + (sb - sa) / 8, 0.22, 4.2)));
  return { ga, gb };
}

interface Standing {
  pts: number;
  gd: number;
  gf: number;
}

/**
 * ¿La selección del DT clasifica? Construye la TABLA del grupo: suma los puntos
 * del DT (de sus 3 partidos ya jugados) y simula los 3 partidos entre los rivales
 * para completar la clasificación. Pasan los DOS primeros (puntos, luego
 * diferencia de goles, luego goles a favor), como en el Mundial real. Sustituye a
 * la antigua heurística `pts >= 4`, que no miraba la tabla del grupo.
 */
function qualifiesFromGroup(selfSlug: string, groupMatches: SeasonMatch[]): boolean {
  const table = new Map<string, Standing>();
  const add = (slug: string, pts: number, gf: number, ga: number) => {
    const t = table.get(slug) ?? { pts: 0, gd: 0, gf: 0 };
    t.pts += pts;
    t.gd += gf - ga;
    t.gf += gf;
    table.set(slug, t);
  };

  // Resultados reales del DT (y su reflejo para cada rival).
  for (const m of groupMatches) {
    const gf = m.gf ?? 0;
    const ga = m.ga ?? 0;
    add(selfSlug, m.outcome === "V" ? 3 : m.outcome === "E" ? 1 : 0, gf, ga);
    add(m.opponentSlug, m.outcome === "D" ? 3 : m.outcome === "E" ? 1 : 0, ga, gf);
  }

  // Partidos entre los rivales (round-robin de los 3) para completar la tabla.
  const opps = groupMatches.map((m) => m.opponentSlug);
  for (let i = 0; i < opps.length; i++) {
    for (let j = i + 1; j < opps.length; j++) {
      const { ga, gb } = simNeutral(opps[i], opps[j]);
      add(opps[i], ga > gb ? 3 : ga < gb ? 0 : 1, ga, gb);
      add(opps[j], gb > ga ? 3 : gb < ga ? 0 : 1, gb, ga);
    }
  }

  const ranked = [...table.entries()].sort(
    (a, b) => b[1].pts - a[1].pts || b[1].gd - a[1].gd || b[1].gf - a[1].gf,
  );
  const pos = ranked.findIndex(([slug]) => slug === selfSlug);
  return pos >= 0 && pos < 2;
}

/**
 * ¿La selección del DT logra la clasificación al Mundial? Suma los puntos de sus
 * partidos de clasificación (V=3, E=1, D=0) y exige al menos QUALIFIERS puntos
 * (≈1 por jornada). Es deliberadamente alcanzable: solo una campaña pobre deja al
 * DT fuera, igual que a una selección que se hunde en su grupo clasificatorio.
 */
function qualifiesFromQualifiers(qualMatches: SeasonMatch[]): boolean {
  const pts = qualMatches.reduce(
    (acc, m) => acc + (m.outcome === "V" ? 3 : m.outcome === "E" ? 1 : 0),
    0,
  );
  return pts >= QUALIFIERS;
}

function emptyResult(c0: CareerState): PlayResult {
  return {
    career: c0,
    match: null,
    leveledUp: false,
    levelsGained: 0,
    newTrophy: null,
    newTitles: [],
    eliminated: false,
    champion: false,
    boardVerdict: null,
    boardConfidence: null,
    press: null,
  };
}

/**
 * Índice del partido disputable AHORA (el cursor) o -1 si no procede: no hay
 * temporada, terminó, ya se jugó, o —en Temporada en Vivo— aún no ha llegado la
 * hora real del saque (la UI muestra la cuenta atrás).
 */
function playableIndex(season: SeasonState | null): number {
  if (!season || season.finished || season.cursor >= season.fixtures.length) return -1;
  const fx = season.fixtures[season.cursor];
  if (fx.played) return -1;
  if (season.live && fx.kickoffISO) {
    const k = Date.parse(fx.kickoffISO);
    if (Number.isFinite(k) && k > Date.now()) return -1;
  }
  return season.cursor;
}

/**
 * Simulación RÁPIDA: decide el marcador del próximo partido (modelo de Poisson) y
 * lo aplica a todos los pilares vía resolveMatch. Es el atajo "Disputar al
 * instante"; el partido interactivo usa resolveMatch directamente con su marcador.
 */
export function playNextMatch(c0: CareerState): PlayResult {
  const season = c0.season;
  const idx = playableIndex(season);
  if (idx < 0 || !season) return emptyResult(c0);
  const fx = season.fixtures[idx];
  const decisive = isKnockoutStage(fx.stage);
  const { gf, ga } = simulate(c0, fx, decisive);
  return resolveMatch(c0, gf, ga);
}

/**
 * Aplica un marcador YA decidido (gf-ga, p. ej. el del partido interactivo) al
 * partido en curso y a todos los pilares. Si no hay partido disputable, devuelve
 * el estado sin cambios. En eliminatoria fuerza un ganador si llega empatado.
 */
export function resolveMatch(
  c0: CareerState,
  gfIn: number,
  gaIn: number,
  opts?: { wasBehind?: boolean; injury?: Injury; moraleDelta?: number },
): PlayResult {
  const season = c0.season;
  const idx = playableIndex(season);
  if (idx < 0 || !season) return emptyResult(c0);

  const fx = season.fixtures[idx];
  const decisive = isKnockoutStage(fx.stage);
  let gf = Math.max(0, Math.round(gfIn));
  let ga = Math.max(0, Math.round(gaIn));
  if (decisive && gf === ga) {
    if (decisiveWinner(c0, fx) === "self") gf++;
    else ga++;
  }
  const outcome: MatchOutcome = gf > ga ? "V" : gf < ga ? "D" : "E";

  const playedMatch: SeasonMatch = { ...fx, played: true, gf, ga, outcome };
  const fixtures = season.fixtures.map((m, i) => (i === idx ? playedMatch : m));

  // ── Récords ──
  const r = c0.legacy.records;
  const records = {
    matchesPlayed: r.matchesPlayed + 1,
    wins: r.wins + (outcome === "V" ? 1 : 0),
    draws: r.draws + (outcome === "E" ? 1 : 0),
    losses: r.losses + (outcome === "D" ? 1 : 0),
    goalsFor: r.goalsFor + gf,
    goalsAgainst: r.goalsAgainst + ga,
    titlesWon: r.titlesWon,
  };

  // ── Moral ──
  // El resultado mueve la moral; la charla técnica al descanso (partido jugable)
  // aporta su propio delta, que llega ya resuelto desde MatchLive. La semana de
  // concentración también deja su huella anímica (recuperación, pizarra…).
  let morale = clamp(
    c0.progression.morale +
      (outcome === "V" ? 6 : outcome === "E" ? 1 : -8) +
      (opts?.moraleDelta ?? 0) +
      prepMorale(c0),
    0,
    100,
  );

  // ── Transición de fase ──
  let stage: TournamentStage = season.stage;
  let finished = false;
  let champion = false;
  let eliminated = false;

  // ¿No clasificó al Mundial? (se calcula abajo, en la rama de clasificación).
  let failedQualifying = false;

  if (fx.stage === "amistoso") {
    // Los amistosos nunca eliminan: se avanza al siguiente partido del calendario.
    const next = fixtures[idx + 1];
    stage = next ? next.stage : stage;
  } else if (fx.stage === "clasificacion") {
    const qualMatches = fixtures.filter((m) => m.stage === "clasificacion");
    const qualDone = qualMatches.every((m) => m.played);
    if (qualDone) {
      if (qualifiesFromQualifiers(qualMatches)) {
        stage = "grupos"; // clasificado: arranca el Mundial
      } else {
        stage = "eliminado";
        finished = true;
        eliminated = true;
        failedQualifying = true;
      }
    } else {
      stage = "clasificacion";
    }
  } else if (fx.stage === "grupos") {
    const groupMatches = fixtures.filter((m) => m.stage === "grupos");
    const groupDone = groupMatches.every((m) => m.played);
    if (groupDone) {
      const selfSlug = c0.identity.nationSlug ?? "__self__";
      if (qualifiesFromGroup(selfSlug, groupMatches)) {
        stage = "octavos"; // termina entre los dos primeros del grupo
      } else {
        stage = "eliminado";
        finished = true;
        eliminated = true;
      }
    }
  } else if (outcome === "V") {
    if (fx.stage === "final") {
      stage = "campeon";
      finished = true;
      champion = true;
    } else {
      stage = nextKnockout(fx.stage);
    }
  } else {
    stage = "eliminado";
    finished = true;
    eliminated = true;
  }

  // ── Misiones (avance por clave de plantilla) ──
  const missions = c0.missions.map((m) => {
    if (m.status !== "activa") return m;
    const key = missionKey(m);
    if (key === "victoria_semanal" && outcome === "V") return advanceMissionInline(m);
    if (key === "porteria_cero" && ga === 0) return advanceMissionInline(m);
    if (key === "racha_torneo") {
      return outcome === "V" ? advanceMissionInline(m) : { ...m, progress: 0 };
    }
    return m;
  });

  // ── Rivalidades (solo en eliminatoria) ──
  let rivalries = c0.reputation.rivalries;
  if (isKnockoutStage(fx.stage)) {
    const oppName = seleccion(fx.opponentSlug)?.nombre ?? fx.opponentSlug;
    const existing = rivalries.find((rv) => rv.rival === oppName);
    if (existing) {
      rivalries = rivalries.map((rv) =>
        rv.rival === oppName
          ? {
              ...rv,
              intensity: clamp(rv.intensity + 15, 0, 100),
              wins: rv.wins + (outcome === "V" ? 1 : 0),
              losses: rv.losses + (outcome === "D" ? 1 : 0),
            }
          : rv,
      );
    } else {
      rivalries = [
        ...rivalries,
        { rival: oppName, intensity: 40, wins: outcome === "V" ? 1 : 0, losses: outcome === "D" ? 1 : 0 },
      ];
    }
  }

  // ── Títulos / insignias ──
  const titles = [...c0.reputation.titles];
  const newTitles: string[] = [];
  const addTitle = (id: string) => {
    if (!titles.includes(id)) {
      titles.push(id);
      newTitles.push(id);
    }
  };
  if (records.matchesPlayed === 1) addTitle("debut");
  if (fx.stage === "grupos") {
    const groupMatches = fixtures.filter((m) => m.stage === "grupos");
    if (groupMatches.every((m) => m.played) && groupMatches.every((m) => m.outcome !== "D")) {
      addTitle("invicto");
    }
  }
  // "Rey de la remontada": ganar un partido en el que se estuvo por detrás en el
  // marcador (lo aporta el partido interactivo, que sí conoce el desarrollo).
  if (outcome === "V" && opts?.wasBehind) addTitle("remontada");

  // Hitos de carrera de largo plazo (a partir de los récords acumulados): dan al
  // DT metas a varias temporadas vista, no solo el título de cada Mundial.
  if (records.matchesPlayed >= 50) addTitle("veterano");
  if (records.matchesPlayed >= 100) addTitle("centenario");
  if (records.wins >= 50) addTitle("centurion");
  if (records.goalsFor >= 100) addTitle("goleador");
  if (c0.progression.overall >= 88) addTitle("leyenda_banquillo");

  // ── Trofeo (campeón) ──
  let newTrophy: Trophy | null = null;
  let trophies = c0.legacy.trophies;
  if (champion) {
    addTitle("campeon");
    if (c0.legacy.trophies.some((t) => t.season === season.season - 1)) addTitle("dinastia");
    newTrophy = { id: `trofeo-s${season.season}`, name: "Copa del Mundo", season: season.season, wonAt: now() };
    trophies = [...trophies, newTrophy];
    records.titlesWon += 1;
    // Hegemonía: dos y tres Mundiales acumulados (no necesariamente seguidos).
    if (records.titlesWon >= 2) addTitle("bicampeon");
    if (records.titlesWon >= 3) addTitle("tricampeon");
  }

  // ── Reputación ──
  // Crecimiento orgánico de táctica y carisma POR PARTIDO (antes quedaban casi
  // estancados): la táctica madura compitiendo —más en eliminatorias y al ganar—
  // y el carisma sube al ganar y caldear el ambiente.
  const tacticaGain = (outcome === "V" ? 2 : outcome === "E" ? 1 : 0) + (decisive ? 1 : 0);
  const carismaGain = outcome === "V" ? 2 : outcome === "E" ? 1 : 0;
  let repStats = {
    ...c0.reputation.stats,
    tactica: clamp(c0.reputation.stats.tactica + tacticaGain, 0, 100),
    carisma: clamp(c0.reputation.stats.carisma + carismaGain, 0, 100),
  };
  if (champion) {
    repStats = {
      ...repStats,
      prestigio: clamp(repStats.prestigio + 5, 0, 100),
      mediatico: clamp(repStats.mediatico + 5, 0, 100),
      carisma: clamp(repStats.carisma + 5, 0, 100),
    };
  }

  // ── Junta / federación (evaluación al cerrar la temporada) ──
  let board = c0.board;
  let boardVerdict: BoardVerdict | null = null;
  if (finished) {
    // Fase realmente alcanzada: campeón, o la ronda donde cayó (grupos si no pasó).
    const reached: TournamentStage = champion
      ? "campeon"
      : fx.stage === "grupos"
        ? "grupos"
        : fx.stage;
    const evalc = evaluateSeason(c0, reached);
    board = evalc.board;
    boardVerdict = evalc.verdict;
    morale = clamp(morale + evalc.moraleDelta, 0, 100);
    if (evalc.prestigioDelta) {
      repStats = { ...repStats, prestigio: clamp(repStats.prestigio + evalc.prestigioDelta, 0, 100) };
    }
  }

  // ── Narrativa (titular automático en partidos clave) ──
  let narrative = c0.narrative;
  const notable = isKnockoutStage(fx.stage) || champion || eliminated;
  if (notable) {
    const nationName = seleccion(c0.identity.nationSlug)?.nombre ?? "El equipo";
    const oppName = seleccion(fx.opponentSlug)?.nombre ?? fx.opponentSlug;
    let body: string;
    if (champion) {
      body = `¡CAMPEONES DEL MUNDO! ${nationName} vence a ${oppName} ${gf}-${ga} en la final y conquista la gloria eterna.`;
    } else if (failedQualifying) {
      body = `Fracaso histórico: ${nationName} no logra clasificar al Mundial. La fase de clasificación se cierra sin billete y el proyecto queda en el aire.`;
    } else if (eliminated) {
      body = `Adiós al sueño: ${nationName} cae ${gf}-${ga} ante ${oppName} y se despide del Mundial.`;
    } else {
      body = `${nationName} avanza: ${gf}-${ga} a ${oppName} y se mete en ${STAGE_LABEL[stage].toLowerCase()}.`;
    }
    const entry: NarrativeEntry = {
      id: `titular-s${season.season}-${idx}`,
      kind: "titular",
      body,
      createdAt: now(),
    };
    narrative = [entry, ...narrative];
  }

  // Titular de la federación al cerrar la temporada (presión/respaldo).
  if (boardVerdict) {
    const dtName = c0.identity.name.trim() || "el DT";
    let bbody: string;
    if (boardVerdict === "superado") {
      bbody = `La federación felicita a ${dtName}: superó las expectativas y refuerza su confianza en el proyecto.`;
    } else if (boardVerdict === "cumplido") {
      bbody = `La federación da el visto bueno a ${dtName}: objetivo cumplido y respaldo al banquillo.`;
    } else {
      bbody = board.confidence < 25
        ? `Crisis en la federación: ${dtName} no alcanzó el objetivo y su continuidad está en entredicho.`
        : `La federación lamenta no haber llegado a la meta. ${dtName} queda señalado y deberá responder.`;
    }
    narrative = [
      { id: `junta-s${season.season}`, kind: "evento", body: bbody, createdAt: now(), chosen: null },
      ...narrative,
    ];
  }

  // ── Lesiones del plantel ──
  // Tras el partido, los lesionados recuperan un partido (los ya sanos vuelven) y,
  // si el torneo sigue, se tira por una nueva baja para el próximo encuentro.
  let injuries = tickInjuries(activeInjuries(c0));
  if (!finished) {
    // El partido interactivo ya resolvió su propia lesión (con sustitución en
    // vivo); en ese caso se persiste esa baja y NO se tira por otra, para no
    // duplicar lesiones. La simulación rápida tira aquí su propia lesión.
    const newInj = opts?.injury ?? rollInjury(c0, injuries);
    if (newInj) {
      injuries = [...injuries, newInj];
      const nationName = seleccion(c0.identity.nationSlug)?.nombre ?? "La selección";
      const partidos = newInj.matchesOut === 1 ? "1 partido" : `${newInj.matchesOut} partidos`;
      narrative = [
        {
          id: `lesion-s${season.season}-${idx}`,
          kind: "evento",
          body: `Parte médico en ${nationName}: ${newInj.player} cae lesionado y será baja ${partidos}. El cuerpo técnico ya trabaja en su recambio.`,
          createdAt: now(),
          chosen: null,
        },
        ...narrative,
      ];
    }
  }

  // ── Sanciones por tarjetas ──
  // Las sanciones cumplen una fecha por partido jugado; si el torneo sigue, se
  // tira por una nueva (roja directa o acumulación de amarillas).
  let suspensions = tickSuspensions(activeSuspensions(c0));
  if (!finished) {
    const newSusp = rollSuspension(c0, suspensions);
    if (newSusp) {
      suspensions = [...suspensions, newSusp];
      const nationName = seleccion(c0.identity.nationSlug)?.nombre ?? "La selección";
      const fechas = newSusp.matchesOut === 1 ? "el próximo partido" : `los próximos ${newSusp.matchesOut} partidos`;
      const causa = newSusp.reason === "roja" ? "Tarjeta roja" : "Acumulación de amarillas";
      narrative = [
        {
          id: `sancion-s${season.season}-${idx}`,
          kind: "evento",
          body: `${causa} en ${nationName}: ${newSusp.player} queda sancionado y se pierde ${fechas}. Tocará rehacer la zona.`,
          createdAt: now(),
          chosen: null,
        },
        ...narrative,
      ];
    }
  }

  // ── Rueda de prensa post-partido (puede saltar según el resultado) ──
  // El contenido depende del marcador real; la decisión del DT impactará en la
  // moral del vestuario y en la confianza de la federación (vía applyDecision).
  const press = buildPressConference({
    outcome,
    gf,
    ga,
    stage: fx.stage,
    opponentName: seleccion(fx.opponentSlug)?.nombre ?? fx.opponentSlug,
    nationName: seleccion(c0.identity.nationSlug)?.nombre ?? "La selección",
    dtName: c0.identity.name.trim() || "el DT",
    champion,
    eliminated,
    season: season.season,
    matchIdx: idx,
  });
  if (press) narrative = [press, ...narrative];

  // ── Vida de vestuario (evento entre partidos) ──
  // Si el torneo sigue y NO saltó rueda de prensa este partido (para no encadenar
  // dos decisiones a la vez), puede surgir una situación de vestuario que el DT
  // resolverá vía applyDecision: impacta moral del grupo y reputación del DT.
  if (!finished && !press) {
    const vestuario = buildDressingRoomEvent({
      nationSlug: c0.identity.nationSlug,
      nationName: seleccion(c0.identity.nationSlug)?.nombre ?? "La selección",
      dtName: c0.identity.name.trim() || "el DT",
      morale,
      captain: c0.squad?.captain,
      season: season.season,
      matchIdx: idx,
    });
    if (vestuario) narrative = [vestuario, ...narrative];
  }

  // ── XP ──
  // Los amistosos reparten menos XP (son de preparación, no competición oficial).
  const friendly = fx.stage === "amistoso";
  const xpBase = (outcome === "V" ? 130 : outcome === "E" ? 60 : 35) + gf * 8 + (decisive ? 20 : 0);
  const xpGain = Math.round(xpBase * (friendly ? 0.5 : 1));

  const careerMid: CareerState = {
    ...c0,
    progression: { ...c0.progression, morale },
    missions,
    reputation: { ...c0.reputation, stats: repStats, total: sumReputation(repStats), rivalries, titles },
    narrative: narrative.slice(0, MAX_NARRATIVE),
    legacy: { trophies, records },
    board,
    // La concentración se consume al jugar: se actualiza la frescura para la
    // semana siguiente y se vacía el plan de sesiones elegido.
    squad: { ...c0.squad, injuries, suspensions, frescura: frescuraAfterMatch(c0), prep: null },
    season: { ...season, fixtures, cursor: idx + 1, stage, finished },
    updatedAt: now(),
  };

  const xpRes = grantXp(careerMid, xpGain);

  return {
    career: xpRes.state,
    match: playedMatch,
    leveledUp: xpRes.leveledUp,
    levelsGained: xpRes.levelsGained,
    newTrophy,
    newTitles,
    eliminated,
    champion,
    boardVerdict,
    boardConfidence: finished ? board.confidence : null,
    press,
  };
}
