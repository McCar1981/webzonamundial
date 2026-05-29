// src/lib/fantasy/players.ts
//
// Generación DETERMINISTA del pool de jugadores del Fantasy a partir de las 48
// selecciones reales. Las estrellas reales (jugadoresClave de cada selección)
// se insertan como los jugadores más valiosos de su posición; el resto de la
// plantilla se completa con jugadores simulados de forma estable (misma semilla
// => mismos datos siempre). Calcula también el multiplicador "Modo Underdog"
// (Estelar/Oro/Diamante) del próximo partido de cada selección.

import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { getExtendedSeleccion } from "@/data/selecciones-extended";
import type { FantasyPlayer, FantasyPos, MatchTier, NextMatch } from "./types";

// ---- RNG determinista ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Mateo", "Luca", "Adam", "Noah", "Hugo", "Liam", "Ethan", "Diego", "Iván", "Marc",
  "Youssef", "Kai", "Leo", "Nico", "Aaron", "Omar", "Felix", "Bruno", "Theo", "Aziz",
  "Mohamed", "Daniel", "Samuel", "Jonas", "Pavel", "Tariq", "Eric", "Andrés", "Ola", "Kenji",
  "Viktor", "Ali", "Sven", "Mati", "Rafa", "Luan", "Sami", "Dário", "Koji", "Bilal",
];
const LAST = [
  "Silva", "Kovač", "Hansen", "Müller", "Rossi", "Nguyen", "Okafor", "Torres", "Lindqvist", "Haidar",
  "Petrov", "Vargas", "Schmidt", "Adeyemi", "Costa", "Yilmaz", "Berg", "Moreau", "Tanaka", "Bauer",
  "Novak", "Marín", "Diallo", "Andersen", "Suzuki", "Romano", "Fernández", "Khan", "Larsson", "Mensah",
  "Reyes", "Janssen", "Sørensen", "Ferreira", "Beqiri", "Ortega", "Walsh", "Kone", "Park", "Castillo",
];

function genName(rng: () => number): string {
  return `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
}

function teamColor(slug: string): string {
  const h = hashStr(slug) % 360;
  return `hsl(${h} 62% 52%)`;
}

/** 0.30 (modesta) .. 0.99 (potencia) según ranking FIFA. */
function strengthFromRank(rank: number | undefined): number {
  const r = rank ?? 90;
  return Math.max(0.3, Math.min(0.99, 1 - (r - 1) / 150));
}

const POS_MAP: Record<string, FantasyPos> = { POR: "GK", DEF: "DEF", MED: "MID", DEL: "FWD" };
const GROUP_SIZE: Record<FantasyPos, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const POS_PREMIUM: Record<FantasyPos, number> = { GK: -0.4, DEF: 0, MID: 0.8, FWD: 1.6 };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---- Multiplicador "Modo Underdog" ----
function tierFromGap(gap: number): MatchTier {
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante", emoji: "💎", color: "#67e8f9" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro", emoji: "🟡", color: "#fbbf24" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce", emoji: "🟠", color: "#fb923c" };
  return { multiplier: 1.0, label: "Estelar", emoji: "🟢", color: "#4ade80" };
}

/** Empareja selecciones dentro de su grupo para fijar el "próximo partido". */
function buildNextMatches(): Record<string, NextMatch> {
  const byGroup: Record<string, Seleccion[]> = {};
  for (const s of SELECCIONES) (byGroup[s.grupo] ||= []).push(s);
  const out: Record<string, NextMatch> = {};
  for (const list of Object.values(byGroup)) {
    for (let i = 0; i + 1 < list.length; i += 2) {
      const a = list[i];
      const b = list[i + 1];
      const gap = Math.abs((a.rankingFIFA ?? 90) - (b.rankingFIFA ?? 90));
      const tier = tierFromGap(gap);
      const diff = (me: Seleccion, op: Seleccion): NextMatch["difficulty"] => {
        const d = (op.rankingFIFA ?? 90) - (me.rankingFIFA ?? 90);
        return d < -12 ? "hard" : d > 12 ? "easy" : "medium";
      };
      out[a.slug] = { opponentCode: b.flagCode, opponentName: b.nombre, tier, difficulty: diff(a, b) };
      out[b.slug] = { opponentCode: a.flagCode, opponentName: a.nombre, tier, difficulty: diff(b, a) };
    }
  }
  return out;
}

function buildTeamPlayers(team: Seleccion, next: NextMatch): FantasyPlayer[] {
  const rng = mulberry32(hashStr(team.slug));
  const strength = strengthFromRank(team.rankingFIFA);
  const color = teamColor(team.slug);

  // Estrellas reales agrupadas por posición fantasy.
  const ext = getExtendedSeleccion(team.slug);
  const realByPos: Record<FantasyPos, { name: string }[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const j of ext?.jugadoresClave ?? []) {
    const p = POS_MAP[j.posicion];
    if (p) realByPos[p].push({ name: j.nombre });
  }

  const players: FantasyPlayer[] = [];
  (Object.keys(GROUP_SIZE) as FantasyPos[]).forEach((pos) => {
    const size = GROUP_SIZE[pos];
    const reals = realByPos[pos];
    for (let i = 0; i < size; i++) {
      const isReal = i < reals.length;
      const name = isReal ? reals[i].name : genName(rng);
      // "topness": 1 para el mejor del grupo, baja hacia 0.
      const topness = 1 - i / size;
      const rating = clamp(strength * 0.65 + topness * 0.3 + (rng() - 0.5) * 0.12, 0.05, 1);

      const price = round1(
        clamp(
          4 + strength * 5.5 + POS_PREMIUM[pos] + topness * 2.4 + (isReal ? 2.6 : 0) + (rng() - 0.4) * 1.4,
          3.8,
          14.5,
        ),
      );
      const totalPoints = Math.round(rating * 58 + rng() * 16);
      const goals = pos === "FWD" ? Math.round(rating * 5 + rng() * 2) : pos === "MID" ? Math.round(rating * 3 + rng()) : Math.round(rng() * (pos === "DEF" ? 1 : 0));
      const assists = Math.round(rating * (pos === "MID" ? 4 : pos === "FWD" ? 2 : 1) + rng());
      const cleanSheets = pos === "GK" || pos === "DEF" ? Math.round(rating * 2 + rng()) : 0;

      players.push({
        id: `${team.slug}-${pos}-${i}`,
        name,
        teamSlug: team.slug,
        teamName: team.nombre,
        flag: team.flagCode,
        color,
        pos,
        price,
        totalPoints,
        avgPoints: round1(totalPoints / 3),
        form: round1(clamp(rating * 8 + (rng() - 0.4) * 3, 1, 10)),
        ownership: round1(clamp((price / 15) * 38 + rating * 14 + (rng() - 0.5) * 12, 0.4, 88)),
        available: isReal ? rng() > 0.04 : rng() > 0.1,
        real: isReal,
        stats: { goals, assists, minutes: 180 + Math.round(rng() * 90), cleanSheets },
        next,
      });
    }
  });
  return players;
}

let _pool: FantasyPlayer[] | null = null;
let _byId: Map<string, FantasyPlayer> | null = null;

export function getPlayerPool(): FantasyPlayer[] {
  if (_pool) return _pool;
  const next = buildNextMatches();
  const all: FantasyPlayer[] = [];
  for (const team of SELECCIONES) {
    const nm = next[team.slug] ?? {
      opponentCode: "un",
      opponentName: "Por definir",
      tier: tierFromGap(0),
      difficulty: "medium" as const,
    };
    all.push(...buildTeamPlayers(team, nm));
  }
  _pool = all;
  _byId = new Map(all.map((p) => [p.id, p]));
  return all;
}

export function getPlayerById(id: string): FantasyPlayer | undefined {
  if (!_byId) getPlayerPool();
  return _byId!.get(id);
}

export function getPlayersByIds(ids: (string | null)[]): (FantasyPlayer | null)[] {
  return ids.map((id) => (id ? getPlayerById(id) ?? null : null));
}
