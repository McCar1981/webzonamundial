// TEMPORARY — endpoint de prueba del email de bienvenida.
// GET /api/_test-welcome?token=...
//
// Envía el email de bienvenida con datos de ejemplo a un destinatario
// FIJO (no acepta destinatario por query → imposible usarlo como relay).
// Protegido además por un token. ELIMINAR tras la prueba.

import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = "cd6811b91e813881039bbaaf";
const FIXED_RECIPIENT = "cmzamudio81@hotmail.com";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await sendWelcomeEmail({
    to: FIXED_RECIPIENT,
    username: "carlos81",
    countryName: "España",
    teamName: "España",
    creatorName: "SVGiago",
  });

  return NextResponse.json({ ok: true, sentTo: FIXED_RECIPIENT });
}
