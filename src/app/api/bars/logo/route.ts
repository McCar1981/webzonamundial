// src/app/api/bars/logo/route.ts
//
// POST   /api/bars/logo — sube una imagen del bar del dueño (multipart/form-data).
// DELETE /api/bars/logo — elimina la imagen actual del bar del dueño.
//
// Sirve dos imágenes según ?kind= (o campo "kind" del form): "logo" (por
// defecto) y "cover" (portada). Mismo patrón que /api/account/avatar: subida
// server-side con service_role (determinista, valida MIME/size en el server,
// no confía en el browser). Se guarda en el bucket público "bar-logos" bajo
// <barId>/<kind>.<ext> y la URL pública resultante se guarda en la columna
// correspondiente (logo_url o cover_url).
//
// Auth: sesión por cookies. El bar es SIEMPRE el del usuario (getBarByOwner),
// nunca un id del body → un atacante no puede tocar imágenes ajenas.

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

// Tipo de imagen → columna del bar. "logo" por defecto.
function resolveKind(raw: string | null): { kind: "logo" | "cover"; column: "logo_url" | "cover_url" } {
  return raw === "cover"
    ? { kind: "cover", column: "cover_url" }
    : { kind: "logo", column: "logo_url" };
}

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

  const { kind, column } = resolveKind(
    new URL(request.url).searchParams.get("kind") ?? (form.get("kind") as string | null),
  );

  // 4. Validar MIME + size en server
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WEBP o SVG." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande. Máximo 2 MB." }, { status: 413 });
  }

  const admin = adminClient();
  const ext = MIME_TO_EXT[file.type];
  const path = `${bar.id}/${kind}.${ext}`;

  // 5. Limpia versiones previas de ESTE tipo (evita huérfanos al cambiar de
  //    extensión). No toca el otro tipo (logo vs cover conviven).
  try {
    const { data: existing } = await admin.storage.from(BUCKET).list(bar.id);
    if (existing && existing.length > 0) {
      const toRemove = existing
        .filter((f) => f.name.startsWith(`${kind}.`))
        .map((f) => `${bar.id}/${f.name}`)
        .filter((p) => p !== path);
      if (toRemove.length > 0) await admin.storage.from(BUCKET).remove(toRemove);
    }
  } catch (err) {
    console.warn(`[bar-${kind}] cleanup failed:`, (err as Error).message);
  }

  // 6. Subir
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    upsert: true, contentType: file.type, cacheControl: "3600",
  });
  if (uploadError) {
    console.error(`[bar-${kind}] upload failed:`, uploadError.message);
    return NextResponse.json({ error: `No se pudo subir: ${uploadError.message}` }, { status: 500 });
  }

  // 7. URL pública + cache-bust
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  // 8. Guardar en la columna correspondiente
  const updated = await updateBar(user.id, { [column]: url });
  if (!updated) {
    return NextResponse.json({ error: "Imagen subida pero error guardando el bar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url, bar: updated });
}

export async function DELETE(request: NextRequest) {
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  const { kind, column } = resolveKind(new URL(request.url).searchParams.get("kind"));

  const admin = adminClient();
  const { data: existing } = await admin.storage.from(BUCKET).list(bar.id);
  if (existing && existing.length > 0) {
    const toRemove = existing.filter((f) => f.name.startsWith(`${kind}.`)).map((f) => `${bar.id}/${f.name}`);
    if (toRemove.length > 0) await admin.storage.from(BUCKET).remove(toRemove);
  }

  const updated = await updateBar(user.id, { [column]: null });
  if (!updated) return NextResponse.json({ error: "Error limpiando el bar." }, { status: 500 });
  return NextResponse.json({ ok: true, bar: updated });
}
