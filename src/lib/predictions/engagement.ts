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
import { sendPushToSubscription, type PushPayload } from "@/lib/push-notifications";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";

const SITE = "https://zonamundial.app";
const CATEGORY = "predictions-reminder";
// Solo recordamos a quien tenga una cadena que valga la pena salvar.
const STREAK_REMINDER_MIN_DAYS = 2;
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
    let touched = false;

    // Push (si no ha desactivado el canal).
    if (!pushOut.has(uid)) {
      const sent = await pushToUser(uid, {
        title: `Tu racha de ${days} días está en peligro`,
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
          subject: `No pierdas tu racha de ${days} días en ZonaMundial`,
          html: brandedEmail({
            preheader: `Tu check-in diario te espera — racha de ${days} días en juego.`,
            heading: `Hola ${escapeHtml(name)}, tu racha está en juego`,
            bodyHtml: `
              <p style="margin:0 0 16px;">Llevas <strong>${days} días</strong> seguidos de check-in en Predicciones. Si no entras hoy, tu racha vuelve a cero.</p>
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
