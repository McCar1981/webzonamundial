// src/app/r/[qrCode]/route.ts
//
// Redirección de QR dinámico. El cartel/mesa/TV del bar apunta a /r/{code};
// aquí se cuenta el escaneo, se registra el evento y se redirige a la página
// pública del bar con los UTMs de esa fuente QR (para atribución y analytics).
//
// Si el código no existe, se manda a la landing comercial de bares.

import { NextRequest, NextResponse } from "next/server";
import { resolveQrScan } from "@/lib/bars/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { qrCode: string } }) {
  const origin = new URL(req.url).origin;
  const resolved = await resolveQrScan(params.qrCode);

  if (!resolved) {
    return NextResponse.redirect(`${origin}/bares`, { status: 302 });
  }

  const { bar, qr } = resolved;
  const dest = new URL(`${origin}/b/${bar.slug}`);
  dest.searchParams.set("utm_source", qr.utm_source);
  dest.searchParams.set("utm_medium", qr.utm_medium);
  dest.searchParams.set("utm_campaign", qr.utm_campaign);
  dest.searchParams.set("utm_content", qr.utm_content);
  dest.searchParams.set("qr", qr.code);
  return NextResponse.redirect(dest.toString(), { status: 302 });
}
