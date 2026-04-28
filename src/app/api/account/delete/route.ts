import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  POST /api/account/delete

  Borra la cuenta del usuario autenticado. Borrar de auth.users requiere
  la service_role key (admin), que NUNCA debe ir al frontend. Por eso
  vive aquí en una API route server-only.

  Defensa en profundidad:
    1. Validamos sesión via SSR client (cookies HttpOnly).
    2. Comparamos user.id de la sesión con cualquier id que venga en
       el body (no aceptamos user_id por parámetro). El admin client
       solo puede borrar el id que confirmó la sesión.
    3. RLS + ON DELETE CASCADE en profiles → al borrar el user de
       auth.users, su row de profiles cae automáticamente.

  Env vars:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY      ← MARCAR Sensitive en Vercel
*/
export async function POST(_request: NextRequest) {
  // 1. Verifica sesión vía cookies del browser (SSR client)
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Configura admin client (service_role)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[account/delete] SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 503 }
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3. Borra del auth.users (cascade limpia profiles + storage objects?)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete] deleteUser error:", error.message);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  // 4. Limpieza extra: borrar avatares del Storage (no cae por cascade)
  try {
    const { data: list } = await admin.storage.from("avatars").list(user.id);
    if (list && list.length > 0) {
      const paths = list.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("avatars").remove(paths);
    }
  } catch (err) {
    // No bloqueante: si falla la limpieza de storage, el user ya está
    // borrado de auth y profiles. Logueamos y seguimos.
    console.warn("[account/delete] avatar cleanup failed:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
