// src/lib/predictions/gamification-store.ts
//
// Capa de datos (Supabase) de la gamificación. Usa el cliente admin (service
// role) porque cruza usuarios y escribe progresión que el usuario no puede
// auto-otorgar. Las APIs autentican primero y pasan el userId verificado.
//
// NO importa store.ts (evita ciclo): store.ts → gamification-store.ts → admin/.

import { adminClient } from "./admin";
import { aggregateResolvedPoints } from "./leaderboard-agg";
import {
  ACHIEVEMENT_MAP,
  BOOST_CATALOG,
  boostDef,
  challengeIncrement,
  challengeTarget,
  coinsForResolved,
  computeStreak,
  dailyChallenge,
  dailyCheckinReward,
  flashMultiplier,
  hoursUntil,
  leagueCode,
  levelInfo,
  newlyUnlocked,
  openChest,
  resolveDuelScore,
  streakExpired,
  STREAK_THRESHOLD,
  STREAK_WINDOW_MS,
  utcDayKey,
  weekStart,
  xpForResolved,
  type AchievementStats,
  type BoostId,
  type ChallengeSignals,
} from "./gamification";
import {
  buildBattlePassView,
  jornadaBonus,
  seasonInfo,
  seasonKey,
  tierForXp,
  tierReward,
  type BattlePassView,
  type Track,
} from "./battlepass";
import { matchesOnDate } from "./match-data";
import { bracketPointsByUser } from "./bracket-store";
import { cosmeticsByUser } from "./cosmetics-store";
import type { CosmeticDisplay } from "./cosmetics";
import { recordDuelResult } from "./rivalries-store";
import { spendCoins, grantCoins } from "@/lib/economy/wallet";
import { kv } from "@/lib/kv";

// ── Check-in diario anclado en KV ────────────────────────────────────────────
// El check-in diario usa Vercel KV como ANCLA de idempotencia (igual que la
// trivia), NO la columna profiles.last_checkin. Esa columna (y la tabla
// prediction_daily_claims) pertenecen a la migración 2026-07, que puede NO
// estar aplicada en producción. Sin un ancla que persista de verdad, el estado
// "reclamado" se perdía (la misión volvía a "Reclamar" al instante) y, peor,
// se podían farmear Fútcoins reclamando en bucle. KV está probado en prod
// (lo usan ops y la trivia) y persiste entre recargas y sesiones.
const DAILY_CLAIM_TTL = 60 * 60 * 48;        // 48 h: cubre el día con holgura
const DAILY_STREAK_TTL = 60 * 60 * 24 * 10;  // 10 días: ventana de racha viva
const dailyClaimKey = (uid: string, day: string) => `daily:claim:${uid}:${day}`;
const dailyStreakKey = (uid: string) => `daily:streak:${uid}`;
interface DailyStreakRec { day: string; streak: number }

/** Estado del check-in desde KV: si ya reclamó hoy y la racha consecutiva. */
async function readDailyState(uid: string): Promise<{ claimedToday: boolean; streak: number; lastDay: string | null }> {
  try {
    const [mark, rec] = await Promise.all([
      kv.get(dailyClaimKey(uid, utcDayKey())),
      kv.get<DailyStreakRec>(dailyStreakKey(uid)),
    ]);
    return { claimedToday: !!mark, streak: rec?.streak ?? 0, lastDay: rec?.day ?? null };
  } catch {
    return { claimedToday: false, streak: 0, lastDay: null };
  }
}

interface ProfileGam {
  xp: number;
  coins: number;
  current_streak: number;
  best_streak: number;
  last_checkin: string | null;
  checkin_days: number;
  username: string | null;
  avatar_url: string | null;
  streak_expires_at: string | null;
  streak_anchor: string | null;
}

async function readProfile(uid: string): Promise<ProfileGam> {
  const admin = adminClient();

  // coins/xp se leen con un SELECT mínimo (el mismo que usa el ranking de la
  // cabecera, que funciona) separado de las columnas de racha: si alguna
  // columna de racha falta en el entorno, ese fallo no debe arrastrar
  // coins/xp a 0. Antes un único SELECT de 10 columnas fallaba entero y el
  // error se descartaba en silencio → la home mostraba 0 Fútcoins.
  const { data: core, error: coreErr } = await admin
    .from("profiles")
    .select("xp,coins,username,avatar_url")
    .eq("id", uid).maybeSingle();
  if (coreErr) {
    console.error("[gamification] readProfile core select failed:", coreErr.message);
  }
  const c = (core ?? {}) as Partial<ProfileGam>;

  const { data: streak, error: streakErr } = await admin
    .from("profiles")
    .select("current_streak,best_streak,last_checkin,checkin_days,streak_expires_at,streak_anchor")
    .eq("id", uid).maybeSingle();
  if (streakErr) {
    console.error("[gamification] readProfile streak select failed (defaults):", streakErr.message);
  }
  const s = (streak ?? {}) as Partial<ProfileGam>;

  return {
    xp: c.xp ?? 0,
    coins: c.coins ?? 0,
    username: c.username ?? null,
    avatar_url: c.avatar_url ?? null,
    current_streak: s.current_streak ?? 0,
    best_streak: s.best_streak ?? 0,
    last_checkin: s.last_checkin ?? null,
    checkin_days: s.checkin_days ?? 0,
    streak_expires_at: s.streak_expires_at ?? null,
    streak_anchor: s.streak_anchor ?? null,
  };
}

/** Lee el flag premium del usuario (columna profiles.is_premium). */
async function readPremium(uid: string): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("is_premium").eq("id", uid).maybeSingle();
  return Boolean((data as { is_premium?: boolean } | null)?.is_premium);
}

/**
 * Suma XP a la TEMPORADA vigente del Battle Pass (separado del XP de por vida).
 * Se llama desde los mismos puntos donde se otorga XP de progresión. Idempotente
 * por upsert con incremento leído-y-escrito (no concurrente-seguro al 100%, pero
 * la resolución es secuencial por usuario).
 */
export async function addSeasonXp(uid: string, xp: number): Promise<void> {
  if (xp <= 0) return;
  const admin = adminClient();
  const key = seasonKey();
  const { data } = await admin
    .from("prediction_season_xp")
    .select("xp").eq("user_id", uid).eq("season_key", key).maybeSingle();
  const current = (data as { xp: number } | null)?.xp ?? 0;
  await admin.from("prediction_season_xp").upsert({
    user_id: uid, season_key: key, xp: current + xp, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,season_key" });
}

async function readSeasonXp(uid: string, key: string): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_season_xp")
    .select("xp").eq("user_id", uid).eq("season_key", key).maybeSingle();
  return (data as { xp: number } | null)?.xp ?? 0;
}

/**
 * Resuelve la caducidad de la racha de forma perezosa: si la racha activa ya
 * caducó por inactividad, la reinicia a 0 y fija un "ancla" temporal para que
 * solo las predicciones resueltas DESPUÉS de la caducidad cuenten para la
 * racha nueva. Devuelve el estado vigente de la racha.
 */
async function settleStreakExpiry(uid: string, prof: ProfileGam): Promise<{ current: number; expiresAt: string | null }> {
  if (!streakExpired(prof.streak_expires_at, prof.current_streak)) {
    return { current: prof.current_streak, expiresAt: prof.streak_expires_at };
  }
  const admin = adminClient();
  const anchor = prof.streak_expires_at; // a partir de aquí arranca la racha nueva
  await admin.from("profiles").update({
    current_streak: 0,
    streak_anchor: anchor,
    streak_expires_at: null,
  }).eq("id", uid);
  // refleja el cambio en el objeto en memoria por si el caller lo reutiliza
  prof.current_streak = 0;
  prof.streak_anchor = anchor;
  prof.streak_expires_at = null;
  return { current: 0, expiresAt: null };
}

interface ResolvedRow {
  prediction_type: string;
  points_earned: number | null;
  is_correct: boolean | null;
  is_contrarian: boolean;
  match_multiplier: number;
  match_id: string;
}

function buildStats(rows: ResolvedRow[], xp: number): AchievementStats {
  let totalPoints = 0, correct = 0, contrarianHits = 0, exactHits = 0, chainJackpots = 0, diamondHits = 0;
  const chrono: boolean[] = [];
  const byMatch = new Map<string, { total: number; correct: number }>();
  for (const r of rows) {
    const ok = Boolean(r.is_correct);
    chrono.push(ok);
    totalPoints += r.points_earned ?? 0;
    if (ok) correct++;
    if (ok && r.is_contrarian) contrarianHits++;
    if (ok && r.prediction_type === "exact_score") exactHits++;
    if (ok && r.prediction_type === "chain") chainJackpots++;
    if (ok && Number(r.match_multiplier) >= 2) diamondHits++;
    const m = byMatch.get(r.match_id) ?? { total: 0, correct: 0 };
    m.total++; if (ok) m.correct++;
    byMatch.set(r.match_id, m);
  }
  let perfect = 0;
  for (const m of byMatch.values()) if (m.total === 8 && m.correct === 8) perfect++;
  const { best } = computeStreak(chrono);
  return {
    totalPredictions: rows.length,
    correctPredictions: correct,
    totalPoints,
    bestStreak: best,
    perfectMatches: perfect,
    contrarianHits,
    exactScoreHits: exactHits,
    chainJackpots,
    diamondHits,
    level: levelInfo(xp).level,
  };
}

// ─── Otorgar progresión tras resolver un partido (lo llama resolveMatch) ─────
export async function grantMatchRewards(matchId: string, userIds: string[]): Promise<void> {
  const admin = adminClient();
  for (const uid of userIds) {
    // IDEMPOTENCIA por (usuario, partido): si grantMatchRewards corre dos veces
    // para el mismo partido (resoluciones concurrentes), antes pagaba doble. El
    // INSERT a prediction_match_rewards (PK user_id,match_id) actúa de candado:
    // solo la PRIMERA ejecución por usuario gana; si choca con 23505 ya se pagó y
    // saltamos a ese usuario sin volver a abonar.
    // FALLO SEGURO: si la tabla aún no existe en algún entorno, NO bloqueamos la
    // resolución del partido — capturamos el error y seguimos con el comportamiento
    // actual (mejor pagar que dejar partidos sin resolver el día del Mundial).
    const { error: rewardLockErr } = await admin
      .from("prediction_match_rewards")
      .insert({ user_id: uid, match_id: matchId });
    if (rewardLockErr) {
      const code = (rewardLockErr as { code?: string }).code;
      if (code === "23505") continue; // ya recompensado por (usuario, partido)
      // Cualquier otro error (p.ej. tabla inexistente): log y continúa pagando.
      console.error(
        `[gamification] prediction_match_rewards lock fallback (uid=${uid} match=${matchId}):`,
        rewardLockErr.message,
      );
    }

    const { data } = await admin
      .from("predictions")
      .select("prediction_type,points_earned,is_correct,is_contrarian,match_multiplier,match_id,resolved_at")
      .eq("user_id", uid)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: true });
    const rows = (data ?? []) as (ResolvedRow & { resolved_at: string })[];

    // XP/monedas SOLO de las predicciones de ESTE partido (rewarded una vez).
    let gainedXp = 0, gainedCoins = 0;
    for (const r of rows) {
      if (r.match_id !== matchId) continue;
      gainedXp += xpForResolved(r.points_earned ?? 0, Boolean(r.is_correct));
      gainedCoins += coinsForResolved(r.points_earned ?? 0, Boolean(r.is_correct));
    }

    const prof = await readProfile(uid);

    // Racha: el récord se mide sobre TODO el historial; la racha "actual" solo
    // cuenta aciertos resueltos DESPUÉS del ancla (caducidad previa por inactividad).
    const { best } = computeStreak(rows.map((r) => Boolean(r.is_correct)));
    const anchorMs = prof.streak_anchor ? new Date(prof.streak_anchor).getTime() : 0;
    const sinceAnchor = anchorMs
      ? rows.filter((r) => new Date(r.resolved_at).getTime() >= anchorMs)
      : rows;
    const { current } = computeStreak(sinceAnchor.map((r) => Boolean(r.is_correct)));
    // Si la racha sigue activa, (re)arma la ventana de caducidad por engagement.
    const streakExpiresAt = current >= STREAK_THRESHOLD
      ? new Date(Date.now() + STREAK_WINDOW_MS).toISOString()
      : null;

    // Logros: evaluar con el XP que tendrá tras esta resolución (para el logro de nivel).
    const stats = buildStats(rows, prof.xp + gainedXp);
    const { data: ach } = await admin.from("prediction_achievements").select("achievement_id").eq("user_id", uid);
    const unlocked = new Set((ach ?? []).map((a) => (a as { achievement_id: string }).achievement_id));
    const fresh = newlyUnlocked(stats, unlocked);
    let totalCoins = gainedCoins;
    let totalXp = gainedXp; // Fútcoins/XP totales ganados en esta resolución (+ logros).
    for (const a of fresh) {
      await admin.from("prediction_achievements").insert({ user_id: uid, achievement_id: a.id }).then(() => {}, () => {});
      totalCoins += a.rewardCoins;
      totalXp += a.rewardXp;
    }

    // Abono ATÓMICO de Fútcoins + XP por la puerta única (evita la fuga de
    // concurrencia del read-modify-write). seasonXp:false porque la pista de
    // temporada se alimenta justo debajo con el mismo XP.
    await grantCoins(uid, totalCoins, totalXp, { seasonXp: false, module: "predicciones" });

    // Campos de racha: valores ABSOLUTOS derivados del historial completo (no son
    // incrementos), así que un update directo es seguro ante concurrencia.
    await admin.from("profiles").update({
      current_streak: current,
      best_streak: Math.max(best, prof.best_streak),
      streak_expires_at: streakExpiresAt,
    }).eq("id", uid);

    // Battle Pass: el mismo XP de progresión llena la pista de temporada.
    await addSeasonXp(uid, totalXp).catch(() => {});
  }

  // Resolver duelos 1v1 de este partido.
  await resolveDuelsForMatch(matchId);
}

async function resolveDuelsForMatch(matchId: string): Promise<void> {
  const admin = adminClient();
  const { data: duels } = await admin
    .from("prediction_duels")
    .select("id,challenger_id,opponent_id")
    .eq("match_id", matchId)
    .eq("status", "active");
  for (const d of (duels ?? []) as { id: string; challenger_id: string; opponent_id: string }[]) {
    const cp = await sumMatchPoints(d.challenger_id, matchId);
    const op = await sumMatchPoints(d.opponent_id, matchId);
    const outcome = resolveDuelScore(cp, op);
    const winner = outcome === "challenger" ? d.challenger_id : outcome === "opponent" ? d.opponent_id : null;
    await admin.from("prediction_duels").update({
      status: "resolved",
      challenger_points: cp,
      opponent_points: op,
      winner_id: winner,
      resolved_at: new Date().toISOString(),
    }).eq("id", d.id);
    if (winner) {
      // ANTI-CHEAT (colusión): los duelos son SOLO bragging-rights, NO acuñan
      // moneda. Antes el ganador recibía 50 Fútcoins acuñadas de la nada y sin
      // coste para el retador, así que dos cuentas en colusión farmeaban infinito
      // (un par gana siempre, sin tope por par/partido). Mismo criterio que el
      // Modo Fantasma (micro): pagar SOLO XP, nunca Fútcoins. 0 coins + 30 XP.
      await grantCoins(winner, 0, 30, { seasonXp: false, module: "predicciones" });
    }
    // Acumula el cara a cara persistente (Mejora I).
    await recordDuelResult({
      challengerId: d.challenger_id,
      opponentId: d.opponent_id,
      challengerPoints: cp,
      opponentPoints: op,
      winnerId: winner,
      matchId,
    }).catch(() => {});
  }
}

async function sumMatchPoints(uid: string, matchId: string): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from("predictions")
    .select("points_earned")
    .eq("user_id", uid).eq("match_id", matchId)
    .not("resolved_at", "is", null);
  return ((data ?? []) as { points_earned: number | null }[]).reduce((s, r) => s + (r.points_earned ?? 0), 0);
}

// ─── Resumen /me ─────────────────────────────────────────────────────────────
export interface GamificationSummary {
  level: ReturnType<typeof levelInfo>;
  coins: number;
  coin_name: string;
  streak: { current: number; best: number; active: boolean; expires_at: string | null; hours_left: number | null };
  achievements: { id: string; name: string; emoji: string; description: string; unlocked: boolean; unlocked_at: string | null }[];
  daily: {
    challenge: ReturnType<typeof dailyChallenge>;
    challenge_progress: number;
    challenge_target: number;
    challenge_completed: boolean;
    can_claim: boolean;
    checkin_days: number;
    next_reward: ReturnType<typeof dailyCheckinReward>;
  };
  flash: ReturnType<typeof flashMultiplier>;
  boosts: { id: string; name: string; emoji: string; count: number }[];
}

export async function getGamificationSummary(uid: string): Promise<GamificationSummary> {
  const admin = adminClient();
  const prof = await readProfile(uid);

  const { data: achRows } = await admin
    .from("prediction_achievements").select("achievement_id,unlocked_at").eq("user_id", uid);
  const unlockedMap = new Map((achRows ?? []).map((a) => {
    const r = a as { achievement_id: string; unlocked_at: string };
    return [r.achievement_id, r.unlocked_at];
  }));
  const achievements = Object.values(ACHIEVEMENT_MAP).map((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, description: a.description,
    unlocked: unlockedMap.has(a.id), unlocked_at: unlockedMap.get(a.id) ?? null,
  }));

  const { data: boostRows } = await admin
    .from("prediction_boosts").select("boost_id").eq("user_id", uid).is("consumed_at", null);
  const boostCounts = new Map<string, number>();
  for (const b of (boostRows ?? []) as { boost_id: string }[]) {
    boostCounts.set(b.boost_id, (boostCounts.get(b.boost_id) ?? 0) + 1);
  }
  const boosts = [...boostCounts.entries()].map(([id, count]) => {
    const def = boostDef(id);
    return { id, name: def?.name ?? id, emoji: def?.emoji ?? "🎁", count };
  });

  // Check-in diario desde KV (robusto a columnas de 2026-07 ausentes).
  const today = utcDayKey();
  const yesterdayKey = utcDayKey(new Date(Date.now() - 86_400_000));
  const dstate = await readDailyState(uid);
  const streakAlive = dstate.lastDay === today || dstate.lastDay === yesterdayKey ? dstate.streak : 0;
  const canClaim = !dstate.claimedToday;
  const checkinDays = dstate.claimedToday ? dstate.streak : streakAlive;
  const nextCheckinDays = dstate.claimedToday ? dstate.streak : streakAlive + 1;

  // Racha: aplica caducidad por inactividad de forma perezosa.
  const { current: streakCurrent, expiresAt: streakExpiresAt } = await settleStreakExpiry(uid, prof);

  const challenge = dailyChallenge();
  const { data: chRow } = await admin
    .from("prediction_challenge_progress")
    .select("progress,completed_at,challenge_key")
    .eq("user_id", uid).eq("day_key", today).maybeSingle();
  const chr = chRow as { progress: number; completed_at: string | null; challenge_key: string } | null;
  const sameChallenge = Boolean(chr && chr.challenge_key === challenge.key);

  return {
    level: levelInfo(prof.xp),
    coins: prof.coins,
    coin_name: "Fútcoins",
    streak: {
      current: streakCurrent,
      best: prof.best_streak,
      active: streakCurrent >= STREAK_THRESHOLD,
      expires_at: streakExpiresAt,
      hours_left: hoursUntil(streakExpiresAt),
    },
    achievements,
    daily: {
      challenge,
      challenge_progress: sameChallenge ? chr!.progress : 0,
      challenge_target: challengeTarget(challenge.key),
      challenge_completed: Boolean(sameChallenge && chr!.completed_at),
      can_claim: canClaim,
      checkin_days: checkinDays,
      next_reward: dailyCheckinReward(nextCheckinDays),
    },
    flash: flashMultiplier(),
    boosts,
  };
}

// ─── Bucle diario: progreso del reto (lo llama la creación de predicciones) ───
/**
 * Avanza el reto del día con la predicción recién creada y, al completarse,
 * paga la recompensa UNA sola vez (idempotente vía completed_at).
 */
export async function bumpChallengeProgress(uid: string, signals: ChallengeSignals): Promise<void> {
  const admin = adminClient();
  const challenge = dailyChallenge();
  const inc = challengeIncrement(challenge.key, signals);
  if (inc <= 0) return;

  const today = utcDayKey();
  const { data } = await admin
    .from("prediction_challenge_progress")
    .select("progress,completed_at,challenge_key")
    .eq("user_id", uid).eq("day_key", today).maybeSingle();
  const row = data as { progress: number; completed_at: string | null; challenge_key: string } | null;

  // Ya completado y pagado hoy → nada que hacer.
  if (row?.completed_at && row.challenge_key === challenge.key) return;

  // Si la fila es de un reto anterior (no debería pasar: el reto es determinista
  // por día), se reinicia el progreso para el reto vigente.
  const base = row && row.challenge_key === challenge.key ? row.progress : 0;
  const target = challengeTarget(challenge.key);
  const progress = Math.min(target, base + inc);
  const completed = progress >= target;

  await admin.from("prediction_challenge_progress").upsert({
    user_id: uid,
    day_key: today,
    challenge_key: challenge.key,
    progress,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: "user_id,day_key" });

  if (completed) {
    await grantCoins(uid, challenge.rewardCoins, challenge.rewardXp, { seasonXp: false, module: "predicciones" });
    await addSeasonXp(uid, challenge.rewardXp).catch(() => {});
  }
}

/**
 * Renueva la ventana de caducidad de la racha cuando el usuario predice. Si la
 * racha ya había caducado, la asienta (reset) en vez de revivirla.
 */
export async function extendStreakWindow(uid: string): Promise<void> {
  const admin = adminClient();
  const prof = await readProfile(uid);
  const { current } = await settleStreakExpiry(uid, prof);
  if (current < STREAK_THRESHOLD) return;
  await admin.from("profiles").update({
    streak_expires_at: new Date(Date.now() + STREAK_WINDOW_MS).toISOString(),
  }).eq("id", uid);
}

// ─── Bucle diario: check-in ──────────────────────────────────────────────────
export interface CheckinResult {
  already: boolean;
  reward?: { day: number; coins: number; xp: number; chest: boolean };
  chest?: ReturnType<typeof openChest>;
  checkin_days: number;
  coins: number;
}
export async function claimDaily(uid: string): Promise<CheckinResult> {
  const admin = adminClient();
  const today = utcDayKey();
  const yesterday = utcDayKey(new Date(Date.now() - 86_400_000));

  // Guard ATÓMICO de idempotencia en KV: SET con NX crea la marca de HOY solo
  // si no existía y devuelve "OK"; si ya existía devuelve null → ya reclamó
  // (no se vuelve a abonar). Esto cierra el farmeo de Fútcoins que permitía el
  // antiguo guard por last_checkin cuando esa columna no persiste.
  let kvOk = false;
  try {
    const set = await kv.set(dailyClaimKey(uid, today), Date.now(), { nx: true, ex: DAILY_CLAIM_TTL });
    kvOk = true;
    if (!set) {
      const prof = await readProfile(uid);
      const rec = await kv.get<DailyStreakRec>(dailyStreakKey(uid)).catch(() => null);
      return { already: true, checkin_days: rec?.streak ?? prof.checkin_days, coins: prof.coins };
    }
  } catch {
    // KV no disponible: fallback al guard por columna (comportamiento previo).
    const prof = await readProfile(uid);
    if (prof.last_checkin === today) {
      return { already: true, checkin_days: prof.checkin_days, coins: prof.coins };
    }
  }

  // Racha consecutiva desde KV (ayer = última marca) → independiente de columnas.
  const rec = kvOk ? await kv.get<DailyStreakRec>(dailyStreakKey(uid)).catch(() => null) : null;
  const newDays = rec && rec.day === yesterday ? rec.streak + 1 : 1;
  const reward = dailyCheckinReward(newDays);

  let gainCoins = reward.coins;
  let gainXp = reward.xp;
  let chest: ReturnType<typeof openChest> | undefined;
  if (reward.chest) {
    chest = openChest(`${uid}:${today}`);
    gainCoins += chest.coins; gainXp += chest.xp;
  }

  // Abono ATÓMICO de Fútcoins + XP por la puerta única (billetera).
  const grant = await grantCoins(uid, gainCoins, gainXp, { seasonXp: false, module: "predicciones" });

  // El boost del cofre se entrega solo tras ganar el gate KV — exactamente una vez.
  if (chest?.boost) {
    await admin.from("prediction_boosts").insert({ user_id: uid, boost_id: chest.boost });
  }

  // Persiste la racha en KV (fuente de verdad robusta a la migración pendiente).
  if (kvOk) {
    await kv.set(dailyStreakKey(uid), { day: today, streak: newDays } as DailyStreakRec, { ex: DAILY_STREAK_TTL }).catch(() => {});
  }

  // Best-effort: si las columnas/tabla de 2026-07 YA existen, mantenlas al día
  // (audit + forward-compat). Si no existen, el error se ignora en silencio.
  admin.from("profiles").update({ last_checkin: today, checkin_days: newDays }).eq("id", uid).then(() => {}, () => {});
  admin.from("prediction_daily_claims").upsert({
    user_id: uid, day_key: today, reward_coins: reward.coins, reward_xp: reward.xp,
  }, { onConflict: "user_id,day_key" }).then(() => {}, () => {});

  // El XP del check-in (y del cofre) también llena la pista de temporada.
  await addSeasonXp(uid, gainXp).catch(() => {});

  return { already: false, reward, chest, checkin_days: newDays, coins: grant.coins };
}

// ─── Battle Pass de temporada (mejora E) ─────────────────────────────────────
/** Construye la vista de la pista de temporada para la UI. */
export async function getBattlePass(uid: string): Promise<BattlePassView> {
  const admin = adminClient();
  const season = seasonInfo();
  const [seasonXp, premium] = await Promise.all([
    readSeasonXp(uid, season.key),
    readPremium(uid),
  ]);
  const { data: claimRows } = await admin
    .from("prediction_battlepass_claims")
    .select("tier,track")
    .eq("user_id", uid).eq("season_key", season.key);
  const claimed = new Set(
    (claimRows ?? []).map((c) => {
      const r = c as { tier: number; track: string };
      return `${r.tier}:${r.track}`;
    }),
  );
  return buildBattlePassView(season, seasonXp, premium, claimed);
}

export interface ClaimTierResult { ok: boolean; error?: string; coins?: number; boost?: BoostId | null }
/**
 * Reclama la recompensa de un nivel/tramo del Battle Pass. Valida que el nivel
 * esté desbloqueado, que el tramo premium requiera premium, y que no se haya
 * reclamado ya (idempotente vía PK de prediction_battlepass_claims).
 */
export async function claimBattlePassTier(uid: string, tier: number, track: Track): Promise<ClaimTierResult> {
  if (tier < 1) return { ok: false, error: "invalid_tier" };
  const admin = adminClient();
  const season = seasonInfo();
  const seasonXp = await readSeasonXp(uid, season.key);
  if (tierForXp(seasonXp) < tier) return { ok: false, error: "tier_locked" };
  if (track === "premium" && !(await readPremium(uid))) return { ok: false, error: "premium_required" };

  // Idempotencia: si ya existe el claim, no se vuelve a pagar.
  const { error: claimErr } = await admin
    .from("prediction_battlepass_claims")
    .insert({ user_id: uid, season_key: season.key, tier, track });
  if (claimErr) return { ok: false, error: "already_claimed" };

  const reward = tierReward(tier, track);
  const grant = await grantCoins(uid, reward.coins, 0, { module: "predicciones" });
  if (reward.boost) {
    await admin.from("prediction_boosts").insert({ user_id: uid, boost_id: reward.boost });
  }
  return { ok: true, coins: grant.coins, boost: reward.boost };
}

export interface JornadaResult { ok: boolean; awarded: boolean; xp?: number; coins?: number; missing?: number }
/**
 * Otorga el bonus de jornada si el usuario predijo TODOS los partidos de un día.
 * Idempotente: registra el cobro en prediction_jornada_claims (PK user_id,day_key).
 * El XP del bonus también llena la pista de temporada.
 */
export async function claimJornadaIfComplete(uid: string, dayKey: string): Promise<JornadaResult> {
  const matchIds = matchesOnDate(dayKey);
  if (!matchIds.length) return { ok: false, awarded: false, missing: 0 };

  const admin = adminClient();
  // ¿Ya cobrado este día?
  const { data: existing } = await admin
    .from("prediction_jornada_claims")
    .select("day_key").eq("user_id", uid).eq("day_key", dayKey).maybeSingle();
  if (existing) return { ok: true, awarded: false };

  // ¿Predijo todos los partidos del día? (al menos una predicción por partido)
  const { data: preds } = await admin
    .from("predictions")
    .select("match_id").eq("user_id", uid).in("match_id", matchIds);
  const predicted = new Set((preds ?? []).map((p) => (p as { match_id: string }).match_id));
  const missing = matchIds.filter((id) => !predicted.has(id)).length;
  if (missing > 0) return { ok: true, awarded: false, missing };

  const bonus = jornadaBonus(matchIds.length);
  // Idempotencia: el insert con PK protege contra doble cobro concurrente.
  const { error: claimErr } = await admin.from("prediction_jornada_claims").insert({
    user_id: uid, day_key: dayKey, reward_xp: bonus.xp, reward_coins: bonus.coins,
  });
  if (claimErr) return { ok: true, awarded: false };

  await grantCoins(uid, bonus.coins, bonus.xp, { seasonXp: false, module: "predicciones" });
  await addSeasonXp(uid, bonus.xp).catch(() => {});
  return { ok: true, awarded: true, xp: bonus.xp, coins: bonus.coins };
}

// ─── Economía: comprar boost ─────────────────────────────────────────────────
export interface BuyResult { ok: boolean; error?: string; coins?: number }
export async function buyBoost(uid: string, boostId: string): Promise<BuyResult> {
  const def = boostDef(boostId);
  if (!def) return { ok: false, error: "boost_not_found" };
  const admin = adminClient();
  // Cobro por la PUERTA ÚNICA de gasto (atómico, sin sobregasto). Otorgamos el
  // boost solo si el cobro tuvo éxito; si la inserción falla, devolvemos las
  // Fútcoins para no cobrar sin entregar.
  const spent = await spendCoins(uid, def.cost);
  if (!spent.ok) return { ok: false, error: "insufficient_coins", coins: spent.coins };
  const { error } = await admin.from("prediction_boosts").insert({ user_id: uid, boost_id: boostId });
  if (error) {
    // Reembolso del cobro al no poder entregar el boost. Si el propio reembolso
    // falla, NO lo tragamos: dejamos rastro (uid/importe/motivo) para reconciliar
    // a mano, en vez de perder Fútcoins del usuario en silencio.
    await grantCoins(uid, def.cost, 0, { seasonXp: false }).catch((refundErr) => {
      console.error(
        `[gamification] buyBoost rollback FALLIDO — reconciliar a mano: uid=${uid} cost=${def.cost} boost=${boostId} motivo=`,
        refundErr,
      );
    });
    return { ok: false, error: "buy_failed", coins: spent.coins + def.cost };
  }
  return { ok: true, coins: spent.coins };
}

export function boostCatalog() {
  return Object.values(BOOST_CATALOG).map((b) => ({
    id: b.id, name: b.name, emoji: b.emoji, description: b.description, cost: b.cost,
  }));
}

// ─── Competencia social: ligas ───────────────────────────────────────────────
export interface LeagueOut {
  id: string; name: string; code: string; owner_id: string; member_count: number;
}
export async function createLeague(uid: string, name: string): Promise<LeagueOut> {
  const admin = adminClient();
  let code = leagueCode(`${uid}:${Date.now()}`);
  // Garantizar unicidad del código.
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await admin.from("prediction_leagues").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = leagueCode(`${uid}:${Date.now()}:${i}`);
  }
  const { data, error } = await admin.from("prediction_leagues")
    .insert({ name: name.slice(0, 60), code, owner_id: uid }).select("*").single();
  if (error) throw error;
  const league = data as { id: string; name: string; code: string; owner_id: string };
  await admin.from("prediction_league_members").insert({ league_id: league.id, user_id: uid });
  return { ...league, member_count: 1 };
}

export async function joinLeague(uid: string, code: string): Promise<{ ok: boolean; error?: string; league?: LeagueOut }> {
  const admin = adminClient();
  const { data: league } = await admin.from("prediction_leagues")
    .select("id,name,code,owner_id").eq("code", code.toUpperCase()).maybeSingle();
  if (!league) return { ok: false, error: "league_not_found" };
  const l = league as { id: string; name: string; code: string; owner_id: string };
  await admin.from("prediction_league_members")
    .upsert({ league_id: l.id, user_id: uid }, { onConflict: "league_id,user_id" });
  const { count } = await admin.from("prediction_league_members")
    .select("user_id", { count: "exact", head: true }).eq("league_id", l.id);
  return { ok: true, league: { ...l, member_count: count ?? 1 } };
}

export async function leaveLeague(uid: string, leagueId: string): Promise<void> {
  const admin = adminClient();
  await admin.from("prediction_league_members").delete().eq("league_id", leagueId).eq("user_id", uid);
}

/** H-001-17: verifica si el usuario es miembro de la liga. */
export async function isLeagueMember(uid: string, leagueId: string): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", uid)
    .maybeSingle();
  return !!data;
}

export async function myLeagues(uid: string): Promise<LeagueOut[]> {
  const admin = adminClient();
  const { data: mem } = await admin.from("prediction_league_members").select("league_id").eq("user_id", uid);
  const ids = (mem ?? []).map((m) => (m as { league_id: string }).league_id);
  if (!ids.length) return [];
  const { data: leagues } = await admin.from("prediction_leagues").select("id,name,code,owner_id").in("id", ids);
  const out: LeagueOut[] = [];
  for (const l of (leagues ?? []) as { id: string; name: string; code: string; owner_id: string }[]) {
    const { count } = await admin.from("prediction_league_members")
      .select("user_id", { count: "exact", head: true }).eq("league_id", l.id);
    out.push({ ...l, member_count: count ?? 0 });
  }
  return out;
}

export interface LeagueStanding {
  position: number; user_id: string; display_name: string; avatar_url: string | null;
  points: number;          // total = predicciones + bracket
  match_points: number;    // puntos de predicciones por partido
  bracket_points: number;  // puntos del bracket de eliminatorias
  cosmetics: CosmeticDisplay | null; // marco/color/título equipados (prestigio)
}
export async function leagueLeaderboard(leagueId: string): Promise<LeagueStanding[]> {
  const admin = adminClient();
  const { data: mem } = await admin.from("prediction_league_members").select("user_id").eq("league_id", leagueId);
  const ids = (mem ?? []).map((m) => (m as { user_id: string }).user_id);
  if (!ids.length) return [];
  const { data: preds } = await admin.from("predictions")
    .select("user_id,points_earned").in("user_id", ids).not("resolved_at", "is", null);
  const agg = new Map<string, number>();
  for (const r of (preds ?? []) as { user_id: string; points_earned: number | null }[]) {
    agg.set(r.user_id, (agg.get(r.user_id) ?? 0) + (r.points_earned ?? 0));
  }
  // El bracket de eliminatorias suma a la clasificación de la liga.
  const bracketPts = await bracketPointsByUser(ids);
  const cmap = await cosmeticsByUser(ids);
  const { data: profs } = await admin.from("profiles").select("id,username,avatar_url").in("id", ids);
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));
  return ids
    .map((id) => {
      const match_points = agg.get(id) ?? 0;
      const bracket_points = bracketPts.get(id) ?? 0;
      return { user_id: id, match_points, bracket_points, points: match_points + bracket_points };
    })
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({
      position: i + 1, user_id: e.user_id,
      display_name: pmap.get(e.user_id)?.username ?? "Anónimo",
      avatar_url: pmap.get(e.user_id)?.avatar_url ?? null,
      points: e.points, match_points: e.match_points, bracket_points: e.bracket_points,
      cosmetics: cmap.get(e.user_id) ?? null,
    }));
}

// ─── Competencia social: duelos 1v1 ──────────────────────────────────────────
export interface DuelOut {
  id: string; match_id: string; status: string;
  challenger_id: string; opponent_id: string;
  challenger_points: number | null; opponent_points: number | null;
  winner_id: string | null;
}
export async function createDuel(challengerId: string, opponentUsername: string, matchId: string): Promise<{ ok: boolean; error?: string; duel?: DuelOut }> {
  const admin = adminClient();
  const { data: opp } = await admin.from("profiles").select("id").eq("username", opponentUsername).maybeSingle();
  if (!opp) return { ok: false, error: "opponent_not_found" };
  const opponentId = (opp as { id: string }).id;
  if (opponentId === challengerId) return { ok: false, error: "cannot_duel_self" };
  const { data, error } = await admin.from("prediction_duels")
    .insert({ challenger_id: challengerId, opponent_id: opponentId, match_id: matchId, status: "pending" })
    .select("*").single();
  // 23505 = unique_violation del índice (challenger_id, opponent_id, match_id)
  // WHERE status IN ('pending','active') que añade otro agente vía SQL: ya hay un
  // duelo vivo contra ese rival en ese partido. Devolvemos un error legible en
  // vez de explotar (evita además crear N duelos del mismo par/partido).
  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "duel_exists" };
    throw error;
  }
  return { ok: true, duel: data as DuelOut };
}

export async function respondDuel(uid: string, duelId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = adminClient();
  const { data: duel } = await admin.from("prediction_duels").select("opponent_id,status").eq("id", duelId).maybeSingle();
  if (!duel) return { ok: false, error: "duel_not_found" };
  const d = duel as { opponent_id: string; status: string };
  if (d.opponent_id !== uid) return { ok: false, error: "not_your_duel" };
  if (d.status !== "pending") return { ok: false, error: "duel_not_pending" };
  await admin.from("prediction_duels").update({ status: accept ? "active" : "declined" }).eq("id", duelId);
  return { ok: true };
}

export async function myDuels(uid: string): Promise<DuelOut[]> {
  const admin = adminClient();
  const { data } = await admin.from("prediction_duels")
    .select("id,match_id,status,challenger_id,opponent_id,challenger_points,opponent_points,winner_id")
    .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as DuelOut[];
}

// ─── Leaderboard semanal ─────────────────────────────────────────────────────
export interface WeeklyEntry {
  position: number; user_id: string; display_name: string; avatar_url: string | null; points: number; predictions: number;
  cosmetics: CosmeticDisplay | null;
}
export async function getWeeklyLeaderboard(limit = 50): Promise<WeeklyEntry[]> {
  const admin = adminClient();
  // Agregación sin el tope de ~1000 filas de PostgREST (RPC o paginado);
  // llega ya ordenada, recortada al top y con el staff excluido.
  const sorted = await aggregateResolvedPoints(weekStart().toISOString(), limit);
  const ids = sorted.map((a) => a.user_id);
  const { data: profs } = ids.length
    ? await admin.from("profiles").select("id,username,avatar_url").in("id", ids)
    : { data: [] };
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));
  const cmap = await cosmeticsByUser(ids);
  return sorted.map((a, i) => ({
    position: i + 1, user_id: a.user_id,
    display_name: pmap.get(a.user_id)?.username ?? "Anónimo",
    avatar_url: pmap.get(a.user_id)?.avatar_url ?? null,
    points: a.pts, predictions: a.count,
    cosmetics: cmap.get(a.user_id) ?? null,
  }));
}

export type { BoostId };
