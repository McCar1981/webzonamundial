import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  POST /api/account/avatar — sube un avatar.
  DELETE /api/account/avatar — elimina el avatar actual.

  Por qué un endpoint server-side y no upload directo desde el browser:

  El upload directo del SDK de Supabase desde el navegador devolvía 400
  intermitente — el JWT del browser no siempre se propagaba al backend
  de Storage en RLS, dependiendo del orden de creación de la sesión y
  del flujo OAuth (Google primer login). Hacerlo server-side con la
  service_role es:
    - 100% determinista (no depende de cómo viaje el JWT)
    - Validación server-side de MIME/size (no confiamos en el browser)
    - Una superficie clara para auditar
    - Mejor UX (errores reales, no "Bad Request" sin contexto)

  Auth: validamos sesión vía cookies HttpOnly (SSR client). El user.id
  que aceptamos es SIEMPRE el de la sesión, NUNCA el body. Así un
  atacante no puede sobrescribir avatares ajenos pasando otro id.

  Env vars:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const supa = createSupabaseServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse multipart
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 3. Validate MIME + size server-side (no confiamos en el browser)
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WEBP." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Archivo demasiado grande. Máximo 2 MB." },
      { status: 413 }
    );
  }

  // 4. Admin client (service_role bypasses RLS)
  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server misconfigured (avatar)." },
      { status: 503 }
    );
  }

  // 5. Limpia avatares previos del usuario para no acumular huérfanos
  //    cuando cambia de extensión (ej. .png → .jpg)
  const ext = MIME_TO_EXT[file.type];
  const path = `${user.id}/avatar.${ext}`;

  try {
    const { data: existing } = await admin.storage.from("avatars").list(user.id);
    if (existing && existing.length > 0) {
      const toRemove = existing
        .map((f) => `${user.id}/${f.name}`)
        .filter((p) => p !== path);
      if (toRemove.length > 0) {
        await admin.storage.from("avatars").remove(toRemove);
      }
    }
  } catch (err) {
    // No bloqueante: si falla la limpieza, seguimos con el upload
    console.warn("[avatar] cleanup failed:", (err as Error).message);
  }

  // 6. Subir el archivo
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[avatar] upload failed:", uploadError.message);
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // 7. Public URL + cache-bust para que el browser refresque
  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const cacheBusted = `${pub.publicUrl}?v=${Date.now()}`;

  // 8. Update profile.avatar_url (también usando admin para evitar RLS)
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: cacheBusted })
    .eq("id", user.id);

  if (updateError) {
    console.error("[avatar] profile update failed:", updateError.message);
    return NextResponse.json(
      { error: "Imagen subida pero error guardando el perfil." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, url: cacheBusted });
}

export async function DELETE() {
  const supa = createSupabaseServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server misconfigured (avatar)." },
      { status: 503 }
    );
  }

  // Lista + borra todos los archivos del usuario
  const { data: existing } = await admin.storage.from("avatars").list(user.id);
  if (existing && existing.length > 0) {
    const paths = existing.map((f) => `${user.id}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }

  // Limpia avatar_url
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Error limpiando perfil." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
