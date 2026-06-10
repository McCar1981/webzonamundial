// src/lib/modo-carrera/store.ts
//
// Capa de datos en CLIENTE del Modo Carrera. Igual que el Fantasy: la partida
// vive en localStorage para el modo invitado y se normaliza al cargar para
// tolerar saves antiguos o corruptos. Al iniciar sesión, CareerGame sincroniza
// este estado con Supabase via /api/modo-carrera/save.

import type { CareerState, SeasonState, SeasonMatch, TournamentStage, MatchOutcome, BoardState, BoardDemand, BoardVerdict, StreakState, Mission, MissionKind, MissionStatus, Trophy, SquadState, Injury, Suspension, SuspensionReason, PrepPlan, Rivalry, NarrativeEntry, NarrativeKind, Philosophy } from "./types";
import { NARRATIVE_KINDS } from "./types";
import { CAREER_STORAGE_KEY, CAREER_SCHEMA_VERSION, xpRequired, cumulativeXpForOverall, TITLES, PHILOSOPHIES } from "./constants";
import { sumReputation } from "./engine";
import { SELECCIONES } from "@/data/selecciones";

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
      xpTotal: 0,
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

const STAGES: TournamentStage[] = ["amistoso", "clasificacion", "grupos", "octavos", "cuartos", "semifinal", "final", "campeon", "eliminado"];
const OUTCOMES: MatchOutcome[] = ["V", "E", "D"];
const DEMANDS: BoardDemand[] = ["octavos", "cuartos", "semifinal", "final", "campeon"];
const VERDICTS: BoardVerdict[] = ["pendiente", "superado", "cumplido", "fallido"];
const MISSION_KINDS: MissionKind[] = ["diaria", "semanal", "torneo", "flash"];
const MISSION_STATUSES: MissionStatus[] = ["activa", "completada", "fallida", "reclamada"];
const VALID_TITLE_IDS = new Set(TITLES.map((t) => t.id));
// Identidad contra catálogo: una filosofía o selección inventadas por un save
// manipulado no deben entrar al estado (acababan en BD vía /save y en la columna
// nation_slug del ranking). Inválido → null = el DT vuelve al onboarding.
const VALID_PHILOSOPHIES = new Set<Philosophy>(PHILOSOPHIES.map((p) => p.id));
const VALID_NATION_SLUGS = new Set(SELECCIONES.map((s) => s.slug));

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

const NARRATIVE_KIND_SET = new Set<NarrativeKind>(NARRATIVE_KINDS);

/**
 * Valida una rivalidad elemento a elemento. Antes se volcaba el array del cliente
 * tal cual (Array.isArray sin más): permitía inyectar objetos arbitrarios que se
 * persistían en BD y se reenviaban. Acota campos y descarta basura.
 */
function normalizeRivalry(raw: unknown): Rivalry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Rivalry>;
  if (typeof r.rival !== "string" || !r.rival) return null;
  return {
    rival: r.rival.slice(0, 60),
    intensity: clampInt(r.intensity, 0, 100, 0),
    wins: clampInt(r.wins, 0, 1_000_000, 0),
    losses: clampInt(r.losses, 0, 1_000_000, 0),
  };
}

/**
 * Valida una entrada de narrativa. Era la ÚNICA colección persistida sin sanear:
 * el cliente podía inyectar `kind`/`choices`/`body` arbitrarios (texto sin tope)
 * que acababan en BD y se re-servían. Acota el texto y valida la forma.
 */
function normalizeNarrativeEntry(raw: unknown): NarrativeEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Partial<NarrativeEntry>;
  if (typeof n.id !== "string" || !n.id) return null;
  if (!NARRATIVE_KIND_SET.has(n.kind as NarrativeKind)) return null;
  const choices = Array.isArray(n.choices)
    ? n.choices
        .filter((c): c is { id: string; label: string; effect: string } => !!c && typeof c === "object" && typeof (c as { id?: unknown }).id === "string")
        .slice(0, 4)
        .map((c) => ({ id: c.id.slice(0, 40), label: String(c.label ?? "").slice(0, 120), effect: String(c.effect ?? "").slice(0, 120) }))
    : undefined;
  return {
    id: n.id.slice(0, 80),
    kind: n.kind as NarrativeKind,
    body: typeof n.body === "string" ? n.body.slice(0, 600) : "",
    createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date().toISOString(),
    ...(choices && choices.length ? { choices } : {}),
    chosen: typeof n.chosen === "string" ? n.chosen.slice(0, 40) : null,
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
const SUSPENSION_REASONS = new Set<SuspensionReason>(["roja", "amarillas"]);

/**
 * Valida el plantel (lesiones, sanciones, capitán) de un save: descarta entradas
 * basura, recorta el nombre, exige una posición válida y acota las fechas de baja
 * (1..3, el rango legítimo del motor). Cap defensivo de 11 bajas por tipo para que
 * un save manipulado no pueda inflar la penalización de fuerza ni el tamaño del JSON.
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
  const suspensions: Suspension[] = Array.isArray(s.suspensions)
    ? (s.suspensions as unknown[])
        .map((x) => (x && typeof x === "object" ? (x as Partial<Suspension>) : null))
        .filter((i): i is Partial<Suspension> => !!i && typeof i.player === "string" && i.player.length > 0)
        .map((i) => ({
          player: (i.player as string).slice(0, 60),
          pos: INJURY_POS.has(i.pos as string) ? (i.pos as string) : "MID",
          matchesOut: clampInt(i.matchesOut, 1, 2, 1),
          reason: SUSPENSION_REASONS.has(i.reason as SuspensionReason) ? (i.reason as SuspensionReason) : "amarillas",
        }))
        .slice(0, 11)
    : [];
  const captain = typeof s.captain === "string" && s.captain.length > 0 ? s.captain.slice(0, 60) : null;
  const out: SquadState = { injuries, suspensions, captain };
  // Dibujo táctico, once y plan de concentración elegidos por el DT: se conservan
  // para que recargar la página (o sincronizar con Supabase) no borre la alineación
  // ni reinicie la frescura/concentración trabajadas.
  if (typeof s.formation === "string" && s.formation.length > 0) out.formation = s.formation.slice(0, 12);
  if (Array.isArray(s.lineup)) {
    out.lineup = (s.lineup as unknown[])
      .filter((p): p is string => typeof p === "string" && p.length > 0)
      .map((p) => p.slice(0, 60))
      .slice(0, 11);
  }
  if (typeof s.frescura === "number" && Number.isFinite(s.frescura)) out.frescura = clampInt(s.frescura, 0, 100, 75);
  if (s.prep && typeof s.prep === "object" && Array.isArray((s.prep as PrepPlan).sessions)) {
    out.prep = {
      sessions: ((s.prep as PrepPlan).sessions as unknown[])
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .map((x) => x.slice(0, 20))
        .slice(0, 3),
    };
  }
  return out;
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
  const xpResidual = clampInt(pr.xp, 0, 1_000_000, 0);

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
      philosophy: VALID_PHILOSOPHIES.has(id.philosophy as Philosophy) ? (id.philosophy as Philosophy) : null,
      nationSlug: typeof id.nationSlug === "string" && VALID_NATION_SLUGS.has(id.nationSlug) ? id.nationSlug : null,
      avatarSeed: clampInt(id.avatarSeed, 0, 1_000_000, base.identity.avatarSeed),
      createdAt: id.createdAt ?? base.identity.createdAt,
    },
    progression: {
      overall,
      xp: xpResidual,
      // xpToNext es un valor DERIVADO del overall: lo recalculamos siempre con la
      // curva vigente en vez de confiar en el guardado, para que las partidas
      // antiguas adopten la curva nueva (antes quedaban ancladas a 2250).
      xpToNext: xpRequired(overall),
      // xpTotal (XP de toda la carrera): si el save es antiguo y no lo trae, se
      // reconstruye desde overall + xp residual para que el overall del ranking
      // que el servidor deriva de aquí coincida con el real.
      xpTotal: clampInt(pr.xpTotal, 0, 100_000_000, cumulativeXpForOverall(overall) + xpResidual),
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
      rivalries: Array.isArray(rep.rivalries)
        ? rep.rivalries.map(normalizeRivalry).filter((r): r is Rivalry => r !== null).slice(0, 50)
        : [],
      titles: Array.isArray(rep.titles)
        ? rep.titles.filter((t): t is string => typeof t === "string" && VALID_TITLE_IDS.has(t))
        : [],
    },
    narrative: Array.isArray(raw.narrative)
      ? raw.narrative.map(normalizeNarrativeEntry).filter((n): n is NarrativeEntry => n !== null).slice(0, 50)
      : [],
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
