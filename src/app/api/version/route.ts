// src/app/api/version/route.ts
//
// Devuelve el identificador del deploy activo. Lo sondea <UpdateToast/> para
// detectar que salió una versión nueva y ofrecer "Actualizar" — sin esto, la
// PWA instalada puede quedarse con la versión vieja hasta un Ctrl+F5 manual
// (doloroso con deploys diarios en pleno Mundial).

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// En Vercel cada deploy trae su SHA; en local cae a "dev" (el toast nunca
// salta porque la versión no cambia entre fetches).
const VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "dev";

export async function GET() {
  return NextResponse.json(
    { version: VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
