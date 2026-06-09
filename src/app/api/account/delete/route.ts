import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  POST /api/account/delete

  Borra la cuenta del usuario autenticado de forma completa (GDPR).
  Borrar de auth.users requiere la service_role key (admin).

  Defensa en profundidad:
    1. Validamos sesión via SSR client (cookies HttpOnly).
    2. El admin client solo puede borrar el id que confirmó la sesión.
    3. ON DELETE CASCADE limpia profiles, predictions, etc.
    4. BORRADO EXPLÍCITO de tablas que NO cascaden (email_subscriptions
       con user_id NULL, user_preferences sin FK verificable).

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

  // 3. BORRADO EXPLÍCITO GDPR — tablas que pueden quedar huérfanas
  //    porque no tienen FK con ON DELETE CASCADE a auth.users
  const userEmail = user.email ?? "";

  // 3a. email_subscriptions: puede tener user_id NULL (suscripciones sin
  //     cuenta vinculada). El cascade no aplica → borramos por email.
  if (userEmail) {
    const { error: unsubErr } = await admin
      .from("email_subscriptions")
      .delete()
      .eq("email", userEmail);
    if (unsubErr) {
      console.warn("[account/delete] email_subscriptions cleanup:", unsubErr.message);
      // No bloqueante: logueamos y seguimos.
    }
  }

  // 3b. user_preferences: no tiene migración FK verificable en el repo.
  //     Borramos explícito por user_id para no dejar PII huérfana.
  const { error: prefErr } = await admin
    .from("user_preferences")
    .delete()
    .eq("user_id", user.id);
  if (prefErr) {
    console.warn("[account/delete] user_preferences cleanup:", prefErr.message);
  }

  // 4. Limpieza extra: borrar avatares del Storage (no cae por cascade)
  try {
    const { data: list } = await admin.storage.from("avatars").list(user.id);
    if (list && list.length > 0) {
      const paths = list.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("avatars").remove(paths);
    }
  } catch (err) {
    console.warn("[account/delete] avatar cleanup failed:", (err as Error).message);
  }

  // 5. Borra del auth.users (cascade limpia profiles, predictions, etc.)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete] deleteUser error:", error.message);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
