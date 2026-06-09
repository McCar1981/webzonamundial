// GET /api/stories/templates
//
// Templates disponibles para que el usuario cree su propia Story. Free = solo
// los 3 básicos; premium = todos. (El gating premium real se resuelve cuando
// haya sesión + plan; por ahora devuelve todos con su flag `premium`.)

import { NextResponse } from "next/server";
import { USER_TEMPLATES } from "@/lib/stories/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ templates: USER_TEMPLATES });
}
