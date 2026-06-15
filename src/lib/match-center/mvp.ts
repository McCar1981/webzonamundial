// src/lib/match-center/mvp.ts
//
// "Jugador del partido": el mejor por NOTA REAL de api-football (/fixtures/players,
// campo games.rating) más el mejor de cada selección. Datos 100% reales: si la
// API aún no publicó notas (partido por comenzar, o no hay cobertura) devolvemos
// null y la UI no pinta nada. El lado (local/visitante) se deduce cruzando el
// nombre contra la alineación que YA tenemos cacheada → cero llamadas extra.
//
// Coste: 1 request a /fixtures/players como mucho cada TTL (120s en vivo, 6h al
// terminar) gracias a la caché KV; además caché negativa corta para no martillear
// la API mientras un partido en juego todavía no tiene notas.

import { kv } from "@/lib/kv";
import { getFixtureId, getLastSnapshot } from "./store";
import { fetchPlayerRatings } from "./apiFootball";
import type { LiveSnapshot, Side, TeamLineup } from "./types";

const MVP_PREFIX = "mc:mvp:v1:";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

export interface MvpPlayer {
  name: string;
  rating: number;
  side: Side | null;
  num: number | null;
  pos: string | null;
}

export interface MatchMvp {
  /** Jugador del partido: mejor nota global. */
  mvp: MvpPlayer;
  /** Mejor nota del local / visitante (puede coincidir con `mvp`). */
  home: MvpPlayer | null;
  away: MvpPlayer | null;
  /** Estado del partido al calcular (para distinguir "en vivo" de "final"). */
  status: string;
}

/** Marca de "calculado y sin notas" para caché negativa. */
type Empty = { empty: true };

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // quita acentos/diacríticos tras descomponer
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Classified {
  side: Side;
  num: number | null;
  pos: string | null;
}

/**
 * Clasificador nombre→{lado, dorsal, posición} a partir de las alineaciones
 * (titulares + suplentes) del snapshot. Empareja por nombre completo normalizado
 * y, si falla, por apellido SIEMPRE QUE sea único entre los 22+ jugadores (evita
 * asignar mal a dos "García").
 */
function buildClassifier(snap: LiveSnapshot): (name: string) => Classified | null {
  const full = new Map<string, Classified>();
  const surnameCount = new Map<string, number>();
  const surname = new Map<string, Classified>();

  const add = (side: Side, lineup: TeamLineup | null) => {
    if (!lineup) return;
    const players = [...lineup.starters, ...(lineup.substitutes ?? [])];
    for (const p of players) {
      if (!p.name) continue;
      const n = norm(p.name);
      if (!n) continue;
      const info: Classified = { side, num: p.num ?? null, pos: p.pos ?? null };
      if (!full.has(n)) full.set(n, info);
      const last = n.split(" ").slice(-1)[0];
      if (last) {
        surnameCount.set(last, (surnameCount.get(last) ?? 0) + 1);
        if (!surname.has(last)) surname.set(last, info);
      }
    }
  };
  add("home", snap.homeLineup);
  add("away", snap.awayLineup);

  return (name: string): Classified | null => {
    const n = norm(name);
    if (!n) return null;
    const f = full.get(n);
    if (f) return f;
    const last = n.split(" ").slice(-1)[0];
    if (last && surnameCount.get(last) === 1) return surname.get(last) ?? null;
    return null;
  };
}

/**
 * Jugador del partido con notas reales. Devuelve null si todavía no hay notas
 * (no jugado / sin cobertura) o si KV/API no responden (fail-soft).
 */
export async function getMatchMvp(matchId: number): Promise<MatchMvp | null> {
  const key = `${MVP_PREFIX}${matchId}`;

  try {
    const cached = await kv.get<MatchMvp | Empty>(key);
    if (cached) return "empty" in cached ? null : cached;
  } catch {
    /* sigue sin caché */
  }

  const snap = await getLastSnapshot(matchId);
  if (!snap) return null;
  // No hay notas antes de jugar: solo tiene sentido en juego o finalizado.
  if (!IN_PLAY.has(snap.status) && !FINISHED.has(snap.status)) return null;

  const fixtureId = await getFixtureId(matchId);
  if (!fixtureId) return null;

  const ratings = await fetchPlayerRatings(fixtureId);

  if (ratings.length === 0) {
    // Caché negativa corta: el partido juega pero aún sin notas. Evita repetir
    // la llamada a la API en cada visita.
    try {
      await kv.set(key, { empty: true } as Empty, { ex: 90 });
    } catch {
      /* no-op */
    }
    return null;
  }

  const classify = buildClassifier(snap);
  const enriched: MvpPlayer[] = ratings
    .map((r) => {
      const c = classify(r.name);
      return {
        name: r.name,
        rating: Math.round(r.rating * 10) / 10,
        side: c?.side ?? null,
        num: c?.num ?? null,
        pos: c?.pos ?? null,
      };
    })
    .sort((a, b) => b.rating - a.rating);

  const result: MatchMvp = {
    mvp: enriched[0],
    home: enriched.find((p) => p.side === "home") ?? null,
    away: enriched.find((p) => p.side === "away") ?? null,
    status: snap.status,
  };

  try {
    const ttl = FINISHED.has(snap.status) ? 21600 : 120;
    await kv.set(key, result, { ex: ttl });
  } catch {
    /* no-op */
  }

  return result;
}
