// src/lib/modo-carrera/store.ts
//
// Capa de datos en CLIENTE del Modo Carrera. Igual que el Fantasy: la partida
// vive en localStorage para el modo invitado y se normaliza al cargar para
// tolerar saves antiguos o corruptos. Al iniciar sesión, CareerGame sincroniza
// este estado con Supabase via /api/modo-carrera/save.

import type { CareerState } from "./types";
import { CAREER_STORAGE_KEY, CAREER_SCHEMA_VERSION, xpRequired } from "./constants";

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
      points: clampInt(sk.points, 0, 999, 0),
    },
    missions: Array.isArray(raw.missions) ? raw.missions : [],
    reputation: {
      total: clampInt(rep.total, 0, 1_000_000, 0),
      stats: {
        prestigio: clampInt(rep.stats?.prestigio, 0, 100, 0),
        carisma: clampInt(rep.stats?.carisma, 0, 100, 0),
        tactica: clampInt(rep.stats?.tactica, 0, 100, 0),
        disciplina: clampInt(rep.stats?.disciplina, 0, 100, 0),
        mediatico: clampInt(rep.stats?.mediatico, 0, 100, 0),
        cantera: clampInt(rep.stats?.cantera, 0, 100, 0),
      },
      rivalries: Array.isArray(rep.rivalries) ? rep.rivalries : [],
      titles: Array.isArray(rep.titles) ? rep.titles : [],
    },
    narrative: Array.isArray(raw.narrative) ? raw.narrative : [],
    legacy: {
      trophies: Array.isArray(leg.trophies) ? leg.trophies : [],
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
