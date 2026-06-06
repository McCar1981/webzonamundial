// src/lib/modo-carrera/store.ts
//
// Capa de datos en CLIENTE del Modo Carrera. Igual que el Fantasy: la partida
// vive en localStorage para el modo invitado y se normaliza al cargar para
// tolerar saves antiguos o corruptos. Al iniciar sesión, CareerGame sincroniza
// este estado con Supabase via /api/modo-carrera/save.

import type { CareerState, SeasonState, SeasonMatch, TournamentStage, MatchOutcome, BoardState, BoardDemand, BoardVerdict, StreakState, Mission, MissionKind, MissionStatus, Trophy, SquadState, Injury } from "./types";
import { CAREER_STORAGE_KEY, CAREER_SCHEMA_VERSION, xpRequired, TITLES } from "./constants";
import { sumReputation } from "./engine";

/** Partida vacía inicial (DT sin crear todavía). */
export function defaultCareer(): CareerState {
  const now = new Date().toISOString();
  return {
    version: CAREER_SCHEMA_VERSION,
    identity: {
      name: "",
      philosophy: null,
      nationSlug: null,
      avatarSeed: Math.floor(Math.random() * 1_000_000),
      createdAt: null,
    },
    progression: {
      overall: 50,
      xp: 0,
      xpToNext: xpRequired(50),
      morale: 70,
      season: 1,
    },
    skills: {
      levels: { ataque: 0, defensa: 0, mental: 0, gestion: 0 },
      points: 0,
    },
    missions: [],
    reputation: {
      total: 0,
      stats: { prestigio: 0, carisma: 0, tactica: 0, disciplina: 0, mediatico: 0, cantera: 0 },
      rivalries: [],
      titles: [],
    },
    narrative: [],
    legacy: {
      trophies: [],
      records: { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, titlesWon: 0 },
    },
    board: { objective: "octavos", confidence: 60, lastVerdict: "pendiente" },
    streak: { current: 0, best: 0, lastClaim: null },
    season: null,
    updatedAt: now,
  };
}

/** ¿El DT ya está creado? (tiene nombre, filosofía y nación). */
export function isCareerStarted(s: CareerState | null | undefined): boolean {
  return !!(s?.identity?.name && s.identity.philosophy && s.identity.nationSlug);
}

const clampInt = (n: unknown, lo: number, hi: number, fb: number): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fb;
  return Math.max(lo, Math.min(hi, v));
};

const STAGES: TournamentStage[] = ["grupos", "octavos", "cuartos", "semifinal", "final", "campeon", "eliminado"];
const OUTCOMES: MatchOutcome[] = ["V", "E", "D"];
const DEMANDS: BoardDemand[] = ["octavos", "cuartos", "semifinal", "final", "campeon"];
const VERDICTS: BoardVerdict[] = ["pendiente", "superado", "cumplido", "fallido"];
const MISSION_KINDS: MissionKind[] = ["diaria", "semanal", "torneo", "flash"];
const MISSION_STATUSES: MissionStatus[] = ["activa", "completada", "fallida", "reclamada"];
const VALID_TITLE_IDS = new Set(TITLES.map((t) => t.id));

// Topes legítimos de recompensa por misión (la plantilla más jugosa da 300 XP /
// 25 reputación; dejamos margen sin abrir la puerta a saves manipulados).
const MAX_MISSION_XP = 500;
const MAX_MISSION_REP = 50;

/** Valida una misión elemento a elemento; descarta basura y acota recompensas. */
function normalizeMission(raw: unknown): Mission | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<Mission>;
  if (typeof m.id !== "string" || !m.id) return null;
  if (!MISSION_KINDS.includes(m.kind as MissionKind)) return null;
  const target = clampInt(m.target, 1, 1000, 1);
  return {
    id: m.id.slice(0, 60),
    kind: m.kind as MissionKind,
    title: typeof m.title === "string" ? m.title.slice(0, 80) : "Misión",
    description: typeof m.description === "string" ? m.description.slice(0, 200) : "",
    progress: clampInt(m.progress, 0, target, 0),
    target,
    rewardXp: clampInt(m.rewardXp, 0, MAX_MISSION_XP, 0),
    rewardReputation: clampInt(m.rewardReputation, 0, MAX_MISSION_REP, 0),
    status: MISSION_STATUSES.includes(m.status as MissionStatus) ? (m.status as MissionStatus) : "activa",
    expiresAt: typeof m.expiresAt === "string" ? m.expiresAt : null,
  };
}

/** Valida un trofeo del legado; exige id con patrón trofeo-sN. */
function normalizeTrophy(raw: unknown): Trophy | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Trophy>;
  if (typeof t.id !== "string" || !/^trofeo-s\d+$/.test(t.id)) return null;
  return {
    id: t.id,
    name: typeof t.name === "string" ? t.name.slice(0, 80) : "Trofeo",
    season: clampInt(t.season, 1, 999, 1),
    wonAt: typeof t.wonAt === "string" ? t.wonAt : new Date().toISOString(),
  };
}

/** Repara/normaliza el estado de la junta; rellena con valores por defecto. */
function normalizeBoard(raw: unknown): BoardState {
  const b = (raw && typeof raw === "object" ? raw : {}) as Partial<BoardState>;
  return {
    objective: DEMANDS.includes(b.objective as BoardDemand) ? (b.objective as BoardDemand) : "octavos",
    confidence: clampInt(b.confidence, 0, 100, 60),
    lastVerdict: VERDICTS.includes(b.lastVerdict as BoardVerdict) ? (b.lastVerdict as BoardVerdict) : "pendiente",
  };
}

/** Repara/normaliza la racha diaria; rellena con valores por defecto. */
function normalizeStreak(raw: unknown): StreakState {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<StreakState>;
  return {
    current: clampInt(s.current, 0, 100000, 0),
    best: clampInt(s.best, 0, 100000, 0),
    lastClaim: typeof s.lastClaim === "string" ? s.lastClaim : null,
  };
}

const INJURY_POS = new Set(["FWD", "MID", "DEF", "GK"]);

/**
 * Valida el plantel (lesiones) de un save: descarta entradas basura, recorta el
 * nombre, exige una posición válida y acota los partidos de baja (1..3, el rango
 * legítimo del motor). Cap defensivo de 11 bajas para que un save manipulado no
 * pueda inflar la penalización de fuerza ni el tamaño del JSON.
 */
function normalizeSquad(raw: unknown): SquadState {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<SquadState>;
  const injuries: Injury[] = Array.isArray(s.injuries)
    ? (s.injuries as unknown[])
        .map((x) => (x && typeof x === "object" ? (x as Partial<Injury>) : null))
        .filter((i): i is Partial<Injury> => !!i && typeof i.player === "string" && i.player.length > 0)
        .map((i) => ({
          player: (i.player as string).slice(0, 60),
          pos: INJURY_POS.has(i.pos as string) ? (i.pos as string) : "MID",
          matchesOut: clampInt(i.matchesOut, 1, 3, 1),
        }))
        .slice(0, 11)
    : [];
  return { injuries };
}

/** Repara/normaliza la temporada en curso; devuelve null si el dato es inválido. */
function normalizeSeason(raw: unknown): SeasonState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<SeasonState>;
  if (!Array.isArray(s.fixtures)) return null;
  const fixtures: SeasonMatch[] = (s.fixtures as unknown[])
    .map((x) => (x && typeof x === "object" ? (x as Partial<SeasonMatch>) : null))
    .filter((m): m is Partial<SeasonMatch> => !!m && typeof m.opponentSlug === "string")
    .map((m) => ({
      id: typeof m.id === "string" ? m.id : `fx-${Math.random().toString(36).slice(2)}`,
      stage: STAGES.includes(m.stage as TournamentStage) ? (m.stage as TournamentStage) : "grupos",
      label: typeof m.label === "string" ? m.label : "Partido",
      opponentSlug: m.opponentSlug as string,
      home: m.home !== false,
      kickoffISO: typeof m.kickoffISO === "string" ? m.kickoffISO : null,
      played: m.played === true,
      gf: typeof m.gf === "number" ? clampInt(m.gf, 0, 99, 0) : null,
      ga: typeof m.ga === "number" ? clampInt(m.ga, 0, 99, 0) : null,
      outcome: OUTCOMES.includes(m.outcome as MatchOutcome) ? (m.outcome as MatchOutcome) : null,
    }));
  if (fixtures.length === 0) return null;
  return {
    season: clampInt(s.season, 1, 999, 1),
    fixtures,
    cursor: clampInt(s.cursor, 0, fixtures.length, 0),
    stage: STAGES.includes(s.stage as TournamentStage) ? (s.stage as TournamentStage) : "grupos",
    finished: s.finished === true,
    live: s.live === true,
  };
}

/**
 * Repara/normaliza un estado posiblemente parcial o de versión antigua para que
 * siempre cumpla la forma CareerState. Tolerante: rellena lo que falte desde el
 * default y acota los valores numéricos.
 */
export function normalizeCareer(raw: Partial<CareerState> | null | undefined): CareerState {
  const base = defaultCareer();
  if (!raw || typeof raw !== "object") return base;

  const id: Partial<CareerState["identity"]> = raw.identity ?? {};
  const pr: Partial<CareerState["progression"]> = raw.progression ?? {};
  const sk: Partial<CareerState["skills"]> = raw.skills ?? {};
  const rep: Partial<CareerState["reputation"]> = raw.reputation ?? {};
  const leg: Partial<CareerState["legacy"]> = raw.legacy ?? {};

  const overall = clampInt(pr.overall, 0, 99, base.progression.overall);

  // Stats de reputación acotados; el total NO se confía al cliente, se recalcula.
  const repStats = {
    prestigio: clampInt(rep.stats?.prestigio, 0, 100, 0),
    carisma: clampInt(rep.stats?.carisma, 0, 100, 0),
    tactica: clampInt(rep.stats?.tactica, 0, 100, 0),
    disciplina: clampInt(rep.stats?.disciplina, 0, 100, 0),
    mediatico: clampInt(rep.stats?.mediatico, 0, 100, 0),
    cantera: clampInt(rep.stats?.cantera, 0, 100, 0),
  };

  return {
    version: CAREER_SCHEMA_VERSION,
    identity: {
      name: typeof id.name === "string" ? id.name.slice(0, 40) : base.identity.name,
      philosophy: id.philosophy ?? base.identity.philosophy,
      nationSlug: id.nationSlug ?? base.identity.nationSlug,
      avatarSeed: clampInt(id.avatarSeed, 0, 1_000_000, base.identity.avatarSeed),
      createdAt: id.createdAt ?? base.identity.createdAt,
    },
    progression: {
      overall,
      xp: clampInt(pr.xp, 0, 1_000_000, 0),
      xpToNext: clampInt(pr.xpToNext, 1, 1_000_000, xpRequired(overall)),
      morale: clampInt(pr.morale, 0, 100, base.progression.morale),
      season: clampInt(pr.season, 1, 999, 1),
    },
    skills: {
      levels: {
        ataque: clampInt(sk.levels?.ataque, 0, 5, 0),
        defensa: clampInt(sk.levels?.defensa, 0, 5, 0),
        mental: clampInt(sk.levels?.mental, 0, 5, 0),
        gestion: clampInt(sk.levels?.gestion, 0, 5, 0),
      },
      // Tope legítimo de puntos sin gastar = 99 - overall (no se pueden acumular
      // más puntos de los que el progreso permitiría haber ganado).
      points: clampInt(sk.points, 0, Math.max(0, 99 - overall), 0),
    },
    missions: Array.isArray(raw.missions)
      ? raw.missions.map(normalizeMission).filter((m): m is Mission => m !== null).slice(0, 50)
      : [],
    reputation: {
      total: sumReputation(repStats),
      stats: repStats,
      rivalries: Array.isArray(rep.rivalries) ? rep.rivalries : [],
      titles: Array.isArray(rep.titles)
        ? rep.titles.filter((t): t is string => typeof t === "string" && VALID_TITLE_IDS.has(t))
        : [],
    },
    narrative: Array.isArray(raw.narrative) ? raw.narrative.slice(0, 50) : [],
    legacy: {
      trophies: Array.isArray(leg.trophies)
        ? leg.trophies.map(normalizeTrophy).filter((t): t is Trophy => t !== null).slice(0, 200)
        : [],
      records: {
        matchesPlayed: clampInt(leg.records?.matchesPlayed, 0, 1_000_000, 0),
        wins: clampInt(leg.records?.wins, 0, 1_000_000, 0),
        draws: clampInt(leg.records?.draws, 0, 1_000_000, 0),
        losses: clampInt(leg.records?.losses, 0, 1_000_000, 0),
        goalsFor: clampInt(leg.records?.goalsFor, 0, 1_000_000, 0),
        goalsAgainst: clampInt(leg.records?.goalsAgainst, 0, 1_000_000, 0),
        titlesWon: clampInt(leg.records?.titlesWon, 0, 1_000_000, 0),
      },
    },
    board: normalizeBoard(raw.board),
    streak: normalizeStreak(raw.streak),
    season: normalizeSeason(raw.season),
    squad: normalizeSquad(raw.squad),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
  };
}

// ─── localStorage (modo invitado) ────────────────────────────────────────────
export function loadCareer(): CareerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return null;
    return normalizeCareer(JSON.parse(raw) as Partial<CareerState>);
  } catch {
    return null;
  }
}

export function saveCareer(state: CareerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* cuota llena o modo privado: degrada silenciosamente */
  }
}
