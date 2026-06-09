// POST /api/stories/create
//
// Crea una Story del usuario a partir de un template. Body:
//   { template_id: string, overlay_text: string, template_data?: object }

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { createUserStory } from "@/lib/stories/store";
import { getTemplate } from "@/lib/stories/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await safeCurrentUser();
  // En local (sin auth) usamos un id demo para poder probar el flujo.
  const userId = user?.id ?? "demo-user";

  let body: {
    template_id?: string;
    overlay_text?: string;
    template_data?: Record<string, unknown>;
    media_type?: string;
    media_url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const isPhoto = body.media_type === "image";

  // Modo foto: requiere media_url (sin plantilla). Modo cromo: requiere plantilla.
  if (isPhoto) {
    if (!body.media_url) {
      return NextResponse.json({ error: "missing_media" }, { status: 400 });
    }
  } else if (!body.template_id || !getTemplate(body.template_id)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const overlay = (body.overlay_text ?? "").trim();
  // En foto el texto es opcional (puede ir solo con stickers); en cromo es obligatorio.
  if (!isPhoto && !overlay) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  try {
    const story = await createUserStory(userId, {
      templateId: isPhoto ? null : body.template_id ?? null,
      overlayText: overlay,
      mediaType: isPhoto ? "image" : "template",
      mediaUrl: isPhoto ? body.media_url ?? null : null,
      templateData: body.template_data,
    });
    return NextResponse.json({ ok: true, story }, { status: 201 });
  } catch (e) {
    // Devolvemos el motivo real del fallo (p. ej. columna media_url muy corta,
    // RLS, etc.) para no quedarnos con un "no se pudo crear" opaco.
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "create_failed", detail }, { status: 500 });
  }
}
