// src/lib/trivia/store.ts
//
// Persistencia de la Trivia. Mismo patrón que noticias-store:
//  - Producción: Vercel KV (Redis). Persiste entre deploys e invocaciones.
//  - Dev local: fichero JSON en data/trivia-store.json.
// El backend se autodetecta por KV_REST_API_URL + KV_REST_API_TOKEN.

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";
import type {
  DailyTriviaSet,
  LeaderboardEntry,
  LeaderboardPeriod,
  ServerSession,
  SessionResult,
  TriviaUserStats,
} from "./types";

const V = "v1";
const DAILY_KEY = (date: string) => `trivia:daily:${V}:${date}`;
const LB_GLOBAL_KEY = `trivia:lb:global:${V}`;
const LB_DAILY_KEY = (date: string) => `trivia:lb:daily:${V}:${date}`;
const USER_KEY = (userId: string) => `trivia:user:${V}:${userId}`;
const NAMES_KEY = `trivia:names:${V}`;
const SESSION_KEY = (id: string) => `trivia:session:${V}:${id}`;
const SESSION_TTL = 60 * 60; // 1h

const FALLBACK_PATH = path.join(process.cwd(), "data", "trivia-store.json");

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

// ───────────────────────── fs fallback ─────────────────────────

interface FsStore {
  dailySets: Record<string, DailyTriviaSet>;
  users: Record<string, TriviaUserStats>;
  names: Record<string, string>;
  lbGlobal: Record<string, number>;
  lbDaily: Record<string, Record<string, number>>;
  sessions: Record<string, ServerSession>;
}

async function readFs(): Promise<FsStore> {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FsStore>;
    return {
      dailySets: parsed.dailySets || {},
      users: parsed.users || {},
      names: parsed.names || {},
      lbGlobal: parsed.lbGlobal || {},
      lbDaily: parsed.lbDaily || {},
      sessions: parsed.sessions || {},
    };
  } catch {
    return {
      dailySets: {},
      users: {},
      names: {},
      lbGlobal: {},
      lbDaily: {},
      sessions: {},
    };
  }
}

async function writeFs(store: FsStore): Promise<void> {
  await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(store, null, 2), "utf8");
}

// ───────────────────────── daily sets ─────────────────────────

export async function getDailySet(date: string): Promise<DailyTriviaSet | null> {
  if (isKvEnabled()) {
    return (await kv.get<DailyTriviaSet>(DAILY_KEY(date))) ?? null;
  }
  const store = await readFs();
  return store.dailySets[date] ?? null;
}

export async function saveDailySet(set: DailyTriviaSet): Promise<void> {
  if (isKvEnabled()) {
    // TTL 8 días: el set del día vive lo suficiente para repasos, luego expira.
    await kv.set(DAILY_KEY(set.date), set, { ex: 60 * 60 * 24 * 8 });
    return;
  }
  const store = await readFs();
  store.dailySets[set.date] = set;
  await writeFs(store);
}

// ───────────────────────── stats + leaderboard ─────────────────────────

const EMPTY_STATS = (userId: string, name: string): TriviaUserStats => ({
  userId,
  name,
  totalPoints: 0,
  gamesPlayed: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  bestSpeedScore: 0,
  bestSurvival: 0,
  lastPlayed: null,
});

/** Registra una sesión terminada: actualiza stats del usuario y leaderboards. */
export async function recordSession(
  userId: string,
  name: string,
  result: SessionResult,
): Promise<TriviaUserStats> {
  const prev = (await getUserStats(userId)) ?? EMPTY_STATS(userId, name);
  const next: TriviaUserStats = {
    userId,
    name: name || prev.name,
    totalPoints: prev.totalPoints + result.points,
    gamesPlayed: prev.gamesPlayed + 1,
    totalAnswered: prev.totalAnswered + result.answered,
    totalCorrect: prev.totalCorrect + result.correct,
    bestStreak: Math.max(prev.bestStreak, result.bestStreak),
    bestSpeedScore:
      result.mode === "relampago"
        ? Math.max(prev.bestSpeedScore, result.points)
        : prev.bestSpeedScore,
    bestSurvival:
      result.mode === "muerte-subita"
        ? Math.max(prev.bestSurvival, result.survival ?? 0)
        : prev.bestSurvival,
    lastPlayed: new Date().toISOString(),
  };

  if (isKvEnabled()) {
    await Promise.all([
      kv.set(USER_KEY(userId), next),
      kv.hset(NAMES_KEY, { [userId]: next.name }),
      kv.zadd(LB_GLOBAL_KEY, { score: next.totalPoints, member: userId }),
      kv.zincrby(LB_DAILY_KEY(result.date), result.points, userId),
    ]);
    // El leaderboard diario expira a los 3 días.
    await kv.expire(LB_DAILY_KEY(result.date), 60 * 60 * 24 * 3);
    return next;
  }

  const store = await readFs();
  store.users[userId] = next;
  store.names[userId] = next.name;
  store.lbGlobal[userId] = next.totalPoints;
  store.lbDaily[result.date] = store.lbDaily[result.date] || {};
  store.lbDaily[result.date][userId] =
    (store.lbDaily[result.date][userId] || 0) + result.points;
  await writeFs(store);
  return next;
}

export async function getUserStats(userId: string): Promise<TriviaUserStats | null> {
  if (isKvEnabled()) {
    return (await kv.get<TriviaUserStats>(USER_KEY(userId))) ?? null;
  }
  const store = await readFs();
  return store.users[userId] ?? null;
}

export async function getLeaderboard(
  period: LeaderboardPeriod,
  limit = 50,
  date?: string,
): Promise<LeaderboardEntry[]> {
  if (isKvEnabled()) {
    const key =
      period === "global" ? LB_GLOBAL_KEY : LB_DAILY_KEY(date || todayUTC());
    // zrange rev con scores → [member, score, member, score, ...]
    const raw = (await kv.zrange(key, 0, limit - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];
    if (!raw.length) return [];
    const names = (await kv.hgetall<Record<string, string>>(NAMES_KEY)) || {};
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const userId = String(raw[i]);
      const points = Number(raw[i + 1]);
      entries.push({ userId, name: names[userId] || "Anónimo", points });
    }
    return entries;
  }

  const store = await readFs();
  const map =
    period === "global" ? store.lbGlobal : store.lbDaily[date || todayUTC()] || {};
  return Object.entries(map)
    .map(([userId, points]) => ({
      userId,
      name: store.names[userId] || "Anónimo",
      points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

// ───────────────────────── sesiones (anti-trampa) ─────────────────────────

export async function saveSession(session: ServerSession): Promise<void> {
  if (isKvEnabled()) {
    await kv.set(SESSION_KEY(session.id), session, { ex: SESSION_TTL });
    return;
  }
  const store = await readFs();
  store.sessions[session.id] = session;
  await writeFs(store);
}

export async function getSession(id: string): Promise<ServerSession | null> {
  if (isKvEnabled()) {
    return (await kv.get<ServerSession>(SESSION_KEY(id))) ?? null;
  }
  const store = await readFs();
  return store.sessions[id] ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  if (isKvEnabled()) {
    await kv.del(SESSION_KEY(id));
    return;
  }
  const store = await readFs();
  delete store.sessions[id];
  await writeFs(store);
}

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
