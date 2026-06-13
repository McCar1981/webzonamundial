// src/app/api/trivia/finish/route.ts
//
// Cierra una sesión: aplica bonus de horario (early bird / night owl) y de día
// perfecto, registra el resultado en stats + leaderboard y borra la sesión.
// Identidad: usuario Supabase si hay sesión, si no un anonId del cliente.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import {
  addSeenIds,
  claimDailyTriviaReward,
  claimSessionFinish,
  releaseDailyTriviaReward,
  deleteSession,
  getSession,
  recordSession,
} from "@/lib/trivia/store";
import { resolveIdentity } from "@/lib/trivia/identity";
import { timeBonusMultiplier } from "@/lib/trivia/types";
import type { SessionResult } from "@/lib/trivia/types";
import { grantCoins } from "@/lib/economy/wallet";
import { triviaSessionReward } from "@/lib/economy/earn";
import { utcDayKey } from "@/lib/predictions/gamification";
import { rewardDailyTrivia, evaluateAchievements } from "@/lib/cromos/rewards";

/** Quita el sufijo "-rN" que añade repeatToLength para volver al id base. */
function baseId(id: string): string {
  return id.replace(/-r\d+$/, "");
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

const RATE_WINDOW_SEC = 60;
const RATE_MAX = 10;

async function rateLimited(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;
  try {
    const key = `trivia-finish:rate:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, RATE_WINDOW_SEC);
    return count > RATE_MAX;
  } catch {
    return false;
  }
}

/** H-001-22: sanitiza nombre de ranking anónimo (quita HTML/scripts). */
function sanitizeName(raw: string): string {
  return raw
    .replace(/<[^]*?>/g, "") // quita tags HTML
    .replace(/[\x00-\x1F\x7F]/g, "") // quita control chars
    .slice(0, 24)
    .trim();
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { sessionId?: string; name?: string; anonId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.sessionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Sanitizar nombre antes de usarlo
  if (body.name) body.name = sanitizeName(body.name);

  const session = await getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  if (session.finished) {
    return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }

  // Reserva atómica: solo la PRIMERA petición concurrente cierra y registra esta
  // sesión. Sin esto, N /finish en paralelo con la misma sesión la registraban N
  // veces en stats y leaderboard (la billetera ya estaba protegida por su NX).
  if (!(await claimSessionFinish(session.id))) {
    return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }

  // Identidad
  const { userId, authUserId, name } = await resolveIdentity(body.name, body.anonId);

  // Marca como vistas las preguntas mostradas (anti-repetición), aunque no se
  // registre en ranking. Se usa el id base (sin sufijo de repetición).
  if (userId) {
    // Solo se marcan como vistas las preguntas REALMENTE respondidas, no todas
    // las servidas (Muerte Súbita sirve hasta 40). Si no, el banco se agotaba en
    // una o dos sesiones por usuario y cada /start posterior tenía que generar.
    const seenIds = [...new Set(session.answered.map((id) => baseId(id)))];
    await addSeenIds(userId, seenIds);
  }

  if (!userId) {
    // No hay identidad: cerramos la sesión pero no registramos en ranking.
    session.finished = true;
    await deleteSession(session.id);
    return NextResponse.json({
      recorded: false,
      points: session.points,
      correct: session.correct,
      answered: session.answered.length,
      bestStreak: session.bestStreak,
    });
  }

  // Bonus de horario + día perfecto
  const { mult, bonus } = timeBonusMultiplier(new Date());
  const answered = session.answered.length;
  // "Día Perfecto" exige un mínimo de respuestas: sin esto, una partida de 1 sola
  // pregunta acertada (p.ej. el último cupo Free del día, o un anónimo rotando id)
  // regalaba el +50.
  const perfectDay = answered >= 5 && session.correct === answered;
  let finalPoints = Math.round(session.points * mult);
  if (perfectDay) finalPoints += 50;

  const result: SessionResult = {
    mode: session.mode,
    date: session.date,
    answered,
    correct: session.correct,
    points: finalPoints,
    bestStreak: session.bestStreak,
    avgResponseMs: answered > 0 ? Math.round(session.responseMsSum / answered) : undefined,
    survival: session.mode === "muerte-subita" ? session.correct : undefined,
  };

  session.finished = true;
  const stats = await recordSession(userId, name, result);
  await deleteSession(session.id);

  // ── Billetera única: abona Fútcoins reales en profiles.coins ──────────────
  // Solo para usuarios AUTENTICADOS (los invitados no tienen fila en profiles) y
  // una sola vez por modo y día (anti-faucet; la trivia se puede rejugar siempre).
  let futcoins = 0;
  let xpAwarded = 0;
  let coinsBalance: number | null = null;
  let rewardClaimed = false;
  if (authUserId) {
    const dayKey = utcDayKey();
    const firstToday = await claimDailyTriviaReward(authUserId, dayKey, session.mode);
    if (firstToday) {
      const reward = triviaSessionReward(finalPoints, session.correct, answered);
      try {
        const grant = await grantCoins(authUserId, reward.coins, reward.xp, { module: "trivia" });
        futcoins = grant.coinsAwarded;
        xpAwarded = grant.xpAwarded;
        coinsBalance = grant.coins;
        rewardClaimed = true;
      } catch {
        // Si falla el abono, liberamos la reserva para que el usuario pueda
        // cobrar en un próximo intento (si no, la marca lo bloquearía hoy).
        await releaseDailyTriviaReward(authUserId, dayKey, session.mode).catch(() => {});
      }
    }
  }

  // ── Recompensas de cromos del álbum (best-effort) ─────────────────────────
  let cromoReward = null;
  if (authUserId && rewardClaimed) {
    try {
      cromoReward = await rewardDailyTrivia(authUserId, utcDayKey());
      await evaluateAchievements(authUserId);
    } catch {
      /* no debe bloquear la trivia */
    }
  }

  return NextResponse.json({
    recorded: true,
    points: finalPoints,
    basePoints: session.points,
    timeBonus: bonus,
    timeBonusMult: mult,
    perfectDay,
    correct: session.correct,
    answered,
    bestStreak: session.bestStreak,
    survival: result.survival ?? null,
    stats,
    // Economía: valores reales (no estimación de cliente).
    futcoins,
    xpAwarded,
    coinsBalance,
    rewardClaimed,
    authed: Boolean(authUserId),
    cromoReward,
  });
}
