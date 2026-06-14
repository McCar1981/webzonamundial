// src/app/api/cromos/pack-status/route.ts
//
// GET /api/cromos/pack-status → estado del cooldown del sobre gratuito.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPackStatus } from "@/lib/cromos/collection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = await getPackStatus(user.id);
  return NextResponse.json(status);
}
