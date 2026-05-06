// GET /api/bracket/capsule/[hash]
// Devuelve la cápsula sellada (sin email para preservar privacidad básica).

import { NextRequest, NextResponse } from "next/server";
import { getCapsuleByHash } from "@/lib/bracket/timecapsule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { hash: string } }) {
  const cap = await getCapsuleByHash(params.hash);
  if (!cap) {
    return NextResponse.json({ error: "Cápsula no encontrada" }, { status: 404 });
  }
  // No revelamos email completo, solo dominio.
  const masked = (() => {
    const [local, dom] = cap.email.split("@");
    if (!dom) return cap.email;
    return `${local.slice(0, 2)}***@${dom}`;
  })();
  return NextResponse.json({
    hash: cap.hash,
    emailMasked: masked,
    champion: cap.champion,
    totalGoals: cap.totalGoals,
    sealedAt: cap.sealedAt,
    pickCount: Object.keys(cap.picks).length,
  });
}
