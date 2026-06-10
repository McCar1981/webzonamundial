// POST /api/admin/push/send — envío MANUAL de un push desde /admin/push.
//
// Autorización: protegido por el middleware /admin/* (cookie zm_admin firmada).
// Revalidamos aquí por defensa en profundidad: las route handlers son
// endpoints públicos por sí mismas.
//
// Dos modos:
//   { dryRun: true }  → NO envía; solo devuelve a cuántos suscriptores llegaría.
//   { dryRun: false } → envía a TODOS los suscriptores del `kind` elegido.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import {
  broadcastPush,
  listSubscriptionsForKind,
  type PushPayload,
} from "@/lib/push-notifications";
import type { NotificationCategory } from "@/lib/notification-preferences";

export const dynamic = "force-dynamic";

const KINDS: NotificationCategory[] = [
  "news",
  "fav-team",
  "tournament-key-events",
  "predictions-reminder",
  "fantasy",
  "blog-posts",
  "creators",
  "amistosos",
];

const DEFAULT_ICON = "/img/email/logo-zonamundial.png";

async function requireAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido." }, { status: 400 });
  }

  const kind = String(body.kind ?? "news");
  if (!KINDS.includes(kind as NotificationCategory)) {
    return NextResponse.json({ error: "Categoría no válida." }, { status: 400 });
  }

  // Modo comprobación: solo cuenta destinatarios, no envía.
  if (body.dryRun === true) {
    try {
      const subs = await listSubscriptionsForKind(kind);
      return NextResponse.json({ ok: true, dryRun: true, recipients: subs.length });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const url = String(body.url ?? "").trim() || "/app";
  const image = String(body.image ?? "").trim();

  if (title.length < 2) return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  if (text.length < 2) return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  if (title.length > 80) return NextResponse.json({ error: "Título máximo 80 caracteres." }, { status: 400 });
  if (text.length > 200) return NextResponse.json({ error: "Mensaje máximo 200 caracteres." }, { status: 400 });
  // Solo rutas internas o https para evitar destinos raros.
  if (!url.startsWith("/") && !url.startsWith("https://")) {
    return NextResponse.json({ error: "La URL debe empezar por / o https://" }, { status: 400 });
  }
  if (image && !image.startsWith("https://") && !image.startsWith("/")) {
    return NextResponse.json({ error: "La imagen debe ser una URL https:// o /ruta." }, { status: 400 });
  }

  const payload: PushPayload = {
    title,
    body: text,
    url,
    tag: `manual-${Date.now()}`,
    icon: DEFAULT_ICON,
    ...(image ? { image } : {}),
  };

  try {
    const result = await broadcastPush({ kind, payload });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
