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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
