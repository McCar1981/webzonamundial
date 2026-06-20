// Mejora H: notificaciones de engagement del módulo Predicciones.
//
// Trigger principal: "racha de check-in en peligro". El check-in diario
// (gamification-store.claimDaily) lleva una cadena en profiles.checkin_days
// con clave de día UTC en profiles.last_checkin. Si un usuario hizo check-in
// AYER pero todavía no HOY, su cadena se romperá al pasar la medianoche UTC.
// Unas horas antes le mandamos un recordatorio (push + email) para que vuelva.
//
// Server-only. Reutiliza la infra ya existente: push-notifications, email y las
// preferencias granulares (notification_preferences, category='predictions-reminder').
// La idempotencia se garantiza con la tabla prediction_notifications: una clave
// (user_id, dedup_key) por día evita spamear al mismo usuario dos veces.

import { adminClient } from "./admin";
import { utcDayKey, dailyCheckinReward, COIN_NAME } from "./gamification";
import { getMatchMeta } from "./match-data";
import { sendPushToSubscription, type PushPayload } from "@/lib/push-notifications";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";

const SITE = "https://zonamundial.app";
const CATEGORY = "predictions-reminder";
// Recordamos a partir del PRIMER día de racha (1): quien hizo su primer
// check-in ayer y no ha vuelto hoy es justo la cohorte que más se fuga
// (día 1→2). Con el umbral en 2, el usuario nuevo NUNCA recibía el empujón
// del día 1 (era estructuralmente imposible). Retención día-1.
const STREAK_REMINDER_MIN_DAYS = 1;
const PLAY_URL = `${SITE}/app/predicciones/jugar`;

/** YYYY-MM-DD UTC del día anterior a `ref`. */
function utcYesterdayKey(ref = new Date()): string {
  return utcDayKey(new Date(ref.getTime() - 86_400_000));
}

// Criterio de canal: solo se bloquea si hay una fila EXPLÍCITA enabled=false
// (igual que el resto de crons). Sin fila = legacy/compat = permitido.

/** user_ids que han desactivado un canal concreto para esta categoría. */
async function optedOutUserIds(channel: "push" | "email"): Promise<Set<string>> {
  const admin = adminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("category", CATEGORY)
    .eq("channel", channel)
    .eq("enabled", false);
  return new Set<string>((data ?? []).map((r) => r.user_id as string).filter(Boolean));
}

/** Email asociado al usuario (de email_subscriptions, no dado de baja). */
async function emailForUser(uid: string): Promise<string | null> {
  const admin = adminClient();
  const { data } = await admin
    .from("email_subscriptions")
    .select("email")
    .eq("user_id", uid)
    .is("unsubscribed_at", null)
    .limit(1)
    .maybeSingle();
  return (data as { email: string } | null)?.email ?? null;
}

interface PushSub { id: string; endpoint: string; p256dh: string; auth: string; failure_count: number }

/** Subscriptions push del usuario concreto. */
async function pushSubsForUser(uid: string): Promise<PushSub[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("user_id", uid);
  return (data as PushSub[] | null) ?? [];
}

/** Marca un push como fallido (+1) o lo borra a las 5 fallas / si está gone. */
async function demotePushSub(id: string, failures: number, gone: boolean): Promise<void> {
  const admin = adminClient();
  if (gone || failures + 1 >= 5) {
    await admin.from("push_subscriptions").delete().eq("id", id);
    return;
  }
  await admin.from("push_subscriptions").update({
    failure_count: failures + 1,
    last_error_at: new Date().toISOString(),
  }).eq("id", id);
}

/**
 * Reserva la clave de dedup ANTES de enviar. Devuelve true si la reservó (no
 * existía); false si ya estaba (ya se notificó en esta ventana). El INSERT con
 * PK (user_id, dedup_key) es atómico: si choca, devolvemos false sin enviar.
 */
async function reserveDedup(uid: string, kind: string, dedupKey: string): Promise<boolean> {
  const admin = adminClient();
  const { error } = await admin
    .from("prediction_notifications")
    .insert({ user_id: uid, kind, dedup_key: dedupKey });
  if (error) {
    // 23505 = unique_violation → ya se había reservado.
    return false;
  }
  return true;
}

/** Envía un push a todas las subs del usuario. Devuelve nº de envíos OK. */
async function pushToUser(uid: string, payload: PushPayload): Promise<number> {
  const subs = await pushSubsForUser(uid);
  let ok = 0;
  for (const s of subs) {
    const res = await sendPushToSubscription({
      endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth, payload,
    });
    if (res.ok) ok += 1;
    else await demotePushSub(s.id, s.failure_count, res.gone);
  }
  return ok;
}

export interface StreakReminderResult {
  day_key: string;
  candidates: number;
  notified: number;
  pushes: number;
  emails: number;
  skipped_dedup: number;
}

/**
 * Recordatorio de racha de check-in en peligro.
 *
 * Elige a quien hizo check-in AYER (UTC) pero no HOY y lleva una cadena de al
 * menos STREAK_REMINDER_MIN_DAYS días. Les manda push + email (según sus
 * preferencias) una sola vez por día (dedup por "streak-reminder:<hoy>").
 *
 * Pensado para correr unas horas antes de la medianoche UTC, que es cuando la
 * lógica de check-in considera roto el día.
 */
export async function runStreakReminders(now = new Date()): Promise<StreakReminderResult> {
  const admin = adminClient();
  const today = utcDayKey(now);
  const yesterday = utcYesterdayKey(now);
  const kind = "streak-reminder";
  const dedupKey = `${kind}:${today}`;

  // Candidatos: check-in ayer, cadena >= umbral. (last_checkin != hoy implícito
  // porque last_checkin = ayer.)
  const { data: rows } = await admin
    .from("profiles")
    .select("id, username, checkin_days")
    .eq("last_checkin", yesterday)
    .gte("checkin_days", STREAK_REMINDER_MIN_DAYS);

  const candidates = rows ?? [];
  const [pushOut, emailOut] = await Promise.all([
    optedOutUserIds("push"),
    optedOutUserIds("email"),
  ]);

  let notified = 0, pushes = 0, emails = 0, skippedDedup = 0;

  for (const r of candidates) {
    const uid = r.id as string;
    // Reserva idempotente: si ya se mandó hoy, saltar.
    if (!(await reserveDedup(uid, kind, dedupKey))) { skippedDedup += 1; continue; }

    const days = (r.checkin_days as number) ?? 0;
    const nextDays = days + 1;
    const reward = dailyCheckinReward(nextDays);
    const name = (r.username as string | null)?.trim() || "crack";
    const dayWord = days === 1 ? "día" : "días";
    // El usuario de día 1 (racha=1) aún no tiene "racha en peligro" emocional:
    // el gancho es "arráncala/no la pierdas", no "la perderás".
    const pushTitle =
      days === 1
        ? "Vuelve hoy y arranca tu racha"
        : `Tu racha de ${days} días está en peligro`;
    let touched = false;

    // Push (si no ha desactivado el canal).
    if (!pushOut.has(uid)) {
      const sent = await pushToUser(uid, {
        title: pushTitle,
        body: `Haz tu check-in de hoy y súbela a ${nextDays}. Te esperan ${reward.coins} ${COIN_NAME}.`,
        url: PLAY_URL,
        tag: "predictions-streak",
        pushId: dedupKey,
      });
      if (sent > 0) { pushes += sent; touched = true; }
    }

    // Email (si no ha desactivado el canal y tenemos dirección).
    if (!emailOut.has(uid)) {
      const email = await emailForUser(uid);
      if (email) {
        const ok = await sendEmail({
          to: email,
          subject: `No pierdas tu racha de ${days} ${dayWord} en ZonaMundial`,
          html: brandedEmail({
            preheader: `Tu check-in diario te espera — racha de ${days} ${dayWord} en juego.`,
            heading: `Hola ${escapeHtml(name)}, tu racha está en juego`,
            bodyHtml: `
              <p style="margin:0 0 16px;">Llevas <strong>${days} ${dayWord}</strong> seguidos de check-in en Predicciones. Si no entras hoy, tu racha vuelve a cero.</p>
              <p style="margin:0 0 16px;">Haz tu check-in de hoy para subirla a <strong>${nextDays} días</strong> y llevarte <strong>${reward.coins} ${escapeHtml(COIN_NAME)}</strong>${reward.chest ? " + un cofre" : ""}.</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">Solo te toma unos segundos.</p>
            `,
            ctaLabel: "Hacer mi check-in",
            ctaHref: PLAY_URL,
          }),
        });
        if (ok) { emails += 1; touched = true; }
      }
    }

    if (touched) notified += 1;
  }

  return {
    day_key: today,
    candidates: candidates.length,
    notified,
    pushes,
    emails,
    skipped_dedup: skippedDedup,
  };
}

export interface ResolvedNotifyResult {
  match_id: string;
  candidates: number;
  notified: number;
  pushes: number;
  skipped_dedup: number;
}

/**
 * Push de PAYOFF "tu predicción se resolvió / acertaste +X pts" tras resolver un
 * partido. Cumple la promesa del prompt post-predicción ("te avisamos cuando se
 * resuelva", por la que el usuario incluso recibe Fútcoins) y es el gancho de
 * retorno de mayor dopamina (el momento "¿gané?").
 *
 * BLINDAJE: está AISLADO del cálculo de puntos. Se llama DESPUÉS de resolveMatch
 * (lee filas YA resueltas, no las modifica) y los call sites lo envuelven en
 * try/catch, así que un fallo aquí JAMÁS afecta a la resolución ni a las
 * recompensas. Dedup por (user_id, "prediction-resolved:<matchId>") → un solo
 * aviso por usuario y partido aunque varias pasadas/crons lo invoquen.
 */
export async function notifyResolvedMatch(matchId: string): Promise<ResolvedNotifyResult> {
  const admin = adminClient();
  const kind = "prediction-resolved";
  const dedupKey = `${kind}:${matchId}`;

  const meta = getMatchMeta(matchId);
  const label = meta ? `${meta.home_team} - ${meta.away_team}` : "tu partido";

  // Agregamos por usuario sus predicciones YA resueltas de este partido.
  const { data: rows } = await admin
    .from("predictions")
    .select("user_id, points_earned, is_correct")
    .eq("match_id", matchId)
    .not("resolved_at", "is", null);

  const byUser = new Map<string, { points: number; correct: number; scored: number }>();
  for (const r of (rows ?? []) as { user_id: string; points_earned: number | null; is_correct: boolean | null }[]) {
    if (!r.user_id) continue;
    const agg = byUser.get(r.user_id) ?? { points: 0, correct: 0, scored: 0 };
    agg.points += Number(r.points_earned) || 0;
    if (r.is_correct === true) agg.correct += 1;
    if (r.is_correct !== null) agg.scored += 1; // excluye anuladas (is_correct = null)
    byUser.set(r.user_id, agg);
  }

  const pushOut = await optedOutUserIds("push");
  let notified = 0, pushes = 0, skippedDedup = 0;

  for (const [uid, agg] of byUser) {
    if (agg.scored === 0) continue; // solo predicciones que puntuaron (no anuladas)
    if (pushOut.has(uid)) continue;
    // Reserva idempotente: un único aviso por usuario y partido.
    if (!(await reserveDedup(uid, kind, dedupKey))) { skippedDedup += 1; continue; }

    const acerto = agg.correct > 0;
    const signo = agg.points >= 0 ? "+" : "";
    const title = acerto
      ? `¡Acertaste! ${signo}${agg.points} pts`
      : `Tu predicción de ${label} se resolvió`;
    const body = acerto
      ? `${label}: ${agg.correct}/${agg.scored} aciertos · ${signo}${agg.points} pts. Mira cómo vas en el ranking.`
      : `${label}: ${signo}${agg.points} pts esta vez. Entra y prepárate para el próximo.`;

    const sent = await pushToUser(uid, {
      title,
      body,
      url: `${SITE}/app/predicciones`,
      tag: `prediction-resolved-${matchId}`,
      pushId: dedupKey,
    });
    if (sent > 0) { pushes += sent; notified += 1; }
  }

  return { match_id: matchId, candidates: byUser.size, notified, pushes, skipped_dedup: skippedDedup };
}
