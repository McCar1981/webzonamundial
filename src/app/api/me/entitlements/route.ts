// src/app/api/me/entitlements/route.ts
// GET /api/me/entitlements
//
// Estado Pro/Founder del usuario en sesión, para que la UI pinte badges,
// oculte anuncios y muestre candados/paywalls. NO es un muro de seguridad:
// el enforcement real vive en cada ruta API con isPro() server-side.
//
// Sin sesión devuelve el estado Free (200, no 401): el layout lo consulta
// también para visitantes anónimos.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getEntitlements } from "@/lib/pro/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      isPro: false,
      isFounder: false,
      source: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }

  const ent = await getEntitlements(user.id, user.email);
  return NextResponse.json({ authenticated: true, ...ent });
}
