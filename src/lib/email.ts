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

/**
 * Email de BIENVENIDA. Se envía UNA vez, cuando el usuario completa el
 * onboarding (ver src/app/onboarding/actions.ts). Para entonces ya tiene
 * sesión iniciada — da igual si entró por Google, Apple o magic link —
 * así que NO es un email de "haz un paso más": es un email de bienvenida
 * con el RESUMEN de su registro (usuario, país, selección y, si eligió
 * uno, el creador cuya comunidad sigue).
 *
 * Todos los datos del resumen son opcionales: si faltan (p.ej. el usuario
 * hizo "saltar"), simplemente no se pintan esas filas.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  username: string;
  countryName?: string | null;
  teamName?: string | null;
  creatorName?: string | null;
}): Promise<void> {
  if (!transporter) {
    console.log('[Email] Skip welcome email: SMTP not configured');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zonamundial.app';

  // Filas del resumen — solo las que tienen valor.
  const summaryRows: Array<{ label: string; value: string; gold?: boolean }> = [
    { label: 'Usuario', value: `@${opts.username}` },
    { label: 'Email', value: opts.to },
  ];
  if (opts.countryName) {
    summaryRows.push({ label: 'País', value: opts.countryName });
  }
  if (opts.teamName) {
    summaryRows.push({ label: 'Selección favorita', value: `★ ${opts.teamName}`, gold: true });
  }
  if (opts.creatorName) {
    summaryRows.push({ label: 'Creador que sigues', value: opts.creatorName, gold: true });
  }

  const summaryHtml = summaryRows
    .map((row, i) => {
      const topBorder = i === 0 ? '' : 'border-top:1px solid #e5e7eb;';
      const valueColor = row.gold ? '#C9A84C' : '#111827';
      return `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;width:42%;${topBorder}">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;font-size:14px;color:${valueColor};font-weight:600;text-align:right;${topBorder}">${escapeHtml(row.value)}</td>
        </tr>`;
    })
    .join('');

  // Mensaje extra si sigue a un creador.
  const creatorLine = opts.creatorName
    ? `<p style="line-height:1.6;margin:0 0 16px;">Te has unido a la comunidad de
         <strong style="color:#8C7437;">${escapeHtml(opts.creatorName)}</strong>.
         Recibirás su contenido exclusivo y novedades dentro de la plataforma.</p>`
    : '';

  const subject = `¡Bienvenido a ZonaMundial, @${opts.username}!`;
  const html = brandedEmail({
    preheader: 'Tu cuenta está lista. Aquí tienes el resumen de tu registro.',
    heading: `¡Bienvenido, @${escapeHtml(opts.username)}!`,
    bodyHtml: `
      <p style="line-height:1.7;margin:0 0 18px;font-size:16px;color:#1f2937;">
        Tu cuenta en <strong style="color:#0f172a;">ZonaMundial</strong> ya está lista. 🎉
        Ya formas parte de la comunidad que vivirá el <strong>Mundial 2026</strong> como nunca antes.
      </p>
      ${creatorLine}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;overflow:hidden;margin:8px 0 4px;">
        <tr><td style="background:linear-gradient(135deg,#C9A84C,#FDE68A);padding:10px 16px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#1A1208;">★ Resumen de tu registro</span>
        </td></tr>
        <tr><td style="padding:2px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${summaryHtml}
          </table>
        </td></tr>
      </table>

      <p style="line-height:1.6;margin:28px 0 14px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:800;">
        Esto es lo que te espera dentro
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
        <tr>
          <td width="50%" valign="top" style="padding:0 6px 12px 0;">${featureCard('⚡', 'Predicciones en vivo', 'Acierta y escala el ranking')}</td>
          <td width="50%" valign="top" style="padding:0 0 12px 6px;">${featureCard('🏆', 'Fantasy League', 'Ficha a tus cracks y compite')}</td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding:0 6px 0 0;">${featureCard('📊', 'Rankings globales', 'Mide tu nivel cada jornada')}</td>
          <td width="50%" valign="top" style="padding:0 0 0 6px;">${featureCard('🎬', 'Creadores', 'Contenido exclusivo y retos')}</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#13233A);border-radius:12px;padding:18px 20px;text-align:center;">
          <p style="margin:0;color:#E7D9A8;font-size:14px;line-height:1.5;">
            Faltan pocos meses para el pitido inicial.<br>
            <strong style="color:#FDE68A;">Tu camino al Mundial empieza ahora.</strong>
          </p>
        </td></tr>
      </table>
    `,
    ctaLabel: 'Entrar a ZonaMundial',
    ctaHref: `${siteUrl}/app`,
  });

  try {
    await transporter.sendMail({
      from: `"ZonaMundial" <${SMTP_FROM}>`,
      to: opts.to,
      subject,
      html,
    });
    console.log(`[Email] Welcome email sent to ${opts.to}`);
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${opts.to}:`, error);
  }
}

/** Tarjeta de feature para emails de marketing (emoji + título + claim). */
function featureCard(emoji: string, title: string, claim: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#FFFBF0;border:1px solid #F0E2BF;border-radius:12px;">
    <tr><td style="padding:14px;">
      <div style="font-size:22px;line-height:1;">${emoji}</div>
      <div style="font-weight:700;color:#111827;font-size:14px;margin-top:8px;">${escapeHtml(title)}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:3px;line-height:1.4;">${escapeHtml(claim)}</div>
    </td></tr>
  </table>`;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zonamundial.app';
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
      <tr><td style="background:linear-gradient(135deg,#13233A,#0B1825 55%,#0E1A2B);padding:30px 32px 24px;text-align:center;border-radius:16px 16px 0 0;">
        <img src="${siteUrl}/img/email/logo-zonamundial.png" width="132" alt="ZonaMundial" style="display:inline-block;width:132px;max-width:132px;height:auto;border:0;outline:none;text-decoration:none;">
        <p style="color:#C9A84C;margin:14px 0 0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Mundial 2026</p>
        <p style="color:#7E94AD;margin:4px 0 0;font-size:12px;letter-spacing:0.08em;">USA · México · Canadá</p>
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
      preheader: `La peña de ${opts.barName} ya está activa con el plan ${opts.planName}.`,
      heading: 'Tu peña de bar está activa',
      bodyHtml: `
        <p>El pago de <strong>${escapeHtml(opts.amount)} ${escapeHtml(opts.currency.toUpperCase())}</strong> para
        <strong>${escapeHtml(opts.barName)}</strong> se ha procesado correctamente.</p>
        <p>Ya tienes activo el plan <strong>${escapeHtml(opts.planName)}</strong>. Desde tu panel puedes:</p>
        <ul style="line-height:1.8;padding-left:20px;color:#1f2937;">
          <li>Publicar la página de tu bar y compartir el QR.</li>
          <li>Configurar premios y personalizar el aspecto.</li>
          <li>Abrir la pantalla TV para el local.</li>
          <li>Ver el ranking y las estadísticas de tu peña.</li>
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
 * Email de alta en la PORRA DE UN BAR (módulo B2B).
 *
 * Se envía UNA sola vez, cuando un cliente del bar se une por primera vez a la
 * peña (ver src/app/api/bars/join/route.ts → !alreadyMember). A diferencia del
 * resto de correos, aquí el PROTAGONISTA es el BAR: su logo, su nombre y su
 * porra son el héroe del email; ZonaMundial aparece de forma SECUNDARIA (la
 * plataforma que lo hace posible) en el pie.
 *
 * IMPORTANTE: es una plantilla AUTÓNOMA (no usa brandedEmail, que lidera con el
 * logo de ZM) precisamente para no tocar ningún otro proceso de correo.
 */
export async function sendBarPorraWelcomeEmail(opts: {
  to: string;
  barName: string;
  barSlug: string;
  logoUrl?: string | null;
  accent?: string | null;     // color de acento del tema del bar
  accentInk?: string | null;  // color de texto sobre el acento
  prizeTitle?: string | null;
  entryFeeNote?: string | null;
}): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zonamundial.app';
  const accent = opts.accent || '#C9A84C';
  const accentInk = opts.accentInk || '#1A1208';
  const barName = escapeHtml(opts.barName);
  const barUrl = `${siteUrl}/b/${encodeURIComponent(opts.barSlug)}`;

  // Avatar del bar: logo si lo hay, si no la inicial sobre el acento.
  const avatar = opts.logoUrl
    ? `<img src="${escapeHtml(opts.logoUrl)}" width="84" height="84" alt="${barName}" style="display:block;width:84px;height:84px;border-radius:18px;object-fit:cover;border:3px solid ${accent};">`
    : `<div style="width:84px;height:84px;border-radius:18px;border:3px solid ${accent};background:#0F1D32;color:${accent};font-size:38px;font-weight:800;line-height:84px;text-align:center;">${escapeHtml(opts.barName.charAt(0).toUpperCase())}</div>`;

  const prizeBlock = opts.prizeTitle
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
         <tr><td style="background:#FFFBF0;border:1px solid #F0E2BF;border-radius:12px;padding:14px 18px;">
           <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#8C7437;">Premio principal</div>
           <div style="font-size:16px;font-weight:700;color:#111827;margin-top:4px;">${escapeHtml(opts.prizeTitle)}</div>
         </td></tr>
       </table>`
    : '';

  const feeBlock = opts.entryFeeNote && opts.entryFeeNote.trim()
    ? `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
         <strong style="color:#111827;">Inscripción:</strong> ${escapeHtml(opts.entryFeeNote.trim())}<br>
         <span style="font-size:12px;">La inscripción la cobra y la gestiona ${barName} directamente en el local. ZonaMundial no procesa este pago.</span>
       </p>`
    : '';

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B1825;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ya estás dentro de la porra de ${barName}. Predice los partidos del Mundial y compite por los premios del local.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1825;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:Arial,sans-serif;color:#1f2937;">
      <!-- HERO: el BAR es el protagonista -->
      <tr><td style="background:linear-gradient(135deg,#0F1D32,#0B1825);padding:34px 32px 28px;text-align:center;border-radius:16px 16px 0 0;">
        <div style="margin:0 auto 14px;width:84px;">${avatar}</div>
        <p style="color:${accent};margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">Peña Mundialista 2026</p>
        <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.2;letter-spacing:-0.02em;">${barName}</h1>
      </td></tr>
      <!-- CUERPO -->
      <tr><td style="padding:32px;background:#ffffff;border-radius:0 0 16px 16px;">
        <h2 style="margin:0 0 14px;color:#111827;font-size:21px;letter-spacing:-0.01em;">¡Ya estás dentro de la porra de ${barName}!</h2>
        <p style="line-height:1.7;margin:0 0 16px;font-size:15px;color:#1f2937;">
          Predice los partidos del <strong>Mundial 2026</strong> desde tu móvil, sube en el
          <strong>ranking de ${barName}</strong> y compite con el resto de la clientela del local.
        </p>
        ${prizeBlock}
        ${feeBlock}
        <div style="text-align:center;margin-top:26px;">
          <a href="${barUrl}" style="display:inline-block;padding:14px 30px;background:${accent};color:${accentInk};text-decoration:none;border-radius:99px;font-weight:800;font-size:15px;">
            Entrar a la porra de ${barName}
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0 16px;">
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;line-height:1.6;">
          Powered by <strong style="color:#6b7280;">ZonaMundial</strong> · zonamundial.app<br>
          Tu cuenta también te da acceso a toda la plataforma. Si no esperabas este email, puedes ignorarlo.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  return sendEmail({
    to: opts.to,
    subject: `Ya estás en la porra de ${opts.barName}`,
    html,
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
