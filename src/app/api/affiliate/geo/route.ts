// src/app/api/affiliate/geo/route.ts
//
// Devuelve si el visitante actual (por su IP) puede ver el CTA de apuestas
// (afiliado 1xBet) y, si procede, el enlace. FAIL-CLOSED: solo allowed:true para
// paises LATAM permitidos (ver lib/affiliate/geo.ts). Espana y pais desconocido
// -> allowed:false, url:null. Lo consumen los CTA de cliente en las paginas de
// predicciones y match center.

import { NextResponse } from "next/server";
import { visitorCanSeeBetting, BET_AFFILIATE_URL } from "@/lib/affiliate/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const allowed = visitorCanSeeBetting();
  return NextResponse.json({
    allowed,
    url: allowed ? BET_AFFILIATE_URL : null,
  });
}
