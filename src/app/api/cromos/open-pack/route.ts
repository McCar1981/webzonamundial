// src/app/api/cromos/open-pack/route.ts
//
// POST /api/cromos/open-pack → abre un sobre de 3 cromos (auth, cooldown).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { openPack, getPackStatus } from "@/lib/cromos/collection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = await getPackStatus(user.id);
  if (!status.canOpen) {
    return NextResponse.json(
      { error: "pack_on_cooldown", nextPackAt: status.nextPackAt, secondsLeft: status.secondsLeft },
      { status: 429 },
    );
  }

  try {
    const result = await openPack(user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[open-pack] error:", err);
    const msg = err instanceof Error ? err.message : "open_failed";
    if (msg === "pack_on_cooldown") {
      const s = await getPackStatus(user.id);
      return NextResponse.json(
        { error: "pack_on_cooldown", nextPackAt: s.nextPackAt, secondsLeft: s.secondsLeft },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
