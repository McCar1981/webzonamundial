import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@zonamundial.app';

const hasCredentials = SMTP_HOST && SMTP_USER && SMTP_PASS;

const transporter = hasCredentials
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

if (!transporter) {
  console.warn('[Email] SMTP no configurado. Los emails de bienvenida no se enviarán.');
}

export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  if (!transporter) {
    console.log('[Email] Skip welcome email: SMTP not configured');
    return;
  }

  const subject = 'Bienvenido a ZonaMundial 2026';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #0f172a, #0b1825); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">ZonaMundial</h1>
        <p style="color: #e5e7eb; margin: 8px 0 0;">La plataforma de predicciones, fantasy y engagement para el Mundial 2026</p>
      </div>
      <div style="padding: 32px; background: #ffffff; border-radius: 0 0 16px 16px;">
        <h2 style="margin-top: 0; color: #111827;">Hola, ${escapeHtml(username)}</h2>
        <p style="line-height: 1.6;">
          Tu registro en <strong>ZonaMundial</strong> se ha completado correctamente.
          Ya formas parte de la comunidad que vivirá el Mundial 2026 como nunca antes.
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li>Predicciones en vivo</li>
          <li>Fantasy League</li>
          <li>Rankings y competiciones</li>
          <li>Contenido exclusivo de creadores</li>
        </ul>
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://zonamundial.app" style="display: inline-block; padding: 12px 24px; background: #C9A84C; color: #030712; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Explorar plataforma
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          Si no realizaste este registro, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ZonaMundial" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${to}:`, error);
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Envía un email genérico con la plantilla visual de ZonaMundial.
 * Devuelve true si SMTP está activo y el envío no lanzó error.
 * No bloquea la respuesta del API si falla.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!transporter) {
    console.log(`[Email] Skip ${opts.subject}: SMTP not configured`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"ZonaMundial" <${SMTP_FROM}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (error) {
    console.error(`[Email] Failed: ${opts.subject} → ${opts.to}:`, error);
    return false;
  }
}

/** Layout HTML compartido por todos los emails transaccionales. */
export function brandedEmail(opts: {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaHref
      ? `<div style="text-align: center; margin-top: 28px;">
           <a href="${opts.ctaHref}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #C9A84C, #FDE68A); color: #1A1208; text-decoration: none; border-radius: 99px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;">
             ${escapeHtml(opts.ctaLabel)}
           </a>
         </div>`
      : '';
  const preheader = opts.preheader
    ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(opts.preheader)}</div>`
    : '';
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B1825;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1825;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:Arial,sans-serif;color:#1f2937;">
      <tr><td style="background:linear-gradient(135deg,#0f172a,#0b1825);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
        <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:-0.02em;">ZonaMundial</h1>
        <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">Mundial 2026 · USA · México · Canadá</p>
      </td></tr>
      <tr><td style="padding:32px;background:#ffffff;border-radius:0 0 16px 16px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;letter-spacing:-0.02em;">${escapeHtml(opts.heading)}</h2>
        <div style="line-height:1.6;color:#1f2937;font-size:15px;">${opts.bodyHtml}</div>
        ${cta}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
        <p style="font-size:12px;color:#6b7280;text-align:center;margin:0;">
          ZonaMundial · zonamundial.app — Si no esperabas este email, puedes ignorarlo.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/**
 * Notificación interna: nos avisa cada vez que alguien completa el
 * registro en /registro. Destinatario fijo gol@zonamundial.app.
 *
 * Es fire-and-forget: si Resend falla no rompemos la respuesta al
 * usuario que se acaba de registrar.
 *
 * Por privacidad NO incluye IP ni User Agent — solo los datos que el
 * propio usuario nos dio voluntariamente y que ya tienen en perfil.
 */
export async function sendNewRegistrationNotification(opts: {
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  favTeam?: string | null;
  favCreator?: string | null;
}): Promise<boolean> {
  const fullName = [opts.firstName, opts.lastName].filter(Boolean).join(' ') || '—';
  const country = opts.country ? opts.country.toUpperCase() : '—';
  const favTeam = opts.favTeam || '—';
  const favCreator = opts.favCreator || '—';
  const fechaIso = new Date().toISOString();
  // Render legible europeo: 18/05/2026 14:32 (Madrid).
  const fechaLegible = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return sendEmail({
    to: 'gol@zonamundial.app',
    subject: `Nuevo registro: ${opts.username} (${opts.email})`,
    html: brandedEmail({
      preheader: `Nuevo registro: ${opts.username} desde ${country}`,
      heading: '🎉 Nuevo registro en ZonaMundial',
      bodyHtml: `
        <p style="margin:0 0 16px;">Una persona acaba de completar el pre-registro:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border-radius:10px;padding:4px;">
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;width:40%;">Nombre</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;">${escapeHtml(fullName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Usuario</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">@${escapeHtml(opts.username)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Email</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">
              <a href="mailto:${escapeHtml(opts.email)}" style="color:#C9A84C;text-decoration:none;">${escapeHtml(opts.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">País</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(country)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Selección favorita</td>
            <td style="padding:10px 14px;font-size:14px;color:#C9A84C;font-weight:700;text-align:right;border-top:1px solid #e5e7eb;text-transform:capitalize;">★ ${escapeHtml(favTeam)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Creador elegido</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;text-transform:capitalize;">${escapeHtml(favCreator)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Fecha</td>
            <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(fechaLegible)} <span style="color:#9ca3af;font-weight:400;font-size:11px;">(Madrid)</span></td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#6b7280;">
          ISO timestamp: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:11px;">${escapeHtml(fechaIso)}</code>
        </p>
      `,
      ctaLabel: 'Ver lista de registros',
      ctaHref: 'https://zonamundial.app/admin/registros',
    }),
  });
}

/**
 * Email digest diario de noticias.
 *
 * Lo envía el cron /api/cron/send-daily-digest a las 07:00 UTC (09:00 Madrid)
 * a cada suscriptor activo. Incluye los TOP titulares publicados en las
 * últimas 24h con imagen + excerpt + link y un footer RGPD con link de
 * unsubscribe firmado HMAC.
 */
export async function sendDailyDigest(opts: {
  to: string;
  unsubscribeUrl: string;
  articles: Array<{
    title: string;
    slug: string;
    excerpt: string;
    image?: string | null;
    date: string;
    cat: string;
  }>;
}): Promise<boolean> {
  if (opts.articles.length === 0) return false;
  const today = new Date().toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const articlesHtml = opts.articles
    .map((a, idx) => {
      const url = `https://zonamundial.app/noticias/${a.slug}`;
      const img = a.image
        ? `<img src="${escapeHtml(a.image)}" alt="" width="100%" style="display:block;width:100%;max-width:520px;height:auto;border-radius:10px;margin-bottom:12px;">`
        : "";
      const isLast = idx === opts.articles.length - 1;
      return `
        <tr><td style="padding:${idx === 0 ? "0" : "24px 0 0"};">
          ${img}
          <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8C7437;font-weight:700;">
            ${escapeHtml(a.cat)}
          </p>
          <h3 style="margin:0 0 8px;font-size:18px;line-height:1.3;color:#111827;font-weight:700;letter-spacing:-0.01em;">
            <a href="${url}" style="color:#111827;text-decoration:none;">${escapeHtml(a.title)}</a>
          </h3>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#3D3D5C;">
            ${escapeHtml(a.excerpt)}
          </p>
          <p style="margin:0;">
            <a href="${url}" style="font-size:13px;color:#C9A84C;text-decoration:none;font-weight:600;letter-spacing:0.02em;">
              Leer artículo completo →
            </a>
          </p>
          ${isLast ? "" : '<hr style="border:none;border-top:1px solid #EDE3CC;margin:24px 0 0;">'}
        </td></tr>
      `;
    })
    .join("");

  const articleCount = opts.articles.length;
  const subject = articleCount === 1
    ? "Tu resumen del Mundial 2026"
    : `Tu resumen del Mundial 2026 · ${articleCount} novedades`;

  return sendEmail({
    to: opts.to,
    subject,
    html: brandedEmail({
      preheader: `${articleCount} ${articleCount === 1 ? "novedad hoy" : "novedades hoy"} en ZonaMundial`,
      heading: `Buenos días, esto es lo más importante de hoy`,
      bodyHtml: `
        <p style="margin:0 0 24px;color:#6b7280;font-size:13px;letter-spacing:0.01em;">
          ${escapeHtml(today)}
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${articlesHtml}
        </table>
        <p style="margin:36px 0 0;padding-top:24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;line-height:1.6;">
          Recibes este email porque te suscribiste al resumen diario de ZonaMundial.<br>
          <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#C9A84C;text-decoration:underline;">
            Darse de baja
          </a> ·
          <a href="https://zonamundial.app/cuenta/notificaciones" style="color:#C9A84C;text-decoration:underline;">
            Gestionar notificaciones
          </a>
        </p>
      `,
      ctaLabel: "Ver todas las noticias",
      ctaHref: "https://zonamundial.app/noticias",
    }),
  });
}

/**
 * Confirmación de compra de un plan de bar (Porras Digitales para Bares).
 */
export async function sendBarPlanConfirmationEmail(opts: {
  to: string;
  barName: string;
  planName: string;
  amount: string;
  currency: string;
  dashboardUrl: string;
  receiptUrl?: string | null;
}): Promise<boolean> {
  const receiptLine = opts.receiptUrl
    ? `<p style="margin-top:14px;"><a href="${opts.receiptUrl}" style="color:#0066cc;">Descargar recibo oficial</a></p>`
    : '';
  return sendEmail({
    to: opts.to,
    subject: `Plan ${opts.planName} activado · ${opts.barName}`,
    html: brandedEmail({
      preheader: `La porra de ${opts.barName} ya está activa con el plan ${opts.planName}.`,
      heading: 'Tu porra de bar está activa',
      bodyHtml: `
        <p>El pago de <strong>${escapeHtml(opts.amount)} ${escapeHtml(opts.currency.toUpperCase())}</strong> para
        <strong>${escapeHtml(opts.barName)}</strong> se ha procesado correctamente.</p>
        <p>Ya tienes activo el plan <strong>${escapeHtml(opts.planName)}</strong>. Desde tu panel puedes:</p>
        <ul style="line-height:1.8;padding-left:20px;color:#1f2937;">
          <li>Publicar la página de tu bar y compartir el QR.</li>
          <li>Configurar premios y personalizar el aspecto.</li>
          <li>Abrir la pantalla TV para el local.</li>
          <li>Ver el ranking y las estadísticas de tu porra.</li>
        </ul>
        <p style="margin-top:18px;">Gracias por confiar en ZonaMundial para llenar tu bar en días de partido.</p>
        ${receiptLine}
      `,
      ctaLabel: 'Ir a mi panel del bar',
      ctaHref: opts.dashboardUrl,
    }),
  });
}

/**
 * Confirmación de compra del Founders Pass.
 */
export async function sendFounderConfirmationEmail(opts: {
  to: string;
  amount: string;
  currency: string;
  receiptUrl?: string | null;
}): Promise<boolean> {
  const receiptLine = opts.receiptUrl
    ? `<p style="margin-top:14px;"><a href="${opts.receiptUrl}" style="color:#0066cc;">Descargar recibo oficial</a></p>`
    : '';
  return sendEmail({
    to: opts.to,
    subject: '¡Bienvenido al Founders Pass de ZonaMundial!',
    html: brandedEmail({
      preheader: 'Tu Founders Pass está activo. Bienvenido al equipo fundador.',
      heading: '🏆 Eres Founder de ZonaMundial',
      bodyHtml: `
        <p>Tu pago de <strong>${escapeHtml(opts.amount)} ${escapeHtml(opts.currency.toUpperCase())}</strong> se ha procesado correctamente.</p>
        <p>A partir de ahora tienes:</p>
        <ul style="line-height:1.8;padding-left:20px;color:#1f2937;">
          <li>✅ <strong>Navegación sin publicidad</strong> en toda la plataforma</li>
          <li>📊 <strong>Estadísticas avanzadas</strong> (xG, mapas de calor, comparativas)</li>
          <li>🚀 <strong>Beta access</strong> a nuevas funcionalidades</li>
          <li>💎 <strong>Sticker pack exclusivo</strong> para WhatsApp e Instagram</li>
          <li>🏅 <strong>Insignia "Founders"</strong> visible en tu perfil para siempre</li>
        </ul>
        <p style="margin-top:18px;">Gracias por apoyar el proyecto. Sin tu Founders Pass, esta plataforma no existiría.</p>
        ${receiptLine}
      `,
      ctaLabel: 'Ir a mi cuenta',
      ctaHref: 'https://zonamundial.app/cuenta',
    }),
  });
}
