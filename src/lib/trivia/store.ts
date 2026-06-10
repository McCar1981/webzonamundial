// src/lib/trivia/store.ts
//
// Persistencia de la Trivia. Mismo patrón que noticias-store:
//  - Producción: Vercel KV (Redis). Persiste entre deploys e invocaciones.
//  - Dev local: fichero JSON en data/trivia-store.json.
// El backend se autodetecta por KV_REST_API_URL + KV_REST_API_TOKEN.

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@/lib/kv";
import type {
  DailyTriviaSet,
  LeaderboardEntry,
  LeaderboardPeriod,
  ServerSession,
  SessionResult,
  TriviaQuestion,
  TriviaUserStats,
} from "./types";

const V = "v1";
// Versión propia para los sets diarios: subirla invalida los sets cacheados
// (p.ej. los generados por el modelo antiguo que contenían datos erróneos) sin
// afectar a rankings, stats ni sesiones, que siguen usando V.
const DAILY_V = "v2";
const DAILY_KEY = (date: string) => `trivia:daily:${DAILY_V}:${date}`;
// Banco ACUMULATIVO de preguntas verificadas (doble pase). Crece cada día y es
// la fuente "infinita" de la trivia. Persistente (sin TTL).
//
// Se guarda como HASH de Redis (campo = id de pregunta, valor = pregunta). Es
// clave que sea un hash y NO un blob JSON: addToBank usa HSET por campo, que es
// atómico por id. Así dos escritores concurrentes (p.ej. varios usuarios en
// /start, o crons solapados) NO se pisan entre sí. Con un único array JSON un
// read-modify-write concurrente perdía preguntas (last-writer-wins).
const BANK_KEY = `trivia:bankh:${DAILY_V}`;
// Conjunto de ids de preguntas que un usuario ya ha visto (anti-repetición).
const SEEN_KEY = (userId: string) => `trivia:seen:${DAILY_V}:${userId}`;
const LB_GLOBAL_KEY = `trivia:lb:global:${V}`;
const LB_DAILY_KEY = (date: string) => `trivia:lb:daily:${V}:${date}`;
const USER_KEY = (userId: string) => `trivia:user:${V}:${userId}`;
const NAMES_KEY = `trivia:names:${V}`;
const SESSION_KEY = (id: string) => `trivia:session:${V}:${id}`;
const SESSION_TTL = 60 * 60; // 1h
// Locks NX anti-concurrencia. Mismo patrón que la reserva de recompensa: SET NX
// solo lo gana la PRIMERA petición; las que pierden la carrera reciben null y
// abortan. Cierran: doble registro en ranking (/finish), doble puntuación de la
// misma pregunta (/answer) y doble cobro de la pista 50/50 (/hint).
const FINISH_LOCK_KEY = (id: string) => `trivia:finishing:${V}:${id}`;
const ANSWER_LOCK_KEY = (sid: string, qid: string) => `trivia:answered:${V}:${sid}:${qid}`;
const HINT_LOCK_KEY = (sid: string, qid: string) => `trivia:hintlock:${V}:${sid}:${qid}`;
// Marca de "ya cobré Fútcoins por este modo hoy" (anti-faucet: la trivia se puede
// rejugar infinitas veces, pero solo paga billetera una vez por modo y día UTC).
const REWARD_KEY = (day: string, mode: string, userId: string) =>
  `trivia:reward:${V}:${day}:${mode}:${userId}`;
const REWARD_TTL = 60 * 60 * 48; // 48h (cubre el día UTC con holgura)

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
  bank: TriviaQuestion[];
  seen: Record<string, string[]>;
  /** Marcas de recompensa de billetera cobrada: clave `${day}:${mode}:${userId}`. */
  rewards: Record<string, number>;
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
      bank: parsed.bank || [],
      seen: parsed.seen || {},
      rewards: parsed.rewards || {},
    };
  } catch {
    return {
      dailySets: {},
      users: {},
      names: {},
      lbGlobal: {},
      lbDaily: {},
      sessions: {},
      bank: [],
      seen: {},
      rewards: {},
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

/**
 * Enunciados de los sets de los últimos `days` días (excluyendo hoy).
 * Se pasan al generador para que NO repita preguntas recientes.
 */
export async function getRecentQuestionTexts(days = 7): Promise<string[]> {
  const texts: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    const set = await getDailySet(date);
    if (set) for (const q of set.questions) texts.push(q.question);
  }
  return texts;
}

// ───────────────────────── banco acumulativo ─────────────────────────

/** Devuelve el banco completo de preguntas verificadas. */
export async function getQuestionBank(): Promise<TriviaQuestion[]> {
  if (isKvEnabled()) {
    const map = await kv.hgetall<Record<string, TriviaQuestion>>(BANK_KEY);
    return map ? Object.values(map) : [];
  }
  const store = await readFs();
  return store.bank;
}

/**
 * Añade preguntas nuevas al banco (dedup por id estable). Devuelve cuántas
 * se agregaron realmente. El banco crece sin límite → fuente "infinita".
 *
 * En KV escribe con HSET (un campo por id): es atómico por campo, así que dos
 * llamadas concurrentes que añadan ids distintos no se pisan. Reañadir un id ya
 * existente es idempotente (mismo contenido), por eso solo contamos como nuevas
 * las que no estaban en el hash.
 */
export async function addToBank(questions: TriviaQuestion[]): Promise<number> {
  if (questions.length === 0) return 0;
  if (isKvEnabled()) {
    const existing = new Set(await kv.hkeys(BANK_KEY));
    // Dedup también dentro del propio lote (mismo id repetido).
    const freshById = new Map<string, TriviaQuestion>();
    for (const q of questions) {
      if (!existing.has(q.id)) freshById.set(q.id, q);
    }
    if (freshById.size === 0) return 0;
    await kv.hset(BANK_KEY, Object.fromEntries(freshById));
    return freshById.size;
  }
  const store = await readFs();
  const ids = new Set(store.bank.map((q) => q.id));
  const fresh = questions.filter((q) => !ids.has(q.id));
  if (fresh.length === 0) return 0;
  store.bank = [...store.bank, ...fresh];
  await writeFs(store);
  return fresh.length;
}

// ───────────────────────── anti-repetición por usuario ─────────────────────────

/** Ids de preguntas que el usuario ya ha visto. */
export async function getSeenIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  if (isKvEnabled()) {
    const members = (await kv.smembers(SEEN_KEY(userId))) as string[];
    return new Set(members);
  }
  const store = await readFs();
  return new Set(store.seen[userId] ?? []);
}

/** Marca preguntas como vistas por el usuario (no se le volverán a mostrar
 *  hasta agotar el banco). */
export async function addSeenIds(userId: string, ids: string[]): Promise<void> {
  if (!userId || ids.length === 0) return;
  if (isKvEnabled()) {
    await kv.sadd(SEEN_KEY(userId), ids[0], ...ids.slice(1));
    return;
  }
  const store = await readFs();
  const set = new Set(store.seen[userId] ?? []);
  for (const id of ids) set.add(id);
  store.seen[userId] = [...set];
  await writeFs(store);
}

/** Reinicia el historial de "visto" del usuario (cuando ya jugó todo el banco
 *  y hay que empezar a reciclar). */
export async function resetSeen(userId: string): Promise<void> {
  if (!userId) return;
  if (isKvEnabled()) {
    await kv.del(SEEN_KEY(userId));
    return;
  }
  const store = await readFs();
  delete store.seen[userId];
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

/**
 * Reserva (de forma atómica) la recompensa de billetera de un modo para un día.
 * Devuelve `true` solo la PRIMERA vez del día para ese modo+usuario; las rejugadas
 * devuelven `false` y por tanto no vuelven a pagar Fútcoins. Esto evita el faucet
 * de monedas sin impedir seguir jugando ni sumar al ranking.
 */
export async function claimDailyTriviaReward(
  userId: string,
  day: string,
  mode: string,
): Promise<boolean> {
  if (isKvEnabled()) {
    // SET NX: solo escribe si la clave no existía → garantiza una sola reclamación.
    // Devuelve "OK" si la creó (primera vez) o null si ya existía.
    const ok = await kv.set(REWARD_KEY(day, mode, userId), 1, { nx: true, ex: REWARD_TTL });
    return Boolean(ok);
  }
  const store = await readFs();
  const key = `${day}:${mode}:${userId}`;
  if (store.rewards[key]) return false;
  store.rewards[key] = Date.now();
  await writeFs(store);
  return true;
}

/**
 * Libera la reserva de recompensa diaria (la inversa de claimDailyTriviaReward).
 * Se usa cuando el ABONO de Fútcoins falla DESPUÉS de reservar: sin esto, la marca
 * quedaría puesta y el usuario nunca cobraría (la reserva bloquea el reintento).
 * Liberarla permite que el siguiente intento del mismo día vuelva a pagar.
 */
export async function releaseDailyTriviaReward(
  userId: string,
  day: string,
  mode: string,
): Promise<void> {
  if (isKvEnabled()) {
    await kv.del(REWARD_KEY(day, mode, userId));
    return;
  }
  const store = await readFs();
  const key = `${day}:${mode}:${userId}`;
  if (store.rewards[key]) {
    delete store.rewards[key];
    await writeFs(store);
  }
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

// ───────────────────────── locks anti-concurrencia ─────────────────────────
// En KV son SET NX atómicos. En el fallback de fichero (dev, un solo proceso)
// basta un Set en memoria: no hay concurrencia entre procesos en local.
const _fsLocks = new Set<string>();

/** Reserva el cierre de una sesión. Devuelve true SOLO a la primera llamada;
 *  las peticiones /finish concurrentes con la misma sesión reciben false y no
 *  vuelven a registrar el resultado en el ranking. */
export async function claimSessionFinish(sessionId: string): Promise<boolean> {
  if (isKvEnabled()) {
    const ok = await kv.set(FINISH_LOCK_KEY(sessionId), 1, { nx: true, ex: 120 });
    return Boolean(ok);
  }
  const k = `finish:${sessionId}`;
  if (_fsLocks.has(k)) return false;
  _fsLocks.add(k);
  return true;
}

/** Reserva el procesado de una respuesta (sesión+pregunta). true solo la 1ª vez:
 *  un doble-submit de la misma pregunta (timer+clic, doble clic) no puntúa dos veces. */
export async function claimAnswer(sessionId: string, questionId: string): Promise<boolean> {
  if (isKvEnabled()) {
    const ok = await kv.set(ANSWER_LOCK_KEY(sessionId, questionId), 1, { nx: true, ex: SESSION_TTL });
    return Boolean(ok);
  }
  const k = `ans:${sessionId}:${questionId}`;
  if (_fsLocks.has(k)) return false;
  _fsLocks.add(k);
  return true;
}

/** Reserva la compra de una pista (sesión+pregunta). true solo la 1ª vez: dos
 *  clics simultáneos no cobran dos veces las Fútcoins. */
export async function claimHint(sessionId: string, questionId: string): Promise<boolean> {
  if (isKvEnabled()) {
    const ok = await kv.set(HINT_LOCK_KEY(sessionId, questionId), 1, { nx: true, ex: SESSION_TTL });
    return Boolean(ok);
  }
  const k = `hint:${sessionId}:${questionId}`;
  if (_fsLocks.has(k)) return false;
  _fsLocks.add(k);
  return true;
}

/** Libera la reserva de pista. Se usa si el cobro falla DESPUÉS de reservar, para
 *  que el usuario pueda reintentar (si no, el lock lo bloquearía hasta el TTL). */
export async function releaseHint(sessionId: string, questionId: string): Promise<void> {
  if (isKvEnabled()) {
    await kv.del(HINT_LOCK_KEY(sessionId, questionId));
    return;
  }
  _fsLocks.delete(`hint:${sessionId}:${questionId}`);
}

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
