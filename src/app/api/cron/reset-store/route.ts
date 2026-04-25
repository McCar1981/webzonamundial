/**
 * Admin endpoint: wipes the KV ingest store.
 * Useful when filter rules change and we need to regenerate all autopublished
 * articles from scratch. Protected by CRON_SECRET.
 *
 * Usage:
 *   GET /api/cron/reset-store
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { writeIngestStore } from "@/lib/noticias-store";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  await writeIngestStore({ generatedAt: new Date().toISOString(), drafts: [] });

  return NextResponse.json({
    ok: true,
    message: "Store wiped. Trigger /api/cron/ingest-news to repopulate.",
  });
}

export const dynamic = "force-dynamic";
