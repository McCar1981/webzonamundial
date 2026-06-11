import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  POST /api/admin/push/image — sube una imagen para usarla en un push manual y
  devuelve su URL pública https. Así Carlos sube un archivo desde su equipo y el
  panel rellena la URL solo (no hay que buscar un hosting externo).

  Mismo patrón probado que /api/account/avatar:
    - server-side con service_role (determinista, valida MIME/size server-side).
    - Auth: cookie admin firmada (zm_admin), no sesión de usuario.

  El bucket "push-images" se crea solo (público) la primera vez, para no
  depender de configuración manual en Supabase.

  Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
*/

const BUCKET = "push-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (las imágenes de push pueden ser grandes)
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
  // 1. Auth admin
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie || !(await isValidAdminCookie(cookie))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // 2. Parse multipart
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario no válido." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  // 3. Validar MIME + tamaño server-side
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WEBP." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagen demasiado grande. Máximo 5 MB." },
      { status: 413 }
    );
  }

  // 4. Admin client
  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servidor sin SUPABASE_SERVICE_ROLE_KEY configurada." },
      { status: 503 }
    );
  }

  // 5. Asegurar bucket público (idempotente)
  try {
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      const { error: createErr } = await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_BYTES,
      });
      // Si otro request lo creó en paralelo, ignoramos "already exists".
      if (createErr && !/exist/i.test(createErr.message)) {
        return NextResponse.json(
          { error: `No se pudo preparar el almacén: ${createErr.message}` },
          { status: 500 }
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Almacén no disponible: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  // 6. Subir
  const ext = MIME_TO_EXT[file.type];
  const path = `manual/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "604800", // 7 días: la imagen es inmutable (nombre único)
  });
  if (uploadError) {
    return NextResponse.json(
      { error: `No se pudo subir: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // 7. URL pública
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
