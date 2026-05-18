// GET  /api/notifications/preferences        \u2192 list user's prefs
// POST /api/notifications/preferences        \u2192 upsert single pref
//   Body: { category: string, channel: string, enabled: boolean }
//
// Las prefs determinan qu\u00e9 categor\u00edas recibe el user, por qu\u00e9 canal.
// El cron de noticias y el cron de digest filtran por estas filas
// antes de enviar.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  listUserPreferences,
  setPreference,
  type NotificationCategory,
  type NotificationChannel,
} from "@/lib/notification-preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: NotificationCategory[] = [
  "news",
  "fav-team",
  "tournament-key-events",
  "predictions-reminder",
  "fantasy",
  "blog-posts",
  "creators",
];
const VALID_CHANNELS: NotificationChannel[] = ["push", "email", "in-app"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }
  const prefs = await listUserPreferences(user.id);
  return NextResponse.json({ ok: true, prefs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  let body: { category?: string; channel?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { category, channel, enabled } = body;
  if (
    !category ||
    !VALID_CATEGORIES.includes(category as NotificationCategory)
  ) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }
  if (!channel || !VALID_CHANNELS.includes(channel as NotificationChannel)) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "invalid_enabled" }, { status: 400 });
  }

  const result = await setPreference({
    userId: user.id,
    category: category as NotificationCategory,
    channel: channel as NotificationChannel,
    enabled,
  });
  if (!result.ok) {
    console.error("[prefs] setPreference failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
