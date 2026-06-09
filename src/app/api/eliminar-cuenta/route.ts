// src/app/api/eliminar-cuenta/route.ts
//
// Endpoint que recibe solicitudes de eliminación de cuenta (RGPD art. 17,
// "derecho al olvido"). Genera dos emails con el mismo transporter SMTP que
// el resto del sistema: uno interno a soporte para iniciar el procedimiento
// y otro al usuario confirmando la recepción de la solicitud.
//
// No borra nada automáticamente — el proceso es manual y se completa en
// hasta 30 días según política de privacidad del proyecto.

import { NextResponse } from "next/server";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || "soporte@zonamundial.app";

interface DeleteRequestBody {
  email?: string;
  username?: string;
  motivo?: string;
}

function isValidEmail(s: string): boolean {
  // RFC 5322 ligera — suficiente para evitar basura obvia.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { ok: false, error: "Se requiere iniciar sesión" },
      { status: 401 },
    );
  }

  let body: DeleteRequestBody;
  try {
    body = (await req.json()) as DeleteRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const email = (body.email || "").trim();
  // H-001-09: el email debe coincidir con el de la sesión para evitar
  // email-bombing a víctimas arbitrarias.
  if (email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "El email no coincide con tu cuenta" },
      { status: 403 },
    );
  }
  const username = (body.username || "").trim();
  const motivo = (body.motivo || "").trim().slice(0, 1000);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email inválido" },
      { status: 400 },
    );
  }
  if (!username || username.length < 2 || username.length > 80) {
    return NextResponse.json(
      { ok: false, error: "Nombre de usuario requerido (2-80 caracteres)" },
      { status: 400 },
    );
  }

  const requestedAt = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconocida";

  // 1) Email interno a soporte — el equipo lo procesa manualmente.
  const internalHtml = brandedEmail({
    preheader: `Solicitud de eliminación: ${email}`,
    heading: "Nueva solicitud de eliminación de cuenta (RGPD)",
    bodyHtml: `
      <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.6">
        Se ha recibido una solicitud de eliminación de cuenta a través del formulario público de
        <strong>/eliminar-cuenta</strong>. Procesar antes de <strong>${escapeHtml(
          new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString("es-ES"),
        )}</strong> (plazo máximo 30 días según política).
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:140px">Email</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Usuario</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(username)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Solicitado</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px">${escapeHtml(requestedAt)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px">IP</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-family:monospace">${escapeHtml(ip)}</td></tr>
      </table>
      ${
        motivo
          ? `<p style="margin:16px 0 8px;color:#64748b;font-size:13px">Motivo indicado por el usuario:</p>
             <blockquote style="margin:0;padding:12px 16px;background:#f1f5f9;border-left:3px solid #c9a84c;color:#0f172a;font-size:14px;line-height:1.6;border-radius:4px">${escapeHtml(motivo)}</blockquote>`
          : `<p style="margin:16px 0;color:#94a3b8;font-size:13px;font-style:italic">El usuario no indicó motivo.</p>`
      }
    `,
  });

  // 2) Email al usuario — confirmación + plazo de 30 días.
  const userHtml = brandedEmail({
    preheader:
      "Tu solicitud de eliminación de cuenta ha sido recibida. Procesaremos en 30 días.",
    heading: "Hemos recibido tu solicitud",
    bodyHtml: `
      <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.6">
        Hola <strong>${escapeHtml(username)}</strong>, hemos registrado correctamente tu solicitud
        de eliminación de cuenta en ZonaMundial.
      </p>
      <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.6">
        Procederemos al borrado de tus datos personales en un plazo máximo de
        <strong>30 días naturales</strong>. Una vez completado, recibirás un
        email final confirmando que tu cuenta y datos asociados han sido
        eliminados.
      </p>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6">
        Qué se elimina: tu cuenta de usuario, tus predicciones, tu historial de
        actividad y los datos personales que tengamos asociados a tu email
        (${escapeHtml(email)}).
      </p>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6">
        Datos agregados y anónimos (rankings históricos, estadísticas globales
        sin identificación personal) pueden conservarse hasta 90 días
        adicionales, conforme a nuestra política de privacidad.
      </p>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6">
        Si esta solicitud no fue hecha por ti, escribe inmediatamente a
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#c9a84c">${SUPPORT_EMAIL}</a>
        antes del plazo de 30 días para cancelarla.
      </p>
    `,
  });

  // Disparamos los dos envíos en paralelo. Si SMTP no está configurado,
  // sendEmail devuelve false sin lanzar, así que la respuesta al cliente
  // sigue siendo positiva (la solicitud queda registrada en logs del servidor).
  const [internalOk, userOk] = await Promise.all([
    sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[RGPD] Solicitud de eliminación: ${username}`,
      html: internalHtml,
    }),
    sendEmail({
      to: email,
      subject: "Solicitud de eliminación de cuenta recibida — ZonaMundial",
      html: userHtml,
    }),
  ]);

  // Log para auditoría (Vercel guarda 24-72h en Hobby; suficiente como respaldo
  // si el envío SMTP falla y hay que reprocesar manualmente).
  console.log(
    `[eliminar-cuenta] ${requestedAt} email=${email} user=${username} ip=${ip} internal=${internalOk} user=${userOk}`,
  );

  return NextResponse.json({
    ok: true,
    message: "Solicitud recibida. Procesaremos la eliminación en 30 días.",
    requestedAt,
  });
}
