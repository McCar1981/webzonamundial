// src/app/api/bars/logo/route.ts
//
// POST   /api/bars/logo — sube el logo del bar del dueño (multipart/form-data).
// DELETE /api/bars/logo — elimina el logo actual del bar del dueño.
//
// Mismo patrón que /api/account/avatar: subida server-side con service_role
// (determinista, valida MIME/size en el server, no confía en el browser). El
// archivo se guarda en el bucket público "bar-logos" bajo <barId>/logo.<ext> y
// la URL pública resultante se guarda en bars.logo_url.
//
// Auth: sesión por cookies. El bar es SIEMPRE el del usuario (getBarByOwner),
// nunca un id del body → un atacante no puede tocar logos ajenos.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { getBarByOwner, updateBar } from "@/lib/bars/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "bar-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function POST(request: NextRequest) {
  // 1. Auth
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Bar del dueño
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  // 3. Parse multipart
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 4. Validar MIME + size en server
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WEBP o SVG." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande. Máximo 2 MB." }, { status: 413 });
  }

  const admin = adminClient();
  const ext = MIME_TO_EXT[file.type];
  const path = `${bar.id}/logo.${ext}`;

  // 5. Limpia logos previos del bar (evita huérfanos al cambiar de extensión)
  try {
    const { data: existing } = await admin.storage.from(BUCKET).list(bar.id);
    if (existing && existing.length > 0) {
      const toRemove = existing.map((f) => `${bar.id}/${f.name}`).filter((p) => p !== path);
      if (toRemove.length > 0) await admin.storage.from(BUCKET).remove(toRemove);
    }
  } catch (err) {
    console.warn("[bar-logo] cleanup failed:", (err as Error).message);
  }

  // 6. Subir
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    upsert: true, contentType: file.type, cacheControl: "3600",
  });
  if (uploadError) {
    console.error("[bar-logo] upload failed:", uploadError.message);
    return NextResponse.json({ error: `No se pudo subir: ${uploadError.message}` }, { status: 500 });
  }

  // 7. URL pública + cache-bust
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  // 8. Guardar en bars.logo_url
  const updated = await updateBar(user.id, { logo_url: url });
  if (!updated) {
    return NextResponse.json({ error: "Logo subido pero error guardando el bar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url, bar: updated });
}

export async function DELETE() {
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  const admin = adminClient();
  const { data: existing } = await admin.storage.from(BUCKET).list(bar.id);
  if (existing && existing.length > 0) {
    await admin.storage.from(BUCKET).remove(existing.map((f) => `${bar.id}/${f.name}`));
  }

  const updated = await updateBar(user.id, { logo_url: null });
  if (!updated) return NextResponse.json({ error: "Error limpiando el bar." }, { status: 500 });
  return NextResponse.json({ ok: true, bar: updated });
}
