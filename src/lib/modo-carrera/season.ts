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
} from "./types";
import { grantXp, sumReputation } from "./engine";
import { missionKey } from "./missions";
import { buildBoardObjective, evaluateSeason } from "./board";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";

const now = () => new Date().toISOString();
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ─── Etiquetas de fase ───────────────────────────────────────────────────────
export const STAGE_LABEL: Record<TournamentStage, string> = {
  grupos: "Fase de grupos",
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semifinal: "Semifinal",
  final: "Final",
  campeon: "Campeón del Mundo",
  eliminado: "Eliminado",
};

const KO_ORDER: TournamentStage[] = ["octavos", "cuartos", "semifinal", "final"];

function nextKnockout(stage: TournamentStage): TournamentStage {
  const i = KO_ORDER.indexOf(stage);
  return i >= 0 && i < KO_ORDER.length - 1 ? KO_ORDER[i + 1] : "campeon";
}

function seleccion(slug: string | null | undefined): Seleccion | undefined {
  return SELECCIONES.find((s) => s.slug === slug);
}

// ─── Fuerzas (DT vs rival) ───────────────────────────────────────────────────
/** Fuerza base del DT a partir de overall + árbol de habilidades + moral. */
function dtStrength(c: CareerState): number {
  const base = c.progression.overall; // 50..99
  const s = c.skills.levels;
  const skill = (s.ataque + s.defensa) * 1.4 + (s.mental + s.gestion) * 1.0; // 0..~24
  const moraleAdj = (c.progression.morale - 70) * 0.15; // -10.5..+4.5
  return base + skill + moraleAdj;
}

/** Potencial ofensivo/defensivo según filosofía y ramas del árbol. */
function attackDefense(c: CareerState): { atk: number; def: number } {
  const str = dtStrength(c);
  const s = c.skills.levels;
  let atk = str + s.ataque * 1.5;
  let def = str + s.defensa * 1.5;
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
  return { atk, def };
}

/** Fuerza del rival a partir de su ranking FIFA (menor ranking → más fuerte). */
function opponentStrength(slug: string): number {
  const rank = seleccion(slug)?.rankingFIFA ?? 60;
  return clamp(92 - (rank - 1) * 0.42, 48, 94);
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
/** Muestreo de Poisson (algoritmo de Knuth) para los goles. */
function poisson(lambda: number): number {
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
 * Simula el marcador del partido. En eliminatoria (`decisive`) no hay empates: si
 * el tiempo reglamentario acaba igualado, se resuelve por prórroga/penaltis a
 * favor de quien tenga más fuerza + un componente de azar.
 */
function simulate(c: CareerState, match: SeasonMatch, decisive: boolean): { gf: number; ga: number } {
  const { atk, def } = attackDefense(c);
  const oStr = opponentStrength(match.opponentSlug);
  const home = match.home ? 2.5 : 0;
  const mom = formMomentum(c); // -3..+3
  const lamFor = clamp(1.35 + (atk + home - oStr) / 9 + mom * 0.12, 0.25, 4.6);
  const lamAg = clamp(1.35 + (oStr - def) / 9 - mom * 0.09, 0.2, 4.4);
  let gf = poisson(lamFor);
  let ga = poisson(lamAg);
  if (decisive && gf === ga) {
    const mine = atk + home + Math.random() * 10;
    const theirs = oStr + Math.random() * 10;
    if (mine >= theirs) gf++;
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

  // Rivales de grupo (mismos del grupo real; se completa al azar si faltan).
  const grp: string[] = [];
  for (const s of SELECCIONES) {
    if (grp.length >= 3) break;
    if (s.slug !== self && s.grupo === myGroup && !used.has(s.slug)) {
      grp.push(s.slug);
      used.add(s.slug);
    }
  }
  while (grp.length < 3 && all.length) {
    const r = all[Math.floor(Math.random() * all.length)];
    if (!used.has(r.slug)) {
      grp.push(r.slug);
      used.add(r.slug);
    }
  }

  // Rivales de eliminatoria: dificultad creciente desde el top del ranking.
  const ranked = [...all].sort((a, b) => (a.rankingFIFA ?? 99) - (b.rankingFIFA ?? 99));
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
  grp.forEach((o, i) => fixtures.push(mk("grupos", `Fase de grupos · J${i + 1}`, o, i !== 1)));
  fixtures.push(mk("octavos", "Octavos de final", pickFrom(ranked.slice(0, 40)), true));
  fixtures.push(mk("cuartos", "Cuartos de final", pickFrom(ranked.slice(0, 24)), false));
  fixtures.push(mk("semifinal", "Semifinal", pickFrom(ranked.slice(0, 12)), true));
  fixtures.push(mk("final", "Final", pickFrom(ranked.slice(0, 6)), false));

  return { season, fixtures, cursor: 0, stage: "grupos", finished: false };
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
}

function advanceMissionInline(m: Mission): Mission {
  const progress = Math.min(m.target, m.progress + 1);
  return { ...m, progress, status: progress >= m.target ? "completada" : m.status };
}

/**
 * Simula el siguiente partido del calendario y aplica el resultado a todos los
 * pilares. Si no hay temporada activa o el torneo terminó, devuelve el estado sin
 * cambios.
 */
export function playNextMatch(c0: CareerState): PlayResult {
  const empty: PlayResult = {
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
  };

  const season = c0.season;
  if (!season || season.finished || season.cursor >= season.fixtures.length) return empty;

  const idx = season.cursor;
  const fx = season.fixtures[idx];
  if (fx.played) return empty;

  // Temporada en Vivo: el partido no se puede disputar hasta la hora real del
  // saque. Si aún no ha llegado, no pasa nada (la UI muestra la cuenta atrás).
  if (season.live && fx.kickoffISO) {
    const k = Date.parse(fx.kickoffISO);
    if (Number.isFinite(k) && k > Date.now()) return empty;
  }

  const decisive = fx.stage !== "grupos";
  const { gf, ga } = simulate(c0, fx, decisive);
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
  let morale = clamp(c0.progression.morale + (outcome === "V" ? 6 : outcome === "E" ? 1 : -8), 0, 100);

  // ── Transición de fase ──
  let stage: TournamentStage = season.stage;
  let finished = false;
  let champion = false;
  let eliminated = false;

  if (fx.stage === "grupos") {
    const groupMatches = fixtures.filter((m) => m.stage === "grupos");
    const groupDone = groupMatches.every((m) => m.played);
    if (groupDone) {
      const pts = groupMatches.reduce(
        (a, m) => a + (m.outcome === "V" ? 3 : m.outcome === "E" ? 1 : 0),
        0,
      );
      if (pts >= 4) {
        stage = "octavos"; // clasifica a la siguiente ronda
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
  if (fx.stage !== "grupos") {
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

  // ── Trofeo (campeón) ──
  let newTrophy: Trophy | null = null;
  let trophies = c0.legacy.trophies;
  if (champion) {
    addTitle("campeon");
    if (c0.legacy.trophies.some((t) => t.season === season.season - 1)) addTitle("dinastia");
    newTrophy = { id: `trofeo-s${season.season}`, name: "Copa del Mundo", season: season.season, wonAt: now() };
    trophies = [...trophies, newTrophy];
    records.titlesWon += 1;
  }

  // ── Reputación (bonus al campeón) ──
  let repStats = champion
    ? {
        ...c0.reputation.stats,
        prestigio: clamp(c0.reputation.stats.prestigio + 5, 0, 100),
        mediatico: clamp(c0.reputation.stats.mediatico + 5, 0, 100),
        carisma: clamp(c0.reputation.stats.carisma + 5, 0, 100),
      }
    : c0.reputation.stats;

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
  const notable = fx.stage !== "grupos" || champion || eliminated;
  if (notable) {
    const nationName = seleccion(c0.identity.nationSlug)?.nombre ?? "El equipo";
    const oppName = seleccion(fx.opponentSlug)?.nombre ?? fx.opponentSlug;
    let body: string;
    if (champion) {
      body = `¡CAMPEONES DEL MUNDO! ${nationName} vence a ${oppName} ${gf}-${ga} en la final y conquista la gloria eterna.`;
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

  // ── XP ──
  const xpGain = (outcome === "V" ? 130 : outcome === "E" ? 60 : 35) + gf * 8 + (decisive ? 20 : 0);

  const careerMid: CareerState = {
    ...c0,
    progression: { ...c0.progression, morale },
    missions,
    reputation: { ...c0.reputation, stats: repStats, total: sumReputation(repStats), rivalries, titles },
    narrative,
    legacy: { trophies, records },
    board,
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
  };
}
