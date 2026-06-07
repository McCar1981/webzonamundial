// src/lib/ops/alert.ts
//
// Canal de alertas al teléfono del CEO. Multi-canal con degradación elegante:
//   1. Telegram  (PRINCIPAL) — instantáneo y fiable; no depende de que la PWA
//                 tenga una subscription viva. Requiere TELEGRAM_BOT_TOKEN +
//                 TELEGRAM_CHAT_ID.
//   2. Web Push  (RESPALDO)  — reutiliza la infra existente (web-push/VAPID).
//                 Envía a los user_ids de OPS_PUSH_USER_IDS.
//   3. Email     (RED DE SEGURIDAD) — sólo para severidad critical, vía SMTP.
//
// Anti-spam: throttle por `key`. Mientras un incidente sigue activo, re-alerta
// como mucho cada `repeatMinutes`. Las recuperaciones (status ok) saltan el
// throttle para que siempre te enteres de que "ya está arreglado".

import { throttleAllow, type Severity } from "./store";
import { sendPushToUsers } from "@/lib/push-notifications";

export interface OpsAlert {
  // Clave estable del incidente (p.ej. "supabase_down"). Agrupa y deduplica.
  key: string;
  severity: Severity;
  title: string;
  body: string;
  // true = mensaje de recuperación; ignora el throttle.
  recovery?: boolean;
  // Minutos mínimos entre re-alertas del mismo key mientras siga activo.
  repeatMinutes?: number;
  // URL profunda para abrir el panel desde la notificación.
  url?: string;
}

const SEVERITY_EMOJI: Record<Severity, string> = {
  ok: "✅",
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

function opsUserIds(): string[] {
  return (process.env.OPS_PUSH_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // No queremos que una alerta cuelgue el monitor.
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendWebPush(alert: OpsAlert): Promise<boolean> {
  const userIds = opsUserIds();
  if (userIds.length === 0) return false;
  try {
    const r = await sendPushToUsers({
      userIds,
      payload: {
        title: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
        body: alert.body,
        url: alert.url || "/admin/monitor",
        tag: `ops-${alert.key}`,
        requireInteraction: alert.severity === "critical",
      },
    });
    return r.sent > 0;
  } catch {
    return false;
  }
}

async function sendEmailFallback(alert: OpsAlert): Promise<boolean> {
  const to = process.env.OPS_ALERT_EMAIL || process.env.CRON_REPORT_EMAIL;
  if (!to) return false;
  try {
    // Import dinámico: el módulo de email arrastra nodemailer; sólo lo cargamos
    // si de verdad caemos al canal de red de seguridad.
    const { sendEmail, brandedEmail } = await import("@/lib/email");
    const html = brandedEmail({
      preheader: alert.title,
      heading: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
      bodyHtml: `<p>${alert.body}</p><p style="font-size:12px;color:#6b7280">Alerta automática del centro de control ZM.</p>`,
      ctaLabel: "Abrir panel de control",
      ctaHref: `${process.env.NEXT_PUBLIC_SITE_URL || "https://zonamundial.app"}/admin/monitor`,
    });
    return await sendEmail({ to, subject: `${SEVERITY_EMOJI[alert.severity]} ZM Ops · ${alert.title}`, html });
  } catch {
    return false;
  }
}

/**
 * Punto de entrada único. Decide throttle y dispara los canales disponibles.
 * Devuelve qué canales lograron entregar (para diagnóstico/telemetría).
 */
export async function sendOpsAlert(
  alert: OpsAlert,
): Promise<{ sent: boolean; channels: string[]; throttled: boolean }> {
  const repeat = alert.repeatMinutes ?? 15;
  // Las recuperaciones siempre pasan; el resto respeta la ventana de throttle.
  if (!alert.recovery) {
    const allowed = await throttleAllow(`alert:${alert.key}`, repeat * 60);
    if (!allowed) return { sent: false, channels: [], throttled: true };
  }

  const stamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  const text =
    `${SEVERITY_EMOJI[alert.severity]} <b>${alert.title}</b>\n` +
    `${alert.body}\n` +
    `<i>${alert.severity.toUpperCase()} · ${stamp}</i>`;

  const channels: string[] = [];
  if (await sendTelegram(text)) channels.push("telegram");
  if (await sendWebPush(alert)) channels.push("webpush");
  // Email sólo para lo grave (o si ningún otro canal entregó).
  if (alert.severity === "critical" || channels.length === 0) {
    if (await sendEmailFallback(alert)) channels.push("email");
  }

  return { sent: channels.length > 0, channels, throttled: false };
}
