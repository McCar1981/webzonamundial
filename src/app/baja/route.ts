// src/app/baja/route.ts
//
// Baja (unsubscribe) pública de la newsletter. El enlace llega en el pie de cada
// correo masivo con un token firmado (HMAC, válido 30 días). Al abrirlo se
// registra la baja en email_subscriptions (kind="newsletter") y se respeta en
// los siguientes envíos. No requiere sesión.

import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken, optOutNewsletter } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, msg: string): NextResponse {
  const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] as string));
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · ZonaMundial</title></head>
<body style="margin:0;background:#000000;color:#fff;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;">
  <div style="max-width:460px;text-align:center;background:#14110a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 28px;">
    <h1 style="font-size:22px;font-weight:800;margin:0;">${esc(title)}</h1>
    <p style="color:#a69a82;margin:12px 0 0;font-size:15px;line-height:1.6;">${esc(msg)}</p>
    <a href="https://zonamundial.app" style="display:inline-block;margin-top:20px;color:#c9a84c;font-size:14px;text-decoration:none;">Volver a ZonaMundial</a>
  </div>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return page("Enlace incompleto", "Falta el enlace de baja.");

  const v = verifyUnsubscribeToken(token);
  if (!v.ok || !v.email) {
    return page(
      "Enlace no válido",
      v.error === "expired"
        ? "El enlace ha caducado. Puedes gestionar tus correos desde tu cuenta."
        : "El enlace no es válido.",
    );
  }

  const r = await optOutNewsletter(v.email);
  if (!r.ok) return page("No se pudo dar de baja", "Inténtalo de nuevo más tarde.");

  return page(
    "Te has dado de baja",
    `${v.email} ya no recibirá nuestros correos de novedades. Puedes reactivarlos desde tu cuenta cuando quieras.`,
  );
}
